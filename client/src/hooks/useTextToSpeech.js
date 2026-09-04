import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useTextToSpeech
 * ---------------
 * Wraps the browser Web Speech API (SpeechSynthesis) into a reusable hook.
 *
 * Returns:
 *   speak(text)  — cancels any in-flight speech, then speaks `text`
 *   stop()       — immediately cancels speech
 *   pause()      — pauses current utterance
 *   resume()     — resumes a paused utterance
 *   isSpeaking   — true while the engine is actively speaking
 *   isSupported  — false if the browser has no SpeechSynthesis
 */
const useTextToSpeech = () => {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [isSpeaking, setIsSpeaking] = useState(false);
  // Keep a ref to the active utterance so we can cancel it from any callback
  const utteranceRef = useRef(null);

  // Clean up on unmount — cancel any in-progress speech
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  /**
   * speak(text)
   * Cancels any current speech, then speaks the given text.
   * Silently no-ops if text is empty or TTS is unsupported.
   */
  const speak = useCallback(
    (text) => {
      if (!isSupported || !text?.trim()) return;

      // Cancel any existing utterance first
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'en-US';
      utterance.rate = 0.95; // slightly slower than default for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        // 'interrupted' fires when we cancel intentionally — ignore it
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('[TTS] SpeechSynthesis error:', e.error);
        }
        setIsSpeaking(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  /** stop() — cancel all speech immediately */
  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  /** pause() — pause the current utterance */
  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
  }, [isSupported]);

  /** resume() — resume a paused utterance */
  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
  }, [isSupported]);

  return { speak, stop, pause, resume, isSpeaking, isSupported };
};

export default useTextToSpeech;
