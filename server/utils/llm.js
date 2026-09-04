/**
 * AI Service — Gemini 1.5 Flash (Free) & Anthropic Claude Integration with Mock Fallback.
 *
 * Supported Providers (automatic priority):
 * 1. Google Gemini 1.5 Flash (if GEMINI_API_KEY is set) — FREE Tier: 1,500 req/day
 * 2. Anthropic Claude 3.5 Haiku (if ANTHROPIC_API_KEY is set)
 * 3. Mock Evaluator (if no API keys are set)
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.AI_MODEL || 'claude-3-5-haiku-20241022';
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
].filter(Boolean);
const MAX_RETRIES = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

const countFillerWords = (text) => {
  const fillers = /\b(um|uh|like|you know|basically|literally|actually|so|right|kind of|sort of)\b/gi;
  return (text.match(fillers) || []).length;
};

const computeMetrics = (transcript) => {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const sentences = transcript.split(/[.!?]+/).filter(Boolean);
  return {
    word_count: words.length,
    sentence_count: sentences.length,
    filler_count: countFillerWords(transcript),
  };
};

const isRealGeminiKey = () => {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    key !== 'your_gemini_api_key_here' &&
    key.trim().length > 10
  );
};

const isRealClaudeKey = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && key !== 'sk-ant-...' && key.startsWith('sk-ant-');
};

/**
 * Call Google Gemini API with system_instruction + structured output (responseSchema).
 *
 * @param {string} systemPrompt — Instruction text (goes into system_instruction)
 * @param {string} userMessage  — User/candidate content
 * @param {Object} [responseSchema] — Optional JSON Schema for structured output
 */
const callGemini = async (systemPrompt, userMessage, responseSchema = null) => {
  const apiKey = process.env.GEMINI_API_KEY;
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const generationConfig = {
          responseMimeType: 'application/json',
          temperature: 0.2,
        };

        // Use native responseSchema for guaranteed structured JSON output
        if (responseSchema) {
          generationConfig.responseSchema = responseSchema;
        }

        const requestBody = {
          // system_instruction: separate from user content for better instruction adherence
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig,
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          // If model is 404 (unavailable/deprecated) or 429 (rate/quota limited), try next model
          if (response.status === 404 || response.status === 429) {
            console.warn(`[Gemini] Model ${model} returned HTTP ${response.status} (${response.status === 429 ? 'Quota/Rate limit' : 'Unavailable'}). Trying next model...`);
            lastError = new Error(`Model ${model} returned ${response.status}: ${errorBody}`);
            break; // Skip further retries on this model and try next model
          }
          throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('Empty response from Gemini API');

        // With responseSchema the output should already be valid JSON,
        // but we still safely extract in case of wrapper text
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Could not extract JSON from Gemini response');

        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        lastError = err;
        if (attempt === MAX_RETRIES) break;
        console.warn(`[Gemini] Model ${model} attempt ${attempt} failed: ${err.message}. Retrying...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('All Gemini model endpoints failed');
};

/**
 * Call Anthropic Claude API with retry logic
 */
const callClaude = async (systemPrompt, userMessage, maxTokens = 800) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const rawText = data.content?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Claude API');

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Could not extract JSON from Claude response');

      return JSON.parse(jsonMatch[0]);
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      console.warn(`[Claude] Attempt ${attempt} failed: ${err.message}. Retrying...`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
};

/**
 * Universal call function choosing Gemini > Claude > error
 * @param {Object} [responseSchema] — Optional Gemini responseSchema for structured output
 */
const callLLM = async (systemPrompt, userMessage, maxTokens = 800, responseSchema = null) => {
  if (isRealGeminiKey()) {
    console.log('[AI] Using Google Gemini (structured output)...');
    return await callGemini(systemPrompt, userMessage, responseSchema);
  } else if (isRealClaudeKey()) {
    console.log('[AI] Using Anthropic Claude API...');
    return await callClaude(systemPrompt, userMessage, maxTokens);
  } else {
    throw new Error('No valid API key found for Gemini or Claude');
  }
};

// ── 1. Evaluate Answer ────────────────────────────────────────────────────────

/**
 * @param {string} selectedDifficulty — 'easy'|'medium'|'hard'|'adaptive'
 *   When not adaptive, nextDifficulty MUST stay within the same pool.
 */
const buildEvalSystemPrompt = (selectedDifficulty = 'adaptive') => {
  // Determine the allowed next-difficulty values
  let difficultyRule;
  if (selectedDifficulty === 'adaptive') {
    difficultyRule = 'nextDifficulty: Recommended next question difficulty — "easy", "medium", or "hard". Adapt based on performance.';
  } else {
    difficultyRule =
      `nextDifficulty: MUST be "${selectedDifficulty}" — the candidate selected ${selectedDifficulty} mode and the difficulty pool is fixed. Do NOT recommend a different difficulty.`;
  }

  return `
You are an expert technical interview coach. Evaluate the candidate's answer STRICTLY against the SPECIFIC interview question provided.

CRITICAL RULE — RELEVANCE CHECK:
Before scoring ANYTHING, determine whether the answer actually addresses the specific question asked.
- If the answer discusses a completely different topic, technology, or concept than what the question asks about, set relevance_score to 1 or 2.
- If the answer is vaguely related but misses the core intent of the question, set relevance_score to 3 or 4.
- A high relevance_score (7-10) REQUIRES the answer to directly discuss the specific topic/concept the question is about.
- When relevance_score <= 3, overall_score MUST also be <= 3 regardless of how well-written the answer is.
- An eloquent, well-structured answer about the WRONG topic is still a BAD answer.

Scoring dimensions (each 1–10):
- relevance_score: Does the answer SPECIFICALLY address THIS question? Check topic, intent, and key concepts expected.
- structure_score: Is the answer logically structured (STAR method for behavioral, clear explanation for technical)?
- clarity_score: Is it clear, confident, and professional?
- technical_accuracy: (1–10) How technically correct is the answer's content? Use 5 for HR/behavioral questions.
- overall_score: Weighted holistic score. Formula: relevance_score * 0.35 + structure_score * 0.20 + clarity_score * 0.15 + technical_accuracy * 0.30. CAPPED by relevance: if relevance_score <= 3, overall_score MUST be <= 3.

Also provide:
- feedback_text: 2–3 sentences of constructive, specific feedback. If irrelevant, explain WHY the answer doesn't match the question.
- strengths: Array of 1–2 specific things done well (can be empty if answer is completely off-topic).
- improvements: Array of 1–2 areas to improve.
- missing_concepts: Array of important concepts the question expected but the answer didn't mention.
- ${difficultyRule}
- nextTopic: Recommend a DIFFERENT topic from the current one to ensure topic rotation.

Respond ONLY with a valid JSON object — no markdown, no extra text.
`.trim();
};

/**
 * Gemini responseSchema for structured evaluation output.
 * Ensures the model returns exactly these fields with correct types.
 */
const EVAL_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    relevance_score:     { type: 'integer' },
    structure_score:     { type: 'integer' },
    clarity_score:       { type: 'integer' },
    technical_accuracy:  { type: 'integer' },
    overall_score:       { type: 'integer' },
    feedback_text:       { type: 'string' },
    strengths:           { type: 'array', items: { type: 'string' } },
    improvements:        { type: 'array', items: { type: 'string' } },
    missing_concepts:    { type: 'array', items: { type: 'string' } },
    nextDifficulty:      { type: 'string', enum: ['easy', 'medium', 'hard'] },
    nextTopic:           { type: 'string' },
  },
  required: [
    'relevance_score', 'structure_score', 'clarity_score',
    'technical_accuracy', 'overall_score', 'feedback_text',
    'strengths', 'improvements', 'missing_concepts',
    'nextDifficulty', 'nextTopic',
  ],
};

/**
 * Extract meaningful keywords from text for relevance comparison.
 * Strips stop words and short tokens.
 */
const MOCK_STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
  'what', 'how', 'why', 'when', 'where', 'which', 'who', 'whom',
  'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your', 'i', 'my', 'me', 'we',
  'and', 'or', 'but', 'if', 'then', 'so', 'because', 'about',
  'explain', 'describe', 'define', 'give', 'example', 'examples',
  'tell', 'us', 'difference', 'between', 'use', 'used', 'using',
]);

const extractKeywords = (text) =>
  text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !MOCK_STOP_WORDS.has(w));

/**
 * Compute keyword overlap ratio between question and answer.
 * Returns 0-1 representing what fraction of question keywords appear in the answer.
 */
const computeKeywordOverlap = (questionText, answerText) => {
  const qKeywords = extractKeywords(questionText);
  const aKeywords = new Set(extractKeywords(answerText));
  if (qKeywords.length === 0) return 0.5; // neutral if question has no keywords
  const matches = qKeywords.filter((k) => aKeywords.has(k)).length;
  return matches / qKeywords.length;
};

const mockEvaluate = (transcript, questionText, questionType = 'conceptual', selectedDifficulty = 'adaptive') => {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const fillers = countFillerWords(transcript);
  const hasStructure = /situation|task|action|result|i was|we had|the outcome|as a result|because|therefore/i.test(transcript);
  const hasTechnical = /function|class|algorithm|database|api|component|method|variable|array|object/i.test(transcript);
  const tooShort = words < 20;

  // ── Question-relevance check via keyword overlap ──────────────────────────
  const keywordOverlap = computeKeywordOverlap(questionText, transcript);
  // overlap < 0.15 → answer shares almost no keywords with the question → likely irrelevant
  const isLikelyIrrelevant = keywordOverlap < 0.15;
  const isWeaklyRelevant = keywordOverlap < 0.30;

  let relevance;
  if (isLikelyIrrelevant) {
    relevance = tooShort ? 1 : 2;
  } else if (isWeaklyRelevant) {
    relevance = tooShort ? 2 : Math.min(5, 3 + Math.floor(Math.random() * 2));
  } else {
    relevance = tooShort ? 3 : Math.min(10, 5 + Math.floor(Math.random() * 4));
  }

  const structure = hasStructure ? Math.min(10, 6 + Math.floor(Math.random() * 3)) : Math.max(3, 4 + Math.floor(Math.random() * 2));
  const clarity = fillers > 5 ? Math.max(4, 7 - fillers) : Math.min(10, 6 + Math.floor(Math.random() * 3));
  const technical = questionType === 'hr' || questionType === 'behavioral' ? 5 : (hasTechnical ? Math.min(10, 6 + Math.floor(Math.random() * 3)) : Math.max(3, 4 + Math.floor(Math.random() * 2)));

  // Weighted overall — capped by relevance when answer is off-topic
  let overall = Math.round((relevance * 0.35 + structure * 0.20 + clarity * 0.15 + technical * 0.30) * 10) / 10;
  if (relevance <= 3) {
    overall = Math.min(overall, 3); // hard cap when answer is irrelevant
  }

  // Clamp nextDifficulty to the selected pool (hard boundary)
  let nextDifficulty;
  if (selectedDifficulty && selectedDifficulty !== 'adaptive') {
    nextDifficulty = selectedDifficulty;
  } else {
    // adaptive mode: adjust based on performance
    if (overall >= 8) nextDifficulty = 'hard';
    else if (overall <= 4) nextDifficulty = 'easy';
    else nextDifficulty = 'medium';
  }

  return {
    relevance_score: relevance,
    structure_score: structure,
    clarity_score: clarity,
    technical_accuracy: technical,
    overall_score: Math.min(10, Math.max(1, overall)),
    feedback_text: isLikelyIrrelevant
      ? 'Your answer does not appear to address the question asked. Re-read the question and make sure your response directly discusses the topic it asks about.'
      : tooShort
      ? 'Your answer is quite brief. Provide a more detailed response with specific examples.'
      : hasStructure
      ? 'Good structure! Try to quantify results (e.g., "reduced load time by 40%") to make it more impactful.'
      : 'Structure your answer more clearly. Explain the problem, your approach, and the outcome.',
    strengths: isLikelyIrrelevant
      ? []
      : [
          words > 50 ? 'Detailed response' : 'Concise and direct',
          hasStructure ? 'Clear narrative flow' : 'Addressed the question',
        ],
    improvements: isLikelyIrrelevant
      ? ['Answer the specific question asked', 'Review the question topic before responding']
      : [
          fillers > 3 ? 'Reduce filler words' : 'Add more specific details',
          tooShort ? 'Expand your answer with examples' : 'Quantify impact with metrics',
        ],
    missing_concepts: [],
    nextDifficulty,
    nextTopic: null,
    is_mock: true,
  };
};

const aiEvaluate = async (transcript, questionText, questionType, role, selectedDifficulty = 'adaptive') => {
  const systemPrompt = buildEvalSystemPrompt(selectedDifficulty);
  const userMessage = `Role: ${role || 'Software Engineer'}
Question Type: ${questionType || 'conceptual'}
Interview Question: "${questionText}"

Candidate's Answer: "${transcript}"`;

  // Pass the responseSchema for structured output (Gemini will use it; Claude ignores it)
  const parsed = await callLLM(systemPrompt, userMessage, 900, EVAL_RESPONSE_SCHEMA);

  // Validate required fields
  const required = ['relevance_score', 'structure_score', 'clarity_score', 'overall_score', 'feedback_text', 'nextDifficulty'];
  for (const field of required) {
    if (parsed[field] === undefined) throw new Error(`Missing field in AI response: ${field}`);
  }

  // Clamp scores to valid range
  ['relevance_score', 'structure_score', 'clarity_score', 'technical_accuracy', 'overall_score'].forEach((key) => {
    if (parsed[key] !== undefined) {
      parsed[key] = Math.min(10, Math.max(1, Number(parsed[key]) || 5));
    }
  });

  // Enforce relevance cap: if relevance is very low, cap overall
  if (parsed.relevance_score <= 3) {
    parsed.overall_score = Math.min(parsed.overall_score, 3);
  }

  // Hard boundary: if not adaptive, override nextDifficulty to match selected pool
  if (selectedDifficulty && selectedDifficulty !== 'adaptive') {
    parsed.nextDifficulty = selectedDifficulty;
  }

  return { ...parsed, is_mock: false };
};

// ── 2. Generate Question ──────────────────────────────────────────────────────

const buildGenQuestionPrompt = () => `
You are an expert interviewer. Generate ONE original interview question based on the provided parameters.
Respond ONLY with a valid JSON object — no markdown, no extra text.

JSON format:
{
  "text": "<The interview question>",
  "topic": "<topic>",
  "difficulty": "<easy|medium|hard>",
  "question_type": "<conceptual|coding|debugging|scenario|system_design|hr|behavioral>",
  "ideal_answer": "<Key concepts the answer should cover, 2-4 sentences>",
  "tags": ["<tag1>", "<tag2>"]
}

Rules:
- Generate ONLY one question
- Make it original and relevant to the role and topic
- Do NOT copy from known websites
- The ideal_answer should list key concepts, not be a complete answer
`.trim();

const mockGenerateQuestion = (role, topic, difficulty, interviewType) => {
  const mockQuestions = {
    technical: [
      `Explain how you would implement ${topic}-based caching in a ${role} project.`,
      `What are the key ${topic} concepts every ${role} should know?`,
      `Describe a scenario where ${topic} knowledge helped you solve a complex problem.`,
    ],
    hr: [
      `Tell me about your experience with ${topic} and how it helped your team.`,
      `How do you stay updated with the latest ${topic} trends?`,
    ],
    mixed: [
      `How would you explain ${topic} to a non-technical stakeholder?`,
    ],
  };
  const pool = mockQuestions[interviewType] || mockQuestions.technical;
  const text = pool[Math.floor(Math.random() * pool.length)];

  return {
    text,
    topic: topic || 'General',
    difficulty: difficulty || 'medium',
    question_type: interviewType === 'hr' ? 'hr' : 'conceptual',
    ideal_answer: `Candidate should demonstrate understanding of ${topic} fundamentals and provide relevant examples.`,
    tags: [topic, role].filter(Boolean),
    is_ai_generated: true,
  };
};

/**
 * @param {string} subDifficulty — 'basic'|'intermediate'|'advanced' (progression within pool)
 * @param {string[]} recentTopics — topics to avoid for rotation
 */
const generateQuestion = async (
  role,
  experience,
  interviewType,
  topic,
  difficulty,
  askedTexts = [],
  subDifficulty = 'basic',
  recentTopics = []
) => {
  if (!isRealGeminiKey() && !isRealClaudeKey()) {
    console.log('[AI] No API key — using mock question generator.');
    return mockGenerateQuestion(role, topic, difficulty, interviewType);
  }

  try {
    const systemPrompt = buildGenQuestionPrompt();

    // Sub-difficulty guidance for the AI
    const subLevelGuidance = {
      basic: 'foundational/introductory — test core concept understanding',
      intermediate: 'intermediate — test practical application and trade-offs',
      advanced: 'advanced — test edge cases, architecture, optimization, or deeper internals',
    }[subDifficulty] || 'appropriate for the difficulty level';

    const avoidTopics = recentTopics.length > 0
      ? `Recently used topics (prefer a DIFFERENT topic if possible): ${recentTopics.join(', ')}`
      : '';

    const userMessage = `Role: ${role}
Experience Level: ${experience || 'fresher'}
Interview Type: ${interviewType || 'technical'}
Topic: ${topic || 'General'}
Difficulty Pool: ${difficulty || 'medium'} (HARD BOUNDARY — do NOT generate a question outside this difficulty)
Progression Level within pool: ${subDifficulty} — ${subLevelGuidance}
${avoidTopics}
Previously Asked Questions (avoid repeating these concepts):
${askedTexts.slice(-6).map((t, i) => `${i + 1}. ${t}`).join('\n') || 'None'}`;

    const parsed = await callLLM(systemPrompt, userMessage, 700);

    if (!parsed.text) throw new Error('Generated question missing text field');

    // Ensure the generated question has the correct difficulty
    parsed.difficulty = difficulty;

    return { ...parsed, is_ai_generated: true };
  } catch (err) {
    console.warn(`[AI] generateQuestion failed: ${err.message}. Using mock.`);
    return mockGenerateQuestion(role, topic, difficulty, interviewType);
  }
};

// ── 3. Generate Final Report Summary ─────────────────────────────────────────

const buildFinalReportPrompt = () => `
You are an expert interview coach writing a final assessment report.
Given the candidate's interview data, generate a personalized summary and recommendations.
Respond ONLY with a valid JSON object — no markdown, no extra text.

JSON format:
{
  "ai_summary": "<3-4 sentences describing overall performance, key strengths, and areas for improvement>",
  "recommendations": ["<specific, actionable recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}

Guidelines:
- Be constructive and encouraging, not harsh
- Use "Your response demonstrates..." language for behavioral assessments
- Recommendations should be specific and actionable (e.g., "Practice SQL JOIN queries with 5 LeetCode problems")
- Max 3-4 recommendations
`.trim();

const mockFinalReport = (role, avgScore, weakTopics) => {
  const readiness = avgScore >= 7.5 ? 'strong performance' : avgScore >= 5 ? 'moderate performance' : 'areas that need improvement';
  return {
    ai_summary: `Your ${role} interview demonstrated ${readiness}. You showed good communication skills and were able to address most questions clearly. Focus on strengthening your weaker topic areas to maximize your interview success rate.`,
    recommendations: [
      weakTopics.length > 0 ? `Review and practice ${weakTopics[0]} fundamentals with hands-on projects` : 'Continue building on your existing strengths with advanced topics',
      'Practice explaining technical concepts to non-technical audiences',
      'Use the STAR method consistently for behavioral questions to make your answers more impactful',
    ],
  };
};

const generateFinalReport = async (sessionInfo, topicPerformance, avgScore) => {
  const weakTopics = Object.entries(topicPerformance)
    .filter(([, v]) => v.attempts > 0 && v.totalScore / v.attempts < 5)
    .map(([topic]) => topic);

  if (!isRealGeminiKey() && !isRealClaudeKey()) {
    console.log('[AI] No API key — using mock final report generator.');
    return mockFinalReport(sessionInfo.role, avgScore, weakTopics);
  }

  try {
    const topicSummary = Object.entries(topicPerformance)
      .map(([topic, v]) => `${topic}: ${v.attempts} questions, avg score ${v.attempts > 0 ? (v.totalScore / v.attempts).toFixed(1) : 'N/A'}/10`)
      .join('\n');

    const systemPrompt = buildFinalReportPrompt();
    const userMessage = `Candidate Role: ${sessionInfo.role}
Experience Level: ${sessionInfo.experience || 'fresher'}
Interview Type: ${sessionInfo.interview_type || 'technical'}
Overall Score: ${avgScore}/10
Total Questions: ${sessionInfo.total_questions}

Topic Performance:
${topicSummary || 'No topic data available'}

Weak Topics (score < 5): ${weakTopics.join(', ') || 'None identified'}`;

    const parsed = await callLLM(systemPrompt, userMessage, 600);

    if (!parsed.ai_summary) throw new Error('Missing ai_summary in response');

    return {
      ai_summary: parsed.ai_summary,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 4) : [],
    };
  } catch (err) {
    console.warn(`[AI] generateFinalReport failed: ${err.message}. Using mock.`);
    return mockFinalReport(sessionInfo.role, avgScore, weakTopics);
  }
};

// ── Main export: evaluateAnswer ───────────────────────────────────────────────

/**
 * @param {string} selectedDifficulty — 'easy'|'medium'|'hard'|'adaptive'
 *   Passed through to the evaluator so nextDifficulty stays inside the chosen pool.
 */
const evaluateAnswer = async (
  transcript,
  questionText,
  questionType = 'conceptual',
  role = 'Software Engineer',
  selectedDifficulty = 'adaptive'
) => {
  const metrics = computeMetrics(transcript);
  let evaluation;

  if (isRealGeminiKey() || isRealClaudeKey()) {
    try {
      evaluation = await aiEvaluate(transcript, questionText, questionType, role, selectedDifficulty);
      console.log(`[AI] Evaluation complete. Score: ${evaluation.overall_score}/10, nextDiff=${evaluation.nextDifficulty}`);
    } catch (err) {
      console.warn(`[AI] Evaluation failed (${err.message}). Falling back to mock.`);
      evaluation = mockEvaluate(transcript, questionText, questionType, selectedDifficulty);
    }
  } else {
    console.log('[AI] No API key — using mock evaluator.');
    evaluation = mockEvaluate(transcript, questionText, questionType, selectedDifficulty);
  }

  return { metrics, evaluation };
};

// ── 4. Analyse Resume Skills (Feature A) ─────────────────────────────────────

const buildSkillAnalysisPrompt = () => `
You are an expert career advisor and technical recruiter. Analyse the provided resume text and return a structured JSON assessment.
Respond ONLY with a valid JSON object — no markdown, no extra text.

JSON format:
{
  "recommendedField": "<Best-fit job field or role title, e.g. 'Frontend Developer', 'Data Analyst'>",
  "rationale": "<2-3 sentences explaining why this field fits the candidate>",
  "rankedSkills": [
    { "skill": "<skill name>", "confidence": <0-100 integer> }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<gap 1>", "<gap 2>"],
  "suggestions": ["<actionable step 1>", "<actionable step 2>", "<actionable step 3>"],
  "interviewQuestions": ["<question 1>", "<question 2>", "<question 3>", "<question 4>", "<question 5>"]
}

Rules:
- rankedSkills: 5-10 skills from the resume, sorted by confidence (highest first), confidence 0-100 integers
- strengths: 3-4 concrete strong points
- weaknesses: 2-3 skill gaps for the recommended field
- suggestions: 3-4 specific, actionable improvements
- interviewQuestions: 5 realistic questions for the recommended field
`.trim();

const mockSkillAnalysis = () => ({
  recommendedField: 'Software Developer',
  rationale: 'Your resume demonstrates strong programming fundamentals and project experience. The combination of technical skills and hands-on projects aligns well with software development roles.',
  rankedSkills: [
    { skill: 'JavaScript', confidence: 85 },
    { skill: 'React', confidence: 78 },
    { skill: 'Node.js', confidence: 72 },
    { skill: 'Problem Solving', confidence: 80 },
    { skill: 'Git', confidence: 75 },
  ],
  strengths: [
    'Hands-on project experience',
    'Strong programming foundation',
    'Version control proficiency',
    'Self-motivated learning',
  ],
  weaknesses: [
    'Limited cloud infrastructure experience',
    'No formal testing/QA mentions',
  ],
  suggestions: [
    'Add AWS or Azure certifications to boost cloud credentials',
    'Contribute to open-source projects to demonstrate collaboration',
    'Learn unit testing frameworks like Jest or Vitest',
    'Add quantifiable achievements to project descriptions',
  ],
  interviewQuestions: [
    'Walk me through a challenging project you built and how you solved a key technical problem.',
    'How do you approach debugging a production issue?',
    'Explain the difference between REST and GraphQL APIs.',
    'How do you ensure code quality in your projects?',
    'Describe your experience with version control workflows.',
  ],
});

const analyseResumeSkills = async (resumeText) => {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error('Resume text is too short for analysis. Please upload a more complete resume.');
  }

  if (!isRealGeminiKey() && !isRealClaudeKey()) {
    console.log('[AI] No API key — using mock skill analysis.');
    return mockSkillAnalysis();
  }

  try {
    const systemPrompt = buildSkillAnalysisPrompt();
    const userMessage = `Resume Text:\n\n${resumeText.substring(0, 6000)}`;
    const parsed = await callLLM(systemPrompt, userMessage, 1200);

    if (!parsed.recommendedField || !Array.isArray(parsed.rankedSkills)) {
      throw new Error('Invalid structure in skill analysis response');
    }
    parsed.rankedSkills = parsed.rankedSkills.map((s) => ({
      skill: s.skill || '',
      confidence: Math.min(100, Math.max(0, Math.round(Number(s.confidence) || 50))),
    }));

    console.log(`[AI] Skill analysis complete. Recommended field: ${parsed.recommendedField}`);
    return parsed;
  } catch (err) {
    console.warn(`[AI] analyseResumeSkills failed: ${err.message}. Using mock.`);
    return mockSkillAnalysis();
  }
};

// ── 5. Role Gap Analysis (Feature B) ─────────────────────────────────────────

const buildRoleGapPrompt = () => `
You are an expert technical recruiter performing a resume-to-job-role fit analysis.
Analyse the provided resume against the target job role and return a structured JSON assessment.
Respond ONLY with a valid JSON object — no markdown, no extra text.

JSON format:
{
  "rankedSkills": [{ "skill": "<skill>", "confidence": <0-100 integer> }],
  "strengths": ["<matched strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<missing skill 1>", "<missing skill 2>", "<missing skill 3>"],
  "suggestions": ["<specific actionable suggestion 1>", "<suggestion 2>", "<suggestion 3>"],
  "interviewQuestions": ["<role-specific question 1>", "<question 2>", "<question 3>", "<question 4>", "<question 5>"],
  "rationale": "<2-3 sentences on overall fit>"
}

Rules:
- rankedSkills: skills from resume relevant to the target role, sorted by relevance (confidence 0-100)
- strengths: 3-4 areas where the resume matches the target role well
- weaknesses: 3-4 specific skills or experiences missing for the target role
- suggestions: 3-4 concrete, specific steps (name tools, courses, or keywords to add)
- interviewQuestions: 5 questions an interviewer would ask for this specific role
`.trim();

const mockRoleGapAnalysis = (targetRole) => ({
  rankedSkills: [
    { skill: 'JavaScript', confidence: 80 },
    { skill: 'Communication', confidence: 75 },
    { skill: 'Problem Solving', confidence: 78 },
  ],
  strengths: [
    `Relevant foundational knowledge for ${targetRole}`,
    'Strong project portfolio',
    'Good communication skills',
  ],
  weaknesses: [
    `Limited hands-on experience specific to ${targetRole}`,
    'Missing key domain certifications',
    'No metrics or KPIs in project descriptions',
  ],
  suggestions: [
    `Complete a ${targetRole}-specific course on Coursera or Udemy`,
    'Add 1-2 portfolio projects directly aligned with this role',
    'Incorporate quantified results in your resume (e.g. "Improved performance by 30%")',
    'Research and add role-specific keywords to pass ATS filters',
  ],
  interviewQuestions: [
    `Why do you want to transition to a ${targetRole} position?`,
    'Describe a project where you demonstrated a key skill for this role.',
    'How do you stay current with industry trends in this field?',
    'What gap in your experience do you most need to bridge?',
    'How would you approach your first 90 days in this role?',
  ],
  rationale: `Your background shows foundational alignment with the ${targetRole} role. With targeted skill development and a few role-specific projects, you can close the remaining gaps effectively.`,
});

const analyseRoleGap = async (resumeText, targetRole) => {
  if (!resumeText || resumeText.trim().length < 50) {
    throw new Error('Resume text is too short for analysis.');
  }
  if (!targetRole || targetRole.trim().length < 2) {
    throw new Error('Target role is required for gap analysis.');
  }

  if (!isRealGeminiKey() && !isRealClaudeKey()) {
    console.log('[AI] No API key — using mock role gap analysis.');
    return mockRoleGapAnalysis(targetRole);
  }

  try {
    const systemPrompt = buildRoleGapPrompt();
    const userMessage = `Target Role: ${targetRole.trim()}\n\nResume Text:\n\n${resumeText.substring(0, 6000)}`;
    const parsed = await callLLM(systemPrompt, userMessage, 1200);

    if (!Array.isArray(parsed.strengths) || !Array.isArray(parsed.weaknesses)) {
      throw new Error('Invalid structure in role gap analysis response');
    }
    if (Array.isArray(parsed.rankedSkills)) {
      parsed.rankedSkills = parsed.rankedSkills.map((s) => ({
        skill: s.skill || '',
        confidence: Math.min(100, Math.max(0, Math.round(Number(s.confidence) || 50))),
      }));
    }

    console.log(`[AI] Role gap analysis complete for: ${targetRole}`);
    return parsed;
  } catch (err) {
    console.warn(`[AI] analyseRoleGap failed: ${err.message}. Using mock.`);
    return mockRoleGapAnalysis(targetRole);
  }
};

// ── Duplicate answer helper (used by response.controller.js for Bug 3) ───────

/**
 * Check if the transcript is identical or near-identical to a previous answer
 * in the same session but for a DIFFERENT question.
 *
 * @param {string} sessionId
 * @param {string} currentQuestionId
 * @param {string} transcript
 * @returns {{ isDuplicate: boolean, matchedQuestionId: string|null }}
 */
const checkDuplicateAnswer = async (sessionId, currentQuestionId, transcript) => {
  try {
    const Response = require('../models/Response');
    const prevResponses = await Response.find({
      session_id: sessionId,
      question_id: { $ne: currentQuestionId },
    }).select('transcript question_id').lean();

    const normalise = (t) => t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    const normTranscript = normalise(transcript);

    for (const prev of prevResponses) {
      const normPrev = normalise(prev.transcript);
      // Exact match (after normalisation)
      if (normTranscript === normPrev) {
        return { isDuplicate: true, matchedQuestionId: prev.question_id.toString() };
      }
      // Near-identical: Jaccard similarity > 0.90
      const tokensA = new Set(normTranscript.split(' '));
      const tokensB = new Set(normPrev.split(' '));
      let intersection = 0;
      for (const t of tokensA) if (tokensB.has(t)) intersection++;
      const union = tokensA.size + tokensB.size - intersection;
      if (union > 0 && intersection / union > 0.90) {
        return { isDuplicate: true, matchedQuestionId: prev.question_id.toString() };
      }
    }
    return { isDuplicate: false, matchedQuestionId: null };
  } catch (_) {
    return { isDuplicate: false, matchedQuestionId: null };
  }
};

module.exports = {
  evaluateAnswer,
  generateQuestion,
  generateFinalReport,
  computeMetrics,
  analyseResumeSkills,
  analyseRoleGap,
  checkDuplicateAnswer,
};

