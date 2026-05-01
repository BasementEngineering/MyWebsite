import fs from 'fs';
import path from 'path';

export type LayerData = {
  session: string;
  label: string;
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
      const [session, label, durationMinutes, tokens] = line.split(',');
      return {
        session: session.trim(),
        label: label.trim(),
        durationMinutes: parseInt(durationMinutes.trim(), 10),
        tokens: parseInt(tokens.trim(), 10),
      };
    });
}
