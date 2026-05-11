import Nav from '@/components/nav/Nav';
import Hero from '@/components/surface/Hero';
import SkillsTrinity from '@/components/surface/SkillsTrinity';
import TechReveal from '@/components/transition/TechReveal';
import TransparentArchitectChat from '@/components/engineering/TransparentArchitectChat';
import { parseTokenUsage } from '@/lib/parseTokenUsage';

export default function Page() {
  const layers = parseTokenUsage();

  return (
    <>
      <Nav />
      <Hero />
      <SkillsTrinity />
      <TechReveal layers={layers} />
      <TransparentArchitectChat />
    </>
  );
}
