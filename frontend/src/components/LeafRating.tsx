import React from 'react';
import { Leaf } from 'lucide-react';

/** A 1–5 rating shown as leaves: filled up to the rating, faint after it. */
export const LeafRating: React.FC<{ rating: number; className?: string }> = ({ rating, className = 'w-3 h-3' }) => (
  <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Leaf
        key={n}
        aria-hidden="true"
        className={`${className} ${n <= rating ? 'text-garden-moss fill-current' : 'text-garden-line'}`}
      />
    ))}
  </span>
);
