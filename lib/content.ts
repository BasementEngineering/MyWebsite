export const content = {
  meta: {
    title: 'Jan Kettler',
    description: 'Legacy-Systeme. Moderne Intelligenz. Echter Mehrwert.',
  },
  nav: {
    name: 'Jan Kettler',
    links: [
      { label: 'Vorträge', href: '#vortraege' },
      { label: 'Projekte', href: '/projekte' },
      { label: 'Kontakt', href: '#kontakt' },
    ],
  },
  hero: {
    eyebrow: 'Jan Kettler',
    headline: ['Legacy-Systeme.', 'Moderne Intelligenz.', 'Echter Mehrwert.'],
    cta: [
      { label: 'Vorträge', href: '#vortraege' },
      { label: 'Projekte', href: '/projekte' },
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
