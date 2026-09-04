# NextRound 🎯

**AI-Powered Mock Interview & Resume Analysis Platform**

NextRound helps job-seekers prepare for interviews with AI-powered mock sessions and intelligent resume analysis. Practice for SDE, Data Analyst, Frontend, Backend, HR, and more — get instant, structured feedback scored on relevance, structure (STAR method), clarity, and technical accuracy.

---

## ✨ Features

### 🎤 AI Mock Interviews
- **Role-specific questions** — SDE, Frontend, Backend, Data Analyst, HR, and custom roles
- **Adaptive difficulty** — Easy, Medium, Hard, or Adaptive mode that adjusts based on your performance
- **Real-time AI evaluation** — Each answer is scored across 4 dimensions: Relevance, Structure, Clarity, and Technical Accuracy
- **STAR method coaching** — Feedback specifically targets behavioral answer structure
- **Duplicate answer detection** — Prevents gaming the system by reusing the same answer for different questions
- **Question deduplication** — Questions are never repeated within a session
- **Session reports** — Detailed per-question breakdown with score timelines, radar charts, and topic performance

### 📄 Resume Analyzer
- **Upload PDF/DOC/DOCX** — Drag-and-drop resume upload (max 5 MB)
- **AI Skill Extraction** — Automatically identifies your technical and soft skills with confidence scores
- **Role Gap Analysis** — Enter your target role and get a detailed gap analysis showing:
  - Skills you have that match the role
  - Missing skills you need to develop
  - Personalized study recommendations
- **Guest access** — Resume analysis works without creating an account
- **Persistent analysis** — Signed-in users get their analysis saved and linked to their profile

### 📊 Dashboard & Reporting
- **Performance tracking** — Track your interview scores over time
- **Score trends** — See if you're improving session over session
- **Category performance** — Technical, Communication, and Problem Solving breakdowns
- **Topic-level scoring** — See which topics (React, SQL, System Design, etc.) you're strongest/weakest in
- **AI Coach Summary** — LLM-generated narrative summary of your strengths and areas to improve

### 🔐 Authentication
- **JWT-based auth** — Secure signup/login with email and password
- **Profile completion flow** — Gender, role, and experience level collection for personalized questions
- **Guest mode** — Resume analysis and some features available without signup

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **AI/LLM** | Google Gemini API (free tier) with Claude fallback |
| **Auth** | JWT (jsonwebtoken + bcryptjs) |
| **File Processing** | pdf-parse, mammoth (DOC/DOCX), multer |
| **Charts** | Recharts |

---

## 📁 Project Structure

```
NextRound/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/                # Axios instance & interceptors
│   │   ├── components/         # Reusable UI components (Navbar, etc.)
│   │   ├── context/            # AuthContext (JWT state management)
│   │   ├── pages/              # Route pages
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── InterviewPage.jsx
│   │   │   ├── InterviewSetupPage.jsx
│   │   │   ├── ReportPage.jsx
│   │   │   ├── ResumeAnalysisPage.jsx
│   │   │   ├── ResumeUploadPage.jsx
│   │   │   └── ProfileCompletePage.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
├── server/                     # Express.js backend
│   ├── config/                 # Database connection config
│   ├── controllers/
│   │   ├── auth.controller.js      # Signup, login, profile update
│   │   ├── session.controller.js   # Start/end interview sessions
│   │   ├── response.controller.js  # Submit answers, trigger evaluation
│   │   ├── analysis.controller.js  # Resume skill & gap analysis
│   │   └── report.controller.js    # Session report generation
│   ├── middleware/              # JWT auth middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── Question.js
│   │   ├── Response.js
│   │   ├── Report.js
│   │   ├── Resume.js
│   │   └── Analysis.js
│   ├── routes/                  # Express route definitions
│   ├── seed/                    # Question bank seeder
│   ├── services/
│   │   └── questionSelector.js  # Smart question selection engine
│   ├── utils/
│   │   ├── llm.js               # Gemini/Claude integration + mock evaluator
│   │   └── resumeExtractor.js   # PDF/DOC text extraction
│   ├── uploads/                 # Uploaded resume files (gitignored)
│   ├── .env.example
│   └── package.json
│
├── package.json                # Root workspace scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** (local or Atlas cloud)
- **Gemini API Key** (free) — get it at [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/nextround.git
cd nextround
```

### 2. Install Dependencies

```bash
# Install all dependencies (client + server)
npm run install:all
```

Or install separately:

```bash
npm install --prefix server
npm install --prefix client
```

### 3. Configure Environment Variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
# MongoDB connection
MONGO_URI=mongodb://localhost:27017/nextround

# JWT secret (change this!)
JWT_SECRET=your_super_secret_jwt_key_change_me

# Google Gemini API key (FREE Tier: 15 req/min, 1,500 req/day)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Anthropic Claude API key (fallback)
# ANTHROPIC_API_KEY=sk-ant-...

# Server port
PORT=5000

NODE_ENV=development
```

### 4. Seed the Question Bank

```bash
npm run seed
```

### 5. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
npm run dev:server

# Terminal 2 — Frontend (port 5173)
npm run dev:client
```

Open **http://localhost:5173** in your browser.

---

## 🧠 AI Integration

NextRound uses a multi-provider LLM strategy:

| Priority | Provider | Use Case |
|----------|----------|----------|
| 1st | **Google Gemini** (Free) | Answer evaluation with native `responseSchema` for structured JSON output |
| 2nd | **Anthropic Claude** | Fallback if Gemini key is not set |
| 3rd | **Mock Evaluator** | Offline mode with keyword-overlap relevance scoring |

### Key AI Features
- **Structured Output** — Uses Gemini's `system_instruction` + `responseSchema` for guaranteed JSON responses
- **Question-Anchored Scoring** — The evaluation prompt strictly checks if the answer addresses the specific question topic
- **Relevance Gating** — If an answer is off-topic (relevance ≤ 3), the overall score is capped at 3
- **Duplicate Detection** — Jaccard similarity check against previous answers in the same session

---

## 📄 Resume Analysis Flow

1. **Upload** → User uploads PDF/DOC/DOCX via drag-and-drop
2. **Extract** → Server extracts plain text using `pdf-parse` or `mammoth`
3. **Analyze Skills** → Gemini identifies skills with confidence scores from the resume text
4. **Gap Analysis** → User enters target role → Gemini compares extracted skills against role requirements
5. **Results** → Visual skill bars, matched/missing skills, study recommendations

> Resume analysis works for **guest users** too — no account required.

---

## 🛡️ API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| PATCH | `/api/auth/me` | ✅ | Update profile |
| POST | `/api/session/start` | ✅ | Start interview session |
| GET | `/api/session/:id` | ✅ | Get session details |
| POST | `/api/session/:id/end` | ✅ | End session |
| POST | `/api/response/submit` | ✅ | Submit answer + get evaluation |
| GET | `/api/session/:id/report` | ✅ | Get session report |
| GET | `/api/report/dashboard` | ✅ | Dashboard data |
| POST | `/api/resume/upload` | ⚠️ | Upload resume (auth optional) |
| GET | `/api/resume/latest` | ⚠️ | Get latest resume |
| POST | `/api/analysis/skill` | ⚠️ | Run skill analysis |
| POST | `/api/analysis/gap` | ⚠️ | Run role gap analysis |

> ⚠️ = Works for both authenticated users and guests

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <strong>Ankit</strong> — <em>Practice smart, interview confident.</em>
</p>
