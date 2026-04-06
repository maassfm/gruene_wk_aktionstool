# Design Language: Soft Brutalism × Green Party CI

A transferable, project-agnostic design specification. Any project can adopt this visual language by following the tokens and patterns defined here. Paste the [Usage Guide](#9-usage-guide-for-claude-code) section into a new project's `CLAUDE.md` to have Claude Code generate matching UI automatically.

---

## 1. Design Philosophy

**Soft Brutalism** combines the directness of web brutalism — raw grids, hard borders, no decorative filler — with just enough restraint to remain accessible and approachable.

| Principle | Implementation |
|---|---|
| **Clarity through contrast** | 2 px black borders separate every element. Content needs no shadow or color to stand out. |
| **Geometric honesty** | No border-radius. 90° corners everywhere. Shape comes from structure, not softening. |
| **Tactile interactivity** | Offset drop-shadows make interactive elements feel physically present. Hover/active states simulate pressing a physical button. |
| **Intentional color** | A tight palette with one dominant brand color. Accent colors carry semantic meaning only (warning, danger, info). |
| **Bold, uppercase labels** | All labels, nav items, and buttons are uppercase with tracked letter-spacing. Typography does the visual work. |

---

## 2. Color Palette

Define these as CSS custom properties in your `globals.css` (Tailwind 4 `@theme inline` block):

```css
@theme inline {
  /* Brand greens */
  --color-tanne:       #005538;   /* Primary — CTA, active states, header bg */
  --color-tanne-light: #006644;   /* Hover variant of tanne */
  --color-klee:        #008939;   /* Progress bars, secondary green accents */
  --color-grashalm:    #8ABD24;   /* Light accent — use sparingly */

  /* Semantic accents */
  --color-sonne:   #FFF17A;   /* Warning / "changed" badge — yellow */
  --color-himmel:  #0BA1DD;   /* Info badge — sky blue */
  --color-signal:  #E6007E;   /* Danger / error — magenta */

  /* Neutrals */
  --color-sand:      #F5F1E9;   /* Warm off-white — subtle backgrounds */
  --color-sand-dark: #E8E2D6;   /* Dividers on sand backgrounds */
  --color-gray-100:  #F7F7F7;
  --color-gray-200:  #E5E5E5;
  --color-gray-300:  #D4D4D4;
  --color-gray-400:  #A3A3A3;
  --color-gray-500:  #737373;
  --color-gray-600:  #525252;
  --color-gray-700:  #404040;
  --color-gray-800:  #262626;
  --color-gray-900:  #171717;

  /* Semantic reds (form validation) */
  --color-red-50:  #FEF2F2;
  --color-red-100: #FEE2E2;
  --color-red-500: #EF4444;
  --color-red-600: #DC2626;

  /* Base */
  --color-background: #ffffff;
  --color-foreground: #000000;
}
```

**Color roles at a glance:**

| Color | Token | Role |
|---|---|---|
| Deep forest green | `tanne` | Primary brand, header bg, CTA buttons, active nav |
| Bright green | `klee` | Progress fills, secondary accents |
| Yellow | `sonne` | "Changed" / warning badge background |
| Sky blue | `himmel` | Info badge background |
| Magenta | `signal` | Danger button, error borders, error text |
| Black `#000` | — | All borders, all shadows, body text |
| White `#FFF` | — | All card/input backgrounds |

---

## 3. Typography

### Font stack

```css
@theme inline {
  --font-sans:     "DM Sans", Arial, Helvetica, sans-serif;
  --font-headline: "YourBrandFont", "Barlow Condensed", "Arial Narrow", sans-serif;
}
```

- **Headline font** — condensed, high-impact, weight 700. Use your brand's condensed typeface; `Barlow Condensed` is a strong open-source substitute.
- **Body font** — `DM Sans` (or any humanist sans-serif). Clean, readable at small sizes.

### Rules

```css
/* All headings */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-headline);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

body {
  font-family: var(--font-sans);
  line-height: 1.6;
}
```

### Tailwind class patterns

| Element | Classes |
|---|---|
| Page heading | `font-headline font-bold text-2xl uppercase tracking-wide` |
| Card/section title | `font-headline font-bold text-lg uppercase tracking-wide text-tanne` |
| Form label | `text-sm font-bold uppercase tracking-wide text-black` |
| Button text | `font-bold uppercase tracking-wide` (baked into button component) |
| Badge / tag | `text-xs font-bold uppercase tracking-wide` |
| Body / prose | `font-sans` (default, no override needed) |
| Muted text | `text-gray-500` or `text-white/70` (on dark backgrounds) |

---

## 4. Core Design Tokens

### Borders

- **Standard border:** `border-2 border-black` — used on every interactive element and container
- **Header/footer divider:** `border-b-[3px] border-black` / `border-t-[3px] border-black`
- **Sidebar divider:** `border-r-2 border-black`
- **Section separator:** `border-t-2 border-black`
- **Error border:** `border-2 border-signal`
- **Brand-colored border:** `border-2 border-tanne` (outline buttons, selected states)
- **No border-radius** anywhere — all elements are square

### Focus ring

```css
/* globals.css */
*:focus-visible {
  outline: 3px solid #000000;
  outline-offset: 0;
}
```

In Tailwind on interactive elements: `focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black`

### Spacing scale (common values)

| Use | Classes |
|---|---|
| Inline gap | `gap-2` `gap-3` `gap-4` |
| Vertical stack | `space-y-3` `space-y-4` |
| Card padding | `p-4 md:p-6` |
| Section padding | `px-4 py-3` (header) · `px-4 py-6` (footer) |
| Container | `max-w-7xl mx-auto px-4` |
| Form/modal | `max-w-2xl` (forms) · `max-w-lg` (dialogs) |

---

## 5. Shadow System

The signature of this design language. Hard offset shadows with zero blur — they look like a solid second layer behind each element.

### Shadow levels

| Level | Tailwind | Use |
|---|---|---|
| Dialog | `shadow-[8px_8px_0_#000]` | Modals, highest elevation |
| Elevated card | `shadow-[6px_6px_0_#000]` | Login card, hero elements |
| Default interactive | `shadow-[4px_4px_0_#000]` | Buttons, cards, inputs when focused |
| Sidebar nav item | `shadow-[2px_2px_0_#000]` | Active nav items |
| Bottom sheet | `shadow-[0_-4px_0_#000]` | Slide-up panels (negative Y) |

### Color-matched shadows

For outline/brand buttons, match the shadow to the border color:

```
shadow-[4px_4px_0_#005538]   /* tanne shadow */
```

### Hover / Active interaction (press-down effect)

This is the most distinctive interaction in the system. As the shadow shrinks, the element translates in the same direction — simulating physical depression.

```
Rest:   shadow-[4px_4px_0_#000]  translate-x-0       translate-y-0
Hover:  shadow-[2px_2px_0_#000]  translate-x-[2px]   translate-y-[2px]
Active: shadow-none              translate-x-[4px]   translate-y-[4px]
```

Full Tailwind string:
```
shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
```

Always pair with `transition-all` on the element.

---

## 6. Component Patterns

### 6.1 Buttons

Base classes applied to every button:
```
inline-flex items-center justify-center font-bold uppercase tracking-wide transition-all
focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black
disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0
```

**Variants:**

| Variant | Full class string |
|---|---|
| `primary` | `bg-tanne text-white border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]` |
| `secondary` | `bg-white text-black border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]` |
| `danger` | `bg-signal text-white border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]` |
| `outline` | `bg-white text-tanne border-2 border-tanne shadow-[4px_4px_0_#005538] hover:shadow-[2px_2px_0_#005538] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]` |
| `action` | `bg-white text-black border-2 border-black hover:border-tanne hover:text-tanne` |
| `ghost` | `bg-transparent text-tanne border-2 border-transparent hover:border-black hover:shadow-[4px_4px_0_#000]` |

**Sizes:**

| Size | Classes |
|---|---|
| `sm` | `px-3 py-1.5 text-sm` |
| `md` | `px-4 py-2 text-base` |
| `lg` | `px-6 py-3 text-lg` |

**Loading state:** render a spinning SVG before the label text; set `disabled` on the button element.

---

### 6.2 Inputs & Forms

**Input field:**
```html
<div class="w-full">
  <label class="block text-sm font-bold uppercase tracking-wide text-black mb-1">
    Field Label
  </label>
  <input class="w-full px-3 py-2 border-2 border-black bg-white transition-shadow
                focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black
                placeholder:text-gray-400" />
</div>
```

Error state — swap border color:
```
border-signal   /* instead of border-black */
```
Error message below input:
```
<p class="mt-1 text-sm font-bold text-signal">Error text here</p>
```

**Select element** — identical styling to input: `px-3 py-2 border-2 border-black bg-white w-full`

**Form layout patterns:**
```
grid grid-cols-1 sm:grid-cols-2 gap-4          /* two-column form */
grid grid-cols-1 sm:grid-cols-3 gap-4          /* three-column form */
space-y-4                                       /* single-column stack */
border-t-2 border-black pt-4 mt-4              /* section separator within form */
```

**Custom checkbox:**
```html
<div class="w-5 h-5 border-2 border-black flex items-center justify-center bg-white">
  <!-- When checked: bg-tanne, white checkmark svg -->
</div>
```

---

### 6.3 Cards

**Base card:**
```html
<div class="bg-white border-2 border-black p-4 md:p-6">
  ...
</div>
```

**Elevated card** (login, hero):
```html
<div class="bg-white border-2 border-black p-6 shadow-[6px_6px_0_#000]">
  ...
</div>
```

**Interactive card** (clickable list item):
```html
<div class="bg-white border-2 border-black shadow-[4px_4px_0_#000] p-4 cursor-pointer
            hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]
            transition-all">
  ...
</div>
```

**Selected state** (interactive card, green variant):
```
border-tanne shadow-[4px_4px_0_#005538]
```

**Card title:**
```html
<h3 class="font-headline font-bold text-lg uppercase tracking-wide text-tanne">
  Section Title
</h3>
```

---

### 6.4 Badges

Base classes: `inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wide`

| Variant | Classes |
|---|---|
| `default` | `bg-gray-100 text-black border border-black` |
| `success` | `bg-tanne text-white border border-black` |
| `warning` | `bg-sonne text-black border border-black` |
| `danger` | `bg-signal text-white border border-black` |
| `info` | `bg-himmel text-white border border-black` |

Note: badges use `border` (1 px), not `border-2` like other elements.

---

### 6.5 Dialogs / Modals

Uses the native `<dialog>` element:

```html
<dialog class="backdrop:bg-black/60 bg-white border-2 border-black shadow-[8px_8px_0_#000]
               p-0 max-w-lg w-full mx-4">
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 border-b-2 border-black pb-4">
      <h2 class="font-headline font-bold text-xl uppercase text-tanne">
        Dialog Title
      </h2>
      <button class="text-black hover:bg-black hover:text-white w-8 h-8 flex items-center
                     justify-center border-2 border-black text-xl leading-none font-bold
                     transition-colors">
        &times;
      </button>
    </div>
    <!-- Body -->
    <div>...</div>
  </div>
</dialog>
```

---

### 6.6 Navigation

**Header (sticky, brand-colored):**
```html
<header class="bg-tanne text-white sticky top-0 z-50 border-b-[3px] border-black">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <!-- Logo left, nav right -->
  </div>
</header>
```

Header nav links:
```
text-sm transition-colors font-medium
active:   text-sonne
inactive: text-white/70 hover:text-white
```

**Footer:**
```html
<footer class="bg-tanne text-white/70 text-sm border-t-[3px] border-black">
  <div class="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
    ...
  </div>
</footer>
```

Footer links: `hover:text-white transition-colors uppercase tracking-wide font-bold`

**Sidebar:**
```html
<aside class="w-64 shrink-0 bg-white border-r-2 border-black min-h-[calc(100vh-56px)] p-4">
  <nav class="space-y-1">
    ...
  </nav>
</aside>
```

Sidebar nav item:
```
Base:   flex items-center gap-3 px-3 py-2 text-sm font-bold uppercase tracking-wide
        transition-colors border-2 mb-1
Active: bg-tanne text-white border-black shadow-[2px_2px_0_#000]
Idle:   text-black border-transparent hover:border-black hover:shadow-[2px_2px_0_#000]
```

---

## 7. Interactive States

Summary of all state transitions:

| State | Shadow | Transform |
|---|---|---|
| Rest | `shadow-[4px_4px_0_#000]` | none |
| Hover | `shadow-[2px_2px_0_#000]` | `translate-x-[2px] translate-y-[2px]` |
| Active / pressed | `shadow-none` | `translate-x-[4px] translate-y-[4px]` |
| Disabled | `shadow-none` | none |
| Selected (card) | `shadow-[4px_4px_0_#005538]` + `border-tanne` | none |

Always add `transition-all` to interactive elements.

**Error containers:**
```
bg-white border-2 border-signal text-black p-3 text-sm font-bold
```

or softer variant:
```
border-2 border-black bg-red-50 text-red-600 p-3 text-sm
```

---

## 8. Layout Patterns

**Page shell:**
```html
<div class="min-h-screen flex flex-col">
  <header>...</header>
  <main class="flex-1">...</main>
  <footer>...</footer>
</div>
```

**Sidebar layout:**
```html
<div class="max-w-7xl mx-auto flex">
  <aside class="w-64 shrink-0 ...">...</aside>
  <main class="flex-1 p-4 md:p-8">...</main>
</div>
```

**Content container:** `max-w-7xl mx-auto px-4`

**Responsive grid patterns:**
```
grid grid-cols-1 sm:grid-cols-2 gap-4
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
```

**Bottom sheet (mobile slide-up panel):**
```html
<div class="fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-black
            shadow-[0_-4px_0_#000] z-50 transition-transform duration-300
            translate-y-full">   <!-- add translate-y-0 when visible -->
  <div class="max-w-7xl mx-auto px-4 py-3">
    ...
  </div>
</div>
```

**Filter bar (sticky, below header):**
```html
<div class="bg-white border-b-2 border-black sticky top-[52px] z-40 px-4 py-2">
  <!-- Filter buttons: border-2 + active: bg-tanne text-white border-black -->
</div>
```

**Responsive show/hide:**
```
hidden md:block    /* desktop only */
md:hidden          /* mobile only */
flex-col sm:flex-row
```

---

## 9. Usage Guide for Claude Code

Paste this block into a new project's `CLAUDE.md` to have Claude Code generate UI that matches this design system:

---

```markdown
## Design System: Soft Brutalism × Green Party CI

Follow the design language documented in `docs/design.md` for all UI work.

### Non-negotiable rules

1. **No border-radius** — all elements are square. Never use `rounded-*` classes.
2. **2 px black borders everywhere** — every card, input, button, and container uses `border-2 border-black`.
3. **Offset shadow system** — interactive elements use `shadow-[4px_4px_0_#000]` at rest.
   Hover: `shadow-[2px_2px_0_#000] translate-x-[2px] translate-y-[2px]`
   Active: `shadow-none translate-x-[4px] translate-y-[4px]`
   Always pair with `transition-all`.
4. **Uppercase bold labels** — all labels, nav items, buttons: `font-bold uppercase tracking-wide`.
5. **Headline font for headings** — use `font-headline` class on all `h1–h6` and section titles.
6. **Color discipline** — `tanne` (#005538) is the primary brand color. `signal` (#E6007E) for danger/error only. `sonne` (#FFF17A) for warnings only. `himmel` (#0BA1DD) for info only.
7. **Focus ring** — `focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black` on all interactive elements.
8. **Header:** `bg-tanne text-white sticky top-0 z-50 border-b-[3px] border-black`
9. **Footer:** `bg-tanne text-white/70 border-t-[3px] border-black`

### Button variants (use exact strings)

- Primary: `bg-tanne text-white border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]`
- Secondary: `bg-white text-black border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]`
- Danger: `bg-signal text-white border-2 border-black shadow-[4px_4px_0_#000] hover:shadow-[2px_2px_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]`

### Card

`bg-white border-2 border-black p-4 md:p-6`

### Input

`w-full px-3 py-2 border-2 border-black bg-white focus:outline-none focus-visible:outline-[3px] focus-visible:outline-black placeholder:text-gray-400`

### Badge

`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wide border border-black`
+ color variant: `bg-tanne text-white` / `bg-sonne text-black` / `bg-signal text-white` / `bg-himmel text-white` / `bg-gray-100 text-black`
```

---

*Source: `src/app/globals.css`, `src/components/ui/` — last audited against implementation 2026-03-27.*
