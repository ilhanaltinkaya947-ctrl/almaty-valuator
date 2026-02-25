# Almavykup — Срочный выкуп недвижимости в Алматы

## Project Overview
Complete redesign and rebuild of almavykup.kz — a real estate buyout company in Almaty, Kazakhstan. Currently on Tilda. Rebuilding as a premium Next.js landing page with an integrated Smart Value property calculator as the primary lead magnet.

The site serves ONE purpose: capture phone numbers of property sellers in Almaty. Every section drives toward form submission or WhatsApp contact.

## Client Business Info

### Company
- **Name:** Алмавыкуп (Almavykup)
- **Business:** Срочный выкуп недвижимости (urgent property buyout)
- **Location:** Мамыр 4 / дом 119, г. Алматы
- **Phone:** +7 (707) 450-32-77
- **Email:** almavykup@gmail.com
- **Hours:** Пн-Пт: 9:00 - 18:00
- **2GIS:** https://2gis.kz/almaty/geo/9430047375160217/76.844166,43.217433

### What They Do
- Срочный выкуп квартир, домов, коммерческой недвижимости, земельных участков
- Работают в Алматы и ближайших районах
- Покупают в ЛЮБОМ состоянии (после пожара, с долгами, проблемные документы)
- Прямой выкуп без посредников
- Оплата в день сделки (наличные или перевод)
- Полное юридическое сопровождение
- Бесплатная консультация и оценка

### Property Types
1. **Квартиры** — Студии, 1-4 комнатные, любой район Алматы
2. **Дома и коттеджи** — Частные дома, дачи, коттеджи в городе и пригороде
3. **Коммерческая недвижимость** — Офисы, магазины, склады, производственные помещения
4. **Земельные участки** — Под застройку, сельхозназначения, в черте города

### How They Work (6 Steps)
1. **Первичная консультация** (15 минут) — Заявка → звонок в течение 15 минут
2. **Осмотр недвижимости** (2-3 часа) — Эксперт выезжает на объект
3. **Согласование цены** (1 час) — Справедливая цена на основе анализа рынка
4. **Подготовка документов** (быстро) — Юристы проверяют юридическую чистоту
5. **Подписание договора** (2-3 часа) — Встреча у нотариуса
6. **Получение денег** (сразу) — Полная оплата наличными или переводом

### Value Props (8 advantages)
1. Работаем без посредников — прямой выкуп
2. Оплата в день сделки наличными или переводом
3. Покупаем недвижимость в любом состоянии
4. Берем на себя все юридические вопросы
5. Помогаем с долгами по коммунальным платежам
6. Выкупаем проблемную недвижимость
7. Конфиденциальность гарантирована
8. Бесплатная консультация и оценка

### Legal Services
- Проверка документов — полная юридическая экспертиза
- Подготовка договора — с учетом всех нюансов
- Защита сделки — гарантия юридической чистоты
- Нотариальное сопровождение — организация встречи и регистрация

### FAQ (from their site)
Q: Как быстро вы можете выкупить недвижимость?
A: Сделка в кратчайшие сроки. Осмотр и оценка в день обращения, документы на следующий день.

Q: Какие документы нужны для продажи?
A: Правоустанавливающие документы, удостоверение личности, выписка из ЕГРН. Поможем восстановить недостающие.

Q: Выкупаете ли вы недвижимость с долгами?
A: Да, берем на себя решение вопроса, учитываем долги при определении цены.

Q: Как формируется цена выкупа?
A: На основе рыночной стоимости, состояния объекта, местоположения и срочности сделки.

Q: Можно ли получить деньги в день сделки?
A: Да, оплата в день подписания — наличными или переводом.

Q: Выкупаете ли вы недвижимость в плохом состоянии?
A: Да, любое состояние: требующую ремонта, после пожара, с проблемами по документам.

---

## Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript, Server Components)
- **Styling:** Tailwind CSS
- **Animations:** CSS transitions + Framer Motion for scroll reveals
- **Calculator:** Client-side Smart Value algorithm
- **Forms:** React Hook Form + server action for lead capture
- **Database:** Supabase (leads storage, ЖК data, config)
- **Deployment:** VPS + Docker + Nginx

---

## Site Structure (Single Page, Sectioned)

The entire site is ONE scrollable landing page with a sticky header nav. The calculator is a KEY section — not a separate page.

### Section Order:
1. **Header** — Sticky nav with logo, nav links, phone number, CTA button
2. **Hero** — Full-viewport hero with headline, subtitle, dual CTAs
3. **Trust Bar** — Stats/numbers strip (сделок, лет на рынке, etc.)
4. **Calculator** — 🔥 MAIN FEATURE — Interactive Smart Value property evaluator
5. **About** — О компании with 4 value cards (Быстро, Надежно, Выгодно, Бесплатный выезд)
6. **Property Types** — 4-card grid (Квартиры, Дома, Коммерция, Земля)
7. **How We Work** — 6-step timeline
8. **Advantages** — 8 advantage items in grid
9. **Legal** — Юридическое сопровождение block
10. **FAQ** — Accordion with 6 questions
11. **Contact Form** — Final conversion form + map + contacts
12. **Footer** — Logo, nav, contacts, copyright

### Navigation Items:
- Калькулятор (scrolls to calculator)
- О нас (scrolls to about)
- Услуги (scrolls to property types)
- Как мы работаем (scrolls to steps)
- FAQ (scrolls to faq)
- Контакты (scrolls to contacts)

---

## Design Direction

### Aesthetic: Luxury Dark with Warm Gold Accents
This is NOT a tech startup — it's a company that handles people's most valuable asset. Design must communicate: trust, wealth, professionalism, speed.

### Color Palette
```
--bg-primary: #0A0D14        Deep navy-black (main background)
--bg-secondary: #111827      Slightly lighter (card surfaces)
--bg-tertiary: #1A2332       Hover states, elevated cards
--accent: #C8A44E            Rich gold (primary accent — CTAs, highlights, prices)
--accent-hover: #D4B665      Lighter gold (hover state)
--accent-muted: #C8A44E20    Gold with low opacity (backgrounds, badges)
--blue: #4A8FD4              Trust blue (secondary accent — links, info)
--text-primary: #F1F3F7      Near-white (headlines, body)
--text-secondary: #8B95A8    Muted gray-blue (captions, labels)
--text-muted: #5A6478        Even more muted (fine print)
--border: #1E2A3A            Subtle borders
--success: #25D366           WhatsApp green
--danger: #E74C3C            Error/urgent red
--card-gradient: linear-gradient(145deg, #111827, #0D1320)
```

### Typography
- **Display/Headings:** `Playfair Display` (serif, elegant, trustworthy)
- **Body/UI:** `DM Sans` (clean geometric sans-serif, modern)
- **Mono/Numbers:** `JetBrains Mono` (for prices in calculator)
- Headings: 700-900 weight, tight letter-spacing
- Body: 400-500 weight
- Labels: DM Sans 600, uppercase, letter-spacing 0.1em

### Key Design Rules
- Gold accents used sparingly — CTAs, prices, section labels, key highlights
- Cards have subtle border + faint gradient background, NOT flat
- Generous whitespace between sections (py-24 to py-32)
- Subtle noise texture overlay on background (opacity 0.02)
- Radial gold glow behind hero headline
- Smooth scroll behavior site-wide
- All sections fade-in on scroll (IntersectionObserver or Framer Motion)
- Mobile-first, max-width 1200px for content

---

## Section Details

### 1. Header (Sticky)
```
[Logo: "Алмавыкуп" text]  [Калькулятор] [О нас] [Услуги] [FAQ] [Контакты]  [📞 +7 707 450-32-77]  [Оставить заявку — gold btn]
```
- Transparent on hero, solid bg-primary when scrolled (backdrop-blur)
- Mobile: hamburger menu
- Phone number visible on desktop, icon on mobile
- CTA button scrolls to contact form

### 2. Hero Section
- Full viewport height (min-h-screen)
- Left side: text content, right side: subtle decorative element or gradient shape
- **Pre-headline:** "СРОЧНЫЙ ВЫКУП НЕДВИЖИМОСТИ" (gold, small caps, letter-spaced)
- **Headline:** "Продайте вашу недвижимость в Алматы быстро и выгодно" (large, Playfair Display)
- **Subtitle:** "Квартиры, дома, коммерческие объекты и земельные участки. Любое состояние. Оплата сразу." (text-secondary)
- **Two CTAs:**
  - Primary (gold): "Узнать стоимость" → scrolls to calculator
  - Secondary (outline): "Позвонить +7 707 450-32-77" → tel: link
- **Background:** Subtle gradient mesh + noise overlay

### 3. Trust Bar
Horizontal strip with 4 stats, gold numbers:
- "500+" — Сделок закрыто
- "24ч" — Оценка в день обращения
- "100%" — Юридическая чистота
- "0₸" — Бесплатная консультация

### 4. Calculator Section (MAIN FEATURE)
**Section label:** "ОНЛАЙН-ОЦЕНКА" (gold, uppercase)
**Headline:** "Узнайте рыночную стоимость вашей недвижимости"
**Subtitle:** "Алгоритм Smart Value анализирует данные krisha.kz по 25+ жилым комплексам Алматы"

The calculator is an inline multi-step form WITHIN the page (not a separate page/modal):

**Step 1 — Property Type + ЖК Selection:**
- Property type toggle: Квартира | Дом | Коммерция | Участок
- If "Квартира" selected: show ЖК search (autocomplete input + scrollable list)
- If other types: show district selector + manual area input (simplified evaluation)

**Step 2 — Parameters (for Квартира):**
- Площадь: range slider 20-300 m²
- Этаж: range slider 1 to totalFloors
- Вид из окна: 4 option cards (Горы, Парк, Город, Промзона)
- Состояние: 5 option rows (Дизайнерский → Черновая)

**Step 3 — Result:**
- Animated price counter (gold, large)
- Price per m² comparison
- Factor chips showing coefficient impact
- Blurred "full report" teaser
- **CTA:** "Получить точную оценку от эксперта — бесплатно" → opens inline form
- Inline form: Name + Phone + Property type → submit creates lead

**For non-apartment types (Дом, Коммерция, Участок):**
- Show simplified form: Район, Площадь, Состояние
- Result shows estimated range (не точная цена, а диапазон)
- Same CTA to contact expert

**Smart Value Algorithm (квартиры only):**
```
PRICE = area × 738300 × K_complex × K_floor × K_year × K_view × K_condition
```
- K_complex: from ЖК data (0.85 - 2.2)
- K_floor: parabolic curve (0.93 - 1.08)
- K_year: degradation 1.5%/year, floor at 0.70
- K_view: mountain +10%, park +5%, city 0%, industrial -5%
- K_condition: designer +15%, euro +8%, good +3%, average 0%, rough -15%

### 5. About Section
**Label:** "О КОМПАНИИ"
**Headline:** "Алмавыкуп — надежный партнер в продаже недвижимости"
**Text:** "Мы специализируемся на срочном выкупе недвижимости в Алматы и ближайших районах. Работаем с квартирами, домами, коммерческими объектами и земельными участками любого состояния. Наша цель — предложить вам быстрое и выгодное решение с минимальными хлопотами."

**4 Value Cards (2×2 grid):**
| Icon | Title | Description |
|------|-------|-------------|
| ⚡ | Быстро | Оценка и выкуп в кратчайшие сроки |
| 🛡️ | Надежно | Полное юридическое сопровождение |
| 💰 | Выгодно | Справедливая рыночная цена |
| 🚗 | Бесплатный выезд | Специалист приедет для оценки в удобное время |

### 6. Property Types Section
**Label:** "ВИДЫ НЕДВИЖИМОСТИ"
**Headline:** "Мы выкупаем любые типы недвижимости"
**Subtitle:** "Любое состояние. Любой район Алматы."

**4 cards with images (use Unsplash URLs from their current site):**

1. **Квартиры**
   - Image: modern apartment building
   - Badge: "Любое состояние"
   - Text: "Студии, 1-4 комнатные квартиры в любом районе Алматы"

2. **Дома и коттеджи**
   - Image: luxury house exterior
   - Badge: "Любое состояние"
   - Text: "Частные дома, дачи, коттеджи в городе и пригороде"

3. **Коммерческая недвижимость**
   - Image: commercial office building
   - Badge: "Любое состояние"
   - Text: "Офисы, магазины, склады, производственные помещения"

4. **Земельные участки**
   - Image: land plot property
   - Badge: "Любое состояние"
   - Text: "Участки под застройку, сельхозназначения, в черте города"

Image URLs (from their Tilda site):
```
apartments: https://images.unsplash.com/photo-1743433035631-e3a94e0203a8?w=800
houses: https://images.unsplash.com/photo-1706808849780-7a04fbac83ef?w=800
commercial: https://images.unsplash.com/photo-1580741990231-4aa1c1d9a76a?w=800
land: https://images.unsplash.com/photo-1764222233275-87dc016c11dc?w=800
```

### 7. How We Work Section
**Label:** "КАК МЫ РАБОТАЕМ"
**Headline:** "От звонка до получения денег — 6 простых шагов"

Vertical timeline layout with alternating sides (desktop) or stacked (mobile):

| # | Title | Time | Description |
|---|-------|------|-------------|
| 1 | Первичная консультация | 15 минут | Вы оставляете заявку, мы связываемся в течение 15 минут |
| 2 | Осмотр недвижимости | 2-3 часа | Эксперт выезжает на объект для оценки |
| 3 | Согласование цены | 1 час | Справедливая цена на основе анализа рынка |
| 4 | Подготовка документов | Быстро | Юристы проверяют юридическую чистоту |
| 5 | Подписание договора | 2-3 часа | Встреча у нотариуса |
| 6 | Получение денег | Сразу | Полная оплата наличными или переводом |

### 8. Advantages Section
**Label:** "НАШИ ПРЕИМУЩЕСТВА"
**Headline:** "Почему выбирают Алмавыкуп"

8 items in 2×4 or 4×2 grid. Each item: icon + text. Use gold accent for icons.

1. 🤝 Работаем без посредников — прямой выкуп
2. 💳 Оплата в день сделки наличными или переводом
3. 🏚️ Покупаем недвижимость в любом состоянии
4. ⚖️ Берем на себя все юридические вопросы
5. 📋 Помогаем с долгами по коммунальным платежам
6. 🔓 Выкупаем проблемную недвижимость
7. 🔒 Конфиденциальность гарантирована
8. 🆓 Бесплатная консультация и оценка

### 9. Legal Section
**Label:** "ЮРИДИЧЕСКАЯ ЗАЩИТА"
**Headline:** "Юридическое сопровождение на всех этапах"

Dark card with 4 service blocks:
1. **Проверка документов** — Полная юридическая экспертиза всех документов
2. **Подготовка договора** — Составление договора с учетом всех нюансов
3. **Защита сделки** — Гарантия юридической чистоты и безопасности
4. **Нотариальное сопровождение** — Организация встречи и регистрация

Bottom text: "Мы берем на себя все юридические вопросы: от проверки документов до регистрации сделки в госорганах."

### 10. FAQ Section
**Label:** "ВОПРОСЫ И ОТВЕТЫ"
**Headline:** "Часто задаваемые вопросы"

Accordion component (click to expand/collapse). Use all 6 Q&As from the FAQ section above.

### 11. Contact Section
**Label:** "КОНТАКТЫ"
**Headline:** "Получите бесплатную консультацию"

Two columns:
- **Left:** Contact form (Name, Phone, Property Type dropdown, Message textarea, Submit button)
- **Right:** Contact info cards:
  - 📞 +7 (707) 450-32-77
  - ✉️ almavykup@gmail.com
  - 📍 г. Алматы, Мамыр 4 / дом 119
  - 🕐 Пн-Пт: 9:00 - 18:00
  - Link to 2GIS map

### 12. Footer
- Logo + tagline
- Nav links (same as header)
- Contact info
- WhatsApp link: https://wa.me/77074503277
- "© 2026 Алмавыкуп. Все права защищены."

---

## ЖК Database (for Calculator)

25 complexes calibrated against krisha.kz market data. Base rate: 738,300 тг/м².

| Name | District | Class | Coeff | Year | Floors |
|------|----------|-------|-------|------|--------|
| Esentai City | Медеуский | Elite | 2.20 | 2015 | 22 |
| Ritz Carlton Residences | Медеуский | Elite | 2.00 | 2013 | 18 |
| Almaty Towers | Медеуский | Elite | 1.90 | 2016 | 35 |
| Metropole | Бостандыкский | Business+ | 1.80 | 2020 | 25 |
| AFD Riviera | Бостандыкский | Business+ | 1.70 | 2023 | 24 |
| Тенгри Тауэр | Медеуский | Business+ | 1.70 | 2017 | 32 |
| Premium Tower | Медеуский | Business+ | 1.65 | 2018 | 28 |
| Park Avenue | Бостандыкский | Business+ | 1.60 | 2019 | 20 |
| Golden Square | Алмалинский | Business+ | 1.60 | 2021 | 27 |
| Botanical Garden Res. | Бостандыкский | Business+ | 1.55 | 2024 | 18 |
| Orion | Алмалинский | Business | 1.50 | 2021 | 30 |
| Clover House | Бостандыкский | Business | 1.45 | 2021 | 22 |
| Highvill | Наурызбайский | Business | 1.40 | 2022 | 16 |
| Nova Residence | Бостандыкский | Business | 1.40 | 2024 | 19 |
| Манхэттен | Бостандыкский | Business | 1.35 | 2018 | 22 |
| Baiseitova 104 | Алмалинский | Business | 1.35 | 2022 | 12 |
| Manhattan City | Алмалинский | Comfort+ | 1.30 | 2020 | 25 |
| Green Park | Бостандыкский | Comfort+ | 1.25 | 2019 | 14 |
| Sky City | Ауэзовский | Comfort | 1.15 | 2023 | 20 |
| Асыл Арман | Алатауский | Comfort | 1.10 | 2022 | 12 |
| Самал-2 | Медеуский | Standard | 1.15 | 1990 | 14 |
| Орбита-1 | Бостандыкский | Standard | 1.05 | 1980 | 12 |
| Сауран Палас | Ауэзовский | Standard | 1.00 | 2015 | 9 |
| Жетысу-2 | Ауэзовский | Standard | 0.90 | 1988 | 9 |
| Аксай-3 | Ауэзовский | Standard | 0.85 | 1985 | 5 |

---

## Directory Structure
```
almavykup/
├── CLAUDE.md
├── .env.local
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Main landing page (assembles all sections)
│   │   ├── layout.tsx               # Root layout (fonts, metadata, analytics)
│   │   ├── globals.css              # Tailwind base + custom properties + noise
│   │   └── api/
│   │       └── leads/
│   │           └── route.ts         # Lead capture endpoint
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── sections/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── TrustBar.tsx
│   │   │   ├── CalculatorSection.tsx
│   │   │   ├── AboutSection.tsx
│   │   │   ├── PropertyTypesSection.tsx
│   │   │   ├── HowWeWorkSection.tsx
│   │   │   ├── AdvantagesSection.tsx
│   │   │   ├── LegalSection.tsx
│   │   │   ├── FAQSection.tsx
│   │   │   └── ContactSection.tsx
│   │   ├── calculator/
│   │   │   ├── Calculator.tsx
│   │   │   ├── PropertyTypeToggle.tsx
│   │   │   ├── ComplexSearch.tsx
│   │   │   ├── ParameterForm.tsx
│   │   │   ├── ResultCard.tsx
│   │   │   ├── FactorChips.tsx
│   │   │   └── LeadCaptureForm.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── AnimatedCounter.tsx
│   │       ├── SectionLabel.tsx
│   │       ├── Accordion.tsx
│   │       ├── ScrollReveal.tsx
│   │       └── PhoneInput.tsx
│   ├── lib/
│   │   ├── smart-value.ts
│   │   ├── complexes.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── public/
│   └── logo.png
└── tailwind.config.ts
```

---

## Code Standards
- TypeScript strict mode
- Server Components by default, "use client" only for interactive parts (Calculator, FAQ accordion, Header mobile menu)
- Smooth scroll: `html { scroll-behavior: smooth; }`
- All text in Russian
- Phone: +7 (707) 450-32-77 for display, +77074503277 for tel: links
- Prices as integers in tenge
- No `any` types

## Commands
```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint
```

## Fonts (load in layout.tsx via next/font/google)
```typescript
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin", "cyrillic"], weight: ["400", "700", "900"], variable: "--font-display" });
const dmSans = DM_Sans({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], variable: "--font-body" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "700"], variable: "--font-mono" });
```

## SEO Metadata
```typescript
export const metadata = {
  title: "Алмавыкуп — Срочный выкуп недвижимости в Алматы | Оплата сразу",
  description: "Срочный выкуп квартир, домов, коммерческой недвижимости и земельных участков в Алматы. Любое состояние. Оплата в день сделки. Бесплатная оценка.",
  keywords: "выкуп недвижимости алматы, срочный выкуп квартиры, продать квартиру быстро алматы, скупка недвижимости",
  openGraph: {
    title: "Алмавыкуп — Срочный выкуп недвижимости в Алматы",
    description: "Продайте недвижимость быстро и выгодно. Оплата в день сделки.",
    locale: "ru_RU",
    type: "website",
    url: "https://almavykup.kz",
  },
};
```

## Sprint Plan
1. **Sprint 1 (Day 1-2):** Project setup + Tailwind theme + layout (Header/Footer) + HeroSection + TrustBar
2. **Sprint 2 (Day 2-3):** Calculator section (all steps, algorithm, ЖК search, result + lead capture form)
3. **Sprint 3 (Day 3-4):** About + PropertyTypes + HowWeWork + Advantages + Legal sections
4. **Sprint 4 (Day 4-5):** FAQ accordion + ContactSection + scroll animations + mobile responsive + polish
5. **Sprint 5 (Day 5):** Lead capture API + Supabase integration + deploy
