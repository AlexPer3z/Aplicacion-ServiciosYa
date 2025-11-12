import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import BotonVolver from "../components/BotonVolver";
import { supabase } from "../lib/supabase";
import * as Location from "expo-location";
import BotonSuscribirme from "../components/BotonSuscribirme";

// 📌 Detección del país por GPS
async function detectarPais(): Promise<string | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    console.log("📍 Ubicación:", location.coords);

    const geocode = await Location.reverseGeocodeAsync(location.coords);

    if (geocode.length > 0) {
      console.log("🌎 País detectado:", geocode[0].country, geocode[0].isoCountryCode);
      return geocode[0].isoCountryCode; // "BO", "AR", etc.
    }

    return null;
  } catch (err) {
    console.error("❌ Error detectando país:", err);
    return null;
  }
}


export default function PagoInicial() {
  const navigation = useNavigation();
  const [urlPago, setUrlPago] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pais, setPais] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string>("");

  // Detectar país al cargar
  useEffect(() => {
    detectarPais().then(setPais);
  }, []);

  // ✅ Validar si el usuario ya tiene el registro pagado
useEffect(() => {
  const verificarPago = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data: usuario, error } = await supabase
        .from("usuarios")
        .select("registropagado") // o "pago" si así se llama en tu tabla
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error al verificar pago:", error);
        return;
      }

      // Si ya pagó → redirige a Home
      if (usuario?.registropagado === true) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }
    } catch (err) {
      console.error("❌ Error al validar registro pagado:", err);
    }
  };

  verificarPago();

  // 👇 Se ejecuta cada vez que la pantalla vuelve al foco
  const unsubscribe = navigation.addListener("focus", verificarPago);
  return unsubscribe;
}, [navigation]);


  // Manejo de deep links
  useEffect(() => {
    const handleDeepLink = async ({ url }: { url: string }) => {
      if (url.includes("pago-exitoso")) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            Alert.alert("Error", "No se encontró usuario autenticado.");
            return;
          }

          // 👉 Ajustar créditos según si hay código o no
          const { data: usuario } = await supabase
            .from("usuarios")
            .select("creditos")
            .eq("id", user.id)
            .single();

          let nuevosCreditos = usuario?.creditos ?? 0;
          if (pais === "BO") {
            if (codigo.trim()) {
              // Tiene código → no cambia nada
              nuevosCreditos = nuevosCreditos + 0;
            } else {
              // No tiene código → resta -1
              nuevosCreditos = nuevosCreditos - 1;
            }
          }

          await supabase
            .from("usuarios")
            .update({
              pago: true,
              codigo: codigo.trim() || null,
              creditos: nuevosCreditos,
            })
            .eq("id", user.id);

          Alert.alert("Registro exitoso", "¡Bienvenido a ServiciosYa!");
          navigation.navigate("Home");
        } catch (err) {
          console.error("Error en pago-exitoso:", err);
        }
      } else if (url.includes("pago-fallido")) {
        Alert.alert("Pago fallido", "No se pudo completar el registro.");
      } else if (url.includes("pago-pendiente")) {
        Alert.alert("Pago pendiente", "Tu pago está siendo procesado.");
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      subscription.remove();
    };
  }, [codigo, pais]);

  const iniciarPago = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión para realizar el pago.");
        setLoading(false);
        return;
      }

      let endpoint = "";
      let body: any = {};

      if (pais === "BO") {
        endpoint = "https://backend-pagos.onrender.com/crear-pago-libelula";
        body = {
          descripcion: "Pago único de registro de cuenta",
          monto: 10, // en BOB
          userId: user.id,
          email: user.email,
        };
      } else {
        endpoint = "https://backend-pagos.onrender.com/crear-pago-registro";
        body = {
          descripcion: "Pago único de registro de cuenta",
          monto: 1500, // en ARS u otra moneda
          userId: user.id,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      console.log("🔗 Respuesta backend:", data);

      const url = data.url || data.url_pasarela_pagos || data.init_point;
      if (res.ok && url) {
        setUrlPago(url);
      } else {
        Alert.alert("Error", data.error || "No se pudo generar el link de pago.");
      }
    } catch (error) {
      console.error("❌ Error en iniciarPago:", error);
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (urlPago) {
      Linking.openURL(urlPago);
    }
  }, [urlPago]);

  return (
    <View
  style={[
    styles.container,
    { backgroundColor: pais === "BO" ? "#fff" : "#1f96a3" }, // 👈 cambio dinámico
  ]}
>

      <BotonVolver />
      <Text style={styles.mensajePrincipal}>
  Para completar tu registro necesitamos una verificación de pago de{" "}
  <Text style={{ fontWeight: "bold" }}>
    {pais === "BO" ? "10 Bs" : "$1.500"}

  </Text>.
</Text>
{pais === "AR" ? (
  <Image
    source={require("../assets/PasarelaPagos.png")}
    style={styles.fondoArgentina}
  />
) : (
  <Text style={styles.mensajeAclaracion}>
    Este es un pago único y exclusivo por el alta de tu cuenta.{"\n"}
    <Text style={{ fontWeight: "bold" }}>No volverás a pagar esto nunca más.</Text>
  </Text>
)}

      {/* 👉 Solo mostrar input de influencer en Bolivia */}
      {pais === "BO" && (
  <View style={{ flexDirection: "row", alignItems: "center", width: "100%" }}>
    <TextInput
      style={[styles.input, { flex: 1 }]}
      placeholder="Código de Referido (opcional)"
      value={codigo}
      onChangeText={setCodigo}
    />
    <TouchableOpacity
      style={{
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginLeft: 10,
        marginBottom: 22,
      }}
      onPress={async () => {
        const codigosValidos = [ "SY4003", "SY368", "SY6683", "SY7015", "SY7417", "SY5819",
          "SY9868", "SY9677", "SY6464", "SY8877", "SY1988", "SY2785", "SY8316",
          "SY688", "SY5242", "SY5552", "SY1334", "SY7656", "SY6176", "SY9905",
          "SY8948", "SY7361", "SY7594", "SY3284", "SY7165", "SY4842", "SY9784",
          "SY7764", "SY4198", "SY4490", "SY4543", "SY1538", "SY186", "SY1396",
          "SY8032", "SY7987", "SY9022", "SY483", "SY7102", "SY5107", "SY2831",
          "SY741", "SY5248", "SY1539", "SY961", "SY402", "SY4676", "SY5147",
          "SY468", "SY2784"
        ];

        if (!codigo.trim()) {
          Alert.alert("Atención", "Debes ingresar un código.");
          return;
        }

        if (!codigosValidos.includes(codigo.trim())) {
          Alert.alert("Código inválido", "El código ingresado no es válido.");
          return;
        }

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            Alert.alert("Error", "No se encontró usuario autenticado.");
            return;
          }

          await supabase
            .from("usuarios")
            .update({ codigo: codigo.trim() })
            .eq("id", user.id);

          Alert.alert("Éxito", "Código cargado correctamente.");
        } catch (err) {
          console.error("❌ Error al cargar código:", err);
          Alert.alert("Error", "No se pudo cargar el código.");
        }
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "bold" }}>Cargar</Text>
    </TouchableOpacity>
  </View>
)}


      {loading ? (
  <ActivityIndicator size="large" color="#FFA13C" />
) : (
  <>
    {pais === "BO" ? (
      <>
        <TouchableOpacity style={styles.botonPagoBolivia} onPress={iniciarPago}>
          <Text style={styles.textoBoton}>Pagar (10 Bs)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botonPago, { backgroundColor: "#999", marginTop: 15 }]}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.textoBoton}>Pagar más tarde</Text>
        </TouchableOpacity>
      </>
    ) : pais === "AR" ? (
  <>
    <TouchableOpacity
      style={[styles.botonPagoArgentina, { backgroundColor: "#FFA13C" }]}
      onPress={iniciarPago}
    >
      <Text style={styles.textoBoton}>Pagar ($1.500)</Text>
    </TouchableOpacity>

    {/* Botón de suscripción (usa su propia lógica interna) */}
    <BotonSuscribirme />
  </>
) : (
      <TouchableOpacity style={styles.botonPago} onPress={iniciarPago}>
        <Text style={styles.textoBoton}>Pagar registro</Text>
      </TouchableOpacity>
    )}
  </>
)}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: 30,
},


  mensajePrincipal: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 24,
    color: "#4A7C84",
    lineHeight: 28,
  },
  mensajeAclaracion: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 36,
    color: "#555",
    lineHeight: 22,
  },
  input: {
    width: "100%",
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  botonPago: {
    backgroundColor: "#FFA13C",
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 22,
    elevation: 5,
    shadowColor: "#FFA13C",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 2, // 🔼 muy importante: queda encima del fondo
  },
  textoBoton: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  fondoArgentina: {
  position: "absolute",
  top: 100,
  left: 0,
  right: 0,
  bottom: 0,
  width: "50vw",
  height: "75%",
  resizeMode: "cover", // o "contain" según tu imagen
  zIndex: 1,          // 🔽 muy importante: queda debajo de los botones
  opacity: 1,       // opcional: da efecto de fondo tenue
},
botonPagoArgentina: {
  backgroundColor: "#FFA13C", // Azul Mercado Pago
  paddingVertical: 16,
  paddingHorizontal: 36,
  borderRadius: 22,
  elevation: 5,
  shadowColor: "#FFA13C",
  shadowOpacity: 0.2,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  zIndex: 2,
  bottom: -180,
},

botonPagoBolivia: {
  backgroundColor: "#FFA13C", // Verde Libélula
  paddingVertical: 16,
  paddingHorizontal: 36,
  borderRadius: 22,
  elevation: 5,
  shadowColor: "#FFA13C",
  shadowOpacity: 0.2,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  zIndex: 2,
},

});
