/**
 * Voice input via the browser's Web Speech API.
 *
 * Deliberately browser-side: no audio upload, no speech-to-text bill, no
 * added latency, and no backend change — the transcript is just text, so it
 * flows through the existing /api/chat path and gets routed by the trained
 * classifier exactly like a typed question.
 *
 * Support: Chrome, Edge, and Safari 14.1+. Firefox does not implement it,
 * so `supported` is false there and the UI should hide the mic button.
 *
 * Privacy note worth knowing: Chrome streams the audio to Google's servers
 * for transcription — it is not processed locally.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export function useSpeechRecognition({ lang = 'en-IN', onResult } = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const supported = Boolean(SpeechRecognition);

  useEffect(() => {
    if (!supported) return undefined;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;      // stop after a natural pause
    recognition.interimResults = true;   // show words as they're recognized
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += chunk;
        else interimText += chunk;
      }

      setInterim(interimText);
      if (finalText) {
        setInterim('');
        onResultRef.current?.(finalText.trim());
      }
    };

    recognition.onerror = (event) => {
      // 'aborted' just means we stopped it ourselves
      if (event.error === 'aborted') return;
      setError(
        event.error === 'not-allowed'
          ? 'Microphone permission denied. Allow mic access and try again.'
          : event.error === 'no-speech'
          ? "Didn't catch that — try again."
          : `Speech recognition error: ${event.error}`
      );
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch {
        /* already stopped */
      }
    };
  }, [supported, lang]);

  const start = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    setError(null);
    setInterim('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      // start() throws if called while already running — harmless
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  return { supported, listening, interim, error, start, stop, toggle };
}

export default useSpeechRecognition;
