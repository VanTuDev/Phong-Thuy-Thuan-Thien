function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRID = 21;
const FINDER = 7;

function isFinderZone(row: number, col: number) {
  const inTopLeft = row < FINDER && col < FINDER;
  const inTopRight = row < FINDER && col >= GRID - FINDER;
  const inBottomLeft = row >= GRID - FINDER && col < FINDER;
  return inTopLeft || inTopRight || inBottomLeft;
}

function FinderMarker({ x, y, cell }: { x: number; y: number; cell: number }) {
  return (
    <g>
      <rect x={x} y={y} width={cell * 7} height={cell * 7} fill="#000000" />
      <rect x={x + cell} y={y + cell} width={cell * 5} height={cell * 5} fill="#ffffff" />
      <rect x={x + cell * 2} y={y + cell * 2} width={cell * 3} height={cell * 3} fill="#000000" />
    </g>
  );
}

/** Ảnh QR minh họa (không phải VietQR thật) — sinh mẫu lưới xác định từ `seedText` để mock luồng thanh toán. */
export default function QrCode({ seedText, size = 220 }: { seedText: string; size?: number }) {
  const cell = size / GRID;
  const rand = mulberry32(hashSeed(seedText));
  const modules: boolean[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      modules.push(!isFinderZone(row, col) && rand() > 0.55);
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Mã QR thanh toán minh họa">
        <rect width={size} height={size} fill="#ffffff" />
        {modules.map((on, i) => {
          if (!on) return null;
          const row = Math.floor(i / GRID);
          const col = i % GRID;
          return (
            <rect
              key={i}
              x={col * cell}
              y={row * cell}
              width={cell}
              height={cell}
              fill="#0A0A0A"
            />
          );
        })}
        <FinderMarker x={0} y={0} cell={cell} />
        <FinderMarker x={size - cell * 7} y={0} cell={cell} />
        <FinderMarker x={0} y={size - cell * 7} cell={cell} />
      </svg>
    </div>
  );
}
