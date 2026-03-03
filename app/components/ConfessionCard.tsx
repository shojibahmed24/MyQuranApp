import React, { useState } from 'react';
import { MessageCircle, Share2, MoreVertical, Play, Sparkles } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import ReactionPicker from './ReactionPicker';
import CommentSection from './CommentSection';
import { storageService } from '../services/storageService';
import { supabase } from '../lib/supabase';

interface ConfessionCardProps {
  confession: {
    id: string;
    content: string;
    audio_url: string | null;
    created_at: string;
    user_id: string;
    mood_tag?: string;
    plays_count?: number;
    reactions?: any[];
  };
}

const ConfessionCard: React.FC<ConfessionCardProps> = ({ confession }) => {
  const [showComments, setShowComments] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  
  const audioUrl = confession.audio_url ? storageService.getPublicUrl('confessions', confession.audio_url) : null;

  const handleReport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Please sign in to report content.');
      if (user.id === confession.user_id) return alert('You cannot report your own confession.');

      setIsReporting(true);
      const { error } = await supabase.from('reports').insert({
        confession_id: confession.id,
        reporter_id: user.id,
        reason: 'Inappropriate content'
      });

      if (error) throw error;
      alert('Reported successfully.');
    } catch (err) {
      alert('Error reporting confession.');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-emerald-200 transition-all group shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <Sparkles size={18} className="text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">Anonymous Soul</p>
                {confession.mood_tag && (
                  <span className="px-2 py-0.5 bg-stone-100 rounded-full text-[10px] font-bold text-zinc-500 border border-slate-200">
                    {confession.mood_tag}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">{new Date(confession.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <button 
            onClick={handleReport} 
            disabled={isReporting}
            className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            <MoreVertical size={18} />
          </button>
        </div>

        {confession.content && (
          <p className="text-zinc-600 leading-relaxed mb-6 text-sm">
            {confession.content}
          </p>
        )}

        {audioUrl && (
          <div className="mb-6">
            <AudioPlayer url={audioUrl} confessionId={confession.id} />
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Play size={14} />
              <span className="text-xs font-bold">{confession.plays_count || 0}</span>
            </div>
            <ReactionPicker confessionId={confession.id} initialReactions={confession.reactions || []} />
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-bold ${showComments ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-zinc-600 hover:bg-stone-200'}`}
            >
              <MessageCircle size={16} />
              <span>Comments</span>
            </button>
            <button className="p-2 bg-stone-100 rounded-xl text-zinc-400 hover:text-zinc-900 transition-colors">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {showComments && (
        <div className="bg-stone-50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
          <CommentSection confessionId={confession.id} />
        </div>
      )}
    </div>
  );
};

export default ConfessionCard;