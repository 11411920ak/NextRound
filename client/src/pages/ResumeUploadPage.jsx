import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Upload, FileText, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTS = ['.pdf', '.doc', '.docx'];
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ResumeUploadPage = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = (f) => {
    if (!f) return 'Please select a file.';
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext) || !ALLOWED_TYPES.includes(f.type)) {
      return 'Only PDF, DOC, and DOCX files are accepted.';
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File is too large. Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    return '';
  };

  const handleFileSelect = (f) => {
    const err = validateFile(f);
    setFileError(err);
    setFile(err ? null : f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleInputChange = (e) => {
    const selected = e.target.files[0];
    if (selected) handleFileSelect(selected);
  };

  const handleRemove = () => {
    setFile(null);
    setFileError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) { setFileError('Please select a file first.'); return; }
    const err = validateFile(file);
    if (err) { setFileError(err); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const { data } = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });

      if (data.resume?._id) {
        localStorage.setItem('guest_resume_id', data.resume._id);
        localStorage.setItem('guest_resume_name', data.resume.original_name);
      }

      toast.success('Resume uploaded successfully! 🎉');
      navigate('/resume', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed. Please try again.';
      setFileError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    return ext === 'pdf' ? '📄' : '📝';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-brand-600 flex items-center justify-center shadow-2xl shadow-emerald-500/25 mb-4">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Upload your resume</h1>
          <p className="text-slate-400 mt-2 text-sm">
            PDF, DOC, or DOCX — max {MAX_SIZE_MB} MB
          </p>
        </div>

        <div className="glass-card p-8 space-y-6">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !file && inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
              dragOver
                ? 'border-brand-400 bg-brand-600/10'
                : file
                ? 'border-emerald-500/40 bg-emerald-500/5 cursor-default'
                : 'border-white/15 hover:border-white/30 hover:bg-white/3'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleInputChange}
              className="hidden"
              id="resume-file-input"
            />

            {file ? (
              /* File selected state */
              <div className="space-y-3">
                <div className="text-4xl">{getFileIcon(file.name)}</div>
                <div>
                  <p className="text-white font-semibold text-sm truncate max-w-xs mx-auto">{file.name}</p>
                  <p className="text-slate-400 text-xs mt-1">{formatSize(file.size)}</p>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Ready to upload
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Empty state */
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-300 font-medium">Drag & drop your resume here</p>
                  <p className="text-slate-500 text-sm mt-1">or <span className="text-brand-400 font-medium">click to browse</span></p>
                </div>
                <p className="text-slate-600 text-xs">Supports PDF, DOC, DOCX up to {MAX_SIZE_MB} MB</p>
              </div>
            )}
          </div>

          {/* Error */}
          {fileError && (
            <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-400 text-sm">{fileError}</p>
            </div>
          )}

          {/* Accepted formats */}
          <div className="flex items-center gap-2 flex-wrap">
            {['PDF', 'DOC', 'DOCX'].map((fmt) => (
              <span key={fmt} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 font-mono">
                .{fmt.toLowerCase()}
              </span>
            ))}
            <span className="text-slate-600 text-xs ml-auto">Max {MAX_SIZE_MB} MB</span>
          </div>

          {/* Upload button */}
          <button
            id="resume-upload-submit"
            onClick={handleUpload}
            disabled={!file || loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Upload Resume
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Skip */}
          <button
            type="button"
            onClick={() => navigate('/resume')}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-400 transition-colors"
          >
            Skip for now →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploadPage;
