import React, { useState, useEffect, useRef, useCallback  } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  AppState,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import ChatInputBar from "../components/chat/ChatInputBar";
import BotonVolver from "../components/BotonVolver";
import { withModalProvider } from "../components/sheet/withModalProvider";

function ChatIndividual({ route }) {
  const { chatId, nombre, servicio, usuarioId1, usuarioId2, servicioId } = route.params;

  const [mensajes, setMensajes] = useState([]);
  const [usuarioId, setUsuarioId] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [pagando, setPagando] = React.useState(false);
  const [servicioData, setServicioData] = useState(servicio || {});
  const pendingWspUnlock = useRef(false); // flag: usuario fue a pagar y vuelve
  const flatListRef = useRef(null);
  const messageChannelRef = useRef(null);

  // Detectar retorno desde MercadoPago con pago aprobado
  useEffect(() => {
    // Escuchar deep links cuando la app vuelve al frente
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (url && url.includes('status=approved') && pendingWspUnlock.current) {
        pendingWspUnlock.current = false;
        desbloquearWhatsApp();
      }
    });
    // Escuchar cuando la app vuelve al frente (usuario volvió del browser)
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && pendingWspUnlock.current) {
        // Revisar si hay un URL pendiente con pago aprobado
        Linking.getInitialURL().then(url => {
          if (url && url.includes('status=approved')) {
            pendingWspUnlock.current = false;
            desbloquearWhatsApp();
          }
        });
      }
    });
    return () => {
      linkSub.remove();
      appStateSub.remove();
    };
  }, []);

  // Si el servicio llegó vacío, buscarlo desde la BD usando el usuario partner
  useEffect(() => {
    if (servicio && servicio.titulo) return; // ya tiene datos
    const partnerId = usuarioId1 && usuarioId2
      ? (usuarioId1 !== usuarioId2 ? null : null) // se resuelve abajo
      : null;
    // Buscar el primer servicio del otro usuario del chat
    const fetchServicio = async () => {
      // Determinar quién es el partner (no el usuario actual)
      const { data: { user } } = await supabase.auth.getUser();
      const myId = user?.id;
      const workerId = usuarioId1 === myId ? usuarioId2 : usuarioId1;
      if (!workerId) return;
      const { data } = await supabase
        .from('servicios')
        .select('id, titulo, descripcion, categoria, horario, precio')
        .eq('usuario_id', workerId)
        .limit(1)
        .maybeSingle();
      if (data) setServicioData(data);
    };
    fetchServicio();
  }, []);

  // --- Cargar usuario y mensajes iniciales
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("No se pudo obtener el usuario:", error);
        return;
      }
      if (!isMounted) return;

      setUsuarioId(user.id);
      await cargarMensajes(user.id);
      suscribirRealtime(user.id);
    };

    init();

    return () => {
      isMounted = false;
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
        messageChannelRef.current = null;
      }
    };
  }, [chatId]);

  // --- Cargar mensajes de la BD
  const cargarMensajes = async (userId) => {
    try {
      // Primero obtenemos la fecha de borrado del chat para este usuario
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('borrado_por_usuario_1, borrado_por_usuario_2')
        .eq('id', chatId)
        .single();

      if (chatError || !chatData) {
        console.error("No se pudo obtener info del chat:", chatError?.message);
        return;
      }

      const fechaBorrado = userId === usuarioId1 
        ? chatData.borrado_por_usuario_1 
        : chatData.borrado_por_usuario_2;

      const { data, error } = await supabase
        .from("mensajes")
        .select("*")
        .eq("chat_id", chatId)
        .order("creado_en", { ascending: true });

      if (error) {
        console.error("Error al cargar mensajes:", error.message);
        return;
      }

      // Filtrar mensajes anteriores a la fecha de borrado
      const mensajesFiltrados = fechaBorrado 
        ? data.filter(m => new Date(m.creado_en) > new Date(fechaBorrado))
        : data;

      setMensajes(mensajesFiltrados);
      setLoadingMsg(false);
      marcarComoLeidos(mensajesFiltrados, userId);

      // scroll al final
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    } catch (e) {
      console.error("Error en cargarMensajes:", e);
    }
  };

  // --- Marcar mensajes no leídos como leídos
  const marcarComoLeidos = async (mensajesData, userId) => {
    const mensajesNoLeidos = mensajesData.filter(
      (msg) =>
        msg.remitente_id?.toString().trim() !== userId?.toString().trim() &&
        !msg.leido_por_receptor
    );
    if (mensajesNoLeidos.length > 0) {
      const ids = mensajesNoLeidos.map((msg) => msg.id);
      await supabase.from("mensajes").update({ leido_por_receptor: true }).in("id", ids);
    }
  };

  // --- Suscripción realtime solo para este chat
  const suscribirRealtime = (userId) => {
    const channel = supabase
      .channel(`mensajes:chat_${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const nuevo = payload.new;
          setMensajes((prev) => [...prev, nuevo]);
          // Si el mensaje no es mío, marcarlo como leído
          if (nuevo.remitente_id !== userId) {
            marcarComoLeidos([nuevo], userId);
             return;
          }
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    messageChannelRef.current = channel;
  };

  // --- Enviar mensaje y notificar
  const enviarMensaje = useCallback(async (mensaje) => {
    if (!mensaje.trim() || !usuarioId) return;

    const receptorId = usuarioId === usuarioId1 ? usuarioId2 : usuarioId1;

    const { error } = await supabase.from("mensajes").insert({
      chat_id: chatId,
      remitente_id: usuarioId,
      receptor_id: receptorId,
      contenido: mensaje.trim(),
      leido_por_emisor: true,
      leido_por_receptor: false,
    });

    if (!error) {
      enviarNotificacionPush(mensaje.trim(), receptorId);
    }
  }, [usuarioId, chatId, usuarioId1, usuarioId2]);

  const enviarNotificacionPush = async (mensaje, receptorId) => {
    try {
      const { data: receptorData, error } = await supabase
        .from("usuarios")
        .select("expo_token")
        .eq("id", receptorId)
        .single();

      if (error || !receptorData?.expo_token) return;

      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer HqAsPKHR0s-jilCTTYKwQhUhY5g57rnOlUYb_H6c`,
        },
        body: JSON.stringify({
          to: receptorData.expo_token,
          priority: "high",
          sound: "default",
          title: "Nuevo mensaje",
          body: mensaje,
          data: {
            screen: "ChatIndividual",
            params: { 
              chatId: chatId,
              nombre: nombre,
              servicio: servicio,
              usuarioId1: usuarioId1,
              usuarioId2: usuarioId2,
              servicioId: servicioId,
            }
          },
        }),
      });
    } catch (e) {
      console.error("Error al enviar notificación push:", e);
    }
  };

  // ---  Función para formatear la fecha con "Hoy", "Ayer" o DD/MM/YYYY 
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO); // UTC → local automáticamente
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    const mismaFecha = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (mismaFecha(fecha, hoy)) return "Hoy";
    if (mismaFecha(fecha, ayer)) return "Ayer";

    // Formato DD/MM/YYYY
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  };

  // ---  Genera la lista con "chips" de fecha
  const mensajesConFechas = () => {
    let resultado = [];
    let ultimaFecha = null;

    mensajes.forEach((msg) => {
      const fechaMsg = formatearFecha(msg.creado_en);
      if (fechaMsg !== ultimaFecha) {
        // Insertar chip de fecha
        resultado.push({ tipo: 'fecha', fecha: fechaMsg, id: `fecha-${fechaMsg}` });
        ultimaFecha = fechaMsg;
      }
      resultado.push({ ...msg, tipo: 'mensaje' });
    });

    return resultado;
  };

  const renderItem = ({ item }) => {
    if (item.tipo === 'fecha') {
      return (
        <View style={styles.fechaChipContainer}>
          <Text style={styles.fechaChipText}>{item.fecha}</Text>
        </View>
      );
    }

    const esMio = item.remitente_id === usuarioId;
    const esPresupuesto = typeof item.contenido === 'string' && item.contenido.startsWith('💰 Presupuesto:');
    const montoMatch = esPresupuesto && item.contenido.match(/\$([\d.,]+)/);
    const montoNumerico = montoMatch ? parseFloat(montoMatch[1].replace(/\./g, '').replace(',', '.')) : 0;

    return (
      <View
        style={[
          styles.mensajeContainer,
          esMio ? styles.mensajeDerecha : styles.mensajeIzquierda,
        ]}
      >
        <Text style={styles.textoMensaje}>{item.contenido}</Text>
        {esPresupuesto && !esMio && (
          <TouchableOpacity
            style={styles.pagarBtn}
            onPress={() => pagarPresupuesto(montoNumerico)}
            disabled={pagando}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={15} color="#fff" />
            <Text style={styles.pagarBtnText}>
              {pagando ? 'Procesando...' : `Pagar 15% para habilitar WhatsApp ($${Math.round(montoNumerico * 0.15).toLocaleString('es-AR')})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEstrellas = () => {
    return (
      <View style={styles.estrellasContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} onPress={() => setEstrellas(i)}>
            <Ionicons
              name={i <= estrellas ? "star" : "star-outline"}
              size={32}
              color="#f5c518"
              style={{ marginHorizontal: 5 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const desbloquearWhatsApp = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const myId = user?.id;
      const workerId = usuarioId1 === myId ? usuarioId2 : usuarioId1;
      const { data: workerData } = await supabase
        .from('usuarios')
        .select('celular, nombre')
        .eq('id', workerId)
        .single();
      const celular = workerData?.celular;
      if (celular) {
        const receptorId = myId === usuarioId1 ? usuarioId2 : usuarioId1;
        await supabase.from('mensajes').insert({
          chat_id: chatId,
          remitente_id: myId,
          receptor_id: receptorId,
          contenido: `✅ Pago aprobado. WhatsApp del profesional: 📱 ${celular}`,
          leido_por_emisor: true,
          leido_por_receptor: false,
        });
      } else {
        Alert.alert('Pago recibido', 'Tu pago fue aprobado. El profesional se comunicará contigo pronto.');
      }
    } catch (e) {
      Alert.alert('Pago aprobado', 'Tu pago fue aprobado. Contactá al profesional por el chat.');
    }
  }, [chatId, usuarioId1, usuarioId2]);

  const pagarPresupuesto = async (montoTotal) => {
    setPagando(true);
    try {
      const comision = Math.round(montoTotal * 0.15 * 100) / 100;
      const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer APP_USR-2906464672020891-031112-22f4fa494707febbc20d77650b33fa6e-183374120',
        },
        body: JSON.stringify({
          items: [{
            title: 'Habilitación WhatsApp - 15% del presupuesto',
            quantity: 1,
            unit_price: comision,
            currency_id: 'ARS',
          }],
          back_urls: {
            success: 'solucionesya://wsp-desbloqueado?status=approved',
            failure: 'solucionesya://wsp-desbloqueado?status=failure',
            pending: 'solucionesya://wsp-desbloqueado?status=pending',
          },
          auto_return: 'approved',
          external_reference: chatId,
        }),
      });
      const data = await res.json();
      if (data?.init_point) {
        pendingWspUnlock.current = true;
        Linking.openURL(data.init_point);
      } else {
        Alert.alert('Error', 'No se pudo generar el pago. Intentá de nuevo.');
      }
    } catch (e) {
      Alert.alert('Error', 'Falló la conexión con MercadoPago.');
    } finally {
      setPagando(false);
    }
  };

  return (
    <>
      <BotonVolver />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.titulo}>{nombre}</Text>
        </View>

        {loadingMsg ? (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="large" color="#FFA13C" />
            <Text style={styles.spinnerText}>Cargando mensajes...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={mensajesConFechas()}
            keyExtractor={(item, index) => item.id?.toString() ?? `fecha-${index}`}
            renderItem={renderItem}
            ListHeaderComponent={<ChatRules />}
            contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
            //onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            //onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {!loadingMsg && <ChatInputBar serviceId={servicioId} onSend={enviarMensaje} />}

        <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalFondo}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitulo}>Califica el servicio</Text>
              {renderEstrellas()}
              <TouchableOpacity style={[styles.botonModal, styles.botonDenunciar]} onPress={() => Alert.alert("Denunciado")}>
                <Text style={styles.textoBotonModal}>Denunciar servicio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.botonModal, styles.botonEnviarCalificacion]} onPress={() => Alert.alert("Calificación enviada")}>
                <Text style={styles.textoBotonModal}>Enviar calificación</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonCerrarModal} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </>
  );
}

export default withModalProvider(ChatIndividual);

function ChatRules() {
  const rules = [
    { icon: "🔢", text: "Está prohibido compartir números de teléfono, WhatsApp o cualquier dato de contacto en el chat." },
    { icon: "💰", text: "Para acordar un precio, usá el botón \"Enviar presupuesto\". El pago se gestiona dentro de la app." },
    { icon: "🤝", text: "Tratá con respeto a todos los usuarios. El lenguaje ofensivo puede resultar en una suspensión." },
    { icon: "🔒", text: "No compartas contraseñas, datos bancarios ni información personal sensible." },
    { icon: "⚠️", text: "Los acuerdos fuera de la plataforma no tienen cobertura ni garantía de TOORI ServiciosYa." },
  ];
  return (
    <View style={rulesStyles.container}>
      <View style={rulesStyles.header}>
        <Text style={rulesStyles.headerIcon}>🛡️</Text>
        <Text style={rulesStyles.headerTitle}>Reglas del chat</Text>
      </View>
      {rules.map((r, i) => (
        <View key={i} style={rulesStyles.row}>
          <Text style={rulesStyles.ruleIcon}>{r.icon}</Text>
          <Text style={rulesStyles.ruleText}>{r.text}</Text>
        </View>
      ))}
    </View>
  );
}

const rulesStyles = StyleSheet.create({
  container: {
    backgroundColor: "#f0fbfd",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#b2e4ee",
    padding: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  headerIcon: { fontSize: 17 },
  headerTitle: { fontSize: 14, fontWeight: "800", color: "#047a8f" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 7,
  },
  ruleIcon: { fontSize: 14, marginTop: 1 },
  ruleText: { flex: 1, fontSize: 12.5, color: "#445", lineHeight: 18 },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8FAF7", // Turquesa clarito
  },
  spinnerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#19D4C6", // Turquesa fuerte
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: "space-between",
    elevation: 6,
    shadowColor: "#19D4C6AA",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "left",
  },
  botonInfo: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: "#FFA13C",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 22,
    marginLeft: 10,
    elevation: 2,
  },
  textoBotonInfo:{
    color:"#fff",
    fontWeight:'bold'
  },
  // Burbujas de chat
  mensajeContainer: {
    maxWidth: "78%",
    padding: 13,
    borderRadius: 22,
    marginVertical: 7,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  mensajeDerecha: {
    alignSelf: "flex-end",
    backgroundColor: "#19D4C6",
  },
  mensajeIzquierda: {
    alignSelf: "flex-start",
    backgroundColor: "#FFA13C",
  },
  textoMensaje: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  pagarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    backgroundColor: "#25D366",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pagarBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    flexShrink: 1,
  },
  // MODAL
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(34, 34, 34, 0.32)",
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 25,
    padding: 26,
    alignItems: "center",
    position: "relative",
    shadowColor: "#19D4C6",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 18,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 14,
    color: "#19D4C6",
    textAlign: "center",
  },
  estrellasContainer: {
    flexDirection: "row",
    marginBottom: 18,
  },
  botonModal: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 28,
    alignItems: "center",
    marginVertical: 6,
  },
  botonDenunciar: {
    backgroundColor: "#E45757",
  },
  botonEnviarCalificacion: {
    backgroundColor: "#19D4C6",
  },
  textoBotonModal: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  botonCerrarModal: {
    position: "absolute",
    top: 10,
    right: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 3,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fechaChipContainer: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginVertical: 8,
    backgroundColor: '#E0F7FA', // color base del chip
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3, // para Android
    borderWidth: 1,
    borderColor: '#B2EBF2', // borde sutil
  },
  fechaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00796B',
    textAlign: 'center',
  },
});
