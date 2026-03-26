/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ClassRoster } from './components/ClassRoster';
import { EditClass } from './components/EditClass';
import { EditStudent } from './components/EditStudent';
import { ReportGen } from './components/ReportGen';
import { AnalysisDetail } from './components/AnalysisDetail';
import { Inbox } from './components/Inbox';
import { Reports } from './components/Reports';
import { AnalysisResult as GeminiResult } from './services/geminiService';
import { Class, Student, AnalysisResult } from './types';
import { auth, db, storage } from './firebase';
import { ref, deleteObject } from 'firebase/storage';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  deleteDoc,
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

type Screen = 'ROSTER' | 'EDIT_CLASS' | 'EDIT_STUDENT' | 'REPORT_GEN' | 'ANALYSIS_DETAIL' | 'INBOX' | 'REPORTS';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('INBOX');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [reports, setReports] = useState<AnalysisResult[]>([]);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user) {
      setClasses([]);
      setStudents([]);
      setReports([]);
      return;
    }

    const qClasses = query(collection(db, 'classes'), where('teacherUid', '==', user.uid));
    const unsubClasses = onSnapshot(qClasses, (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as Class);
      setClasses(list);
    }, (error) => console.error("Firestore Error (Classes):", error));

    const qStudents = query(collection(db, 'students'), where('teacherUid', '==', user.uid));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as Student);
      setStudents(list);
    }, (error) => console.error("Firestore Error (Students):", error));

    const qReports = query(
      collection(db, 'analysisResults'), 
      where('teacherUid', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      const list = snapshot.docs.map(d => d.data() as AnalysisResult);
      setReports(list);
    }, (error) => console.error("Firestore Error (Reports):", error));

    return () => {
      unsubClasses();
      unsubStudents();
      unsubReports();
    };
  }, [user]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    
    if (!email || !password) {
      setAuthError('Vui lòng nhập tài khoản và mật khẩu');
      return;
    }

    // Auto-append domain if it's just a username like "admin"
    const loginEmail = email.includes('@') ? email : `${email}@example.com`;

    try {
      await signInWithEmailAndPassword(auth, loginEmail, password);
    } catch (error: any) {
      console.error("Login Error:", error);
      
      // If user not found, let's try to create it automatically to make testing easy
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, loginEmail, password);
        } catch (createError: any) {
          console.error("Create User Error:", createError);
          if (createError.code === 'auth/email-already-in-use') {
            setAuthError('Sai mật khẩu.');
          } else if (createError.code === 'auth/operation-not-allowed') {
            setAuthError('Tính năng Đăng nhập bằng Email/Mật khẩu chưa được bật. Vui lòng vào Firebase Console -> Authentication -> Sign-in method và bật Email/Password.');
          } else {
            setAuthError('Lỗi: ' + createError.message);
          }
        }
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError('Tính năng Đăng nhập bằng Email/Mật khẩu chưa được bật. Vui lòng vào Firebase Console -> Authentication -> Sign-in method và bật Email/Password.');
      } else {
        setAuthError('Lỗi đăng nhập: ' + error.message);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const handleAnalysisComplete = async (result: GeminiResult) => {
    if (!user) return;

    const id = Date.now().toString();
    const date = new Date().toISOString();
    
    // Find class name
    const cls = classes.find(c => c.name === (result as any).contextClass) || classes[0];
    
    const newReport: AnalysisResult = {
      ...result,
      id,
      date,
      classId: cls?.id || 'UNASSIGNED',
      className: cls?.name || 'UNASSIGNED',
      teacherUid: user.uid,
      students: result.students.map(s => ({
        ...s,
        currentScore: s.currentScore,
        targetScore: s.targetScore,
        estimatedDaysToTarget: s.estimatedDaysToTarget
      }))
    };

    try {
      await setDoc(doc(db, 'analysisResults', id), newReport);
      setAnalysisResult(newReport);
      
      // Delete from Storage to save space (as requested by user)
      if (result.storagePath) {
        const fileRef = ref(storage, result.storagePath);
        deleteObject(fileRef).catch(err => console.error("Error deleting file from storage:", err));
      }
      
      // Update students in Firestore
      for (const sAnalysis of result.students) {
        const student = students.find(s => s.name.toLowerCase().includes(sAnalysis.name.toLowerCase()));
        if (student) {
          const newTrend = [...(student.trend || []), sAnalysis.currentScore].slice(-5);
          await setDoc(doc(db, 'students', student.id), {
            ...student,
            currentScore: sAnalysis.currentScore,
            targetScore: sAnalysis.targetScore,
            estimatedDaysToTarget: sAnalysis.estimatedDaysToTarget,
            lastComment: sAnalysis.comment,
            dataPoints: (student.dataPoints || 0) + 1,
            trend: newTrend,
            lastAnalysisDate: date
          });
        }
      }
    } catch (error) {
      console.error("Error saving analysis:", error);
    }
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

  const handleSaveClass = async (updatedClass: Class) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'classes', updatedClass.id), {
        ...updatedClass,
        teacherUid: user.uid
      });
      setCurrentScreen('ROSTER');
    } catch (error: any) {
      console.error("Error saving class:", error);
      alert("Lỗi khi lưu lớp học: " + error.message);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'classes', id));
      setCurrentScreen('ROSTER');
    } catch (error: any) {
      console.error("Error deleting class:", error);
      alert("Lỗi khi xóa lớp học: " + error.message);
    }
  };

  const handleSaveStudent = async (updatedStudent: Student, newClassId: string, navigateBack: boolean = true) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'students', updatedStudent.id), {
        ...updatedStudent,
        classId: newClassId,
        teacherUid: user.uid
      });
      if (navigateBack) {
        setCurrentScreen('ROSTER');
      }
    } catch (error: any) {
      console.error("Error saving student:", error);
      alert("Lỗi khi lưu học sinh: " + error.message);
    }
  };

  const handleArchiveStudent = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      setCurrentScreen('ROSTER');
    } catch (error: any) {
      console.error("Error archiving student:", error);
      alert("Lỗi khi xóa học sinh: " + error.message);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark text-white font-mono">
        <div className="animate-pulse">LOADING_SYSTEM...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark text-white font-mono p-6">
        <div className="w-full max-w-md border-2 border-border-harsh p-8 bg-surface shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black mb-2 tracking-tighter italic">TOILET_AI</h1>
          <p className="text-text-muted mb-8 text-sm">TEACHER_OBSERVATION_&_INTELLIGENT_LEARNING_ENHANCEMENT_TOOL</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-widest text-text-muted">Tài khoản (VD: admin)</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background-dark border-2 border-border-harsh p-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Nhập tài khoản hoặc email..."
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-widest text-text-muted">Mật khẩu</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background-dark border-2 border-border-harsh p-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Nhập mật khẩu..."
              />
            </div>

            {authError && (
              <div className="text-destructive text-xs font-bold bg-destructive/10 p-2 border border-destructive/30">
                {authError}
              </div>
            )}
            
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-primary text-white p-4 font-bold hover:bg-opacity-90 transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] mt-2"
            >
              <LogIn size={20} />
              ĐĂNG NHẬP
            </button>
          </form>
          
          <p className="mt-6 text-[10px] text-text-muted text-center uppercase tracking-widest leading-relaxed">
            SECURE_CLOUD_SYNC_ENABLED <br/>
            REAL_TIME_STUDENT_TRACKING
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background-dark text-text-main font-mono selection:bg-primary selection:text-white">
      <div className="w-full max-w-3xl min-h-screen flex flex-col relative border-x-2 border-border-harsh bg-background-dark">
        {/* Header with User Info */}
        <div className="border-b-2 border-border-harsh p-4 flex justify-between items-center bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary flex items-center justify-center text-white font-bold border-2 border-black">
              {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <UserIcon size={16} />}
            </div>
            <div>
              <div className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">TEACHER_ID</div>
              <div className="text-xs font-bold truncate max-w-[150px]">{user.displayName || user.email}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-[10px] font-bold uppercase border-2 border-border-harsh px-3 py-1 hover:bg-destructive hover:text-white transition-colors"
          >
            LOGOUT
          </button>
        </div>

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
            onSaveStudent={handleSaveStudent}
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



