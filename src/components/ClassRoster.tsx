import React, { useState } from 'react';
import { User, ChevronDown, ChevronUp, ArrowLeft, Plus } from 'lucide-react';
import { Class, Student } from '../types';

interface ClassRosterProps {
  onNavigate: (s: string) => void;
  classes: Class[];
  students: Student[];
  onEditClass: (id: string | null) => void;
  onEditStudent: (id: string | null) => void;
}

export function ClassRoster({ onNavigate, classes, students, onEditClass, onEditStudent }: ClassRosterProps) {
  const [expandedClassId, setExpandedClassId] = React.useState<string | null>(classes[0]?.id || null);

  const toggleClass = (id: string) => {
    setExpandedClassId(expandedClassId === id ? null : id);
  };

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
            onClick={() => onEditClass(null)}
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden h-12 px-6 flex-1 bg-primary text-background-dark text-base font-bold leading-normal tracking-widest font-mono border-2 border-primary uppercase hover:bg-transparent hover:text-primary">
            <span className="truncate">[+ NEW_CLASS]</span>
          </button>
        </div>
      </div>
      
      <main className="flex-1 p-4 flex flex-col gap-4 font-mono w-full overflow-y-auto">
        {classes.map((cls) => {
          const isExpanded = expandedClassId === cls.id;
          const classStudents = students.filter(s => cls.studentIds.includes(s.id));

          return (
            <div key={cls.id} className="flex flex-col border-2 border-border-harsh bg-surface">
              <div 
                onClick={() => toggleClass(cls.id)}
                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isExpanded ? 'bg-muted text-background-dark' : 'text-text-main hover:bg-[#1a1a1a]'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{isExpanded ? '[-]' : '[+]'}</span>
                  <h3 className="font-bold text-lg uppercase tracking-wider">{cls.name}</h3>
                  <span className={`text-sm px-2 py-0.5 ml-2 border ${isExpanded ? 'bg-background-dark text-muted border-background-dark' : 'text-muted border-muted'}`}>
                    {cls.studentIds.length}_STUDENTS
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditClass(cls.id); }}
                  className={`text-sm font-bold px-3 py-1 border-2 transition-colors ${isExpanded ? 'bg-background-dark text-text-main border-background-dark hover:bg-text-main hover:text-background-dark' : 'border-border-harsh hover:bg-text-main hover:text-background-dark'}`}>
                  [EDIT]
                </button>
              </div>
              
              {isExpanded && (
                <div className="flex flex-col p-4 gap-4 bg-background-dark/50">
                  <div className="grid grid-cols-12 gap-2 text-muted text-[10px] font-bold border-b border-border-harsh pb-2 uppercase tracking-wider">
                    <div className="col-span-2">ID</div>
                    <div className="col-span-5">NAME</div>
                    <div className="col-span-2 text-right">PTS</div>
                    <div className="col-span-3 text-right">STATUS</div>
                  </div>
                  
                  {classStudents.length === 0 ? (
                    <div className="text-center py-4 text-muted text-xs uppercase italic">No students assigned</div>
                  ) : (
                    classStudents.map(student => (
                      <div 
                        key={student.id}
                        onClick={() => onEditStudent(student.id)}
                        className="grid grid-cols-12 gap-2 items-center text-sm border-b border-border-harsh/30 pb-3 cursor-pointer hover:bg-white/5 group">
                        <div className="col-span-2 text-muted text-xs">{student.id.split('-')[1] || student.id}</div>
                        <div className="col-span-5 flex items-center gap-2">
                          <div className="w-6 h-6 bg-muted border border-muted flex items-center justify-center text-background-dark font-bold shrink-0">
                            <User size={12} />
                          </div>
                          <span className="font-bold truncate group-hover:text-primary transition-colors">{student.name}</span>
                        </div>
                        <div className="col-span-2 text-right font-bold text-primary">{student.dataPoints}</div>
                        <div className="col-span-3 flex items-center justify-end gap-2">
                          <span className={`text-[9px] font-bold px-1 py-0.5 uppercase border ${student.status === 'READY' ? 'bg-accent text-black border-accent' : 'text-muted border-muted'}`}>
                            [{student.status}]
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </>
  );
}
