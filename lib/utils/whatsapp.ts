// whatsapp.ts
import { Platform, Alert } from "react-native";
import * as Linking from "expo-linking";

/**
 * Limpia y formatea un número de teléfono para WhatsApp
 * @param phone - Cadena de número de teléfono
 * @returns Número de teléfono formateado con código de país
 */
export const cleanPhoneNumber = (phone: string): string => {
  // Eliminar todos los caracteres no numéricos excepto '+'
  let cleaned = phone.replace(/[^\d+]/g, "");
  // Añadir prefijo '+' si falta
  if (!cleaned.startsWith("+")) {
    // Si comienza con '00' (prefijo internacional común), reemplazar con '+'
    if (cleaned.startsWith("00")) {
      cleaned = `+${cleaned.substring(2)}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }
  return cleaned;
};

/**
 * Generar URL de enlace profundo de WhatsApp
 * @param phone - Número de teléfono (cualquier formato)
 * @param message - Mensaje predefinido opcional
 * @returns URL de enlace profundo de WhatsApp
 */
export const generateWhatsAppUrl = (
  phone: string,
  message?: string,
): string => {
  const cleanedPhone = cleanPhoneNumber(phone);
  const encodedPhone = encodeURIComponent(cleanedPhone);
  let url = `whatsapp://send?phone=${encodedPhone}`;
  if (message) {
    const encodedMessage = encodeURIComponent(message);
    url += `&text=${encodedMessage}`;
  }
  return url;
};

/**
 * Verificar si WhatsApp está instalado en el dispositivo
 * @returns Promesa que se resuelve en booleano
 */
export const isWhatsAppInstalled = async (): Promise<boolean> => {
  const url = generateWhatsAppUrl("0000000000"); // Número ficticio
  return Linking.canOpenURL("whatsapp://send");
};

/**
 * Abrir la página de la tienda de WhatsApp para la instalación
 */
export const openWhatsAppStore = async (): Promise<void> => {
  const storeUrl = Platform.select({
    ios: "itms-apps://apps.apple.com/app/id310633997",
    android: "market://details?id=com.whatsapp",
    default: "https://whatsapp.com/download",
  }) as string;
  await Linking.openURL(storeUrl);
};

/**
 * Abrir chat de WhatsApp con un número de teléfono
 * @param phone - Número de teléfono para chatear
 * @param message - Mensaje predefinido opcional
 * @param options - Opciones de configuración
 */
export const openWhatsApp = async (
  phone: string,
  message?: string,
  options: {
    showAlerts?: boolean;
    installFallback?: boolean;
  } = { showAlerts: true, installFallback: true },
): Promise<void> => {
  const url = generateWhatsAppUrl(phone, message);
  try {
    const canOpen = true;
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      if (options.showAlerts) {
        Alert.alert(
          "WhatsApp no instalado",
          "¿Te gustaría instalar WhatsApp?",
          [
            {
              text: "Cancelar",
              style: "cancel",
            },
            {
              text: "Instalar",
              onPress: () => {
                if (options.installFallback) {
                  openWhatsAppStore();
                }
              },
            },
          ],
        );
      } else if (options.installFallback) {
        await openWhatsAppStore();
      }
    }
  } catch (error) {
    if (options.showAlerts) {
      Alert.alert(
        "Error",
        `No se pudo abrir WhatsApp: ${(error as Error).message}`,
      );
    }
    throw error;
  }
};

// Opcional: Utilidad para crear enlace de contacto
export const createContactLink = (phone: string): string => {
  const cleanedPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${cleanedPhone}`;
};
