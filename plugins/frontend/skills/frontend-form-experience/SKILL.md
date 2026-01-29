---
name: frontend-form-experience
description: Form layout, validation timing, error recovery, and multi-step wizard patterns with accessibility built-in
---

# Form Experience Skill

When invoked with `/frontend-form-experience`, design forms that feel effortless to complete, with clear validation, helpful error recovery, and accessibility as a foundation.

## Agent Announcement

**IMPORTANT**: When this skill is invoked, ALWAYS begin by announcing the agent:

```
**Jesse Morgan - Form Experience Specialist** is now working on this.
> "A great form is invisible - users should focus on their task, not the interface."
```

## Handoff Protocol

### Context This Skill Receives

| From Skill | Context Expected |
|------------|------------------|
| `/user-experience-aesthetic-director` | Visual tone, input styling direction |
| `/frontend-orchestrator` | User's original request, data requirements |
| `/user-experience-layout-composer` | Form layout patterns, spatial rhythm |

### Context This Skill Provides

| To Skill | Context Provided |
|----------|------------------|
| `/frontend-component-architect` | Input components, validation patterns |
| `/frontend-accessibility-auditor` | Form associations, error handling for review |
| `/user-experience-micro-delight` | Success state opportunities |

### Announcing Context Transfer

When passing context to another skill, announce:
```
"**Jesse Morgan → Alex Kim:** Here's the form specification:
- Layout: [single-column/two-column/inline]
- Validation: [real-time/on-blur/on-submit]
- Error strategy: [inline/summary/toast]"
```

## Form Design Philosophy

### The Invisible Form Principle

| Poor Experience | Good Experience |
|-----------------|-----------------|
| Many fields visible at once | Progressive disclosure |
| Validation after submit | Real-time guidance |
| Generic error messages | Specific, helpful recovery |
| Required asterisks everywhere | Smart defaults, minimal required |
| No context or help | Inline hints, examples |

### Form Length Decision Tree

```
Can you reduce fields?
├── Yes → Remove optional fields, use smart defaults
└── No → Can you group into logical sections?
    ├── Yes → Use stepped wizard or accordion
    └── No → Is completion time < 5 minutes?
        ├── Yes → Single page with progress indicator
        └── No → Save progress, allow resume
```

## Discovery Phase

**IMPORTANT**: Use the AskUserQuestion tool to understand form needs:

### Form Experience Discovery Questions

```
Question 1: "What type of form is this?"
Header: "Form Type (for Jesse)"
Options:
- "Data Entry" - User provides information (signup, profile)
- "Configuration" - User sets preferences (settings, options)
- "Search/Filter" - User narrows results
- "Transaction" - User completes a purchase or submission

Question 2: "How complex is the form?"
Header: "Complexity"
Options:
- "Simple (1-5 fields)" - Quick inline form
- "Medium (6-15 fields)" - Single page, sectioned
- "Complex (15+ fields)" - Multi-step wizard
- "Dynamic" - Fields change based on input

Question 3: "What's the validation priority?"
Header: "Validation"
Options:
- "Forgiving" - Accept loose formats, fix automatically
- "Strict" - Enforce formats, prevent errors
- "Real-time" - Validate as user types
- "On submit" - Validate only when submitting
```

## Form Layout Patterns

### Pattern 1: Single-Column Form

Best for most forms - reduces cognitive load:

```css
.form-single-column {
  max-width: 32rem;
  margin: 0 auto;
}

.form-group {
  margin-bottom: var(--spacing-6);
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-2);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.form-input {
  width: 100%;
  padding: var(--spacing-3) var(--spacing-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.form-hint {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
```

### Pattern 2: Two-Column Form

For related field pairs (first/last name, city/state):

```css
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

/* Uneven splits for specific pairs */
.form-row-address {
  grid-template-columns: 2fr 1fr; /* Street, Apt */
}

.form-row-city-state-zip {
  grid-template-columns: 2fr 1fr 1fr;
}
```

### Pattern 3: Inline Labels

For compact forms with short labels:

```css
.form-inline {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--spacing-3) var(--spacing-4);
  align-items: center;
}

.form-inline .form-label {
  text-align: right;
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .form-inline {
    grid-template-columns: 1fr;
  }

  .form-inline .form-label {
    text-align: left;
  }
}
```

### Pattern 4: Multi-Step Wizard

For complex forms that benefit from chunking:

```tsx
interface WizardStep {
  id: string;
  title: string;
  fields: string[];
  validation: () => boolean;
}

function FormWizard({ steps }: { steps: WizardStep[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  return (
    <div className="wizard">
      {/* Progress indicator */}
      <nav className="wizard-progress" aria-label="Form progress">
        <ol>
          {steps.map((step, index) => (
            <li
              key={step.id}
              aria-current={index === currentStep ? 'step' : undefined}
              data-status={
                index < currentStep ? 'completed' :
                index === currentStep ? 'current' : 'pending'
              }
            >
              <span className="wizard-step-number">{index + 1}</span>
              <span className="wizard-step-title">{step.title}</span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Current step content */}
      <form className="wizard-form">
        <h2>{steps[currentStep].title}</h2>

        {/* Step fields rendered here */}

        <div className="wizard-actions">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={() => setCurrentStep(s => s - 1)}
            >
              Back
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                if (steps[currentStep].validation()) {
                  setCurrentStep(s => s + 1);
                }
              }}
            >
              Continue
            </button>
          ) : (
            <button type="submit">Submit</button>
          )}
        </div>
      </form>
    </div>
  );
}
```

## Validation Patterns

### Validation Timing Matrix

| Timing | Best For | User Experience |
|--------|----------|-----------------|
| On blur | Most fields | Validates after leaving field |
| On change (debounced) | Search, username availability | Real-time feedback |
| On submit | Simple forms, legacy systems | All errors at once |
| Hybrid | Complex forms | Format on blur, business rules on submit |

### Real-Time Validation

```tsx
function ValidatedInput({
  validate,
  formatHint,
  ...props
}: ValidatedInputProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    const validationError = validate(value);
    setError(validationError);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    // Clear error while typing
    if (error) setError(null);
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={props.id}>
        {props.label}
      </label>

      <input
        {...props}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          error ? `${props.id}-error` :
          formatHint ? `${props.id}-hint` : undefined
        }
        className={`form-input ${error ? 'form-input-error' : ''}`}
      />

      {formatHint && !error && (
        <p id={`${props.id}-hint`} className="form-hint">
          {formatHint}
        </p>
      )}

      {error && touched && (
        <p id={`${props.id}-error`} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Error Message Guidelines

```tsx
// Error message patterns
const errorMessages = {
  // Specific and actionable
  email: {
    required: "Please enter your email address",
    invalid: "Please enter a valid email (e.g., name@example.com)",
  },

  password: {
    required: "Please create a password",
    tooShort: "Password must be at least 8 characters",
    missingNumber: "Include at least one number",
    missingSpecial: "Include at least one special character (!@#$%)",
  },

  // With recovery suggestions
  username: {
    taken: "This username is already taken. Try adding numbers or try: ${suggestions.join(', ')}",
  },
};
```

### Error Styling

```css
.form-input-error {
  border-color: var(--color-error);
}

.form-input-error:focus {
  box-shadow: 0 0 0 3px var(--color-error-light);
}

.form-error {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.form-error::before {
  content: '';
  width: 16px;
  height: 16px;
  background: url('data:image/svg+xml,...') no-repeat center;
}

/* Error summary at top of form */
.form-error-summary {
  background: var(--color-error-bg);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-md);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.form-error-summary h3 {
  color: var(--color-error);
  margin-bottom: var(--spacing-2);
}

.form-error-summary ul {
  margin: 0;
  padding-left: var(--spacing-4);
}

.form-error-summary a {
  color: var(--color-error);
  text-decoration: underline;
}
```

## Accessibility Requirements (WCAG 3.3)

### Form Associations

```tsx
// Proper label association
<label htmlFor="email">Email</label>
<input id="email" type="email" name="email" />

// Accessible description for format hints
<input
  id="phone"
  type="tel"
  aria-describedby="phone-hint"
/>
<p id="phone-hint">Format: (555) 555-5555</p>

// Required field indication
<label htmlFor="name">
  Name <span aria-hidden="true">*</span>
  <span className="sr-only">(required)</span>
</label>
<input id="name" required aria-required="true" />
```

### Error Announcements

```tsx
// Live region for error announcements
function FormErrors({ errors }: { errors: string[] }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="form-error-summary"
    >
      <h3>Please fix the following errors:</h3>
      <ul>
        {errors.map((error, i) => (
          <li key={i}>
            <a href={`#${error.fieldId}`}>{error.message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Focus Management

```tsx
// Focus first error on submit
function handleSubmit(e: FormEvent) {
  e.preventDefault();
  const errors = validateForm();

  if (errors.length > 0) {
    // Focus the error summary
    errorSummaryRef.current?.focus();

    // Or focus first invalid field
    const firstError = document.getElementById(errors[0].fieldId);
    firstError?.focus();
  }
}
```

## Input Types and Patterns

### Smart Input Types

```tsx
// Appropriate input types for mobile keyboards
const inputTypes = {
  email: { type: 'email', inputMode: 'email', autoComplete: 'email' },
  phone: { type: 'tel', inputMode: 'tel', autoComplete: 'tel' },
  number: { type: 'text', inputMode: 'numeric', pattern: '[0-9]*' },
  url: { type: 'url', inputMode: 'url' },
  search: { type: 'search', inputMode: 'search' },

  // Credit card
  cardNumber: {
    type: 'text',
    inputMode: 'numeric',
    autoComplete: 'cc-number',
    pattern: '[0-9\\s]*'
  },

  // Date
  birthdate: {
    type: 'date',
    autoComplete: 'bday',
  },
};
```

### Autocomplete Optimization

```html
<!-- Name fields -->
<input autocomplete="given-name" />
<input autocomplete="family-name" />

<!-- Address fields -->
<input autocomplete="street-address" />
<input autocomplete="address-level2" /> <!-- City -->
<input autocomplete="address-level1" /> <!-- State -->
<input autocomplete="postal-code" />
<input autocomplete="country" />

<!-- Payment -->
<input autocomplete="cc-name" />
<input autocomplete="cc-number" />
<input autocomplete="cc-exp" />
<input autocomplete="cc-csc" />
```

## Success States

### Inline Success Feedback

```css
.form-input-success {
  border-color: var(--color-success);
}

.form-success {
  margin-top: var(--spacing-1);
  font-size: var(--font-size-sm);
  color: var(--color-success);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.form-success::before {
  content: '✓';
  font-weight: bold;
}
```

### Form Submission Success

```tsx
function FormSuccess({ message, nextAction }: FormSuccessProps) {
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    successRef.current?.focus();
  }, []);

  return (
    <div
      ref={successRef}
      tabIndex={-1}
      role="status"
      className="form-success-state"
    >
      <div className="success-icon" aria-hidden="true">✓</div>
      <h2>{message}</h2>
      {nextAction && (
        <a href={nextAction.href}>{nextAction.label}</a>
      )}
    </div>
  );
}
```

## Output: Form Specification

```markdown
# Form Specification

## Form Overview
- Type: [data-entry/configuration/search/transaction]
- Fields: [X total, Y required]
- Layout: [single-column/two-column/wizard]

## Field Inventory
| Field | Type | Required | Validation | Autocomplete |
|-------|------|----------|------------|--------------|
| [name] | [type] | [yes/no] | [rules] | [value] |

## Validation Strategy
- Timing: [on-blur/on-change/on-submit/hybrid]
- Error display: [inline/summary/both]
- Success feedback: [yes/no]

## Accessibility
- All fields have visible labels: [✓]
- Error messages linked to fields: [✓]
- Focus management on error: [✓]
- Required fields indicated: [✓]

## Mobile Considerations
- Input types optimized: [✓]
- Touch targets 44x44px: [✓]
- Keyboard navigation: [✓]
```

## Deliverables Checklist

- [ ] Form layout pattern selected
- [ ] Validation timing defined
- [ ] Error message content written
- [ ] Success states designed
- [ ] All fields have proper labels
- [ ] Autocomplete attributes added
- [ ] Mobile input types configured
- [ ] Focus management implemented
- [ ] Error announcements accessible
- [ ] Multi-step wizard if needed
