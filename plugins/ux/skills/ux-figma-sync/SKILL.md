---
name: ux-figma-sync
description: Figma Variables to code sync, Token Studio integration, and design spec extraction
---

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Cameron Reyes - Design Systems Coordinator** is now working on this.
> "Design and code should speak the same language."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| design-system | Token definitions |
| component-architect | Component structure |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| orchestrator | Sync status |
| design-system | Figma updates |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Cameron Reyes → [Next Team Member]:** Figma sync complete. [X] tokens exported, [Y] components mapped. [Status/next steps]."
```

# Figma Sync Skill

When invoked with `/ux-figma-sync`, synchronize design decisions between Figma and code through variables, tokens, and design specs.

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

```
Question 1: "What's your Figma sync goal?"
Header: "Goal"
Options:
- "Variables to Code" - Export Figma Variables as CSS/JSON
- "Token Studio" - Sync with Tokens Studio plugin
- "Design Specs" - Extract specs from designs
- "Code to Figma" - Push code changes back to Figma

Question 2: "What token format do you need?"
Header: "Format"
Options:
- "CSS Custom Properties" - Direct CSS variables
- "W3C Design Tokens" - Standard JSON format
- "Style Dictionary" - For multi-platform
- "Tailwind Config" - Tailwind CSS 4.0 @theme

Question 3: "How do you want to sync?"
Header: "Sync Method"
Options:
- "Manual Export" - Export from Figma, import to code
- "GitHub Sync" - Token Studio GitHub integration
- "API" - Figma REST API for automation
- "Build-time" - Transform during build process
```

## Figma Variables Export

### Using Figma REST API
```typescript
// scripts/fetch-figma-tokens.ts
import fetch from 'node-fetch';

const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FILE_KEY = process.env.FIGMA_FILE_KEY;

interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING';
  valuesByMode: Record<string, any>;
}

async function fetchFigmaVariables() {
  const response = await fetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/variables/local`,
    {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN!,
      },
    }
  );

  const data = await response.json();
  return data.meta.variables;
}

function transformToCSS(variables: Record<string, FigmaVariable>) {
  let css = ':root {\n';

  for (const variable of Object.values(variables)) {
    const name = variable.name.toLowerCase().replace(/\//g, '-');
    const value = Object.values(variable.valuesByMode)[0];

    if (variable.resolvedType === 'COLOR') {
      const { r, g, b, a } = value;
      const rgb = `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)} / ${a})`;
      css += `  --${name}: ${rgb};\n`;
    } else if (variable.resolvedType === 'FLOAT') {
      css += `  --${name}: ${value}px;\n`;
    }
  }

  css += '}\n';
  return css;
}

async function main() {
  const variables = await fetchFigmaVariables();
  const css = transformToCSS(variables);
  console.log(css);
}

main();
```

### Figma Variables to Tailwind 4.0
```typescript
// scripts/figma-to-tailwind.ts
interface FigmaVariables {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
}

function toTailwindTheme(variables: FigmaVariables): string {
  return `/* Generated from Figma Variables */
@import "tailwindcss";

@theme {
  /* Colors */
${Object.entries(variables.colors)
  .map(([name, value]) => `  --color-${name}: ${value};`)
  .join('\n')}

  /* Spacing */
${Object.entries(variables.spacing)
  .map(([name, value]) => `  --spacing-${name}: ${value}px;`)
  .join('\n')}

  /* Radius */
${Object.entries(variables.radius)
  .map(([name, value]) => `  --radius-${name}: ${value}px;`)
  .join('\n')}
}
`;
}
```

## Token Studio Integration

### Token Structure
```json
// tokens/core.json (Token Studio format)
{
  "color": {
    "primitive": {
      "blue": {
        "50": { "value": "#eff6ff", "type": "color" },
        "500": { "value": "#3b82f6", "type": "color" },
        "900": { "value": "#1e3a8a", "type": "color" }
      }
    },
    "semantic": {
      "primary": {
        "value": "{color.primitive.blue.500}",
        "type": "color"
      },
      "background": {
        "default": { "value": "#ffffff", "type": "color" },
        "muted": { "value": "{color.primitive.blue.50}", "type": "color" }
      }
    }
  },
  "spacing": {
    "xs": { "value": "4", "type": "spacing" },
    "sm": { "value": "8", "type": "spacing" },
    "md": { "value": "16", "type": "spacing" },
    "lg": { "value": "24", "type": "spacing" },
    "xl": { "value": "32", "type": "spacing" }
  }
}
```

### GitHub Sync Setup
```yaml
# .github/workflows/tokens-sync.yml
name: Sync Design Tokens

on:
  push:
    branches: [main]
    paths:
      - 'tokens/**'

jobs:
  transform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Transform tokens
        run: npm run tokens:build

      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: update generated token files'
          file_pattern: 'src/styles/tokens.css'
```

### Style Dictionary Transform
```javascript
// config/style-dictionary.config.js
import StyleDictionary from 'style-dictionary';

export default {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
          },
        },
      ],
    },
    tailwind: {
      transformGroup: 'js',
      buildPath: 'config/',
      files: [
        {
          destination: 'tailwind.tokens.js',
          format: 'javascript/esm',
        },
      ],
    },
  },
};
```

## Design Spec Extraction

### Component Specs from Figma
```typescript
// scripts/extract-component-specs.ts
interface ComponentSpec {
  name: string;
  variants: string[];
  properties: {
    width: number | 'auto';
    height: number | 'auto';
    padding: { top: number; right: number; bottom: number; left: number };
    borderRadius: number;
    fills: Array<{ type: string; color: string; opacity: number }>;
    strokes: Array<{ type: string; color: string; weight: number }>;
  };
  typography?: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    letterSpacing: number;
  };
}

async function extractComponentSpecs(nodeId: string): Promise<ComponentSpec> {
  const response = await fetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${nodeId}`,
    {
      headers: { 'X-Figma-Token': FIGMA_TOKEN! },
    }
  );

  const data = await response.json();
  const node = data.nodes[nodeId].document;

  return {
    name: node.name,
    variants: extractVariants(node),
    properties: extractProperties(node),
    typography: extractTypography(node),
  };
}
```

### Generate Component Skeleton
```typescript
// scripts/generate-component.ts
function generateComponentFromSpec(spec: ComponentSpec): string {
  return `// Generated from Figma: ${spec.name}
import { cn } from '@/lib/utils';

interface ${spec.name}Props {
  variant?: ${spec.variants.map(v => `'${v}'`).join(' | ')};
  children: React.ReactNode;
  className?: string;
}

export function ${spec.name}({
  variant = '${spec.variants[0]}',
  children,
  className,
}: ${spec.name}Props) {
  return (
    <div
      className={cn(
        // Base styles from Figma
        'rounded-[${spec.properties.borderRadius}px]',
        'px-[${spec.properties.padding.left}px]',
        'py-[${spec.properties.padding.top}px]',
        // Variant styles
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  );
}

const variants = {
${spec.variants.map(v => `  ${v}: '',`).join('\n')}
};
`;
}
```

## W3C Design Token Format

### Token Structure
```json
// tokens/w3c-format.json
{
  "$schema": "https://design-tokens.org/schema.json",
  "color": {
    "primary": {
      "$value": "#3b82f6",
      "$type": "color",
      "$description": "Primary brand color"
    },
    "background": {
      "default": {
        "$value": "#ffffff",
        "$type": "color"
      },
      "subtle": {
        "$value": "{color.neutral.50}",
        "$type": "color"
      }
    }
  },
  "spacing": {
    "base": {
      "$value": "4px",
      "$type": "dimension"
    },
    "scale": {
      "1": { "$value": "{spacing.base}", "$type": "dimension" },
      "2": { "$value": "calc({spacing.base} * 2)", "$type": "dimension" },
      "4": { "$value": "calc({spacing.base} * 4)", "$type": "dimension" }
    }
  }
}
```

### Transform W3C to CSS
```typescript
// scripts/w3c-to-css.ts
function transformW3CTokens(tokens: object, prefix = ''): string {
  let css = '';

  for (const [key, value] of Object.entries(tokens)) {
    const path = prefix ? `${prefix}-${key}` : key;

    if (value.$value !== undefined) {
      // It's a token
      const resolvedValue = resolveReference(value.$value, tokens);
      css += `  --${path}: ${resolvedValue};\n`;
    } else if (typeof value === 'object') {
      // It's a group, recurse
      css += transformW3CTokens(value, path);
    }
  }

  return css;
}

function resolveReference(value: string, tokens: object): string {
  const refMatch = value.match(/\{(.+)\}/);
  if (!refMatch) return value;

  const path = refMatch[1].split('.');
  let resolved = tokens;
  for (const segment of path) {
    resolved = resolved[segment];
  }

  return (resolved as any).$value || value;
}
```

## Bi-Directional Sync

### Push Code Changes to Figma
```typescript
// scripts/push-to-figma.ts
async function updateFigmaVariables(
  variables: Record<string, string>
) {
  // Note: Requires Figma Enterprise or specific plugin
  // This is a conceptual example

  for (const [name, value] of Object.entries(variables)) {
    await fetch(
      `https://api.figma.com/v1/files/${FILE_KEY}/variables`,
      {
        method: 'POST',
        headers: {
          'X-Figma-Token': FIGMA_TOKEN!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variableId: getVariableId(name),
          value: parseValue(value),
        }),
      }
    );
  }
}
```

## Automation Setup

### NPM Scripts
```json
// package.json
{
  "scripts": {
    "tokens:fetch": "tsx scripts/fetch-figma-tokens.ts",
    "tokens:build": "style-dictionary build --config config/style-dictionary.config.js",
    "tokens:sync": "npm run tokens:fetch && npm run tokens:build",
    "figma:specs": "tsx scripts/extract-component-specs.ts"
  }
}
```

### Pre-commit Hook
```bash
# .husky/pre-commit
npm run tokens:build
git add src/styles/tokens.css
```

## Team Consultation

- **Sam (Systems):** Token naming conventions and structure
- **Alex (Architecture):** Component generation patterns
- **Taylor (Performance):** Token file size optimization

## Deliverables Checklist

- [ ] Figma Variables or Token Studio configured
- [ ] Token transform pipeline set up
- [ ] CSS Custom Properties generated
- [ ] Tailwind theme integration (if applicable)
- [ ] CI/CD automation for sync
- [ ] Documentation of token changes
- [ ] Versioning strategy for tokens
