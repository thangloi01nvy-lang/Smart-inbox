import React, { useMemo } from 'react';
import { ArrowLeft, Mic, Play, Brain, User, X, Plus, Send, TrendingUp, Music } from 'lucide-react';
import { AnalysisResult } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function AnalysisDetail({ onNavigate, analysisResult }: { onNavigate: (s: string) => void, analysisResult: AnalysisResult | null }) {
  
  const chartData = useMemo(() => {
    if (!analysisResult || analysisResult.students.length === 0) return [];
    
    const students = analysisResult.students;
    const maxDays = Math.max(...students.map(s => s.estimatedDaysToTarget || 30));
    const data = [];
    
    // Create data points for every 7 days (weekly) up to maxDays + 7
    for (let day = 0; day <= maxDays + 7; day += 7) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const point: any = { name: dateStr, day };
      students.forEach(s => {
        const estDays = s.estimatedDaysToTarget || 30;
        if (day <= estDays) {
          // Linear interpolation
          const progress = day / estDays;
          point[s.name] = Math.round(s.currentScore + (s.targetScore - s.currentScore) * progress);
        } else {
          // Cap at target score
          point[s.name] = s.targetScore;
        }
      });
      data.push(point);
    }
    return data;
  }, [analysisResult]);

  const colors = ['#00FF00', '#FF00FF', '#00FFFF', '#FFFF00', '#FF8800'];

  return (
    <div className="flex flex-col h-full w-full font-display pb-32">
      {/* Top Navigation */}
      <header className="flex items-center justify-between p-4 border-b-2 border-border-harsh bg-background-dark shrink-0 sticky top-0 z-50">
        <button 
          onClick={() => onNavigate('INBOX')}
          className="flex items-center justify-center w-10 h-10 bg-background-dark border-2 border-border-harsh text-white hover:bg-surface active:bg-border-harsh">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wider">&gt; ANALYSIS_DETAIL</h1>
        <div className="w-10 h-10"></div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Media Header */}
        <section className="bg-surface border-2 border-border-harsh p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {analysisResult?.audioUrl ? <Music className="text-primary w-8 h-8" /> : <Mic className="text-muted w-8 h-8" />}
              <div>
                <p className="font-bold text-sm uppercase">SESSION_MEDIA</p>
                <p className="text-muted text-xs">{analysisResult?.audioUrl ? 'CLOUD_STORED' : 'AI PROCESSED'}</p>
              </div>
            </div>
          </div>
          
          {analysisResult?.audioUrl && (
            <div className="mt-2 flex flex-col gap-2">
              <audio 
                src={analysisResult.audioUrl} 
                controls 
                className="w-full h-10 accent-primary"
                onError={(e) => {
                  // If the file was deleted from storage, the URL will fail
                  const target = e.target as HTMLAudioElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.audio-deleted-msg')) {
                    const msg = document.createElement('p');
                    msg.className = 'audio-deleted-msg text-[10px] text-primary font-bold uppercase italic';
                    msg.innerText = '[ AUDIO_DELETED_TO_SAVE_SPACE ]';
                    parent.appendChild(msg);
                  }
                }}
              />
            </div>
          )}
          
          {!analysisResult?.audioUrl && (
            <div className="h-2 bg-border-harsh w-full relative">
              <div className="absolute left-0 top-0 bottom-0 bg-primary w-[35%]"></div>
              <div className="absolute left-[35%] top-[-4px] bottom-[-4px] w-2 bg-white"></div>
            </div>
          )}
        </section>

        {/* AI Summary Box */}
        <section className="bg-surface border-2 border-accent p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Brain size={24} />
            <h2 className="text-sm font-bold uppercase tracking-widest">AI_DIAGNOSTICS_ACTIVE</h2>
          </div>
          
          {analysisResult ? (
            <div className="text-sm space-y-4 font-medium">
              <div className="text-white mb-4 italic">
                {analysisResult.summary}
              </div>
              {analysisResult.students.map((student, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-accent font-bold uppercase">&gt; STUDENT_IDENTIFIED: {student.name}</span>
                  <span className="text-white bg-[#1a1a1a] p-2 border-l-2 border-accent">
                    "{student.comment}"
                  </span>
                </div>
              ))}
              <div className="flex items-start gap-2 text-muted mt-2">
                <span className="mt-0.5">&gt;</span>
                <span>These comments will be automatically appended to their profiles upon confirmation.</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted">No analysis data available.</div>
          )}
        </section>

        {/* KPI Summary Section */}
        {analysisResult && analysisResult.students.length > 0 && (
          <section className="bg-surface border-2 border-border-harsh p-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white mb-2">
              <TrendingUp size={24} />
              <h2 className="text-sm font-bold uppercase tracking-widest">KEY_PERFORMANCE_INDICATORS</h2>
            </div>
            
            <div className="flex flex-col gap-6">
              {analysisResult.students.map((student, idx) => {
                const current = student.currentScore || 0;
                const target = student.targetScore || 100;
                const progress = Math.min(100, Math.max(0, (current / target) * 100));
                
                return (
                  <div key={idx} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="font-bold uppercase text-sm">{student.name}</span>
                      <span className="text-xs text-muted font-mono">
                        {current} / {target} ({student.estimatedDaysToTarget || '?'} DAYS TO TARGET)
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-4 w-full bg-background-dark border-2 border-border-harsh relative overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 bottom-0 bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                      {/* Target Marker */}
                      <div 
                        className="absolute top-0 bottom-0 w-1 bg-white z-10"
                        style={{ left: '100%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Target Projection Chart */}
        {analysisResult && analysisResult.students.length > 0 && (
          <section className="bg-surface border-2 border-border-harsh p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-white mb-2">
              <TrendingUp size={24} />
              <h2 className="text-sm font-bold uppercase tracking-widest">TARGET_PROJECTION</h2>
            </div>
            <div className="text-xs text-muted mb-2">
              Estimated days to reach target score based on current performance.
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#888" fontSize={10} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '2px solid #333', borderRadius: 0 }}
                    itemStyle={{ fontSize: 12, fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  {analysisResult.students.map((student, idx) => (
                    <Line 
                      key={student.name}
                      type="monotone" 
                      dataKey={student.name} 
                      stroke={colors[idx % colors.length]} 
                      strokeWidth={2}
                      dot={{ r: 3, fill: colors[idx % colors.length] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Transcript Box */}
        <section className="flex-1 flex flex-col gap-2 min-h-[300px]">
          <h3 className="text-xs font-bold text-muted uppercase tracking-widest border-b-2 border-border-harsh pb-2">RAW_TRANSCRIPT</h3>
          <div className="bg-background-dark text-sm leading-loose py-2">
            {analysisResult ? (
              <p className="text-white whitespace-pre-wrap">{analysisResult.transcript}</p>
            ) : (
              <p className="text-muted">No transcript available.</p>
            )}
          </div>
        </section>
      </main>

      {/* Sticky Bottom Actions */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background-dark border-t-2 border-border-harsh p-4 flex flex-col gap-4 z-50">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
          {/* Student Tags */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {analysisResult?.students.map((student, idx) => (
              <div key={idx} className="bg-surface border-2 border-border-harsh px-3 py-1.5 flex items-center gap-2 shrink-0">
                <User size={16} className="text-muted" />
                <span className="text-xs font-bold uppercase">{student.name}</span>
                <button className="text-muted hover:text-white ml-2"><X size={16} /></button>
              </div>
            ))}
            <button className="bg-transparent border-2 border-dashed border-border-harsh text-muted px-3 py-1.5 flex items-center gap-1 shrink-0 hover:text-white hover:border-white">
              <Plus size={16} />
              <span className="text-xs font-bold uppercase">TAG</span>
            </button>
          </div>

          {/* Main Action */}
          <button 
            onClick={() => onNavigate('ROSTER')}
            className="w-full bg-accent text-black font-bold text-lg py-4 border-2 border-border-harsh active:bg-white uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-white">
            [ SAVE_TO_PROFILES ]
            <Send size={24} />
          </button>
        </div>
      </footer>
    </div>
  );
}
