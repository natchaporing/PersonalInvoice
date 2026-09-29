import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";
import { DOC_TYPE_LABEL, isOverdue, sampleDocs } from "@/lib/sample-data";
import { formatTHB } from "@/lib/thai/money";
import { formatDateEN } from "@/lib/thai/thai-date";

export default function Documents() {
  return (
    <>
      <PageHeader
        title="Documents"
        subtitle="เอกสารทั้งหมด"
        actions={<Link href="/documents/new" className="btn btn-primary">New document</Link>}
      />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-border text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Number</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Issued</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Total (THB)</th>
              <th className="px-4 py-3 text-right font-medium">Net receivable</th>
            </tr>
          </thead>
          <tbody>
            {sampleDocs.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-b-0 hover:bg-surface-2">
                <td className="num whitespace-nowrap px-4 py-3 font-medium">{d.number}</td>
                <td className="px-4 py-3">{DOC_TYPE_LABEL[d.type].en}<div className="text-xs text-muted">{DOC_TYPE_LABEL[d.type].th}</div></td>
                <td className="px-4 py-3">{d.customer}</td>
                <td className="px-4 py-3">{formatDateEN(d.issueDate)}</td>
                <td className="px-4 py-3"><StatusBadge status={d.status} overdue={isOverdue(d)} /></td>
                <td className="num px-4 py-3 text-right">{formatTHB(d.total)}</td>
                <td className="num px-4 py-3 text-right">{formatTHB(d.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
