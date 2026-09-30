"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { GuillocheBackground, Microprint } from "@/components/banknote";
import { A4, InvoiceDocument } from "@/components/invoice-document";
import { Field, FormMessage } from "@/components/form";
import { ScaledPage } from "@/components/scaled-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DocumentView, Lang, Signatory } from "@/lib/document-view";
import {
  type CustomerSnapshot,
  DOC_TYPE_LABEL,
  DOC_TYPES,
  type DocType,
  EMPTY_SELLER,
  isAdjustment,
  isTaxDocument,
  type SellerSnapshot,
  totalsFor,
  VAT_RATE_OPTIONS,
} from "@/lib/domain/documents";
import type { FormState } from "@/lib/domain/forms";
import { WHT_OPTIONS } from "@/lib/domain/tax";
import type { Tables } from "@/lib/supabase/database.types";
import { bahtText } from "@/lib/thai/baht-text";
import { formatTHB, lineAmount, thbToSatang } from "@/lib/thai/money";
import { cn } from "@/lib/utils";
import { saveDocument } from "./actions";

export interface EditorLine {
  key: string;
  productCode: string;
  discount: string; // THB
  vatBps: number;
  descriptionTh: string;
  descriptionEn: string;
  qty: string;
  unit: string;
  price: string; // THB
}

export interface EditorValue {
  type: DocType;
  customerId: string;
  issueDate: string;
  dueDate: string;
  validUntil: string;
  replyBy: string;
  showProductCode: boolean;
  showUnit: boolean;
  signerId: string;
  approverId: string;
  lang: Lang;
  pricesIncludeVat: boolean;
  whtBps: number;
  discount: string; // THB
  notes: string;
  refDocumentId: string;
  reason: string;
  lines: EditorLine[];
}

export type RefOption = Pick<Tables<"documents">, "id" | "number" | "doc_type" | "customer_id" | "issue_date">;

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: "bilingual", label: "TH + EN" },
  { key: "th", label: "ไทย" },
  { key: "en", label: "English" },
];

const signatoryOf = (x?: Tables<"signatories">): Signatory | undefined =>
  x ? { nameTh: x.name_th, nameEn: x.name_en ?? undefined, titleTh: x.title_th ?? undefined, titleEn: x.title_en ?? undefined, signatureImage: x.signature_image ?? undefined } : undefined;

const num = (s: string) => {
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const newLine = (vatBps = 700): EditorLine => ({
  key: crypto.randomUUID(), productCode: "", discount: "", vatBps, descriptionTh: "", descriptionEn: "", qty: "1", unit: "", price: "",
});

export function DocumentEditor({
  id,
  initial,
  customers,
  items,
  seller,
  vatBps,
  refs,
  signatories,
}: {
  id?: string;
  initial: EditorValue;
  customers: Tables<"customers">[];
  items: Tables<"items">[];
  seller: SellerSnapshot | null;
  vatBps: number;
  refs: RefOption[];
  signatories: Tables<"signatories">[];
}) {
  const [v, setV] = useState<EditorValue>(initial);
  const [state, setState] = useState<FormState>({});
  const [saving, startSave] = useTransition();
  const set = <K extends keyof EditorValue>(k: K, val: EditorValue[K]) => setV((p) => ({ ...p, [k]: val }));
  const setLine = (key: string, patch: Partial<EditorLine>) => setV((p) => ({ ...p, lines: p.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) }));
  const e = state.fieldErrors ?? {};

  const customer = customers.find((c) => c.id === v.customerId);
  const adjustment = isAdjustment(v.type);
  const refChoices = refs.filter((r) => isTaxDocument(r.doc_type) && !isAdjustment(r.doc_type) && (!v.customerId || r.customer_id === v.customerId));

  const lines = useMemo(
    () => v.lines.map((l) => ({ qtyMilli: Math.round(num(l.qty) * 1000), unitPrice: thbToSatang(num(l.price)), discount: thbToSatang(num(l.discount)), vatBps: l.vatBps })),
    [v.lines],
  );
  const totals = totalsFor({ lines, discount: thbToSatang(num(v.discount)), pricesIncludeVat: v.pricesIncludeVat, whtBps: v.whtBps }, vatBps);

  const buyer: CustomerSnapshot | null = customer
    ? { name_th: customer.name_th, name_en: customer.name_en, address_th: customer.address_th, address_en: customer.address_en, tax_id: customer.tax_id, branch_code: customer.branch_code, is_juristic: customer.is_juristic }
    : null;
  const s = seller ?? EMPTY_SELLER;
  const view: DocumentView = {
    type: v.type,
    status: "draft",
    issueDate: v.issueDate,
    dueDate: v.type === "quotation" ? undefined : v.dueDate || undefined,
    validUntil: v.type === "quotation" ? v.validUntil || undefined : undefined,
    replyBy: v.type === "quotation" ? v.replyBy || undefined : undefined,
    showProductCode: v.showProductCode,
    showUnit: v.showUnit,
    signer: signatoryOf(signatories.find((x) => x.id === v.signerId)),
    approver: signatoryOf(signatories.find((x) => x.id === v.approverId)),
    lang: v.lang,
    seller: {
      nameTh: s.name_th, nameEn: s.name_en ?? undefined, addressTh: s.address_th, addressEn: s.address_en ?? undefined,
      taxId: s.tax_id, branchCode: s.branch_code, phone: s.phone ?? undefined, email: s.email ?? undefined, bank: s.bank ?? undefined,
    },
    buyer: buyer
      ? { nameTh: buyer.name_th, nameEn: buyer.name_en ?? undefined, addressTh: buyer.address_th ?? undefined, addressEn: buyer.address_en ?? undefined, taxId: buyer.tax_id ?? undefined, branchCode: buyer.branch_code }
      : { nameTh: "—", branchCode: "00000" },
    lines: v.lines.map((l, i) => ({
      code: l.productCode || undefined, descriptionTh: l.descriptionTh || "—", descriptionEn: l.descriptionEn || undefined,
      qtyMilli: lines[i].qtyMilli, unit: l.unit, unitPrice: lines[i].unitPrice, discount: Math.min(lines[i].discount, lineAmount(lines[i])), vatBps: l.vatBps,
    })),
    discount: totals.discount,
    vatBps,
    pricesIncludeVat: v.pricesIncludeVat,
    whtBps: v.whtBps,
    notes: v.notes || undefined,
    reason: adjustment ? v.reason || undefined : undefined,
    refNumber: adjustment ? refs.find((r) => r.id === v.refDocumentId)?.number ?? undefined : undefined,
  };

  const addItem = (itemId: string) => {
    const it = items.find((x) => x.id === itemId);
    if (!it) return;
    setV((p) => ({
      ...p,
      whtBps: p.lines.every((l) => !l.descriptionTh) && it.default_wht_bps ? it.default_wht_bps : p.whtBps,
      lines: [
        ...p.lines.filter((l) => l.descriptionTh || l.price),
        { key: crypto.randomUUID(), productCode: it.code ?? "", discount: "", vatBps: it.default_vat_bps, descriptionTh: it.name_th, descriptionEn: it.name_en ?? "", qty: "1", unit: it.unit, price: (it.unit_price / 100).toFixed(2) },
      ],
    }));
  };

  const submit = () => {
    setState({});
    const payload = {
      type: v.type,
      customerId: v.customerId,
      issueDate: v.issueDate,
      dueDate: v.type === "quotation" ? "" : v.dueDate,
      validUntil: v.type === "quotation" ? v.validUntil : "",
      replyBy: v.type === "quotation" ? v.replyBy : "",
      showProductCode: v.showProductCode,
      showUnit: v.showUnit,
      signerId: v.signerId,
      approverId: v.approverId,
      lang: v.lang,
      pricesIncludeVat: v.pricesIncludeVat,
      whtBps: v.whtBps,
      discount: thbToSatang(num(v.discount)),
      notes: v.notes,
      refDocumentId: adjustment ? v.refDocumentId : "",
      reason: adjustment ? v.reason : "",
      lines: v.lines.map((l, i) => ({
        productCode: l.productCode, descriptionTh: l.descriptionTh, descriptionEn: l.descriptionEn, qtyMilli: lines[i].qtyMilli,
        unit: l.unit, unitPrice: lines[i].unitPrice, discount: lines[i].discount, vatBps: l.vatBps,
      })),
    };
    startSave(async () => {
      const res = await saveDocument(id ?? null, payload);
      if (res) setState(res);
    });
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <form className="space-y-5" onSubmit={(ev) => { ev.preventDefault(); submit(); }} noValidate>
        {!seller && (
          <p role="status" className="rounded-md border border-amber bg-amber/10 px-4 py-3 text-sm">
            Your business profile is empty, so the seller block is blank. <Link href="/settings" className="font-medium text-cobalt underline">Complete it in Settings</Link>.
          </p>
        )}
        <Card>
          <CardHeader><CardTitle>Document · เอกสาร</CardTitle></CardHeader>
          <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Document type" htmlFor="type" error={e.type}>
              <NativeSelect id="type" value={v.type} onChange={(ev) => set("type", ev.target.value as DocType)} disabled={!!id && adjustment}>
                {DOC_TYPES.map((k) => (<option key={k} value={k}>{DOC_TYPE_LABEL[k].en} · {DOC_TYPE_LABEL[k].th}</option>))}
              </NativeSelect>
            </Field>
            <Field
              label="Customer"
              htmlFor="customer"
              error={e.customerId}
              hint={customer
                ? <span className="tabular-nums">{customer.tax_id ? `Tax ID ${customer.tax_id}` : "No tax ID"} · {customer.is_juristic ? "Company (PND 53)" : "Individual (PND 3)"}</span>
                : <Link href="/customers/new?next=/documents/new" className="text-cobalt underline">Add a customer</Link>}
            >
              <NativeSelect id="customer" value={v.customerId} onChange={(ev) => set("customerId", ev.target.value)}>
                <option value="">Choose…</option>
                {customers.map((c) => (<option key={c.id} value={c.id}>{c.name_th}</option>))}
              </NativeSelect>
            </Field>
            {isTaxDocument(v.type) && customer && (!customer.tax_id || !customer.address_th) && (
              <p className="text-[13px] text-destructive sm:col-span-2">
                Tax documents need the buyer&apos;s tax ID and address. <Link href={`/customers/${customer.id}`} className="underline">Edit this customer</Link>.
              </p>
            )}
            <Field label="Issue date" htmlFor="issue" error={e.issueDate}>
              <Input id="issue" type="date" value={v.issueDate} onChange={(ev) => set("issueDate", ev.target.value)} />
            </Field>
            {v.type === "quotation" ? (
              <>
                <Field label="Valid until" htmlFor="valid" error={e.validUntil} hint="Leave empty to hide it on the document.">
                  <Input id="valid" type="date" value={v.validUntil} onChange={(ev) => set("validUntil", ev.target.value)} />
                </Field>
                <Field label="Reply by" htmlFor="reply" error={e.replyBy} hint="Leave empty to hide it on the document.">
                  <Input id="reply" type="date" value={v.replyBy} onChange={(ev) => set("replyBy", ev.target.value)} />
                </Field>
              </>
            ) : (
              <Field label="Due date" htmlFor="due" error={e.dueDate}>
                <Input id="due" type="date" value={v.dueDate} onChange={(ev) => set("dueDate", ev.target.value)} />
              </Field>
            )}
            {adjustment && (
              <>
                <Field label="Original document" htmlFor="ref" error={e.refDocumentId} hint="The issued tax document this note adjusts.">
                  <NativeSelect id="ref" value={v.refDocumentId} onChange={(ev) => set("refDocumentId", ev.target.value)}>
                    <option value="">Choose…</option>
                    {refChoices.map((r) => (<option key={r.id} value={r.id}>{r.number} · {r.issue_date}</option>))}
                  </NativeSelect>
                </Field>
                <Field label="Reason" htmlFor="reason" error={e.reason} hint="Required by the Revenue Code, e.g. price reduction, returned goods.">
                  <Input id="reason" value={v.reason} onChange={(ev) => set("reason", ev.target.value)} />
                </Field>
              </>
            )}
            <fieldset className="grid gap-1.5 sm:col-span-2">
              <legend className="mb-1.5 text-[13px] font-medium">Document language</legend>
              <div className="inline-flex w-fit rounded-md border border-input bg-card p-0.5">
                {LANG_OPTIONS.map((o) => (
                  <button key={o.key} type="button" aria-pressed={v.lang === o.key} onClick={() => set("lang", o.key)}
                    className={cn("h-8 rounded-sm px-4 text-sm", v.lang === o.key ? "bg-cobalt font-medium text-white" : "text-foreground hover:bg-secondary")}>
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items · รายการ</CardTitle>
            {adjustment && <CardDescription>For a credit note, enter the amount being reduced; for a debit note, the amount being added.</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Label className="font-normal">
                <input type="checkbox" className="size-4 accent-[var(--cobalt)]" checked={v.showProductCode} onChange={(ev) => set("showProductCode", ev.target.checked)} />
                Show product code
              </Label>
              <Label className="font-normal">
                <input type="checkbox" className="size-4 accent-[var(--cobalt)]" checked={v.showUnit} onChange={(ev) => set("showUnit", ev.target.checked)} />
                Show unit
              </Label>
            </div>
            {v.lines.map((l, i) => (
              <div key={l.key} className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-dashed pb-4 sm:grid-cols-[repeat(auto-fit,minmax(104px,1fr))] sm:items-end">
                <Field className="col-span-2 sm:col-span-full" htmlFor={`th-${l.key}`} label={`Description (Thai)${v.lines.length > 1 ? ` · ${i + 1}` : ""}`} error={e[`lines.${i}.descriptionTh`]}>
                  <Input id={`th-${l.key}`} value={l.descriptionTh} onChange={(ev) => setLine(l.key, { descriptionTh: ev.target.value })} />
                </Field>
                <Field className="col-span-2 sm:col-span-full" htmlFor={`en-${l.key}`} label="Description (English)">
                  <Input id={`en-${l.key}`} value={l.descriptionEn} onChange={(ev) => setLine(l.key, { descriptionEn: ev.target.value })} />
                </Field>
                {v.showProductCode && (
                  <Field label="Code" htmlFor={`c-${l.key}`} error={e[`lines.${i}.productCode`]}>
                    <Input id={`c-${l.key}`} value={l.productCode} onChange={(ev) => setLine(l.key, { productCode: ev.target.value })} />
                  </Field>
                )}
                <Field label="Qty" htmlFor={`q-${l.key}`} error={e[`lines.${i}.qtyMilli`]}>
                  <Input id={`q-${l.key}`} inputMode="decimal" className="num text-right" value={l.qty} onChange={(ev) => setLine(l.key, { qty: ev.target.value })} />
                </Field>
                {v.showUnit && (
                  <Field label="Unit" htmlFor={`u-${l.key}`}>
                    <Input id={`u-${l.key}`} value={l.unit} onChange={(ev) => setLine(l.key, { unit: ev.target.value })} />
                  </Field>
                )}
                <Field label="Unit price (THB)" htmlFor={`p-${l.key}`} error={e[`lines.${i}.unitPrice`]}>
                  <Input id={`p-${l.key}`} inputMode="decimal" className="num text-right" value={l.price} onChange={(ev) => setLine(l.key, { price: ev.target.value })} />
                </Field>
                <Field label="Discount (THB)" htmlFor={`d-${l.key}`} error={e[`lines.${i}.discount`]}>
                  <Input id={`d-${l.key}`} inputMode="decimal" className="num text-right" value={l.discount} onChange={(ev) => setLine(l.key, { discount: ev.target.value })} />
                </Field>
                <Field label="VAT" htmlFor={`v-${l.key}`} error={e[`lines.${i}.vatBps`]}>
                  <NativeSelect id={`v-${l.key}`} value={l.vatBps} onChange={(ev) => setLine(l.key, { vatBps: Number(ev.target.value) })}>
                    {VAT_RATE_OPTIONS.map((b) => (<option key={b} value={b}>{b === 0 ? "0% / exempt" : `${b / 100}%`}</option>))}
                  </NativeSelect>
                </Field>
                <div className="num pb-2 text-right font-medium">฿{formatTHB(lineAmount(lines[i]) - Math.min(lines[i].discount, lineAmount(lines[i])))}</div>
                <Button type="button" variant="ghost" size="icon" className="justify-self-end" aria-label={`Remove line ${i + 1}`} disabled={v.lines.length === 1}
                  onClick={() => set("lines", v.lines.filter((x) => x.key !== l.key))}>
                  <X />
                </Button>
              </div>
            ))}
            {e.lines && <p className="text-[12px] text-destructive">{e.lines}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => set("lines", [...v.lines, newLine(vatBps === 0 ? 0 : 700)])}><Plus /> Add line</Button>
              {items.length > 0 && (
                <NativeSelect aria-label="Add a saved item" className="w-auto" value="" onChange={(ev) => addItem(ev.target.value)}>
                  <option value="">+ Add saved item…</option>
                  {items.map((it) => (<option key={it.id} value={it.id}>{it.name_th} · ฿{formatTHB(it.unit_price)}</option>))}
                </NativeSelect>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tax &amp; terms · ภาษีและเงื่อนไข</CardTitle></CardHeader>
          <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
            <Field label="Discount (THB)" htmlFor="disc" error={e.discount}>
              <Input id="disc" inputMode="decimal" className="num text-right" value={v.discount} onChange={(ev) => set("discount", ev.target.value)} />
            </Field>
            <Field label="Customer withholds" htmlFor="wht" error={e.whtBps}>
              <NativeSelect id="wht" value={v.whtBps} onChange={(ev) => set("whtBps", Number(ev.target.value))}>
                {WHT_OPTIONS.map((o) => (<option key={o.bps} value={o.bps}>{o.label}</option>))}
              </NativeSelect>
            </Field>
            <Label className="self-end pb-2.5 font-normal">
              <input type="checkbox" className="size-4 accent-[var(--cobalt)]" checked={v.pricesIncludeVat} onChange={(ev) => set("pricesIncludeVat", ev.target.checked)} />
              Prices include VAT
            </Label>
            <Field className="sm:col-span-3" label="Notes" htmlFor="notes">
              <Textarea id="notes" rows={2} value={v.notes} onChange={(ev) => set("notes", ev.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signatures · ผู้ลงนาม</CardTitle>
            <CardDescription>
              Printed on the document with their name, title and signature image. Manage people in <Link href="/settings" className="text-cobalt underline">Settings</Link>.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label="Issued by (signer)" htmlFor="signer" error={e.signerId}>
              <NativeSelect id="signer" value={v.signerId} onChange={(ev) => set("signerId", ev.target.value)}>
                <option value="">Blank signature line</option>
                {signatories.map((x) => (<option key={x.id} value={x.id}>{x.name_th}{x.title_th ? ` · ${x.title_th}` : ""}</option>))}
              </NativeSelect>
            </Field>
            <Field label="Approved by (approver)" htmlFor="approver" error={e.approverId} hint="Leave empty for no approver block.">
              <NativeSelect id="approver" value={v.approverId} onChange={(ev) => set("approverId", ev.target.value)}>
                <option value="">None</option>
                {signatories.map((x) => (<option key={x.id} value={x.id}>{x.name_th}{x.title_th ? ` · ${x.title_th}` : ""}</option>))}
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <section aria-label="Totals" className="relative overflow-hidden rounded-lg border border-cobalt/25 bg-paper">
          <GuillocheBackground opacity={0.09} />
          <div className="relative flex flex-wrap items-end justify-between gap-4 p-5">
            <div>
              <div className="eyebrow text-cobalt">{totals.wht > 0 ? "Net receivable · ยอดรับสุทธิ" : "Total · ยอดรวม"}</div>
              <div className="figure text-[36px] leading-tight text-cobalt">฿{formatTHB(totals.netReceivable)}</div>
              <div className="text-[12px] text-muted-foreground">{bahtText(totals.netReceivable)}</div>
              <div className="num mt-1 text-[12px] text-muted-foreground">
                Before VAT {formatTHB(totals.taxable)} · VAT {formatTHB(totals.vat)} · Total {formatTHB(totals.total)}
                {totals.wht > 0 && ` · WHT −${formatTHB(totals.wht)}`}
              </div>
            </div>
            <div className="flex gap-2">
              {id && <Button asChild variant="outline"><Link href={`/documents/${id}`}>Cancel</Link></Button>}
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : id ? "Save draft" : "Save as draft"}</Button>
            </div>
          </div>
          <Microprint className="relative border-t border-cobalt/15 px-5 py-0.5" />
        </section>
        <FormMessage state={state} />
      </form>

      <aside aria-label="Live document preview" className="xl:sticky xl:top-6 xl:self-start">
        <h2 className="display mb-2 text-xl text-cobalt">Preview</h2>
        <div className="overflow-hidden rounded-md border bg-white shadow-[0_1px_0_var(--border),0_14px_34px_-18px_rgb(26_37_54/0.4)]">
          <ScaledPage width={A4.width} height={A4.height}>
            <InvoiceDocument doc={view} idPrefix="editor" />
          </ScaledPage>
        </div>
      </aside>
    </div>
  );
}
