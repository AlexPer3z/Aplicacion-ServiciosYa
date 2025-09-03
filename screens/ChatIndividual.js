import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView
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
  const [modalInfoVisible, setModalInfoVisible] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const flatListRef = useRef(null);
  const messageChannelRef = useRef(null);

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
          }
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();

    messageChannelRef.current = channel;
  };

  // --- Enviar mensaje y notificar
  const enviarMensaje = async (mensaje) => {
    if (!mensaje.trim() || !usuarioId) return;
    try {
      const receptorId = usuarioId === usuarioId1 ? usuarioId2 : usuarioId1;
      const { error } = await supabase.from("mensajes").insert({
        chat_id: chatId,
        remitente_id: usuarioId,
        receptor_id: receptorId,
        contenido: mensaje.trim(),
        leido_por_emisor: true,
        leido_por_receptor: false,
      });
      if (error) console.error("Error al enviar mensaje:", error.message);
      else {
        await enviarNotificacionPush(mensaje.trim(), receptorId);
      }
    } catch (e) {
      console.error("Error en enviarMensaje:", e);
    }
  };

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
          data: JSON.stringify({
            screen: "ChatIndividual",
            params: { 
              "chatId": chatId,
              "nombre": nombre,
              "servicio": servicio,
              "usuarioId1": usuarioId1,
              "usuarioId2": usuarioId2,
              "servicioId": servicioId,
            }
          }),
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
    return (
      <View
        style={[
          styles.mensajeContainer,
          esMio ? styles.mensajeDerecha : styles.mensajeIzquierda,
        ]}
      >
        <Text style={styles.textoMensaje}>{item.contenido}</Text>
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

  return (
    <>
      <BotonVolver />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.titulo}>{nombre}</Text>
          <TouchableOpacity style={styles.botonInfo} onPress={() => setModalInfoVisible(true)}>
            <Ionicons name="information-circle-outline" size={20} color="#fff" style={{marginRight: 5}} />
            <Text style={styles.textoBotonInfo}>Info</Text>
          </TouchableOpacity>
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
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 10 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
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

        <Modal animationType="fade" transparent visible={modalInfoVisible} onRequestClose={() => setModalInfoVisible(false)}>
            <SafeAreaView style={styles.modalOverlay}>
              <View style={styles.modalContainerM}>
                <View style={styles.headerM}>
                  <Text style={styles.title}>Información del Servicio</Text>
                  <TouchableOpacity onPress={() => setModalInfoVisible(false)} style={styles.cerrarBtn}>
                    <Text style={styles.cerrarTexto}>Cerrar</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.contentContainer}>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Título:</Text>
                    <Text style={styles.value}>{servicio?.titulo || 'No disponible'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Categoría:</Text>
                    <Text style={styles.value}>{servicio?.categoria || 'No disponible'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Horario:</Text>
                    <Text style={styles.value}>{servicio?.horario || 'No disponible'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Descripción:</Text>
                    <Text style={[styles.value, styles.descriptionText]}>{servicio?.descripcion || 'No disponible'}</Text>
                  </View>
                </ScrollView>

                 {/* Botón Calificar servicio */}
                <TouchableOpacity
                  style={styles.botonCalificar}
                  onPress={() => {
                    setModalInfoVisible(false);
                    setModalVisible(true);
                  }}
                >
                  <Ionicons name="star-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.textoBotonCalificar}>Calificar servicio</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Modal>

      </KeyboardAvoidingView>
    </>
  );
}

export default withModalProvider(ChatIndividual);

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
  modalContainerM: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    paddingBottom: 20,
  },
  headerM: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#00B8A9',
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  cerrarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cerrarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
 
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10, 
  },
  infoRow: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  descriptionText: {
    lineHeight: 22,
  },
  calificarBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  calificarTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonCalificar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFA13C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center', 
  },

  textoBotonCalificar: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
