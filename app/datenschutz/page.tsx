import Nav from '@/components/nav/Nav';
import Link from 'next/link';

export const metadata = { title: 'Datenschutz – Jan Kettler' };

export default function DatenschutzPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto">
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-gray-400 mb-6">
            // Datenschutz
          </p>
          <h1 className="font-sans font-light text-4xl text-gray-900 mb-16">
            Datenschutzerklärung
          </h1>

          <section className="mb-12">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
              1. Verantwortlicher
            </h2>
            <p className="font-sans text-gray-700 leading-relaxed">
              Jan Kettler, Osnabrück<br />
              E-Mail:{' '}
              <a href="mailto:contact@jankettler.info" className="text-gray-900 hover:underline">
                contact@jankettler.info
              </a>
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
              2. Hosting & Server-Logs
            </h2>
            <p className="font-sans text-gray-700 leading-relaxed">
              Diese Website wird auf einem eigenen Server in Europa betrieben. Beim Aufruf
              der Website werden technisch notwendige Server-Logs (IP-Adresse, Zeitstempel,
              aufgerufene Seite, Browser-Typ) für maximal 7 Tage gespeichert.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an
              Betriebssicherheit).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
              3. Chatbot & KI-Verarbeitung
            </h2>
            <p className="font-sans text-gray-700 leading-relaxed mb-4">
              Diese Website enthält einen KI-gestützten Chatbot. Nachrichten, die du an den
              Chatbot sendest, werden zur Verarbeitung an folgende Drittanbieter weitergeleitet:
            </p>
            <ul className="font-sans text-gray-700 leading-relaxed list-none space-y-3 mb-4">
              <li className="pl-4 border-l border-gray-200">
                <strong className="font-medium text-gray-900">Mistral AI</strong> (Mistral AI SAS,
                15 rue des Halles, 75001 Paris, Frankreich) — Sprachmodell-Inferenz.
                Datenschutz: <a href="https://mistral.ai/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline">mistral.ai/privacy</a>
              </li>
              <li className="pl-4 border-l border-gray-200">
                <strong className="font-medium text-gray-900">Microsoft Azure AI Search</strong> (Microsoft Ireland Operations Ltd.,
                One Microsoft Place, Dublin, Irland) — Wissensabruf aus einer lokalen Dokumentenbasis.
                Datenschutz: <a href="https://privacy.microsoft.com" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline">privacy.microsoft.com</a>
              </li>
            </ul>
            <p className="font-sans text-gray-700 leading-relaxed">
              Nachrichten werden nicht dauerhaft gespeichert. Die Verarbeitung erfolgt
              ausschließlich zur Beantwortung deiner Anfrage. Rechtsgrundlage: Art. 6
              Abs. 1 lit. a DSGVO (Einwilligung, erteilt durch das Absenden der Nachricht
              nach Kenntnisnahme dieses Hinweises).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
              4. Cookies & Tracking
            </h2>
            <p className="font-sans text-gray-700 leading-relaxed">
              Diese Website verwendet keine Analyse- oder Tracking-Cookies und setzt keine
              Cookies von Drittanbietern. Technisch notwendige Session-Daten verbleiben
              ausschließlich im Arbeitsspeicher deines Browsers.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="font-sans text-xs tracking-[0.2em] uppercase text-gray-400 mb-4">
              5. Deine Rechte
            </h2>
            <p className="font-sans text-gray-700 leading-relaxed">
              Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der
              Verarbeitung deiner Daten sowie das Recht auf Datenübertragbarkeit und
              Widerspruch (Art. 15–21 DSGVO). Anfragen richte bitte an:{' '}
              <a href="mailto:contact@jankettler.info" className="text-gray-900 hover:underline">
                contact@jankettler.info
              </a>. Du hast außerdem das Recht, dich bei einer Datenschutzaufsichtsbehörde
              zu beschweren.
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
