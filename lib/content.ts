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
        body: 'Ein System ist erst dann gut, wenn es die Realität überlebt. Ich verbinde Elektro- und Informationstechnik zu robusten Architekturen. Ob 3D-Design, Hardware-Prototyping oder komplexe Software-Systeme: Ich denke in stabilen Strukturen statt in kurzlebigen Hypes.',
        images: [
          '/images/Engineer/P1010869.jpg',
          '/images/Engineer/Hackathon.jpg',
          '/images/Engineer/MINT_Schiffbau13.JPG',
        ],
      },
      {
        label: 'Pragmatischer KI Experte',
        body: 'Ich bringe die neuesten Sprach- und Machine-Learning-Modelle aus der Theorie in die Produktion. Mein Fokus liegt auf der praktischen Implementierung: Wie machen wir KI für Teams nutzbar, sicher und ökonomisch sinnvoll? Ich evaluiere den State-of-the-Art und baue daraus Werkzeuge mit Substanz.',
        images: [],
      },
      {
        label: 'Kommunikator',
        body: 'Wahre Expertise beweist sich darin, Komplexität verständlich zu machen. Als erfahrener Science Slammer und Speaker übersetze ich Deep-Tech in klare Visionen – für Entscheider, Fachabteilungen oder das große Publikum.',
        images: [
          '/images/Speaker/_DSC2142.jpg',
          '/images/Speaker/PitchSCH.jpg',
          '/images/Speaker/PitchHackathon.jpg',
        ],
        cta: { label: 'Mich buchen', href: 'mailto:contact@jankettler.info' },
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
