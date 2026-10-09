import { Vibration, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AlertSettings {
  ring: boolean;
  vibrate: boolean;
  talkBack: boolean;
}

const STORAGE_KEY = '@queueless_alert_settings';

const DEFAULT_SETTINGS: AlertSettings = {
  ring: true,
  vibrate: true,
  talkBack: true,
};

let cachedSettings: AlertSettings | null = null;

// Clean lightweight notification chime base64 (short pleasant chime)
const CHIME_DATA_URI = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVoGAACBhYqFbF1fdJivrJBhNjVgodDbqWE1MU6ct9eqZDUyTp2316pkNTJOnbfXqmQ1Mk6dt9eqZDUyTp2316pkNTJOnbfXqmQ1Mk6dt9eqZDUyTp2316pkNTJOnbfXqmQ1Mk6dt9eqZDUyTp2316pkNTIA';

export const getAlertSettings = async (): Promise<AlertSettings> => {
  if (cachedSettings !== null) return cachedSettings;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: AlertSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      cachedSettings = parsed;
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to load alert settings:', err);
  }
  const fallback: AlertSettings = { ...DEFAULT_SETTINGS };
  cachedSettings = fallback;
  return fallback;
};

export const saveAlertSettings = async (settings: Partial<AlertSettings>): Promise<AlertSettings> => {
  try {
    const current = await getAlertSettings();
    const updated: AlertSettings = { ...current, ...settings };
    cachedSettings = updated;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save alert settings:', err);
    return cachedSettings || DEFAULT_SETTINGS;
  }
};

/**
 * Play a notification chime sound
 */
const playChimeSound = async () => {
  try {
    // 1. Web Audio API / HTML5 Audio
    if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
      const snd = new Audio(CHIME_DATA_URI);
      snd.volume = 0.8;
      snd.play().catch(() => {});
      return;
    }

    // 2. Dynamic expo-av if available
    try {
      const expoAv = require('expo-av');
      if (expoAv?.Audio?.Sound) {
        const { sound } = await expoAv.Audio.Sound.createAsync(
          { uri: CHIME_DATA_URI },
          { shouldPlay: true, volume: 0.8 }
        );
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
          }
        });
      }
    } catch {
      // expo-av fallback
    }
  } catch (err) {
    console.warn('Chime audio playback note:', err);
  }
};

/**
 * Speak text aloud using TalkBack / Screen Reader / Speech Synthesis
 */
const speakTalkBack = (message: string) => {
  try {
    // 1. Official React Native Accessibility TalkBack / VoiceOver
    try {
      const RN = require('react-native');
      if (RN.AccessibilityInfo?.announceForAccessibility) {
        RN.AccessibilityInfo.announceForAccessibility(message);
      }
    } catch {}

    // 2. Web Speech Synthesis if available (web & hybrid)
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    // 3. Dynamic expo-speech if available
    try {
      const Speech = require('expo-speech');
      if (Speech?.speak) {
        Speech.speak(message, {
          rate: 0.95,
          pitch: 1.0,
        });
      }
    } catch {
      // expo-speech not bundled
    }
  } catch (err) {
    console.warn('TalkBack announcement error:', err);
  }
};

export type QueueAlertType = 'NEAR' | 'SERVING' | 'GENERIC';

export interface AlertTriggerOptions {
  type: QueueAlertType;
  customMessage?: string;
  deskName?: string;
}

/**
 * Triggers configured Ring, Vibrate, and TalkBack alerts
 */
export const triggerQueueAlert = async (options: AlertTriggerOptions) => {
  const settings = await getAlertSettings();

  const deskText = options.deskName ? ` at ${options.deskName}` : ' to the service desk';

  let defaultVoiceMessage = 'Your queue status has been updated.';
  if (options.type === 'NEAR') {
    defaultVoiceMessage = `Your turn is up. Please proceed${deskText}.`;
  } else if (options.type === 'SERVING') {
    defaultVoiceMessage = 'You are now being served.';
  }

  const voiceMessage = options.customMessage || defaultVoiceMessage;

  // 1. Ring / Notification Chime
  if (settings.ring) {
    playChimeSound();
  }

  // 2. Vibration
  if (settings.vibrate) {
    if (options.type === 'NEAR') {
      // Strong double pulse for turn approaching / calling
      Vibration.vibrate([0, 500, 200, 500]);
    } else if (options.type === 'SERVING') {
      // Medium pulse for in-service
      Vibration.vibrate([0, 300, 150, 300]);
    } else {
      Vibration.vibrate(300);
    }
  }

  // 3. TalkBack (Voice Speech)
  if (settings.talkBack) {
    speakTalkBack(voiceMessage);
  }
};

export default {
  getAlertSettings,
  saveAlertSettings,
  triggerQueueAlert,
};
