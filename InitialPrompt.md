Initialize a high-end personal branding website for "Jan Kettler". 
The site must represent a dual identity: a polished "Public Speaker" and a deep "Systems Architect/Engineer".

TECH STACK:
- Next.js (App Router), Tailwind CSS, Framer Motion, Lucide React.

DESIGN CONCEPT:
1. "The Surface" (Above the fold): Minimalist, polished, high-end agency look. White/Dark Grey. Content: Keynotes, Science Slam, AI Visionary.
2. "The Transition": As the user scrolls, implement an "Exploded View" animation using Framer Motion. A central geometric object (representing an AI System) should break apart into labeled technical components (e.g., "Safety Layer", "Legacy API", "Data Privacy").
3. "The Engineering Layer" (Below the fold): Change the entire theme to an "Architectural Parchment" style. 
   - Background: #f2f0e9 with a subtle 24px dot-grid.
   - UI: Wireframe-style boxes, 1px borders, monospace fonts (JetBrains Mono).
   - Content: Mobility Data Analytics, E-Engineering, Rapid Prototyping (3D Design).

SPECIFIC FEATURES TO IMPLEMENT:
- Implement a scroll-triggered background color shift from white to #f2f0e9.
- Use Framer Motion 'useScroll' and 'useTransform' for the Exploded View.
- Create a "Live Data" component placeholder in the Engineering section (simulating real-time mobility data).
- Typography: Use a clean Sans-serif for the top and a Monospace font for the bottom.

CONTENT STRUCTURE:
- Hero: "Jan Kettler - Legacy Systems. Modern Intelligence. Real Impact."
- Speaker Section: "Substance over Hype. Bringing Science to the Stage."
- Engineering Section: "Move Smart and Build to Last. Security is not an option, it's the foundation."

Please start by setting up the project structure and the main layout.tsx with the scroll-provider for the theme switch.