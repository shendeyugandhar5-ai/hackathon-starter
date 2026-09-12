import React from 'react';

const SIZE_HEIGHTS = {
  md: 'h-8',
  lg: 'h-11',
};

/**
 * Official EduHive wordmark (frontend/public/eduhive-logo.png).
 *
 * The source image is a single flattened lockup with a white "Edu" and
 * tagline baked in, designed for a dark surface. On a light page background
 * it gets a small dark chip behind it so the wordmark stays legible instead
 * of vanishing into the cream background.
 */
export default function EduLogo({ variant = 'dark', showSub = false, size = 'md' }) {
  const isDark = variant === 'dark';
  const heightClass = SIZE_HEIGHTS[size] || SIZE_HEIGHTS.md;

  const image = (
    <img
      src="/eduhive-logo.png"
      alt="EduHive"
      className={`${heightClass} w-auto object-contain select-none`}
      draggable={false}
    />
  );

  return (
    <div className="flex items-center gap-2.5 select-none">
      {isDark ? (
        image
      ) : (
        <div className="rounded-lg bg-[#161514] px-2.5 py-1.5">{image}</div>
      )}

      {showSub && (
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 uppercase tracking-wider">
          v2.4
        </span>
      )}
    </div>
  );
}
