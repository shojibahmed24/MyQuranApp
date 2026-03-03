import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import CommentItem from './CommentItem';
import Recorder from './Recorder';
import { storageService } from '../services/storageService';
import { Send } from 'lucide-react';

interface CommentSectionProps {
  confessionId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ confessionId }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      fetchComments();
    };
    init();

    const channel = supabase
      .channel(`comments:${confessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `confession_id=eq.${confessionId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [confessionId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username)')
      .eq('confession_id', confessionId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (!error) setComments(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const { error } = await supabase.from('comments').insert({
      confession_id: confessionId,
      user_id: currentUser.id,
      content: newComment,
      audio_url: ''
    });

    if (!error) {
      setNewComment('');
    }
  };

  const handleAudioUpload = async (path: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('comments').insert({
      confession_id: confessionId,
      user_id: currentUser.id,
      audio_url: path
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {loading ? (
          <p className="text-zinc-400 text-xs font-medium">Loading echoes...</p>
        ) : comments.length === 0 ? (
          <p className="text-zinc-400 text-xs italic">No echoes yet.</p>
        ) : (
          comments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={{
                ...comment,
                audio_url: comment.audio_url ? storageService.getPublicUrl('comments', comment.audio_url) : undefined
              }} 
              onDelete={() => fetchComments()}
              currentUserId={currentUser?.id}
            />
          ))
        )}
      </div>

      <div className="pt-6 border-t border-slate-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
             <span className="text-xs font-bold text-zinc-500">Add an echo</span>
             <Recorder onUploadComplete={handleAudioUpload} bucket="comments" minimal />
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write an echo..."
              className="flex-1 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm text-zinc-900 shadow-sm"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/10"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;