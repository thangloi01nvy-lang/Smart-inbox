import React, { useState } from 'react';
import { User, ChevronDown, ChevronUp, ArrowLeft, Plus } from 'lucide-react';
import { Class, Student } from '../types';

interface ClassRosterProps {
  onNavigate: (s: string) => void;
  classes: Class[];
  students: Student[];
  onEditClass: (id: string | null) => void;
  onEditStudent: (id: string | null) => void;
  onGenerateReport?: (classId: string, studentId: string) => void;
}

export function ClassRoster({ onNavigate, classes, students, onEditClass, onEditStudent, onGenerateReport }: ClassRosterProps) {
  const [expandedClassId, setExpandedClassId] = useState<string | null>(classes[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleClass = (id: string) => {
    setExpandedClassId(expandedClassId === id ? null : id);
  };

  const unassignedStudents = students.filter(s => !s.classId || s.classId === 'UNASSIGNED');

  const filteredStudents = (studentList: Student[]) => 
    studentList.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <>
      <div className="relative flex h-auto w-full flex-col bg-background-dark overflow-x-hidden font-display border-b-2 border-border-harsh">
        <div className="flex items-center bg-background-dark p-4 pb-2 justify-between">
          <h2 className="text-text-main text-2xl font-bold leading-tight uppercase tracking-widest flex-1 font-mono">&gt; CLASS_ROSTER</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => onNavigate('REPORT_GEN')}
              className="text-sm font-bold bg-transparent text-text-main px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
              [GEN_REPORT]
            </button>
            <button 
              onClick={() => onNavigate('INBOX')}
              className="text-sm font-bold bg-transparent text-text-main px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
              [INBOX]
            </button>
          </div>
        </div>
        
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <button 
              onClick={() => onEditClass(null)}
              className="flex-1 h-12 bg-primary text-background-dark text-sm font-bold border-2 border-primary uppercase hover:bg-transparent hover:text-primary transition-all">
              [+ NEW_CLASS]
            </button>
            <button 
              onClick={() => onEditStudent(null)}
              className="flex-1 h-12 bg-accent text-background-dark text-sm font-bold border-2 border-accent uppercase hover:bg-transparent hover:text-accent transition-all">
              [+ NEW_STUDENT]
            </button>
          </div>
          
          <div className="relative">
            <input 
              type="text"
              placeholder="SEARCH_STUDENTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black border-2 border-border-harsh p-2 text-xs font-mono uppercase focus:border-primary outline-none"
            />
          </div>
        </div>
      </div>
      
      <main className="flex-1 p-4 flex flex-col gap-4 font-mono w-full overflow-y-auto">
        {classes.map((cls) => {
          const isExpanded = expandedClassId === cls.id;
          const classStudents = filteredStudents(students.filter(s => s.classId === cls.id));

          if (searchTerm && classStudents.length === 0) return null;

          return (
            <div key={cls.id} className="flex flex-col border-2 border-border-harsh bg-surface">
              <div 
                onClick={() => toggleClass(cls.id)}
                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${isExpanded ? 'bg-muted text-background-dark' : 'text-text-main hover:bg-[#1a1a1a]'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{isExpanded ? '[-]' : '[+]'}</span>
                  <h3 className="font-bold text-lg uppercase tracking-wider">{cls.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 ml-2 border ${isExpanded ? 'bg-background-dark text-muted border-background-dark' : 'text-muted border-muted'}`}>
                    {classStudents.length}_STU
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditClass(cls.id); }}
                  className={`text-[10px] font-bold px-3 py-1 border-2 transition-colors ${isExpanded ? 'bg-background-dark text-text-main border-background-dark hover:bg-text-main hover:text-background-dark' : 'border-border-harsh hover:bg-text-main hover:text-background-dark'}`}>
                  [EDIT]
                </button>
              </div>
              
              {isExpanded && (
                <div className="flex flex-col p-4 gap-4 bg-background-dark/50">
                  <div className="grid grid-cols-12 gap-2 text-muted text-[10px] font-bold border-b border-border-harsh pb-2 uppercase tracking-wider">
                    <div className="col-span-7">NAME</div>
                    <div className="col-span-2 text-right">PTS</div>
                    <div className="col-span-3 text-right">STATUS</div>
                  </div>
                  
                  {classStudents.length === 0 ? (
                    <div className="text-center py-4 text-muted text-[10px] uppercase italic">No students found</div>
                  ) : (
                    classStudents.map(student => (
                      <StudentRow key={student.id} student={student} onClick={() => onEditStudent(student.id)} onGenerateReport={onGenerateReport} />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned Students Section */}
        {unassignedStudents.length > 0 && (
          <div className="flex flex-col border-2 border-border-harsh border-dashed bg-black/30">
            <div 
              onClick={() => toggleClass('unassigned')}
              className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${expandedClassId === 'unassigned' ? 'bg-primary text-background-dark' : 'text-muted hover:bg-[#1a1a1a]'}`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-lg">{expandedClassId === 'unassigned' ? '[-]' : '[+]'}</span>
                <h3 className="font-bold text-lg uppercase tracking-wider">UNASSIGNED_STUDENTS</h3>
                <span className={`text-[10px] px-2 py-0.5 ml-2 border ${expandedClassId === 'unassigned' ? 'bg-background-dark text-primary border-background-dark' : 'text-muted border-muted'}`}>
                  {unassignedStudents.length}_STU
                </span>
              </div>
            </div>
            
            {expandedClassId === 'unassigned' && (
              <div className="flex flex-col p-4 gap-4 bg-background-dark/50">
                {filteredStudents(unassignedStudents).map(student => (
                  <StudentRow key={student.id} student={student} onClick={() => onEditStudent(student.id)} onGenerateReport={onGenerateReport} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function StudentRow({ student, onClick, onGenerateReport }: { student: Student, onClick: () => void, onGenerateReport?: (classId: string, studentId: string) => void }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center text-sm border-b border-border-harsh/30 pb-3 hover:bg-white/5 group">
      <div 
        onClick={onClick}
        className="col-span-6 flex items-center gap-2 cursor-pointer">
        <div className="w-6 h-6 bg-muted border border-muted flex items-center justify-center text-background-dark font-bold shrink-0">
          <User size={12} />
        </div>
        <span className="font-bold truncate group-hover:text-primary transition-colors">{student.name}</span>
      </div>
      <div className="col-span-2 text-right font-bold text-primary">{student.dataPoints}</div>
      <div className="col-span-4 flex items-center justify-end gap-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onGenerateReport) onGenerateReport(student.classId, student.id);
          }}
          className="text-[9px] font-bold px-2 py-1 uppercase border border-border-harsh hover:bg-primary hover:text-black hover:border-primary transition-colors"
        >
          [REPORT]
        </button>
        <span className={`text-[9px] font-bold px-1 py-0.5 uppercase border ${student.status === 'READY' ? 'bg-accent text-black border-accent' : 'text-muted border-muted'}`}>
          [{student.status}]
        </span>
      </div>
    </div>
  );
}
