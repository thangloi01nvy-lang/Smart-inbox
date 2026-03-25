import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-950 text-white p-6 font-mono text-center">
          <h1 className="text-4xl font-bold text-white mb-4 border-b-4 border-white pb-2">CRITICAL ERROR</h1>
          <div className="border-4 border-white p-6 max-w-md bg-black shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]">
            <p className="mb-4 text-xl font-bold uppercase tracking-tighter">Ứng dụng đã gặp lỗi nghiêm trọng.</p>
            <div className="text-xs text-left overflow-auto bg-zinc-900 p-4 mb-6 max-h-60 border-2 border-zinc-700 font-mono">
              <p className="text-red-400 font-bold mb-2">&gt; ERROR_LOG:</p>
              {error?.toString()}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black px-6 py-4 font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"
            >
              [ TẢI LẠI TRANG ]
            </button>
          </div>
          <p className="mt-8 text-xs opacity-50 uppercase tracking-widest">Teacher AI Assistant // Debug Mode</p>
        </div>
      );
    }

    return this.props.children;
  }
}
