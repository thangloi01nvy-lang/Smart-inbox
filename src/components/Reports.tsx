import React, { useState, useMemo } from 'react';
import { ArrowLeft, FileText, Calendar, Users, ChevronRight, Trash2, Filter, User, X, Download } from 'lucide-react';
import { AnalysisResult, Class, Student } from '../types';

export function Reports({ 
  onNavigate, 
  reports, 
  classes, 
  students, 
  onSelectReport, 
  onDeleteReport 
}: { 
  onNavigate: (s: string) => void, 
  reports: AnalysisResult[], 
  classes: Class[], 
  students: Student[], 
  onSelectReport: (report: AnalysisResult) => void, 
  onDeleteReport?: (id: string, storagePath?: string) => void 
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredStudents = useMemo(() => {
    if (selectedClassId === 'ALL') return students;
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const filteredReports = useMemo(() => {
    let result = reports;
    if (selectedClassId !== 'ALL') {
      result = result.filter(r => r.classId === selectedClassId);
    }
    if (selectedStudentId !== 'ALL') {
      const student = students.find(s => s.id === selectedStudentId);
      if (student) {
        result = result.filter(r => r.students.some(s => (s.name || '').toLowerCase().includes((student.name || '').toLowerCase()) || (student.name || '').toLowerCase().includes((s.name || '').toLowerCase())));
      }
    }
    if (startDate) {
      const start = new Date(startDate).getTime();
      result = result.filter(r => new Date(r.date).getTime() >= start);
    }
    if (endDate) {
      // Set end date to the end of the selected day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(r => new Date(r.date).getTime() <= end.getTime());
    }
    return result;
  }, [reports, selectedClassId, selectedStudentId, students, startDate, endDate]);

  const handleExportCSV = () => {
    if (filteredReports.length === 0) return;

    const headers = ['Date', 'Class', 'Student', 'Target Score', 'Current Score', 'Estimated Days', 'Comment', 'Summary'];
    const rows: string[][] = [];

    filteredReports.forEach(report => {
      report.students.forEach(student => {
        // If a specific student is selected, only export that student's data
        if (selectedStudentId !== 'ALL') {
          const selectedStudent = students.find(s => s.id === selectedStudentId);
          if (selectedStudent && !(student.name || '').toLowerCase().includes((selectedStudent.name || '').toLowerCase()) && !(selectedStudent.name || '').toLowerCase().includes((student.name || '').toLowerCase())) {
            return;
          }
        }

        rows.push([
          `"${new Date(report.date).toLocaleString().replace(/"/g, '""')}"`,
          `"${(report.className || 'Unknown Class').replace(/"/g, '""')}"`,
          `"${student.name.replace(/"/g, '""')}"`,
          student.targetScore?.toString() || '',
          student.currentScore?.toString() || '',
          student.estimatedDaysToTarget?.toString() || '',
          `"${(student.comment || '').replace(/"/g, '""')}"`,
          `"${(report.summary || '').replace(/"/g, '""')}"`
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reports_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full w-full font-display pb-32 bg-background-dark min-h-screen">
      {/* Top Navigation */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b-2 border-border-harsh bg-background-dark shrink-0 sticky top-0 z-50 gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('INBOX')}
            className="flex items-center justify-center w-10 h-10 shrink-0 bg-background-dark border-2 border-border-harsh text-white hover:bg-surface active:bg-border-harsh">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold uppercase tracking-wider">&gt; REPORTS_ARCHIVE</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => onNavigate('REPORT_GEN')}
            className="text-[10px] sm:text-sm font-bold bg-transparent text-text-main px-2 sm:px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
            [GEN_REPORT]
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 border-b-2 border-border-harsh bg-surface flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Filter size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">FILTER_REPORTS</span>
          </div>
          <button 
            onClick={handleExportCSV}
            disabled={filteredReports.length === 0}
            className="flex items-center gap-2 text-xs font-bold bg-transparent text-primary px-2 py-1 border border-primary hover:bg-primary hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={14} />
            EXPORT CSV
          </button>
        </div>
        <div className="flex gap-2">
          <select 
            className="flex-1 bg-background-dark border-2 border-border-harsh text-white p-2 text-sm uppercase focus:border-primary focus:outline-none"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedStudentId('ALL');
            }}
          >
            <option value="ALL">-- ALL CLASSES --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select 
            className="flex-1 bg-background-dark border-2 border-border-harsh text-white p-2 text-sm uppercase focus:border-primary focus:outline-none"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            disabled={selectedClassId === 'ALL' && students.length === 0}
          >
            <option value="ALL">-- ALL STUDENTS --</option>
            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex-1 flex flex-col">
            <label className="text-[10px] text-muted uppercase font-bold mb-1">START_DATE</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-background-dark border-2 border-border-harsh text-white p-2 text-sm uppercase focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="text-[10px] text-muted uppercase font-bold mb-1">END_DATE</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-background-dark border-2 border-border-harsh text-white p-2 text-sm uppercase focus:border-primary focus:outline-none"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="mt-5 p-2 bg-border-harsh text-white hover:bg-primary hover:text-black transition-colors"
              title="Clear Dates"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {selectedStudentId !== 'ALL' && filteredReports.length > 0 && (
          <div className="bg-surface border-2 border-accent p-4 mb-2 flex flex-col gap-3">
            <div className="flex items-center gap-3 border-b-2 border-border-harsh pb-3">
              <div className="w-12 h-12 bg-accent text-black flex items-center justify-center font-bold">
                <User size={24} />
              </div>
              <div>
                <p className="text-accent text-xs font-bold uppercase tracking-widest">CONSOLIDATED_REPORT</p>
                <p className="text-white text-lg font-bold uppercase">{students.find(s => s.id === selectedStudentId)?.name}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted uppercase font-bold tracking-widest">ALL_FEEDBACK_HISTORY:</p>
              <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {filteredReports.map(report => {
                  const studentFeedback = report.students.find(s => {
                    const student = students.find(st => st.id === selectedStudentId);
                    return student && ((s.name || '').toLowerCase().includes((student.name || '').toLowerCase()) || (student.name || '').toLowerCase().includes((s.name || '').toLowerCase()));
                  });
                  if (!studentFeedback) return null;
                  return (
                    <div key={`feedback-${report.id}`} className="bg-background-dark p-3 border border-border-harsh flex flex-col gap-1 relative group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-primary font-bold uppercase">{new Date(report.date).toLocaleString()}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-muted font-bold">SCORE: {studentFeedback.currentScore}/{studentFeedback.targetScore}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this report? This will remove the feedback for ALL students in this session. This action cannot be undone.')) {
                                if (onDeleteReport && report.id) {
                                  onDeleteReport(report.id, report.storagePath);
                                }
                              }
                            }}
                            className="text-muted hover:text-destructive transition-colors p-1"
                            title="Delete this feedback session"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-white italic">"{studentFeedback.comment}"</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted mb-2">
          <FileText size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">INDIVIDUAL_SESSIONS</span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted border-2 border-dashed border-border-harsh">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="font-bold uppercase tracking-widest">NO_REPORTS_FOUND</p>
            <p className="text-xs mt-2">Try changing your filters or create a new analysis.</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            // If a specific student is selected, we can highlight their specific feedback
            const studentFeedback = selectedStudentId !== 'ALL' 
              ? report.students.find(s => {
                  const student = students.find(st => st.id === selectedStudentId);
                  return student && ((s.name || '').toLowerCase().includes((student.name || '').toLowerCase()) || (student.name || '').toLowerCase().includes((s.name || '').toLowerCase()));
                })
              : null;

            return (
              <article 
                key={report.id}
                className="w-full bg-surface border-2 border-border-harsh rounded-sm p-4 flex flex-col gap-3 hover:border-primary group transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div 
                    className="flex items-start gap-4 flex-1 cursor-pointer"
                    onClick={() => onSelectReport(report)}
                  >
                    {/* Icon */}
                    <div className="text-primary flex items-center justify-center border-2 border-border-harsh shrink-0 w-[48px] h-[48px] bg-background-dark rounded-sm group-hover:border-primary transition-colors">
                      <FileText size={24} />
                    </div>
                    {/* Info */}
                    <div className="flex flex-col justify-center gap-1 flex-1">
                      <h3 className="text-white text-base font-bold leading-none uppercase truncate">
                        {report.summary.substring(0, 30)}...
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-muted text-[11px] font-medium uppercase">
                          <Calendar size={12} />
                          {report.date ? new Date(report.date).toLocaleDateString() : 'UNKNOWN_DATE'}
                        </div>
                        <div className="flex items-center gap-1 text-muted text-[11px] font-medium uppercase">
                          <Users size={12} />
                          {report.students.length} STUDENTS
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
                          if (onDeleteReport && report.id) {
                            onDeleteReport(report.id, report.storagePath);
                          }
                        }
                      }}
                      className="p-2 text-muted hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 size={20} />
                    </button>
                    <ChevronRight className="text-muted group-hover:text-primary transition-colors cursor-pointer" onClick={() => onSelectReport(report)} />
                  </div>
                </div>
                
                {/* Show specific student feedback if a student is selected */}
                {studentFeedback && (
                  <div className="mt-2 pt-3 border-t border-border-harsh">
                    <p className="text-xs text-primary font-bold uppercase mb-1">STUDENT_FEEDBACK:</p>
                    <p className="text-sm text-white italic">"{studentFeedback.comment}"</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-muted">Score: <span className="text-white font-bold">{studentFeedback.currentScore}/{studentFeedback.targetScore}</span></span>
                      <span className="text-xs text-muted">Est. Days: <span className="text-white font-bold">{studentFeedback.estimatedDaysToTarget}</span></span>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
