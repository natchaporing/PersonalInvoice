"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/domain/forms";
import { useMessages } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  children,
  hint,
  error,
  className,
}: {
  label: React.ReactNode;
  htmlFor: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[12px] text-destructive">{error}</p>
      ) : (
        hint && <p className="text-[12px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

export function SubmitButton({ children, pendingText, ...props }: React.ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  const m = useMessages();
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? (pendingText ?? m.common.saving) : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) return <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{state.error}</p>;
  if (state.message) return <p role="status" className="rounded-md border border-ok/40 bg-ok/5 px-3 py-2 text-sm text-ok">{state.message}</p>;
  return null;
}
