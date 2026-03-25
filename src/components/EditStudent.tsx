import React from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';

export function EditStudent({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="flex flex-col h-full w-full font-display pb-24">
      <div className="flex items-center justify-between p-4 border-b-2 border-border-harsh bg-background-dark sticky top-0 z-10">
        <button 
          onClick={() => onNavigate('ROSTER')}
          className="text-white hover:text-primary active:text-primary focus:outline-none">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-xl font-bold uppercase tracking-wider">&gt; EDIT_STUDENT</h1>
        <div className="w-6"></div>
      </div>
      
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="text-muted text-xs font-mono uppercase tracking-widest border-b-2 border-border-harsh pb-2 mb-2">
          [SYS_MSG] RECORD_ID: STU-8492-X | STATUS: ACTIVE
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-white text-sm font-bold uppercase tracking-widest" htmlFor="student_name">STUDENT_NAME</label>
          <input 
            className="w-full bg-surface border-2 border-muted text-white p-3 text-base font-medium placeholder-muted uppercase focus:border-white focus:bg-background-dark focus:outline-none" 
            id="student_name" 
            placeholder="ENTER FULL NAME..." 
            type="text" 
            defaultValue="NGUYEN VAN A" 
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-white text-sm font-bold uppercase tracking-widest" htmlFor="student_id">STUDENT_ID</label>
          <input 
            className="w-full bg-surface border-2 border-muted text-white p-3 text-base font-medium placeholder-muted uppercase focus:border-white focus:bg-background-dark focus:outline-none" 
            id="student_id" 
            placeholder="ID-XXXX" 
            type="text" 
            defaultValue="ID-8492" 
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-white text-sm font-bold uppercase tracking-widest" htmlFor="class_routing">CLASS_ROUTING</label>
          <div className="relative">
            <select 
              className="w-full bg-surface border-2 border-muted text-white p-3 text-base font-medium uppercase appearance-none focus:border-white focus:bg-background-dark cursor-pointer focus:outline-none" 
              id="class_routing"
              defaultValue="class_b"
            >
              <option value="class_a">IELTS INTENSIVE A</option>
              <option value="class_b">BEGINNER COMM B</option>
              <option value="class_c">TOEFL PREP C</option>
              <option value="unassigned">-- UNASSIGNED --</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted">
              <ChevronDown size={20} />
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 border-2 border-border-harsh bg-surface flex flex-col gap-1">
          <div className="flex justify-between text-xs text-muted font-mono uppercase">
            <span>TOTAL_CAPTURES:</span>
            <span className="text-white">42</span>
          </div>
          <div className="flex justify-between text-xs text-muted font-mono uppercase">
            <span>LAST_SEEN:</span>
            <span className="text-white">2023-10-24 14:32</span>
          </div>
        </div>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t-2 border-border-harsh bg-background-dark flex flex-col gap-3 z-10">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
          <button 
            onClick={() => onNavigate('ROSTER')}
            className="w-full bg-accent text-background-dark font-bold text-base py-4 px-6 uppercase tracking-widest hover:bg-white focus:outline-none border-2 border-accent hover:border-white">
            [ SAVE_STUDENT ]
          </button>
          <button 
            onClick={() => onNavigate('ROSTER')}
            className="w-full bg-transparent text-primary font-bold text-base py-4 px-6 uppercase tracking-widest border-2 border-primary hover:bg-primary hover:text-background-dark focus:outline-none">
            [ ARCHIVE_STUDENT ]
          </button>
        </div>
      </div>
    </div>
  );
}
