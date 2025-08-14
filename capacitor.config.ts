import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0f577a6d12884dbcb5626b52242bc82e',
  appName: 'memory-streamer-50',
  webDir: 'dist',
  server: {
    url: 'https://0f577a6d-1288-4dbc-b562-6b52242bc82e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#FF6B35"
    },
    PushNotifications: {
      presentationOptions: ["alert", "sound", "badge"]
    }
  },
  android: {
    allowMixedContent: true,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE", 
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.VIBRATE",
      "android.permission.WAKE_LOCK"
    ]
  }
};

export default config;
