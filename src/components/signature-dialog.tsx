"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";

/** Page behaviour that fights a pen or finger: text selection, copy/cut, the long-press menu, drag and pinch. */
const BLOCKED_EVENTS = ["selectstart", "copy", "cut", "contextmenu", "dragstart", "gesturestart"] as const;
const BODY_STYLES = { "user-select": "none", "-webkit-user-select": "none", "-webkit-touch-callout": "none", overflow: "hidden", "overscroll-behavior": "none" } as const;

/**
 * While mounted, stops the page from selecting, copying or opening menus so handwriting is not interrupted.
 * Cleanup removes exactly the listeners it added and puts every body style back as it was, so the page
 * behaves normally again however the dialog closes (Done, Cancel, Esc or navigating away).
 */
function useHandwritingGuard() {
  useEffect(() => {
    const body = document.body.style;
    const saved = Object.keys(BODY_STYLES).map((k) => [k, body.getPropertyValue(k), body.getPropertyPriority(k)] as const);
    for (const [k, v] of Object.entries(BODY_STYLES)) body.setProperty(k, v);
    window.getSelection()?.removeAllRanges();

    const block = (e: Event) => e.preventDefault();
    for (const type of BLOCKED_EVENTS) document.addEventListener(type, block, { capture: true });

    return () => {
      for (const type of BLOCKED_EVENTS) document.removeEventListener(type, block, { capture: true });
      for (const [k, v, priority] of saved) {
        if (v) body.setProperty(k, v, priority);
        else body.removeProperty(k);
      }
    };
  }, []);
}

/**
 * A popup with a signature pad. Mount it only while open; it calls `onConfirm` with the PNG and closes when that
 * succeeds. `onConfirm` may return an error message to keep the popup open.
 */
export function SignatureDialog({
  title,
  label,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  label?: string;
  confirmLabel?: string;
  onConfirm: (png: string) => void | string | Promise<void | string | undefined>;
  onClose: () => void;
}) {
  const [png, setPng] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const m = useMessages();
  const latest = useRef({ onClose, pending });
  useEffect(() => {
    latest.current = { onClose, pending };
  });
  useHandwritingGuard();

  // Focus the popup, keep Tab inside it, close on Esc, and hand focus back to the opener afterwards.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !latest.current.pending) latest.current.onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>("button:not(:disabled)")];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, []);

  const confirm = () =>
    png &&
    start(async () => {
      const err = await onConfirm(png);
      if (err) setError(err);
      else onClose();
    });

  return createPortal(
    // No close on backdrop click: a stroke that slips off the pad must not throw the signature away.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/70 p-3 backdrop-blur-sm sm:p-6">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-2xl space-y-3 rounded-lg border bg-card p-4 shadow-xl outline-none sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-semibold">{title}</h2>
          <Button type="button" variant="ghost" size="icon" aria-label={m.pad.close} onClick={onClose} disabled={pending}><X /></Button>
        </div>
        <SignaturePad onChange={(v) => { setPng(v); setError(null); }} label={label} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>{m.actions.cancel}</Button>
          <Button type="button" onClick={confirm} disabled={!png || pending}>{pending ? m.common.saving : (confirmLabel ?? m.pad.use)}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
