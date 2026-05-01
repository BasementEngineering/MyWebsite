'use client';

import { useEffect, useState } from 'react';

type Row = { label: string; value: string; unit: string };

function generate(): Row[] {
  const r = (min: number, max: number) =>
    (Math.random() * (max - min) + min).toFixed(0);
  return [
    { label: 'Fahrzeuge/Min', value: r(42, 87), unit: 'veh' },
    { label: 'Ø Geschwindigkeit', value: r(28, 65), unit: 'km/h' },
    { label: 'Auslastung', value: r(61, 94), unit: '%' },
    { label: 'Ereignisse', value: r(2, 14), unit: 'evt' },
  ];
}

export default function LiveDataWidget() {
  const [rows, setRows] = useState<Row[]>(generate);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setRows(generate());
      setBlink((b) => !b);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border border-black/15 p-4 font-mono text-xs mb-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] tracking-widest uppercase text-black/30">
          // simulierte echtzeit-daten
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full bg-green-700 transition-opacity duration-500"
          style={{ opacity: blink ? 1 : 0.2 }}
        />
      </div>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-black/[0.07] last:border-0">
              <td className="py-1.5 text-black/40">{row.label}</td>
              <td className="py-1.5 text-right tabular-nums font-medium text-gray-800">
                {row.value}
              </td>
              <td className="py-1.5 pl-2 text-black/30 w-10">{row.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
