const Response = require('../models/Response');
const Session = require('../models/Session');
const Question = require('../models/Question');
const { evaluateAnswer, checkDuplicateAnswer } = require('../utils/llm');
const { selectNextQuestion } = require('../services/questionSelector');

// ── POST /api/response/submit ─────────────────────────────────────────────────
const submitResponse = async (req, res, next) => {
  try {
    const { session_id, question_id, transcript, question_index = 0 } = req.body;

    // Input validation
    if (!session_id || !question_id || !transcript?.trim()) {
      return res.status(400).json({ error: 'session_id, question_id, and transcript are required.' });
    }
    if (transcript.trim().length < 10) {
      return res.status(400).json({ error: 'Answer is too short. Please provide a more detailed response.' });
    }

    // Verify session belongs to user (or is a guest session) and is active
    const userId = req.user ? req.user._id : null;
    const sessionQuery = userId
      ? { _id: session_id, user_id: userId }
      : { _id: session_id }; // guest sessions have user_id: null
    const session = await Session.findOne(sessionQuery);
    if (!session) return res.status(404).json({ error: 'Session not found.' });
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Cannot submit to a completed or abandoned session.' });
    }

    // Verify question was part of this session (in asked_question_ids)
    const questionInSession = session.asked_question_ids.some(
      (qId) => qId.toString() === question_id
    );
    if (!questionInSession) {
      return res.status(400).json({ error: 'Question does not belong to this session.' });
    }

    // Fetch the question for AI context
    const question = await Question.findById(question_id);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    // Prevent double submission for same question in this session
    const existing = await Response.findOne({ session_id, question_id });
    if (existing) {
      // Already answered — find out what the next question is so the client
      // can advance instead of getting stuck on the current question.
      const answeredIndex = session.asked_question_ids.findIndex(
        (qId) => qId.toString() === question_id
      );
      const nextQId = session.asked_question_ids[answeredIndex + 1];
      let nextQuestion = null;
      let nextQuestionNumber = null;
      const isLastQ = answeredIndex + 1 >= session.total_questions;

      if (nextQId) {
        // Next question was already selected and saved in a previous flow
        const nextQ = await Question.findById(nextQId);
        if (nextQ) {
          nextQuestionNumber = answeredIndex + 2; // 1-based
          nextQuestion = {
            _id: nextQ._id,
            text: nextQ.text,
            topic: nextQ.topic || 'General',
            category: nextQ.category,
            difficulty: nextQ.difficulty,
            question_type: nextQ.question_type || 'conceptual',
            question_number: nextQuestionNumber,
            total_questions: session.total_questions,
          };
        }
      } else if (!isLastQ) {
        // The next question was never added (e.g. rapid double-submit before the
        // first submit completed). Dynamically select it now so the client can advance.
        try {
          // Use the existing response's evaluation to inform question selection
          const existingEval = existing.llm_eval
            ? {
                overall_score: existing.llm_eval.overall_score,
                nextDifficulty: existing.llm_eval.next_difficulty,
                nextTopic: existing.llm_eval.next_topic,
              }
            : null;

          const { question: nextQ } = await selectNextQuestion(session, existingEval);
          if (nextQ) {
            nextQuestionNumber = answeredIndex + 2; // 1-based
            session.questions_asked.push(nextQ._id);
            session.asked_question_ids.push(nextQ._id);
            session.current_question_number = nextQuestionNumber;
            session.current_topic = nextQ.topic || session.current_topic;
            await session.save();

            nextQuestion = {
              _id: nextQ._id,
              text: nextQ.text,
              topic: nextQ.topic || 'General',
              category: nextQ.category,
              difficulty: nextQ.difficulty,
              question_type: nextQ.question_type || 'conceptual',
              question_number: nextQuestionNumber,
              total_questions: session.total_questions,
            };
          }
        } catch (selErr) {
          console.warn('[Response] Could not select next question for already-answered recovery:', selErr.message);
        }
      }

      const isComplete = isLastQ && !nextQuestion;

      return res.status(409).json({
        error: 'You have already answered this question.',
        alreadyAnswered: true,
        nextQuestion,
        nextQuestionNumber,
        isComplete,
      });
    }
    // Server's authoritative question counter (1-based)
    const serverQuestionNumber = session.current_question_number;

    // ── Check for duplicate/copied answer (Bug 3 fix) ───────────────────────
    const { isDuplicate, matchedQuestionId } = await checkDuplicateAnswer(
      session_id,
      question_id,
      transcript.trim()
    );

    if (isDuplicate) {
      console.warn(
        `[Response] DUPLICATE ANSWER detected: Q${serverQuestionNumber} transcript matches previous answer for question ${matchedQuestionId}`
      );
    }

    // ── Evaluate with AI ──────────────────────────────────────────────────────
    // Use the server's authoritative current_question_number as the log label.
    console.log(`[Response] Evaluating Q${serverQuestionNumber}/${session.total_questions}: "${question.text.substring(0, 60)}..."`);

    // Pass session.difficulty so the evaluator can clamp nextDifficulty to the
    // user's chosen difficulty pool (hard boundary).
    let { metrics, evaluation } = await evaluateAnswer(
      transcript.trim(),
      question.text,
      question.question_type || 'conceptual',
      session.role,
      session.difficulty   // 'easy' | 'medium' | 'hard' | 'adaptive'
    );

    // ── Override scores if duplicate answer was detected ─────────────────────
    if (isDuplicate) {
      evaluation = {
        ...evaluation,
        relevance_score: Math.min(evaluation.relevance_score, 2),
        overall_score: Math.min(evaluation.overall_score, 2),
        feedback_text:
          'This answer appears to be identical or nearly identical to an answer you already submitted for a different question in this session. ' +
          'Each question requires a unique, targeted response that addresses the specific topic asked. ' +
          (evaluation.feedback_text || ''),
        strengths: [],
        improvements: [
          'Provide a unique answer that specifically addresses this question',
          'Re-read the question carefully and tailor your response to its topic',
          ...(evaluation.improvements || []),
        ],
        duplicate_warning: true,
      };
    }

    // ── Save response ─────────────────────────────────────────────────────────
    // question_index from the client is used only for Response document ordering.
    const response = await Response.create({
      session_id,
      question_id,
      transcript: transcript.trim(),
      metrics,
      llm_eval: {
        relevance_score: evaluation.relevance_score,
        structure_score: evaluation.structure_score,
        clarity_score: evaluation.clarity_score,
        overall_score: evaluation.overall_score,
        feedback_text: evaluation.feedback_text,
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        missing_concepts: evaluation.missing_concepts || [],
        technical_accuracy: evaluation.technical_accuracy || evaluation.overall_score,
        next_difficulty: evaluation.nextDifficulty || session.current_difficulty,
        next_topic: evaluation.nextTopic || null,
        evaluated_at: new Date(),
        is_mock: evaluation.is_mock || false,
      },
      question_index,
    });

    // ── Update session topic_performance ─────────────────────────────────────
    const topic = question.topic || 'General';
    const topicPerf = session.topic_performance.get(topic) || { attempts: 0, totalScore: 0 };
    session.topic_performance.set(topic, {
      attempts: topicPerf.attempts + 1,
      totalScore: topicPerf.totalScore + evaluation.overall_score,
    });

    // Update adaptive difficulty
    if (evaluation.nextDifficulty) {
      session.current_difficulty = evaluation.nextDifficulty;
    }
    if (evaluation.nextTopic) {
      session.current_topic = evaluation.nextTopic;
    }

    // ── Completion check — SERVER authoritative ───────────────────────────────
    // Use session.current_question_number (set by the server when each question
    // was added to the session). This is the single source of truth and cannot
    // be manipulated by a buggy or malicious client.
    const isLastQuestion = serverQuestionNumber >= session.total_questions;

    let nextQuestion = null;
    let nextSource = null;
    // nextQuestionNumber is the 1-based number for the NEXT question
    let nextQuestionNumber = null;

    if (!isLastQuestion) {
      // ── Select next question ────────────────────────────────────────────────
      const { question: nextQ, source } = await selectNextQuestion(session, evaluation);

      if (nextQ) {
        const upcomingQuestionNumber = serverQuestionNumber + 1;

        session.questions_asked.push(nextQ._id);
        session.asked_question_ids.push(nextQ._id);
        // Advance the session's authoritative question counter
        session.current_question_number = upcomingQuestionNumber;
        session.current_topic = nextQ.topic || evaluation.nextTopic || session.current_topic;

        nextQuestion = {
          _id: nextQ._id,
          text: nextQ.text,
          topic: nextQ.topic || 'General',
          category: nextQ.category,
          difficulty: nextQ.difficulty,
          question_type: nextQ.question_type || 'conceptual',
          // These are informational — the frontend uses its own state as truth
          question_number: upcomingQuestionNumber,
          total_questions: session.total_questions,
        };
        nextQuestionNumber = upcomingQuestionNumber;
        nextSource = source;
      }
    }

    await session.save();

    // Build evaluation response object
    const evalData = {
      score: evaluation.overall_score,
      technical_accuracy: evaluation.technical_accuracy || evaluation.overall_score,
      communication: evaluation.clarity_score,
      relevance: evaluation.relevance_score,
      structure: evaluation.structure_score,
      feedback: evaluation.feedback_text,
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      missing_concepts: evaluation.missing_concepts || [],
      is_mock: evaluation.is_mock || false,
      // Only include ideal_answer in practice mode
      ideal_answer: session.mode === 'practice' ? (question.ideal_answer || '') : undefined,
    };

    console.log(`[Response] Q${serverQuestionNumber}/${session.total_questions} answered. isLastQuestion=${isLastQuestion}. nextQuestionNumber=${nextQuestionNumber}`);

    res.status(201).json({
      message: isLastQuestion ? 'Interview complete!' : 'Answer submitted.',
      evaluation: session.mode === 'mock' ? null : evalData, // Hide in mock mode
      score: evaluation.overall_score, // Always send score for tracking
      response: {
        _id: response._id,
        question_index: response.question_index,
      },
      nextQuestion,
      // currentQuestionNumber: the 1-based number of the question just answered
      currentQuestionNumber: serverQuestionNumber,
      // nextQuestionNumber: the 1-based number of the NEXT question (null if complete)
      nextQuestionNumber,
      totalQuestions: session.total_questions,
      isComplete: isLastQuestion,
      mode: session.mode,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/response/session/:session_id ─────────────────────────────────────
const getSessionResponses = async (req, res, next) => {
  try {
    const { session_id } = req.params;
    const userId = req.user ? req.user._id : null;
    const sessionQuery = userId
      ? { _id: session_id, user_id: userId }
      : { _id: session_id };
    const session = await Session.findOne(sessionQuery);
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    const responses = await Response.find({ session_id })
      .populate('question_id', 'text category difficulty topic question_type ideal_answer')
      .sort({ question_index: 1 });

    res.json({ responses });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitResponse, getSessionResponses };
