
// useAuthSession.js
import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../supabase';

// Constantes para almacenamiento seguro
const STORAGE_KEYS = {
    SESSION: 'supabase_session',
    LAST_LOGIN: 'last_login_method',
    CREDENTIALS: 'supabase_credentials',
    BIOMETRIC_AUTH: 'last_biometric_auth',
};

// Configuración
const CONFIG = {
    BIOMETRIC_COOLDOWN: 10 * 1000, // 10 segundos
    SESSION_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos en ms
    MIN_REFRESH_DELAY: 1000, // 1 segundo mínimo
};

// Tipos JSDoc
/**
 * @typedef {'email' | 'phone' | 'biometric' | 'none'} LoginMethod
 * @typedef {'idle' | 'authenticating' | 'authenticated' | 'error'} AuthState
 * @typedef {import('@supabase/supabase-js').Session} Session
 * @typedef {import('@supabase/supabase-js').AuthError} AuthError
 * @typedef {import('expo-local-authentication').AuthenticationType} BiometricType
 */

/**
 * @typedef {Object} AuthCredentials
 * @property {string} email - Email del usuario
 * @property {string} password - Contraseña del usuario
 */

/**
 * @typedef {Object} BiometricCheckResult
 * @property {boolean} available - Si la biometría está disponible
 * @property {BiometricType | null} type - Tipo de biometría disponible
 * @property {string} [error] - Mensaje de error si no está disponible
 */

/**
 * @typedef {Object} AuthHookOptions
 * @property {function(Error): void} [onError] - Callback para errores generales
 * @property {function(Session): void} [onAuthSuccess] - Callback para autenticación exitosa
 * @property {function(Error): void} [onAuthError] - Callback para errores de autenticación
 * @property {function(Session): void} [onBiometricSuccess] - Callback para éxito biométrico
 */

/**
 * @typedef {Object} AuthHookReturn
 * @property {Session | null} session - Sesión actual del usuario
 * @property {AuthState} authState - Estado actual de autenticación
 * @property {LoginMethod} loginMethod - Último método de login utilizado
 * @property {BiometricType | null} biometricType - Tipo de biometría disponible
 * @property {string | null} error - Último error ocurrido
 * @property {function(string, string): Promise<boolean>} emailLogin - Función para login con email
 * @property {function(): Promise<Session | null>} biometricLogin - Función para login biométrico
 * @property {function(LoginMethod): Promise<void>} rememberLoginMethod - Recordar método de login
 * @property {function(): Promise<void>} logout - Función para cerrar sesión
 * @property {function(): Promise<void>} clearError - Función para limpiar errores
 * @property {function(): Promise<BiometricCheckResult>} checkBiometrics - Verificar capacidades biométricas
 * @property {boolean} isAuthenticated - Si el usuario está autenticado
 * @property {boolean} isBiometricAvailable - Si la biometría está disponible
 * @property {boolean} isLoading - Si está en proceso de autenticación
 * @property {boolean} hasStoredCredentials - Si hay credenciales guardadas
 */

/**
 * Hook personalizado para manejar la autenticación con Supabase
 * Incluye soporte para autenticación biométrica y manejo seguro de sesiones
 * 
 * @param {AuthHookOptions} [options={}] - Opciones de configuración del hook
 * @returns {AuthHookReturn} Objeto con estado y funciones de autenticación
 * 
 * @example
 * ```javascript
 * const {
 *   session,
 *   authState,
 *   error,
 *   emailLogin,
 *   biometricLogin,
 *   logout,
 *   isAuthenticated,
 *   isBiometricAvailable
 * } = useAuthSession({
 *   onAuthSuccess: (session) => console.log('Usuario autenticado', session.user),
 *   onError: (error) => console.error('Error de autenticación', error),
 * });
 * ```
 */
export default function useAuthSession(options = {}) {
    const {
        onError,
        onAuthSuccess,
        onAuthError,
        onBiometricSuccess,
    } = options;

    // Estados principales
    /** @type {[Session | null, function]} */
    const [session, setSession] = useState(null);

    /** @type {[AuthState, function]} */
    const [authState, setAuthState] = useState('idle');

    /** @type {[LoginMethod, function]} */
    const [loginMethod, setLoginMethod] = useState('none');

    /** @type {[string | null, function]} */
    const [error, setError] = useState(null);

    /** @type {[BiometricType | null, function]} */
    const [biometricType, setBiometricType] = useState(null);

    /** @type {[boolean, function]} */
    const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

    /**
     * Limpia el estado de error
     */
    const clearError = useCallback(async () => {
        setError(null);
        if (authState === 'error') {
            setAuthState('idle');
        }
    }, [authState]);

    /**
     * Maneja errores de forma centralizada
     * @param {Error | AuthError | string} err - Error a manejar
     * @param {string} fallbackMessage - Mensaje por defecto si no hay mensaje en el error
     * @param {boolean} [setErrorState=true] - Si debe cambiar el estado a 'error'
     */
    const handleError = useCallback((err, fallbackMessage, setErrorState = true) => {
        const errorMessage = typeof err === 'string' ? err : (err?.message || fallbackMessage);

        console.error('[useAuthSession] Error:', errorMessage, err);

        setError(errorMessage);
        if (setErrorState) {
            setAuthState('error');
        }

        // Notificar callbacks apropiados
        if (onError) {
            try {
                onError(typeof err === 'string' ? new Error(err) : err);
            } catch (callbackError) {
                console.error('[useAuthSession] Error en callback onError:', callbackError);
            }
        }
    }, [onError]);

    /**
     * Guarda credenciales de forma segura
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @returns {Promise<boolean>} true si se guardaron correctamente
     */
    const saveCredentials = useCallback(async (email, password) => {
        try {
            if (!email || !password) {
                throw new Error('Email y contraseña son requeridos');
            }

            const credentials = JSON.stringify({ email, password });
            await SecureStore.setItemAsync(STORAGE_KEYS.CREDENTIALS, credentials);
            setHasStoredCredentials(true);
            return true;
        } catch (err) {
            handleError(err, 'Error al guardar credenciales', false);
            return false;
        }
    }, [handleError]);

    /**
     * Obtiene credenciales guardadas
     * @returns {Promise<AuthCredentials | null>} Credenciales o null si no existen
     */
    const getCredentials = useCallback(async () => {
        try {
            const credentialsString = await SecureStore.getItemAsync(STORAGE_KEYS.CREDENTIALS);
            if (!credentialsString) {
                setHasStoredCredentials(false);
                return null;
            }

            const credentials = JSON.parse(credentialsString);
            if (!credentials.email || !credentials.password) {
                throw new Error('Credenciales inválidas');
            }

            setHasStoredCredentials(true);
            return credentials;
        } catch (err) {
            setHasStoredCredentials(false);
            handleError(err, 'Error al obtener credenciales', false);
            return null;
        }
    }, [handleError]);

    /**
     * Elimina credenciales guardadas
     * @returns {Promise<boolean>} true si se eliminaron correctamente
     */
    const clearCredentials = useCallback(async () => {
        try {
            await SecureStore.deleteItemAsync(STORAGE_KEYS.CREDENTIALS);
            setHasStoredCredentials(false);
            return true;
        } catch (err) {
            handleError(err, 'Error al eliminar credenciales', false);
            return false;
        }
    }, [handleError]);

    /**
     * Verifica las capacidades biométricas del dispositivo
     * @returns {Promise<BiometricCheckResult>} Resultado de la verificación
     */
    const checkBiometrics = useCallback(async () => {
        try {
            // Verificar si el hardware soporta biometría
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                setBiometricType(null);
                return {
                    available: false,
                    type: null,
                    error: 'El dispositivo no tiene hardware biométrico'
                };
            }

            // Verificar si hay biometría registrada
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) {
                setBiometricType(null);
                return {
                    available: false,
                    type: null,
                    error: 'No hay biometría registrada en el dispositivo'
                };
            }

            // Obtener tipos soportados
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
            if (!supportedTypes || supportedTypes.length === 0) {
                setBiometricType(null);
                return {
                    available: false,
                    type: null,
                    error: 'No hay tipos de autenticación biométrica disponibles'
                };
            }

            const primaryType = supportedTypes[0];
            setBiometricType(primaryType);

            return {
                available: true,
                type: primaryType
            };
        } catch (err) {
            setBiometricType(null);
            handleError(err, 'Error al verificar capacidades biométricas', false);
            return {
                available: false,
                type: null,
                error: err.message || 'Error desconocido al verificar biometría'
            };
        }
    }, [handleError]);

    /**
     * Guarda la sesión de forma segura
     * @param {Session} sessionData - Datos de sesión de Supabase
     * @returns {Promise<boolean>} true si se guardó correctamente
     */
    const saveSession = useCallback(async (sessionData) => {
        try {
            if (!sessionData) {
                throw new Error('Datos de sesión inválidos');
            }

            await SecureStore.setItemAsync(STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
            setSession(sessionData);
            setAuthState('authenticated');

            // Notificar éxito
            if (onAuthSuccess) {
                try {
                    onAuthSuccess(sessionData);
                } catch (callbackError) {
                    console.error('[useAuthSession] Error en callback onAuthSuccess:', callbackError);
                }
            }

            return true;
        } catch (err) {
            handleError(err, 'Error al guardar la sesión');
            return false;
        }
    }, [handleError, onAuthSuccess]);

    /**
     * Recupera la sesión guardada
     * @returns {Promise<Session | null>} Sesión guardada o null
     */
    const getSession = useCallback(async () => {
        try {
            const sessionString = await SecureStore.getItemAsync(STORAGE_KEYS.SESSION);
            if (!sessionString) {
                return null;
            }

            const sessionData = JSON.parse(sessionString);

            // Validar que la sesión no haya expirado
            if (sessionData.expires_at && sessionData.expires_at * 1000 < Date.now()) {
                await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION);
                return null;
            }

            return sessionData;
        } catch (err) {
            handleError(err, 'Error al recuperar la sesión', false);
            return null;
        }
    }, [handleError]);

    /**
     * Recuerda el último método de inicio de sesión
     * @param {LoginMethod} method - Método de login a recordar
     */
    const rememberLoginMethod = useCallback(async (method) => {
        try {
            await SecureStore.setItemAsync(STORAGE_KEYS.LAST_LOGIN, method);
            setLoginMethod(method);
        } catch (err) {
            handleError(err, 'Error al guardar el método de inicio de sesión', false);
        }
    }, [handleError]);


    /**
     * Realiza el inicio de sesión con email y contraseña
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña del usuario
     * @param {boolean} [exception=false] - Si debe lanzar la excepción en vez de manejarla internamente
     * @returns {Promise<{ data: any, error: any }>} Respuesta de Supabase
     */
    const emailLogin = useCallback(async (email, password, exception = false) => {
        let data = null;
        let error = null;

        if (!email || !password) {
            error = 'Email y contraseña son requeridos';
            if (exception) {
                throw new Error(error);
            }
            return { data, error };
        }

        setAuthState('authenticating');
        setError(null);

        try {
            const response = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password
            });
            data = response.data;
            error = response.error;

            if (error) {
                throw error;
            }

            if (!data?.session || !data?.user) {
                throw new Error('No se recibió información de sesión válida');
            }

            // Verificar si el email está confirmado
            if (!data.user.email_confirmed_at) {
                throw new Error('Tu correo electrónico no ha sido confirmado. Por favor revisa tu bandeja de entrada.');
            }

            // Guardar sesión y credenciales
            const sessionSaved = await saveSession(data.session);
            if (!sessionSaved) {
                throw new Error('Error al guardar la sesión');
            }

            await saveCredentials(email, password);
            await rememberLoginMethod('email');

        } catch (err) {
            let errorMessage = 'Error desconocido al iniciar sesión';

            if (err.message?.includes('Invalid login credentials')) {
                errorMessage = 'Credenciales inválidas. Verifica tu email y contraseña.';
            } else if (err.message?.includes('Email not confirmed')) {
                errorMessage = 'Tu correo electrónico no ha sido confirmado.';
            } else if (err.message?.includes('Too many requests')) {
                errorMessage = 'Demasiados intentos. Espera un momento antes de intentar nuevamente.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            error = error || err;

            if (exception) {
                handleError(err, errorMessage);
                if (onAuthError) {
                    try {
                        onAuthError(err);
                    } catch (callbackError) {
                        console.error('[useAuthSession] Error en callback onAuthError:', callbackError);
                    }
                }
                throw err;
            }
        }

        return { data, error };
    }, [saveSession, saveCredentials, rememberLoginMethod, handleError, onAuthError]);

    /**
     * Realiza el inicio de sesión biométrico
     * @returns {Promise<Session | null>} Sesión si el login fue exitoso, null si falló
     */
    const biometricLogin = useCallback(async () => {
        setAuthState('authenticating');
        setError(null);

        try {
            // Verificar disponibilidad biométrica
            const biometricCheck = await checkBiometrics();
            if (!biometricCheck.available) {
                throw new Error(biometricCheck.error || 'La biometría no está disponible');
            }

            // Obtener credenciales guardadas
            const credentials = await getCredentials();
            if (!credentials) {
                throw new Error('No hay credenciales guardadas. Inicia sesión con email primero.');
            }

            // Realizar autenticación biométrica
            const authResult = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Autentícate para acceder a tu cuenta',
                subtitleMessage: 'Usa tu huella dactilar o Face ID',
                fallbackLabel: 'Usar código',
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
            });

            if (!authResult.success) {
                if (authResult.error === 'UserCancel') {
                    throw new Error('Autenticación cancelada por el usuario');
                } else if (authResult.error === 'UserFallback') {
                    throw new Error('El usuario eligió usar el código de respaldo');
                } else {
                    throw new Error(authResult.error || 'La autenticación biométrica falló');
                }
            }

            // Realizar login con credenciales guardadas
            const { data, error: loginError } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (loginError) {
                throw loginError;
            }

            if (!data?.session || !data?.user) {
                throw new Error('No se pudo iniciar sesión con las credenciales guardadas');
            }

            if (!data.user.email_confirmed_at) {
                throw new Error('Tu correo electrónico no ha sido confirmado');
            }

            // Guardar sesión y actualizar estado
            const sessionSaved = await saveSession(data.session);
            if (!sessionSaved) {
                throw new Error('Error al guardar la sesión después del login biométrico');
            }

            await rememberLoginMethod('biometric');

            // Guardar timestamp de última autenticación biométrica
            try {
                await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_AUTH, Date.now().toString());
            } catch (timestampError) {
                console.warn('[useAuthSession] No se pudo guardar timestamp biométrico:', timestampError);
            }

            // Notificar éxito biométrico
            if (onBiometricSuccess) {
                try {
                    onBiometricSuccess(data.session);
                } catch (callbackError) {
                    console.error('[useAuthSession] Error en callback onBiometricSuccess:', callbackError);
                }
            }

            return data.session;
        } catch (err) {
            let errorMessage = 'Error en la autenticación biométrica';

            if (err.message?.includes('cancelada')) {
                errorMessage = 'Autenticación cancelada';
            } else if (err.message?.includes('credenciales guardadas')) {
                errorMessage = 'Credenciales no válidas. Inicia sesión con email nuevamente.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            handleError(err, errorMessage);

            if (onAuthError) {
                try {
                    onAuthError(err);
                } catch (callbackError) {
                    console.error('[useAuthSession] Error en callback onAuthError:', callbackError);
                }
            }

            return null;
        }
    }, [checkBiometrics, getCredentials, saveSession, rememberLoginMethod, handleError, onBiometricSuccess, onAuthError]);

    /**
     * Cierra la sesión del usuario
     * @returns {Promise<boolean>} true si el logout fue exitoso
     */
    const logout = useCallback(async () => {
        try {
            // Cerrar sesión en Supabase
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) {
                console.warn('[useAuthSession] Error al cerrar sesión en Supabase:', signOutError.message);
            }
        } catch (err) {
            console.warn('[useAuthSession] Excepción al cerrar sesión en Supabase:', err);
        }

        // Limpiar estado local
        setAuthState('idle');
        setSession(null);
        setLoginMethod('none');
        setError(null);

        // Limpiar almacenamiento seguro
        const cleanupTasks = [
            SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION),
            SecureStore.deleteItemAsync(STORAGE_KEYS.LAST_LOGIN),
            SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_AUTH),
            clearCredentials(),
        ];

        try {
            await Promise.allSettled(cleanupTasks);
            return true;
        } catch (err) {
            console.warn('[useAuthSession] Error durante la limpieza del logout:', err);
            return false;
        }
    }, [clearCredentials]);

    /**
     * Inicializa el estado de autenticación al montar el componente
     */
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Verificar biometría disponible
                await checkBiometrics();

                // Obtener método de login guardado
                let savedLoginMethod = 'none';
                try {
                    const lastMethod = await SecureStore.getItemAsync(STORAGE_KEYS.LAST_LOGIN);
                    if (lastMethod) {
                        savedLoginMethod = lastMethod;
                    }
                } catch (err) {
                    console.warn('[useAuthSession] Error al obtener método de login guardado:', err);
                }

                // Verificar credenciales guardadas
                await getCredentials();

                // Obtener sesión guardada
                const savedSession = await getSession();

                if (savedSession) {
                    // Validar sesión con Supabase
                    try {
                        const { data, error } = await supabase.auth.getSession();
                        if (error || !data.session) {
                            // Sesión inválida, limpiar
                            await SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION);
                            setAuthState('idle');
                        } else {
                            // Sesión válida
                            setSession(data.session);
                            setLoginMethod(savedLoginMethod);
                            setAuthState('authenticated');
                        }
                    } catch (err) {
                        console.warn('[useAuthSession] Error al validar sesión:', err);
                        setAuthState('idle');
                    }
                } else {
                    setAuthState('idle');
                }
            } catch (err) {
                console.error('[useAuthSession] Error durante inicialización:', err);
                setAuthState('error');
                setError('Error al inicializar la autenticación');
            }
        };

        initializeAuth();
    }, [checkBiometrics, getCredentials, getSession]);

    /**
     * Maneja el refresco automático de sesiones y cambios de estado de auth
     */
    useEffect(() => {
        if (!session) return;

        // Suscribirse a cambios de estado de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                try {
                    switch (event) {
                        case 'TOKEN_REFRESHED':
                            if (newSession) {
                                console.log('[useAuthSession] Token refrescado automáticamente');
                                await saveSession(newSession);
                            }
                            break;

                        case 'SIGNED_OUT':
                            console.log('[useAuthSession] Sesión cerrada externamente');
                            setAuthState('idle');
                            setSession(null);
                            setLoginMethod('none');
                            setError(null);

                            // Limpiar almacenamiento
                            try {
                                await Promise.allSettled([
                                    SecureStore.deleteItemAsync(STORAGE_KEYS.SESSION),
                                    SecureStore.deleteItemAsync(STORAGE_KEYS.LAST_LOGIN),
                                    SecureStore.deleteItemAsync(STORAGE_KEYS.BIOMETRIC_AUTH),
                                ]);
                            } catch (cleanupError) {
                                console.warn('[useAuthSession] Error en limpieza automática:', cleanupError);
                            }
                            break;

                        case 'SIGNED_IN':
                            if (newSession && newSession !== session) {
                                console.log('[useAuthSession] Nueva sesión detectada');
                                await saveSession(newSession);
                            }
                            break;
                    }
                } catch (err) {
                    console.error('[useAuthSession] Error manejando cambio de estado:', err);
                }
            }
        );

        // Configurar refresco manual como respaldo
        let refreshTimer;

        if (session.expires_at) {
            const expirationTime = session.expires_at * 1000;
            const timeUntilExpiry = expirationTime - Date.now();
            const refreshDelay = Math.max(
                timeUntilExpiry - CONFIG.SESSION_REFRESH_THRESHOLD,
                CONFIG.MIN_REFRESH_DELAY
            );

            if (timeUntilExpiry > CONFIG.SESSION_REFRESH_THRESHOLD) {
                refreshTimer = setTimeout(async () => {
                    try {
                        console.log('[useAuthSession] Iniciando refresco manual de sesión');
                        const { data, error: refreshError } = await supabase.auth.refreshSession();

                        if (refreshError) {
                            console.error('[useAuthSession] Error en refresco manual:', refreshError.message);
                            handleError(refreshError, 'Error al refrescar la sesión', false);
                        } else if (data?.session) {
                            console.log('[useAuthSession] Sesión refrescada manualmente');
                            await saveSession(data.session);
                        }
                    } catch (err) {
                        console.error('[useAuthSession] Excepción durante refresco manual:', err);
                        handleError(err, 'Error durante el refresco de sesión', false);
                    }
                }, refreshDelay);
            }
        }

        // Cleanup
        return () => {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [session, saveSession, handleError]);

    // Retornar API del hook
    return {
        // Estado
        session,
        authState,
        loginMethod,
        biometricType,
        error,
        hasStoredCredentials,

        // Funciones principales
        emailLogin,
        biometricLogin,
        logout,
        clearError,

        // Funciones auxiliares
        rememberLoginMethod,
        checkBiometrics,

        // Estados derivados
        isAuthenticated: authState === 'authenticated',
        isBiometricAvailable: biometricType !== null,
        isLoading: authState === 'authenticating',
    };
}