---
name: frontend-ui-engineering
description: Production UI standards. Anti-AI-aesthetic checklist. Accessibility, motion, design tokens.
---

# Frontend UI Engineering

Good UI is invisible. Users notice when it's wrong. Build UI that feels fast, accessible, and intentional.

## Anti-AI-Aesthetic Checklist

These are the tells that a UI was built by an AI without design judgment. Avoid all of them:

| Anti-pattern | Fix |
|---|---|
| Generic gradient backgrounds (blue-to-purple) | Flat color or brand-specific palette |
| `rounded-2xl` on everything | Consistent radius token (`--radius: 4px` for professional) |
| `shadow-lg` on every card | Use shadow sparingly, only for elevated elements |
| Emoji in every heading | Text only unless brand-appropriate |
| "Get started today!" CTA copy | Specific action ("Order by 2pm for same-day delivery") |
| Placeholder images that are never replaced | Real product photography or deliberately designed SVGs |
| Font size monotony (all 16px) | Clear typographic hierarchy |
| `gap-8` between everything | Intentional spacing rhythm |
| Generic icon sets (Heroicons defaults) | Consistent icon library or custom SVGs |
| Loading spinner without skeleton | Skeleton screens for known-shape content |

## Design Token System

All visual constants go in `app/globals.css`:

```css
@theme inline {
  /* Colors */
  --black: #0A0A0A;
  --ink: #1A1A1A;
  --mid: #767676;
  --light: #E8E8E8;
  --off: #FAFAFA;
  --white: #FFFFFF;
  
  /* Typography */
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  
  /* Spacing rhythm (8px base) */
  --space-1: 0.5rem;   /* 8px */
  --space-2: 1rem;     /* 16px */
  --space-3: 1.5rem;   /* 24px */
  --space-4: 2rem;     /* 32px */
  --space-6: 3rem;     /* 48px */
  --space-8: 4rem;     /* 64px */
}
```

## Typography Hierarchy

```css
/* Display — hero, collection titles */
.text-display { font-family: var(--font-display); font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 300; }

/* Heading — section titles, card names */
.text-heading { font-family: var(--font-display); font-size: clamp(1.25rem, 3vw, 1.75rem); font-weight: 400; }

/* Body — descriptions, UI text */
.text-body { font-family: var(--font-body); font-size: 0.9375rem; line-height: 1.6; }

/* Label — tags, chips, captions */
.text-label { font-family: var(--font-body); font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; }
```

## Component Patterns

### Card (product)
```tsx
// ✅ Correct pattern — aspect ratio reserved, image fills
<article className="group relative">
  <div className="aspect-[3/4] overflow-hidden bg-[--off]">
    <Image src={img} fill alt={name} className="object-cover transition-transform duration-500 group-hover:scale-105" />
  </div>
  <div className="pt-3">
    <h3 className="text-[0.9rem] font-medium">{name}</h3>
    <p className="text-[--mid] text-sm">{stems}</p>
    <p className="mt-1 font-medium">€{price} <span className="text-[--mid] text-sm">· {priceBgn} лв.</span></p>
  </div>
</article>
```

### Button variants
```tsx
// Primary — one per section max
<button className="bg-[--black] text-white px-8 py-3 text-sm tracking-wide hover:bg-[--ink] transition-colors">
  Поръчай сега
</button>

// Secondary — outline
<button className="border border-[--black] px-8 py-3 text-sm tracking-wide hover:bg-[--black] hover:text-white transition-colors">
  Виж каталога
</button>

// Ghost — minimal
<button className="text-sm text-[--mid] underline-offset-4 hover:underline">
  Научи повече
</button>
```

### Form inputs
```tsx
<div className="space-y-1">
  <label htmlFor="phone" className="text-xs text-[--mid] uppercase tracking-wide">Телефон</label>
  <input
    id="phone"
    type="tel"
    className="w-full border border-[--light] px-4 py-2.5 text-sm outline-none focus:border-[--ink] transition-colors"
    placeholder="+359 88 888 8888"
  />
</div>
```

## Accessibility Checklist

Every component must pass:

- [ ] **Color contrast**: text on background ≥ 4.5:1 (AA), large text ≥ 3:1
- [ ] **Focus visible**: `focus:outline-2 focus:outline-offset-2` on all interactive elements
- [ ] **Alt text**: all `<img>` and `<Image>` have descriptive alt text (not "image" or "photo")
- [ ] **Semantic HTML**: headings in order (h1 → h2 → h3), buttons for actions, links for navigation
- [ ] **ARIA labels**: icon-only buttons need `aria-label`
- [ ] **Form labels**: every input has an associated `<label>` with `htmlFor`
- [ ] **Error messages**: errors associated with their input via `aria-describedby`
- [ ] **Keyboard navigable**: tab order is logical, no keyboard traps

## Motion and Animation

```css
/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Standard timing values */
--transition-fast: 150ms ease;      /* hover states */
--transition-base: 250ms ease;      /* card interactions */
--transition-slow: 500ms ease;      /* image zoom, reveals */
```

Rules:
- No animation longer than 500ms (feels broken)
- No bouncy/elastic easing on professional/luxury brands
- No animation that blocks user from reading or clicking
- `transform` and `opacity` only — avoid animating `width`, `height`, `padding` (triggers layout)

## Responsive Design

Mobile-first. Design for 375px, adapt up.

```css
/* Breakpoints */
/* sm: 640px — larger phones */
/* md: 768px — tablets */
/* lg: 1024px — desktop */
/* xl: 1280px — wide desktop */

/* Product grid: 2 cols mobile → 3 cols desktop */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}
```

## Loading States

Never leave users staring at a blank area:

```tsx
// Skeleton for product card
function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-[--light]" />
      <div className="pt-3 space-y-2">
        <div className="h-4 w-3/4 bg-[--light] rounded" />
        <div className="h-3 w-1/2 bg-[--light] rounded" />
        <div className="h-4 w-1/3 bg-[--light] rounded" />
      </div>
    </div>
  )
}
```
