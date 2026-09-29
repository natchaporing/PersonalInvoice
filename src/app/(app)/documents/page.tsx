import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";
import { DOC_TYPE_LABEL, isOverdue, sampleDocs } from "@/lib/sample-data";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN } from "@/lib/thai/thai-date";

export default function Documents() {
  return (
    <>
      <PageHeader
        eyebrow="เอกสารทั้งหมด"
        title="Documents"
        subtitle="Quotations, invoices, tax invoices, receipts and notes."
        actions={<Link href="/documents/new" className="btn btn-primary">New document</Link>}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-fg">
            <tr className="eyebrow">
              <th className="py-2 pr-4 font-medium">No.</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Customer</th>
              <th className="py-2 pr-4 font-medium">Issued</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 text-right font-medium">Total ฿</th>
              <th className="py-2 text-right font-medium">Net receivable ฿</th>
            </tr>
          </thead>
          <tbody>
            {sampleDocs.map((d) => (
              <tr key={d.id} className="border-b border-border align-baseline hover:bg-accent-soft">
                <td className="num whitespace-nowrap py-3 pr-4 text-[13px]">{d.number}</td>
                <td className="py-3 pr-4">{DOC_TYPE_LABEL[d.type].en}<div className="text-[12px] text-muted">{DOC_TYPE_LABEL[d.type].th}</div></td>
                <td className="py-3 pr-4">{d.customer}</td>
                <td className="whitespace-nowrap py-3 pr-4 text-muted">{formatDateEN(d.issueDate)}</td>
                <td className="py-3 pr-4"><StatusBadge status={d.status} overdue={isOverdue(d)} /></td>
                <td className="num py-3 pr-4 text-right">{formatTHB(d.total)}</td>
                <td className="num py-3 text-right">{formatTHB(d.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
