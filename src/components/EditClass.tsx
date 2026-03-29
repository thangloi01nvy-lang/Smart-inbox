import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, X, Plus } from 'lucide-react';
import { Class, Student } from '../types';

interface EditClassProps {
  onNavigate: (s: string) => void;
  classToEdit: Class | null;
  allStudents: Student[];
  onSave: (cls: Class) => void;
  onDelete: (id: string) => void;
  onSaveStudent: (student: Student, classId: string, navigateBack?: boolean) => void;
}

export function EditClass({ onNavigate, classToEdit, allStudents, onSave, onDelete, onSaveStudent }: EditClassProps) {
  const [name, setName] = useState(classToEdit?.name || '');
  const [classId] = useState(classToEdit?.id || `CLASS-${Date.now()}`);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>(classToEdit?.studentIds || []);
  const [searchTerm, setSearchTerm] = useState('');

  const assignedStudents = allStudents.filter(s => s.classId === classId);
  const availableStudents = allStudents.filter(s => s.classId !== classId && 
    (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.id.toLowerCase().includes(searchTerm.toLowerCase())));

  const handleAddStudent = (student: Student) => {
    onSaveStudent({ ...student, classId: classId }, classId, false);
  };

  const handleRemoveStudent = (student: Student) => {
    onSaveStudent({ ...student, classId: 'UNASSIGNED' }, 'UNASSIGNED', false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: classId,
      name: name.trim().toUpperCase(),
      studentIds: [], // Keep for compatibility if needed, but we'll use classId
      teacherUid: classToEdit?.teacherUid || ''
    });
  };

  return (
    <div className="flex flex-col h-full w-full font-mono pb-[140px] bg-background-dark">
      <header className="flex items-center bg-background-dark p-4 border-b-2 border-border-harsh sticky top-0 z-50 gap-3">
        <button 
          onClick={() => onNavigate('ROSTER')}
          className="text-text-main hover:text-primary active:text-primary flex items-center justify-center w-10 h-10 border-2 border-transparent hover:border-border-harsh focus:border-border-harsh focus:outline-none shrink-0">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight uppercase flex-1 truncate">&gt; {classToEdit ? 'EDIT_CLASS' : 'NEW_CLASS'}</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto flex flex-col w-full p-4 space-y-8">
        <section className="flex flex-col space-y-2">
          <label className="text-xs font-bold text-muted uppercase tracking-wider" htmlFor="class_name">CLASS_NAME</label>
          <input 
            className="border-2 border-muted bg-background-dark text-text-main w-full h-14 px-4 text-lg font-bold placeholder:text-muted uppercase tracking-wider focus:border-primary focus:outline-none transition-colors" 
            id="class_name" 
            placeholder="ENTER_CLASS_NAME_" 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </section>
        
        {classToEdit ? (
          <>
            <section className="flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b border-border-harsh pb-2">
                <h2 className="text-xs font-bold text-muted uppercase tracking-wider">ASSIGNED_STUDENTS [ {assignedStudentIds.length} ]</h2>
              </div>
              <div className="flex flex-col space-y-2">
                {assignedStudents.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-border-harsh text-center text-muted text-xs uppercase">No students assigned</div>
                ) : (
                  assignedStudents.map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between bg-surface border-2 border-border-harsh p-3">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-8 h-8 bg-muted flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-background-dark">{(index + 1).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold truncate uppercase">{student.name}</span>
                          <span className="text-[10px] text-muted font-medium uppercase">ID: {student.id}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveStudent(student)}
                        className="shrink-0 ml-4 h-8 px-3 border-2 border-primary text-primary font-bold text-[10px] uppercase hover:bg-primary hover:text-black focus:outline-none">
                        [ REMOVE ]
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
            
            <section className="flex flex-col space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-border-harsh pb-2">
                <h2 className="text-xs font-bold text-muted uppercase tracking-wider">AVAILABLE_STUDENTS</h2>
                <div className="flex items-center border-2 border-border-harsh bg-black px-2 py-1">
                  <Search className="text-muted w-3 h-3" />
                  <input 
                    className="bg-transparent border-none text-[10px] text-text-main placeholder:text-muted focus:ring-0 focus:outline-none w-24 px-1 py-0 h-5 uppercase" 
                    placeholder="FILTER_" 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                {availableStudents.length === 0 ? (
                  <div className="p-4 text-center text-muted text-xs uppercase italic">No available students found</div>
                ) : (
                  availableStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between bg-black border-2 border-border-harsh border-dashed p-3">
                      <div className="flex items-center space-x-3 overflow-hidden opacity-70">
                        <div className="w-8 h-8 border-2 border-border-harsh flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-muted">--</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-muted truncate uppercase">{student.name}</span>
                          <span className="text-[10px] text-muted font-medium uppercase">ID: {student.id}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAddStudent(student)}
                        className="shrink-0 ml-4 h-8 px-3 bg-accent text-black font-bold text-[10px] uppercase hover:bg-white focus:outline-none border-2 border-accent hover:border-white">
                        [ ADD ]
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="flex flex-col space-y-4 pt-4">
            <div className="p-4 border-2 border-dashed border-border-harsh text-center text-muted text-xs uppercase">
              Please save the class first before adding students.
            </div>
          </section>
        )}
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-background-dark border-t-2 border-border-harsh p-4 z-50">
        <div className="max-w-3xl mx-auto flex flex-col space-y-3">
          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="w-full h-14 bg-accent text-black font-bold text-lg uppercase flex items-center justify-center border-2 border-accent hover:bg-white hover:border-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
            [ SAVE_CLASS ]
          </button>
          {classToEdit && (
            <button 
              onClick={() => onDelete(classToEdit.id)}
              className="w-full h-14 bg-black text-primary font-bold text-lg uppercase flex items-center justify-center border-2 border-primary hover:bg-primary hover:text-black focus:outline-none">
              [ DELETE_CLASS ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
