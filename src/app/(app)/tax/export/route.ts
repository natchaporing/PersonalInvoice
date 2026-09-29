import { DOC_TYPE_LABEL } from "@/lib/domain/documents";
import { salesTaxReport, toCsv } from "@/lib/domain/reports";
import { requireUser } from "@/lib/supabase/server";
import { monthParam, taxDocsForMonth } from "../data";

/** Sales tax report (รายงานภาษีขาย) for one month as CSV. */
export async function GET(request: Request) {
  const { supabase } = await requireUser();
  const month = monthParam(new URL(request.url).searchParams.get("month"));
  const rows = salesTaxReport(await taxDocsForMonth(supabase, month), month);
  const baht = (satang: number) => (satang / 100).toFixed(2);
  const csv = toCsv([
    ["วันที่ / Date", "เลขที่ / No.", "ประเภท / Type", "ชื่อผู้ซื้อ / Buyer", "เลขประจำตัวผู้เสียภาษี / Tax ID", "สาขา / Branch", "มูลค่า / Value", "ภาษีมูลค่าเพิ่ม / VAT"],
    ...rows.map((r) => [r.date, r.number, DOC_TYPE_LABEL[r.type].th, r.buyerName, r.buyerTaxId, r.buyerBranch, baht(r.taxable), baht(r.vat)]),
    ["", "", "", "", "", "รวม / Total", baht(rows.reduce((s, r) => s + r.taxable, 0)), baht(rows.reduce((s, r) => s + r.vat, 0))],
  ]);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sales-tax-report-${month}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
