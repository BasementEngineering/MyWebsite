import type { Metadata } from 'next';
import Nav from '@/components/nav/Nav';
import ProjekteView from '@/components/projekte/ProjekteView';
import { parseTokenUsage } from '@/lib/parseTokenUsage';

export const metadata: Metadata = {
  title: 'Projekte — Jan Kettler',
  description: 'Wie jankettler.info entstand — transparent von der Idee bis zum Deployment.',
};

export default function ProjektePage() {
  const layers = parseTokenUsage();
  return (
    <>
      <Nav />
      <ProjekteView layers={layers} />
    </>
  );
}
