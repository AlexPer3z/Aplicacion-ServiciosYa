import React, { useState } from "react";
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  FlatList,
} from "react-native";
import { supabase } from "../lib/supabase";
import NavInferior from "../components/NavInferior";
import { Ionicons } from "@expo/vector-icons";
import ReportServiceModal from "../components/servicios/ReporteModal";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";
import { useServicesByCategory } from "../lib/hooks/useServices";
import type { Servicio } from "../types/servicios";
import { useUser } from "../lib/hooks/useUser";
import LoadingView from "../components/LoadingView";
import showToast from "../lib/toast";
import { withSuspense } from "../components/withSuspense";
import ServicioItem from "../components/servicios/ServicioItem";
import EmptyListComponent from "../components/EmptyListComponent";
import BottomNavBar from "../components/home/BottomNavBar";

const screenHeight = Dimensions.get("window").height;

type Props = NativeStackScreenProps<
  MainStackParamList,
  "ServiciosPorCategoria"
>;

function ServiciosPorCategoria({ route, navigation }: Props) {
  const { categoria } = route.params;
  const { data: servicios, isPending } = useServicesByCategory(categoria);
  const { user } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio>();
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const insets = useSafeAreaInsets();


  // Estado para servicios contratados (array de IDs)
  const [serviciosContratados, setServiciosContratados] = useState<string[]>([]);
  // Estado para mensaje del modal de confirmación
  const [mensajeModal, setMensajeModal] = useState("");

  // Función para controlar la contratación con límite y sin repetidos
  const handleContratarServicio = (servicioId: string) => {
    if (serviciosContratados.includes(servicioId)) {
      Alert.alert("Ya contratado", "Este servicio ya fue contratado.");
      return false;
    }

    if (serviciosContratados.length >= 5) {
      Alert.alert("Límite alcanzado", "Solo podés contratar hasta 5 servicios.", [
        {
          text: "Ir al inicio",
          onPress: () => navigation.navigate("Home" as never),
        },
      ]);
      return false;
    }

    const nuevosContratados = [...serviciosContratados, servicioId];
    setServiciosContratados(nuevosContratados);
    console.log("Servicios contratados:", nuevosContratados.length);
    return true;
  };

  const abrirModal = (servicio: Servicio) => {
    setServicioSeleccionado(servicio);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setServicioSeleccionado(undefined);
  };

  const contratarServicio = async () => {
    cerrarModal();

    if (!servicioSeleccionado) {
      setMensajeModal("❌ No hay servicio seleccionado.");
      setConfirmacionVisible(true);
      return;
    }

    // Primero validar que se pueda contratar (límite y no repetidos)
    const permitido = handleContratarServicio(servicioSeleccionado.id);
    if (!permitido) return;

    try {
      if (!user) {
        throw new Error("No se pudo obtener el usuario actual");
      }

      const compradorId = user.id;
      const createdAt = new Date().toISOString();
      const mensaje = `Un usuario ha solicitado tu servicio: ${servicioSeleccionado.titulo}`;

      await supabase.from("servicios_contratados").insert([
        {
          servicio_id: servicioSeleccionado.id,
          contratante_id: compradorId,
          contratado_id: servicioSeleccionado.user_id,
        },
      ]);

      await supabase.from("notificaciones").insert({
        receptor_id: servicioSeleccionado.user_id,
        emisor_id: compradorId,
        mensaje,
        created_at: createdAt,
      });

      const { data: receptorUsuario } = await supabase
        .from("usuarios")
        .select("expo_token")
        .eq("id", servicioSeleccionado.user_id)
        .single();

      if (receptorUsuario?.expo_token) {
        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: receptorUsuario.expo_token,
            sound: "default",
            title: "¡Nueva solicitud!",
            body: mensaje,
          }),
        });
      }

      setMensajeModal("✅ Tu propuesta fue enviada.");
      setConfirmacionVisible(true);
    } catch (error: any) {
      setMensajeModal("❌ Error al contratar el servicio.");
      setConfirmacionVisible(true);
      showToast.error("Contratar servicio", error.message || error.toString());
    }
  };

  // Cerramos el modal actual y abrimos el reporte
  const handleReport = (servicio: Servicio) => {
    cerrarModal();
    setServicioSeleccionado(servicio);
    setReportVisible(true);
  };

  if (isPending) {
    return <LoadingView />;
  }


  return (
    <SafeAreaView
      style={{ flex: 1, paddingTop: 24, backgroundColor: "#F8F8F8" }}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Servicios de {categoria}</Text>

        <TouchableOpacity
          style={styles.botonMapa}
          onPress={() =>
            navigation.navigate("Maps", {
              categoria,
              servicios,
            })
          }
        >
          <Text style={styles.botonMapaTexto}>Ver en Mapa 🗺️</Text>
        </TouchableOpacity>

        <FlatList
          data={servicios}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ServicioItem
              servicio={item}
              workerStatus={item.worker_status}
              onPress={(id) => abrirModal(id)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyListComponent
              icon="wifi-off"
              message="No hay servicios disponibles en esta categoría."
            />
          }
          contentContainerStyle={{
            paddingBottom: insets.bottom + 30,
            paddingHorizontal: 12,
            flexGrow: 1,
          }}
        />


          {/* MODAL DETALLE DEL SERVICIO */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={cerrarModal}
          >
            <View style={styles.modalFondo}>
              <View style={styles.modalContenido}>
                {servicioSeleccionado && (
                  <>
                    <View style={styles.modalTituloContainer}>
                      <Text style={styles.modalTitulo}>
                        {servicioSeleccionado.titulo}
                      </Text>
                      

                    </View>
                    <Text style={styles.modalTexto}>
                      Precio: {servicioSeleccionado.precio}
                    </Text>
                    <Text style={styles.modalTexto}>
                      Horario: {servicioSeleccionado.horario}
                    </Text>
                    <Text style={styles.modalTexto}>
                      Descripción: {servicioSeleccionado.descripcion}
                    </Text>

                    <TouchableOpacity
  style={styles.botonContratar}
  onPress={() => {
    handleContratarServicio(servicioSeleccionado?.id ?? "");
    contratarServicio();
  }}
>
  <Text style={styles.botonTexto}>Contratar</Text>
</TouchableOpacity>
                    
                    <TouchableOpacity
                        style={styles.botonReportar}
                         onPress={() => handleReport(servicioSeleccionado)}
                          >
                        <Text style={styles.textoReportar}>Reportar</Text>
                    </TouchableOpacity>

                  <TouchableOpacity onPress={cerrarModal}>
                    <Text style={styles.cancelar}>Cerrar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>


          {/* MODAL DE CONFIRMACIÓN */}
          <Modal
  visible={confirmacionVisible}
  animationType="fade"
  transparent={true}
  onRequestClose={() => setConfirmacionVisible(false)}
>
  <View style={styles.modalFondo}>
    <View style={styles.modalConfirmacion}>
      <Text style={styles.mensajeConfirmacion}>{mensajeModal}</Text>

      {mensajeModal === "✅ Tu propuesta fue enviada." && (
        <>
          <Text style={[styles.mensajeConfirmacion, { marginTop: 10 }]}>
            Aún puedes contratar {5 - serviciosContratados.length} servicios.
          </Text>

          <View style={{ flexDirection: "column", marginTop: 20, justifyContent: "space-around" }}>
            <TouchableOpacity
              style={[styles.botonVolver, { backgroundColor: "#4caf50" }]}
              onPress={() => setConfirmacionVisible(false)}
            >
              <Text style={styles.botonTexto}>Contratar otro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonVolver}
              onPress={() => {
                setConfirmacionVisible(false);
                navigation.navigate("Home");
              }}
            >
              <Text style={styles.botonTexto}>Volver al inicio</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {mensajeModal !== "✅ Tu propuesta fue enviada." && (
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => setConfirmacionVisible(false)}
        >
          <Text style={styles.botonTexto}>Cerrar</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
</Modal>
 

        {/* MODAL DE REPORTE */}
        {servicioSeleccionado && (
          <ReportServiceModal
            visible={reportVisible}
            servicio={servicioSeleccionado}
            onClose={() => setReportVisible(false)}
            currentUserId={0}
          />
        )}
      </View>
      <BottomNavBar />
    </SafeAreaView>
  );
}

export default withSuspense(ServiciosPorCategoria, <LoadingView />);

const styles = StyleSheet.create({
  container: {
    padding: 18,
  },
  title: {
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
    color: "#19D4C6",
    letterSpacing: 0.5,
  },
  noServicios: {
    fontSize: 17,
    color: "#FF6B35",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 30,
  },
  servicioCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
    position: "relative",
    shadowColor: "#19D4C6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#F2F6F6",
  },
  servicioTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#333",
    marginBottom: 2,
  },
  servicioText: {
    fontSize: 15,
    color: "#444",
    marginBottom: 2,
  },
  pausadoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,107,53,0.92)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    zIndex: 1,
  },
  pausadoText: {
    fontWeight: "900",
    textAlign: "center",
    color: "#fff",
    textShadowColor: "#000",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalContenido: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    maxHeight: screenHeight * 0.85,
    shadowColor: "#19D4C6",
    shadowOpacity: 0.2,
    elevation: 8,
  },
  modalTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#19D4C6",
  },
  modalTexto: {
    fontSize: 16,
    color: "#333",
    marginBottom: 6,
    lineHeight: 21,
  },
  botonContratar: {
    marginTop: 22,
    backgroundColor: "#19D4C6",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#19D4C6",
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  botonTexto: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.3,
    width:100,
  },
  cancelar: {
    marginTop: 15,
    textAlign: "center",
    color: "#888",
    fontWeight: "600",
  },
  modalConfirmacion: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#19D4C6",
    shadowOpacity: 0.15,
  },
  mensajeConfirmacion: {
    fontSize: 17,
    color: "#19D4C6",
    textAlign: "center",
    marginBottom: 22,
    fontWeight: "bold",
  },
  botonVolver: {
    backgroundColor: "#FF6B35",
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 25,
    elevation: 2,
    shadowColor: "#FF6B35",
    shadowOpacity: 0.15,
    marginTop: 6,
  },
  botonMapa: {
    backgroundColor: "#19D4C6",
    paddingVertical: 11,
    paddingHorizontal: 26,
    borderRadius: 23,
    alignSelf: "center",
    marginBottom: 20,
    elevation: 3,
  },
  botonMapaTexto: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.1,
  },

  botonReportar: {
  backgroundColor: '#FF4C4C',
  paddingVertical: 10,
  paddingHorizontal: 50,
  borderRadius: 20,
  alignSelf: 'center',
  marginHorizontal: 30,
  marginTop:10,
},

textoReportar: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
},
});
