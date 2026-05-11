import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../../../../lib/api';
import { ThemeContextValue } from '../../../../lib/theme-context';

type UpdateMood = ThemeContextValue['updateMood'];

export function useEmotionalState(updateMood: UpdateMood) {
  const [orbTrust, setOrbTrust] = useState(0.3);
  const [orbValence, setOrbValence] = useState(0);
  const [orbArousal, setOrbArousal] = useState(0);
  const [orbLonging, setOrbLonging] = useState(0);

  const orbTrustRef = useRef(orbTrust);
  const orbLongingRef = useRef(orbLonging);

  useEffect(() => { orbTrustRef.current = orbTrust; }, [orbTrust]);
  useEffect(() => { orbLongingRef.current = orbLonging; }, [orbLonging]);

  const loadEmotionalState = useCallback(async () => {
    const memories = await api.story.memories();
    const trust = Math.max(0, Math.min(1, memories.relationship.trust_score));
    const longing = Math.max(0, Math.min(1, memories.attachment.longing));
    setOrbTrust(trust);
    setOrbLonging(longing);
    updateMood(trust, 0, 0, longing);
  }, [updateMood]);

  return {
    orbTrust,
    orbValence,
    orbArousal,
    orbLonging,
    setOrbValence,
    setOrbArousal,
    setOrbLonging,
    orbTrustRef,
    orbLongingRef,
    loadEmotionalState,
  };
}
