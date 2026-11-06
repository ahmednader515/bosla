"use client";

import type { ReactNode } from "react";
import { PlyrVideoPlayer } from "./plyr-video-player";

type Props = {
  youtubeVideoId: string;
  storageKey: string;
  className?: string;
  onEnded?: () => void;
  copyrightOverlay?: ReactNode;
};

/** Lesson page wrapper around Plyr + optional copyright overlay. */
export function LessonWatchShell({
  youtubeVideoId,
  storageKey,
  className = "w-full",
  onEnded,
  copyrightOverlay,
}: Props) {
  return (
    <div className="lesson-video-shell relative mt-6 w-full min-w-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-black">
      <PlyrVideoPlayer
        key={`${storageKey}-${youtubeVideoId}`}
        youtubeVideoId={youtubeVideoId}
        storageKey={storageKey}
        className={className}
        onEnded={onEnded}
      />
      {copyrightOverlay}
    </div>
  );
}
