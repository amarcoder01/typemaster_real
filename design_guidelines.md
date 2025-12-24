# TypeMasterAI Design Guidelines

## Design Approach
**System-Based with Custom Elements**: Drawing from Linear's refined dark interfaces, VSCode's code editor clarity, and Figma's tool-focused design. The platform prioritizes efficiency and accessibility while maintaining professional polish.

**Core Principles**:
- Readability-first typography for extended typing sessions
- Clear visual hierarchy in lesson content
- Minimal cognitive load during practice
- Professional credibility through restraint

---

## Typography System

**Font Stack**:
- Primary: Inter (Google Fonts) - UI, navigation, metrics
- Monospace: JetBrains Mono - typing content, code samples, dictation text

**Hierarchy**:
- Hero Headline: 3xl-4xl, font-bold, tracking-tight
- Section Titles: 2xl-3xl, font-semibold
- Typing Content: xl-2xl monospace, leading-relaxed (critical for readability)
- Body Text: base-lg, leading-relaxed
- Metrics/Stats: sm-base, font-medium, tabular-nums

---

## Layout System

**Spacing Primitives**: Use Tailwind units of 3, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm.

**Grid Strategy**:
- Main practice area: Full-width with max-w-4xl centered container
- Dashboard stats: 3-column grid (lg:grid-cols-3) for metrics
- Lesson cards: 2-column on desktop (lg:grid-cols-2), single on mobile
- Settings/profile: 2-column split layout (60/40)

**Container Widths**:
- Hero/Full sections: w-full with max-w-7xl inner
- Practice interface: max-w-5xl (optimal for typing content)
- Text content: max-w-prose

---

## Component Library

**Navigation**: 
Top navbar with logo left, practice mode switcher center (toggle: Typing/Dictation), user profile/settings right. Height: h-16, backdrop-blur with border-b.

**Hero Section (Homepage)**:
Large hero image showing hands on keyboard in professional setting, overlaid with translucent dark gradient. Headline + tagline + dual CTAs ("Start Free Trial" gold, "View Demo" outline). Height: 85vh on desktop.

**Practice Interface**:
- Dictation Display: Monospace text box with word highlighting, current word in gold
- Input Area: Large monospace textarea, character-by-character validation (correct/incorrect styling)
- Stats Bar: Fixed bottom panel with WPM, accuracy, time, mistakes (4-column grid)
- Progress Indicator: Linear progress bar at top edge

**Lesson Cards**: 
Rounded corners (rounded-lg), hover lift effect (subtle), contains: difficulty badge, title, description, duration estimate, completion checkmark, "Start" button.

**Dashboard Widgets**:
- Performance Graph: Line chart with gold accent
- Recent Activity: List with timestamps
- Achievements: Badge grid with unlock states
- Streak Counter: Large numeral with flame icon

**Settings Panel**:
Tabbed interface (General, Audio, Display, Keyboard), form inputs with clear labels, toggle switches for boolean options.

---

## Images

**Hero Image**: Professional workspace shot featuring modern keyboard, warm lighting, shallow depth of field. Dimensions: 1920x1080. Placement: Full-width hero background with 50% opacity dark overlay.

**Feature Section Images**: Illustrative screenshots of typing interface and dictation mode in action (1200x800 each), placed as 2-column grid below hero.

**Testimonial Avatars**: Circular headshots (128x128) for social proof section.

---

## Accessibility Implementation

- All interactive elements: min 44x44px touch targets
- Focus states: 2px gold outline (outline-offset-2)
- Form labels: Always visible, positioned above inputs
- Alt text: Descriptive for all images
- Keyboard shortcuts: Display hints in tooltips
- Text contrast: Minimum WCAG AA on all dark backgrounds
- Skip navigation: Hidden link to main content

---

## Page Structure

**Homepage**: Hero with image (85vh) → 3-column feature grid → Stats showcase (4 metrics) → Dictation mode highlight with demo screenshot → Testimonials (3-column) → Pricing table → CTA section → Footer with links/social.

**Practice Page**: Full-screen immersive interface with minimal chrome, focus on typing area and real-time feedback.

**Dashboard**: Sidebar navigation (fixed left, w-64) + main content area with metric cards grid and activity feed.

---

## Animation Guidelines

**Sparingly Applied**:
- Typing feedback: Instant color flash on correct/incorrect (no animation)
- Card hovers: Subtle translateY(-4px) over 200ms
- Page transitions: Simple fade (150ms)
- Progress bars: Smooth width transitions (300ms ease-out)
- NO scroll-triggered animations, parallax, or complex sequences

---

## Buttons on Images

All CTAs overlaid on hero image use `backdrop-blur-md` with `bg-black/30` background. Primary button adds gold border and text. No hover background changes—rely on native button component hover states (likely scale/brightness).