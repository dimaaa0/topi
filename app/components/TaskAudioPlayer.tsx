"use client";

import { useState, type RefObject } from "react";

const rangeBase =
  "h-2 w-full cursor-pointer appearance-none rounded-full " +
  "[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none " +
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#42A5F5] " +
  "[&::-webkit-slider-thumb]:shadow-[inset_0_-2px_0_rgba(0,0,0,0.15),0_2px_6px_rgba(66,165,245,0.4)] " +
  "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full " +
  "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#42A5F5]";

const fill = (pct: number) => ({
  background: `linear-gradient(to right,#42A5F5 ${pct}%,#DDE3F0 ${pct}%)`,
});

function formatTime(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

type Props = {
  audioRef: RefObject<HTMLAudioElement | null>;
  src?: string;
  speedPercent: number;
  onSpeedChange: (v: number) => void;
};

export function TaskAudioPlayer({ audioRef, src, speedPercent, onSpeedChange }: Props) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  const progress = duration ? (current / duration) * 100 : 0;
  const speedProgress = ((speedPercent - 60) / (125 - 60)) * 100;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  };

  const seek = (v: number) => {
    if (audioRef.current) audioRef.current.currentTime = v;
    setCurrent(v);
  };

  return (
    <div className="space-y-3 rounded-2xl bg-[#F4F5FB] p-3 sm:p-4">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          e.currentTarget.playbackRate = speedPercent / 100;
        }}
      />

      {/* Play + seek */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!src}
          aria-label={playing ? "Пауза" : "Воспроизвести"}
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[#42A5F5] text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.1)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:hover:-translate-y-0.5 sm:hover:bg-[#2196F3]"
        >
          {playing ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor">
              <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={current}
            onChange={(e) => seek(Number(e.target.value))}
            disabled={!duration}
            aria-label="Перемотка"
            className={rangeBase}
            style={fill(progress)}
          />
          <div className="mt-1.5 flex justify-between text-[11px] font-extrabold tabular-nums text-[#2E2A4F]/50">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-3 border-t border-[#2E2A4F]/5 pt-3">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#2E2A4F]/60">
          Скорость
        </span>
        <input
          type="range"
          min={60}
          max={125}
          step={5}
          value={speedPercent}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          aria-label="Скорость воспроизведения"
          className={rangeBase}
          style={fill(speedProgress)}
        />
        <button
          type="button"
          onClick={() => onSpeedChange(100)}
          title="Вернуть стандартную скорость 100%"
          className="min-w-[56px] cursor-pointer rounded-xl bg-[#E3F2FD] px-2.5 py-1.5 text-center text-xs font-extrabold tabular-nums text-[#1E88E5] transition-colors active:scale-95 sm:hover:bg-[#42A5F5] sm:hover:text-white"
        >
          {speedPercent}%
        </button>
      </div>
    </div>
  );
}