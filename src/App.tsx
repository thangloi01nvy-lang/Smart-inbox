/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ClassRoster } from './components/ClassRoster';
import { EditClass } from './components/EditClass';
import { EditStudent } from './components/EditStudent';
import { ReportGen } from './components/ReportGen';
import { AnalysisDetail } from './components/AnalysisDetail';
import { Inbox } from './components/Inbox';
import { Reports } from './components/Reports';
import { AnalysisResult } from './services/geminiService';
import { Class, Student } from './types';

type Screen = 'ROSTER' | 'EDIT_CLASS' | 'EDIT_STUDENT' | 'REPORT_GEN' | 'ANALYSIS_DETAIL' | 'INBOX' | 'REPORTS';

const INITIAL_STUDENTS: Student[] = [
  { id: 'STU-001', name: 'Nguyen Van A', dataPoints: 142, status: 'READY', trend: [15, 12, 14, 5, 2] },
  { id: 'STU-002', name: 'Tran Hoang B', dataPoints: 45, status: 'PENDING', trend: [10, 12, 11, 14, 15] },
  { id: 'STU-003', name: 'Le Minh C', dataPoints: 128, status: 'READY', trend: [18, 15, 10, 8, 4] },
  { id: 'STU-8871', name: 'Pham Duy', dataPoints: 0, status: 'PENDING', trend: [] },
  { id: 'STU-2345', name: 'Hoang Yen', dataPoints: 0, status: 'PENDING', trend: [] },
];

const INITIAL_CLASSES: Class[] = [
  { id: 'CLASS-001', name: 'INT_ENGLISH_A', studentIds: ['STU-001', 'STU-002', 'STU-003'] },
  { id: 'CLASS-002', name: 'ADV_CONVERSATION_B', studentIds: [] },
  { id: 'CLASS-003', name: 'IELTS_PREP_01', studentIds: [] },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('INBOX');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [reports, setReports] = useState<AnalysisResult[]>([]);
  
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [classes, setClasses] = useState<Class[]>(INITIAL_CLASSES);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    const newReport = {
      ...result,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    setReports(prev => [newReport, ...prev]);
    setAnalysisResult(newReport);
  };

  const handleSelectReport = (report: AnalysisResult) => {
    setAnalysisResult(report);
    setCurrentScreen('ANALYSIS_DETAIL');
  };

  const navigate = (s: any) => setCurrentScreen(s);

  const handleEditClass = (id: string | null) => {
    setSelectedClassId(id);
    setCurrentScreen('EDIT_CLASS');
  };

  const handleEditStudent = (id: string | null) => {
    setSelectedStudentId(id);
    setCurrentScreen('EDIT_STUDENT');
  };

  const handleSaveClass = (updatedClass: Class) => {
    setClasses(prev => {
      const exists = prev.find(c => c.id === updatedClass.id);
      if (exists) {
        return prev.map(c => c.id === updatedClass.id ? updatedClass : c);
      }
      return [...prev, updatedClass];
    });
    setCurrentScreen('ROSTER');
  };

  const handleDeleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    setCurrentScreen('ROSTER');
  };

  const handleSaveStudent = (updatedStudent: Student, newClassId: string) => {
    setStudents(prev => {
      const exists = prev.find(s => s.id === updatedStudent.id);
      if (exists) {
        return prev.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      }
      return [...prev, updatedStudent];
    });

    setClasses(prev => prev.map(cls => {
      // Remove student from all classes first
      const studentIds = cls.studentIds.filter(id => id !== updatedStudent.id);
      // Add to new class if matches
      if (cls.id === newClassId) {
        studentIds.push(updatedStudent.id);
      }
      return { ...cls, studentIds };
    }));

    setCurrentScreen('ROSTER');
  };

  const handleArchiveStudent = (id: string) => {
    // For now, just remove from list
    setStudents(prev => prev.filter(s => s.id !== id));
    setCurrentScreen('ROSTER');
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-background-dark text-text-main font-mono selection:bg-primary selection:text-white">
      <div className="w-full max-w-3xl min-h-screen flex flex-col relative border-x-2 border-border-harsh bg-background-dark">
        {currentScreen === 'INBOX' && (
          <Inbox 
            onNavigate={navigate} 
            onAnalysisComplete={handleAnalysisComplete} 
            classes={classes} 
          />
        )}
        {currentScreen === 'ROSTER' && (
          <ClassRoster 
            onNavigate={navigate} 
            classes={classes} 
            students={students} 
            onEditClass={handleEditClass} 
            onEditStudent={handleEditStudent} 
          />
        )}
        {currentScreen === 'EDIT_CLASS' && (
          <EditClass 
            onNavigate={navigate} 
            classToEdit={classes.find(c => c.id === selectedClassId) || null} 
            allStudents={students}
            onSave={handleSaveClass}
            onDelete={handleDeleteClass}
          />
        )}
        {currentScreen === 'EDIT_STUDENT' && (
          <EditStudent 
            onNavigate={navigate} 
            studentToEdit={students.find(s => s.id === selectedStudentId) || null}
            classes={classes}
            onSave={handleSaveStudent}
            onArchive={handleArchiveStudent}
          />
        )}
        {currentScreen === 'REPORT_GEN' && <ReportGen onNavigate={navigate} />}
        {currentScreen === 'ANALYSIS_DETAIL' && <AnalysisDetail onNavigate={navigate} analysisResult={analysisResult} />}
        {currentScreen === 'REPORTS' && <Reports onNavigate={navigate} reports={reports} onSelectReport={handleSelectReport} />}
        {!['INBOX', 'ROSTER', 'EDIT_CLASS', 'EDIT_STUDENT', 'REPORT_GEN', 'ANALYSIS_DETAIL', 'REPORTS'].includes(currentScreen) && (
          <div className="p-10 text-center">
            <p>Screen not found: {currentScreen}</p>
            <button onClick={() => setCurrentScreen('INBOX')} className="mt-4 border p-2">Go to Inbox</button>
          </div>
        )}
      </div>
    </div>
  );
}



