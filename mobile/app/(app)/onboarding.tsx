import { useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedOrb } from '../../components/AnimatedOrb';
import { saveLanguage, setOnboardingComplete, LangPreference } from '../../lib/storage';

// ── Language list ─────────────────────────────────────────────────────────────

const LANGUAGES: LangPreference[] = [
  { code: 'en', label: 'English',            native: 'English'   },
  { code: 'zh', label: 'Traditional Chinese', native: '繁體中文' },
  { code: 'zh', label: 'Simplified Chinese',  native: '简体中文' },
  { code: 'ja', label: 'Japanese',            native: '日本語'   },
  { code: 'ko', label: 'Korean',              native: '한국어'   },
  { code: 'es', label: 'Spanish',             native: 'Español'  },
  { code: 'fr', label: 'French',              native: 'Français' },
  { code: 'pt', label: 'Portuguese',          native: 'Português'},
  { code: 'de', label: 'German',              native: 'Deutsch'  },
  { code: 'it', label: 'Italian',             native: 'Italiano' },
  { code: 'ar', label: 'Arabic',              native: 'العربية'  },
  { code: 'hi', label: 'Hindi',               native: 'हिन्दी'  },
];

// Auto-detect device language and pre-select matching entry
const DEVICE_CODE = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0];
const DEFAULT_LANG = LANGUAGES.find((l) => l.code === DEVICE_CODE) ?? LANGUAGES[0];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [step, setStep]       = useState<0 | 1>(0);
  const [selected, setSelected] = useState<LangPreference>(DEFAULT_LANG);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function advance() {
    if (step === 0) {
      // Fade out → change step → fade in
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setStep(1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    } else {
      finish();
    }
  }

  async function finish() {
    await Promise.all([
      saveLanguage(selected),
      setOnboardingComplete(),
    ]);
    router.replace('/(app)/chat');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === 0 ? (
          <WelcomeStep onContinue={advance} />
        ) : (
          <LanguageStep
            selected={selected}
            onSelect={setSelected}
            onContinue={advance}
          />
        )}
      </Animated.View>
    </View>
  );
}

// ── Step 0: Welcome ───────────────────────────────────────────────────────────

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={styles.step}>
      {/* Orb */}
      <View style={styles.orbWrap}>
        <AnimatedOrb
          size={180}
          trust={0.3}
          valence={0.2}
          arousal={-0.4}
          longing={0.1}
          awaiting
        />
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={styles.wordmark}>Anjo</Text>
        <Text style={styles.tagline}>
          A companion that listens,{'\n'}remembers, and grows with you.
        </Text>
      </View>

      {/* Spacer pushes button to bottom */}
      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.btn} onPress={onContinue} activeOpacity={0.8}>
        <Text style={styles.btnText}>Get started</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 1: Language ──────────────────────────────────────────────────────────

interface LanguageStepProps {
  selected: LangPreference;
  onSelect: (lang: LangPreference) => void;
  onContinue: () => void;
}

function LanguageStep({ selected, onSelect, onContinue }: LanguageStepProps) {
  return (
    <View style={styles.step}>
      {/* Heading */}
      <Text style={styles.langHeading}>What language{'\n'}should Anjo speak?</Text>
      <Text style={styles.langSubtitle}>Anjo will always respond in your language.</Text>

      {/* Language list */}
      <ScrollView
        style={styles.langList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {LANGUAGES.map((lang) => {
          const active = selected.label === lang.label;
          return (
            <TouchableOpacity
              key={`${lang.code}-${lang.label}`}
              style={[styles.langRow, active && styles.langRowActive]}
              onPress={() => onSelect(lang)}
              activeOpacity={0.7}
            >
              <Text style={[styles.langNative, active && styles.langNativeActive]}>
                {lang.native}
              </Text>
              <Text style={[styles.langLabel, active && styles.langLabelActive]}>
                {lang.label}
              </Text>
              {active && <View style={styles.dot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.btn} onPress={onContinue} activeOpacity={0.8}>
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ACCENT = '#7c6ff7';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
  },
  step: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 20,
  },

  // ── Welcome ──
  orbWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 48,
  },
  textBlock: {
    alignItems: 'center',
  },
  wordmark: {
    fontSize: 52,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 1,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 17,
    color: '#888',
    textAlign: 'center',
    lineHeight: 26,
  },

  // ── Language ──
  langHeading: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 38,
    marginBottom: 10,
  },
  langSubtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 24,
  },
  langList: {
    flex: 1,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#141414',
  },
  langRowActive: {
    backgroundColor: '#16133a',
    borderWidth: 1,
    borderColor: `${ACCENT}55`,
  },
  langNative: {
    fontSize: 17,
    color: '#ddd',
    fontWeight: '500',
    flex: 1,
  },
  langNativeActive: {
    color: ACCENT,
  },
  langLabel: {
    fontSize: 13,
    color: '#444',
    marginRight: 8,
  },
  langLabelActive: {
    color: `${ACCENT}99`,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },

  // ── Shared button ──
  btn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
