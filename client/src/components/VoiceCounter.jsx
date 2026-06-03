import { useRef, useEffect, useState } from 'react';
import './VoiceCounter.css';

const N = [
  'शून्य','एक','दुई','तीन','चार','पाँच','छ','सात','आठ','नौ',
  'दश','एघार','बाह्र','तेह्र','चौध','पन्ध्र','सोह्र','सत्र','अठार','उन्नाइस',
  'बीस','एक्काइस','बाइस','तेइस','चौबीस','पच्चीस','छब्बीस','सत्ताइस','अट्ठाइस','उनन्तीस',
  'तीस','एकतीस','बत्तीस','तेत्तीस','चौँतीस','पैँतीस','छत्तीस','सैँतीस','अड्तीस','उनन्चालीस',
  'चालीस','एकचालीस','बयालीस','तेतालीस','चौवालीस','पैंतालीस','छयालीस','सत्चालीस','अठचालीस','उनन्पचास',
  'पचास','एकाउन्न','बाउन्न','त्रिपन्न','चौवन्न','पचपन्न','छपन्न','सत्तावन्न','अठ्ठावन्न','उनन्साठी',
  'साठी','एकसठी','बासठी','त्रिसठी','चौँसठी','पैँसठी','छयसठी','सत्सठी','अठसठी','उनन्सत्तरी',
  'सत्तरी','एकहत्तर','बहत्तर','त्रिहत्तर','चौहत्तर','पचहत्तर','छयहत्तर','सत्हत्तर','अठहत्तर','उनासी',
  'असी','एकासी','बयासी','त्रियासी','चौरासी','पचासी','छयासी','सत्तासी','अठासी','उनान्नब्बे',
  'नब्बे','एकानब्बे','बयानब्बे','त्रियानब्बे','चौरानब्बे','पच्चानब्बे','छयानब्बे','सत्तानब्बे','अठानब्बे','उनान्सय',
  'एक सय'
];

function toNepali(n) {
  if (n <= 100) return N[n] || String(n);
  if (n < 1000) {
    const h = Math.floor(n / 100), r = n % 100;
    return `${N[h]} सय${r > 0 ? ' ' + toNepali(r) : ''}`;
  }
  const t = Math.floor(n / 1000), r = n % 1000;
  return `${toNepali(t)} हजार${r > 0 ? ' ' + toNepali(r) : ''}`;
}

// ── VOICE: Always Nepali female, same on mobile and PC ───────────────
let cachedVoice = null;
let voicesLoaded = false;

function pickNepaliVoice(voices) {
  // Priority 1: Exact Nepali female
  let v = voices.find(v => v.lang === 'ne-NP' && /female/i.test(v.name));
  if (v) return v;
  // Priority 2: Any ne-NP voice
  v = voices.find(v => v.lang === 'ne-NP');
  if (v) return v;
  // Priority 3: Any Nepali-family voice
  v = voices.find(v => v.lang.startsWith('ne'));
  if (v) return v;
  // Priority 4: return null — we'll force ne-NP lang anyway
  return null;
}

function getVoice() {
  if (cachedVoice !== undefined && cachedVoice !== null) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoice = pickNepaliVoice(voices);
    voicesLoaded = true;
  }
  return cachedVoice;
}

export function speakNepali(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const doSpeak = () => {
    const u = new SpeechSynthesisUtterance(text);
    const voice = getVoice();

    if (voice) {
      // A true Nepali voice was found — use it
      u.voice = voice;
      u.lang  = voice.lang;
    } else {
      // No Nepali voice — force ne-NP lang so browser attempts Nepali phonetics
      u.lang = 'ne-NP';
    }

    u.rate   = 0.82;  // slightly slow — comfortable for seniors
    u.pitch  = 1.20;  // higher pitch → more feminine sound on fallback
    u.volume = 1;
    window.speechSynthesis.speak(u);
  };

  if (voicesLoaded || window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoice = null;
      voicesLoaded = true;
      doSpeak();
      window.speechSynthesis.onvoiceschanged = null;
    };
    // Safari fallback
    setTimeout(() => {
      if (!voicesLoaded) { cachedVoice = null; doSpeak(); }
    }, 300);
  }
}

// ── COMPONENT ────────────────────────────────────────────────────
export default function VoiceCounter({ value, onChange, unit, min = 1, max = 9999 }) {
  const holdRef   = useRef(null);
  const [typing, setTyping] = useState(false);
  const [draft,  setDraft]  = useState('');

  // Pre-load voices on mount so first speak is instant
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => { cachedVoice = null; getVoice(); voicesLoaded = true; };
    window.speechSynthesis.onvoiceschanged = load;
    window.speechSynthesis.getVoices(); // trigger load
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const change = (delta) => {
    const next = Math.min(Math.max(value + delta, min), max);
    onChange(next);
    speakNepali(toNepali(next));
  };

  // Hold-to-repeat — non-passive pointer events
  const startHold = (delta) => {
    holdRef.current = setInterval(() => {
      onChange(prev => Math.min(Math.max(prev + delta, min), max));
    }, 110);
  };
  const stopHold = () => clearInterval(holdRef.current);

  // Typing mode
  const commitDraft = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= min && n <= max) {
      onChange(n);
      speakNepali(toNepali(n));
    }
    setTyping(false);
    setDraft('');
  };

  return (
    <div className="vc-wrap">

      {/* ── MINUS HALF-SCREEN ── */}
      <button
        className="vc-side vc-minus"
        disabled={value <= min}
        onClick={() => change(-1)}
        onPointerDown={() => startHold(-1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        −
      </button>

      {/* ── CENTER ── */}
      <div className="vc-center" onClick={() => { setTyping(true); setDraft(String(value)); }}>
        {typing ? (
          <input
            className="vc-input"
            type="number"
            value={draft}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={e => e.key === 'Enter' && commitDraft()}
          />
        ) : (
          <>
            <div className="vc-value">{value}</div>
            <div className="vc-unit">{unit}</div>
            <div className="vc-nepali">{toNepali(value)}</div>
            <div className="vc-hint">थिचेर नम्बर लेख्नुस्</div>
          </>
        )}
      </div>

      {/* ── PLUS HALF-SCREEN ── */}
      <button
        className="vc-side vc-plus"
        disabled={value >= max}
        onClick={() => change(1)}
        onPointerDown={() => startHold(1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
      >
        +
      </button>
    </div>
  );
}
