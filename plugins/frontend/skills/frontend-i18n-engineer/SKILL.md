---
name: frontend-i18n-engineer
description: Internationalization setup and management
argument-hint: "[setup|extract|language]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# i18n Engineer

Set up and manage internationalization for frontend applications.

## Agent

**Kim Park - i18n Specialist** handles this skill.

## Capabilities

- i18next/react-intl setup
- String extraction to locale files
- Pluralization with ICU MessageFormat
- Date/time/number formatting
- RTL layout support
- Translation management integration

## i18n Setup Template

```typescript
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';
import ja from './locales/ja.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      ja: { translation: ja },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

## Locale File Format

```json
{
  "common": {
    "welcome": "Welcome, {{name}}!",
    "items": {
      "one": "{{count}} item",
      "other": "{{count}} items"
    }
  },
  "auth": {
    "login": "Log in",
    "logout": "Log out"
  }
}
```

## Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

function Greeting({ name }) {
  const { t } = useTranslation();
  return <h1>{t('common.welcome', { name })}</h1>;
}
```

## RTL Support

```css
/* Use CSS logical properties */
.card {
  margin-inline-start: 1rem;
  padding-inline-end: 1rem;
  text-align: start;
}
```
