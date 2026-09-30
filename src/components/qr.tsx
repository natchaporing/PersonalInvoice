import qrcode from "qrcode-generator";

/** A QR code as one SVG path (vector, so it stays sharp in the PDF). Error correction M. */
export function Qr({ value, size = 64, color = "#1a2536", label }: { value: string; size?: number; color?: string; label: string }) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  }
  const quiet = 2; // modules of blank border, which scanners need
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox={`${-quiet} ${-quiet} ${n + quiet * 2} ${n + quiet * 2}`} shapeRendering="crispEdges">
      <rect x={-quiet} y={-quiet} width={n + quiet * 2} height={n + quiet * 2} fill="#fff" />
      <path d={d} fill={color} />
    </svg>
  );
}
