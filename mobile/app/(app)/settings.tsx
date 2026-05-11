import { useEffect, useState, useMemo } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '../../lib/api';
import { clearAuth, getLanguage, saveLanguage, LangPreference } from '../../lib/storage';
import { useAuth } from '../../lib/auth-context';
import { useTheme } from '../../lib/theme-context';

type Section = 'username' | 'email' | 'password' | 'language' | 'delete' | null;

const LANGUAGES: LangPreference[] = [
  { code: 'en', label: 'English',             native: 'English'   },
  { code: 'zh', label: 'Traditional Chinese',  native: '繁體中文' },
  { code: 'zh', label: 'Simplified Chinese',   native: '简体中文' },
  { code: 'ja', label: 'Japanese',             native: '日本語'   },
  { code: 'ko', label: 'Korean',               native: '한국어'   },
  { code: 'es', label: 'Spanish',              native: 'Español'  },
  { code: 'fr', label: 'French',               native: 'Français' },
  { code: 'pt', label: 'Portuguese',           native: 'Português'},
  { code: 'de', label: 'German',               native: 'Deutsch'  },
  { code: 'it', label: 'Italian',              native: 'Italiano' },
  { code: 'ar', label: 'Arabic',               native: 'العربية'  },
  { code: 'hi', label: 'Hindi',                native: 'हिन्दी'  },
];

export default function Settings() {
  const router = useRouter();
  const { setAuthed } = useAuth();
  const [username, setUsername] = useState('');
  const [lang, setLang] = useState<LangPreference | null>(null);
  const [open, setOpen] = useState<Section>(null);

  const [newUsername, setNewUsername] = useState('');
  const [unPassword, setUnPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [deletePw, setDeletePw] = useState('');
  const [loading, setLoading] = useState(false);

  const { background: bg, primary, surface, surface2, border, text, muted, danger } = useTheme();

  const C = useMemo(() => ({
    bg, surface, surface2, border, accent: primary, text, muted, danger,
  }), [bg, surface, surface2, border, primary, text, muted, danger]);

  const styles = useMemo(() => StyleSheet.create({
    scroll: { flex: 1, backgroundColor: C.bg },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerLabel: { fontSize: 13, color: C.muted },
    headerValue: { fontSize: 13, color: C.text },
    sectionLabel: { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 1, marginBottom: 8, marginTop: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    infoKey: { fontSize: 15, color: C.muted },
    infoValue: { fontSize: 15, color: C.text },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.surface, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 8 },
    rowLabel: { fontSize: 15, color: C.text },
    chevron: { fontSize: 18, color: C.muted },
    form: { backgroundColor: C.surface2, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, padding: 16, gap: 10, marginBottom: 8, marginTop: -4 },
    input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, color: C.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
    btn: { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
    btnDanger: { backgroundColor: '#4a1515' },
    btnDisabled: { opacity: 0.4 },
    btnText: { fontSize: 15, fontWeight: '600', color: C.bg },
    warning: { fontSize: 13, color: C.muted, lineHeight: 19 },
    langRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 6, backgroundColor: C.surface },
    langRowActive: { backgroundColor: C.surface2, borderWidth: 1, borderColor: C.accent + '55' },
    langNative: { fontSize: 16, color: C.text, fontWeight: '500', flex: 1 },
    langNativeActive: { color: C.accent },
    langLabel: { fontSize: 12, color: C.muted, marginRight: 6 },
    langLabelActive: { color: C.accent + '99' },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent },
    spacer: { height: 20 },
  }), [C]);

  useEffect(() => {
    api.account.info().then((info) => setUsername(info.username)).catch(() => {});
    getLanguage().then((l) => { if (l) setLang(l); }).catch(() => {});
  }, []);

  function toggle(section: Section) {
    setOpen((prev) => (prev === section ? null : section));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function pickLanguage(l: LangPreference) {
    await saveLanguage(l);
    setLang(l);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function submitUsername() {
    if (!newUsername.trim() || !unPassword) return;
    setLoading(true);
    try {
      await api.account.updateUsername(newUsername.trim(), unPassword);
      setUsername(newUsername.trim());
      setNewUsername(''); setUnPassword(''); setOpen(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Done', 'Username updated.');
    } catch (e: unknown) { Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong'); }
    setLoading(false);
  }

  async function submitEmail() {
    if (!newEmail.trim() || !emailPassword) return;
    setLoading(true);
    try {
      await api.account.updateEmail(newEmail.trim(), emailPassword);
      setNewEmail(''); setEmailPassword(''); setOpen(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Done', 'Email updated.');
    } catch (e: unknown) { Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong'); }
    setLoading(false);
  }

  async function submitPassword() {
    if (!currentPw || !newPw || newPw.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Error', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.account.changePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw(''); setOpen(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Done', 'Password changed.');
    } catch (e: unknown) { Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong'); }
    setLoading(false);
  }

  async function submitDelete() {
    if (!deletePw) return;
    setLoading(true);
    try {
      await api.account.delete(deletePw);
      await clearAuth();
      setAuthed(false);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await clearAuth();
    setAuthed(false);
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Settings', headerStyle: { backgroundColor: C.bg }, headerTintColor: C.accent, headerShadowVisible: false, headerBackTitle: 'Anjo' }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>Username</Text>
          <Text style={styles.headerValue}>@{username}</Text>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.row}><Text style={styles.rowLabel}>Username</Text><TouchableOpacity onPress={() => toggle('username')}><Text style={styles.chevron}>›</Text></TouchableOpacity></View>
        {open === 'username' && (
          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="New username" placeholderTextColor={C.muted} value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Current password" placeholderTextColor={C.muted} value={unPassword} onChangeText={setUnPassword} secureTextEntry />
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submitUsername} disabled={loading}><Text style={styles.btnText}>Update username</Text></TouchableOpacity>
          </View>
        )}
        <View style={styles.row}><Text style={styles.rowLabel}>Email</Text><TouchableOpacity onPress={() => toggle('email')}><Text style={styles.chevron}>›</Text></TouchableOpacity></View>
        {open === 'email' && (
          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="New email" placeholderTextColor={C.muted} value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Current password" placeholderTextColor={C.muted} value={emailPassword} onChangeText={setEmailPassword} secureTextEntry />
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submitEmail} disabled={loading}><Text style={styles.btnText}>Update email</Text></TouchableOpacity>
          </View>
        )}
        <View style={styles.row}><Text style={styles.rowLabel}>Password</Text><TouchableOpacity onPress={() => toggle('password')}><Text style={styles.chevron}>›</Text></TouchableOpacity></View>
        {open === 'password' && (
          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Current password" placeholderTextColor={C.muted} value={currentPw} onChangeText={setCurrentPw} secureTextEntry />
            <TextInput style={styles.input} placeholder="New password" placeholderTextColor={C.muted} value={newPw} onChangeText={setNewPw} secureTextEntry />
            <TextInput style={styles.input} placeholder="Confirm new password" placeholderTextColor={C.muted} value={confirmPw} onChangeText={setConfirmPw} secureTextEntry />
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={submitPassword} disabled={loading}><Text style={styles.btnText}>Change password</Text></TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Language</Text>
          <TouchableOpacity onPress={() => toggle('language')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {lang && <Text style={{ fontSize: 14, color: C.muted }}>{lang.native}</Text>}
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>
        {open === 'language' && (
          <View style={[styles.form, { gap: 0 }]}>
            {LANGUAGES.map((l) => {
              const active = lang?.label === l.label;
              return (
                <TouchableOpacity
                  key={`${l.code}-${l.label}`}
                  style={[styles.langRow, active && styles.langRowActive]}
                  onPress={() => pickLanguage(l)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langNative, active && styles.langNativeActive]}>{l.native}</Text>
                  <Text style={[styles.langLabel, active && styles.langLabelActive]}>{l.label}</Text>
                  {active && <View style={styles.dot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <View style={styles.row}><Text style={[styles.rowLabel, { color: C.danger }]}>Delete account</Text><TouchableOpacity onPress={() => toggle('delete')}><Text style={styles.chevron}>›</Text></TouchableOpacity></View>
        {open === 'delete' && (
          <View style={styles.form}>
            <Text style={styles.warning}>This will permanently delete your account and all data. This cannot be undone.</Text>
            <TextInput style={styles.input} placeholder="Password to confirm" placeholderTextColor={C.muted} value={deletePw} onChangeText={setDeletePw} secureTextEntry />
            <TouchableOpacity style={[styles.btn, styles.btnDanger, loading && styles.btnDisabled]} onPress={submitDelete} disabled={loading}><Text style={styles.btnText}>Delete account</Text></TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionLabel}>SESSION</Text>
        <TouchableOpacity style={[styles.row, { marginTop: 8 }]} onPress={signOut}>
          <Text style={[styles.rowLabel, { color: C.danger }]}>Sign out</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </>
  );
}
