export function GameTitleLockup() {
  return (
    <div className="flex flex-col gap-3">
      {/* Bespoke Ananse Ntontan Spider-Web Crest + Wordmark */}
      <div className="flex items-center gap-3.5">
        <svg
          viewBox="0 0 64 64"
          className="w-12 h-12 shrink-0 text-[#F5B731]"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.75" strokeOpacity="0.5" />
          <circle cx="32" cy="32" r="19" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.7" />
          <circle cx="32" cy="32" r="9.5" stroke="currentColor" strokeWidth="1.75" />
          <path
            d="M32 4V60M4 32H60M12.2 12.2L51.8 51.8M51.8 12.2L12.2 51.8"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeOpacity="0.6"
          />
          <circle cx="32" cy="32" r="3.8" fill="currentColor" />
        </svg>
        <span className="text-xs tracking-wide font-medium text-[#F5B731]/90">
          Jamaican Folklore Adventure
        </span>
      </div>

      <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#FDF6E3] leading-[0.98] [text-wrap:balance] drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]">
        Anansi
      </h1>
      <p className="font-display text-xl sm:text-2xl text-[#F5C96B] font-semibold tracking-normal leading-snug">
        Tales of the Golden Calabash
      </p>
    </div>
  );
}
