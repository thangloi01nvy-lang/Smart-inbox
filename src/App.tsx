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

type Screen = 'ROSTER' | 'EDIT_CLASS' | 'EDIT_STUDENT' | 'REPORT_GEN' | 'ANALYSIS_DETAIL' | 'INBOX' | 'REPORTS';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('INBOX');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [reports, setReports] = useState<AnalysisResult[]>([]);

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

  return (
    <div className="min-h-screen flex flex-col items-center bg-background-dark text-text-main font-mono selection:bg-primary selection:text-white">
      <div className="w-full max-w-3xl min-h-screen flex flex-col relative border-x-2 border-border-harsh bg-background-dark">
        {currentScreen === 'INBOX' && <Inbox onNavigate={navigate} onAnalysisComplete={handleAnalysisComplete} />}
        {currentScreen === 'ROSTER' && <ClassRoster onNavigate={navigate} />}
        {currentScreen === 'EDIT_CLASS' && <EditClass onNavigate={navigate} />}
        {currentScreen === 'EDIT_STUDENT' && <EditStudent onNavigate={navigate} />}
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



