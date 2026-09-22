import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  "name": "3common",
  "slug": "3common",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "automatic",
  "ios": {
    "supportsTablet": true
  },
  "android": {
    "adaptiveIcon": {
      "backgroundColor": "#E6F4FE",
      "foregroundImage": "./assets/android-icon-foreground.png",
      "backgroundImage": "./assets/android-icon-background.png",
      "monochromeImage": "./assets/android-icon-monochrome.png"
    },
    "predictiveBackGestureEnabled": false
  },
  "web": {
    "favicon": "./assets/favicon.png",
    "bundler": "metro"
  },
  "scheme": "threecommon",
  "plugins": [
    "expo-asset",
    "expo-router",
    "expo-font",
    "expo-secure-store",
    "expo-sqlite",
    "expo-notifications",
    "expo-splash-screen",
    "expo-image"
  ]
};

export default config;
