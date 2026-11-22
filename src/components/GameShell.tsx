import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../game/audio';
import { AnansiGameEngine } from '../game/engine';
import { HudSnapshot } from '../game/types';
import { CharacterPortrait } from './CharacterPortrait';
import { GameTitleLockup } from './GameTitleLockup';

const INITIAL_HUD: HudSnapshot = {
  phase: 'TITLE_MENU',
  chapterIndex: 0,
  chapterTitle: 'Fern Gully Twilight',
  chapterSubtitle: 'Chapter I · The Whispering Canopy',
  hp: 5,
  maxHp: 5,
  score: 0,
  combo: 0,
  comboTimer: 0,
  shardsCollected: 0,
  shardsTotal: 3,
  beadsCollected: 0,
  bossName: null,
  bossHp: 0,
  bossMaxHp: 0,
  bossBound: false,
  elapsedSeconds: 0,
};

function CalabashHeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 28 28" className="w-6 h-6" aria-hidden="true">
      <path
        d="M14 24.5C9 21 4.5 16.6 4.5 11.2 4.5 7.9 7 5.5 10 5.5c1.8 0 3.3.9 4 2.2.7-1.3 2.2-2.2 4-2.2 3 0 5.5 2.4 5.5 5.7 0 5.4-4.5 9.8-9.5 13.3z"
        fill={filled ? '#E85D3F' : '#1A2D26'}
        stroke={filled ? '#FFD166' : '#3C594D'}
        strokeWidth="1.75"
      />
      {filled && <circle cx="10.2" cy="10.2" r="1.7" fill="#FFE8A3" />}
    </svg>
  );
}

function ShardIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <polygon
        points="12,2 20,10 16,21 7,20 4,9"
        fill={active ? '#F5B731' : '#1B3028'}
        stroke={active ? '#FFF3C4' : '#3F5D50'}
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function GameShell() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AnansiGameEngine | null>(null);

  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(false);
  const [titleBgFailed, setTitleBgFailed] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new AnansiGameEngine(canvas, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;
    engine.startLoop();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleStartAdventure = useCallback(() => {
    engineRef.current?.startNewGame();
  }, []);

  const handleBeginChapter = useCallback(() => {
    engineRef.current?.beginChapterPlay();
  }, []);

  const handleNextChapter = useCallback(() => {
    engineRef.current?.nextChapter();
  }, []);

  const handleRestartChapter = useCallback(() => {
    engineRef.current?.restartChapter();
  }, []);

  const handleReturnTitle = useCallback(() => {
    engineRef.current?.returnToTitle();
  }, []);

  const handleTogglePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  // Keyboard shortcuts for Title / Intro / End modals (Enter / Space)
  useEffect(() => {
    const onModalKey = (e: KeyboardEvent) => {
      if (e.code !== 'Enter' && e.code !== 'Space') return;
      if (hud.phase === 'TITLE_MENU') {
        e.preventDefault();
        handleStartAdventure();
      } else if (hud.phase === 'CHAPTER_INTRO') {
        e.preventDefault();
        handleBeginChapter();
      } else if (hud.phase === 'CHAPTER_CLEAR') {
        e.preventDefault();
        handleNextChapter();
      } else if (hud.phase === 'GAME_OVER') {
        e.preventDefault();
        handleRestartChapter();
      } else if (hud.phase === 'VICTORY') {
        e.preventDefault();
        handleStartAdventure();
      }
    };
    window.addEventListener('keydown', onModalKey);
    return () => window.removeEventListener('keydown', onModalKey);
  }, [
    hud.phase,
    handleStartAdventure,
    handleBeginChapter,
    handleNextChapter,
    handleRestartChapter,
  ]);

  const introData = engineRef.current?.getCurrentIntro();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#071410] text-[#F5EFE0]">
      {/* Isolated 60fps Game Canvas */}
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-crosshair"
          aria-label="Anansi: Tales of the Golden Calabash game canvas"
        />
      </div>

      {/* TITLE SCREEN */}
      {hud.phase === 'TITLE_MENU' && (
        <div className="absolute inset-0 z-20 flex items-center bg-[#071410]">
          {/* Key Art Backdrop */}
          {!titleBgFailed ? (
            <img
              src="/src/assets/images/anansi_title_keyart_1794654751650.jpg"
              alt="Jamaican Blue Mountains at twilight with a silk-cotton tree draped in golden spider silk and fireflies"
              referrerPolicy="no-referrer"
              onError={() => setTitleBgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#081A14] via-[#103227] to-[#1D4B38]" />
          )}

          {/* Measured left-side scrim for crisp typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#06110D]/92 via-[#06110D]/62 to-transparent" />

          {/* Sound Toggle Top-Right */}
          <div className="absolute top-5 right-6 z-30">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? 'Unmute audio' : 'Mute audio'}
              className="flex items-center justify-center w-11 h-11 rounded-lg bg-[#0D211A]/85 border border-[#F5B731]/30 text-[#F5EFE0] hover:border-[#F5B731] transition-colors cursor-pointer"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Left-Aligned Title Lockup & Hero CTA over Calm Negative Space */}
          <div className="relative z-10 max-w-2xl px-8 sm:px-14 lg:px-20 flex flex-col items-start gap-7">
            <GameTitleLockup />

            {/* Hero Character Spotlight */}
            <div className="flex items-center gap-5 py-2">
              <CharacterPortrait
                character="anansi"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-[#F5B731]/75 shadow-xl shrink-0"
              />
              <div className="max-w-sm">
                <p className="text-sm sm:text-base text-[#EAE2CF]/95 leading-relaxed">
                  Spin shimmering golden silk, swing across misty Blue Mountain canopies, and outwit
                  Bredda Snake and Bredda Tiger to restore the Story Calabash.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={handleStartAdventure}
                className="px-7 py-3.5 rounded-lg bg-[#F5B731] hover:bg-[#FFC94D] text-[#140D07] font-semibold text-base tracking-tight shadow-[0_8px_28px_rgba(245,183,49,0.35)] transition-transform active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2.5"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Adventure
              </button>
            </div>

            {/* Single Flat Control-Hint Line */}
            <p className="text-xs sm:text-sm text-[#C7D6CE]/85 tracking-wide">
              A/D Move · Space Jump · Click / J Spin Silk · Shift Dash · Esc Pause
            </p>
          </div>
        </div>
      )}

      {/* IN-GAME LOW-OCCLUSION HUD (No backdrop-filter over active canvas!) */}
      {hud.phase !== 'TITLE_MENU' && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Top-Left: Hearts + Chapter + Shards */}
            <div className="flex flex-col gap-2 bg-[#081712]/88 border border-[#F5B731]/25 rounded-lg px-3.5 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1" aria-label={`Health ${hud.hp} of ${hud.maxHp}`}>
                  {Array.from({ length: hud.maxHp }).map((_, i) => (
                    <CalabashHeartIcon key={i} filled={i < hud.hp} />
                  ))}
                </div>
                <span className="text-xs text-[#9AB5A8] hidden sm:inline">·</span>
                <div className="hidden sm:flex items-center gap-1.5" aria-label={`Shards ${hud.shardsCollected} of ${hud.shardsTotal}`}>
                  {Array.from({ length: hud.shardsTotal }).map((_, i) => (
                    <ShardIcon key={i} active={i < hud.shardsCollected} />
                  ))}
                  <span className="font-mono-nums text-xs text-[#F5EFE0]/90 ml-0.5">
                    {hud.shardsCollected}/{hud.shardsTotal}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#C7D6CE]">
                <span className="font-medium text-[#F5C96B]">{hud.chapterTitle}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-nums">{hud.beadsCollected} Beads</span>
              </div>
            </div>

            {/* Top-Center: Bredda Tiger Boss Bar (only when boss is active) */}
            {hud.bossName && (
              <div className="hidden md:flex flex-col items-center gap-1.5 bg-[#190E12]/90 border border-[#F5B731]/40 rounded-lg px-4 py-2 min-w-[260px]">
                <div className="w-full flex items-center justify-between text-xs">
                  <span className="font-display font-semibold text-[#FFD166]">{hud.bossName}</span>
                  <span className="font-mono-nums text-[#F5EFE0]/90">
                    {hud.bossBound ? 'Silk-Bound! Dash Now' : `${hud.bossHp}/${hud.bossMaxHp} Bells`}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-sm bg-[#2D1A20] overflow-hidden border border-[#F5B731]/25">
                  <div
                    className={`h-full transition-all duration-150 ${
                      hud.bossBound ? 'bg-[#F5B731]' : 'bg-[#E85D3F]'
                    }`}
                    style={{ width: `${(hud.bossHp / Math.max(1, hud.bossMaxHp)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Top-Right: Score + Combo + Controls */}
            <div className="flex items-center gap-2.5">
              <div className="bg-[#081712]/88 border border-[#F5B731]/25 rounded-lg px-3.5 py-2 text-right">
                <div className="font-mono-nums text-lg font-bold leading-tight text-[#FDF6E3]">
                  {hud.score.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono-nums text-[#F5B731]">
                  {hud.combo > 1 ? `${hud.combo}x Trickster` : 'Story Score'}
                </div>
              </div>

              <div className="pointer-events-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#081712]/90 border border-[#F5B731]/25 text-[#F5EFE0] hover:border-[#F5B731] transition-colors cursor-pointer"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleTogglePause}
                  aria-label="Pause game"
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#081712]/90 border border-[#F5B731]/25 text-[#F5EFE0] hover:border-[#F5B731] transition-colors cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile / Coarse-Pointer Touch Controls */}
          {isTouchDevice && hud.phase === 'PLAYING' && (
            <div className="pointer-events-auto flex items-end justify-between gap-4 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onPointerDown={() => {
                    if (engineRef.current) engineRef.current.touchMoveDir = -1;
                  }}
                  onPointerUp={() => {
                    if (engineRef.current) engineRef.current.touchMoveDir = 0;
                  }}
                  onPointerLeave={() => {
                    if (engineRef.current) engineRef.current.touchMoveDir = 0;
                  }}
                  className="w-14 h-14 rounded-lg bg-[#0B1E17]/85 border border-[#F5B731]/40 text-[#F5EFE0] font-bold text-lg active:bg-[#F5B731] active:text-[#140D07]"
                >
                  ←
                </button>
                <button
                  type="button"
                  onPointerDown={() => {
                    if (engineRef.current) engineRef.current.touchMoveDir = 1;
                  }}
                  onPointerUp={() => {
                    if (engineRef.current) engineRef.current.touchMoveDir = 0;
                  }}
                  onPointerLeave={() => {
                    if (engineRef.current) engineRef.current.touchMoveDir = 0;
                  }}
                  className="w-14 h-14 rounded-lg bg-[#0B1E17]/85 border border-[#F5B731]/40 text-[#F5EFE0] font-bold text-lg active:bg-[#F5B731] active:text-[#140D07]"
                >
                  →
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.triggerSilk()}
                  className="px-4 h-14 rounded-lg bg-[#16382B]/90 border border-[#F5B731]/50 text-[#F5B731] font-semibold text-sm active:bg-[#F5B731] active:text-[#140D07]"
                >
                  Silk
                </button>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.triggerDash()}
                  className="px-4 h-14 rounded-lg bg-[#16382B]/90 border border-[#E85D3F]/50 text-[#FFB4A2] font-semibold text-sm active:bg-[#E85D3F] active:text-[#140D07]"
                >
                  Dash
                </button>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.triggerJump()}
                  onPointerUp={() => engineRef.current?.releaseJump()}
                  className="px-5 h-14 rounded-lg bg-[#F5B731] text-[#140D07] font-bold text-sm"
                >
                  Jump
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHAPTER INTRO STORY VIGNETTE MODAL */}
      {hud.phase === 'CHAPTER_INTRO' && introData && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#040C09]/80 p-6">
          <div className="w-full max-w-xl rounded-xl bg-[#0D211A] border border-[#F5B731]/35 p-6 sm:p-8 shadow-2xl">
            <div className="text-xs font-medium tracking-wide text-[#F5B731] mb-1">
              {introData.chapterSubtitle}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#FDF6E3] mb-5">
              {introData.chapterTitle}
            </h2>

            <div className="flex flex-col sm:flex-row items-start gap-5 mb-6">
              <CharacterPortrait
                character={introData.portraitKey}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-lg border border-[#F5B731]/55 shrink-0"
              />
              <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold text-[#F5C96B]">
                  {introData.speaker} <span className="text-[#9AB5A8] font-normal">· {introData.speakerTitle}</span>
                </div>
                <p className="text-sm sm:text-base italic text-[#F5EFE0] leading-relaxed">
                  {introData.proverb}
                </p>
                <p className="text-xs sm:text-sm text-[#B8CEC4] leading-relaxed pt-1">
                  {introData.objective}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-[#F5B731]/15">
              <span className="text-xs text-[#9AB5A8]">Press Enter or Space</span>
              <button
                type="button"
                onClick={handleBeginChapter}
                className="px-6 py-2.5 rounded-lg bg-[#F5B731] hover:bg-[#FFC94D] text-[#140D07] font-semibold text-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                Begin Chapter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {hud.phase === 'PAUSED' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#040C09]/80 p-6">
          <div className="w-full max-w-md rounded-xl bg-[#0D211A] border border-[#F5B731]/35 p-6 sm:p-7 shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-[#FDF6E3] mb-1">Story Paused</h2>
            <p className="text-sm text-[#B8CEC4] mb-5">
              {hud.chapterTitle} · Score {hud.score.toLocaleString()}
            </p>

            <div className="text-xs text-[#C7D6CE] space-y-1.5 mb-6 py-3 border-y border-[#F5B731]/15">
              <div>Move: A / D or Arrow Keys</div>
              <div>Jump / Double Jump: Space or W</div>
              <div>Spin Golden Silk (Swing or Bind): Click, J, or E</div>
              <div>Trickster Dash (Vault Bound Rivals): Shift or K</div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePause}
                className="px-5 py-2.5 rounded-lg bg-[#F5B731] hover:bg-[#FFC94D] text-[#140D07] font-semibold text-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={handleRestartChapter}
                className="px-4 py-2.5 rounded-lg bg-[#16362A] hover:bg-[#1D4636] text-[#F5EFE0] font-medium text-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                Restart Chapter
              </button>
              <button
                type="button"
                onClick={handleReturnTitle}
                className="px-4 py-2.5 rounded-lg text-[#C7D6CE] hover:text-[#FDF6E3] font-medium text-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER CLEAR MODAL */}
      {hud.phase === 'CHAPTER_CLEAR' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#040C09]/80 p-6">
          <div className="w-full max-w-md rounded-xl bg-[#0D211A] border border-[#F5B731]/45 p-6 sm:p-8 shadow-2xl">
            <div className="text-xs font-medium tracking-wide text-[#F5B731] mb-1">
              Chapter Complete
            </div>
            <h2 className="font-display text-3xl font-bold text-[#FDF6E3] mb-4">
              {hud.chapterTitle}
            </h2>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#F5B731]/15 mb-6">
              <div>
                <div className="text-xs text-[#9AB5A8]">Calabash Shards</div>
                <div className="font-mono-nums text-xl font-bold text-[#F5B731]">
                  {hud.shardsCollected} / {hud.shardsTotal}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#9AB5A8]">Story Score</div>
                <div className="font-mono-nums text-xl font-bold text-[#FDF6E3]">
                  {hud.score.toLocaleString()}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextChapter}
              className="w-full px-6 py-3 rounded-lg bg-[#F5B731] hover:bg-[#FFC94D] text-[#140D07] font-semibold text-sm whitespace-nowrap cursor-pointer"
            >
              Continue Tale
            </button>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {hud.phase === 'GAME_OVER' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#040C09]/84 p-6">
          <div className="w-full max-w-md rounded-xl bg-[#1A1010] border border-[#E85D3F]/45 p-6 sm:p-8 shadow-2xl">
            <h2 className="font-display text-3xl font-bold text-[#FDF6E3] mb-2">
              The Thread Snapped
            </h2>
            <p className="text-sm text-[#D6C5C0] mb-6">
              Even clever Bredda Anansi must catch his breath before spinning a stronger web.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRestartChapter}
                className="px-5 py-2.5 rounded-lg bg-[#F5B731] hover:bg-[#FFC94D] text-[#140D07] font-semibold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                type="button"
                onClick={handleReturnTitle}
                className="px-4 py-2.5 rounded-lg bg-[#291B1B] hover:bg-[#382424] text-[#F5EFE0] text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {hud.phase === 'VICTORY' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#040C09]/85 p-6">
          <div className="w-full max-w-lg rounded-xl bg-[#0D211A] border border-[#F5B731]/55 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center gap-5 mb-5">
              <CharacterPortrait
                character="anansi"
                className="w-28 h-28 rounded-xl border-2 border-[#F5B731] shrink-0"
              />
              <div>
                <div className="text-xs font-medium tracking-wide text-[#F5B731] mb-1">
                  Tale Complete
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#FDF6E3]">
                  Keeper of the Golden Calabash
                </h2>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#D6E5DD] leading-relaxed mb-5">
              With quick feet and golden silk, Bredda Anansi outwitted Bredda Tiger and returned
              every story to the Blue Mountain night.
            </p>

            <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#F5B731]/15 mb-6">
              <div>
                <div className="text-xs text-[#9AB5A8]">Final Score</div>
                <div className="font-mono-nums text-xl font-bold text-[#F5B731]">
                  {hud.score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#9AB5A8]">Story Beads</div>
                <div className="font-mono-nums text-xl font-bold text-[#FDF6E3]">
                  {hud.beadsCollected}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#9AB5A8]">Shards</div>
                <div className="font-mono-nums text-xl font-bold text-[#FDF6E3]">
                  {hud.shardsCollected}/{hud.shardsTotal}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartAdventure}
                className="px-6 py-2.5 rounded-lg bg-[#F5B731] hover:bg-[#FFC94D] text-[#140D07] font-semibold text-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={handleReturnTitle}
                className="px-4 py-2.5 rounded-lg bg-[#16362A] hover:bg-[#1D4636] text-[#F5EFE0] text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                Title Screen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
