import React from 'react';
import AudioPlayer from './AudioPlayer';
import { supabase } from '../lib/supabase';
import { Trash2, Flag } from 'lucide-react';

interface CommentItemProps {
  comment: any;
  onDelete?: (id: string) => void;
  currentUserId?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, onDelete, currentUserId }) => {
  const isOwner = currentUserId === comment.user_id;

  const handleDelete = async () => {
    if (!window.confirm('Delete this echo?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', comment.id);
    if (!error && onDelete) onDelete(comment.id);
  };

  return (
    <div className="group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[10px] border border-emerald-200">
            {comment.profiles?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <span className="font-bold text-xs text-zinc-900">
              {comment.profiles?.username || 'Anonymous'}
            </span>
            <span className="text-[10px] text-zinc-400 ml-2 font-medium">
              {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isOwner && (
            <button onClick={handleDelete} className="text-zinc-400 hover:text-red-500">
              <Trash2 size={14} />
            </button>
          )}
          <button className="text-zinc-400 hover:text-emerald-600">
            <Flag size={14} />
          </button>
        </div>
      </div>
      
      <div className="pl-9">
        {comment.content && (
          <p className="text-zinc-600 text-sm leading-relaxed">{comment.content}</p>
        )}
        {comment.audio_url && (
          <div className="mt-2">
            <AudioPlayer url={comment.audio_url} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;