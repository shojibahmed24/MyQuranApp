import React from 'react';
import { supabase } from '../lib/supabase';

const EMOJIS = ['❤️', '🫂', '🙏', '😢', '🔥'];

interface ReactionPickerProps {
  confessionId: string;
  initialReactions: any[];
}

export default function ReactionPicker({ confessionId, initialReactions }: ReactionPickerProps) {
  const addReaction = async (type: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Please sign in to react.');

    const { error } = await supabase.from('reactions').upsert({
      confession_id: confessionId,
      user_id: user.id,
      reaction_type: type
    });

    if (error) console.error('Error reacting:', error);
  };

  const getCount = (type: string) => initialReactions.filter(r => r.type === type).length;

  return (
    <div className="flex items-center gap-1.5">
      {EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => addReaction(emoji)}
          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 border border-slate-200 transition-all shadow-sm"
        >
          <span className="text-xs">{emoji}</span>
          <span className="text-[10px] font-bold text-zinc-500">{getCount(emoji)}</span>
        </button>
      ))}
    </div>
  );
}