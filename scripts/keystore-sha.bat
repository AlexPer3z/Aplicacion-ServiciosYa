@echo off
setlocal

REM Ruta del archivo keystore de debug de Android
set "KEYSTORE_PATH=..\android\app\debug.keystore"
REM Alias por defecto del keystore de debug
set "KEY_ALIAS=androiddebugkey"
:: set "OPENSSL_BIN=.\openssl\bin\openssl.exe"
REM Comando de OpenSSL (puede ser ruta local o global)
set "OPENSSL_BIN=openssl"

REM Este comando genera la huella SHA-1 del keystore de debug.
REM Es necesaria, por ejemplo, para configurar el inicio de sesión con Facebook (Facebook Login)
REM u otros servicios que requieren la huella digital de la app para autenticación.
REM La clave por defecto del keystore de expo es "android"
keytool -exportcert -alias %KEY_ALIAS% -keystore %KEYSTORE_PATH% | %OPENSSL_BIN% sha1 -binary | %OPENSSL_BIN% base64

pause