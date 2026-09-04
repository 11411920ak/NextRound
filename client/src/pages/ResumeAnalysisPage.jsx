import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Upload, Zap, Target, ChevronRight, RefreshCw,
  CheckCircle, XCircle, Lightbulb, HelpCircle, Star,
  TrendingUp, AlertTriangle, BarChart2, Sparkles, UserPlus, LogIn, ArrowRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Sub-components ────────────────────────────────────────────────────────────

const SkillBar = ({ skill, confidence }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-slate-300 font-medium">{skill}</span>
      <span className="text-slate-500">{confidence}%</span>
    </div>
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${confidence}%` }}
      />
    </div>
  </div>
);

const TagList = ({ items, colorClass }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item, i) => (
      <span
        key={i}
        className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${colorClass}`}
      >
        {item}
      </span>
    ))}
  </div>
);

const SectionCard = ({ icon: Icon, iconColor, title, children }) => (
  <div className="glass-card p-5 space-y-4">
    <div className="flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-semibold text-white text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

const LoadingOverlay = ({ text }) => (
  <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="glass-card px-10 py-8 flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 rounded-full border-4 border-brand-600/30 border-t-brand-500 animate-spin" />
      <div>
        <p className="text-white font-semibold">{text}</p>
        <p className="text-slate-400 text-sm mt-1">This may take 15–30 seconds</p>
      </div>
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

const ResumeAnalysisPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [guestResume, setGuestResume] = useState(null);
  const [latestSkill, setLatestSkill] = useState(null);
  const [latestGap, setLatestGap] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);

  const [uploadingInline, setUploadingInline] = useState(false);
  const [analysingSkill, setAnalysingSkill] = useState(false);
  const [analysingGap, setAnalysingGap] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [targetRoleError, setTargetRoleError] = useState('');

  // Active tab: 'skill' | 'gap'
  const [activeTab, setActiveTab] = useState('skill');

  const fetchData = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const [resumeRes, analysisRes] = await Promise.all([
          api.get('/resume/mine'),
          api.get('/analysis/latest'),
        ]);
        setResumes(resumeRes.data.resumes || []);
        setLatestSkill(analysisRes.data.skillAnalysis || null);
        setLatestGap(analysisRes.data.gapAnalysis || null);
      } catch (err) {
        console.error('[ResumeAnalysis] Failed to load user data:', err);
      } finally {
        setLoadingInit(false);
      }
    } else {
      // Guest mode — check localStorage
      const guestId = localStorage.getItem('guest_resume_id');
      const guestName = localStorage.getItem('guest_resume_name');
      if (guestId && guestName) {
        setGuestResume({ _id: guestId, original_name: guestName, isGuest: true });
      }
      setLoadingInit(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeResume = isAuthenticated ? (resumes[0] || null) : guestResume;
  const hasResume = !!activeResume;

  // ── Inline Resume Upload ──────────────────────────────────────────────────
  const handleInlineUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimes.includes(file.type)) {
      toast.error('Only PDF, DOC, and DOCX files are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5 MB limit.');
      return;
    }

    setUploadingInline(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const { data } = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.resume?._id) {
        const newResumeObj = {
          _id: data.resume._id,
          original_name: data.resume.original_name,
          file_type: data.resume.file_type,
          uploaded_at: data.resume.uploaded_at || new Date().toISOString(),
          isGuest: !isAuthenticated,
        };

        if (isAuthenticated) {
          setResumes([newResumeObj, ...resumes]);
        } else {
          localStorage.setItem('guest_resume_id', data.resume._id);
          localStorage.setItem('guest_resume_name', data.resume.original_name);
          setGuestResume(newResumeObj);
        }
        toast.success('Resume uploaded successfully! 🎉');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploadingInline(false);
    }
  };

  // ── Feature A — Skill analysis ────────────────────────────────────────────
  const handleAnalyseSkills = async () => {
    if (!hasResume) { toast.error('Please upload your resume first.'); return; }
    setAnalysingSkill(true);
    try {
      const { data } = await api.post('/analysis/skill', {
        resume_id: activeResume._id,
      });

      setLatestSkill(data.analysis);
      setActiveTab('skill');

      if (!isAuthenticated && data.analysis?._id) {
        const existing = JSON.parse(localStorage.getItem('guest_analysis_ids') || '[]');
        localStorage.setItem('guest_analysis_ids', JSON.stringify([...existing, data.analysis._id]));
      }

      toast.success('Skill analysis complete! ✨');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setAnalysingSkill(false);
    }
  };

  // ── Feature B — Role gap analysis ─────────────────────────────────────────
  const handleAnalyseGap = async () => {
    if (!targetRole.trim()) { setTargetRoleError('Please enter a target role.'); return; }
    if (!hasResume) { toast.error('Please upload your resume to run the gap analysis.'); return; }
    setTargetRoleError('');
    setAnalysingGap(true);
    try {
      const { data } = await api.post('/analysis/gap', {
        resume_id: activeResume._id,
        target_role: targetRole.trim(),
      });

      setLatestGap(data.analysis);
      setActiveTab('gap');

      if (!isAuthenticated && data.analysis?._id) {
        const existing = JSON.parse(localStorage.getItem('guest_analysis_ids') || '[]');
        localStorage.setItem('guest_analysis_ids', JSON.stringify([...existing, data.analysis._id]));
      }

      toast.success('Role gap analysis complete! 🎯');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setAnalysingGap(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-600/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleInlineUpload}
        className="hidden"
      />

      {/* Loading overlays */}
      {uploadingInline && <LoadingOverlay text="Uploading & extracting resume text…" />}
      {analysingSkill && <LoadingOverlay text="Analysing your resume skills with AI…" />}
      {analysingGap && <LoadingOverlay text="Running target role gap analysis…" />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-brand-400" />
            AI Resume Analyzer & Job Fit
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Instantly discover your top skills, job recommendations & role gap feedback
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          {hasResume ? 'Change Resume' : 'Upload Resume'}
        </button>
      </div>

      {/* ── Guest Welcome / Feature-First Callout ──────────────────────────── */}
      {!isAuthenticated && (
        <div className="glass-card p-4 bg-gradient-to-r from-brand-900/30 via-violet-900/20 to-transparent border-brand-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/30 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-brand-300" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Instant Guest Analysis Available!</p>
              <p className="text-slate-400 text-xs mt-0.5">Upload your resume below to try the AI analyzer without registering.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/signup" className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" /> Sign Up Free
            </Link>
            <Link to="/login" className="btn-ghost text-xs py-2 px-3 flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" /> Login
            </Link>
          </div>
        </div>
      )}

      {/* ── Target Role First or Resume First Header Card ────────────────── */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-white font-semibold text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-400" />
              1. Choose Analysis Entry Point
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Start by typing your target role first, or drop your resume for automated job field discovery.
            </p>
          </div>

          {/* Active Resume Indicator / Upload Button */}
          {hasResume ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
              <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 text-xs font-medium truncate max-w-[200px]">
                {activeResume.original_name}
              </span>
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-xs py-2 px-4 flex items-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" /> Select Resume PDF/DOC
            </button>
          )}
        </div>

        {/* Entry Option Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Target Role Entry */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Option A: Enter Target Role First
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={targetRole}
                onChange={(e) => { setTargetRole(e.target.value); setTargetRoleError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyseGap()}
                placeholder="e.g. Full Stack Engineer, Product Manager..."
                className={`input-field text-sm flex-1 ${targetRoleError ? 'border-red-500/60' : ''}`}
              />
            </div>
            {targetRoleError && <p className="text-xs text-red-400">⚠ {targetRoleError}</p>}
            <button
              onClick={handleAnalyseGap}
              disabled={analysingGap}
              className="w-full btn-secondary text-xs py-2.5 flex items-center justify-center gap-2 text-violet-300 border-violet-500/30 hover:bg-violet-600/20"
            >
              <Target className="w-3.5 h-3.5 text-violet-400" />
              {hasResume ? 'Run Role Gap Analysis' : 'Upload Resume & Run Gap Analysis'}
            </button>
          </div>

          {/* Direct Skill Recommendation Entry */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Option B: General Skill & Career Discovery
              </label>
              <p className="text-slate-400 text-xs">
                Let AI automatically detect your top strengths and recommend your ideal career field.
              </p>
            </div>
            <button
              onClick={handleAnalyseSkills}
              disabled={analysingSkill}
              className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              {hasResume ? 'Analyse Resume Skills' : 'Upload Resume & Discover Career Fit'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Results Area ─────────────────────────────────────────────────── */}
      {(latestSkill || latestGap) && (
        <div className="space-y-6">
          {/* Tab Switcher */}
          {latestSkill && latestGap && (
            <div className="flex rounded-xl overflow-hidden border border-white/10 w-fit">
              <button
                onClick={() => setActiveTab('skill')}
                className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'skill'
                    ? 'bg-brand-600/25 text-brand-300'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Skill Recommendation
              </button>
              <button
                onClick={() => setActiveTab('gap')}
                className={`px-5 py-2.5 text-sm font-medium border-l border-white/10 transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'gap'
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <Target className="w-3.5 h-3.5" /> Role Gap Analysis
              </button>
            </div>
          )}

          {/* ── Skill Analysis Results ──────────────────────────────────── */}
          {activeTab === 'skill' && latestSkill && (() => {
            const r = latestSkill.result;
            return (
              <div className="space-y-5 animate-fade-in">
                {/* Recommended Field Banner */}
                {r.recommendedField && (
                  <div className="glass-card p-6 bg-gradient-to-r from-brand-900/30 to-violet-900/20 border-brand-500/25">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-600/30 flex items-center justify-center shrink-0">
                        <Star className="w-6 h-6 text-brand-300" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">Best-fit career field</p>
                        <h2 className="text-2xl font-bold text-white">{r.recommendedField}</h2>
                        {r.rationale && <p className="text-slate-400 text-sm mt-2">{r.rationale}</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Ranked Skills */}
                  {r.rankedSkills?.length > 0 && (
                    <SectionCard icon={BarChart2} iconColor="bg-brand-600/20 text-brand-400" title="Your Top Skills">
                      <div className="space-y-3">
                        {r.rankedSkills.slice(0, 8).map((s) => (
                          <SkillBar key={s.skill} skill={s.skill} confidence={s.confidence} />
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  <div className="space-y-5">
                    {/* Strengths */}
                    {r.strengths?.length > 0 && (
                      <SectionCard icon={CheckCircle} iconColor="bg-emerald-500/15 text-emerald-400" title="Strengths">
                        <TagList items={r.strengths} colorClass="bg-emerald-500/10 text-emerald-300 border-emerald-500/20" />
                      </SectionCard>
                    )}
                    {/* Weaknesses */}
                    {r.weaknesses?.length > 0 && (
                      <SectionCard icon={AlertTriangle} iconColor="bg-amber-500/15 text-amber-400" title="Areas to Improve">
                        <TagList items={r.weaknesses} colorClass="bg-amber-500/10 text-amber-300 border-amber-500/20" />
                      </SectionCard>
                    )}
                  </div>
                </div>

                {/* Suggestions */}
                {r.suggestions?.length > 0 && (
                  <SectionCard icon={Lightbulb} iconColor="bg-violet-500/15 text-violet-400" title="Actionable Suggestions">
                    <ul className="space-y-2.5">
                      {r.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
                          <ChevronRight className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}

                {/* Interview Questions */}
                {r.interviewQuestions?.length > 0 && (
                  <SectionCard icon={HelpCircle} iconColor="bg-sky-500/15 text-sky-400" title="Likely Interview Questions">
                    <ol className="space-y-3">
                      {r.interviewQuestions.map((q, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-slate-300">{q}</span>
                        </li>
                      ))}
                    </ol>
                    {isAuthenticated ? (
                      <Link
                        to="/interview/setup"
                        className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
                      >
                        Start Mock Interview Session <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link
                        to="/signup"
                        className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
                      >
                        Sign Up to Practice Mock Interviews <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </SectionCard>
                )}
              </div>
            );
          })()}

          {/* ── Gap Analysis Results ────────────────────────────────────── */}
          {activeTab === 'gap' && latestGap && (() => {
            const r = latestGap.result;
            return (
              <div className="space-y-5 animate-fade-in">
                {/* Target Role Banner */}
                <div className="glass-card p-6 bg-gradient-to-r from-violet-900/30 to-brand-900/20 border-violet-500/25">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-600/30 flex items-center justify-center shrink-0">
                      <Target className="w-6 h-6 text-violet-300" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-1">Target role</p>
                      <h2 className="text-2xl font-bold text-white">{latestGap.target_role}</h2>
                      {r.rationale && <p className="text-slate-400 text-sm mt-2">{r.rationale}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Ranked Skills */}
                  {r.rankedSkills?.length > 0 && (
                    <SectionCard icon={BarChart2} iconColor="bg-violet-600/20 text-violet-400" title="Relevant Skills for This Role">
                      <div className="space-y-3">
                        {r.rankedSkills.slice(0, 8).map((s) => (
                          <SkillBar key={s.skill} skill={s.skill} confidence={s.confidence} />
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  <div className="space-y-5">
                    {/* Strengths */}
                    {r.strengths?.length > 0 && (
                      <SectionCard icon={CheckCircle} iconColor="bg-emerald-500/15 text-emerald-400" title="Role Match — Strengths">
                        <TagList items={r.strengths} colorClass="bg-emerald-500/10 text-emerald-300 border-emerald-500/20" />
                      </SectionCard>
                    )}
                    {/* Gaps */}
                    {r.weaknesses?.length > 0 && (
                      <SectionCard icon={XCircle} iconColor="bg-red-500/15 text-red-400" title="Skill Gaps to Bridge">
                        <TagList items={r.weaknesses} colorClass="bg-red-500/10 text-red-300 border-red-500/20" />
                      </SectionCard>
                    )}
                  </div>
                </div>

                {/* Suggestions */}
                {r.suggestions?.length > 0 && (
                  <SectionCard icon={TrendingUp} iconColor="bg-violet-500/15 text-violet-400" title="How to Close the Gap">
                    <ul className="space-y-2.5">
                      {r.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
                          <ChevronRight className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </SectionCard>
                )}

                {/* Role-specific Interview Questions */}
                {r.interviewQuestions?.length > 0 && (
                  <SectionCard icon={HelpCircle} iconColor="bg-sky-500/15 text-sky-400" title={`Interview Questions for ${latestGap.target_role}`}>
                    <ol className="space-y-3">
                      {r.interviewQuestions.map((q, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-slate-300">{q}</span>
                        </li>
                      ))}
                    </ol>
                    {isAuthenticated ? (
                      <Link
                        to="/interview/setup"
                        className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
                      >
                        Practice These Questions <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link
                        to="/signup"
                        className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2"
                      >
                        Sign Up to Practice Mock Interviews <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </SectionCard>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Guest Bottom CTA Banner ───────────────────────────────────────── */}
      {!isAuthenticated && (latestSkill || latestGap) && (
        <div className="glass-card p-8 bg-gradient-to-r from-brand-900/40 via-violet-900/30 to-brand-900/40 border-brand-500/40 text-center space-y-4 animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-brand-600/30 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-brand-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Save Your Analysis & Unlock Interactive AI Mock Interviews</h3>
            <p className="text-slate-300 text-sm max-w-xl mx-auto mt-1">
              Create a free account to automatically save your resume analysis, track your interview readiness over time, and practice live AI interviews.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to="/signup" className="btn-primary flex items-center gap-2 text-sm py-2.5 px-6">
              <UserPlus className="w-4 h-4" /> Create Free Account
            </Link>
            <Link to="/login" className="btn-secondary flex items-center gap-2 text-sm py-2.5 px-6">
              <LogIn className="w-4 h-4" /> Log In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysisPage;
