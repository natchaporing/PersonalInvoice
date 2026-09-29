import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/supabase/server";

export default async function Customers() {
  const { supabase } = await requireUser();
  const { data: customers } = await supabase.from("customers").select("*").order("name_th");
  return (
    <>
      <PageHeader
        eyebrow="ลูกค้า"
        title="Customers"
        subtitle="The people and companies you bill."
        actions={<Button asChild><Link href="/customers/new"><Plus /> New customer</Link></Button>}
      />
      {!customers?.length ? (
        <EmptyState title="No customers yet" action={<Button asChild><Link href="/customers/new"><Plus /> Add your first customer</Link></Button>}>
          Add the companies and people you invoice. Tax ID and address are needed for tax invoices.
        </EmptyState>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Tax ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link href={`/customers/${c.id}`} className="font-medium text-cobalt hover:underline">{c.name_th}</Link>
                      {c.name_en && <div className="text-[12px] text-muted-foreground">{c.name_en}</div>}
                    </TableCell>
                    <TableCell className="num text-[13px]">{c.tax_id ?? <span className="text-muted-foreground">—</span>}{c.tax_id && c.branch_code !== "00000" && ` · ${c.branch_code}`}</TableCell>
                    <TableCell className="hidden sm:table-cell">{c.is_juristic ? "Company · PND 53" : "Individual · PND 3"}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{c.email ?? "—"}</TableCell>
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
