import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AudioPlayerProps {
  url: string;
  confessionId?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, confessionId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTrackedPlay = useRef(false);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        if (confessionId && !hasTrackedPlay.current) {
          trackPlay();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const trackPlay = async () => {
    hasTrackedPlay.current = true;
    await supabase.rpc('increment_plays', { confession_id: confessionId });
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="bg-stone-100 border border-slate-200 rounded-xl p-3 flex items-center gap-4">
      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded}
        muted={isMuted}
      />
      
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
        <div 
          className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="text-zinc-400 hover:text-zinc-900 transition-colors"
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
};

export default AudioPlayer;