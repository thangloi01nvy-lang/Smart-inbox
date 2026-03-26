import React, { useState, useEffect, useRef } from 'react';
import { Mic, Camera, FileText, Plus, X, Upload, Square, Brain } from 'lucide-react';
import { analyzeMedia, analyzeText, AnalysisResult } from '../services/geminiService';
import { Class } from '../types';
import { storage, auth } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function Inbox({ onNavigate, onAnalysisComplete, classes }: { 
  onNavigate: (s: string) => void, 
  onAnalysisComplete?: (result: any) => void,
  classes: Class[]
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedClass, setSelectedClass] = useState(classes[0]?.name || 'UNASSIGNED');
  const [isTypingNote, setIsTypingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const processMediaBlob = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    try {
      // Prepare Firebase Storage upload promise
      let uploadPromise = Promise.resolve({ audioUrl: '', storagePath: '' });
      if (auth.currentUser) {
        const fileId = Date.now().toString();
        const path = `recordings/${auth.currentUser.uid}/${fileId}`;
        const storageRef = ref(storage, path);
        uploadPromise = uploadBytes(storageRef, blob).then(async (uploadResult) => {
          const url = await getDownloadURL(uploadResult.ref);
          return { audioUrl: url, storagePath: path };
        });
      }

      // Prepare Gemini analysis promise
      const analysisPromise = new Promise<AnalysisResult>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          try {
            const base64data = (reader.result as string).split(',')[1];
            const result = await analyzeMedia(base64data, mimeType, selectedClass);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = reject;
      });

      // Run both in parallel
      const [uploadData, analysisResult] = await Promise.all([uploadPromise, analysisPromise]);

      if (onAnalysisComplete) {
        onAnalysisComplete({ 
          ...analysisResult, 
          audioUrl: uploadData.audioUrl, 
          storagePath: uploadData.storagePath, 
          className: selectedClass 
        });
      }
      setIsProcessing(false);
      onNavigate('ANALYSIS_DETAIL');
    } catch (error) {
      console.error("Error processing media:", error);
      alert("Failed to process media. Please try again.");
      setIsProcessing(false);
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
    if (!noteText.trim()) return;
    setIsTypingNote(false);
    setIsProcessing(true);
    try {
      const result = await analyzeText(noteText, selectedClass);
      if (onAnalysisComplete) {
        onAnalysisComplete({ ...result, className: selectedClass });
      }
      setIsProcessing(false);
      onNavigate('ANALYSIS_DETAIL');
    } catch (error) {
      console.error("Error analyzing text:", error);
      alert("Failed to analyze text with Gemini.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="font-display bg-background-dark min-h-screen relative pb-24 selection:bg-primary selection:text-white w-full">
      {/* Sticky TopAppBar */}
      <div className="sticky top-0 z-50 w-full bg-background-dark border-b-2 border-border-harsh">
        <div className="flex items-center p-4 justify-between">
          <h2 className="text-text-main text-[32px] font-bold leading-tight tracking-tight uppercase flex-1">&gt; INBOX</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => onNavigate('REPORTS')}
              className="text-sm font-bold bg-transparent text-text-main px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
              [REPORTS]
            </button>
            <button 
              onClick={() => onNavigate('ROSTER')}
              className="text-sm font-bold bg-transparent text-text-main px-3 py-1 border-2 border-border-harsh hover:bg-text-main hover:text-background-dark">
              [ROSTER]
            </button>
          </div>
        </div>
        {/* Class Selector Context */}
        <div className="px-4 pb-4">
          <label className="text-xs font-bold text-muted uppercase tracking-widest mb-1 block">CURRENT_CONTEXT:</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full bg-surface border-2 border-border-harsh text-white p-3 text-sm font-bold uppercase appearance-none focus:border-primary focus:outline-none cursor-pointer"
          >
            {classes.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
            {classes.length === 0 && <option value="UNASSIGNED">NO_CLASSES_FOUND</option>}
          </select>
        </div>
      </div>

      {/* Main Feed Content */}
      <main className="w-full max-w-2xl mx-auto p-4 flex flex-col gap-4">
        {/* Processing Item */}
        <article className="w-full bg-surface border-2 border-border-harsh rounded-sm p-4 flex flex-col gap-3 cursor-pointer hover:border-muted active:bg-border-harsh">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon */}
              <div className="text-text-main flex items-center justify-center border-2 border-border-harsh shrink-0 w-[48px] h-[48px] bg-background-dark rounded-sm">
                <Mic size={24} />
              </div>
              {/* Info */}
              <div className="flex flex-col justify-center gap-1">
                <h3 className="text-text-main text-base font-bold leading-none uppercase">AUDIO_REQ_095</h3>
                <p className="text-muted text-[13px] font-medium leading-none uppercase">TODAY, 14:05 PM</p>
                <p className="text-muted text-[13px] font-medium leading-none uppercase">DUR: 01:12:05 | SZE: 104MB</p>
              </div>
            </div>
          </div>
          {/* Status Pill */}
          <div className="self-end px-2 py-1 border-2 border-primary text-primary text-[12px] font-bold uppercase rounded-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-none animate-none"></span>
            PROCESSING...
          </div>
        </article>

        {/* Completed Item */}
        <article 
          onClick={() => onNavigate('ANALYSIS_DETAIL')}
          className="w-full bg-surface border-2 border-border-harsh rounded-sm p-4 flex flex-col gap-3 cursor-pointer hover:border-muted active:bg-border-harsh">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon */}
              <div className="text-text-main flex items-center justify-center border-2 border-border-harsh shrink-0 w-[48px] h-[48px] bg-background-dark rounded-sm">
                <Camera size={24} />
              </div>
              {/* Info */}
              <div className="flex flex-col justify-center gap-1">
                <h3 className="text-text-main text-base font-bold leading-none uppercase">IMG_CAP_042</h3>
                <p className="text-muted text-[13px] font-medium leading-none uppercase">TODAY, 11:30 AM</p>
                <p className="text-muted text-[13px] font-medium leading-none uppercase">SZE: 4.2MB | TAG: WHITEBOARD</p>
              </div>
            </div>
          </div>
          {/* Status Pill */}
          <div className="self-end px-2 py-1 border-2 border-accent text-accent text-[12px] font-bold uppercase rounded-sm">
            ANALYZED
          </div>
        </article>

        {/* Completed Item */}
        <article 
          onClick={() => onNavigate('ANALYSIS_DETAIL')}
          className="w-full bg-surface border-2 border-border-harsh rounded-sm p-4 flex flex-col gap-3 cursor-pointer hover:border-muted active:bg-border-harsh">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon */}
              <div className="text-text-main flex items-center justify-center border-2 border-border-harsh shrink-0 w-[48px] h-[48px] bg-background-dark rounded-sm">
                <Mic size={24} />
              </div>
              {/* Info */}
              <div className="flex flex-col justify-center gap-1">
                <h3 className="text-text-main text-base font-bold leading-none uppercase">AUDIO_REQ_094</h3>
                <p className="text-muted text-[13px] font-medium leading-none uppercase">OCT 24, 10:30 AM</p>
                <p className="text-muted text-[13px] font-medium leading-none uppercase">DUR: 45:12 | SZE: 42MB</p>
              </div>
            </div>
          </div>
          {/* Status Pill */}
          <div className="self-end px-2 py-1 border-2 border-accent text-accent text-[12px] font-bold uppercase rounded-sm">
            ANALYZED
          </div>
        </article>

        {/* Error Item */}
        <article className="w-full bg-surface border-2 border-border-harsh rounded-sm p-4 flex flex-col gap-3 cursor-pointer hover:border-muted active:bg-border-harsh opacity-75">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon */}
              <div className="text-muted flex items-center justify-center border-2 border-border-harsh shrink-0 w-[48px] h-[48px] bg-background-dark rounded-sm">
                <FileText size={24} />
              </div>
              {/* Info */}
              <div className="flex flex-col justify-center gap-1">
                <h3 className="text-muted text-base font-bold leading-none uppercase line-through">TXT_NOTE_011</h3>
                <p className="text-muted text-[13px] font-medium leading-none uppercase">OCT 23, 09:15 AM</p>
                <p className="text-muted text-[13px] font-medium leading-none uppercase">SZE: 1KB</p>
              </div>
            </div>
          </div>
          {/* Status Pill */}
          <div className="self-end px-2 py-1 border-2 border-red-600 text-red-600 text-[12px] font-bold uppercase rounded-sm">
            [ERROR] UPLOAD FAILED
          </div>
        </article>
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
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background-dark z-[100] flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-32 h-32 rounded-full border-4 border-accent animate-spin border-t-transparent"></div>
              <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center z-10">
                <Brain size={40} className="text-background-dark" />
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="text-white font-bold tracking-widest uppercase text-lg animate-pulse">
                &gt; AI_ANALYZING_AUDIO...
              </div>
              <div className="text-muted font-bold tracking-widest uppercase text-xs">
                EXTRACTING_ENTITIES_AND_SENTIMENT
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
