"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
  help?: string;
};

export function ImageAttachField({ value, onChange, label, help }: Props) {
  const t = useT();
  const Cf = "dashboard.courseForm";
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--color-foreground)]">{label}</p>
      {help ? <p className="text-xs text-[var(--color-muted)]">{help}</p> : null}
      {value ? (
        <div className="flex flex-wrap items-start gap-3">
          <img
            src={value}
            alt={t(`${Cf}.previewAlt`)}
            className="max-h-40 max-w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] object-contain"
          />
          <button
            type="button"
            onClick={() => {
              onChange("");
              setError("");
            }}
            className="text-sm text-red-600 hover:underline"
          >
            {t(`${Cf}.remove`)}
          </button>
        </div>
      ) : null}
      <label className="inline-flex cursor-pointer items-center rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm">
        {uploading ? t(`${Cf}.uploadingImage`) : t(`${Cf}.chooseImageUpload`)}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={uploading}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setError("");
            setUploading(true);
            try {
              const fd = new FormData();
              fd.set("file", file);
              const res = await fetch("/api/upload/image", { method: "POST", body: fd });
              const data = await res.json().catch(() => ({}));
              if (!res.ok || !data.url) {
                setError(
                  typeof data.error === "string" ? data.error : t(`${Cf}.uploadFailedDetail`)
                );
                return;
              }
              onChange(String(data.url));
            } catch {
              setError(t(`${Cf}.connectionFailedUpload`));
            } finally {
              setUploading(false);
            }
          }}
        />
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
