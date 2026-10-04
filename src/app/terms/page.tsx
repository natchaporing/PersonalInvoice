import Link from "next/link";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PLANS, TRIAL_DAYS, withVat } from "@/lib/domain/billing";
import { getLocale } from "@/lib/i18n/server";
import { operator } from "@/lib/operator";
import { formatTHB } from "@/lib/thai/money";

export async function generateMetadata() {
  return { title: (await getLocale()) === "th" ? "ข้อกำหนดและนโยบายความเป็นส่วนตัว · Tra" : "Terms and privacy · Tra" };
}

// Written for review by a Thai lawyer before Tra takes payments. The operator's details come from the server
// (lib/operator.ts); until they are set the page says it is not in force. The Thai text governs.
const UPDATED = { th: "4 ตุลาคม 2569", en: "4 October 2026" };

const H1 = ({ id, children }: { id?: string; children: ReactNode }) => <h1 id={id} className="display mt-12 scroll-mt-6 text-[32px] first:mt-6">{children}</h1>;
const H2 = ({ children }: { children: ReactNode }) => <h2 className="mt-6 text-lg font-semibold">{children}</h2>;
const List = ({ children }: { children: ReactNode }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>;

export default async function TermsPage() {
  const locale = await getLocale();
  const op = operator();
  const blank = locale === "th" ? "[ยังไม่ได้ระบุ]" : "[not set yet]";
  const who = { name: op.name ?? blank, taxId: op.taxId ?? blank, address: op.address ?? blank, email: op.email ?? blank };
  const price = (k: keyof typeof PLANS) => `฿${formatTHB(PLANS[k].price)}`;
  const total = (k: keyof typeof PLANS) => `฿${formatTHB(withVat(PLANS[k].price).total)}`;
  const mail = op.email ? <a href={`mailto:${op.email}`} className="text-cobalt underline">{op.email}</a> : who.email;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-[15px] leading-relaxed">
      <div className="flex justify-end"><div className="rounded-md bg-cobalt-deep p-1 text-white"><LanguageSwitcher /></div></div>
      {!op.ready && (
        <p role="note" className="mt-4 rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-sm">
          {locale === "th" ? "ยังไม่มีผลใช้บังคับ: ยังไม่ได้ระบุข้อมูลผู้ให้บริการ" : "Not yet in force: the operator's details have not been filled in."}
        </p>
      )}

      {locale === "th" ? (
        <>
          <H1>ข้อกำหนดการใช้บริการ</H1>
          <p className="text-muted-foreground">ปรับปรุงล่าสุด {UPDATED.th}</p>

          <H2>ผู้ให้บริการ</H2>
          <p>Tra (trasolutions.co) ให้บริการโดย {who.name} เลขประจำตัวผู้เสียภาษี {who.taxId} ที่อยู่ {who.address} ติดต่อ {mail}</p>

          <H2>บริการ</H2>
          <p>Tra ช่วยบุคคลธรรมดาจัดทำ ออก และส่งมอบใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จรับเงิน ใบกำกับภาษี และเอกสารที่เกี่ยวข้อง คุณรับผิดชอบความถูกต้องของข้อมูลในเอกสาร การส่งมอบเอกสาร และการยื่นภาษีของคุณเอง Tra ไม่ใช่บริการบัญชีหรือที่ปรึกษาภาษี</p>

          <H2>ใบกำกับภาษีและการส่งมอบ</H2>
          <p>ไฟล์ PDF ที่ดาวน์โหลดจาก Tra เป็นสำเนา ต้นฉบับใบกำกับภาษีต้องส่งมอบแบบกระดาษ หรือทาง e-Tax Invoice by Email หากคุณลงทะเบียนกับกรมสรรพากรแล้ว Tra เตรียมไฟล์และอีเมลให้ แต่การลงทะเบียนและการส่งเป็นหน้าที่ของคุณ ลายมือชื่อดิจิทัลในไฟล์เป็นตราของ Tra เพื่อยืนยันว่าเอกสารไม่ถูกแก้ไข ไม่ใช่ลายมือชื่อของคุณ</p>

          <H2>ผู้ใช้บริการ</H2>
          <p>สำหรับบุคคลธรรมดาที่จดทะเบียนภาษีมูลค่าเพิ่ม เช่น ฟรีแลนซ์และผู้ประกอบการคนเดียว ยังไม่รองรับนิติบุคคล คุณต้องให้ข้อมูลที่ถูกต้องและดูแลรหัสผ่านของคุณ</p>

          <H2>ทดลองใช้และค่าบริการ</H2>
          <p>
            บัญชีใหม่ทดลองใช้ Pro ฟรี {TRIAL_DAYS} วัน ไม่ต้องใช้บัตร หลังจากนั้นการออกเอกสารต้องมีแพ็กเกจที่ชำระแล้ว: {price("pro_year")} ต่อปี หรือ {price("pro_month")} ต่อเดือน
            บวกภาษีมูลค่าเพิ่ม 7% (รวม {total("pro_year")} และ {total("pro_month")}) ช่วงที่ชำระจะเริ่มเมื่อหมดช่วงทดลองหรือช่วงปัจจุบัน แพ็กเกจไม่ต่ออายุอัตโนมัติ
            การชำระเงินดำเนินการโดย Opn Payments (Omise) Tra ไม่เห็นหมายเลขบัตรของคุณ เราออกใบเสร็จรับเงิน/ใบกำกับภาษีทุกครั้งที่ชำระ และส่งต้นฉบับทาง e-Tax Invoice by Email
          </p>

          <H2>การยกเลิกและคืนเงิน</H2>
          <p>คุณหยุดใช้ได้ทุกเมื่อ แพ็กเกจไม่ต่ออายุเอง หากขอคืนเงินภายใน 7 วันหลังชำระและยังไม่ได้ออกเอกสารหลังการชำระนั้น เราคืนเงินเต็มจำนวนและออกใบลดหนี้ให้ นอกจากนั้นไม่คืนเงินสำหรับช่วงที่ชำระแล้ว เว้นแต่กฎหมายกำหนดหรือเราให้บริการไม่ได้</p>

          <H2>เมื่อไม่ได้ชำระต่อ</H2>
          <p>เอกสารของคุณยังเปิดดูและดาวน์โหลดได้ แต่ออกเอกสารใหม่ไม่ได้จนกว่าจะสมัครอีกครั้ง</p>

          <H2>ความพร้อมใช้งาน</H2>
          <p>เราพยายามให้บริการได้ต่อเนื่องและสำรองข้อมูลเป็นประจำ แต่ไม่รับประกันว่าบริการจะไม่หยุดชะงัก ควรดาวน์โหลดเก็บเอกสารสำคัญไว้เองด้วย</p>

          <H2>ความรับผิด</H2>
          <p>ความรับผิดของเราต่อคุณรวมกันไม่เกินค่าบริการที่คุณชำระใน 12 เดือนก่อนเหตุที่เกิดขึ้น เว้นแต่ความเสียหายเกิดจากการกระทำโดยจงใจหรือประมาทเลินเล่ออย่างร้ายแรง หรือกรณีที่กฎหมายไม่อนุญาตให้จำกัดความรับผิด</p>

          <H2>การเปลี่ยนแปลงข้อกำหนด</H2>
          <p>เราจะแจ้งทางอีเมลล่วงหน้าอย่างน้อย 30 วันก่อนการเปลี่ยนแปลงที่สำคัญ</p>

          <H2>กฎหมายที่ใช้บังคับ</H2>
          <p>ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย หากฉบับภาษาไทยและภาษาอังกฤษขัดกัน ให้ใช้ฉบับภาษาไทย</p>

          <H1 id="privacy">นโยบายความเป็นส่วนตัว</H1>
          <p className="text-muted-foreground">ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</p>

          <H2>ผู้ควบคุมข้อมูล</H2>
          <p>{who.name} ที่อยู่ {who.address} ติดต่อเรื่องข้อมูลส่วนบุคคลได้ที่ {mail}</p>

          <H2>ข้อมูลที่เก็บ วัตถุประสงค์ และฐานทางกฎหมาย</H2>
          <List>
            <li>ข้อมูลบัญชี (ชื่อ อีเมล เลขประจำตัวผู้เสียภาษี): เพื่อเปิดและดูแลบัญชี ตามสัญญา</li>
            <li>ข้อมูลกิจการ ที่อยู่ บัญชีธนาคาร ผู้ลงนาม และเอกสารของคุณ: เพื่อจัดทำเอกสาร ตามสัญญา และเก็บรักษาเอกสารภาษีตามที่กฎหมายกำหนด</li>
            <li>ข้อมูลการชำระค่าบริการและใบกำกับภาษีที่เราออกให้คุณ: ตามสัญญาและหน้าที่ตามประมวลรัษฎากร</li>
            <li>ข้อมูลการเข้าใช้งาน (เวลา IP หน้าเว็บที่เปิด ประเภทเบราว์เซอร์): เก็บไม่น้อยกว่า 90 วัน ตาม พ.ร.บ.ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ และเพื่อความปลอดภัย</li>
          </List>

          <H2>ข้อมูลลูกค้าของคุณ</H2>
          <p>สำหรับข้อมูลลูกค้าและผู้รับเงินที่คุณบันทึก คุณเป็นผู้ควบคุมข้อมูล และ Tra เป็นผู้ประมวลผลข้อมูลแทนคุณ เราประมวลผลตามคำสั่งของคุณเพื่อให้บริการเท่านั้น รักษาความลับ ใช้มาตรการความปลอดภัย ช่วยคุณตอบคำขอของเจ้าของข้อมูล แจ้งคุณโดยไม่ชักช้าหากเกิดการละเมิดข้อมูล ใช้ผู้ประมวลผลช่วงตามรายการด้านล่าง และลบหรือคืนข้อมูลเมื่อเลิกใช้บริการ ภายใต้ระยะเวลาเก็บรักษาตามกฎหมาย</p>

          <H2>ผู้ให้บริการที่เราใช้และการส่งข้อมูลไปต่างประเทศ</H2>
          <List>
            <li>Supabase: ฐานข้อมูล ระบบล็อกอิน และไฟล์ ที่สิงคโปร์</li>
            <li>Railway: เครื่องแม่ข่ายของเว็บ ที่สิงคโปร์</li>
            <li>Opn Payments (Omise): รับชำระเงิน ในประเทศไทย</li>
            <li>ระบบ e-Tax Invoice by Email ของ ETDA: เมื่อส่งใบกำกับภาษีทางอีเมล</li>
          </List>
          <p className="mt-2">ข้อมูลถูกจัดเก็บที่สิงคโปร์ เราส่งข้อมูลไปต่างประเทศภายใต้สัญญาประมวลผลข้อมูลของผู้ให้บริการ ซึ่งมีข้อสัญญามาตรฐานและมาตรการคุ้มครองตามประกาศคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลตามมาตรา 29 เราไม่ขายข้อมูลของคุณ</p>

          <H2>ระยะเวลาเก็บรักษา</H2>
          <List>
            <li>เอกสารภาษีที่ออกแล้วและข้อมูลที่เกี่ยวข้อง: 5 ปีนับจากสิ้นปีที่ออก หรือนานกว่าหากกฎหมายกำหนด แม้ปิดบัญชีแล้ว</li>
            <li>ข้อมูลบัญชีอื่น ๆ: ตลอดที่ใช้บริการ และลบภายใน 90 วันหลังปิดบัญชี</li>
            <li>ข้อมูลการเข้าใช้งาน: 1 ปี</li>
          </List>

          <H2>ความปลอดภัยและการละเมิดข้อมูล</H2>
          <p>ข้อมูลเข้ารหัสระหว่างส่ง และแต่ละบัญชีเข้าถึงได้เฉพาะข้อมูลของตนเอง หากเกิดการละเมิดข้อมูล เราจะแจ้งสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคลภายใน 72 ชั่วโมงนับแต่ทราบ และแจ้งผู้ได้รับผลกระทบเมื่อมีความเสี่ยงสูง</p>

          <H2>สิทธิของคุณ</H2>
          <p>คุณมีสิทธิขอเข้าถึงและรับสำเนา ขอให้แก้ไข ลบ ระงับการใช้ คัดค้าน และขอโอนย้ายข้อมูล รวมถึงร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล ดาวน์โหลดข้อมูลของคุณได้เองที่หน้าตั้งค่า หรือติดต่อ {mail} เราตอบกลับภายใน 30 วัน</p>

          <H2>คุกกี้</H2>
          <p>เราใช้เฉพาะคุกกี้ที่จำเป็น สำหรับการล็อกอินและภาษาที่เลือก ไม่ใช้คุกกี้โฆษณาหรือติดตาม</p>
        </>
      ) : (
        <>
          <H1>Terms of service</H1>
          <p className="text-muted-foreground">Last updated {UPDATED.en}</p>

          <H2>Who runs Tra</H2>
          <p>Tra (trasolutions.co) is operated by {who.name}, tax ID {who.taxId}, {who.address}. Contact {mail}.</p>

          <H2>The service</H2>
          <p>Tra lets an individual prepare, issue and deliver quotations, invoices, receipts, tax invoices and related documents. You are responsible for what your documents say, for delivering them, and for your own tax filings. Tra is not an accounting or tax advisory service.</p>

          <H2>Tax invoices and delivery</H2>
          <p>A PDF downloaded from Tra is a copy. The original of a tax invoice has to be delivered on paper, or by e-Tax Invoice by Email if you have registered for it with the Revenue Department. Tra prepares the file and the email, but registering and sending are yours to do. The digital signature in the file is Tra&apos;s seal showing the document hasn&apos;t been changed, not your signature.</p>

          <H2>Who can use it</H2>
          <p>Individuals registered for VAT, such as freelancers and sole proprietors. Company accounts are not offered yet. You must give accurate details and keep your password safe.</p>

          <H2>Free trial and payment</H2>
          <p>
            A new account gets {TRIAL_DAYS} days of Pro free, with no card needed. After that, issuing documents needs a paid plan: {price("pro_year")} a year or {price("pro_month")} a month, plus 7% VAT
            ({total("pro_year")} and {total("pro_month")} in total). A paid period starts when your trial or current period ends. Plans don&apos;t renew by themselves. Payments are processed by
            Opn Payments (Omise); Tra never sees your card number. We issue a receipt/tax invoice for every payment and deliver the original by e-Tax Invoice by Email.
          </p>

          <H2>Cancelling and refunds</H2>
          <p>You can stop at any time; plans don&apos;t renew. If you ask within 7 days of paying and haven&apos;t issued a document since that payment, we refund it in full and issue a credit note. Otherwise paid periods aren&apos;t refunded, unless the law requires it or we can&apos;t provide the service.</p>

          <H2>If you stop paying</H2>
          <p>Your documents stay available to view and download. You can&apos;t issue new documents until you subscribe again.</p>

          <H2>Availability</H2>
          <p>We work to keep Tra running and back it up regularly, but can&apos;t promise it will never be interrupted. Keep your own copies of important documents.</p>

          <H2>Liability</H2>
          <p>Our total liability to you is limited to the fees you paid in the 12 months before the event, except for damage caused intentionally or by gross negligence, or where the law does not allow liability to be limited.</p>

          <H2>Changes</H2>
          <p>We will email you at least 30 days before any significant change to these terms.</p>

          <H2>Governing law</H2>
          <p>These terms are governed by Thai law. If the Thai and English versions differ, the Thai version applies.</p>

          <H1 id="privacy">Privacy notice</H1>
          <p className="text-muted-foreground">Under the Personal Data Protection Act B.E. 2562 (PDPA).</p>

          <H2>Data controller</H2>
          <p>{who.name}, {who.address}. Contact {mail} about personal data.</p>

          <H2>What we collect, why, and on what basis</H2>
          <List>
            <li>Account details (name, email, tax ID): to open and run your account, under our contract with you.</li>
            <li>Your business profile, address, bank details, signatories and documents: to make your documents, under our contract, and to keep tax documents as the law requires.</li>
            <li>Payment records and the tax invoices we issue to you: under our contract and the Revenue Code.</li>
            <li>Access records (time, IP address, pages opened, browser type): kept for at least 90 days as the Computer Crime Act requires, and for security.</li>
          </List>

          <H2>Your clients&apos; data</H2>
          <p>For the clients and payees you record, you are the data controller and Tra processes the data on your behalf. We use it only on your instructions to provide the service, keep it confidential, protect it, help you answer requests from the people concerned, tell you without delay about any breach, use only the sub-processors listed below, and delete or return it when you leave, subject to the legal retention periods.</p>

          <H2>Who we use, and transfers abroad</H2>
          <List>
            <li>Supabase: database, sign-in and files, in Singapore.</li>
            <li>Railway: web servers, in Singapore.</li>
            <li>Opn Payments (Omise): payments, in Thailand.</li>
            <li>ETDA&apos;s e-Tax Invoice by Email service: when a tax invoice is sent by email.</li>
          </List>
          <p className="mt-2">Data is stored in Singapore. We transfer it under the providers&apos; data processing agreements, which include standard contractual clauses and safeguards under the PDPC notification for section 29. We do not sell your data.</p>

          <H2>How long we keep it</H2>
          <List>
            <li>Issued tax documents and the records behind them: 5 years from the end of the year they were issued in, or longer if the law requires, even after the account is closed.</li>
            <li>Other account data: while you use Tra, and deleted within 90 days after you close your account.</li>
            <li>Access records: 1 year.</li>
          </List>

          <H2>Security and breaches</H2>
          <p>Data is encrypted in transit and each account can reach only its own data. If a breach happens, we notify the Personal Data Protection Committee office within 72 hours of learning of it, and the people affected where the risk is high.</p>

          <H2>Your rights</H2>
          <p>You can ask to access and get a copy of your data, to correct, delete or restrict it, to object, and to move it elsewhere, and you can complain to the Personal Data Protection Committee office. Download your data yourself in Settings, or contact {mail}. We reply within 30 days.</p>

          <H2>Cookies</H2>
          <p>Only the cookies Tra needs: for signing in and your chosen language. No advertising or tracking cookies.</p>
        </>
      )}

      <p className="mt-10"><Link href="/register" className="text-cobalt underline">{locale === "th" ? "กลับไปสมัครใช้งาน" : "Back to registration"}</Link></p>
    </main>
  );
}
