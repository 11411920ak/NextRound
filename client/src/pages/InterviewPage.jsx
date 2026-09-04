import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import FeedbackPanel from '../components/FeedbackPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import useTextToSpeech from '../hooks/useTextToSpeech';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import {
  Send,
  CheckCircle,
  ChevronRight,
  Flag,
  Lightbulb,
  Clock,
  EyeOff,
  Brain,
  Trophy,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Type,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  technical: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  behavioral: 'bg-violet-500/15 text-violet-400 border border-violet-500/20',
  hr: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
};

const DIFFICULTY_COLORS = {
  easy: 'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  hard: 'bg-red-500/10 text-red-400',
};

const InterviewPage = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // ── Session metadata ────────────────────────────────────────────────────────
  const initialSession = location.state?.session || null;
  const firstQuestion = location.state?.firstQuestion || null;
  const sessionMode = location.state?.mode || initialSession?.mode || 'practice';

  const [session] = useState(initialSession);

  // ── Single-source-of-truth interview state ──────────────────────────────────
  // currentQuestionIndex is 0-based:
  //   0 → "Question 1 of N"
  //   N-1 → "Question N of N" (last question)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
    firstQuestion ? (firstQuestion.question_number - 1) : 0
  );
  const [totalQuestions, setTotalQuestions] = useState(
    firstQuestion?.total_questions ?? initialSession?.total_questions ?? 10
  );
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion);
  // "in_progress" | "completed"
  const [interviewStatus, setInterviewStatus] = useState('in_progress');

  // ── Per-question UI state ───────────────────────────────────────────────────
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  // Store next question data while user reads feedback (practice mode)
  const [pendingNextQuestion, setPendingNextQuestion] = useState(null);
  // Tracks the question index that the pending next question represents
  const [pendingNextIndex, setPendingNextIndex] = useState(null);

  // ── Loading / submitting flags ──────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionEnding, setSessionEnding] = useState(false);
  const [pageLoading, setPageLoading] = useState(!firstQuestion);
  // Shows "Preparing next question..." overlay between questions
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false);

  // ── Duplicate-submit guard (ref so it's safe across async boundaries) ───────
  const isSubmittingRef = useRef(false);

  // ── Misc ───────────────────────────────────────────────────────────────────
  const [completedCount, setCompletedCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const textareaRef = useRef(null);

  // ── Voice system state ──────────────────────────────────────────────────────
  // isMuted: whether TTS question reading is suppressed
  const [isMuted, setIsMuted] = useState(false);
  // answerMode: which input method the candidate is currently using
  const [answerMode, setAnswerMode] = useState('type'); // 'type' | 'voice'

  // TTS hook — reads questions aloud
  const tts = useTextToSpeech();
  // STT hook — converts candidate speech to text
  const asr = useSpeechRecognition();

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000
    );
    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Auto-speak question when it changes ────────────────────────────────────
  // We depend on currentQuestion._id so the effect only fires when a NEW
  // question object arrives (not on every re-render).
  useEffect(() => {
    if (!currentQuestion?.text) return;

    // Stop any previous speech before potentially starting new speech
    tts.stop();
    asr.stop();

    if (!isMuted && tts.isSupported) {
      // Small delay so the page has painted the new question text first
      const t = setTimeout(() => tts.speak(currentQuestion.text), 300);
      return () => {
        clearTimeout(t);
        tts.stop();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion?._id]);

  // ── If user toggles mute ON while speech is playing → stop immediately ─────
  useEffect(() => {
    if (isMuted) {
      tts.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMuted]);

  // ── Sync ASR transcript into the shared answer state ───────────────────────
  // Both typing and speaking feed into the same `answer` state.
  useEffect(() => {
    if (asr.transcript) {
      setAnswer(asr.transcript);
    }
  }, [asr.transcript]);

  // ── Fallback: load session if navigated directly or refreshed (no router state) ──
  useEffect(() => {
    if (!firstQuestion && sessionId) {
      api
        .get(`/session/${sessionId}`)
        .then(({ data }) => {
          const total = data.session?.total_questions ?? 10;
          const answeredCount = data.responses?.length || 0;

          if (data.session?.status === 'completed' || answeredCount >= total) {
            setInterviewStatus('completed');
            setTotalQuestions(total);
            setCompletedCount(answeredCount);
            return;
          }

          // Resume from the current active question (index = answeredCount)
          const questionsList = data.session?.questions_asked || [];
          const activeQ = questionsList[answeredCount] || questionsList[questionsList.length - 1];

          if (activeQ) {
            const qNum = answeredCount + 1;
            setCurrentQuestion({ ...activeQ, question_number: qNum, total_questions: total });
            setTotalQuestions(total);
            setCurrentQuestionIndex(answeredCount);
            setCompletedCount(answeredCount);
          } else {
            navigate('/dashboard');
          }
        })
        .catch(() => navigate('/dashboard'))
        .finally(() => setPageLoading(false));
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── End session ─────────────────────────────────────────────────────────────
  const handleEndSession = useCallback(async () => {
    // Stop all voice activity before navigating away
    tts.stop();
    asr.stop();
    setSessionEnding(true);
    try {
      await api.patch(`/session/${sessionId}/end`);
      toast.success('Session complete! Generating your report...');
      navigate(`/report/${sessionId}`);
    } catch (err) {
      toast.error('Failed to end session. Please try again.');
      setSessionEnding(false);
    }
  }, [sessionId, navigate, tts, asr]);

  // ── Advance to the next question (called in mock mode immediately, or
  //    in practice mode when the user clicks "Next Question") ─────────────────
  const advanceToNext = useCallback((nextQ, nextIndex) => {
    // Stop ongoing speech/recording before showing the next question
    tts.stop();
    asr.stop();
    asr.reset();

    setCurrentQuestion(nextQ);
    setCurrentQuestionIndex(nextIndex); // 0-based index of the next question
    setAnswer('');
    setEvaluation(null);
    setPendingNextQuestion(null);
    setPendingNextIndex(null);
    setLoadingNextQuestion(false);
    setAnswerMode('type'); // reset to type mode for each new question
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [tts, asr]);

  // ── Handle user clicking "Next Question" in practice mode ──────────────────
  const handleNext = useCallback(() => {
    if (interviewStatus === 'completed') {
      handleEndSession();
      return;
    }
    if (pendingNextQuestion !== null && pendingNextIndex !== null) {
      advanceToNext(pendingNextQuestion, pendingNextIndex);
    } else {
      // Fallback: no next question available → end session
      handleEndSession();
    }
  }, [interviewStatus, pendingNextQuestion, pendingNextIndex, advanceToNext, handleEndSession]);

  // ── Submit answer ───────────────────────────────────────────────────────────
  const handleSubmitAnswer = async () => {
    // Guard 1: already submitting (race condition / double-click protection)
    if (isSubmittingRef.current) return;
    // Guard 2: interview already completed
    if (interviewStatus === 'completed') return;
    // Guard 3: answer too short
    if (!answer.trim() || answer.trim().length < 10) {
      toast.error('Please write at least a few sentences before submitting.');
      return;
    }

    // Stop any ongoing speech before submitting
    tts.stop();
    asr.stop();

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setEvaluation(null);

    try {
      const { data } = await api.post('/response/submit', {
        session_id: sessionId,
        question_id: currentQuestion._id,
        transcript: answer.trim(),
        // Send 0-based index of the current question for Response document ordering
        question_index: currentQuestionIndex,
      });

      setCompletedCount((c) => c + 1);

      // ── Interview complete ────────────────────────────────────────────────
      if (data.isComplete) {
        setInterviewStatus('completed');

        if (sessionMode === 'mock') {
          toast.success('Interview complete! Generating your report...');
          // Auto-end and navigate to report
          setTimeout(() => handleEndSession(), 1500);
        } else {
          // Practice mode: show evaluation first, then let user click "Finish"
          if (data.evaluation) {
            setEvaluation(data.evaluation);
            toast.success('Final answer evaluated! See your feedback below.');
          } else {
            toast.success('Interview complete!');
          }
        }
        return; // Do NOT advance — interview is done
      }

      // ── Not complete — there is a next question ───────────────────────────
      if (data.nextQuestion && data.nextQuestionNumber != null) {
        // nextQuestionNumber from server is 1-based → convert to 0-based index
        const nextIndex = data.nextQuestionNumber - 1;

        if (sessionMode === 'mock') {
          // Mock mode: show "loading next question" briefly then advance
          setLoadingNextQuestion(true);
          toast.success(`Answer recorded. Moving to question ${data.nextQuestionNumber}...`);
          // Small delay so the loading state is visible
          setTimeout(() => advanceToNext(data.nextQuestion, nextIndex), 600);
        } else {
          // Practice mode: show evaluation + "Next Question" button
          if (data.evaluation) {
            setEvaluation(data.evaluation);
            toast.success('Answer evaluated! See your feedback below.');
          }
          // Store next question for when user clicks "Next"
          setPendingNextQuestion(data.nextQuestion);
          setPendingNextIndex(nextIndex);
        }
      } else if (sessionMode === 'mock') {
        // Mock mode but server returned no next question → treat as complete
        setInterviewStatus('completed');
        toast.success('Interview complete! Generating your report...');
        setTimeout(() => handleEndSession(), 1500);
      } else {
        // Practice mode but server returned no next question → treat as complete
        setInterviewStatus('completed');
        if (data.evaluation) {
          setEvaluation(data.evaluation);
          toast.success('Final answer evaluated! See your feedback below.');
        } else {
          toast.success('Interview complete!');
        }
      }
    } catch (err) {
      const errData = err.response?.data;

      // ── Handle "already answered" gracefully ─────────────────────────────
      // This can happen if the user refreshes mid-session or submits twice.
      // The server now returns the next question so we can advance.
      if (errData?.alreadyAnswered) {
        if (errData.isComplete) {
          setInterviewStatus('completed');
          toast('Interview already complete — loading your report...', { icon: '🏆' });
          setTimeout(() => handleEndSession(), 1500);
        } else if (errData.nextQuestion && errData.nextQuestionNumber != null) {
          const nextIndex = errData.nextQuestionNumber - 1;
          toast('Advancing to next question...', { icon: '⏭️' });
          if (sessionMode === 'mock') {
            setLoadingNextQuestion(true);
            setTimeout(() => advanceToNext(errData.nextQuestion, nextIndex), 600);
          } else {
            // Practice mode: store pending question and show Next button
            setPendingNextQuestion(errData.nextQuestion);
            setPendingNextIndex(nextIndex);
          }
        } else {
          // Server couldn't determine the next question — retry once automatically
          toast('Syncing with server, please wait...', { icon: '🔄' });
          setTimeout(() => {
            isSubmittingRef.current = false;
            handleSubmitAnswer();
          }, 1500);
        }
        return;
      }

      toast.error(errData?.error || 'Submission failed. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // ── Toggle microphone recording ─────────────────────────────────────────────
  const handleMicToggle = () => {
    if (asr.isListening) {
      asr.stop();
    } else {
      // Clear previous transcript so fresh speech starts clean
      asr.reset();
      setAnswer('');
      asr.start();
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  // Display number is 1-based
  const displayQuestionNumber = currentQuestionIndex + 1;
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const progressPct = (completedCount / totalQuestions) * 100;
  const isMock = sessionMode === 'mock';
  const isComplete = interviewStatus === 'completed';

  // ── Mic button label / icon helper ─────────────────────────────────────────
  const getMicButtonContent = () => {
    if (!asr.isSupported) {
      return { icon: <MicOff className="w-4 h-4" />, label: 'Voice Unavailable', cls: 'opacity-50 cursor-not-allowed' };
    }
    switch (asr.status) {
      case 'listening':
        return {
          icon: <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />,
          label: 'Stop Recording',
          cls: 'mic-pulse border-red-500/50 text-red-300 bg-red-500/10',
        };
      case 'processing':
        return {
          icon: <span className="w-4 h-4 border-2 border-brand-400/40 border-t-brand-400 rounded-full animate-spin" aria-hidden="true" />,
          label: 'Processing…',
          cls: 'opacity-70',
        };
      default:
        return {
          icon: <Mic className="w-4 h-4" />,
          label: 'Speak Answer',
          cls: '',
        };
    }
  };

  // ── Render: page loading ────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your interview..." />
      </div>
    );
  }

  // ── Render: interview completed screen (mock auto-redirects, practice shows this) ──
  if (isComplete && !isSubmitting) {
    const showFeedback = evaluation && sessionMode === 'practice';
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
        {showFeedback ? (
          /* Practice mode: show final evaluation then finish button */
          <div className="space-y-6">
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 mb-4">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">Interview Complete — Question {totalQuestions} of {totalQuestions}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">Final Question Feedback</h2>
            </div>
            <FeedbackPanel evaluation={evaluation} />
            <button
              onClick={handleEndSession}
              disabled={sessionEnding}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {sessionEnding ? (
                <LoadingSpinner size="sm" text="" />
              ) : (
                <><CheckCircle className="w-4 h-4" /> Finish &amp; View Full Report</>
              )}
            </button>
          </div>
        ) : (
          /* Mock mode pending redirect / generic complete */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Interview Completed!</h2>
              <p className="text-slate-400">
                You answered all {totalQuestions} questions. Generating your report…
              </p>
            </div>
            <LoadingSpinner size="md" text="Preparing your report..." />
          </div>
        )}
      </div>
    );
  }

  // ── Render: between-question loading overlay (mock mode transition) ─────────
  if (loadingNextQuestion) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Keep progress bar visible */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="section-label">Question {displayQuestionNumber} of {totalQuestions}</span>
            <div className="progress-bar mt-2 w-48">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-300 font-mono">{formatTime(elapsed)}</span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <LoadingSpinner size="lg" text="Preparing your next interview question..." />
        </div>
      </div>
    );
  }

  // ── Mic button derived props ────────────────────────────────────────────────
  const micBtn = getMicButtonContent();

  // ── Render: main interview UI ───────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="section-label">Question {displayQuestionNumber} of {totalQuestions}</span>
            {isMock && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-medium">
                <EyeOff className="w-3 h-3" /> Mock
              </span>
            )}
          </div>
          <div className="progress-bar mt-2 w-48">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm text-slate-300 font-mono">{formatTime(elapsed)}</span>
          </div>
          {/* End session */}
          <button
            onClick={handleEndSession}
            disabled={sessionEnding || completedCount === 0}
            className="btn-secondary text-sm flex items-center gap-2 py-2"
          >
            <Flag className="w-3.5 h-3.5" />
            End Session
          </button>
        </div>
      </div>

      {/* Progress pills */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-all duration-300 ${
              i < completedCount
                ? 'bg-brand-500'
                : i === currentQuestionIndex
                ? 'bg-brand-500/40'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Question card */}
      {currentQuestion && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-brand-400" />
            </div>
            <div className="flex-1">
              {/* Badges row */}
              <div className="flex items-center flex-wrap gap-2 mb-2">
                {/* Topic badge */}
                {currentQuestion.topic && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {currentQuestion.topic}
                  </span>
                )}
                {/* Category badge */}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  CATEGORY_COLORS[currentQuestion.category] || CATEGORY_COLORS.technical
                }`}>
                  {currentQuestion.category}
                </span>
                {/* Difficulty badge */}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  DIFFICULTY_COLORS[currentQuestion.difficulty] || DIFFICULTY_COLORS.medium
                }`}>
                  {currentQuestion.difficulty}
                </span>
                {/* Question type */}
                {currentQuestion.question_type && currentQuestion.question_type !== 'conceptual' && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-500/10 text-slate-400 capitalize">
                    {currentQuestion.question_type.replace('_', ' ')}
                  </span>
                )}
              </div>

              {/* Question text */}
              <p className="text-white text-lg font-medium leading-relaxed">{currentQuestion.text}</p>

              {/* ── Voice On / Off toggle ──────────────────────────────── */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/6">
                <button
                  onClick={() => setIsMuted((m) => !m)}
                  aria-label={isMuted ? 'Unmute question reading' : 'Mute question reading'}
                  aria-pressed={!isMuted}
                  className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                    isMuted
                      ? 'bg-white/5 text-slate-500 border-white/8 hover:text-slate-300 hover:border-white/15'
                      : 'bg-brand-500/10 text-brand-400 border-brand-500/25 hover:bg-brand-500/15'
                  }`}
                >
                  {isMuted ? (
                    <><VolumeX className="w-3.5 h-3.5" aria-hidden="true" /> Voice Off</>
                  ) : (
                    <><Volume2 className="w-3.5 h-3.5" aria-hidden="true" /> Voice On{tts.isSpeaking && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />}</>
                  )}
                </button>

                {/* TTS unsupported notice */}
                {!tts.isSupported && (
                  <span className="text-xs text-slate-600 italic">
                    Text-to-speech not available in this browser.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Evaluated (practice mode) — show feedback + Next / Finish button ── */}
      {evaluation && sessionMode === 'practice' ? (
        <div className="space-y-4 animate-slide-up">
          <FeedbackPanel evaluation={evaluation} />
          <div className="flex gap-3">
            {!isComplete ? (
              <button
                onClick={handleNext}
                disabled={!pendingNextQuestion}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Next Question <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                disabled={sessionEnding}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {sessionEnding ? <LoadingSpinner size="sm" text="" /> : (
                  <><CheckCircle className="w-4 h-4" /> Finish &amp; View Report</>
                )}
              </button>
            )}
          </div>
        </div>
      ) : isSubmitting ? (
        /* Submitting / AI evaluating overlay */
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner
            size="lg"
            text={isMock ? 'Recording your answer...' : 'AI evaluating your answer...'}
          />
        </div>
      ) : (
        /* ── Answer input panel ─────────────────────────────────────────── */
        <div className="space-y-4">
          {isMock && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-orange-500/8 border border-orange-500/15">
              <EyeOff className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                <strong className="text-orange-400">Mock Mode:</strong> Feedback will be revealed in the final report after you complete all {totalQuestions} questions.
              </p>
            </div>
          )}

          {/* ── Answer mode tabs ──────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnswerMode('type')}
              aria-pressed={answerMode === 'type'}
              aria-label="Switch to typing mode"
              className={`answer-mode-tab ${answerMode === 'type' ? 'answer-mode-tab-active' : 'answer-mode-tab-inactive'}`}
            >
              <Type className="w-3.5 h-3.5" aria-hidden="true" />
              Type Answer
            </button>
            <button
              onClick={() => {
                setAnswerMode('voice');
                // If switching TO voice and mic is unsupported, show message
                // (the UI will handle it gracefully below)
              }}
              aria-pressed={answerMode === 'voice'}
              aria-label="Switch to voice input mode"
              className={`answer-mode-tab ${answerMode === 'voice' ? 'answer-mode-tab-active' : 'answer-mode-tab-inactive'}`}
            >
              <Mic className="w-3.5 h-3.5" aria-hidden="true" />
              Speak Answer
            </button>
          </div>

          {/* ── Speech Recognition error / unsupported banner ─────────────── */}
          {answerMode === 'voice' && (asr.status === 'error' || !asr.isSupported) && (
            <div
              role="alert"
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-0.5">
                  {!asr.isSupported ? 'Voice input unavailable' : 'Microphone error'}
                </p>
                <p className="text-xs text-slate-400">
                  {asr.error ||
                    'Voice input is not supported in this browser. Please type your answer below.'}
                </p>
              </div>
            </div>
          )}

          {/* ── Microphone controls (voice mode only) ─────────────────────── */}
          {answerMode === 'voice' && asr.isSupported && asr.status !== 'error' && (
            <div className="flex flex-col items-center gap-3 py-4">
              {/* Big microphone button */}
              <button
                onClick={handleMicToggle}
                disabled={asr.status === 'processing'}
                aria-label={micBtn.label}
                aria-live="polite"
                className={`flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl border font-semibold text-sm transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed ${micBtn.cls} ${
                  asr.isListening
                    ? 'bg-red-500/10 border-red-500/40 text-red-300'
                    : 'btn-secondary'
                }`}
              >
                {micBtn.icon}
                <span>{micBtn.label}</span>
              </button>

              {/* Live interim transcript indicator */}
              {asr.isListening && asr.interimTranscript && (
                <p
                  aria-live="polite"
                  className="text-xs text-slate-500 italic text-center max-w-sm truncate"
                >
                  {asr.interimTranscript}
                </p>
              )}

              {/* Post-capture hint */}
              {asr.status === 'idle' && asr.transcript && (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Voice captured — review and edit below, then submit.
                </p>
              )}
            </div>
          )}

          {/* ── Textarea (shared by both modes) ──────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="answer-input" className="text-sm font-medium text-slate-300">
                Your Answer
              </label>
              <span className={`text-xs ${wordCount < 30 ? 'text-slate-500' : 'text-brand-400'}`}>
                {wordCount} words {wordCount < 30 && '(aim for 50+)'}
              </span>
            </div>
            <textarea
              id="answer-input"
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={
                answerMode === 'voice' && asr.isSupported
                  ? 'Your spoken answer will appear here. You can edit it before submitting…'
                  : currentQuestion?.category === 'behavioral' || currentQuestion?.category === 'hr'
                  ? `Structure your answer using STAR:\n• Situation: Set the context\n• Task: Your responsibility\n• Action: What you did\n• Result: The measurable outcome`
                  : `Explain your approach clearly:\n• Start with the core concept\n• Walk through your reasoning\n• Mention trade-offs or edge cases`
              }
              rows={8}
              disabled={isSubmitting}
              aria-label="Your answer — editable"
              className="input-field resize-none leading-relaxed text-sm placeholder-slate-600"
            />
          </div>

          {/* Tip — practice mode only */}
          {!isMock && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-brand-600/8 border border-brand-500/15">
              <Lightbulb className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400">
                <strong className="text-brand-400">Tip:</strong>{' '}
                {currentQuestion?.category === 'technical'
                  ? 'Explain your reasoning, mention trade-offs, and give concrete examples from your experience.'
                  : 'Use STAR method (Situation → Task → Action → Result). Quantify outcomes where possible.'}
              </p>
            </div>
          )}

          <button
            id="submit-answer-btn"
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || !answer.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isMock ? 'Recording answer...' : 'AI is evaluating your answer...'}
              </>
            ) : (
              <>
                {isMock ? <Brain className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {isMock ? 'Submit Answer & Continue' : 'Submit Answer for AI Feedback'}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;
