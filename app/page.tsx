import Nav from '@/components/nav/Nav';
import Hero from '@/components/surface/Hero';
import TechReveal from '@/components/transition/TechReveal';
import EngineeringSection from '@/components/engineering/EngineeringSection';
import { parseTokenUsage } from '@/lib/parseTokenUsage';

export default function Page() {
  const layers = parseTokenUsage();

  return (
    <>
      <Nav />
      <Hero />
      <TechReveal layers={layers} />
      <EngineeringSection />
    </>
  );
}
