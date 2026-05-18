import type { Metadata } from 'next';
import Nav from '@/components/nav/Nav';
import SpeakerPage from '@/components/surface/SpeakerPage';

export const metadata: Metadata = {
  title: 'Speaker & Workshops — Jan Kettler',
  description: 'Vorträge und Workshops zum pragmatischen KI-Einsatz in der Industrie. Science Slam, Keynotes und praxisnahe Team-Workshops.',
};

export default function SpeakerRoute() {
  return (
    <>
      <Nav />
      <SpeakerPage />
    </>
  );
}
