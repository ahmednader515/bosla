"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";

type Assistant = { id: string; name: string; email: string };
export function TeacherAssistantsPanel({ teacher, onClose }: { teacher: { id: string; name: string }; onClose: () => void }) {
  const t = useT();
  const key = "dashboard.teachersAdmin";
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const endpoint = "/api/dashboard/teachers/" + encodeURIComponent(teacher.id) + "/assistants";
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAssistants(data.assistants);
    }).catch((reason) => { if (!controller.signal.aborted) setError(reason.message || t(key + ".connectionFailed")); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [endpoint, t]);
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAssistants((items) => [...items, { id: data.id, name: name.trim(), email: email.trim().toLowerCase() }]);
      setName(""); setEmail(""); setPassword("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : t(key + ".connectionFailed")); }
    finally { setBusy(false); }
  }
  async function remove(assistant: Assistant) {
    if (!window.confirm(t(key + ".confirmDeleteAssistant") + " " + assistant.name + "?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint + "/" + encodeURIComponent(assistant.id), { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAssistants((items) => items.filter((item) => item.id !== assistant.id));
    } catch (reason) { setError(reason instanceof Error ? reason.message : t(key + ".connectionFailed")); }
    finally { setBusy(false); }
  }
  const inputClass = "mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="teacher-assistants-title" onKeyDown={(event) => { if (event.key === "Escape" && !busy) onClose(); }}>
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4"><h3 id="teacher-assistants-title" className="text-lg font-semibold">{t(key + ".assistants")} — {teacher.name}</h3><button type="button" onClick={onClose} disabled={busy}>{t(key + ".cancel")}</button></div>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{t(key + ".assistantsHint")}</p>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="my-4 space-y-3" aria-live="polite">{loading ? <p>{t(key + ".assistantsLoading")}</p> : assistants.length === 0 ? <p className="text-sm text-[var(--color-muted)]">{t(key + ".assistantsEmpty")}</p> : assistants.map((assistant) => <div key={assistant.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3"><div className="min-w-0"><p className="font-medium">{assistant.name}</p><p className="break-all text-sm text-[var(--color-muted)]">{assistant.email}</p></div><button type="button" disabled={busy} onClick={() => void remove(assistant)} className="text-sm text-red-600 disabled:opacity-50">{t(key + ".delete")}</button></div>)}</div>
      <form onSubmit={(event) => void create(event)} className="space-y-3">
        <h4 className="font-semibold">{t(key + ".createAssistant")}</h4>
        <label className="block text-sm">{t(key + ".labelName")}<input autoFocus required minLength={2} maxLength={200} autoComplete="off" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} /></label>
        <label className="block text-sm">{t(key + ".labelEmail")}<input required type="email" maxLength={254} autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></label>
        <label className="block text-sm">{t(key + ".assistantPassword")}<input required type="password" minLength={6} maxLength={72} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} /></label>
        <button type="submit" disabled={busy || loading} className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? t(key + ".submitCreateBusy") : t(key + ".createAssistant")}</button>
      </form>
    </div>
  </div>;
}
