"use client";

import { useCallback, useRef } from "react";
import { combineDateTimeLocal, splitDateTimeLocal } from "@/lib/datetime-local";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  id?: string;
};

function CalendarIcon() {
  return (
    <svg aria-hidden className="h-[1.125rem] w-[1.125rem] shrink-0 fill-current" viewBox="0 0 24 24">
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 16H5V10h14v10ZM9 16H7v-2h2v2Zm4 0h-2v-2h2v2Zm4 0h-2v-2h2v2Zm-8-4H7v-2h2v2Zm4 0h-2v-2h2v2Zm4 0h-2v-2h2v2Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden className="h-[1.125rem] w-[1.125rem] shrink-0 fill-current" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Zm.5-13H11v6l5.2 3.15.8-1.23-4.5-2.67Z" />
    </svg>
  );
}

/**
 * Split date + time inputs avoid iOS/Android bugs where a single datetime-local
 * picker shows 12-hour UI but writes incorrect 24-hour values to React state.
 */
export function DateTimeLocalInput({ value, onChange, className = "", required, id }: Props) {
  const { date, time } = splitDateTimeLocal(value);
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  const syncFromRefs = useCallback(() => {
    const next = combineDateTimeLocal(
      dateRef.current?.value ?? "",
      timeRef.current?.value ?? "",
    );
    if (next && next !== value) onChange(next);
  }, [onChange, value]);

  const fieldClass =
    `datetime-input-themed relative w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 ps-10 pe-3 text-sm ${className}`.trim();

  const handleDate = (nextDate: string) => {
    onChange(combineDateTimeLocal(nextDate, time));
  };

  const handleTime = (nextTime: string) => {
    onChange(combineDateTimeLocal(date, nextTime));
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div className="relative">
        <input
          ref={dateRef}
          type="date"
          id={id}
          value={date}
          onChange={(e) => handleDate(e.target.value)}
          onInput={(e) => handleDate(e.currentTarget.value)}
          onBlur={syncFromRefs}
          className={fieldClass}
          required={required}
        />
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-[var(--color-primary)]">
          <CalendarIcon />
        </span>
      </div>
      <div className="relative">
        <input
          ref={timeRef}
          type="time"
          value={time}
          onChange={(e) => handleTime(e.target.value)}
          onInput={(e) => handleTime(e.currentTarget.value)}
          onBlur={syncFromRefs}
          className={fieldClass}
          required={required}
        />
        <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-[var(--color-primary)]">
          <ClockIcon />
        </span>
      </div>
    </div>
  );
}
