# Accessibility review

Reviewed on 2026-11-06 against the production build. This is a verification record, not a WCAG conformance certification.

## Implemented

- A skip link that moves keyboard focus to the main content.
- Named native experience disclosures with company links in their expanded content, outside the disclosure controls.
- Keyboard access to the horizontally scrolling code panel, with a visible focus indicator.
- Focus outlines for links and forced-colors outlines for disclosures; scroll margins accommodate the sticky header.
- Readable navigation suffixes and code line numbers.
- A native **Pause animations** checkbox in the footer, reachable through the keyboard-only **Animation controls** link.
  It pauses CSS animations and disables transitions and smooth scrolling without shipping JavaScript.
- Reduced-motion preferences disable animations, transitions, and smooth scrolling. The redundant pause control is hidden in this mode.
- The floating WhatsApp link is inside the footer landmark and uses a native tooltip instead of an overlapping custom tooltip.

## Verification

- Production build and HTML structure validation passed. Following stylesheet extraction, the HTML validation reports only
  informational notices about trailing slashes on void elements. Validating the CSS separately may still flag modern Tailwind
  syntax unsupported by the CSS validator; extraction does not change the CSS language features in use.
- axe-core 4.14.0: WCAG 2 A/AA, 2.1 AA, 2.2 AA, and best-practice checks. All nine experience entries were tested open at both
  320px and 1280px viewport widths (18 scans). No actionable automated violations remained after reviewing the decorative
  contrast exceptions below. The default page was also scanned at 390px.
- Browser-driven keyboard checks covered the skip link, horizontal scrolling, Enter/Space disclosure activation, exclusive
  expansion, and pause/resume. Chromium's accessibility tree exposed nine named disclosure controls.
- Forced-colors emulation confirmed visible disclosure focus outlines. Reduced-motion emulation confirmed no running animations
  and no smooth scrolling.
- Text-spacing overrides (1.5 line height, 0.12em letter spacing, 0.16em word spacing, and 2em paragraph spacing) introduced no
  document-level horizontal overflow at 320px and 1280px. The code panel intentionally scrolls horizontally.
- Mobile screenshots and the updated footer were visually inspected.

## Reviewed exceptions and remaining manual checks

The two oversized, faint degree watermarks are decorative duplicates of readable degree information. They are marked
`aria-hidden="true"` and are not the source of any information. axe reports their low contrast; this is an intentional
decorative-text exception, not an exemption for the actual degree labels. No accessibility rules are disabled in the site.

axe also leaves some contrast checks for manual review where backgrounds or overlays prevent reliable measurement.
Automated checks cannot prove full accessibility. Real NVDA/Firefox and VoiceOver/Safari testing, browser zoom checks, and
review by people using assistive technology remain appropriate before claiming conformance. In particular, browsers differ
in whether headings inside native summaries appear in screen-reader heading navigation; the named disclosure controls remain
the primary way to navigate and operate those entries.
