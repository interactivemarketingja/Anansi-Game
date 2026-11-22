import { useState } from 'react';

export type PortraitCharacter = 'anansi' | 'tiger' | 'snake';

const PORTRAIT_MAP: Record<PortraitCharacter, { src: string; alt: string; fallbackLabel: string }> = {
  anansi: {
    src: '/src/assets/images/anansi_hero_portrait_1794654752790.jpg',
    alt: 'Bredda Anansi wearing a woven Jamaican straw hat and emerald brocade waistcoat holding golden silk',
    fallbackLabel: 'Bredda Anansi',
  },
  tiger: {
    src: '/src/assets/images/tiger_rival_portrait_1794654752423.jpg',
    alt: 'Bredda Tiger wearing an antique brass story-bell collar in the jungle',
    fallbackLabel: 'Bredda Tiger',
  },
  snake: {
    src: '/src/assets/images/snake_rival_portrait_1794654753730.jpg',
    alt: 'Bredda Snake coiled around a carved wooden calabash gourd',
    fallbackLabel: 'Bredda Snake',
  },
};

interface CharacterPortraitProps {
  character: PortraitCharacter;
  className?: string;
}

export function CharacterPortrait({ character, className = '' }: CharacterPortraitProps) {
  const [failed, setFailed] = useState(false);
  const info = PORTRAIT_MAP[character];

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#16382B] to-[#0B1C16] border border-[#F5B731]/35 text-[#F5B731] ${className}`}
      >
        <svg viewBox="0 0 48 48" className="w-10 h-10 mb-1" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="24" cy="24" r="18" strokeOpacity="0.6" />
          <path d="M24 6v36M6 24h36M11 11l26 26M37 11L11 37" strokeOpacity="0.45" />
          <circle cx="24" cy="24" r="6" fill="currentColor" fillOpacity="0.3" />
        </svg>
        <span className="text-xs font-medium text-[#F5EFE0]/80">{info.fallbackLabel}</span>
      </div>
    );
  }

  return (
    <img
      src={info.src}
      alt={info.alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
