---
name: ux-design-system
description: Design tokens, theming, and styling foundations with Style Dictionary and Tailwind CSS 4.0 - aesthetic-aware implementation
---

# Design System Skill

When invoked with `/ux-design-system`, create or extend design system foundations including tokens, themes, and styling infrastructure.

## Aesthetic-First Integration

**IMPORTANT**: This skill should consume output from `/ux-aesthetic-director`, `/ux-typography-curator`, and `/ux-color-alchemist` when available. Tokens should express the aesthetic personality, not just provide values.

### Anti-Generic Guidelines

Before implementing tokens, verify the design system avoids these traps:

| Anti-Pattern | Detection | Alternative |
|--------------|-----------|-------------|
| **AI Purple** | `#6366f1`, `#8b5cf6` in palette | Shift hue for character, or choose different primary |
| **Inter as default** | Inter without rationale | Require intentional font choice with personality |
| **Generic gray scale** | Using Tailwind's neutral without adjustment | Add subtle color cast to neutrals (warm/cool undertone) |
| **Uniform spacing** | Same padding everywhere | Create rhythm with varied spacing tokens |
| **Standard shadows** | Copy-paste elevation system | Design shadows that fit the aesthetic (soft, hard, colored) |

### Token Personality Layer

Beyond semantic tokens, include an "aesthetic personality" layer:

```css
:root {
  /* === AESTHETIC PERSONALITY TOKENS === */

  /* Design DNA (from aesthetic brief) */
  --aesthetic-archetype: "tech-forward";  /* brutalist | editorial | organic | tech-forward */
  --aesthetic-tone: "confident";          /* bold | calm | playful | premium */

  /* Atmospheric tokens */
  --atmosphere-grain-opacity: 0.04;
  --atmosphere-gradient-enabled: true;
  --atmosphere-glow-color: oklch(0.7 0.15 250 / 0.2);

  /* Motion personality */
  --motion-personality: "decisive";       /* decisive | flowing | bouncy | precise */
  --motion-duration-base: 200ms;          /* Adjusted per personality */
  --motion-easing-default: cubic-bezier(0.4, 0, 0.2, 1);

  /* Depth expression */
  --depth-approach: "layered";            /* flat | soft | layered | dramatic */
  --shadow-color-cast: 250;               /* Hue for shadow color */
}
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements before implementation:

### Token Foundation Questions

```
Question 1: "What token format do you need?"
Header: "Token Format"
Options:
- "W3C Design Tokens" - Standard JSON format, maximum portability
- "Style Dictionary" - Transforms for multiple platforms
- "CSS Custom Properties" - Direct CSS variables
- "Tailwind Config" - Tailwind-native configuration

Question 2: "Do you have existing brand colors?"
Header: "Brand Colors"
Options:
- "Yes, provide them" - I'll share hex/RGB values
- "Generate palette" - Create a cohesive palette from a primary color
- "Use preset" - Choose from popular palettes (Radix, Tailwind, etc.)

Question 3: "What theme requirements do you have?"
Header: "Theming"
MultiSelect: true
Options:
- "Light mode" - Default light theme
- "Dark mode" - Dark theme with proper contrast
- "System preference" - Respect prefers-color-scheme
- "Custom themes" - User-selectable brand themes
```

### Typography Questions

```
Question 4: "Typography scale preference?"
Header: "Type Scale"
Options:
- "Modular (1.25)" - Classic typographic scale
- "Perfect Fourth (1.333)" - More dramatic hierarchy
- "Custom" - Define your own ratios
- "Fluid" - Viewport-responsive sizing

Question 5: "Font stack approach?"
Header: "Fonts"
Options:
- "System fonts" - Native OS fonts, best performance
- "Variable fonts" - Single file, multiple weights
- "Google Fonts" - Specify font families
- "Custom fonts" - Self-hosted font files
```

## Implementation Approaches

### Approach 1: W3C Design Tokens (Recommended for new projects)

```json
// tokens/color.tokens.json
{
  "$schema": "https://design-tokens.org/schema.json",
  "color": {
    "primitive": {
      "blue": {
        "50": { "$value": "#eff6ff", "$type": "color" },
        "500": { "$value": "#3b82f6", "$type": "color" },
        "900": { "$value": "#1e3a8a", "$type": "color" }
      }
    },
    "semantic": {
      "primary": { "$value": "{color.primitive.blue.500}", "$type": "color" },
      "background": {
        "default": { "$value": "#ffffff", "$type": "color" },
        "subtle": { "$value": "{color.primitive.blue.50}", "$type": "color" }
      }
    }
  }
}
```

### Approach 2: Style Dictionary 4.0

```javascript
// config/style-dictionary.config.js
import StyleDictionary from 'style-dictionary';

export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/css/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables',
        options: {
          outputReferences: true
        }
      }]
    },
    tailwind: {
      transformGroup: 'js',
      buildPath: 'dist/tailwind/',
      files: [{
        destination: 'tokens.js',
        format: 'javascript/esm'
      }]
    }
  }
};
```

### Approach 3: Tailwind CSS 4.0

```css
/* styles/theme.css */
@import "tailwindcss";

@theme {
  /* Color tokens */
  --color-primary-50: oklch(0.97 0.02 250);
  --color-primary-500: oklch(0.55 0.2 250);
  --color-primary-900: oklch(0.25 0.15 250);

  /* Semantic colors */
  --color-background: var(--color-primary-50);
  --color-foreground: var(--color-primary-900);

  /* Typography scale */
  --font-size-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  --font-size-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --font-size-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --font-size-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);

  /* Spacing scale (4px base) */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: var(--color-primary-900);
    --color-foreground: var(--color-primary-50);
  }
}
```

### Approach 4: CSS Layers with Custom Properties

```css
/* styles/tokens.css */
@layer tokens {
  :root {
    /* Color primitives using OKLCH for perceptual uniformity */
    --color-gray-50: oklch(0.985 0 0);
    --color-gray-100: oklch(0.965 0 0);
    --color-gray-200: oklch(0.925 0 0);
    --color-gray-300: oklch(0.87 0 0);
    --color-gray-400: oklch(0.7 0 0);
    --color-gray-500: oklch(0.55 0 0);
    --color-gray-600: oklch(0.45 0 0);
    --color-gray-700: oklch(0.35 0 0);
    --color-gray-800: oklch(0.25 0 0);
    --color-gray-900: oklch(0.15 0 0);

    /* Semantic tokens */
    --surface-primary: var(--color-gray-50);
    --surface-secondary: var(--color-gray-100);
    --text-primary: var(--color-gray-900);
    --text-secondary: var(--color-gray-600);
    --border-default: var(--color-gray-200);

    /* Animation tokens */
    --duration-fast: 150ms;
    --duration-normal: 250ms;
    --duration-slow: 400ms;
    --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
    --easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  [data-theme="dark"] {
    --surface-primary: var(--color-gray-900);
    --surface-secondary: var(--color-gray-800);
    --text-primary: var(--color-gray-50);
    --text-secondary: var(--color-gray-400);
    --border-default: var(--color-gray-700);
  }
}
```

## Multi-Theme Implementation

```typescript
// lib/theme.ts
type Theme = 'light' | 'dark' | 'system';

export function initTheme() {
  const stored = localStorage.getItem('theme') as Theme | null;
  const theme = stored || 'system';
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = prefersDark ? 'dark' : 'light';
  } else {
    root.dataset.theme = theme;
  }

  localStorage.setItem('theme', theme);
}

// React hook
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
    applyTheme(next);
  };

  return { theme, setTheme: (t: Theme) => { setTheme(t); applyTheme(t); }, toggle };
}
```

## Output Structure

```
src/
├── tokens/
│   ├── color.tokens.json
│   ├── typography.tokens.json
│   ├── spacing.tokens.json
│   └── index.json
├── styles/
│   ├── tokens.css          # Generated CSS variables
│   ├── theme.css           # Theme switching logic
│   └── globals.css         # Global styles
├── lib/
│   └── theme.ts            # Theme utilities
└── tailwind.config.ts      # If using Tailwind
```

## Live Browser Verification with Playwright MCP

Use the Playwright MCP tools to verify design system implementation in a live browser.

### Theme Switching Verification

```
# Test light/dark mode switching
1. Navigate to the app:
   mcp__plugin_playwright_playwright__browser_navigate({ url: "http://localhost:3000" })

2. Get current theme state:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => ({
       theme: document.documentElement.dataset.theme,
       colorScheme: getComputedStyle(document.documentElement).colorScheme,
       backgroundColor: getComputedStyle(document.body).backgroundColor,
       textColor: getComputedStyle(document.body).color
     })"
   })

3. Screenshot light mode:
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "theme-light.png" })

4. Toggle to dark mode:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[theme-toggle-ref]", element: "Theme toggle button" })

5. Verify dark mode applied:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => ({
       theme: document.documentElement.dataset.theme,
       backgroundColor: getComputedStyle(document.body).backgroundColor,
       textColor: getComputedStyle(document.body).color
     })"
   })

6. Screenshot dark mode:
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "theme-dark.png" })
```

### CSS Custom Properties Verification

```
# Verify design tokens are applied correctly
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);

    return {
      colors: {
        primary: styles.getPropertyValue('--color-primary'),
        background: styles.getPropertyValue('--color-background'),
        foreground: styles.getPropertyValue('--color-foreground'),
        border: styles.getPropertyValue('--border-default')
      },
      typography: {
        fontSizeBase: styles.getPropertyValue('--font-size-base'),
        fontSizeLg: styles.getPropertyValue('--font-size-lg'),
        fontSizeXl: styles.getPropertyValue('--font-size-xl')
      },
      spacing: {
        spacing1: styles.getPropertyValue('--spacing-1'),
        spacing4: styles.getPropertyValue('--spacing-4'),
        spacing8: styles.getPropertyValue('--spacing-8')
      },
      animation: {
        durationFast: styles.getPropertyValue('--duration-fast'),
        durationNormal: styles.getPropertyValue('--duration-normal'),
        easing: styles.getPropertyValue('--easing-default')
      }
    };
  }"
})
```

### Color Contrast Verification

```
# Verify color contrast meets WCAG requirements
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const getRelativeLuminance = (r, g, b) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const parseColor = (color) => {
      const match = color.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
      if (match) return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      return null;
    };

    const getContrastRatio = (fg, bg) => {
      const l1 = getRelativeLuminance(...fg);
      const l2 = getRelativeLuminance(...bg);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    };

    // Test key text/background combinations
    const body = document.body;
    const bodyStyles = getComputedStyle(body);
    const bgColor = parseColor(bodyStyles.backgroundColor);
    const textColor = parseColor(bodyStyles.color);

    const heading = document.querySelector('h1');
    const headingColor = heading ? parseColor(getComputedStyle(heading).color) : null;

    return {
      bodyContrast: bgColor && textColor ? getContrastRatio(textColor, bgColor).toFixed(2) : null,
      headingContrast: bgColor && headingColor ? getContrastRatio(headingColor, bgColor).toFixed(2) : null,
      meetsAA: bgColor && textColor ? getContrastRatio(textColor, bgColor) >= 4.5 : null,
      meetsAAA: bgColor && textColor ? getContrastRatio(textColor, bgColor) >= 7 : null
    };
  }"
})
```

### Typography Scale Verification

```
# Verify typography tokens are applied correctly
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const elements = {
      h1: document.querySelector('h1'),
      h2: document.querySelector('h2'),
      h3: document.querySelector('h3'),
      p: document.querySelector('p'),
      small: document.querySelector('small')
    };

    return Object.entries(elements).reduce((acc, [tag, el]) => {
      if (el) {
        const styles = getComputedStyle(el);
        acc[tag] = {
          fontSize: styles.fontSize,
          lineHeight: styles.lineHeight,
          fontWeight: styles.fontWeight,
          letterSpacing: styles.letterSpacing
        };
      }
      return acc;
    }, {});
  }"
})
```

### Spacing Token Verification

```
# Verify spacing is consistent across components
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const cards = document.querySelectorAll('.card, [class*=\"Card\"]');
    const buttons = document.querySelectorAll('button');
    const sections = document.querySelectorAll('section');

    return {
      cardPadding: cards[0] ? getComputedStyle(cards[0]).padding : null,
      buttonPadding: buttons[0] ? getComputedStyle(buttons[0]).padding : null,
      sectionMargin: sections[0] ? getComputedStyle(sections[0]).marginBottom : null,
      gridGap: document.querySelector('[class*=\"grid\"]')
        ? getComputedStyle(document.querySelector('[class*=\"grid\"]')).gap
        : null
    };
  }"
})
```

### System Preference Detection

```
# Test system color scheme detection
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => ({
    prefersColorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    prefersContrast: window.matchMedia('(prefers-contrast: more)').matches ? 'more' : 'normal'
  })"
})
```

### Multi-Theme Verification

```
# Test multiple custom themes if available
1. Get available themes:
   mcp__plugin_playwright_playwright__browser_evaluate({
     function: "() => {
       // Check for theme options in UI
       const themeOptions = document.querySelectorAll('[data-theme-option]');
       return Array.from(themeOptions).map(opt => opt.dataset.themeOption);
     }"
   })

2. Apply each theme and screenshot:
   # For each theme:
   mcp__plugin_playwright_playwright__browser_click({ ref: "[theme-option-ref]", element: "Theme option" })
   mcp__plugin_playwright_playwright__browser_take_screenshot({ type: "png", filename: "theme-[name].png" })
```

### Border Radius Token Verification

```
# Verify border radius tokens
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const elements = {
      button: document.querySelector('button'),
      card: document.querySelector('.card'),
      input: document.querySelector('input'),
      badge: document.querySelector('.badge, [class*=\"Badge\"]'),
      avatar: document.querySelector('.avatar, [class*=\"Avatar\"]')
    };

    return Object.entries(elements).reduce((acc, [name, el]) => {
      if (el) {
        acc[name] = getComputedStyle(el).borderRadius;
      }
      return acc;
    }, {});
  }"
})
```

### Shadow Token Verification

```
# Verify shadow tokens are applied
mcp__plugin_playwright_playwright__browser_evaluate({
  function: "() => {
    const cards = document.querySelectorAll('.card, [class*=\"Card\"]');
    const dropdowns = document.querySelectorAll('[class*=\"dropdown\"], [class*=\"menu\"]');
    const modals = document.querySelectorAll('[role=\"dialog\"]');

    return {
      cardShadow: cards[0] ? getComputedStyle(cards[0]).boxShadow : null,
      dropdownShadow: dropdowns[0] ? getComputedStyle(dropdowns[0]).boxShadow : null,
      modalShadow: modals[0] ? getComputedStyle(modals[0]).boxShadow : null
    };
  }"
})
```

### Complete Design System Verification Workflow

```
# Full design system verification using Playwright MCP:

1. **Token Verification**
   - Load app in browser
   - Extract all CSS custom properties
   - Verify values match token definitions

2. **Theme Testing**
   - Screenshot light mode
   - Toggle to dark mode
   - Screenshot dark mode
   - Test system preference detection

3. **Color Contrast**
   - Calculate contrast ratios
   - Verify WCAG AA compliance
   - Check AAA for enhanced compliance

4. **Typography Audit**
   - Verify heading hierarchy
   - Check font sizes match scale
   - Validate line heights

5. **Spacing Consistency**
   - Check component padding
   - Verify grid gaps
   - Validate margins

6. **Visual Regression**
   - Compare screenshots across themes
   - Document any inconsistencies

7. **Cross-Browser Check**
   - Test in different browsers if needed
   - Verify token fallbacks work
```

## Aesthetic Brief Integration

When an Aesthetic Brief is provided (from `/ux-aesthetic-director`), translate it into token decisions:

| Brief Section | Token Impact |
|---------------|--------------|
| **Archetype: Brutalist** | Sharp radii (`--radius-*: 0`), no shadows, high contrast |
| **Archetype: Editorial** | Subtle radii, refined shadows, generous line-height |
| **Archetype: Organic** | Varied radii, soft layered shadows, warm color cast |
| **Archetype: Tech-Forward** | Precise radii, elevation shadows, cool color cast |
| **Tone: Bold** | High saturation accents, larger scale jumps, quick motion |
| **Tone: Calm** | Muted palette, gentle scale, flowing motion |
| **Tone: Playful** | Vibrant colors, bouncy motion, varied radii |
| **Tone: Premium** | Restrained palette, subtle motion, generous whitespace |

### External Integration Points

Consider integrating with established color systems:

- **Radix Colors**: `@radix-ui/colors` for accessible, balanced palettes
- **Open Props**: `open-props` for design token starting point
- **Tailwind**: Extend rather than override when using Tailwind 4.0

## Deliverables Checklist

- [ ] Token files in chosen format
- [ ] CSS custom properties generated
- [ ] Dark mode support implemented
- [ ] Typography scale defined
- [ ] Spacing scale defined
- [ ] Color palette with semantic mappings
- [ ] **Aesthetic personality tokens included**
- [ ] **Anti-generic guidelines verified**
- [ ] **Atmospheric tokens (grain, gradients) if applicable**
- [ ] Theme switching utility (if multi-theme)
- [ ] Documentation of token usage
- [ ] **Playwright MCP theme verification completed**
- [ ] **Color contrast verified via browser**
