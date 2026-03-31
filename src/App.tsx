import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { gradeHandwriting, GraderResult } from './lib/gemini';
import { cn } from './lib/utils';
import Markdown from 'react-markdown';

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<GraderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setImageFile(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!imageFile || !imagePreview) return;

    setIsProcessing(true);
    setError(null);

    try {
      const base64Data = imagePreview.split(',')[1];
      const mimeType = imageFile.type;
      
      const graderResult = await gradeHandwriting(base64Data, mimeType);
      setResult(graderResult);
    } catch (err) {
      console.error(err);
      setError('Failed to process the image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface border-b border-border py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-main tracking-tight">Handwriting Grader</h1>
            <p className="text-xs text-muted">AI-Powered OCR & Spelling Analysis</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload & Preview */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-muted" />
              Upload Assignment
            </h2>
            
            {!imagePreview ? (
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors",
                  isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-surface/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="bg-background p-4 rounded-full mb-4 shadow-sm border border-border">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-medium text-text-main mb-1">Click or drag image to upload</h3>
                <p className="text-sm text-muted">Supports JPG, PNG, WEBP</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-border bg-background flex items-center justify-center min-h-[300px]">
                  <img 
                    src={imagePreview} 
                    alt="Assignment preview" 
                    className="max-h-[500px] w-auto object-contain"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="flex-1 py-2.5 px-4 rounded-lg border border-border text-text-main font-medium hover:bg-background transition-colors"
                  >
                    Choose Another
                  </button>
                  <button
                    onClick={processImage}
                    disabled={isProcessing}
                    className="flex-[2] py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Analyzing Handwriting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Grade Assignment
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-4 bg-error-bg border border-error/20 rounded-lg flex items-start gap-3 text-error">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="flex flex-col gap-6">
          {isProcessing ? (
            <div className="bg-surface rounded-2xl border border-border p-12 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-border rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-lg font-medium text-text-main mb-2">Analyzing Strokes & Context</h3>
              <p className="text-muted max-w-sm">
                Our AI is carefully reading the handwriting, inferring unclear words from context, and checking for spelling errors...
              </p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Transcription Card */}
              <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="bg-background border-b border-border px-6 py-4">
                  <h3 className="font-semibold text-text-main">Original Transcription</h3>
                </div>
                <div className="p-6">
                  <p className="font-serif text-lg leading-relaxed text-text-main whitespace-pre-wrap">
                    {result.transcription}
                  </p>
                </div>
              </div>

              {/* Spelling Errors */}
              {result.spellingErrors.length > 0 ? (
                <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="bg-error-bg border-b border-error/20 px-6 py-4 flex items-center justify-between">
                    <h3 className="font-semibold text-error flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Spelling Errors ({result.spellingErrors.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {result.spellingErrors.map((err, idx) => (
                      <div key={idx} className="p-4 px-6 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="line-through text-muted font-mono bg-background px-2 py-0.5 rounded text-sm border border-border">
                              {err.original}
                            </span>
                            <span className="text-muted">→</span>
                            <span className="text-success font-mono font-medium bg-success-bg px-2 py-0.5 rounded text-sm border border-success/20">
                              {err.corrected}
                            </span>
                          </div>
                          <p className="text-sm text-muted italic">"...{err.context}..."</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-success-bg border border-success/20 rounded-2xl p-6 flex items-center gap-4 text-success">
                  <div className="bg-success/10 p-3 rounded-full">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Perfect Spelling!</h3>
                    <p className="text-sm opacity-90">No spelling errors were detected in the handwriting.</p>
                  </div>
                </div>
              )}

              {/* Corrected Text */}
              <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="bg-background border-b border-border px-6 py-4">
                  <h3 className="font-semibold text-text-main">Corrected Text</h3>
                </div>
                <div className="p-6">
                  <p className="font-serif text-lg leading-relaxed text-text-main whitespace-pre-wrap">
                    {result.correctedText}
                  </p>
                </div>
              </div>

              {/* Feedback */}
              <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="bg-background border-b border-border px-6 py-4">
                  <h3 className="font-semibold text-text-main">Teacher's Feedback</h3>
                </div>
                <div className="p-6">
                  <div className="markdown-body">
                    <Markdown>{result.feedback}</Markdown>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl border border-border p-12 shadow-sm flex flex-col items-center justify-center text-center h-full min-h-[400px] opacity-50">
              <FileText className="w-16 h-16 text-muted mb-4" />
              <h3 className="text-lg font-medium text-text-main mb-2">Awaiting Assignment</h3>
              <p className="text-muted max-w-sm">
                Upload a handwritten assignment to see the transcription, spelling corrections, and feedback.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
