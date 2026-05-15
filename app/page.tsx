import Nav from '@/components/nav/Nav';
import Hero from '@/components/surface/Hero';
import SkillsTrinity from '@/components/surface/SkillsTrinity';
import TechReveal from '@/components/transition/TechReveal';
import TransparentArchitectChat from '@/components/engineering/TransparentArchitectChat';
import KontaktSection from '@/components/surface/KontaktSection';

export default function Page() {
  return (
    <>
      <Nav />
      <Hero />
      <SkillsTrinity />
      <TechReveal />

      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-sans font-light text-gray-900 text-4xl md:text-6xl text-center mb-16">
            Bei Fragen, fragen Sie meine KI.
          </h2>
          <TransparentArchitectChat />
        </div>
      </section>

      <KontaktSection />
    </>
  );
}
