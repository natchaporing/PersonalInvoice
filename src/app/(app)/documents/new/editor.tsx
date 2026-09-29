"use client";

import { ExternalLink, Plus, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GuillocheBackground, Microprint } from "@/components/banknote";
import { A4, InvoiceDocument } from "@/components/invoice-document";
import { ScaledPage } from "@/components/scaled-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DocumentView, Lang } from "@/lib/document-view";
import { DOC_TYPE_LABEL, sampleCustomers, sampleSeller, type DocType } from "@/lib/sample-data";
import { bahtText } from "@/lib/thai/baht-text";
import { computeTotals, formatTHB, lineAmount, thbToSatang } from "@/lib/thai/money";
import { cn } from "@/lib/utils";

interface Line { id: number; description: string; qty: string; price: string }

const WHT_OPTIONS = [
  { bps: 0, label: "None" },
  { bps: 100, label: "1% transport" },
  { bps: 200, label: "2% advertising" },
  { bps: 300, label: "3% services" },
  { bps: 500, label: "5% rent" },
];

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: "bilingual", label: "TH + EN" },
  { key: "th", label: "ไทย" },
  { key: "en", label: "English" },
];

function Field({ label, htmlFor, children, hint, className }: { label: React.ReactNode; htmlFor: string; children: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function DocumentEditor() {
  const [type, setType] = useState<DocType>("tax_invoice");
  const [customerId, setCustomerId] = useState(sampleCustomers[0].id);
  const [issueDate, setIssueDate] = useState("2026-09-29");
  const [dueDate, setDueDate] = useState("2026-10-29");
  const [lang, setLang] = useState<Lang>("bilingual");
  const [includeVat, setIncludeVat] = useState(false);
  const [whtBps, setWhtBps] = useState(300);
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("ชำระภายใน 30 วัน / Payment due within 30 days");
  const [lines, setLines] = useState<Line[]>([{ id: 1, description: "พัฒนาเว็บไซต์ / Web development", qty: "1", price: "50000" }]);

  const customer = sampleCustomers.find((c) => c.id === customerId)!;
  const parsed = useMemo(
    () => lines.map((l) => ({ qtyMilli: Math.round((parseFloat(l.qty) || 0) * 1000), unitPrice: thbToSatang(parseFloat(l.price) || 0) })),
    [lines],
  );
  const subtotal = parsed.reduce((s, l) => s + lineAmount(l), 0);
  const disc = Math.min(thbToSatang(parseFloat(discount) || 0), subtotal);
  const totals = computeTotals({ lines: parsed, discount: disc, vatRegistered: true, pricesIncludeVat: includeVat, whtBps });

  const doc: DocumentView = {
    type, status: "draft", issueDate, dueDate: dueDate || undefined, lang,
    seller: sampleSeller,
    buyer: {
      nameTh: customer.name, nameEn: customer.nameEn, addressTh: customer.address, addressEn: customer.addressEn,
      taxId: customer.taxId, branchCode: customer.branch,
    },
    lines: lines.map((l, i) => {
      // "ไทย / English" in one field is split so bilingual documents show both languages.
      const [th, en] = l.description.split(/\s*\/\s*/);
      return { descriptionTh: th || "—", descriptionEn: en, qtyMilli: parsed[i].qtyMilli, unit: "", unitPrice: parsed[i].unitPrice };
    }),
    discount: disc, vatBps: 700, pricesIncludeVat: includeVat, whtBps, notes: notes || undefined,
  };

  const update = (id: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="space-y-5">
        <Card>
          <CardHeader><CardTitle>Document · เอกสาร</CardTitle></CardHeader>
          <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Document type" htmlFor="type">
              <NativeSelect id="type" value={type} onChange={(e) => setType(e.target.value as DocType)}>
                {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (<option key={k} value={k}>{v.en} · {v.th}</option>))}
              </NativeSelect>
            </Field>
            <Field
              label="Customer"
              htmlFor="customer"
              hint={<span className="tabular-nums">Tax ID {customer.taxId} · {customer.juristic ? "Company (PND 53)" : "Individual (PND 3)"}</span>}
            >
              <NativeSelect id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                {sampleCustomers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </NativeSelect>
            </Field>
            <Field label="Issue date" htmlFor="issue">
              <Input id="issue" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </Field>
            <Field label="Due date" htmlFor="due">
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <fieldset className="grid gap-1.5 sm:col-span-2">
              <legend className="mb-1.5 text-[13px] font-medium">Document language</legend>
              <div className="inline-flex w-fit rounded-md border border-input bg-card p-0.5">
                {LANG_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={lang === o.key}
                    onClick={() => setLang(o.key)}
                    className={cn("h-8 rounded-sm px-4 text-sm", lang === o.key ? "bg-cobalt font-medium text-white" : "text-foreground hover:bg-secondary")}
                  >{o.label}</button>
                ))}
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Line items · รายการ</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {lines.map((l, i) => (
              <div key={l.id} className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-dashed pb-4 sm:grid-cols-[96px_160px_1fr_auto] sm:items-end">
                <Field className="col-span-2 sm:col-span-4" htmlFor={`d${l.id}`} label={<>{i === 0 ? "Description" : `Description ${i + 1}`} <span className="font-normal text-muted-foreground">(ไทย / English)</span></>}>
                  <Input id={`d${l.id}`} value={l.description} onChange={(e) => update(l.id, { description: e.target.value })} />
                </Field>
                <Field label="Qty" htmlFor={`q${l.id}`}>
                  <Input id={`q${l.id}`} inputMode="decimal" className="num text-right" value={l.qty} onChange={(e) => update(l.id, { qty: e.target.value })} />
                </Field>
                <Field label="Unit price (THB)" htmlFor={`p${l.id}`}>
                  <Input id={`p${l.id}`} inputMode="decimal" className="num text-right" value={l.price} onChange={(e) => update(l.id, { price: e.target.value })} />
                </Field>
                <div className="num pb-2 text-right font-medium">฿{formatTHB(lineAmount(parsed[i]))}</div>
                <Button type="button" variant="ghost" size="icon" className="justify-self-end" aria-label={`Remove line ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}>
                  <X />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => setLines((ls) => [...ls, { id: Date.now(), description: "", qty: "1", price: "0" }])}>
              <Plus /> Add line
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tax &amp; terms · ภาษีและเงื่อนไข</CardTitle></CardHeader>
          <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
            <Field label="Discount (THB)" htmlFor="disc">
              <Input id="disc" inputMode="decimal" className="num text-right" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </Field>
            <Field label="Customer withholds" htmlFor="wht">
              <NativeSelect id="wht" value={whtBps} onChange={(e) => setWhtBps(Number(e.target.value))}>
                {WHT_OPTIONS.map((o) => (<option key={o.bps} value={o.bps}>{o.label}</option>))}
              </NativeSelect>
            </Field>
            <Label className="self-end pb-2.5 font-normal">
              <input type="checkbox" className="size-4 accent-[var(--cobalt)]" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} />
              Prices include VAT
            </Label>
            <Field className="sm:col-span-3" label="Notes" htmlFor="notes">
              <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </CardContent>
        </Card>

        {/* Summary strip printed like the face of a note. */}
        <section aria-label="Net receivable" className="relative overflow-hidden rounded-lg border border-cobalt/25 bg-paper">
          <GuillocheBackground opacity={0.09} />
          <div className="relative flex flex-wrap items-end justify-between gap-4 p-5">
            <div>
              <div className="eyebrow text-cobalt">Net receivable · ยอดรับสุทธิ</div>
              <div className="figure text-[36px] leading-tight text-cobalt">฿{formatTHB(totals.netReceivable)}</div>
              <div className="text-[12px] text-muted-foreground">{bahtText(totals.netReceivable)}</div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline">Save draft</Button>
              <Button type="button">Issue document</Button>
            </div>
          </div>
          <Microprint className="relative border-t border-cobalt/15 px-5 py-0.5" />
        </section>
      </div>

      <aside aria-label="Live document preview" className="xl:sticky xl:top-6 xl:self-start">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="display text-xl text-cobalt">Preview</h2>
          <Button asChild variant="link" size="sm">
            <Link href={`/preview/tax-invoice?lang=${lang}`}>Open sample mockup <ExternalLink /></Link>
          </Button>
        </div>
        <div className="overflow-hidden rounded-md border bg-white shadow-[0_1px_0_var(--border),0_14px_34px_-18px_rgb(26_37_54/0.4)]">
          <ScaledPage width={A4.width} height={A4.height}>
            <InvoiceDocument doc={doc} />
          </ScaledPage>
        </div>
      </aside>
    </div>
  );
}
