import { isWhatsAppInstalled, openWhatsApp } from "../../lib/utils/whatsapp";
import ListButton from "../buttons/ListButton";
import SheetContainer from "../sheet/SheetContainer";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSuspenseProfile } from "../../lib/hooks/useUser";
import { type RouteProp, useRoute } from "@react-navigation/native";
import type { MainStackParamList } from "../../types/navigation";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getUserFromClient } from "../../lib/utils/user";
import { supabase } from "../../lib/supabase";
import { useEffect } from "react";
import showToast from "../../lib/toast";

export const serviceInfoQueryOptions = (chatId: string) =>
  queryOptions({
    queryKey: ["user", "chat", chatId, "number"],
    queryFn: async ({ client }) => {
      const { data: chat } = await supabase
        .from("chats")
        .select("usuario_1, usuario_2")
        .eq("id", chatId)
        .single()
        .throwOnError();

      const logged_user = getUserFromClient(client);
      let receiver: string | null = null;
      if (chat.usuario_1 === logged_user.id) {
        receiver = chat.usuario_2;
      } else {
        receiver = chat.usuario_1;
      }

      if (!receiver) throw Error("User id no encontrado");

      const { data } = await supabase
        .from("usuarios")
        .select("celular")
        .eq("id", receiver)
        .single()
        .throwOnError();

      if (!data.celular)
        throw Error(
          "El usuario no tiene un número de teléfono registrado.",
          { cause: "PHONE" },
        );

      return data.celular;
    },
    retry: (failureCount, error) => {
      // Skip retry if error has a specific code/message
      if (error?.cause === "PHONE") {
        return false;
      }
      // Otherwise retry up to 3 times
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
  });

type CurrentRouteProp = RouteProp<MainStackParamList, "ChatIndividual">;

function MoreSheetModal() {
  const { params } = useRoute<CurrentRouteProp>();
  const chatId = params.chatId;
  const { data, isPending, error, isError } = useQuery(
    serviceInfoQueryOptions(chatId),
  );

  // const { data, isPending, isError } = useQuery(
  //   serviceInfoQueryOptions(serviceId),
  // );
  const { nombre } = useSuspenseProfile();

  const handleVideoCallPress = async () => {
    if (!nombre || !data) return;
    const isInstalled = await isWhatsAppInstalled();
    console.log(isInstalled);
    await openWhatsApp(
      data.toString(),
      `Hola, Soy ${nombre} tu cliente de TOORI Servicios Ya, antes de continuar me gustaría hacer una breve videollamada para confirmar tu identidad y coordinar el servicio. ¿Es posible? Saludos.`,
    );
  };

  useEffect(() => {
    if (isError) {
      showToast.error("Ocurrió un error", error.message);
    }
  }, [error, isError]);

  return (
    <SheetContainer>
      <ListButton
        icon={<MaterialIcons name="videocam" size={20} color="white" />}
        title="Videollamada Rápida"
        description="Agenda una videollamada para verificar credenciales y confirmar que es la persona adecuada para tu requerimiento."
        badge="Vía WhatsApp"
        onPress={() => handleVideoCallPress()}
        disabled={isPending || isError}
        compact
      />
    </SheetContainer>
  );
}

export default MoreSheetModal;
