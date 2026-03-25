import React from 'react';
import { ArrowLeft, Send } from 'lucide-react';

export function ReportGen({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="flex flex-col items-center h-full w-full font-display pb-24">
      {/* App Header */}
      <header className="w-full max-w-md bg-surface border-b-2 border-border-harsh sticky top-0 z-50 no-print">
        <div className="flex items-center p-4">
          <button 
            onClick={() => onNavigate('ROSTER')}
            aria-label="Go Back" 
            className="text-white flex w-12 h-12 shrink-0 items-center justify-center border-2 border-border-harsh hover:bg-[#333333] active:bg-primary mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold uppercase tracking-widest flex-1 truncate">&gt; REPORT_GEN</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md px-4 mt-6 flex-1 flex flex-col gap-6 print-container">
        {/* Instructions / Status (No Print) */}
        <div className="bg-surface border-2 border-border-harsh p-3 no-print">
          <p className="text-muted text-xs uppercase font-bold tracking-wider mb-1">SYSTEM STATUS</p>
          <p className="text-accent text-sm uppercase font-mono">&gt; REPORT COMPILED. READY FOR DISPATCH.</p>
        </div>

        {/* Document Preview Canvas */}
        <div className="bg-white text-black border-2 border-border-harsh w-full flex flex-col relative overflow-hidden">
          {/* Document Header */}
          <div className="p-5 border-b-2 border-black bg-white flex flex-col gap-2">
            <h2 className="text-3xl font-bold uppercase tracking-tighter leading-none mb-2">MONTHLY<br/>PROGRESS</h2>
            <div className="text-xs uppercase font-bold tracking-widest text-gray-500">
              PERIOD: OCT 2023
            </div>
          </div>

          {/* Identification Block */}
          <div className="grid grid-cols-2 border-b-2 border-black bg-white">
            <div className="p-3 border-r-2 border-black flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">CLASS_ID</span>
              <span className="font-bold uppercase text-sm truncate">ENG_101_ADV</span>
            </div>
            <div className="p-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">STUDENT_ID</span>
              <span className="font-bold uppercase text-sm truncate">STU_042_CHEN</span>
            </div>
          </div>

          {/* Visual Analytics */}
          <div className="p-6 border-b-2 border-black bg-white flex flex-col items-center justify-center">
            <h3 className="w-full text-left text-xs uppercase font-bold tracking-widest mb-6">COMPETENCY MATRIX</h3>
            <div className="relative w-full aspect-square max-w-[240px]">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100">
                <polygon fill="none" points="50,5 95,38 78,90 22,90 5,38" stroke="#e5e5e5" strokeWidth="1"></polygon>
                <polygon fill="none" points="50,27.5 72.5,44 64,70 36,70 27.5,44" stroke="#e5e5e5" strokeWidth="1"></polygon>
                <polygon fill="none" points="50,50 50,50 50,50 50,50 50,50" stroke="#e5e5e5" strokeWidth="1"></polygon>
                <line stroke="#e5e5e5" strokeWidth="1" x1="50" x2="50" y1="50" y2="5"></line>
                <line stroke="#e5e5e5" strokeWidth="1" x1="50" x2="95" y1="50" y2="38"></line>
                <line stroke="#e5e5e5" strokeWidth="1" x1="50" x2="78" y1="50" y2="90"></line>
                <line stroke="#e5e5e5" strokeWidth="1" x1="50" x2="22" y1="50" y2="90"></line>
                <line stroke="#e5e5e5" strokeWidth="1" x1="50" x2="5" y1="50" y2="38"></line>
                <polygon fill="rgba(249, 71, 6, 0.2)" points="50,15 85,38 68,80 32,70 15,45" stroke="#f94706" strokeWidth="2"></polygon>
                <circle cx="50" cy="15" fill="#000" r="2"></circle>
                <circle cx="85" cy="38" fill="#000" r="2"></circle>
                <circle cx="68" cy="80" fill="#000" r="2"></circle>
                <circle cx="32" cy="70" fill="#000" r="2"></circle>
                <circle cx="15" cy="45" fill="#000" r="2"></circle>
                <text fill="#000" fontFamily="monospace" fontSize="5" fontWeight="bold" textAnchor="middle" x="50" y="-2">GRAMMAR</text>
                <text fill="#000" fontFamily="monospace" fontSize="5" fontWeight="bold" textAnchor="start" x="100" y="38">VOCAB</text>
                <text fill="#000" fontFamily="monospace" fontSize="5" fontWeight="bold" textAnchor="middle" x="82" y="96">FLUENCY</text>
                <text fill="#000" fontFamily="monospace" fontSize="5" fontWeight="bold" textAnchor="middle" x="18" y="96">PRONUNC</text>
                <text fill="#000" fontFamily="monospace" fontSize="5" fontWeight="bold" textAnchor="end" x="0" y="38">COMPREH</text>
              </svg>
            </div>
          </div>

          {/* Tabular Data */}
          <div className="bg-white flex flex-col">
            <div className="p-3 border-b-2 border-black bg-black text-white">
              <h3 className="text-xs uppercase font-bold tracking-widest">ERROR FREQUENCY & TRENDS</h3>
            </div>
            
            <div className="grid grid-cols-[3fr_1fr_1fr] border-b-2 border-black text-[10px] uppercase font-bold tracking-widest text-gray-500 bg-gray-100">
              <div className="p-2 border-r-2 border-black">CATEGORY / METRIC</div>
              <div className="p-2 border-r-2 border-black text-center">COUNT</div>
              <div className="p-2 text-center">TREND</div>
            </div>
            
            <div className="grid grid-cols-[3fr_1fr_1fr] border-b-2 border-black text-sm items-center hover:bg-gray-50">
              <div className="p-3 border-r-2 border-black font-mono truncate">Pronunc: 'th' sound</div>
              <div className="p-3 border-r-2 border-black text-center font-bold">12</div>
              <div className="p-3 text-center font-bold text-[#00a843]">+15%</div>
            </div>
            <div className="grid grid-cols-[3fr_1fr_1fr] border-b-2 border-black text-sm items-center hover:bg-gray-50">
              <div className="p-3 border-r-2 border-black font-mono truncate">Grammar: Past Tense</div>
              <div className="p-3 border-r-2 border-black text-center font-bold">8</div>
              <div className="p-3 text-center font-bold text-[#f94706]">-5%</div>
            </div>
            <div className="grid grid-cols-[3fr_1fr_1fr] border-b-2 border-black text-sm items-center hover:bg-gray-50">
              <div className="p-3 border-r-2 border-black font-mono truncate">Vocab: Filler Words ("um")</div>
              <div className="p-3 border-r-2 border-black text-center font-bold">45</div>
              <div className="p-3 text-center font-bold text-[#00a843]">+22%</div>
            </div>
            <div className="grid grid-cols-[3fr_1fr_1fr] text-sm items-center hover:bg-gray-50">
              <div className="p-3 border-r-2 border-black font-mono truncate">Fluency: Pauses &gt;2s</div>
              <div className="p-3 border-r-2 border-black text-center font-bold">18</div>
              <div className="p-3 text-center font-bold text-[#00a843]">+8%</div>
            </div>
          </div>

          {/* Document Footer */}
          <div className="p-4 border-t-4 border-black mt-auto flex justify-between items-end">
            <div className="text-[10px] uppercase font-bold tracking-widest text-gray-500 flex flex-col">
              <span>GENERATED BY SMART_INBOX_AI</span>
              <span>UUID: 8F92-A1B4-C3D4</span>
            </div>
            <div className="w-32 border-b-2 border-black h-8 flex items-end justify-center pb-1">
              <span className="text-[8px] uppercase text-gray-400">TEACHER_SIGNATURE</span>
            </div>
          </div>
        </div>
      </main>

      {/* Dispatch Action Footer */}
      <footer className="fixed bottom-0 w-full max-w-md bg-surface border-t-2 border-border-harsh p-4 z-50 no-print">
        <button 
          onClick={() => onNavigate('ROSTER')}
          className="w-full bg-primary text-black font-bold uppercase tracking-widest text-lg py-4 px-6 flex items-center justify-center gap-3 hover:bg-white active:bg-primary border-4 border-primary">
          <span>EXECUTE DISPATCH -&gt; PARENTS</span>
          <Send size={24} />
        </button>
      </footer>
    </div>
  );
}
