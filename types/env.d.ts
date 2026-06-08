declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_API_IP_LOCATION_KEY: string;
      EXPO_PUBLIC_TOORI_SYNC_BASE_URL?: string;
      EXPO_PUBLIC_TOORI_APP_SYNC_TOKEN?: string;
      // Add other environment variables here
    }
  }
}
