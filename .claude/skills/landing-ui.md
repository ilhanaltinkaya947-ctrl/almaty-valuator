# Landing Page & Design System

## Purpose
Premium dark fintech calculator-quiz that converts visitors into WhatsApp leads. Target audience: wealthy Almaty property owners (Elite/Business class). The UI must communicate trust, technology, and authority.

## Design Tokens (tailwind.config.ts)
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0B0E17",
        card: "#121829",
        "card-hover": "#1A2240",
        accent: "#4A90D9",
        gold: "#C9A961",
        "text-primary": "#E8ECF4",
        "text-secondary": "#8892A8",
        border: "#1E2A45",
        success: "#25D366",
        danger: "#E74C3C",
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        glow: "0 8px 32px rgba(74, 144, 217, 0.25)",
        "glow-lg": "0 12px 40px rgba(74, 144, 217, 0.35)",
        "glow-gold": "0 8px 32px rgba(201, 169, 97, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
```

## Font Loading
In root layout or `globals.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
```

## Page Flow (4 Steps)
Each step is a client component with fade transitions (250ms).

### Step 1: Hero
- Gradient headline: "Узнайте реальную стоимость вашей квартиры в Алматы"
- Subtitle with ЖК count and algorithm mention
- Single CTA button with glow shadow
- Stats row: base rate, ЖК count, factors count
- Background: subtle radial gradient glow + noise texture overlay

### Step 2: ЖК Selection
- Step indicator: "ШАГ 1 ИЗ 3" in gold
- Live search input with magnifier icon
- Scrollable list of ЖК cards
- Each card: name, district, developer, year, floors, class badge, coefficient
- Click selects and advances to Step 3

### Step 3: Parameters
- Step indicator: "ШАГ 2 ИЗ 3"
- Selected ЖК shown as context
- Area: range slider + number display (20-300 m²)
- Floor: range slider (1 to totalFloors)
- View: 2×2 grid of option cards with emoji + label + coefficient
- Condition: vertical list of option rows
- CTA: "Рассчитать стоимость →"

### Step 4: Result + Gate
- Animated counter rolling up to final price (1.2s cubic-bezier)
- Price card with gradient border
- Price per m² comparison (district avg vs ЖК)
- Factor chips: colored badges showing each coefficient's impact
- Blurred benchmark section (teaser for PDF content)
- Gold CTA: "📄 Получить PDF-отчёт в WhatsApp"
- Phone input modal (conversion gate)
- Success screen after submission

## Component Architecture
All landing components are client components (`"use client"`):

```
(landing)/page.tsx          — Orchestrator, manages step state
components/landing/
  HeroSection.tsx           — Step 0
  ComplexSearch.tsx          — Step 1 (search + list)
  ParameterForm.tsx          — Step 2 (sliders + selectors)
  ResultCard.tsx             — Step 3 (price display)
  FactorChips.tsx            — Coefficient breakdown
  BenchmarkTeaser.tsx        — Blurred preview
  ConversionGate.tsx         — Phone capture modal
  StepIndicator.tsx          — "ШАГ X ИЗ 3" label
components/ui/
  AnimatedCounter.tsx        — Number animation (requestAnimationFrame)
  GlowButton.tsx             — Primary CTA with shadow
  SearchInput.tsx             — Styled input with icon
  RangeSlider.tsx             — Styled range input
  OptionCard.tsx              — Selectable card (view/condition)
```

## Key UI Patterns

### Animated Price Counter
```typescript
"use client";
import { useState, useEffect, useRef } from "react";

export function AnimatedCounter({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(start + diff * ease));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    prev.current = value;
  }, [value, duration]);

  return <>{display.toLocaleString("ru-RU")}</>;
}
```

### Step Transition
```typescript
const goToStep = (newStep: number) => {
  setFading(true);
  setTimeout(() => {
    setStep(newStep);
    setFading(false);
  }, 250);
};

// In JSX:
<div className={`transition-opacity duration-250 ${fading ? "opacity-0" : "opacity-100"}`}>
  {/* current step */}
</div>
```

### Phone Input Mask
Kazakhstan format: +7 (7XX) XXX-XX-XX
```typescript
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 1) return "+7 ";
  if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
  if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
}
```

## Background Effects
```css
/* Noise texture overlay */
.noise-overlay {
  position: fixed;
  inset: 0;
  opacity: 0.03;
  pointer-events: none;
  background-image: url("data:image/svg+xml,..."); /* fractalNoise SVG */
}

/* Radial accent glow */
.accent-glow {
  position: fixed;
  top: -30%;
  right: -20%;
  width: 70vw;
  height: 70vw;
  background: radial-gradient(circle, rgba(74, 144, 217, 0.03) 0%, transparent 70%);
  pointer-events: none;
}
```

## SEO (Server Component wrapper)
```typescript
// (landing)/layout.tsx
export const metadata = {
  title: "Оценка квартиры в Алматы — бесплатный калькулятор рыночной стоимости",
  description: "Узнайте рыночную стоимость вашей квартиры в Алматы. AI-алгоритм анализирует 50+ ЖК с учётом этажа, вида, состояния и класса объекта.",
  openGraph: {
    title: "Almaty Valuator — Оценка недвижимости",
    description: "Точная оценка квартиры за 30 секунд",
    locale: "ru_RU",
    type: "website",
  },
};
```

## Mobile First
- Max content width: 680px centered
- All touch targets: minimum 44px
- Range sliders: large thumb, accent color
- Cards: full-width on mobile, comfortable padding (16-20px)
- Font sizes: minimum 13px for body text
