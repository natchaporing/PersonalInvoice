"use client";

import { Plus, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { GuillocheBackground, Microprint } from "@/components/banknote";
import { A4 } from "@/components/invoice-document";
import { InvoiceModern } from "@/components/invoice-modern";
import { Field, FormMessage } from "@/components/form";
import { PreviewFrame } from "@/components/preview-frame";
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
import { useLocale, useMessages } from "@/lib/i18n/client";
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
  const m = useMessages();
  const t = m.docs.editor;
  const locale = useLocale();
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
            {t.emptyProfile} <Link href="/settings" className="font-medium text-cobalt underline">{t.completeProfile}</Link>
          </p>
        )}
        <Card>
          <CardHeader><CardTitle>{t.document}</CardTitle></CardHeader>
          <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label={t.type} htmlFor="type" error={e.type}>
              <NativeSelect id="type" value={v.type} onChange={(ev) => set("type", ev.target.value as DocType)} disabled={!!id && adjustment}>
                {DOC_TYPES.map((k) => (<option key={k} value={k}>{DOC_TYPE_LABEL[k][locale]}</option>))}
              </NativeSelect>
            </Field>
            <Field
              label={t.customer}
              htmlFor="customer"
              error={e.customerId}
              hint={customer
                ? <span className="tabular-nums">{customer.tax_id ? t.customerTaxId(customer.tax_id) : t.noTaxId} · {customer.is_juristic ? t.company : t.individual}</span>
                : <Link href="/customers/new?next=/documents/new" className="text-cobalt underline">{t.addCustomer}</Link>}
            >
              <NativeSelect id="customer" value={v.customerId} onChange={(ev) => set("customerId", ev.target.value)}>
                <option value="">{t.choose}</option>
                {customers.map((c) => (<option key={c.id} value={c.id}>{c.name_th}</option>))}
              </NativeSelect>
            </Field>
            {isTaxDocument(v.type) && customer && (!customer.tax_id || !customer.address_th) && (
              <p className="text-[13px] text-destructive sm:col-span-2">
                {t.needsTaxId} <Link href={`/customers/${customer.id}`} className="underline">{t.editCustomer}</Link>
              </p>
            )}
            <Field label={t.issueDate} htmlFor="issue" error={e.issueDate}>
              <Input id="issue" type="date" value={v.issueDate} onChange={(ev) => set("issueDate", ev.target.value)} />
            </Field>
            {v.type === "quotation" ? (
              <>
                <Field label={t.validUntil} htmlFor="valid" error={e.validUntil} hint={t.hideIfEmpty}>
                  <Input id="valid" type="date" value={v.validUntil} onChange={(ev) => set("validUntil", ev.target.value)} />
                </Field>
                <Field label={t.replyBy} htmlFor="reply" error={e.replyBy} hint={t.hideIfEmpty}>
                  <Input id="reply" type="date" value={v.replyBy} onChange={(ev) => set("replyBy", ev.target.value)} />
                </Field>
              </>
            ) : (
              <Field label={t.dueDate} htmlFor="due" error={e.dueDate}>
                <Input id="due" type="date" value={v.dueDate} onChange={(ev) => set("dueDate", ev.target.value)} />
              </Field>
            )}
            {adjustment && (
              <>
                <Field label={t.original} htmlFor="ref" error={e.refDocumentId} hint={t.originalHint}>
                  <NativeSelect id="ref" value={v.refDocumentId} onChange={(ev) => set("refDocumentId", ev.target.value)}>
                    <option value="">{t.choose}</option>
                    {refChoices.map((r) => (<option key={r.id} value={r.id}>{r.number} · {r.issue_date}</option>))}
                  </NativeSelect>
                </Field>
                <Field label={t.reason} htmlFor="reason" error={e.reason} hint={t.reasonHint}>
                  <Input id="reason" value={v.reason} onChange={(ev) => set("reason", ev.target.value)} />
                </Field>
              </>
            )}
            <fieldset className="grid gap-1.5 sm:col-span-2">
              <legend className="mb-1.5 text-[13px] font-medium">{t.language}</legend>
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
            <CardTitle>{t.lines}</CardTitle>
            {adjustment && <CardDescription>{t.adjustNote}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <Label className="font-normal">
                <input type="checkbox" className="size-4 accent-[var(--cobalt)]" checked={v.showProductCode} onChange={(ev) => set("showProductCode", ev.target.checked)} />
                {t.showCode}
              </Label>
              <Label className="font-normal">
                <input type="checkbox" className="size-4 accent-[var(--cobalt)]" checked={v.showUnit} onChange={(ev) => set("showUnit", ev.target.checked)} />
                {t.showUnit}
              </Label>
            </div>
            {v.lines.map((l, i) => (
              <div key={l.key} className="grid grid-cols-2 gap-x-3 gap-y-2 border-b border-dashed pb-4 sm:grid-cols-[repeat(auto-fit,minmax(104px,1fr))] sm:items-end">
                <Field className="col-span-2 sm:col-span-full" htmlFor={`th-${l.key}`} label={`${t.descTh}${v.lines.length > 1 ? ` · ${i + 1}` : ""}`} error={e[`lines.${i}.descriptionTh`]}>
                  <Input id={`th-${l.key}`} value={l.descriptionTh} onChange={(ev) => setLine(l.key, { descriptionTh: ev.target.value })} />
                </Field>
                <Field className="col-span-2 sm:col-span-full" htmlFor={`en-${l.key}`} label={t.descEn}>
                  <Input id={`en-${l.key}`} value={l.descriptionEn} onChange={(ev) => setLine(l.key, { descriptionEn: ev.target.value })} />
                </Field>
                {v.showProductCode && (
                  <Field label={t.code} htmlFor={`c-${l.key}`} error={e[`lines.${i}.productCode`]}>
                    <Input id={`c-${l.key}`} value={l.productCode} onChange={(ev) => setLine(l.key, { productCode: ev.target.value })} />
                  </Field>
                )}
                <Field label={t.qty} htmlFor={`q-${l.key}`} error={e[`lines.${i}.qtyMilli`]}>
                  <Input id={`q-${l.key}`} inputMode="decimal" className="num text-right" value={l.qty} onChange={(ev) => setLine(l.key, { qty: ev.target.value })} />
                </Field>
                {v.showUnit && (
                  <Field label={t.unit} htmlFor={`u-${l.key}`}>
                    <Input id={`u-${l.key}`} value={l.unit} onChange={(ev) => setLine(l.key, { unit: ev.target.value })} />
                  </Field>
                )}
                <Field label={t.unitPrice} htmlFor={`p-${l.key}`} error={e[`lines.${i}.unitPrice`]}>
                  <Input id={`p-${l.key}`} inputMode="decimal" className="num text-right" value={l.price} onChange={(ev) => setLine(l.key, { price: ev.target.value })} />
                </Field>
                <Field label={t.discount} htmlFor={`d-${l.key}`} error={e[`lines.${i}.discount`]}>
                  <Input id={`d-${l.key}`} inputMode="decimal" className="num text-right" value={l.discount} onChange={(ev) => setLine(l.key, { discount: ev.target.value })} />
                </Field>
                <Field label={t.vat} htmlFor={`v-${l.key}`} error={e[`lines.${i}.vatBps`]}>
                  <NativeSelect id={`v-${l.key}`} value={l.vatBps} onChange={(ev) => setLine(l.key, { vatBps: Number(ev.target.value) })}>
                    {VAT_RATE_OPTIONS.map((b) => (<option key={b} value={b}>{b === 0 ? t.exempt : `${b / 100}%`}</option>))}
                  </NativeSelect>
                </Field>
                <div className="num pb-2 text-right font-medium">฿{formatTHB(lineAmount(lines[i]) - Math.min(lines[i].discount, lineAmount(lines[i])))}</div>
                <Button type="button" variant="ghost" size="icon" className="justify-self-end" aria-label={t.removeLine(i + 1)} disabled={v.lines.length === 1}
                  onClick={() => set("lines", v.lines.filter((x) => x.key !== l.key))}>
                  <X />
                </Button>
              </div>
            ))}
            {e.lines && <p className="text-[12px] text-destructive">{e.lines}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => set("lines", [...v.lines, newLine(vatBps === 0 ? 0 : 700)])}><Plus /> {t.addLine}</Button>
              {items.length > 0 && (
                <NativeSelect aria-label={t.addSaved} className="w-auto" value="" onChange={(ev) => addItem(ev.target.value)}>
                  <option value="">{t.addSavedOption}</option>
                  {items.map((it) => (<option key={it.id} value={it.id}>{it.name_th} · ฿{formatTHB(it.unit_price)}</option>))}
                </NativeSelect>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t.taxTerms}</CardTitle></CardHeader>
          <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-3">
            <Field label={t.discount} htmlFor="disc" error={e.discount}>
              <Input id="disc" inputMode="decimal" className="num text-right" value={v.discount} onChange={(ev) => set("discount", ev.target.value)} />
            </Field>
            <Field label={t.customerWithholds} htmlFor="wht" error={e.whtBps}>
              <NativeSelect id="wht" value={v.whtBps} onChange={(ev) => set("whtBps", Number(ev.target.value))}>
                {WHT_OPTIONS.map((o) => (<option key={o.bps} value={o.bps}>{m.wht[o.bps]}</option>))}
              </NativeSelect>
            </Field>
            <Label className="self-end pb-2.5 font-normal">
              <input type="checkbox" className="size-4 accent-[var(--cobalt)]" checked={v.pricesIncludeVat} onChange={(ev) => set("pricesIncludeVat", ev.target.checked)} />
              {t.pricesIncludeVat}
            </Label>
            <Field className="sm:col-span-3" label={t.notes} htmlFor="notes">
              <Textarea id="notes" rows={2} value={v.notes} onChange={(ev) => set("notes", ev.target.value)} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.signatures}</CardTitle>
            <CardDescription>
              {t.signaturesNote} <Link href="/settings" className="text-cobalt underline">{t.settings}</Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <Field label={t.signer} htmlFor="signer" error={e.signerId}>
              <NativeSelect id="signer" value={v.signerId} onChange={(ev) => set("signerId", ev.target.value)}>
                <option value="">{t.blankSigner}</option>
                {signatories.map((x) => (<option key={x.id} value={x.id}>{x.name_th}{x.title_th ? ` · ${x.title_th}` : ""}</option>))}
              </NativeSelect>
            </Field>
            <Field label={t.approver} htmlFor="approver" error={e.approverId} hint={t.approverHint}>
              <NativeSelect id="approver" value={v.approverId} onChange={(ev) => set("approverId", ev.target.value)}>
                <option value="">{t.none}</option>
                {signatories.map((x) => (<option key={x.id} value={x.id}>{x.name_th}{x.title_th ? ` · ${x.title_th}` : ""}</option>))}
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>

        <section aria-label={t.totals} className="relative overflow-hidden rounded-lg border border-cobalt/25 bg-paper">
          <GuillocheBackground opacity={0.09} />
          <div className="relative flex flex-wrap items-end justify-between gap-4 p-5">
            <div>
              <div className="eyebrow text-cobalt">{totals.wht > 0 ? t.netReceivable : t.totalLabel}</div>
              <div className="figure text-[36px] leading-tight text-cobalt">฿{formatTHB(totals.netReceivable)}</div>
              <div className="text-[12px] text-muted-foreground">{bahtText(totals.netReceivable)}</div>
              <div className="num mt-1 text-[12px] text-muted-foreground">
                {t.totalsLine(formatTHB(totals.taxable), formatTHB(totals.vat), formatTHB(totals.total))}
                {totals.wht > 0 && t.whtLine(formatTHB(totals.wht))}
              </div>
            </div>
            <div className="flex gap-2">
              {id && <Button asChild variant="outline"><Link href={`/documents/${id}`}>{t.cancel}</Link></Button>}
              <Button type="submit" disabled={saving}>{saving ? t.saving : id ? t.saveDraft : t.saveAsDraft}</Button>
            </div>
          </div>
          <Microprint className="relative border-t border-cobalt/15 px-5 py-0.5" />
        </section>
        <FormMessage state={state} />
      </form>

      <aside aria-label={t.livePreview} className="xl:sticky xl:top-6 xl:self-start">
        <h2 className="display -mb-8 text-xl text-cobalt">{t.preview}</h2>
        <PreviewFrame width={A4.width} height={A4.height} title={t.livePreview}>
          <InvoiceModern doc={view} />
        </PreviewFrame>
      </aside>
    </div>
  );
}
