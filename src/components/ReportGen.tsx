import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Send, Loader2, Download } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { generateUnifiedReport } from '../services/geminiService';
import { AnalysisResult, Class, Student } from '../types';

export function ReportGen({ 
  onNavigate,
  classes,
  students,
  initialClassId,
  initialStudentId
}: { 
  onNavigate: (s: string) => void,
  classes: Class[],
  students: Student[],
  initialClassId?: string | null,
  initialStudentId?: string | null
}) {
  const [selectedClass, setSelectedClass] = useState<string>(initialClassId || classes[0]?.id || '');
  const [selectedStudent, setSelectedStudent] = useState<string>(initialStudentId || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetchingLogs, setIsFetchingLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>('AWAITING COMMAND');
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  useEffect(() => {
    if (initialClassId && classes.some(c => c.id === initialClassId)) {
      setSelectedClass(initialClassId);
    }
  }, [initialClassId, classes]);

  const classStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClass);
  }, [students, selectedClass]);

  useEffect(() => {
    if (initialStudentId && classStudents.some(s => s.id === initialStudentId)) {
      setSelectedStudent(initialStudentId);
    } else if (classStudents.length > 0) {
      setSelectedStudent(classStudents[0].id);
    } else {
      setSelectedStudent('');
    }
  }, [classStudents, initialStudentId]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!selectedStudent || !selectedMonth) {
        setLogs([]);
        return;
      }

      const teacherUid = auth.currentUser?.uid;
      if (!teacherUid) return;

      setIsFetchingLogs(true);
      setStatusMessage('FETCHING LOGS...');
      try {
        const logsRef = collection(db, 'logs');
        const [year, month] = selectedMonth.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

        const q = query(
          logsRef,
          where('teacherUid', '==', teacherUid),
          where('studentId', '==', selectedStudent),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );

        const querySnapshot = await getDocs(q);
        const fetchedLogs = querySnapshot.docs.map(doc => doc.data());
        setLogs(fetchedLogs);
        
        if (fetchedLogs.length === 0) {
          setStatusMessage('NO LOGS FOUND FOR THIS PERIOD');
        } else {
          setStatusMessage(`FOUND ${fetchedLogs.length} LOGS. READY TO GENERATE.`);
        }
      } catch (error: any) {
        console.error("Error fetching logs:", error);
        setStatusMessage('ERROR FETCHING LOGS: ' + error.message);
      } finally {
        setIsFetchingLogs(false);
      }
    };

    fetchLogs();
  }, [selectedStudent, selectedMonth]);

  const handleGenerate = async () => {
    if (!selectedClass || !selectedStudent || !selectedMonth) {
      alert("Please select class, student, and month.");
      return;
    }

    if (logs.length === 0) {
      alert("No logs found to generate a report.");
      return;
    }

    const teacherUid = auth.currentUser?.uid;
    if (!teacherUid) {
      alert("You must be logged in.");
      return;
    }

    setIsGenerating(true);
    setStatusMessage(`GENERATING REPORT FROM ${logs.length} LOGS...`);
    setGeneratedReport(null);

    try {
      // 2. Send to Gemini
      const studentName = students.find(s => s.id === selectedStudent)?.name || 'Unknown Student';
      const reportData = await generateUnifiedReport(logs, studentName);

      setStatusMessage('REPORT GENERATED. SAVING...');

      // 3. Save the report to Firestore
      const reportsRef = collection(db, 'analysisResults');
      const newReport = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        teacherUid,
        classId: selectedClass,
        className: classes.find(c => c.id === selectedClass)?.name || 'Unknown',
        transcript: reportData.transcript || 'Monthly Summary',
        summary: reportData.summary || 'Monthly Summary',
        students: reportData.students,
        type: 'monthly_summary'
      };

      await setDoc(doc(db, 'analysisResults', newReport.id), newReport);

      // 4. Update the student document
      const student = students.find(s => s.id === selectedStudent);
      if (student && reportData.students && reportData.students.length > 0) {
        const sAnalysis = reportData.students[0];
        const newTrend = [...(student.trend || []), sAnalysis.currentScore].slice(-5);
        
        const newComment = { date: newReport.date, text: sAnalysis.comment };
        const updatedComments = [...(student.comments || [])];
        if (student.lastComment && updatedComments.length === 0) {
          updatedComments.push({ date: student.lastAnalysisDate || new Date(0).toISOString(), text: student.lastComment });
        }
        updatedComments.push(newComment);

        await setDoc(doc(db, 'students', student.id), {
          ...student,
          currentScore: Number(sAnalysis.currentScore),
          targetScore: Number(sAnalysis.targetScore),
          estimatedDaysToTarget: Number(sAnalysis.estimatedDaysToTarget),
          lastComment: sAnalysis.comment,
          comments: updatedComments,
          dataPoints: (student.dataPoints || 0) + 1,
          trend: newTrend.map(Number),
          lastAnalysisDate: newReport.date
        });
      }

      setGeneratedReport(newReport);
      setStatusMessage('REPORT SAVED SUCCESSFULLY.');

    } catch (error: any) {
      console.error("Error generating report:", error);
      setStatusMessage('ERROR: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const studentName = students.find(s => s.id === selectedStudent)?.name || 'Unknown';
  const className = classes.find(c => c.id === selectedClass)?.name || 'Unknown';

  return (
    <div className="flex flex-col items-center h-full w-full font-display pb-24 print:pb-0 print:h-auto print:overflow-visible">
      {/* App Header */}
      <header className="w-full max-w-md bg-surface border-b-2 border-border-harsh sticky top-0 z-50 no-print">
        <div className="flex items-center p-4 gap-3">
          <button 
            onClick={() => onNavigate('ROSTER')}
            aria-label="Go Back" 
            className="text-white flex w-10 h-10 shrink-0 items-center justify-center border-2 border-border-harsh hover:bg-[#333333] active:bg-primary">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-lg sm:text-xl font-bold uppercase tracking-widest flex-1 truncate">&gt; REPORT_GEN</h1>
          {generatedReport && (
            <button 
              onClick={() => window.print()}
              aria-label="Export PDF" 
              className="text-primary flex w-10 h-10 shrink-0 items-center justify-center border-2 border-border-harsh hover:bg-primary hover:text-black active:bg-primary transition-colors">
              <Download size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md px-4 mt-6 flex-1 flex flex-col gap-6 print-container print:max-w-none print:w-full print:m-0 print:p-0">
        
        {/* Configuration Panel */}
        <div className="bg-surface border-2 border-border-harsh p-4 flex flex-col gap-4 no-print">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">CLASS:</label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-black border-2 border-border-harsh text-white p-3 text-sm font-bold uppercase appearance-none focus:border-primary focus:outline-none cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {classes.length === 0 && <option value="">NO_CLASSES_FOUND</option>}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">STUDENT:</label>
            <select 
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full bg-black border-2 border-border-harsh text-white p-3 text-sm font-bold uppercase appearance-none focus:border-primary focus:outline-none cursor-pointer"
            >
              {classStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              {classStudents.length === 0 && <option value="">NO_STUDENTS_FOUND</option>}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">MONTH:</label>
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-black border-2 border-border-harsh text-white p-3 text-sm font-bold uppercase focus:border-primary focus:outline-none"
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || isFetchingLogs || logs.length === 0 || !selectedStudent}
            className="w-full bg-primary text-black font-bold uppercase tracking-widest text-sm py-3 px-4 flex items-center justify-center gap-2 hover:bg-white active:bg-primary border-2 border-primary disabled:opacity-50 disabled:cursor-not-allowed mt-2">
            {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            <span>{isGenerating ? 'GENERATING...' : `GENERATE REPORT (${logs.length} LOGS)`}</span>
          </button>
        </div>

        {/* Instructions / Status (No Print) */}
        <div className="bg-surface border-2 border-border-harsh p-3 no-print">
          <p className="text-muted text-xs uppercase font-bold tracking-wider mb-1">SYSTEM STATUS</p>
          <p className="text-accent text-sm uppercase font-mono">&gt; {statusMessage}</p>
        </div>

        {/* Generated Report Preview */}
        {generatedReport && generatedReport.students && generatedReport.students[0] && (
          <div className="bg-white text-black border-2 border-border-harsh w-full flex flex-col relative overflow-hidden">
            {/* Document Header */}
            <div className="p-5 border-b-2 border-black bg-white flex flex-col gap-2">
              <h2 className="text-3xl font-bold uppercase tracking-tighter leading-none mb-2">MONTHLY<br/>PROGRESS</h2>
              <div className="text-xs uppercase font-bold tracking-widest text-gray-500">
                PERIOD: {selectedMonth}
              </div>
            </div>

            {/* Identification Block */}
            <div className="grid grid-cols-2 border-b-2 border-black bg-white">
              <div className="p-3 border-r-2 border-black flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">CLASS</span>
                <span className="font-bold uppercase text-sm truncate">{className}</span>
              </div>
              <div className="p-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">STUDENT</span>
                <span className="font-bold uppercase text-sm truncate">{studentName}</span>
              </div>
            </div>

            {/* Feedback Content */}
            <div className="p-5 border-b-2 border-black bg-white">
              <h3 className="text-xs uppercase font-bold tracking-widest mb-3">AI GENERATED FEEDBACK</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {generatedReport.students[0].comment}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 border-b-2 border-black bg-white">
              <div className="p-3 border-r-2 border-black flex flex-col gap-1 items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 text-center">CURRENT SCORE</span>
                <span className="font-bold text-xl">{generatedReport.students[0].currentScore || 'N/A'}</span>
              </div>
              <div className="p-3 border-r-2 border-black flex flex-col gap-1 items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 text-center">TARGET SCORE</span>
                <span className="font-bold text-xl">{generatedReport.students[0].targetScore || 'N/A'}</span>
              </div>
              <div className="p-3 flex flex-col gap-1 items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 text-center">DAYS TO TARGET</span>
                <span className="font-bold text-xl">{generatedReport.students[0].estimatedDaysToTarget || 'N/A'}</span>
              </div>
            </div>

            {/* Document Footer */}
            <div className="p-4 border-t-4 border-black mt-auto flex justify-between items-end">
              <div className="text-[10px] uppercase font-bold tracking-widest text-gray-500 flex flex-col">
                <span>GENERATED BY SMART_INBOX_AI</span>
                <span>UUID: {generatedReport.id || 'PENDING'}</span>
              </div>
              <div className="w-32 border-b-2 border-black h-8 flex items-end justify-center pb-1">
                <span className="text-[8px] uppercase text-gray-400">TEACHER_SIGNATURE</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dispatch Action Footer */}
      {generatedReport && (
        <footer className="fixed bottom-0 w-full max-w-md bg-surface border-t-2 border-border-harsh p-4 z-50 no-print">
          <button 
            onClick={() => onNavigate('REPORTS')}
            className="w-full bg-primary text-black font-bold uppercase tracking-widest text-lg py-4 px-6 flex items-center justify-center gap-3 hover:bg-white active:bg-primary border-4 border-primary">
            <span>VIEW IN REPORTS -&gt;</span>
          </button>
        </footer>
      )}
    </div>
  );
}
