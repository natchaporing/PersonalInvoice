import { Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/app-ui";
import { SerialNumber } from "@/components/banknote";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
        actions={
          <Button asChild>
            <Link href="/documents/new"><Plus /> New document</Link>
          </Button>
        }
      />
      <Card className="py-2">
        <CardContent className="px-2 sm:px-3">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>No.</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total ฿</TableHead>
                <TableHead className="text-right">Net receivable ฿</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleDocs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell><SerialNumber value={d.number} className="text-[12px]" /></TableCell>
                  <TableCell>
                    {DOC_TYPE_LABEL[d.type].en}
                    <div className="text-[12px] text-muted-foreground">{DOC_TYPE_LABEL[d.type].th}</div>
                  </TableCell>
                  <TableCell>{d.customer}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateEN(d.issueDate)}</TableCell>
                  <TableCell><StatusBadge status={d.status} overdue={isOverdue(d)} /></TableCell>
                  <TableCell className="num text-right">{formatTHB(d.total)}</TableCell>
                  <TableCell className="num text-right">{formatTHB(d.net)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
