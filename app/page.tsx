import Nav from '@/components/nav/Nav';
import Hero from '@/components/surface/Hero';
import SpeakerSection from '@/components/surface/SpeakerSection';
import NeuralExplode from '@/components/transition/NeuralExplode';
import EngineeringSection from '@/components/engineering/EngineeringSection';

export default function Page() {
  return (
    <>
      <Nav />
      <Hero />
      <SpeakerSection />
      <NeuralExplode />
      <EngineeringSection />
    </>
  );
}
