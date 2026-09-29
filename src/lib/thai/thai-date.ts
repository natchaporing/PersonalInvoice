const TH_MONTHS = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const toBuddhistYear = (ceYear: number) => ceYear + 543;

/** Accepts "YYYY-MM-DD" (kept timezone-free). */
function parts(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`Bad date: ${iso}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function formatDateTH(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${TH_MONTHS[m - 1]} พ.ศ. ${toBuddhistYear(y)}`;
}

export function formatDateEN(iso: string): string {
  const { y, m, d } = parts(iso);
  return `${d} ${EN_MONTHS[m - 1]} ${y}`;
}
