import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronDown, TrendingUp } from 'lucide-react';
import { Student, Class } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface EditStudentProps {
  onNavigate: (s: string) => void;
  studentToEdit: Student | null;
  classes: Class[];
  onSave: (student: Student, classId: string) => void;
  onArchive: (id: string) => void;
}

export function EditStudent({ onNavigate, studentToEdit, classes, onSave, onArchive }: EditStudentProps) {
  const [name, setName] = useState(studentToEdit?.name || '');
  const [id, setId] = useState(studentToEdit?.id || '');
  const [status, setStatus] = useState<'READY' | 'PENDING'>(studentToEdit?.status || 'PENDING');
  
  const currentClass = classes.find(c => c.id === studentToEdit?.classId);
  const [classId, setClassId] = useState(currentClass?.id || 'unassigned');

  const trendData = useMemo(() => {
    if (!studentToEdit?.trend || studentToEdit.trend.length === 0) return [];
    return studentToEdit.trend.map((score, index) => ({
      session: `S${index + 1}`,
      score: score
    }));
  }, [studentToEdit?.trend]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    // Auto-generate ID if it's a new student
    const finalId = studentToEdit?.id || `STU_${Date.now()}`;

    onSave({
      id: finalId,
      name: name.trim().toUpperCase(),
      dataPoints: studentToEdit?.dataPoints || 0,
      status: status,
      trend: studentToEdit?.trend || [],
      classId: classId === 'unassigned' ? 'UNASSIGNED' : classId,
      teacherUid: studentToEdit?.teacherUid || '',
      currentScore: studentToEdit?.currentScore || 0,
      targetScore: studentToEdit?.targetScore || 100,
      estimatedDaysToTarget: studentToEdit?.estimatedDaysToTarget || 0,
      lastComment: studentToEdit?.lastComment || '',
      lastAnalysisDate: studentToEdit?.lastAnalysisDate || ''
    }, classId === 'unassigned' ? 'UNASSIGNED' : classId);
  };

  return (
    <div className="flex flex-col h-full w-full font-mono pb-24 bg-background-dark">
      <div className="flex items-center justify-between p-4 border-b-2 border-border-harsh bg-background-dark sticky top-0 z-10 gap-3">
        <button 
          onClick={() => onNavigate('ROSTER')}
          className="text-white hover:text-primary active:text-primary focus:outline-none shrink-0">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-lg sm:text-xl font-bold uppercase tracking-wider flex-1 truncate">&gt; {studentToEdit ? 'EDIT_STUDENT' : 'NEW_STUDENT'}</h1>
        <div className="w-6 shrink-0"></div>
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="text-muted text-[10px] font-mono uppercase tracking-widest border-b border-border-harsh pb-2 mb-2">
          [SYS_MSG] RECORD_ID: {studentToEdit?.id || 'NEW'} | STATUS: {status}
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-white text-xs font-bold uppercase tracking-widest" htmlFor="student_name">STUDENT_NAME</label>
          <input 
            className="w-full bg-surface border-2 border-muted text-white p-3 text-base font-medium placeholder-muted uppercase focus:border-primary focus:bg-background-dark focus:outline-none transition-colors" 
            id="student_name" 
            placeholder="ENTER FULL NAME..." 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-white text-xs font-bold uppercase tracking-widest" htmlFor="class_routing">CLASS_ROUTING</label>
          <div className="relative">
            <select 
              className="w-full bg-surface border-2 border-muted text-white p-3 text-base font-medium uppercase appearance-none focus:border-primary focus:bg-background-dark cursor-pointer focus:outline-none transition-colors" 
              id="class_routing"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="unassigned">-- UNASSIGNED --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted">
              <ChevronDown size={18} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white text-xs font-bold uppercase tracking-widest">QUICK_ACTIONS</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setStatus('READY')}
              className={`flex-1 py-3 border-2 font-bold text-xs uppercase transition-all ${status === 'READY' ? 'bg-accent text-black border-accent' : 'border-border-harsh text-muted hover:border-accent'}`}>
              [SET_READY]
            </button>
            <button 
              onClick={() => setStatus('PENDING')}
              className={`flex-1 py-3 border-2 font-bold text-xs uppercase transition-all ${status === 'PENDING' ? 'bg-primary text-black border-primary' : 'border-border-harsh text-muted hover:border-primary'}`}>
              [SET_PENDING]
            </button>
          </div>
        </div>
        
        {studentToEdit && (
          <div className="mt-4 p-3 border-2 border-border-harsh bg-surface flex flex-col gap-1">
            <div className="flex justify-between text-[10px] text-muted font-mono uppercase">
              <span>TOTAL_CAPTURES:</span>
              <span className="text-white">{studentToEdit.dataPoints}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted font-mono uppercase">
              <span>CURRENT_STATUS:</span>
              <span className={status === 'READY' ? 'text-accent' : 'text-primary'}>{status}</span>
            </div>
          </div>
        )}

        {trendData.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-white mb-2">
              <TrendingUp size={20} className="text-primary" />
              <label className="text-xs font-bold uppercase tracking-widest">SCORE_PROGRESSION</label>
            </div>
            <div className="bg-surface border-2 border-border-harsh p-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="session" 
                    stroke="#888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 100]} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', color: '#fff' }}
                    itemStyle={{ color: '#00FF00' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#00FF00" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#00FF00' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {studentToEdit?.comments && studentToEdit.comments.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            <label className="text-white text-xs font-bold uppercase tracking-widest">FEEDBACK_HISTORY</label>
            <div className="flex flex-col gap-3">
              {[...studentToEdit.comments].reverse().map((c, i) => (
                <div key={i} className="bg-surface border-2 border-border-harsh p-3 flex flex-col gap-2">
                  <span className="text-[10px] text-primary font-bold uppercase">{new Date(c.date).toLocaleString()}</span>
                  <p className="text-sm text-white leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t-2 border-border-harsh bg-background-dark flex flex-col gap-3 z-10">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full bg-accent text-background-dark font-bold text-base py-4 px-6 uppercase tracking-widest hover:bg-white focus:outline-none border-2 border-accent hover:border-white disabled:opacity-50">
            [ SAVE_STUDENT ]
          </button>
          {studentToEdit && (
            <button 
              onClick={() => onArchive(studentToEdit.id)}
              className="w-full bg-transparent text-primary font-bold text-base py-4 px-6 uppercase tracking-widest border-2 border-primary hover:bg-primary hover:text-background-dark focus:outline-none">
              [ ARCHIVE_STUDENT ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
