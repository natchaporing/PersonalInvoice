"use client";

import { useMemo, useState } from "react";
import { QrSvg } from "@/components/qr";
import { DOC_TYPE_LABEL, sampleCustomers, type DocType } from "@/lib/sample-data";
import { bahtText } from "@/lib/thai/baht-text";
import { computeTotals, formatTHB, lineAmount, thbToSatang } from "@/lib/thai/money";
import { promptPayPayload } from "@/lib/thai/promptpay";

interface Line { id: number; description: string; qty: string; price: string }

const WHT_OPTIONS = [
  { bps: 0, label: "None" },
  { bps: 100, label: "1% transport" },
  { bps: 200, label: "2% advertising" },
  { bps: 300, label: "3% services" },
  { bps: 500, label: "5% rent" },
];

// Demo PromptPay ID (replace with business profile value).
const DEMO_PROMPTPAY = "0812345678";

export function DocumentEditor() {
  const [type, setType] = useState<DocType>("tax_invoice");
  const [customerId, setCustomerId] = useState(sampleCustomers[0].id);
  const [includeVat, setIncludeVat] = useState(false);
  const [whtBps, setWhtBps] = useState(300);
  const [discount, setDiscount] = useState("0");
  const [lines, setLines] = useState<Line[]>([{ id: 1, description: "Web development / พัฒนาเว็บไซต์", qty: "1", price: "50000" }]);

  const parsed = useMemo(
    () => lines.map((l) => ({ qtyMilli: Math.round((parseFloat(l.qty) || 0) * 1000), unitPrice: thbToSatang(parseFloat(l.price) || 0) })),
    [lines],
  );
  const subtotal = parsed.reduce((s, l) => s + lineAmount(l), 0);
  const disc = Math.min(thbToSatang(parseFloat(discount) || 0), subtotal);
  const t = computeTotals({ lines: parsed, discount: disc, vatRegistered: true, pricesIncludeVat: includeVat, whtBps });

  const update = (id: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const customer = sampleCustomers.find((c) => c.id === customerId)!;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <section className="card grid gap-4 p-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type">Document type</label>
            <select id="type" className="field" value={type} onChange={(e) => setType(e.target.value as DocType)}>
              {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v.en} · {v.th}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="customer">Customer</label>
            <select id="customer" className="field" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {sampleCustomers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <p className="mt-1 text-xs text-muted num">Tax ID {customer.taxId} · {customer.juristic ? "Company (PND 53)" : "Individual (PND 3)"}</p>
          </div>
          <div>
            <label className="label" htmlFor="issue">Issue date</label>
            <input id="issue" type="date" className="field" defaultValue="2026-09-29" />
          </div>
          <div>
            <label className="label" htmlFor="due">Due date</label>
            <input id="due" type="date" className="field" defaultValue="2026-10-29" />
          </div>
        </section>

        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Line items</h2>
          <div className="space-y-3">
            {lines.map((l, i) => (
              <div key={l.id} className="grid grid-cols-[1fr_1fr] gap-2 rounded-lg border border-border p-3 sm:grid-cols-[88px_140px_1fr_auto] sm:items-end">
                <div className="col-span-2 sm:col-span-4">
                  <label className="label" htmlFor={`d${l.id}`}>{i === 0 ? "Description" : `Description ${i + 1}`}</label>
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
                <div className="num col-span-1 pb-2 text-right font-medium sm:col-span-1">฿{formatTHB(lineAmount(parsed[i]))}</div>
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
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <section className="card p-4" aria-label="Totals">
          <dl className="space-y-2">
            <Row k="Subtotal" v={t.subtotal} />
            {t.discount > 0 && <Row k="Discount" v={-t.discount} />}
            <Row k="Amount before VAT" v={t.taxable} />
            <Row k="VAT 7%" v={t.vat} />
            <Row k="Total" v={t.total} strong />
            {t.wht > 0 && <Row k={`Withholding ${whtBps / 100}%`} v={-t.wht} />}
            <div className="border-t border-border pt-2"><Row k="Net receivable" v={t.netReceivable} strong accent /></div>
          </dl>
          <p className="mt-3 text-xs text-muted">{bahtText(t.total)}</p>
        </section>

        <section className="card p-4 text-center" aria-label="PromptPay QR">
          <div className="mb-2 text-xs font-medium text-muted">PromptPay QR · ฿{formatTHB(t.netReceivable)}</div>
          {t.netReceivable > 0 ? (
            <QrSvg value={promptPayPayload(DEMO_PROMPTPAY, t.netReceivable)} label="PromptPay QR code for the net receivable amount" />
          ) : (
            <div className="h-40" />
          )}
          <p className="mt-2 text-xs text-muted">Customer pays the net amount after withholding.</p>
        </section>

        <div className="flex gap-2">
          <button type="button" className="btn flex-1">Save draft</button>
          <button type="button" className="btn btn-primary flex-1">Issue</button>
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v, strong, accent }: { k: string; v: number; strong?: boolean; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : ""} ${accent ? "text-accent" : ""}`}>
      <dt>{k}</dt>
      <dd className="num">{v < 0 ? "−" : ""}฿{formatTHB(Math.abs(v))}</dd>
    </div>
  );
}
