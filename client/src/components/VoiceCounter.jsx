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

// Pick a consistent Nepali voice — prefer male on all devices
// Falls back to any ne-NP, then any Nepali, then default with pitch adjusted
let cachedVoice = null;
function getNepaliVoice() {
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  // Try male ne-NP
  cachedVoice = voices.find(v => v.lang === 'ne-NP' && /male/i.test(v.name))
    || voices.find(v => v.lang === 'ne-NP')
    || voices.find(v => v.lang.startsWith('ne'))
    || null;
  return cachedVoice;
}

export function speakNepali(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = getNepaliVoice();
  if (voice) u.voice = voice;
  u.lang   = 'ne-NP';
  u.rate   = 0.82;   // slow enough for elderly
  u.pitch  = 0.90;   // slightly lower pitch → sounds more consistent/male across devices
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

export default function VoiceCounter({ value, onChange, unit, min = 1, max = 9999 }) {
  const holdRef = useRef(null);

  // Pre-load voices on mount
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => { cachedVoice = null; getNepaliVoice(); };
  }, []);

  const change = (delta) => {
    const next = Math.min(Math.max(value + delta, min), max);
    onChange(next);
    speakNepali(toNepali(next));
  };

  const startHold = (delta) => {
    holdRef.current = setInterval(() => {
      onChange(prev => Math.min(Math.max(prev + delta, min), max));
    }, 120);
  };
  const stopHold = () => clearInterval(holdRef.current);

  return (
    <div className="voice-counter">
      <button className="vc-btn vc-minus"
        onClick={() => change(-1)}
        onMouseDown={() => startHold(-1)} onMouseUp={stopHold} onMouseLeave={stopHold}
        onTouchStart={e => { e.preventDefault(); startHold(-1); }} onTouchEnd={stopHold}
        disabled={value <= min}>−</button>

      <div className="vc-display">
        <div className="vc-value">{value}</div>
        <div className="vc-unit">{unit}</div>
        <div className="vc-nepali">{toNepali(value)}</div>
        <button className="vc-speak-btn" onClick={() => speakNepali(toNepali(value))} title="सुन्नुस्">🔊</button>
      </div>

      <button className="vc-btn vc-plus"
        onClick={() => change(1)}
        onMouseDown={() => startHold(1)} onMouseUp={stopHold} onMouseLeave={stopHold}
        onTouchStart={e => { e.preventDefault(); startHold(1); }} onTouchEnd={stopHold}
        disabled={value >= max}>+</button>
    </div>
  );
}
