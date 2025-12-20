import React from 'react';
import { ThumbsUp, ThumbsDown, SkipForward } from 'lucide-react';

const Controls = ({ onLike, onDislike, onSkip }) => {
  return (
    <div className="absolute bottom-20 right-4 flex flex-col gap-4 z-20">
      <button 
        onClick={onLike}
        className="p-4 bg-gray-800/80 backdrop-blur-sm rounded-full text-green-400 hover:bg-green-900/80 hover:scale-110 transition-all shadow-lg border border-gray-700"
        title="Like (More like this)"
      >
        <ThumbsUp size={24} />
      </button>
      
      <button 
        onClick={onDislike}
        className="p-4 bg-gray-800/80 backdrop-blur-sm rounded-full text-red-400 hover:bg-red-900/80 hover:scale-110 transition-all shadow-lg border border-gray-700"
        title="Dislike (Less like this)"
      >
        <ThumbsDown size={24} />
      </button>

      <button 
        onClick={onSkip}
        className="p-4 bg-gray-800/80 backdrop-blur-sm rounded-full text-white hover:bg-gray-700 hover:scale-110 transition-all shadow-lg border border-gray-700"
        title="Skip"
      >
        <SkipForward size={24} />
      </button>
    </div>
  );
};

export default Controls;
