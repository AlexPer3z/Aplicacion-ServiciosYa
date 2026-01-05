# Documentación del Store `useHomeEventsStore`

El `useHomeEventsStore` es un gestor de estado global creado con **Zustand** diseñado para administrar el ciclo de vida, priorización y visualización de eventos en la aplicación (como tooltips, banners, modales de tutoriales, etc.).

Este store incluye persistencia de datos para recordar qué eventos el usuario ya ha visto, descartado o completado.

## 📋 Características Principales

*   **Persistencia:** Utiliza `zustand/middleware/persist` para guardar el historial del usuario (vistas, completados, descartados).
*   **Sistema de Prioridad:** Los eventos tienen niveles (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
*   **Lógica Condicional Compleja:** Decide si mostrar un evento basándose en:
    *   Número de lanzamientos de la app.
    *   Tiempo de espera entre eventos.
    *   Dependencias (un evento requiere que otro se haya completado antes).
    *   Límites de visualización (máximo X veces).
    *   Fechas de expiración.

---

## 🚀 Guía de Uso Rápido

### 1. Inicialización y Registro

Lo ideal es registrar los eventos disponibles y contar el lanzamiento de la app en el punto de entrada de tu aplicación (ej. `App.tsx` o un `Layout` principal).

```typescript
import { useEffect } from 'react';
import { useHomeEventsStore, EventPriority } from './ruta/al/store';

const App = () => {
  const { registerEvents, incrementAppLaunch } = useHomeEventsStore();

  useEffect(() => {
    // 1. Incrementar contador de visitas a la app
    incrementAppLaunch();

    // 2. Registrar la configuración de los eventos disponibles
    registerEvents([
      {
        id: 'welcome-modal',
        type: 'welcome_tooltip',
        priority: EventPriority.CRITICAL,
        maxShowCount: 1, // Solo mostrar 1 vez
      },
      {
        id: 'new-feature-x',
        type: 'feature_video_card',
        priority: EventPriority.HIGH,
        minAppLaunches: 3, // Mostrar después de que el usuario abra la app 3 veces
        requiresPreviousEvents: ['welcome-modal'] // Requiere haber visto el welcome
      }
    ]);
  }, []);

  return <TuApp />;
};
```

### 2. Consumo de Eventos en la UI

En tu componente de la pantalla de inicio (Home), utiliza el store para obtener el siguiente evento elegible.

```typescript
import { useHomeEventsStore } from './ruta/al/store';

const HomeBanner = () => {
  // Obtener el evento más prioritario que cumple todas las condiciones
  const event = useHomeEventsStore((state) => state.getNextEventToShow());
  const markShown = useHomeEventsStore((state) => state.markEventShown);
  const markDismissed = useHomeEventsStore((state) => state.markEventDismissed);
  const markCompleted = useHomeEventsStore((state) => state.markEventCompleted);

  // Si no hay eventos elegibles, no renderizar nada
  if (!event) return null;

  // Efecto para marcar que se mostró (importante para contadores y delays)
  useEffect(() => {
    markShown(event.id);
  }, [event.id]);

  return (
    <div className="banner">
      <h3>Evento: {event.type}</h3>
      
      <button onClick={() => {
        // Ejemplo: Usuario cierra el banner
        markDismissed(event.id); 
      }}>
        Cerrar
      </button>

      <button onClick={() => {
        // Ejemplo: Usuario realiza la acción deseada (ver video, etc.)
        markCompleted(event.id); 
      }}>
        Ver ahora
      </button>
    </div>
  );
};
```

---

## 🧠 Lógica de Visualización (`shouldShowEvent`)

El método `shouldShowEvent(eventId)` es el núcleo del store. Un evento **NO** se mostrará si cumple alguna de las siguientes condiciones:

1.  **Descartado:** El usuario ya lo cerró (`dismissed: true`).
2.  **Completado:** El usuario ya realizó la acción (`completed: true`).
3.  **Límite de Vistas:** Ha superado el `maxShowCount`.
4.  **Madurez de la App:** El `appLaunchCount` actual es menor al `minAppLaunches` requerido.
5.  **Expirado:** La fecha actual es mayor a `expiresAt`.
6.  **Delay:** No ha pasado suficiente tiempo desde el último evento mostrado (`delayAfterPrevious`).
7.  **Dependencias:** No se han completado los eventos listados en `requiresPreviousEvents`.

---

## 📚 Referencia de la API

### Acciones de Gestión de Eventos

| Método | Descripción |
| :--- | :--- |
| `registerEvent(event)` | Registra un único objeto de configuración de evento. |
| `registerEvents(events[])` | Registra múltiples eventos a la vez. Útil en la inicialización. |
| `unregisterEvent(id)` | Elimina la configuración de un evento (no borra su historial de tracking). |

### Acciones de Tracking (Estado del Usuario)

| Método | Descripción |
| :--- | :--- |
| `markEventShown(id)` | Incrementa el contador de vistas y actualiza `lastShownAt`. |
| `markEventDismissed(id)` | Marca el evento como descartado (no se volverá a mostrar). |
| `markEventCompleted(id)` | Marca el evento como completado (acción realizada, no se vuelve a mostrar). |
| `incrementAppLaunch()` | Suma +1 al contador global de aperturas de la app. |

### Consultas (Selectors)

| Método | Retorno | Descripción |
| :--- | :--- | :--- |
| `getNextEventToShow()` | `HomeEvent \| null` | Devuelve el evento elegible con mayor prioridad. |
| `shouldShowEvent(id)` | `boolean` | Evalúa todas las reglas de negocio para ver si el evento es apto. |
| `hasSeenEvent(id)` | `boolean` | `true` si se ha mostrado al menos una vez. |
| `hasCompletedEvent(id)` | `boolean` | `true` si el usuario completó la acción del evento. |
| `getAllPendingEvents()` | `HomeEvent[]` | Lista todos los eventos que aún pueden mostrarse, ordenados por prioridad. |

### Utilidades

| Método | Descripción |
| :--- | :--- |
| `resetEvent(id)` | Reinicia el tracking de un evento específico (lo hace visible de nuevo como si fuera nuevo). |
| `resetAllEvents()` | Reinicia el tracking de **todos** los eventos. Útil para debug. |
| `clearExpiredEvents()` | Elimina de la configuración los eventos cuya fecha `expiresAt` ya pasó. |

---

## 🛠 Tipos de Datos

### `EventPriority`
Enum para definir qué eventos ganan en caso de conflicto.
```typescript
enum EventPriority {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
    CRITICAL = 4,
}
```

### `HomeEvent` (Configuración)
```typescript
interface HomeEvent {
    id: string;                    // Identificador único
    type: HomeEventType;           // Tipo visual (tooltip, banner, etc)
    priority: EventPriority;       // Nivel de importancia
    maxShowCount?: number;         // Máx veces a mostrar
    minAppLaunches?: number;       // Mínimo de aperturas de app
    delayAfterPrevious?: number;   // Ms a esperar tras el último evento
    expiresAt?: number;            // Timestamp de caducidad
    requiresPreviousEvents?: string[]; // IDs de dependencias
}
```

## ⚠️ Notas Importantes

1.  **Persistencia:** Los datos de *Tracking* (vistas, dismiss) se guardan en el almacenamiento local del dispositivo (definido en `../lib/storagev2`).
2.  **Volatilidad de Configuración:** La lista de `events` se reconstruye al registrarse en cada carga de la app, pero el estado `tracking` se recupera del disco. Esto permite cambiar las reglas de un evento (ej. cambiar prioridad) sin perder si el usuario ya lo vio.