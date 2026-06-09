import { useMutation } from "@tanstack/react-query";
import { useSuspenseProfile } from "./useUser";
import type { Servicio } from "../../types/servicios";
import { supabase } from "../supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { isGuest } from "../utils/user";
import vexo from "../vexo";
import {
    createUrgentWorkAlert,
    sendUrgentWorkPush,
} from "../utils/urgentWorkNotification";

export const CONTRATAR_ERRORS = {
    GUEST_USER: "Los usuarios invitados no pueden contratar servicios.",
    NO_CREDITS: "No tenés créditos disponibles.",
    ALREADY_HIRED: "Este servicio ya fue contratado.",
    DECREMENT_CREDIT_FAILED: "Error al descontar crédito.",
    PUSH_NOTIFICATION_FAILED: "Error enviando notificación push (non-critical):",
};

export interface UseContratarProps {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

/**
 * Hook personalizado para manejar la lógica de contratación de un servicio.
 *
 * Este hook encapsula la mutación para contratar un servicio, realizando las siguientes acciones:
 * 1. Verifica que el usuario no sea 'guest' y tenga créditos suficientes.
 * 2. Comprueba que el servicio no haya sido contratado previamente por el mismo usuario.
 * 3. Crea un registro en `servicios_contratados`.
 * 4. Crea una notificación en la base de datos para el proveedor del servicio.
 * 5. Descuenta un crédito del usuario contratante.
 * 6. Envía una notificación push al proveedor del servicio (si tiene un token de expo).
 *
 * Maneja los callbacks `onSuccess` y `onError` y expone el estado de la mutación y los créditos del usuario.
 *
 * @param {UseContratarProps} [props] - Opciones para el hook, incluyendo callbacks de éxito y error.
 * @returns Un objeto con los créditos del usuario y las propiedades de la mutación de `react-query`.
 */
export default function useContratar({ onSuccess, onError }: UseContratarProps = {}) {
    const user = useSuspenseProfile();
    // Cada vez que este activa el screen donde es utilizado este hook, se va actualizar el perfil del usuario
    useFocusEffect(
        useCallback(() => {
            if (!isGuest(user.rol)) {
                user.refetch();
            }
        }, [user.refetch])
    );

    const contratarMutation = useMutation({
        mutationFn: async (servicio: Servicio) => {
            if (user.rol === "guest") {
                throw new Error(CONTRATAR_ERRORS.GUEST_USER);
            }


            const { data: contratado } = await supabase // verificar si el servicio ya fue contratado
                .from("servicios_contratados")
                .select("id")
                .eq("servicio_id", servicio.id)
                .eq("contratante_id", user.id)
                .single();
            if (contratado) {
                throw new Error(CONTRATAR_ERRORS.ALREADY_HIRED);
            }

            if (!servicio.user_id) {
                throw new Error("Este servicio no tiene prestador asociado.");
            }

            const contratanteId = user.id;
            const mensaje = `Un usuario ha solicitado tu servicio: ${servicio.titulo}`;

            // 1. Insertar en servicios_contratados
            await supabase.from("servicios_contratados").insert([
                {
                    servicio_id: servicio.id,
                    contratante_id: contratanteId,
                    contratado_id: servicio.user_id,
                },
            ]).throwOnError();

            // 2. Insertar en notificaciones
            const { data: notificacion } = await supabase.from("notificaciones").insert({
                receptor_id: servicio.user_id,
                emisor_id: contratanteId,
                mensaje,
                servicio_id: `${servicio.id}`
            }).select("id").single().throwOnError();

            vexo.contratar(servicio.id);

            // 4. Enviar notificación push (sin esperar respuesta)
            try {
                const { data: receptorUsuario } = await supabase
                    .from("usuarios")
                    .select("expo_token")
                    .eq("id", servicio.user_id)
                    .single();

                if (receptorUsuario?.expo_token) {
                    const urgentBody = `Nuevo pedido: ${servicio.titulo}. Respondelo cuanto antes.`;

                    await sendUrgentWorkPush({
                        to: receptorUsuario.expo_token,
                        title: "Tenes trabajo urgente",
                        body: urgentBody,
                        data: { screen: 'MisServicios', params: { screen: 'Solicitudes' } }
                    });

                    await createUrgentWorkAlert({
                        supabase,
                        source: "service_request",
                        workerId: servicio.user_id,
                        clienteId: contratanteId,
                        servicioId: servicio.id,
                        notificacionId: notificacion?.id,
                        category: servicio.categoria,
                        title: "Tenes trabajo urgente",
                        body: urgentBody,
                        metadata: {
                            servicio_titulo: servicio.titulo,
                        },
                    });
                }
            } catch (pushError: any) {
                console.log(
                    CONTRATAR_ERRORS.PUSH_NOTIFICATION_FAILED,
                    pushError.message || pushError,
                );
            }
        },
        onSuccess: async () => {
            onSuccess?.();
        },
        onError: (error: Error) => {
            onError?.(error);
        }
    });

    return contratarMutation;
}
