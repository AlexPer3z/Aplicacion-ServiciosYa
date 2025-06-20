declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL: string;
      EXPO_PUBLIC_API_IP_LOCATION_KEY: string;
      // Add other environment variables here
    }
  }
}
