import { ArrowDown, ThumbsDown, ThumbsUp } from 'lucide-react';

const Controls = ({ onLike, onDislike, onNext }) => (
  <div className="controls" aria-label="Feed controls">
    <button onClick={onDislike} aria-label="Show fewer projects like this">
      <ThumbsDown size={18} />
      <span>Less like this</span>
    </button>
    <button onClick={onNext} aria-label="Next repository">
      <span>Next</span>
      <ArrowDown size={18} />
    </button>
    <button className="like-button" onClick={onLike} aria-label="Show more projects like this">
      <ThumbsUp size={18} />
      <span>More like this</span>
    </button>
  </div>
);

export default Controls;
