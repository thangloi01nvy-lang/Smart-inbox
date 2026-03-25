import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { Student, Class } from '../types';

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
  
  // Find which class the student is currently in
  const currentClass = classes.find(c => c.studentIds.includes(studentToEdit?.id || ''));
  const [classId, setClassId] = useState(currentClass?.id || 'unassigned');

  const handleSave = () => {
    if (!name.trim() || !id.trim()) return;
    
    onSave({
      id: id.trim().toUpperCase(),
      name: name.trim().toUpperCase(),
      dataPoints: studentToEdit?.dataPoints || 0,
      status: status,
      trend: studentToEdit?.trend || []
    }, classId);
  };

  return (
    <div className="flex flex-col h-full w-full font-mono pb-24 bg-background-dark">
      <div className="flex items-center justify-between p-4 border-b-2 border-border-harsh bg-background-dark sticky top-0 z-10">
        <button 
          onClick={() => onNavigate('ROSTER')}
          className="text-white hover:text-primary active:text-primary focus:outline-none">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-xl font-bold uppercase tracking-wider">&gt; {studentToEdit ? 'EDIT_STUDENT' : 'NEW_STUDENT'}</h1>
        <div className="w-6"></div>
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
          <label className="text-white text-xs font-bold uppercase tracking-widest" htmlFor="student_id">STUDENT_ID</label>
          <input 
            className="w-full bg-surface border-2 border-muted text-white p-3 text-base font-medium placeholder-muted uppercase focus:border-primary focus:bg-background-dark focus:outline-none transition-colors" 
            id="student_id" 
            placeholder="ID-XXXX" 
            type="text" 
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={!!studentToEdit}
          />
          {studentToEdit && <span className="text-[9px] text-muted italic">ID cannot be changed after creation</span>}
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
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t-2 border-border-harsh bg-background-dark flex flex-col gap-3 z-10">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
          <button 
            onClick={handleSave}
            disabled={!name.trim() || !id.trim()}
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
