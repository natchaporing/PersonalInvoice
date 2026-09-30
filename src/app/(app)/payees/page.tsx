import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";

export default async function Payees() {
  const { supabase } = await requireUser();
  const [{ data: payees }, { data: commissions }] = await Promise.all([
    supabase.from("commission_payees").select("*").order("name"),
    supabase.from("commissions").select("payee_id, amount, wht, paid_on"),
  ]);
  const owed = (id: string) => (commissions ?? []).filter((c) => c.payee_id === id && !c.paid_on).reduce((s, c) => s + c.amount - c.wht, 0);
  const paid = (id: string) => (commissions ?? []).filter((c) => c.payee_id === id && c.paid_on).reduce((s, c) => s + c.amount - c.wht, 0);
  return (
    <>
      <PageHeader
        eyebrow="ผู้รับค่านายหน้า"
        title="Payees"
        subtitle="People and companies you pay commission to. Internal only: never shown on documents."
        actions={<Button asChild><Link href="/payees/new"><Plus /> New payee</Link></Button>}
      />
      {!payees?.length ? (
        <EmptyState title="No payees yet" action={<Button asChild><Link href="/payees/new"><Plus /> Add a payee</Link></Button>}>
          Save the people who refer work to you, with their bank account and usual commission rate.
        </EmptyState>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Bank</TableHead>
                  <TableHead className="hidden md:table-cell">Default</TableHead>
                  <TableHead className="text-right">To transfer ฿</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Transferred ฿</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payees.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link href={`/payees/${p.id}`} className="font-medium text-cobalt hover:underline">{p.name}</Link>
                      <div className="text-[12px] text-muted-foreground">{p.is_juristic ? "Company" : "Individual"}{p.tax_id && ` · ${p.tax_id}`}</div>
                    </TableCell>
                    <TableCell className="hidden text-[13px] sm:table-cell">{p.bank_name ?? "—"}{p.bank_account_number && <div className="num text-muted-foreground">{p.bank_account_number}</div>}</TableCell>
                    <TableCell className="hidden text-[13px] md:table-cell">{p.default_rate_bps ? `${p.default_rate_bps / 100}%` : "—"}{p.default_wht_bps ? ` · WHT ${p.default_wht_bps / 100}%` : ""}</TableCell>
                    <TableCell className="num text-right">{formatTHB(owed(p.id))}</TableCell>
                    <TableCell className="num hidden text-right sm:table-cell">{formatTHB(paid(p.id))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
