import React from 'react';
import { ArrowLeft, FileText, Calendar, Users, ChevronRight, Trash2 } from 'lucide-react';
import { AnalysisResult } from '../types';

export function Reports({ onNavigate, reports, onSelectReport, onDeleteReport }: { onNavigate: (s: string) => void, reports: AnalysisResult[], onSelectReport: (report: AnalysisResult) => void, onDeleteReport?: (id: string, storagePath?: string) => void }) {
  return (
    <div className="flex flex-col h-full w-full font-display pb-32 bg-background-dark min-h-screen">
      {/* Top Navigation */}
      <header className="flex items-center justify-between p-4 border-b-2 border-border-harsh bg-background-dark shrink-0 sticky top-0 z-50">
        <button 
          onClick={() => onNavigate('INBOX')}
          className="flex items-center justify-center w-10 h-10 bg-background-dark border-2 border-border-harsh text-white hover:bg-surface active:bg-border-harsh">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold uppercase tracking-wider">&gt; REPORTS_ARCHIVE</h1>
        <div className="w-10 h-10"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted border-2 border-dashed border-border-harsh">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="font-bold uppercase tracking-widest">NO_REPORTS_FOUND</p>
            <p className="text-xs mt-2">Create a new analysis to see it here.</p>
          </div>
        ) : (
          reports.map((report) => (
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
                      if (onDeleteReport && report.id) {
                        onDeleteReport(report.id, report.storagePath);
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
            </article>
          ))
        )}
      </main>
    </div>
  );
}
