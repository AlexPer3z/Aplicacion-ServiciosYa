export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          icono_url: string | null
          id: string
          nombre: string
        }
        Insert: {
          icono_url?: string | null
          id?: string
          nombre: string
        }
        Update: {
          icono_url?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          acceso_contratado: boolean | null
          borrado_por_usuario_1: string | null
          borrado_por_usuario_2: string | null
          contratado_id: string | null
          contratante_id: string | null
          creado_en: string | null
          es_ia: boolean | null
          id: string
          participantes: string[] | null
          servicio_id: string | null
          usuario_1: string | null
          usuario_2: string | null
        }
        Insert: {
          acceso_contratado?: boolean | null
          borrado_por_usuario_1?: string | null
          borrado_por_usuario_2?: string | null
          contratado_id?: string | null
          contratante_id?: string | null
          creado_en?: string | null
          es_ia?: boolean | null
          id?: string
          participantes?: string[] | null
          servicio_id?: string | null
          usuario_1?: string | null
          usuario_2?: string | null
        }
        Update: {
          acceso_contratado?: boolean | null
          borrado_por_usuario_1?: string | null
          borrado_por_usuario_2?: string | null
          contratado_id?: string | null
          contratante_id?: string | null
          creado_en?: string | null
          es_ia?: boolean | null
          id?: string
          participantes?: string[] | null
          servicio_id?: string | null
          usuario_1?: string | null
          usuario_2?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_code: string
          country_id: number
          created_at: string
          flag: number
          id: number
          latitude: number
          longitude: number
          name: string
          state_code: string
          state_id: number
          updated_at: string
          wikiDataId: string | null
        }
        Insert: {
          country_code: string
          country_id: number
          created_at?: string
          flag?: number
          id?: number
          latitude: number
          longitude: number
          name: string
          state_code: string
          state_id: number
          updated_at?: string
          wikiDataId?: string | null
        }
        Update: {
          country_code?: string
          country_id?: number
          created_at?: string
          flag?: number
          id?: number
          latitude?: number
          longitude?: number
          name?: string
          state_code?: string
          state_id?: number
          updated_at?: string
          wikiDataId?: string | null
        }
        Relationships: []
      }
      contrataciones: {
        Row: {
          cliente_id: string | null
          created_at: string
          estado: string | null
          servicio_id: number | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          estado?: string | null
          servicio_id?: number | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          estado?: string | null
          servicio_id?: number | null
        }
        Relationships: []
      }
      marketing_notifications_log: {
        Row: {
          campaign_id: string | null
          id: string
          message_id: number
          notification_type: string
          sent_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          message_id: number
          notification_type?: string
          sent_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          id?: string
          message_id?: number
          notification_type?: string
          sent_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          chat_id: string | null
          contenido: string | null
          creado_en: string | null
          emisor: string | null
          emisor_id: string | null
          fecha_creacion: string | null
          id: string
          leido: boolean | null
          leido_por_emisor: boolean | null
          leido_por_receptor: boolean | null
          receptor_id: string | null
          remitente_id: string | null
        }
        Insert: {
          chat_id?: string | null
          contenido?: string | null
          creado_en?: string | null
          emisor?: string | null
          emisor_id?: string | null
          fecha_creacion?: string | null
          id?: string
          leido?: boolean | null
          leido_por_emisor?: boolean | null
          leido_por_receptor?: boolean | null
          receptor_id?: string | null
          remitente_id?: string | null
        }
        Update: {
          chat_id?: string | null
          contenido?: string | null
          creado_en?: string | null
          emisor?: string | null
          emisor_id?: string | null
          fecha_creacion?: string | null
          id?: string
          leido?: boolean | null
          leido_por_emisor?: boolean | null
          leido_por_receptor?: boolean | null
          receptor_id?: string | null
          remitente_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string
          emisor_id: string | null
          estado: string | null
          fecha: string | null
          id: string
          leido: boolean | null
          mensaje: string | null
          receptor_id: string
          servicio_id: string | null
        }
        Insert: {
          created_at?: string
          emisor_id?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          leido?: boolean | null
          mensaje?: string | null
          receptor_id: string
          servicio_id?: string | null
        }
        Update: {
          created_at?: string
          emisor_id?: string | null
          estado?: string | null
          fecha?: string | null
          id?: string
          leido?: boolean | null
          mensaje?: string | null
          receptor_id?: string
          servicio_id?: string | null
        }
        Relationships: []
      }
      pagos_procesados: {
        Row: {
          creado_en: string | null
          email: string | null
          id: string
          libelula_id_transaccion: string | null
          payment_id: number | null
          title: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          creado_en?: string | null
          email?: string | null
          id?: string
          libelula_id_transaccion?: string | null
          payment_id?: number | null
          title?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          creado_en?: string | null
          email?: string | null
          id?: string
          libelula_id_transaccion?: string | null
          payment_id?: number | null
          title?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      perfiles: {
        Row: {
          created_at: string | null
          edad: number | null
          foto_perfil: string | null
          id: string
          nombre: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          edad?: number | null
          foto_perfil?: string | null
          id?: string
          nombre?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          edad?: number | null
          foto_perfil?: string | null
          id?: string
          nombre?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      post: {
        Row: {
          created_at: string
          descripcion: string | null
          id: number
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          reason_category: string
          reporter_user_id: string | null
          service_id: number
          status: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason_category: string
          reporter_user_id?: string | null
          service_id: number
          status?: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          reason_category?: string
          reporter_user_id?: string | null
          service_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "servicios_with_coords"
            referencedColumns: ["id"]
          },
        ]
      }
      servicion: {
        Row: {
          detalles: string | null
          fotos: string | null
          horarios: string | null
          id: number
          precio: number | null
          tipo_servicio: string | null
          user_id: string
        }
        Insert: {
          detalles?: string | null
          fotos?: string | null
          horarios?: string | null
          id?: number
          precio?: number | null
          tipo_servicio?: string | null
          user_id?: string
        }
        Update: {
          detalles?: string | null
          fotos?: string | null
          horarios?: string | null
          id?: number
          precio?: number | null
          tipo_servicio?: string | null
          user_id?: string
        }
        Relationships: []
      }
      servicios: {
        Row: {
          aceptado: boolean | null
          barrio: string | null
          calificacion_promedio: number | null
          categoria: string | null
          categoria_id: string | null
          ciudad: string | null
          country: string | null
          descripcion: string | null
          estado: string | null
          foto_perfil: string | null
          horario: string | null
          id: number
          latitud: number | null
          location: unknown
          longitud: number | null
          postal_code: string | null
          precio: number | null
          titulo: string
          user_id: string | null
          usuario_id: string | null
          veces_contratado: number | null
        }
        Insert: {
          aceptado?: boolean | null
          barrio?: string | null
          calificacion_promedio?: number | null
          categoria?: string | null
          categoria_id?: string | null
          ciudad?: string | null
          country?: string | null
          descripcion?: string | null
          estado?: string | null
          foto_perfil?: string | null
          horario?: string | null
          id?: number
          latitud?: number | null
          location?: unknown
          longitud?: number | null
          postal_code?: string | null
          precio?: number | null
          titulo: string
          user_id?: string | null
          usuario_id?: string | null
          veces_contratado?: number | null
        }
        Update: {
          aceptado?: boolean | null
          barrio?: string | null
          calificacion_promedio?: number | null
          categoria?: string | null
          categoria_id?: string | null
          ciudad?: string | null
          country?: string | null
          descripcion?: string | null
          estado?: string | null
          foto_perfil?: string | null
          horario?: string | null
          id?: number
          latitud?: number | null
          location?: unknown
          longitud?: number | null
          postal_code?: string | null
          precio?: number | null
          titulo?: string
          user_id?: string | null
          usuario_id?: string | null
          veces_contratado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_contratados: {
        Row: {
          aceptado: boolean | null
          contratado_id: string | null
          contratante_id: string | null
          creado_en: string | null
          id: string
          servicio_id: number | null
        }
        Insert: {
          aceptado?: boolean | null
          contratado_id?: string | null
          contratante_id?: string | null
          creado_en?: string | null
          id?: string
          servicio_id?: number | null
        }
        Update: {
          aceptado?: boolean | null
          contratado_id?: string | null
          contratante_id?: string | null
          creado_en?: string | null
          id?: string
          servicio_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "servicios_contratados_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_contratados_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_with_coords"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_key: string
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reminder_logs: {
        Row: {
          payload: Json | null
          reminder_number: number
          sent_at: string
          user_id: string
        }
        Insert: {
          payload?: Json | null
          reminder_number: number
          sent_at?: string
          user_id: string
        }
        Update: {
          payload?: Json | null
          reminder_number?: number
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          actualizado_en: string | null
          apellido: string | null
          calle: string | null
          categoria: string | null
          celular: number | null
          ci: string | null
          ciudad: string | null
          codigo: string | null
          codigo_postal: string | null
          creado_en: string | null
          created_at: string | null
          creditos: number | null
          descripcion: string | null
          dni: string | null
          dni_dorso: string | null
          dni_frente: string | null
          dni_verificado: boolean
          domicilio: string | null
          edad: number | null
          email: string
          experiencia: string | null
          experiencia_academica: string | null
          expo_token: string | null
          fecha_nacimiento: string | null
          foto_dni_perfil: string | null
          foto_perfil: string | null
          horarios: string | null
          huella_digital: boolean | null
          id: string
          nombre: string | null
          pago: boolean | null
          perfil_completo: boolean
          precio: string | null
          provincia: string | null
          referencias: string | null
          referral_code: string | null
          referred_by: string | null
          registropagado: boolean | null
          rol: Database["public"]["Enums"]["user_role"]
          selfie: string | null
          sexo: string | null
          suscripcion_activa_hasta: string | null
          suscriptor: boolean | null
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string | null
          apellido?: string | null
          calle?: string | null
          categoria?: string | null
          celular?: number | null
          ci?: string | null
          ciudad?: string | null
          codigo?: string | null
          codigo_postal?: string | null
          creado_en?: string | null
          created_at?: string | null
          creditos?: number | null
          descripcion?: string | null
          dni?: string | null
          dni_dorso?: string | null
          dni_frente?: string | null
          dni_verificado?: boolean
          domicilio?: string | null
          edad?: number | null
          email: string
          experiencia?: string | null
          experiencia_academica?: string | null
          expo_token?: string | null
          fecha_nacimiento?: string | null
          foto_dni_perfil?: string | null
          foto_perfil?: string | null
          horarios?: string | null
          huella_digital?: boolean | null
          id?: string
          nombre?: string | null
          pago?: boolean | null
          perfil_completo?: boolean
          precio?: string | null
          provincia?: string | null
          referencias?: string | null
          referral_code?: string | null
          referred_by?: string | null
          registropagado?: boolean | null
          rol?: Database["public"]["Enums"]["user_role"]
          selfie?: string | null
          sexo?: string | null
          suscripcion_activa_hasta?: string | null
          suscriptor?: boolean | null
          usuario_id?: string
        }
        Update: {
          actualizado_en?: string | null
          apellido?: string | null
          calle?: string | null
          categoria?: string | null
          celular?: number | null
          ci?: string | null
          ciudad?: string | null
          codigo?: string | null
          codigo_postal?: string | null
          creado_en?: string | null
          created_at?: string | null
          creditos?: number | null
          descripcion?: string | null
          dni?: string | null
          dni_dorso?: string | null
          dni_frente?: string | null
          dni_verificado?: boolean
          domicilio?: string | null
          edad?: number | null
          email?: string
          experiencia?: string | null
          experiencia_academica?: string | null
          expo_token?: string | null
          fecha_nacimiento?: string | null
          foto_dni_perfil?: string | null
          foto_perfil?: string | null
          horarios?: string | null
          huella_digital?: boolean | null
          id?: string
          nombre?: string | null
          pago?: boolean | null
          perfil_completo?: boolean
          precio?: string | null
          provincia?: string | null
          referencias?: string | null
          referral_code?: string | null
          referred_by?: string | null
          registropagado?: boolean | null
          rol?: Database["public"]["Enums"]["user_role"]
          selfie?: string | null
          sexo?: string | null
          suscripcion_activa_hasta?: string | null
          suscriptor?: boolean | null
          usuario_id?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          last_seen_at: string | null
          location: unknown
          status: Database["public"]["Enums"]["worker_status"]
          user_id: string
        }
        Insert: {
          last_seen_at?: string | null
          location?: unknown
          status?: Database["public"]["Enums"]["worker_status"]
          user_id: string
        }
        Update: {
          last_seen_at?: string | null
          location?: unknown
          status?: Database["public"]["Enums"]["worker_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      servicios_with_coords: {
        Row: {
          aceptado: boolean | null
          barrio: string | null
          calificacion_promedio: number | null
          categoria: string | null
          categoria_id: string | null
          ciudad: string | null
          country: string | null
          descripcion: string | null
          estado: string | null
          foto_perfil: string | null
          horario: string | null
          id: number | null
          latitud: number | null
          latitude: number | null
          location: unknown
          longitud: number | null
          longitude: number | null
          postal_code: string | null
          precio: number | null
          titulo: string | null
          user_id: string | null
          usuario_id: string | null
          veces_contratado: number | null
        }
        Insert: {
          aceptado?: boolean | null
          barrio?: string | null
          calificacion_promedio?: number | null
          categoria?: string | null
          categoria_id?: string | null
          ciudad?: string | null
          country?: string | null
          descripcion?: string | null
          estado?: string | null
          foto_perfil?: string | null
          horario?: string | null
          id?: number | null
          latitud?: number | null
          latitude?: never
          location?: unknown
          longitud?: number | null
          longitude?: never
          postal_code?: string | null
          precio?: number | null
          titulo?: string | null
          user_id?: string | null
          usuario_id?: string | null
          veces_contratado?: number | null
        }
        Update: {
          aceptado?: boolean | null
          barrio?: string | null
          calificacion_promedio?: number | null
          categoria?: string | null
          categoria_id?: string | null
          ciudad?: string | null
          country?: string | null
          descripcion?: string | null
          estado?: string | null
          foto_perfil?: string | null
          horario?: string | null
          id?: number | null
          latitud?: number | null
          latitude?: never
          location?: unknown
          longitud?: number | null
          longitude?: never
          postal_code?: string | null
          precio?: number | null
          titulo?: string | null
          user_id?: string | null
          usuario_id?: string | null
          veces_contratado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_usuario_id"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_referred_achievement: {
        Args: { referral_code_input: string }
        Returns: Json
      }
      check_hirer_achievements: { Args: never; Returns: Json }
      count_active_by_category: {
        Args: never
        Returns: {
          categoria: string
          count: number
        }[]
      }
      count_services_by_status_in_radius:
        | {
            Args: {
              p_categoria?: string
              search_lat?: number
              search_lon?: number
              search_radius_meters?: number
              status_filter?: string
              worker_status_filter?: string[]
            }
            Returns: {
              categoria: string
              count: number
            }[]
          }
        | {
            Args: {
              search_lat: number
              search_lon: number
              search_radius_meters: number
              status_filter?: string
            }
            Returns: {
              categoria: string
              count: number
            }[]
          }
      delete_user: { Args: { uid: string }; Returns: undefined }
      get_inactive_users_for_reminders: {
        Args: { p_page_number?: number; p_page_size?: number }
        Returns: {
          days_inactive: number
          expo_token: string
          reminder_number: number
          user_id: string
        }[]
      }
      get_marketing_candidate_users:
        | {
            Args: { limit_count: number }
            Returns: {
              actualizado_en: string | null
              apellido: string | null
              calle: string | null
              categoria: string | null
              celular: number | null
              ci: string | null
              ciudad: string | null
              codigo: string | null
              codigo_postal: string | null
              creado_en: string | null
              created_at: string | null
              creditos: number | null
              descripcion: string | null
              dni: string | null
              dni_dorso: string | null
              dni_frente: string | null
              dni_verificado: boolean
              domicilio: string | null
              edad: number | null
              email: string
              experiencia: string | null
              experiencia_academica: string | null
              expo_token: string | null
              fecha_nacimiento: string | null
              foto_dni_perfil: string | null
              foto_perfil: string | null
              horarios: string | null
              huella_digital: boolean | null
              id: string
              nombre: string | null
              pago: boolean | null
              perfil_completo: boolean
              precio: string | null
              provincia: string | null
              referencias: string | null
              referral_code: string | null
              referred_by: string | null
              registropagado: boolean | null
              rol: Database["public"]["Enums"]["user_role"]
              selfie: string | null
              sexo: string | null
              suscripcion_activa_hasta: string | null
              suscriptor: boolean | null
              usuario_id: string
            }[]
            SetofOptions: {
              from: "*"
              to: "usuarios"
              isOneToOne: false
              isSetofReturn: true
            }
          }
        | {
            Args: { days_ago?: number; limit_count: number }
            Returns: {
              actualizado_en: string | null
              apellido: string | null
              calle: string | null
              categoria: string | null
              celular: number | null
              ci: string | null
              ciudad: string | null
              codigo: string | null
              codigo_postal: string | null
              creado_en: string | null
              created_at: string | null
              creditos: number | null
              descripcion: string | null
              dni: string | null
              dni_dorso: string | null
              dni_frente: string | null
              dni_verificado: boolean
              domicilio: string | null
              edad: number | null
              email: string
              experiencia: string | null
              experiencia_academica: string | null
              expo_token: string | null
              fecha_nacimiento: string | null
              foto_dni_perfil: string | null
              foto_perfil: string | null
              horarios: string | null
              huella_digital: boolean | null
              id: string
              nombre: string | null
              pago: boolean | null
              perfil_completo: boolean
              precio: string | null
              provincia: string | null
              referencias: string | null
              referral_code: string | null
              referred_by: string | null
              registropagado: boolean | null
              rol: Database["public"]["Enums"]["user_role"]
              selfie: string | null
              sexo: string | null
              suscripcion_activa_hasta: string | null
              suscriptor: boolean | null
              usuario_id: string
            }[]
            SetofOptions: {
              from: "*"
              to: "usuarios"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      get_services_by_category_in_radius: {
        Args: {
          categoria_filter?: string
          limit_val?: number
          offset_val?: number
          search_lat: number
          search_lon: number
          search_radius_meters: number
          status_filter?: string
        }
        Returns: {
          aceptado: boolean | null
          barrio: string | null
          calificacion_promedio: number | null
          categoria: string | null
          categoria_id: string | null
          ciudad: string | null
          country: string | null
          descripcion: string | null
          estado: string | null
          foto_perfil: string | null
          horario: string | null
          id: number
          latitud: number | null
          location: unknown
          longitud: number | null
          postal_code: string | null
          precio: number | null
          titulo: string
          user_id: string | null
          usuario_id: string | null
          veces_contratado: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "servicios"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_servicios_with_online_workers:
        | {
            Args: never
            Returns: {
              aceptado: boolean | null
              barrio: string | null
              calificacion_promedio: number | null
              categoria: string | null
              categoria_id: string | null
              ciudad: string | null
              country: string | null
              descripcion: string | null
              estado: string | null
              foto_perfil: string | null
              horario: string | null
              id: number
              latitud: number | null
              location: unknown
              longitud: number | null
              postal_code: string | null
              precio: number | null
              titulo: string
              user_id: string | null
              usuario_id: string | null
              veces_contratado: number | null
            }[]
            SetofOptions: {
              from: "*"
              to: "servicios"
              isOneToOne: false
              isSetofReturn: true
            }
          }
        | {
            Args: {
              search_lat?: number
              search_lon?: number
              search_radius_meters?: number
            }
            Returns: {
              aceptado: boolean | null
              barrio: string | null
              calificacion_promedio: number | null
              categoria: string | null
              categoria_id: string | null
              ciudad: string | null
              country: string | null
              descripcion: string | null
              estado: string | null
              foto_perfil: string | null
              horario: string | null
              id: number
              latitud: number | null
              location: unknown
              longitud: number | null
              postal_code: string | null
              precio: number | null
              titulo: string
              user_id: string | null
              usuario_id: string | null
              veces_contratado: number | null
            }[]
            SetofOptions: {
              from: "*"
              to: "servicios"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      get_servicios_with_worker_status: {
        Args: {
          p_categoria?: string
          search_lat?: number
          search_lon?: number
          search_radius_meters?: number
        }
        Returns: {
          aceptado: boolean
          barrio: string
          calificacion_promedio: number
          categoria: string
          categoria_id: string
          ciudad: string
          country: string
          descripcion: string
          estado: string
          foto_perfil: string
          horario: string
          id: number
          latitud: number
          location: unknown
          longitud: number
          postal_code: string
          precio: number
          titulo: string
          user_id: string
          usuario_id: string
          veces_contratado: number
          worker_status: Database["public"]["Enums"]["worker_status"]
        }[]
      }
      incrementar_veces_contratado: {
        Args: { servicio_id_input: string }
        Returns: undefined
      }
      set_stale_workers_offline: { Args: never; Returns: undefined }
      test_get_servicios_with_worker_status: {
        Args: {
          p_categoria?: string
          search_lat?: number
          search_lon?: number
          search_radius_meters?: number
        }
        Returns: {
          aceptado: boolean
          apellido: string
          barrio: string
          calificacion_promedio: number
          categoria: string
          categoria_id: string
          ciudad: string
          country: string
          descripcion: string
          estado: string
          foto_perfil: string
          horario: string
          id: number
          latitud: number
          location: unknown
          longitud: number
          nombre: string
          postal_code: string
          precio: number
          titulo: string
          user_foto_perfil: string
          user_id: string
          usuario_id: string
          veces_contratado: number
          worker_status: Database["public"]["Enums"]["worker_status"]
        }[]
      }
    }
    Enums: {
      user_role: "admin" | "worker" | "user" | "guest"
      worker_status: "OFFLINE" | "ONLINE" | "BUSY" | "ON_BREAK"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "worker", "user", "guest"],
      worker_status: ["OFFLINE", "ONLINE", "BUSY", "ON_BREAK"],
    },
  },
} as const
