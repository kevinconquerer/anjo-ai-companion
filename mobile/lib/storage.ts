import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY      = 'anjo_token';
const USER_ID_KEY    = 'anjo_user_id';
const LANG_KEY       = 'anjo_lang';
const ONBOARDED_KEY  = 'anjo_onboarded';

// ── Auth (secure) ──────────────────────────────────────────────────────────────

export async function saveAuth(token: string, userId: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_ID_KEY, userId);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_ID_KEY);
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_ID_KEY);
}

// ── Language preference ────────────────────────────────────────────────────────

export interface LangPreference {
  code: string;   // ISO 639-1 for TTS/STT (e.g. 'zh', 'en', 'ja')
  label: string;  // English name (e.g. 'Traditional Chinese')
  native: string; // Native name (e.g. '繁體中文')
}

export async function getLanguage(): Promise<LangPreference | null> {
  try {
    const raw = await AsyncStorage.getItem(LANG_KEY);
    return raw ? (JSON.parse(raw) as LangPreference) : null;
  } catch {
    return null;
  }
}

export async function saveLanguage(lang: LangPreference): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, JSON.stringify(lang));
}

// ── Onboarding ─────────────────────────────────────────────────────────────────

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}
