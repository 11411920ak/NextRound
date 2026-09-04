import {
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';

// ── Custom tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-white/15 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-2 max-w-[180px] truncate">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400 capitalize">{p.dataKey.replace('_score', '')}:</span>
          <span className="font-bold text-white">{p.value}/10</span>
        </div>
      ))}
    </div>
  );
};

// ── Score Timeline (Area chart) ───────────────────────────────────────────────
export const ScoreTimeline = ({ data }) => {
  if (!data?.length) return null;

  const chartData = data.map((item, i) => ({
    name: `Q${item.question_index + 1}`,
    label: item.question_text,
    overall_score: item.overall_score,
    relevance_score: item.relevance_score,
    structure_score: item.structure_score,
    clarity_score: item.clarity_score,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} formatter={(v) => v.replace('_score', '')} />
        <Area type="monotone" dataKey="overall_score" stroke="#6366f1" strokeWidth={2.5} fill="url(#overallGrad)" dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#1e293b' }} name="overall_score" />
        <Line type="monotone" dataKey="relevance_score" stroke="#38bdf8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="relevance_score" />
        <Line type="monotone" dataKey="structure_score" stroke="#a78bfa" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="structure_score" />
        <Line type="monotone" dataKey="clarity_score" stroke="#34d399" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="clarity_score" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ── Radar Chart ───────────────────────────────────────────────────────────────
export const ScoreRadar = ({ avgRelevance, avgStructure, avgClarity }) => {
  const data = [
    { metric: 'Relevance', score: avgRelevance },
    { metric: 'Structure', score: avgStructure },
    { metric: 'Clarity', score: avgClarity },
    { metric: 'Overall', score: Math.round(((avgRelevance + avgStructure + avgClarity) / 3) * 10) / 10 },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#475569', fontSize: 10 }} />
        <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default ScoreTimeline;
