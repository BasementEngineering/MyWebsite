import fs from 'fs';
import path from 'path';

export type LayerData = {
  session: string;
  label: string;
  aiProvider: string;
  durationMinutes: number;
  tokens: number;
};

export function parseTokenUsage(): LayerData[] {
  const filePath = path.join(process.cwd(), 'TokenUsage.txt');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.trim().split('\n').slice(1); // skip header

  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        session:         parts[0],
        label:           parts[1],
        aiProvider:      parts[2],
        durationMinutes: parseInt(parts[3], 10),
        tokens:          parseInt(parts[4], 10),
      };
    });
}
