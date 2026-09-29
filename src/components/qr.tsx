import QRCode from "qrcode";

/** Synchronous SVG QR (no effect/state needed). Quiet zone of 2 modules is included in the viewBox. */
export function QrSvg({ value, size = 160, label }: { value: string; size?: number; label: string }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = modules.size;
  const q = 2;
  const cells: string[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) if (modules.get(x, y)) cells.push(`M${x + q} ${y + q}h1v1h-1z`);
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${n + q * 2} ${n + q * 2}`} shapeRendering="crispEdges" className="mx-auto rounded bg-white">
      <path d={cells.join("")} fill="#000" />
    </svg>
  );
}
