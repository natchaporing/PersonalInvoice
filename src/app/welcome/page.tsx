import { ArrowRight, BadgeCheck, FileCheck2, UserRound } from "lucide-react";
import Link from "next/link";
import { GuillocheBackground, GuillocheBand, Rosette } from "@/components/banknote";
import { A4 } from "@/components/invoice-document";
import { InvoiceModern } from "@/components/invoice-modern";
import { LogoMark } from "@/components/logo";
import { ScaledPage } from "@/components/scaled-page";
import { buttonVariants } from "@/components/ui/button";
import { PLANS, TRIAL_DAYS, yearlySavingPct } from "@/lib/domain/billing";
import { sampleTaxInvoice } from "@/lib/sample-data";
import { formatTHB } from "@/lib/thai/money";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Tra · เอกสารภาษีของคนทำงานคนเดียว",
  description: "Quotations, invoices and tax invoices, done right, for VAT-registered freelancers in Thailand. 15-day free trial, no card needed.",
};

const baht = (satang: number) => `฿${formatTHB(satang).replace(/\.00$/, "")}`;

// Three messages, each carried by something the product really does. No e-Tax claims, no "approved by the RD".
const MESSAGES = [
  {
    icon: FileCheck2,
    th: "ถูกต้องตั้งแต่ใบเสนอราคาถึงใบเสร็จ",
    en: "Right from quotation to receipt",
    body: "แบ่งงวดเก็บเงินตามหลักความรับผิดในการเสียภาษีของงานบริการ (ม.78/1): ออกใบแจ้งหนี้ก่อน แล้วออกใบกำกับภาษีเมื่อได้รับเงิน",
    bodyEn: "Instalments follow the service tax-point rule: an invoice first, the tax invoice when you're paid.",
  },
  {
    icon: BadgeCheck,
    th: "เอกสารที่ลูกค้าเชื่อถือ",
    en: "Documents your clients trust",
    body: "PDF ทุกฉบับลงลายมือชื่อดิจิทัล และมี QR ให้ลูกค้าสแกนตรวจสอบได้ว่าเป็นฉบับจริง ไม่ถูกแก้ไข",
    bodyEn: "Every PDF is signed, with a QR code your client scans to check it's genuine and unchanged.",
  },
  {
    icon: UserRound,
    th: "ทำเองได้ ไม่ต้องมีฝ่ายบัญชี",
    en: "Built for one person",
    body: "ไม่มีสมุดบัญชีให้เรียนรู้ หนังสือรับรองหัก ณ ที่จ่าย ค่านายหน้า และรายงานภาษีซื้อขายอยู่ในที่เดียว",
    bodyEn: "No ledger to learn. Withholding certificates, commission and the VAT report in one place.",
  },
];

const STEPS = [
  { th: "ใบเสนอราคา", en: "Quotation", note: "ลูกค้าอนุมัติ 50/50 · Client approves a 50/50 plan" },
  { th: "ใบแจ้งหนี้งวดที่ 1", en: "Invoice, instalment 1", note: "ยังไม่ใช่ใบกำกับภาษี · Not a tax document yet" },
  { th: "ใบเสร็จ/ใบกำกับภาษี", en: "Receipt / tax invoice", note: "ออกเมื่อได้รับเงิน · Issued when you're paid" },
];

const FAQ = [
  {
    q: "ใบกำกับภาษีแบบ PDF ใช้ได้ตามกฎหมายไหม · Is a PDF tax invoice legal?",
    a: "ได้ เอกสารของ Tra มีรายการครบตามประมวลรัษฎากร ม.86/4 ส่วนระบบ e-Tax Invoice เป็นทางเลือก ไม่ใช่ข้อบังคับ · Yes. Tra's documents carry everything Revenue Code s.86/4 requires; e-Tax is optional.",
  },
  {
    q: "Tra เหมาะกับใคร · Who is Tra for?",
    a: "บุคคลธรรมดาที่จดทะเบียนภาษีมูลค่าเพิ่ม เช่น ฟรีแลนซ์และเจ้าของกิจการคนเดียว บัญชีนิติบุคคลจะเปิดในภายหลัง · Individuals registered for VAT, such as freelancers and sole proprietors. Company accounts come later.",
  },
  {
    q: "หมดช่วงทดลองแล้วเป็นอย่างไร · What happens after the trial?",
    a: `เลือกแพ็กเกจ ${baht(PLANS.pro_year.price)}/ปี หรือ ${baht(PLANS.pro_month.price)}/เดือน หากยังไม่สมัคร เอกสารเดิมยังเปิดดูและดาวน์โหลดได้ แค่ออกฉบับใหม่ไม่ได้ · Choose a plan. If you don't, your documents stay yours to view and download; you just can't issue new ones.`,
  },
  {
    q: "รองรับ e-Tax Invoice ไหม · Do you do e-Tax invoices?",
    a: "ยังไม่รองรับ Tra ออกใบกำกับภาษีแบบปกติที่ใช้ได้ตามกฎหมาย · Not yet. Tra issues standard tax invoices, which are fully valid.",
  },
];

function TrialButton({ className }: { className?: string }) {
  return (
    <Link href="/register" className={cn(buttonVariants({ size: "lg" }), className)}>
      ทดลองใช้ฟรี {TRIAL_DAYS} วัน <ArrowRight aria-hidden />
    </Link>
  );
}

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="relative overflow-hidden bg-cobalt-deep px-4 py-4 text-white sm:px-6">
        <GuillocheBackground tone="white" opacity={0.16} />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <LogoMark size={40} title="" />
            <span className="display text-[24px] tracking-tight">Tra<span className="ml-1.5 font-sans text-[15px] text-amber">ตรา</span></span>
          </span>
          <nav aria-label="Account" className="flex items-center gap-2 text-sm">
            <Link href="/login" className="rounded-sm px-3 py-1.5 text-white/90 hover:bg-white/10">เข้าสู่ระบบ · Sign in</Link>
            <Link href="/register" className="hidden rounded-sm bg-amber px-3 py-1.5 font-medium text-cobalt-deep hover:bg-amber/90 sm:inline-block">ทดลองใช้ฟรี</Link>
          </nav>
        </div>
      </header>
      <GuillocheBand tone="amber" height={10} opacity={1} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <Rosette size={420} tone="mono" opacity={0.06} className="absolute -top-24 -left-32" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:py-20">
            <div>
              <div className="eyebrow text-cobalt">เอกสารภาษีของคนทำงานคนเดียว · Tax documents for people who work alone</div>
              <h1 className="display mt-3 text-[34px] leading-tight sm:text-[44px]">
                {/* Keep each Thai phrase whole: the browser's Thai line breaking splits "ใบ" from "กำกับภาษี". */}
                <span className="whitespace-nowrap">ใบเสนอราคา</span> <span className="whitespace-nowrap">ใบแจ้งหนี้</span> <span className="whitespace-nowrap">ใบกำกับภาษี</span>{" "}
                <span className="whitespace-nowrap">ครบและถูกต้อง</span> <span className="whitespace-nowrap">สำหรับฟรีแลนซ์</span><span className="whitespace-nowrap">ที่จด VAT</span>
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">Quotations, invoices and tax invoices, done right, for VAT-registered freelancers.</p>
              <p className="mt-5 max-w-[56ch]">
                แบ่งงวดเก็บเงินได้ถูกหลักภาษี ลูกค้าสแกน QR ตรวจสอบเอกสารได้ทุกฉบับ ไม่ต้องมีความรู้บัญชี
                <span className="block text-muted-foreground">Bill in instalments the correct way, give clients documents they can verify, and skip the accounting jargon.</span>
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <TrialButton />
                <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>เข้าสู่ระบบ</Link>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">ไม่ต้องใช้บัตร · No card needed · then {baht(PLANS.pro_year.price)} a year, VAT included</p>
            </div>
            <div aria-label="A sample tax invoice made with Tra" role="img" className="mx-auto w-full max-w-[460px] rotate-[1.5deg] overflow-hidden rounded-md border bg-white shadow-[0_24px_60px_-28px_rgb(26_37_54/0.55)]">
              <div aria-hidden>
                <ScaledPage width={A4.width} height={A4.height}>
                  <InvoiceModern doc={sampleTaxInvoice} />
                </ScaledPage>
              </div>
            </div>
          </div>
        </section>

        {/* Three messages */}
        <section aria-labelledby="why" className="border-y bg-card">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 id="why" className="display text-[28px]">ทำไมต้อง Tra <span className="text-muted-foreground">· Why Tra</span></h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {MESSAGES.map(({ icon: Icon, th, en, body, bodyEn }) => (
                <article key={en} className="rounded-md border bg-background p-5">
                  <Icon className="size-6 text-cobalt" aria-hidden />
                  <h3 className="mt-3 text-lg font-semibold">{th}</h3>
                  <div className="text-sm text-muted-foreground">{en}</div>
                  <p className="mt-3 text-[15px]">{body}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{bodyEn}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Instalments, the hard part made right */}
        <section aria-labelledby="flow" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="flow" className="display text-[28px]">งานบริการแบ่งงวด ออกเอกสารให้ถูกจังหวะ</h2>
          <p className="mt-1 text-muted-foreground">Instalment billing for services, with each document issued at the right moment.</p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.en} className="relative rounded-md border border-cobalt/25 bg-paper p-5">
                <span className="num text-sm text-cobalt">{String(i + 1).padStart(2, "0")}</span>
                <div className="mt-1 text-lg font-semibold">{s.th}</div>
                <div className="text-sm text-muted-foreground">{s.en}</div>
                <p className="mt-3 text-sm">{s.note}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Pricing */}
        <section aria-labelledby="price" className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_1.2fr] md:items-center">
            <div>
              <h2 id="price" className="display text-[28px]">ราคาเดียว ครบทุกอย่าง</h2>
              <p className="mt-1 text-muted-foreground">One plan with everything in it. Try it free for {TRIAL_DAYS} days first.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border-2 border-cobalt bg-background p-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">รายปี · Yearly</span>
                  <span className="rounded-sm bg-amber/25 px-2 py-0.5 text-[12px] font-medium">ประหยัด {yearlySavingPct()}%</span>
                </div>
                <div className="num mt-2 text-[30px] font-semibold">{baht(PLANS.pro_year.price)}</div>
                <div className="text-sm text-muted-foreground">ต่อปี รวม VAT · a year, VAT included</div>
              </div>
              <div className="rounded-md border bg-background p-5">
                <span className="font-semibold">รายเดือน · Monthly</span>
                <div className="num mt-2 text-[30px] font-semibold">{baht(PLANS.pro_month.price)}</div>
                <div className="text-sm text-muted-foreground">ต่อเดือน รวม VAT · a month, VAT included</div>
              </div>
              <TrialButton className="sm:col-span-2" />
            </div>
          </div>
        </section>

        {/* Objections */}
        <section aria-labelledby="faq" className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 id="faq" className="display text-[28px]">คำถามที่พบบ่อย <span className="text-muted-foreground">· Questions</span></h2>
          <div className="mt-6 divide-y rounded-md border bg-card">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium marker:hidden">
                  <span className="mr-2 inline-block text-cobalt transition-transform group-open:rotate-90" aria-hidden>›</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-5 text-[15px] text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-cobalt-deep px-4 py-5 text-sm text-white/85 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span>Tra · trasolutions.co · สำหรับบุคคลธรรมดาที่จด VAT</span>
          <Link href="/terms" className="underline underline-offset-4 hover:text-white">ข้อกำหนดและความเป็นส่วนตัว · Terms and privacy</Link>
        </div>
      </footer>
    </div>
  );
}
