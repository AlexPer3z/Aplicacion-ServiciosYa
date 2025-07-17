import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import * as WebBrowser from "expo-web-browser";
import fondo from "../assets/fondo.png";
import logo from "../assets/logo.png";
import Icon from "react-native-vector-icons/MaterialIcons";
import { saveCredentials } from "../lib/storage";
import BotonVolver from "../components/BotonVolver";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../types/navigation";

WebBrowser.maybeCompleteAuthSession();

// Constantes
const STORAGE_KEY = "correosGuardados";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d+$/;

// Mensajes de error
const ERROR_MESSAGES = {
  PHONE_NOT_REGISTERED: "El número de celular no está registrado.",
  EMAIL_NOT_REGISTERED: "El correo electrónico no está registrado.",
  INVALID_FORMAT:
    "Por favor, ingrese un correo electrónico o número de celular válido.",
  INVALID_CREDENTIALS: "Contraseña incorrecta o error al iniciar sesión.",
  GENERAL_ERROR: "Ocurrió un error. Intente nuevamente.",
} as const;

// Funciones de utilidad
const validateEmail = (email: string): boolean => EMAIL_REGEX.test(email);
const isPhoneNumber = (value: string): boolean => PHONE_REGEX.test(value);

// Componentes
interface ErrorBoxProps {
  message: string;
}

const ErrorBox: React.FC<ErrorBoxProps> = ({ message }) => (
  <View style={styles.errorBox}>
    <Text style={styles.errorText}>{message}</Text>
  </View>
);

interface HelpTextProps {
  message: string;
  visible: boolean;
}

const HelpText: React.FC<HelpTextProps> = ({ message, visible }) => {
  if (!visible) return null;

  return (
    <View style={styles.helpTextContainer}>
      <Text style={styles.helpText}>{message}</Text>
    </View>
  );
};

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  showPassword,
  onTogglePassword,
}) => (
  <View style={styles.passwordContainer}>
    <TextInput
      placeholder="Contraseña"
      placeholderTextColor="#999"
      secureTextEntry={!showPassword}
      onChangeText={onChangeText}
      value={value}
      style={styles.passwordInput}
    />
    <TouchableOpacity
      style={styles.eyeButton}
      onPress={onTogglePassword}
      hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
    >
      <Icon
        name={showPassword ? "visibility-off" : "visibility"}
        size={25}
        color="#bbb"
      />
    </TouchableOpacity>
  </View>
);

// Componente principal
type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export default function Login({ navigation }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneHelp, setShowPhoneHelp] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Efecto de animación
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Cargar correos guardados
  useEffect(() => {
    const loadSavedEmails = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          setEmailSuggestions(JSON.parse(data));
        }
      } catch (error) {
        console.error("Error al cargar correos guardados:", error);
      }
    };
    loadSavedEmails();
  }, []);

  const saveEmail = async (email: string) => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const existingEmails = data ? JSON.parse(data) : [];

      if (!existingEmails.includes(email)) {
        const updatedEmails = [email, ...existingEmails];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEmails));
        setEmailSuggestions(updatedEmails);
      }
    } catch (error) {
      console.error("Error al guardar el correo:", error);
    }
  };

  const getEmailFromPhone = async (phone: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("email")
        .eq("celular", Number(phone))
        .single();

      if (error || !data) {
        return null;
      }
      return data.email;
    } catch (error) {
      console.error("Error al obtener el correo desde el teléfono:", error);
      return null;
    }
  };

  const validateEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", email)
        .single();

      return !!data;
    } catch (error) {
      console.error("Error al validar el correo:", error);
      return false;
    }
  };

  const handleLogin = async () => {
    if (isLoading) return;

    setErrorMessage("");
    setIsLoading(true);

    try {
      let emailToAuth = "";

      // Validar el formato del identificador y obtener el correo
      if (isPhoneNumber(identifier)) {
        const email = await getEmailFromPhone(identifier);
        if (!email) {
          setErrorMessage(ERROR_MESSAGES.PHONE_NOT_REGISTERED);
          return;
        }
        emailToAuth = email;
      } else if (validateEmail(identifier)) {
        const emailExists = await validateEmailExists(identifier);
        if (!emailExists) {
          setErrorMessage(ERROR_MESSAGES.EMAIL_NOT_REGISTERED);
          return;
        }
        emailToAuth = identifier;
      } else {
        setErrorMessage(ERROR_MESSAGES.INVALID_FORMAT);
        return;
      }

      // Intentar iniciar sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password,
      });

      if (error) {
        switch (error.code) {
          case "email_not_confirmed":
            navigation.replace("VerificacionPendiente");
            return;
          case "invalid_credentials":
            setErrorMessage(ERROR_MESSAGES.INVALID_CREDENTIALS);
            return;
          default:
            setErrorMessage(ERROR_MESSAGES.GENERAL_ERROR);
            return;
        }
      }

      // Guardar credenciales y correo si el inicio de sesión es exitoso
      if (data?.user) {
        await Promise.all([
          saveCredentials(emailToAuth, password),
          validateEmail(identifier) ? saveEmail(identifier) : Promise.resolve(),
        ]);
      }
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      setErrorMessage(ERROR_MESSAGES.GENERAL_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = identifier.trim() !== "" && password.trim() !== "";

  return (
    <ImageBackground
      source={fondo}
      style={styles.background}
      resizeMode="cover"
    >
      <BotonVolver />
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>Iniciar Sesión</Text>

        {errorMessage !== "" && <ErrorBox message={errorMessage} />}

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Correo Electrónico o Celular"
            placeholderTextColor="#999"
            onChangeText={(text) => {
              setIdentifier(text);
              // Show help text if user is typing numbers (likely a phone number)
              setShowPhoneHelp(isPhoneNumber(text) && text.length > 0);
            }}
            value={identifier}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="default"
            editable={!isLoading}
          />

          <HelpText
            message="Ingrese solo números sin espacios ni guiones, usa el formato internacional (ej: 5491123456789)"
            visible={showPhoneHelp}
          />

          <PasswordInput
            value={password}
            onChangeText={setPassword}
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.loginButton,
            (!isFormValid || isLoading) && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={!isFormValid || isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? "Ingresando..." : "Ingresar"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#E8FAF7",
  },
  container: {
    width: "88%",
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    alignItems: "center",
    elevation: 9,
    shadowColor: "#19D4C6",
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 22,
    alignSelf: "center",
    borderRadius: 45,
    borderColor: "#19D4C6",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#19D4C6",
    marginBottom: 28,
    textAlign: "center",
    letterSpacing: 1,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
  },
  helpTextContainer: {
    backgroundColor: "#E3F2FD",
    padding: 8,
    borderRadius: 6,
    marginTop: -15,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  helpText: {
    color: "#1976D2",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "left",
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
    marginBottom: 20,
  },
  passwordInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    paddingRight: 38,
  },
  eyeButton: {
    position: "absolute",
    right: 0,
    top: 6,
    height: 32,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: "#00bfa6",
    paddingVertical: 15,
    borderRadius: 30,
    marginBottom: 20,
    alignItems: "center",
    width: "100%",
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: "#ccc",
    elevation: 2,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  errorBox: {
    backgroundColor: "#FBE9E7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FF7043",
    width: "100%",
    shadowColor: "#FF7043",
    shadowOpacity: 0.13,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  errorText: {
    color: "#FF7043",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
});
