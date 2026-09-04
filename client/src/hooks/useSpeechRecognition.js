import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSpeechRecognition
 * --------------------
 * Wraps the browser Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * into a reusable hook.
 *
 * Returns:
 *   start()           — request mic access and begin recognition
 *   stop()            — stop recognition manually
 *   reset()           — clear transcript and reset to idle
 *   isListening       — true while actively recording
 *   isSupported       — false if browser does not support the API
 *   transcript        — final accumulated recognized text
 *   interimTranscript — live partial result (resets on each interim event)
 *   status            — 'idle' | 'listening' | 'processing' | 'error' | 'unsupported'
 *   error             — user-friendly error string (null when no error)
 */

// Resolve the correct constructor across browsers
const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

const useSpeechRecognition = () => {
  const isSupported = !!SpeechRecognitionAPI;

  // 'idle' | 'listening' | 'processing' | 'error' | 'unsupported'
  const [status, setStatus] = useState(isSupported ? 'idle' : 'unsupported');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  // Accumulate results across multiple `result` events so continuous mode
  // produces a growing transcript rather than overwriting each time.
  const accumulatedRef = useRef('');
  const isListening = status === 'listening';

  // Cleanup: abort any active recognition when the component unmounts
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  /**
   * Map SpeechRecognitionError codes → human-friendly messages.
   */
  const friendlyError = (errorCode) => {
    switch (errorCode) {
      case 'not-allowed':
      case 'permission-denied':
        return 'Microphone permission denied. Please allow access in your browser settings.';
      case 'no-speech':
        return 'No speech detected. Please speak clearly and try again.';
      case 'audio-capture':
        return 'No microphone found. Please connect a microphone and try again.';
      case 'network':
        return 'Network error during speech recognition. Check your internet connection.';
      case 'aborted':
        return null; // intentional stop — not an error to surface
      case 'service-not-allowed':
        return 'Speech recognition service not available. Try a different browser.';
      default:
        return `Speech recognition error: ${errorCode}. Please try again.`;
    }
  };

  const start = useCallback(() => {
    if (!isSupported) {
      setStatus('unsupported');
      setError(
        'Voice input is not supported in this browser. Please type your answer.'
      );
      return;
    }

    // Abort any existing session and clear the ref BEFORE creating a new one.
    // This ensures any stale onend/onerror from the old instance sees
    // recognitionRef.current !== itself and bails out immediately.
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.continuous = true;      // keep listening until stop() is called
    recognition.interimResults = true;  // surface partial results in real time
    recognition.maxAlternatives = 1;

    // ── Instance guard ────────────────────────────────────────────────────────
    // Every event handler checks whether THIS recognition object is still the
    // active one. If reset() or a new start() has run since, recognitionRef
    // will point to a different (or null) instance, so stale events are ignored.
    const isCurrent = () => recognitionRef.current === recognition;

    recognition.onstart = () => {
      if (!isCurrent()) return;
      accumulatedRef.current = '';
      setStatus('listening');
      setError(null);
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      if (!isCurrent()) return;

      let interim = '';
      let finalChunk = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalChunk) {
        // Append to running total (with a space separator when needed)
        const separator = accumulatedRef.current ? ' ' : '';
        accumulatedRef.current += separator + finalChunk.trim();
        setTranscript(accumulatedRef.current);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      if (!isCurrent()) return;

      const msg = friendlyError(event.error);
      if (msg) {
        setError(msg);
        setStatus('error');
      } else {
        // 'aborted' after intentional stop — go back to idle
        setStatus('idle');
      }
      setInterimTranscript('');
    };

    recognition.onend = () => {
      if (!isCurrent()) return;

      setInterimTranscript('');
      // Transition both 'listening' AND 'processing' → 'idle'.
      // Without this, calling stop() (which sets 'processing') followed by
      // onend would leave the hook permanently stuck in 'processing'.
      setStatus((prev) =>
        prev === 'listening' || prev === 'processing' ? 'idle' : prev
      );
    };

    // Register the new instance BEFORE calling start() so isCurrent() works
    // inside onstart which fires synchronously in some browsers.
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setError('Could not start voice recognition. Please try again.');
      setStatus('error');
      recognitionRef.current = null;
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // graceful — fires onend after flushing results
      setStatus('processing');
    }
  }, []);

  /**
   * reset()
   * Immediately abort recognition, null the ref so any in-flight async events
   * from the just-aborted session are ignored (isCurrent() returns false),
   * and return the hook to its initial idle state.
   */
  const reset = useCallback(() => {
    const current = recognitionRef.current;
    recognitionRef.current = null; // must null BEFORE abort so stale events bail out
    current?.abort();

    accumulatedRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setStatus(isSupported ? 'idle' : 'unsupported');
  }, [isSupported]);

  return {
    start,
    stop,
    reset,
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    status,
    error,
  };
};

export default useSpeechRecognition;
