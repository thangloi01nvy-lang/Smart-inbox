import React, { useState, useEffect, useRef } from 'react';
import { Mic, Camera, FileText, Plus, X, Upload, Square, Brain, Trash2 } from 'lucide-react';
import { Class, Student } from '../types';
import { storage, auth, db } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { analyzeMedia } from '../services/geminiService';

export function Inbox({ onNavigate, classes, students, reports = [], onDeleteReport, onSelectReport, onGenerateReport }: { 
  onNavigate: (s: string) => void, 
  classes: Class[],
  students: Student[],
  reports?: any[],
  onDeleteReport?: (id: string, storagePath?: string) => void,
  onSelectReport?: (report: any) => void,
  onGenerateReport?: (classId: string, studentId: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingPhase, setProcessingPhase] = useState<'IDLE' | 'PROCESSING'>('IDLE');
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || 'UNASSIGNED');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isTypingNote, setIsTypingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [lastSaved, setLastSaved] = useState<{classId: string, studentId: string, studentName: string} | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Filter students based on selected class
  const classStudents = students.filter(s => s.classId === selectedClass);

  // Auto-select first student when class changes
  useEffect(() => {
    if (classStudents.length > 0) {
      setSelectedStudent(classStudents[0].id);
    } else {
      setSelectedStudent('');
    }
  }, [selectedClass, students]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStartRecording = async () => {
    setShowMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processMediaBlob(audioBlob, 'audio/webm');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to record audio.");
    }
  };

  const compressImage = async (file: Blob): Promise<Blob> => {
    if (!file.type.startsWith('image/')) return file;
    
    try {
      let imgWidth, imgHeight;
      let imgSource: CanvasImageSource;
      
      if (typeof createImageBitmap !== 'undefined') {
        const bmp = await createImageBitmap(file);
        imgWidth = bmp.width;
        imgHeight = bmp.height;
        imgSource = bmp;
      } else {
        const img = new Image();
        const url = URL.createObjectURL(file);
        await new Promise((resolve, reject) => {
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Image load failed'));
          };
          img.src = url;
        });
        imgWidth = img.width;
        imgHeight = img.height;
        imgSource = img;
      }

      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = imgWidth;
      let height = imgHeight;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      
      ctx.drawImage(imgSource, 0, 0, width, height);
      
      return await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob || file);
        }, 'image/jpeg', 0.6);
      });
    } catch (e) {
      console.error("Image compression failed, falling back to original", e);
      return file;
    }
  };

  const processMediaBlob = async (rawBlob: Blob, rawMimeType: string) => {
    if (!selectedStudent) {
      alert("Please select a student first.");
      return;
    }
    setProcessingCount(prev => prev + 1);
    setProcessingPhase('PROCESSING');
    setUploadProgress(0);
    setProcessingProgress(0);
    
    // Yield to the event loop so React can render the "UPLOADING..." state
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      // Compress image if it's an image
      const blob = await compressImage(rawBlob);
      const mimeType = blob.type || rawMimeType;

      // Convert blob to base64 for Gemini immediately
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });
      const base64Data = (reader.result as string).split(',')[1];

      // Prepare Firebase Storage upload promise
      let fileUrl = '';
      let storagePath = '';
      
      const uploadPromise = (async () => {
        if (auth.currentUser) {
          const fileId = Date.now().toString();
          const path = `logs/${auth.currentUser.uid}/${fileId}`;
          const storageRef = ref(storage, path);
          
          const uploadTask = uploadBytesResumable(storageRef, blob);
          
          await new Promise<void>((resolve, reject) => {
            uploadTask.on('state_changed', 
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
              },
              (error) => {
                reject(error);
              },
              async () => {
                fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
                storagePath = path;
                resolve();
              }
            );
          });
        }
      })();

      // Start AI Analysis in parallel
      const className = classes.find(c => c.id === selectedClass)?.name || 'Unknown';
      let analysisData: any = null;
      
      const aiPromise = (async () => {
        // Simulate processing progress
        const progressInterval = setInterval(() => {
          setProcessingProgress(prev => {
            if (prev >= 95) return prev;
            return prev + (95 - prev) * 0.1; // Asymptotic approach to 95%
          });
        }, 500);

        try {
          analysisData = await analyzeMedia(base64Data, mimeType, className);
        } catch (analyzeError) {
          console.error("AI Analysis failed:", analyzeError);
          // We continue to save the log even if AI fails
        }
        
        clearInterval(progressInterval);
        setProcessingProgress(100);
      })();

      // Wait for both upload and AI analysis to complete
      await Promise.all([uploadPromise, aiPromise]);

      // Save log to Firestore
      if (auth.currentUser) {
        await addDoc(collection(db, 'logs'), {
          studentId: selectedStudent,
          classId: selectedClass,
          type: mimeType.startsWith('image/') ? 'image' : 'audio',
          fileUrl,
          storagePath,
          date: new Date().toISOString(),
          teacherUid: auth.currentUser.uid
        });
        
        // Save analysis result if successful
        if (analysisData) {
          const newReport = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            teacherUid: auth.currentUser.uid,
            classId: selectedClass,
            className: className,
            transcript: analysisData.transcript || 'Media Analysis',
            summary: analysisData.summary || 'Media Analysis',
            students: analysisData.students,
            audioUrl: fileUrl,
            storagePath: storagePath,
            type: mimeType.startsWith('image/') ? 'image_analysis' : 'audio_analysis'
          };
          await setDoc(doc(db, 'analysisResults', newReport.id), newReport);
          
          // Update student stats
          const student = students.find(s => s.id === selectedStudent);
          if (student && analysisData.students && analysisData.students.length > 0) {
            const sAnalysis = analysisData.students[0];
            const newTrend = [...(student.trend || []), sAnalysis.currentScore].slice(-5);
            
            const newComment = { date: newReport.date, text: sAnalysis.comment };
            const updatedComments = [...(student.comments || [])];
            if (student.lastComment && updatedComments.length === 0) {
              updatedComments.push({ date: student.lastAnalysisDate || new Date(0).toISOString(), text: student.lastComment });
            }
            updatedComments.push(newComment);

            await setDoc(doc(db, 'students', student.id), {
              ...student,
              currentScore: sAnalysis.currentScore,
              targetScore: sAnalysis.targetScore,
              estimatedDaysToTarget: sAnalysis.estimatedDaysToTarget,
              lastComment: sAnalysis.comment,
              comments: updatedComments,
              dataPoints: (student.dataPoints || 0) + 1,
              trend: newTrend,
              lastAnalysisDate: newReport.date
            });
          }
        }
      }

      setTimeout(() => {
        setProcessingCount(prev => Math.max(0, prev - 1));
        setProcessingPhase('IDLE');
        setUploadProgress(0);
        setProcessingProgress(0);
      }, 1000);
      
      const studentName = students.find(s => s.id === selectedStudent)?.name || 'Student';
      setLastSaved({ classId: selectedClass, studentId: selectedStudent, studentName });
      setTimeout(() => setLastSaved(null), 5000);
    } catch (error) {
      console.error("Error processing media:", error);
      alert("Failed to process media. Please try again.");
      setProcessingCount(prev => Math.max(0, prev - 1));
      setProcessingPhase('IDLE');
      setUploadProgress(0);
      setProcessingProgress(0);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      // Clear chunks so onstop doesn't process
      audioChunksRef.current = [];
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setShowMenu(false);
      let mimeType = file.type;
      
      // Normalize MP3 mime type for better compatibility with Gemini
      if (file.name.toLowerCase().endsWith('.mp3')) {
        mimeType = 'audio/mpeg';
      } else if (!mimeType) {
        // Fallback for common types if browser fails to detect
        if (file.name.toLowerCase().endsWith('.wav')) mimeType = 'audio/wav';
        if (file.name.toLowerCase().endsWith('.m4a')) mimeType = 'audio/mp4';
        if (file.name.toLowerCase().endsWith('.png')) mimeType = 'image/png';
        if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
      }
      
      processMediaBlob(file, mimeType || 'application/octet-stream');
    }
  };

  const handleStartNote = () => {
    setShowMenu(false);
    setIsTypingNote(true);
    setNoteText('');
  };

  const handleCancelNote = () => {
    setIsTypingNote(false);
    setNoteText('');
  };

  const handleSubmitNote = async () => {
    if (!noteText.trim() || !selectedStudent) {
      if (!selectedStudent) alert("Please select a student first.");
      return;
    }
    setIsTypingNote(false);
    setProcessingCount(prev => prev + 1);
    try {
      if (auth.currentUser) {
        await addDoc(collection(db, 'logs'), {
          studentId: selectedStudent,
          classId: selectedClass,
          type: 'text',
          content: noteText,
          date: new Date().toISOString(),
          teacherUid: auth.currentUser.uid
        });
      }
      setProcessingCount(prev => Math.max(0, prev - 1));
      const studentName = students.find(s => s.id === selectedStudent)?.name || 'Student';
      setLastSaved({ classId: selectedClass, studentId: selectedStudent, studentName });
      setTimeout(() => setLastSaved(null), 5000);
    } catch (error: any) {
      console.error("Error saving text log:", error);
      alert("Failed to save text log: " + (error.message || error));
      setProcessingCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="font-display bg-background-dark min-h-screen relative pb-24 selection:bg-primary selection:text-white w-full">
      {/* Sticky TopAppBar */}
      <div className="sticky top-0 z-50 w-full bg-background-dark border-b-2 border-border-harsh">
        <div className="flex flex-col sm:flex-row sm:items-center p-4 justify-between gap-3">
          <h2 className="text-text-main text-2xl sm:text-[32px] font-bold leading-tight tracking-tight uppercase flex-1">&gt; INBOX</h2>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => onNavigate('REPORT_GEN')}
              className="text-[10px] sm:text-sm font-bold bg-transparent text-text-main px-2 sm:px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
              [GEN_REPORT]
            </button>
            <button 
              onClick={() => onNavigate('REPORTS')}
              className="text-[10px] sm:text-sm font-bold bg-transparent text-text-main px-2 sm:px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
              [REPORTS]
            </button>
            <button 
              onClick={() => onNavigate('ROSTER')}
              className="text-[10px] sm:text-sm font-bold bg-transparent text-text-main px-2 sm:px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
              [ROSTER]
            </button>
          </div>
        </div>
        {/* Context Selectors */}
        <div className="px-4 pb-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">CLASS:</label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-surface border-2 border-border-harsh text-white p-3 text-sm font-bold uppercase appearance-none focus:border-primary focus:outline-none cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {classes.length === 0 && <option value="UNASSIGNED">NO_CLASSES_FOUND</option>}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">STUDENT:</label>
            <select 
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full bg-surface border-2 border-border-harsh text-white p-3 text-sm font-bold uppercase appearance-none focus:border-primary focus:outline-none cursor-pointer"
            >
              {classStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
              {classStudents.length === 0 && <option value="">NO_STUDENTS_FOUND</option>}
            </select>
          </div>
        </div>
        {lastSaved && (
          <div className="px-4 pb-4">
            <div className="bg-primary text-black p-3 flex justify-between items-center border-2 border-primary">
              <span className="text-sm font-bold uppercase tracking-widest">LOG SAVED: {lastSaved.studentName}</span>
              <button 
                onClick={() => onGenerateReport && onGenerateReport(lastSaved.classId, lastSaved.studentId)}
                className="bg-black text-primary px-3 py-1 text-xs font-bold uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-colors"
              >
                GENERATE REPORT
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Feed Content */}
      <main className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-4">
        {processingCount > 0 && (
          <article className="w-full bg-surface border-2 border-border-harsh rounded-sm p-4 flex flex-col gap-3 cursor-pointer hover:border-muted active:bg-border-harsh">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Icon */}
                <div className="text-text-main flex items-center justify-center border-2 border-border-harsh shrink-0 w-[48px] h-[48px] bg-background-dark rounded-sm">
                  <Upload size={24} />
                </div>
                {/* Info */}
                <div className="flex flex-col justify-center gap-1 flex-1">
                  <h3 className="text-text-main text-base font-bold leading-none uppercase">
                    {processingPhase === 'PROCESSING' ? 'PROCESSING MEDIA...' : 'PROCESSING...'}
                  </h3>
                  <p className="text-muted text-[13px] font-medium leading-none uppercase">
                    UPLOADING & ANALYZING
                  </p>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full h-2 bg-background-dark border border-border-harsh mt-2 relative">
                      <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {processingProgress > 0 && processingProgress < 100 && (
                    <div className="w-full h-2 bg-background-dark border border-border-harsh mt-2 relative">
                      <div 
                        className="h-full bg-accent transition-all duration-300" 
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Status Pill */}
            <div className={`self-end px-2 py-1 border-2 text-[12px] font-bold uppercase rounded-sm flex items-center gap-2 border-accent text-accent`}>
              <span className={`w-2 h-2 rounded-none animate-pulse bg-accent`}></span>
              {processingProgress > 0 ? `${Math.round(processingProgress)}%` : 'PROCESSING...'}
            </div>
          </article>
        )}

        {reports.length === 0 && processingCount === 0 ? (
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
                  onClick={() => {
                    if (onSelectReport) onSelectReport(report);
                  }}
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
                        {report.date ? new Date(report.date).toLocaleDateString() : 'UNKNOWN_DATE'}
                      </div>
                      <div className="flex items-center gap-1 text-muted text-[11px] font-medium uppercase">
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
                </div>
              </div>
              {/* Status Pill */}
              <div className="self-end px-2 py-1 border-2 border-accent text-accent text-[12px] font-bold uppercase rounded-sm">
                ANALYZED
              </div>
            </article>
          ))
        )}
      </main>

      {/* Action Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-40 flex items-end justify-end p-6 bg-black/80 backdrop-blur-sm" onClick={() => setShowMenu(false)}>
          <div className="flex flex-col gap-4 mb-20 items-end" onClick={e => e.stopPropagation()}>
            <label className="flex items-center gap-4 bg-surface border-2 border-border-harsh p-4 cursor-pointer hover:border-white group">
              <span className="text-white font-bold uppercase tracking-widest group-hover:text-primary">UPLOAD_FILE</span>
              <div className="w-12 h-12 bg-background-dark border-2 border-border-harsh flex items-center justify-center group-hover:border-primary text-white group-hover:text-primary">
                <Upload size={24} />
              </div>
              <input type="file" className="hidden" accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
            </label>

            <label className="flex items-center gap-4 bg-surface border-2 border-border-harsh p-4 cursor-pointer hover:border-white group">
              <span className="text-white font-bold uppercase tracking-widest group-hover:text-primary">TAKE_PHOTO</span>
              <div className="w-12 h-12 bg-background-dark border-2 border-border-harsh flex items-center justify-center group-hover:border-primary text-white group-hover:text-primary">
                <Camera size={24} />
              </div>
              <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
            </label>

            <button onClick={handleStartRecording} className="flex items-center gap-4 bg-surface border-2 border-border-harsh p-4 cursor-pointer hover:border-white group">
              <span className="text-white font-bold uppercase tracking-widest group-hover:text-primary">RECORD_AUDIO</span>
              <div className="w-12 h-12 bg-background-dark border-2 border-border-harsh flex items-center justify-center group-hover:border-primary text-white group-hover:text-primary">
                <Mic size={24} />
              </div>
            </button>

            <button onClick={handleStartNote} className="flex items-center gap-4 bg-surface border-2 border-border-harsh p-4 cursor-pointer hover:border-white group">
              <span className="text-white font-bold uppercase tracking-widest group-hover:text-primary">WRITE_NOTE</span>
              <div className="w-12 h-12 bg-background-dark border-2 border-border-harsh flex items-center justify-center group-hover:border-primary text-white group-hover:text-primary">
                <FileText size={24} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setShowMenu(!showMenu)}
        className={`fixed bottom-6 right-6 w-[64px] h-[64px] ${showMenu ? 'bg-white text-black border-white' : 'bg-primary text-background-dark border-primary'} border-2 rounded-sm shadow-none flex items-center justify-center hover:bg-white hover:border-white active:bg-primary active:border-primary z-50 transition-colors duration-200`}
      >
        {showMenu ? <X size={32} strokeWidth={3} /> : <Plus size={32} strokeWidth={3} />}
      </button>

      {/* Text Input Modal */}
      {isTypingNote && (
        <div className="fixed inset-0 bg-background-dark z-[100] flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex-1 flex flex-col gap-4 max-w-2xl w-full mx-auto mt-12">
            <div className="flex items-center gap-3 text-white mb-4">
              <FileText size={32} className="text-primary" />
              <h2 className="text-xl font-bold uppercase tracking-widest">WRITE_EVALUATION_NOTE</h2>
            </div>
            
            <textarea 
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Type your evaluation here... (e.g. 'Minh did great today, but Lan needs to practice her vocabulary.')"
              className="flex-1 w-full bg-surface border-2 border-border-harsh text-white p-4 font-mono resize-none focus:border-primary focus:outline-none"
            />
          </div>
          
          <div className="flex gap-4 w-full max-w-2xl mx-auto mt-6 mb-8">
            <button 
              onClick={handleCancelNote} 
              className="flex-1 border-2 border-border-harsh text-white py-5 font-bold uppercase tracking-widest hover:bg-border-harsh flex items-center justify-center gap-2">
              [ CANCEL ]
            </button>
            <button 
              onClick={handleSubmitNote} 
              disabled={!noteText.trim()}
              className="flex-1 border-2 border-primary bg-primary text-background-dark py-5 font-bold uppercase tracking-widest hover:bg-white hover:border-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Brain size={18} fill="currentColor" />
              [ ANALYZE_&_SAVE ]
            </button>
          </div>
        </div>
      )}

      {/* Recording Modal */}
      {isRecording && (
        <div className="fixed inset-0 bg-background-dark z-[100] flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex-1 flex flex-col items-center justify-center gap-12">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-40 h-40 rounded-full border-4 border-primary animate-ping opacity-20"></div>
              <div className="absolute w-32 h-32 rounded-full border-4 border-primary animate-pulse opacity-40"></div>
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center z-10">
                <Mic size={40} className="text-background-dark" />
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="text-6xl font-mono font-bold text-primary tracking-widest">
                {formatTime(recordingTime)}
              </div>
              <div className="text-white font-bold tracking-widest uppercase text-sm animate-pulse">
                &gt; RECORDING_AUDIO...
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 w-full max-w-md mx-auto mb-8">
            <button 
              onClick={handleCancelRecording} 
              className="flex-1 border-2 border-border-harsh text-white py-5 font-bold uppercase tracking-widest hover:bg-border-harsh flex items-center justify-center gap-2">
              [ CANCEL ]
            </button>
            <button 
              onClick={handleStopRecording} 
              className="flex-1 border-2 border-primary bg-primary text-background-dark py-5 font-bold uppercase tracking-widest hover:bg-white hover:border-white flex items-center justify-center gap-2">
              <Square size={18} fill="currentColor" />
              [ STOP_&_SAVE ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
