---
name: ux-storybook
description: Component documentation with Storybook 8, CSF3 format, and testing integration
---

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Parker Lee - Documentation Specialist** is now working on this.
> "Good documentation is the bridge between design and development."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| component-architect | Component specs |
| design-system | Tokens |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| orchestrator | Documentation deliverables |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Parker Lee → [Next Team Member]:** Documentation complete for [component/system]. Stories cover [variants/states]. Ready for [next phase]."
```

# Storybook Skill

When invoked with `/ux-storybook`, set up and create Storybook documentation for component libraries using modern CSF3 format.

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to gather requirements:

```
Question 1: "What's your Storybook goal?"
Header: "Goal"
Options:
- "Setup" - Install and configure Storybook
- "Add Stories" - Create stories for existing components
- "Documentation" - Add MDX docs and guides
- "Testing" - Set up interaction and visual tests

Question 2: "Which framework are you using?"
Header: "Framework"
Options:
- "React/Next.js" - React 18/19 with optional Next.js
- "Vue 3" - Vue with Composition API
- "Svelte" - Svelte 4 or 5
- "Web Components" - Framework-agnostic

Question 3: "What addons do you need?"
Header: "Addons"
MultiSelect: true
Options:
- "A11y" - Accessibility testing (recommended)
- "Interactions" - Play function testing
- "Design" - Figma integration
- "Themes" - Dark mode support
```

## Storybook 8 Setup

### Installation
```bash
# Initialize Storybook in existing project
npx storybook@latest init

# Or with specific framework
npx storybook@latest init --type react
```

### Configuration
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### Preview Configuration
```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

## CSF3 Story Format

### Basic Component Story
```tsx
// components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
      description: 'Button style variant',
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Primary variant
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

// Secondary variant
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

// All sizes
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

// Loading state
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};
```

### Interactive Testing
```tsx
// components/Form/LoginForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { LoginForm } from './LoginForm';

const meta: Meta<typeof LoginForm> = {
  title: 'Forms/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {};

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and fill email input
    const emailInput = canvas.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'user@example.com');

    // Find and fill password input
    const passwordInput = canvas.getByLabelText(/password/i);
    await userEvent.type(passwordInput, 'password123');

    // Verify inputs have values
    await expect(emailInput).toHaveValue('user@example.com');
    await expect(passwordInput).toHaveValue('password123');
  },
};

export const SubmitForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(canvas.getByLabelText(/password/i), 'password123');

    // Click submit
    await userEvent.click(canvas.getByRole('button', { name: /sign in/i }));

    // Verify loading state or success
    await expect(canvas.getByRole('button')).toBeDisabled();
  },
};

export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Submit without filling
    await userEvent.click(canvas.getByRole('button', { name: /sign in/i }));

    // Expect error message
    await expect(canvas.getByText(/email is required/i)).toBeInTheDocument();
  },
};
```

### Compound Component Stories
```tsx
// components/Card/Card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  subcomponents: {
    'Card.Header': Card.Header,
    'Card.Body': Card.Body,
    'Card.Footer': Card.Footer,
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Complete: Story = {
  render: () => (
    <Card>
      <Card.Header>
        <h2 className="text-lg font-semibold">Card Title</h2>
      </Card.Header>
      <Card.Body>
        <p>Card content goes here. This is the main body of the card.</p>
      </Card.Body>
      <Card.Footer>
        <button className="btn-primary">Action</button>
      </Card.Footer>
    </Card>
  ),
};

export const HeaderOnly: Story = {
  render: () => (
    <Card>
      <Card.Header>
        <h2>Simple Header Card</h2>
      </Card.Header>
      <Card.Body>
        <p>Content without footer.</p>
      </Card.Body>
    </Card>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <Card variant="default">
        <Card.Body>Default Card</Card.Body>
      </Card>
      <Card variant="outlined">
        <Card.Body>Outlined Card</Card.Body>
      </Card>
    </div>
  ),
};
```

## MDX Documentation

### Component Documentation
```mdx
{/* components/Button/Button.mdx */}
import { Meta, Story, Canvas, Controls, ArgTypes } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button

Buttons trigger actions when clicked. Use the appropriate variant based on the action's importance.

## Usage Guidelines

- **Primary**: Main call-to-action, one per view
- **Secondary**: Alternative actions
- **Ghost**: Low-emphasis actions

## Examples

<Canvas of={ButtonStories.Primary} />

## Interactive Demo

<Canvas of={ButtonStories.Primary} />
<Controls />

## All Variants

<Canvas of={ButtonStories.Sizes} />

## Accessibility

- Includes focus ring for keyboard navigation
- Loading state announced to screen readers
- Disabled state prevents interaction and announces disabled

## Props

<ArgTypes of={ButtonStories} />
```

### Design System Docs
```mdx
{/* docs/DesignTokens.mdx */}
import { Meta, ColorPalette, ColorItem, Typeset } from '@storybook/blocks';

<Meta title="Design System/Tokens" />

# Design Tokens

## Colors

<ColorPalette>
  <ColorItem
    title="Primary"
    subtitle="Brand primary color"
    colors={{
      '500': 'oklch(0.55 0.2 250)',
      '400': 'oklch(0.65 0.2 250)',
      '600': 'oklch(0.45 0.2 250)',
    }}
  />
  <ColorItem
    title="Neutral"
    subtitle="Gray scale"
    colors={{
      '50': 'oklch(0.985 0 0)',
      '500': 'oklch(0.55 0 0)',
      '900': 'oklch(0.15 0 0)',
    }}
  />
</ColorPalette>

## Typography

<Typeset
  fontSizes={['0.75rem', '0.875rem', '1rem', '1.125rem', '1.25rem', '1.5rem', '2rem']}
  fontWeight={400}
  sampleText="The quick brown fox jumps over the lazy dog"
  fontFamily="system-ui, sans-serif"
/>
```

## Accessibility Testing

### A11y Addon Configuration
```typescript
// .storybook/preview.ts
import { A11yConfig } from '@storybook/addon-a11y';

const preview: Preview = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
      options: {
        runOnly: ['wcag2a', 'wcag2aa'],
      },
    },
  },
};
```

### A11y Story
```tsx
export const AccessibilityTest: Story = {
  args: {
    variant: 'primary',
    children: 'Accessible Button',
  },
  parameters: {
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: true }],
      },
    },
  },
};
```

## Visual Testing

### Chromatic Integration
```bash
npm install chromatic --save-dev
```

```json
// package.json
{
  "scripts": {
    "chromatic": "chromatic --project-token=<your-token>"
  }
}
```

### Snapshot Testing
```typescript
// stories.test.ts
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import * as stories from './Button.stories';

const { Primary, Secondary } = composeStories(stories);

describe('Button', () => {
  test('Primary renders correctly', () => {
    const { container } = render(<Primary />);
    expect(container).toMatchSnapshot();
  });
});
```

## Team Consultation

- **Alex (Architecture):** Component structure and props design
- **Sam (Systems):** Design token integration
- **Casey (A11y):** Accessibility testing requirements
- **Jordan M (Motion):** Animation documentation

## Deliverables Checklist

- [ ] Storybook installed and configured
- [ ] CSF3 format stories for all components
- [ ] Autodocs enabled with `tags: ['autodocs']`
- [ ] Interactive tests with play functions
- [ ] A11y addon configured
- [ ] MDX documentation for complex components
- [ ] Design tokens documented
- [ ] Deployment configured (Chromatic/Vercel)
