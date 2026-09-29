import { Plus } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/app-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/supabase/server";
import { formatTHB } from "@/lib/thai/money";

export default async function Items() {
  const { supabase } = await requireUser();
  const { data: items } = await supabase.from("items").select("*").order("name_th");
  return (
    <>
      <PageHeader
        eyebrow="สินค้า/บริการ"
        title="Items"
        subtitle="Products and services you sell, reusable on any document."
        actions={<Button asChild><Link href="/items/new"><Plus /> New item</Link></Button>}
      />
      {!items?.length ? (
        <EmptyState title="No items yet" action={<Button asChild><Link href="/items/new"><Plus /> Add an item</Link></Button>}>
          Save what you sell with its price, unit and usual withholding rate, then add it to documents in one click.
        </EmptyState>
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-3">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Item</TableHead>
                  <TableHead className="hidden sm:table-cell">Unit</TableHead>
                  <TableHead className="hidden sm:table-cell">Withholding</TableHead>
                  <TableHead className="text-right">Price ฿</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Link href={`/items/${i.id}`} className="font-medium text-cobalt hover:underline">{i.name_th}</Link>
                      {i.name_en && <div className="text-[12px] text-muted-foreground">{i.name_en}</div>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{i.unit || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell">{i.default_wht_bps ? `${i.default_wht_bps / 100}%` : "—"}</TableCell>
                    <TableCell className="num text-right">{formatTHB(i.unit_price)}</TableCell>
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
