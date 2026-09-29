"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { A4, InvoiceDocument } from "@/components/invoice-document";
import { ScaledPage } from "@/components/scaled-page";
import type { DocumentView, Lang } from "@/lib/document-view";
import { DOC_TYPE_LABEL, sampleCustomers, sampleSeller, type DocType } from "@/lib/sample-data";
import { computeTotals, formatTHB, lineAmount, thbToSatang } from "@/lib/thai/money";

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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="space-y-4">
        <section className="card grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type">Document type</label>
            <select id="type" className="field" value={type} onChange={(e) => setType(e.target.value as DocType)}>
              {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (<option key={k} value={k}>{v.en} · {v.th}</option>))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="customer">Customer</label>
            <select id="customer" className="field" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {sampleCustomers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <p className="num mt-1 text-xs text-muted">Tax ID {customer.taxId} · {customer.juristic ? "Company (PND 53)" : "Individual (PND 3)"}</p>
          </div>
          <div>
            <label className="label" htmlFor="issue">Issue date</label>
            <input id="issue" type="date" className="field" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="due">Due date</label>
            <input id="due" type="date" className="field" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="label">Document language</legend>
            <div className="inline-flex rounded-lg border border-border p-0.5">
              {LANG_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={lang === o.key}
                  onClick={() => setLang(o.key)}
                  className={`min-h-9 rounded-md px-3 ${lang === o.key ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-2"}`}
                >{o.label}</button>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 font-semibold text-accent">Line items</h2>
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={l.id} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-[88px_140px_1fr_auto] sm:items-end">
                <div className="col-span-2 sm:col-span-4">
                  <label className="label" htmlFor={`d${l.id}`}>{i === 0 ? "Description" : `Description ${i + 1}`} <span className="font-normal">(ไทย / English)</span></label>
                  <input id={`d${l.id}`} className="field" value={l.description} onChange={(e) => update(l.id, { description: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor={`q${l.id}`}>Qty</label>
                  <input id={`q${l.id}`} inputMode="decimal" className="field num text-right" value={l.qty} onChange={(e) => update(l.id, { qty: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor={`p${l.id}`}>Unit price (THB)</label>
                  <input id={`p${l.id}`} inputMode="decimal" className="field num text-right" value={l.price} onChange={(e) => update(l.id, { price: e.target.value })} />
                </div>
                <div className="num pb-2 text-right font-medium">฿{formatTHB(lineAmount(parsed[i]))}</div>
                <button type="button" className="btn justify-self-end px-3" aria-label={`Remove line ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn mt-3" onClick={() => setLines((ls) => [...ls, { id: Date.now(), description: "", qty: "1", price: "0" }])}>+ Add line</button>
        </section>

        <section className="card grid gap-4 p-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="disc">Discount (THB)</label>
            <input id="disc" inputMode="decimal" className="field num text-right" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="wht">Customer withholds</label>
            <select id="wht" className="field" value={whtBps} onChange={(e) => setWhtBps(Number(e.target.value))}>
              {WHT_OPTIONS.map((o) => (<option key={o.bps} value={o.bps}>{o.label}</option>))}
            </select>
          </div>
          <label className="flex items-center gap-2 self-end pb-2">
            <input type="checkbox" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} />
            <span>Prices include VAT</span>
          </label>
          <div className="sm:col-span-3">
            <label className="label" htmlFor="notes">Notes</label>
            <textarea id="notes" rows={2} className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </section>

        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="text-xs text-muted">Net receivable</div>
            <div className="num text-xl font-semibold text-accent">฿{formatTHB(totals.netReceivable)}</div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn">Save draft</button>
            <button type="button" className="btn btn-primary">Issue</button>
          </div>
        </div>
      </div>

      <aside aria-label="Live document preview" className="xl:sticky xl:top-6 xl:self-start">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-accent">Preview</h2>
          <Link href={`/preview/tax-invoice?lang=${lang}`} className="text-accent hover:underline">Open sample mockup ↗</Link>
        </div>
        <div className="overflow-hidden rounded-lg border border-border shadow-md">
          <ScaledPage width={A4.width} height={A4.height}>
            <InvoiceDocument doc={doc} />
          </ScaledPage>
        </div>
      </aside>
    </div>
  );
}
