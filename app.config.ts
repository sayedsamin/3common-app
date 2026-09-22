import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  "name": "3common",
  "slug": "3common",
  "owner": "samin-win",
  "extra": {
    "eas": {
      "projectId": "5c8c6817-2d35-49e4-b3ca-b6e883e2bc4c"
    }
  },
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "automatic",
  "ios": {
    "bundleIdentifier": "com.sayedsamin.threecommon",
    "supportsTablet": true
  },
  "android": {
    "package": "com.sayedsamin.threecommon",
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
