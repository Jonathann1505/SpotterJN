import type { CapacitorConfig } from '@capacitor/cli';

const config = {
  appId: 'com.spotterjn.app',
  appName: 'SpotterJN',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      // Ícono monocromo de android/app/src/main/res/drawable: evita el cuadro blanco en la barra de estado.
      smallIcon: 'ic_stat_spotterjn',
      iconColor: '#0066CC',
    },
  },
} satisfies CapacitorConfig;

export default config;
