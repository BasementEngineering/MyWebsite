import Nav from '@/components/nav/Nav';
import Link from 'next/link';

export const metadata = { title: 'Impressum – Jan Kettler' };

export default function ImpressumPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-gray-400 mb-6">
            // Impressum
          </p>
          <h1 className="font-sans font-light text-4xl text-gray-900 mb-16">
            Impressum
          </h1>

          <section className="mb-10">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
              Angaben gemäß § 5 TMG
            </h2>
            <p className="font-sans text-gray-700 leading-relaxed">
              Jan Kettler<br />
              Osnabrück, Deutschland
            </p>
          </section>

          <section className="mb-10">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
              Kontakt
            </h2>
            <p className="font-sans text-gray-700 leading-relaxed">
              E-Mail:{' '}
              <a
                href="mailto:contact@jankettler.info"
                className="text-gray-900 hover:underline"
              >
                contact@jankettler.info
              </a>
            </p>
          </section>

          <section className="mb-16">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
              Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)
            </h2>
            <p className="font-sans text-gray-700 leading-relaxed">
              Jan Kettler, Osnabrück
            </p>
          </section>

          <Link
            href="/"
            className="font-mono text-xs tracking-[0.15em] uppercase text-gray-400 hover:text-gray-900 transition-colors duration-200"
          >
            ← Zurück zur Startseite
          </Link>
        </div>
      </main>
    </>
  );
}
