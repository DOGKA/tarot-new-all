/**
 * Ortak deviceId yonetimi — AsyncStorage ile kalici
 * Hem AppContext hem DreamContext ayni ID'yi kullanir
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const DEVICE_ID_KEY = "@mystic_device_id";

let cachedDeviceId: string | null = null;

export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
  } catch {}

  const newId =
    Constants.installationId ||
    `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
  } catch {}

  cachedDeviceId = newId;
  return newId;
};

export const getCachedDeviceId = (): string => {
  return cachedDeviceId || "";
};
