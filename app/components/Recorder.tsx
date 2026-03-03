import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Loader2, Trash2, Timer, Sparkles } from 'lucide-react';
import { storageService } from '../services/storageService';

interface RecorderProps {
  onUploadComplete?: (path: string) => void;
  bucket?: 'confessions' | 'comments';
  label?: string;
}

export default function Recorder({ 
  onUploadComplete, 
  bucket = 'confessions', 
  label = 'Share a Whisper' 
}: RecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

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
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];
      setDuration(0);

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
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
    } catch (err: any) {
      console.error('Upload error:', err);
      alert('Failed to upload audio: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 w-full max-w-md shadow-xl">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{label}</h3>
        </div>

        <div className="flex items-center gap-6">
          {!audioBlob ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse scale-110' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-7 h-7" />}
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setAudioBlob(null); setDuration(0); }}
                className="p-4 text-zinc-400 hover:text-red-500 transition-colors bg-stone-100 rounded-xl"
                disabled={uploading}
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-emerald-600 text-white px-8 py-4 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-600/10"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Release Whisper
              </button>
            </div>
          )}
        </div>

        {(isRecording || audioBlob) && (
          <div className="flex items-center gap-2 text-zinc-900 text-sm font-mono bg-stone-100 px-4 py-2 rounded-xl border border-slate-200">
            <Timer className={`w-4 h-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`} />
            {formatDuration(duration)}
          </div>
        )}
      </div>
    </div>
  );
}