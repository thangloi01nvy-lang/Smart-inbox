export interface Student {
  id: string;
  name: string;
  classId: string;
  currentScore: number;
  targetScore: number;
  estimatedDaysToTarget: number;
  lastComment: string;
  lastAnalysisDate?: string;
  teacherUid: string;
  dataPoints?: number; // For UI
  status?: 'READY' | 'PENDING'; // For UI
  trend?: number[]; // For UI
  comments?: { date: string; text: string }[];
}

export interface Class {
  id: string;
  name: string;
  studentIds: string[];
  teacherUid: string;
}

export interface StudentAnalysis {
  name: string;
  comment: string;
  currentScore: number;
  targetScore: number;
  estimatedDaysToTarget: number;
}

export interface AnalysisResult {
  id: string;
  date: string;
  classId: string;
  className: string;
  transcript: string;
  summary: string;
  audioUrl?: string;
  storagePath?: string;
  teacherUid: string;
  students: StudentAnalysis[];
}
