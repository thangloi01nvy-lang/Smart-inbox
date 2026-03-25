import React from 'react';
import { User } from 'lucide-react';

export function ClassRoster({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <>
      <div className="relative flex h-auto w-full flex-col bg-background-dark overflow-x-hidden font-display border-b-2 border-border-harsh">
        <div className="flex items-center bg-background-dark p-4 pb-2 justify-between">
          <h2 className="text-text-main text-2xl font-bold leading-tight uppercase tracking-widest flex-1 font-mono">&gt; CLASS_ROSTER</h2>
          <button 
            onClick={() => onNavigate('INBOX')}
            className="text-sm font-bold bg-transparent text-text-main px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
            [INBOX]
          </button>
        </div>
        <div className="flex px-4 py-4">
          <button 
            onClick={() => onNavigate('EDIT_CLASS')}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden h-12 px-6 flex-1 bg-primary text-background-dark text-base font-bold leading-normal tracking-widest font-mono border-2 border-primary uppercase hover:bg-transparent hover:text-primary">
            <span className="truncate">[+ NEW_CLASS]</span>
          </button>
        </div>
      </div>
      
      <main className="flex-1 p-4 flex flex-col gap-6 font-mono w-full">
        {/* Expanded Class */}
        <div className="flex flex-col border-2 border-border-harsh bg-surface">
          <div className="flex items-center justify-between bg-muted text-background-dark p-3 cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">[-]</span>
              <h3 className="font-bold text-lg uppercase tracking-wider">INT_ENGLISH_A</h3>
              <span className="text-sm bg-background-dark text-muted px-2 py-0.5 ml-2 border border-background-dark">24_STUDENTS</span>
            </div>
            <button 
              onClick={() => onNavigate('EDIT_CLASS')}
              className="text-sm font-bold bg-background-dark text-text-main px-3 py-1 border-2 border-muted hover:bg-text-main hover:text-background-dark">
              [EDIT]
            </button>
          </div>
          
          <div className="flex flex-col p-4 gap-4">
            <div className="grid grid-cols-12 gap-2 text-muted text-xs font-bold border-b-2 border-border-harsh pb-2 uppercase tracking-wider">
              <div className="col-span-2">ID</div>
              <div className="col-span-4">NAME</div>
              <div className="col-span-2 text-right">DATA_PTS</div>
              <div className="col-span-4 pl-4">TREND / STATUS</div>
            </div>
            
            {/* Student 1 */}
            <div 
              onClick={() => onNavigate('EDIT_STUDENT')}
              className="grid grid-cols-12 gap-2 items-center text-sm border-b-2 border-border-harsh pb-3 cursor-pointer hover:bg-[#1a1a1a]">
              <div className="col-span-2 text-muted">STU-001</div>
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-muted border-2 border-muted flex items-center justify-center text-background-dark font-bold">
                  <User size={16} />
                </div>
                <span className="font-bold truncate">Nguyen, V.</span>
              </div>
              <div className="col-span-2 text-right font-bold text-primary">142</div>
              <div className="col-span-4 flex items-center justify-between pl-4 gap-2">
                <svg className="flex-shrink-0" height="20" preserveAspectRatio="none" viewBox="0 0 60 20" width="60">
                  <polyline fill="none" points="0,15 15,12 30,14 45,5 60,2" stroke="#00E65C" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2"></polyline>
                </svg>
                <span className="text-[10px] font-bold bg-accent text-background-dark px-1.5 py-0.5 uppercase border-2 border-accent">[READY]</span>
              </div>
            </div>
            
            {/* Student 2 */}
            <div 
              onClick={() => onNavigate('REPORT_GEN')}
              className="grid grid-cols-12 gap-2 items-center text-sm border-b-2 border-border-harsh pb-3 cursor-pointer hover:bg-[#1a1a1a]">
              <div className="col-span-2 text-muted">STU-002</div>
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-muted border-2 border-muted flex items-center justify-center text-background-dark font-bold">
                  <User size={16} />
                </div>
                <span className="font-bold truncate">Tran, H.</span>
              </div>
              <div className="col-span-2 text-right font-bold">45</div>
              <div className="col-span-4 flex items-center justify-between pl-4 gap-2">
                <svg className="flex-shrink-0" height="20" preserveAspectRatio="none" viewBox="0 0 60 20" width="60">
                  <polyline fill="none" points="0,10 15,12 30,11 45,14 60,15" stroke="#f94706" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2"></polyline>
                </svg>
                <span className="text-[10px] font-bold text-muted px-1.5 py-0.5 uppercase border border-muted">[PENDING]</span>
              </div>
            </div>
            
            {/* Student 3 */}
            <div 
              onClick={() => onNavigate('EDIT_STUDENT')}
              className="grid grid-cols-12 gap-2 items-center text-sm border-b-2 border-border-harsh pb-3 cursor-pointer hover:bg-[#1a1a1a]">
              <div className="col-span-2 text-muted">STU-003</div>
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-muted border-2 border-muted flex items-center justify-center text-background-dark font-bold">
                  <User size={16} />
                </div>
                <span className="font-bold truncate">Le, M.</span>
              </div>
              <div className="col-span-2 text-right font-bold text-primary">128</div>
              <div className="col-span-4 flex items-center justify-between pl-4 gap-2">
                <svg className="flex-shrink-0" height="20" preserveAspectRatio="none" viewBox="0 0 60 20" width="60">
                  <polyline fill="none" points="0,18 15,15 30,10 45,8 60,4" stroke="#00E65C" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2"></polyline>
                </svg>
                <span className="text-[10px] font-bold bg-accent text-background-dark px-1.5 py-0.5 uppercase border-2 border-accent">[READY]</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Collapsed Class 1 */}
        <div className="flex flex-col border-2 border-border-harsh bg-surface">
          <div className="flex items-center justify-between text-muted p-3 cursor-pointer hover:bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">[+]</span>
              <h3 className="font-bold text-lg uppercase tracking-wider text-text-main">ADV_CONVERSATION_B</h3>
              <span className="text-sm bg-transparent text-muted px-2 py-0.5 ml-2 border border-muted">18_STUDENTS</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onNavigate('EDIT_CLASS'); }}
              className="text-sm font-bold bg-transparent text-text-main px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
              [EDIT]
            </button>
          </div>
        </div>
        
        {/* Collapsed Class 2 */}
        <div className="flex flex-col border-2 border-border-harsh bg-surface">
          <div className="flex items-center justify-between text-muted p-3 cursor-pointer hover:bg-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-lg">[+]</span>
              <h3 className="font-bold text-lg uppercase tracking-wider text-text-main">IELTS_PREP_01</h3>
              <span className="text-sm bg-transparent text-muted px-2 py-0.5 ml-2 border border-muted">12_STUDENTS</span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onNavigate('EDIT_CLASS'); }}
              className="text-sm font-bold bg-transparent text-text-main px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
              [EDIT]
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
