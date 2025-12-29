# TypeMasterAI Design Guidelines v2.0

## Design Approach
**Hybrid System**: Core app draws from Linear's refined interfaces and VSCode clarity. Stress Test mode transforms into a gaming-inspired "cyber arena" with neon aesthetics, glassmorphism, and dynamic intensity. Dual personality: professional practice tool + exhilarating speed challenge.

**Core Principles**:
- Readability-first for standard practice
- High-energy visual feedback for Stress Test
- Clear mode distinction through visual treatment
- Accessibility maintained across all intensity levels

---

## Typography System

**Font Stack**:
- Primary: Inter (Google Fonts) - UI, navigation, metrics
- Monospace: JetBrains Mono - typing content, larger sizing for Stress Test (2xl-3xl)

**Hierarchy**:
- Hero Headlines: 4xl-5xl, font-bold, tracking-tight, neon text-shadow on Stress Test pages
- Mode Titles: 3xl, font-bold, gradient text treatment for Stress Test
- Typing Content: xl-3xl monospace (larger in Stress Test for intensity), leading-relaxed
- Stats/Metrics: base-lg, font-mono, tabular-nums, glowing on Stress Test
- Body: base-lg, leading-relaxed

---

## Color & Visual Treatment

**Standard Mode**: Subtle, professional (existing dark theme)

**Stress Test Palette** (Neon Gaming):
- Primary Accent: Cyan (#00f5ff) - intensity indicators, correct chars
- Secondary: Purple/Magenta (#b537ff) - errors, warnings
- Tertiary: Orange (#ff6b35) - danger zone, countdown
- Success Glow: Bright cyan with blur shadow
- Error Glow: Magenta/red with blur shadow

**Glassmorphism Recipe**:
```
Background: bg-black/20 or bg-white/5
Backdrop: backdrop-blur-xl
Border: border border-white/10 or border-cyan-500/30 for active states
Shadow: Colored glow shadows (shadow-[0_0_20px_rgba(0,245,255,0.3)])
```

---

## Layout System

**Spacing**: Tailwind units of 3, 4, 6, 8, 12, 16, 20, 24

**Grid Strategy**:
- Standard Practice: max-w-4xl centered
- Stress Test Arena: max-w-6xl with full-width intensity effects
- Dashboard: 3-column metrics grid
- Difficulty Selection: 5-column grid (lg:grid-cols-5, md:grid-cols-3, single mobile)

---

## Component Library

### Navigation
Top navbar with mode switcher center: "Practice" vs "Stress Test" toggle with sliding indicator. Stress Test mode navbar has glassmorphic background with cyan border-b glow. Height: h-16.

### Hero Section (Homepage)
Full-width hero (90vh) with dynamic split design: Left half shows professional keyboard workspace, right half transitions to neon-lit gaming setup. Dark gradient overlay (bottom to top). Headline with gradient text effect (cyan to purple). Dual CTAs: "Start Practice" (standard) + "Enter Arena" (neon glow button with pulse animation). Background uses parallax subtle movement.

### Stress Test Arena Interface
**Pre-Game Screen**:
- Difficulty selector: 5 large cards in row, each with intensity preview (visual chaos indicators: 1 star = calm, 5 stars = maximum chaos)
- Each card shows: Name, target WPM, chaos effects list, glassmorphic container with colored border (cyan→orange gradient by difficulty)
- Start button: Large, pulsing neon border, "Enter Arena" text

**Active Arena**:
- Full-screen immersive (no chrome)
- Text display: Oversized monospace (3xl) with neon glow on current word
- Chaos effects layer: CSS filters applied to entire container (blur 0-8px, hue-rotate, screen shake via transform)
- Live stats HUD: Four corners with glassmorphic panels
  - Top-left: WPM with real-time graph sparkline
  - Top-right: Accuracy percentage with color-coded glow
  - Bottom-left: Countdown timer with pulsing border
  - Bottom-right: Combo streak with multiplier
- Progress bar: Top edge, full-width, gradient fill (cyan→purple→orange as difficulty increases)

**Chaos Effect Scaling** (per difficulty level):
- Level 1: Subtle color pulse on mistakes
- Level 2: Brief screen shake on errors (2px translate)
- Level 3: Background blur pulse (0-2px), color shift every 10 seconds
- Level 4: Moderate shake (4px), rotating hue, distortion effects
- Level 5: Maximum chaos (8px shake, 4px blur, rapid color cycling, particle effects)

### Dashboard Widgets
Glassmorphic cards for Stress Test stats:
- High Score Display: Large numeral with neon glow, difficulty badge
- Recent Runs: Timeline with colored difficulty indicators
- Achievement Showcase: Unlockable badges with locked/unlocked states, glow effects
- Leaderboard: Top 10 with rank badges, animated on hover

### Buttons & CTAs
Standard mode: Subtle with hover lift
Stress Test mode: Neon border glow, backdrop-blur-md, text shadow, pulse animation on primary actions. All buttons on images use `bg-black/30 backdrop-blur-md`.

---

## Images

**Hero Image**: Composite split-screen image (1920x1080):
- Left: Professional workspace with modern mechanical keyboard, warm lighting
- Right: Same keyboard with RGB neon underglow, purple/cyan accent lighting, dark dramatic atmosphere
- Placement: Full-width hero background with gradient overlay (dark bottom, transparent top)

**Stress Test Preview**: Screenshot of arena interface mid-challenge showing chaos effects and neon UI (1400x900), placed in features section

**Achievement Badges**: Icon set (256x256) with metallic/holographic treatment for unlockables

---

## Animations

**Standard Mode**: Minimal (existing guidelines)

**Stress Test Enhancements**:
- Screen shake: `@keyframes shake` with transform translate, intensity scales with difficulty
- Glow pulse: Border and text-shadow animation (2s ease-in-out infinite)
- Combo multiplier: Scale bounce on increment (300ms cubic-bezier)
- Character validation: Flash color (100ms) cyan (correct) or magenta (error)
- Countdown urgency: Pulsing border acceleration in final 10 seconds
- Victory screen: Confetti particles with fade-out
- All animations respect `prefers-reduced-motion`

---

## Accessibility

- Chaos effects disable option: Settings toggle for users sensitive to motion/blur
- High contrast mode: Replaces neon with high-contrast alternatives
- Focus indicators: 3px cyan outline for keyboard navigation
- Screen reader announcements: WPM updates, error counts, level changes
- Reduced motion: Removes shake/blur, keeps color feedback
- Min touch targets: 44x44px maintained even in Stress Test
- Text contrast: WCAG AA compliance against all backgrounds (neon text uses sufficient glow/shadow)

---

## Page Structure

**Homepage**: Hero split-image (90vh) → Feature comparison: Practice vs Stress Test (2-column cards) → Difficulty showcase (5-card grid with preview) → Stats/achievements gallery → Testimonials (3-column) → Dual CTA section → Footer

**Stress Test Hub**: Difficulty selection grid (hero-style, 70vh) → Personal records dashboard (3-column stats) → Recent runs feed → Challenge of the day card

**Active Arena**: Full-screen interface only (practice area + HUD + effects layer)

**Standard Practice**: Maintains existing clean layout (max-w-4xl, minimal chrome)