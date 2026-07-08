# TOORI Servicios Ya App

App móvil Expo/React Native para clientes y prestadores.

## Integración Web + Mica

Ver [`TOORI_UNIFIED_CONTRACT.md`](./TOORI_UNIFIED_CONTRACT.md).

La app no debe operar como producto aislado. Para operaciones reales usa el puente Web/Mica:

- `lib/tooriBridge.ts`
- `components/tooriBridge/PedidosMicaSection.tsx`
- endpoints web `/api/app/*`

Variables necesarias en build:

```env
EXPO_PUBLIC_TOORI_APP_API_BASE_URL=https://tooriserviciosya.com/api/app
# opcional/fallback: la app usa primero sesión Supabase Auth
EXPO_PUBLIC_TOORI_APP_SYNC_TOKEN=<mismo token que TOORI_APP_SYNC_TOKEN en web/webhook/.env>
```

## Build actual trabajado

- Rama base funcional: `main`
- Versión Android/iOS objetivo: `91.0.0`
- Android `versionCode`: `91`
- Nombre visible: `TOORI Servicios Ya`
