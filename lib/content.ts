export const content = {
  meta: {
    title: 'Jan Kettler',
    description: 'Legacy-Systeme. Moderne Intelligenz. Echter Mehrwert.',
  },
  nav: {
    name: 'Jan Kettler',
    links: [
      { label: 'Kontakt', href: '#kontakt' },
    ],
  },
  kontakt: {
    intro: 'Oder kontaktieren Sie mich persönlich.',
    email: 'contact@jankettler.info',
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jan-kettler-a4047b282/' },
      { label: 'GitHub', href: 'https://github.com/BasementEngineering' },
      { label: 'Instructables', href: 'https://www.instructables.com/member/Basement%20Engineering/' },
    ],
  },
  hero: {
    eyebrow: 'Jan Kettler',
    headline: ['Echte Systeme.', 'Moderne Intelligenz.', 'Realer Impact.'],
    subheadline:
      'Ich bringe KI dorthin, wo sie gebraucht wird – mit Ingenieursverstand, ohne Buzzword-Bingo und mit dem Blick für das Risiko.',
  },
  trinity: {
    intro: 'Ich bin',
    pillars: [
      {
        label: 'System Ingenieur',
        body: 'Ich habe einen klassichen Ingenieurs-Hintergrund in der Elektrotechnik und Informatik. Dadurch verfüge ich über ein umfangreiches Fachwissen von Hardware-Prototyping zu komplexe Software-Systeme. Ich denke in stabilen Strukturen statt in kurzlebigen Hypes.',
        images: [
          '/images/Engineer/Hackathon.jpg',
          '/images/Engineer/MINT_Schiffbau13.JPG',
        ],
      },
      {
        label: 'Pragmatischer KI Experte',
        body: 'Seit dem Erscheinen der ersten großen LLMs experimentiere ich mit verschiedenen Ansätzen KI einzusetzen. Mein Fokus liegt auf der praktischen Implementierung: Wie machen wir KI für Teams nutzbar, sicher und ökonomisch sinnvoll? Ich evaluiere den State-of-the-Art und baue daraus Werkzeuge mit Substanz.',
        images: [
          '/images/Ai Expert/SystemDrawing.jpg',
          '/images/Ai Expert/MailSystem.jpg',
          '/images/Engineer/P1010869.jpg'
        ],
      },
      {
        label: 'Kommunikator',
        body: 'Komplexität verständlich zu machen ist ein wichtiger Bestandteil bei der Entwicklung und Einführung neuer Lösungen. Als erfahrener Science Slammer und Startup Pitcher, übersetze ich Deep-Tech in klare Visionen – für Entscheider, Fachabteilungen oder das große Publikum.',
        images: [
          '/images/Speaker/_DSC2142.jpg',
          '/images/Speaker/PitchSCH.jpg',
          '/images/Speaker/PitchHackathon.jpg',
        ],
        cta: { label: 'Mich buchen', href: '/speaker' },
      },
    ],
  },
  speakerOfferings: {
    intro: 'Was ich anbiete',
    pillars: [
      {
        label: 'Science Slam',
        body: '10 Minuten, ein Thema aus der Forschung und vielfältiges Publikum. Ich rede unter dem Thema "Anonymisierung und Datenschutz in der Verkehrsforschung" über die Herausforderungen und Lösungen bei der Nutzung von Mobilitätsdaten – mit Humor, anschaulichen Beispielen und einem klaren Blick auf die Realität.',
        images: [],
        tags: ['Talk'],
      },
      {
        label: 'Mobilitätsdaten für smarte Städte',
        body: 'Bessere Städte brauchen bessere Daten, denn damit lassen sich Mehrwerte schaffen. Diese Erfahrung habe ich sowohl in meiner Arbeit mit Kunden für mein Startup TransitSense als auch in meiner Forschungstätigkeit gemacht. Ich würde mich freuen mehr Städten, Kommunen und Verkehrsbetrieben zu zeigen, wie sie Daten gewinnen und effektiv nutzen können und das bei Wahrung der DSGVO.',
        images: [],
        tags: ['Talk', 'Workshop'],
      },
      {
        label: 'KI in der Praxis',
        body: 'Was kann KI heute wirklich leisten, und wo hört es auf? Wie blickt man an Hype vorbei und implementiert nachhaltige Lösungen? Und was sind dabei typische Hindernisse? Ich gebe einen ehrlichen Überblick und zeige konkrete Ansätze für Ihre Problemstellungen.',
        images: [],
        tags: ['Talk', 'Workshop'],
      },
    ],
  },
  speaker: {
    eyebrow: 'Öffentliche Auftritte',
    headline: 'Substanz statt Hype.',
    subheadline: 'Wissenschaft auf der Bühne.',
    cards: [
      {
        icon: 'Mic2' as const,
        title: 'Keynotes',
        description:
          'Klarer Blick auf KI, Datensicherheit und digitale Transformation – ohne Buzzwords, ohne Marketingsprache.',
      },
      {
        icon: 'FlaskConical' as const,
        title: 'Science Slam',
        description:
          'Komplexe Systeme verständlich machen – für Fachpublikum und Einsteiger gleichermaßen.',
      },
      {
        icon: 'Cpu' as const,
        title: 'KI-Visionär',
        description:
          'Von der Forschung in die Praxis: wie KI heute schon echten Mehrwert schafft – und wo die Grenzen liegen.',
      },
    ],
  },
  transition: {
    eyebrow: 'Unter der Oberfläche',
    components: [
      { label: 'Safety Layer' },
      { label: 'Compliance' },
      { label: 'ML Core' },
      { label: 'Legacy API' },
      { label: 'Sensorik' },
      { label: 'Event Bus' },
    ],
  },
  engineering: {
    eyebrow: '// Engineering Layer',
    headline: ['Klug bewegen und', 'nachhaltig bauen.'],
    subheadline: 'Sicherheit ist keine Option – sie ist das Fundament.',
    projects: [
      {
        id: 'mobility',
        label: '01',
        title: 'Mobilitätsdaten-Analyse',
        description:
          'Echtzeit-Analyse von Verkehrsströmen und Mobilitätsmustern in urbanen Räumen.',
        tags: ['Python', 'Kafka', 'ClickHouse'],
        hasLiveData: true,
      },
      {
        id: 'eengineering',
        label: '02',
        title: 'E-Engineering',
        description:
          'Entwicklung embedded Systeme für elektrische Antriebsstränge und Ladeinfrastruktur.',
        tags: ['C++', 'AUTOSAR', 'CAN-Bus'],
        hasLiveData: false,
      },
      {
        id: 'rapid-proto',
        label: '03',
        title: 'Rapid Prototyping',
        description:
          'Von der Idee zum Prototyp in Tagen statt Monaten – 3D-Design und iterative Fertigung.',
        tags: ['CAD', 'FDM', 'SLA'],
        hasLiveData: false,
      },
    ],
  },
};
