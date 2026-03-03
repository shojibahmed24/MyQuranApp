import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Loader2, Trash2, Timer, Sparkles } from 'lucide-react';
import { storageService } from '../services/storageService';

interface RecorderProps {
  onUploadComplete?: (path: string) => void;
  bucket?: 'confessions' | 'comments';
  label?: string;
  minimal?: boolean;
}

export default function Recorder({ 
  onUploadComplete, 
  bucket = 'confessions', 
  label = 'Share a Whisper',
  minimal = false
}: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopVisualizer();
    };
  }, [isRecording]);

  const startVisualizer = (stream: MediaStream) => {
    if (!canvasRef.current) return;
    
    try {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        analyserRef.current?.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;
          ctx.fillStyle = `rgb(16, 185, 129)`; // Emerald-500
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      };
      
      draw();
    } catch (err) {
      console.error("Error starting visualizer:", err);
    }
  };

  const stopVisualizer = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        stopVisualizer();
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setDuration(0);
      
      // Start visualizer using the same stream
      setTimeout(() => startVisualizer(stream), 100);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Please allow microphone access to record.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    setUploading(true);
    try {
      const path = await storageService.uploadFile(bucket, audioBlob);
      if (onUploadComplete) onUploadComplete(path);
      setAudioBlob(null);
      setDuration(0);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload recording.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (minimal) {
    return (
      <div className="flex items-center gap-2">
        {!audioBlob ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg transition-all ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
            }`}
          >
            {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={16} />}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAudioBlob(null); setDuration(0); }}
              className="p-2 rounded-lg bg-stone-100 text-zinc-400 hover:text-red-500"
              disabled={uploading}
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{uploading ? '...' : 'Send'}</span>
            </button>
          </div>
        )}
        {isRecording && <span className="text-[10px] font-mono font-bold text-red-500">{formatTime(duration)}</span>}
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-zinc-900">{label}</h3>
        </div>
        {isRecording && (
          <div className="flex items-center gap-2 text-red-500 font-mono text-xs font-bold">
            <Timer size={14} />
            {formatTime(duration)}
          </div>
        )}
      </div>

      <div className="relative h-24 bg-stone-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center overflow-hidden mb-6">
        {isRecording ? (
          <canvas ref={canvasRef} width={300} height={80} className="w-full h-full" />
        ) : audioBlob ? (
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="text-emerald-500" size={20} />
            <p className="text-xs text-zinc-500 font-medium">Recording captured ({formatTime(duration)})</p>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 font-medium">Tap the mic to start whispering...</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        {!audioBlob ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-500/20' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-500/20'
            }`}
          >
            {isRecording ? <Square size={24} fill="currentColor" /> : <Mic size={24} />}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setAudioBlob(null); setDuration(0); }}
              className="p-4 rounded-xl bg-stone-100 text-zinc-500 hover:bg-stone-200 transition-all"
              disabled={uploading}
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Send size={20} />
                  <span>Share Whisper</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}