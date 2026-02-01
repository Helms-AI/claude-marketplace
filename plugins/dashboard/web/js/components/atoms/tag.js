/**
 * Tag Atom - Chip/badge for labels and categories
 * @module components/atoms/tag
 *
 * Displays a tag/chip for tools, skills, domains, and other labels.
 * Supports domain coloring, optional prefix (like "/" for skills), and removable mode.
 */
import { LitElement, html, css } from 'lit';

class DashTag extends LitElement {
    static properties = {
        label: { type: String },
        variant: { type: String },    // 'default' | 'outline' | 'filled' | 'subtle'
        size: { type: String },       // 'xs' | 'sm' | 'md'
        domain: { type: String },     // Domain for color coding
        icon: { type: String },       // Optional leading icon name
        prefix: { type: String },     // Prefix text (e.g., "/" for skills)
        removable: { type: Boolean }, // Show remove button
        clickable: { type: Boolean }  // Show pointer cursor and hover state
    };

    static styles = css`
        :host {
            display: inline-flex;
        }

        .tag {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            font-family: var(--font-sans);
            font-weight: 500;
            border-radius: var(--radius-sm, 4px);
            white-space: nowrap;
            transition: all var(--transition-fast, 150ms ease);
        }

        /* Sizes */
        .xs {
            height: 18px;
            padding: 0 var(--spacing-xs, 4px);
            font-size: 10px;
        }

        .sm {
            height: 22px;
            padding: 0 var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
        }

        .md {
            height: 26px;
            padding: 0 var(--spacing-md, 12px);
            font-size: var(--font-size-sm, 12px);
        }

        /* Variants */
        .default {
            background: var(--bg-secondary, #f3f4f6);
            color: var(--text-secondary, #6b7280);
            border: 1px solid var(--border-color, #e5e7eb);
        }

        .outline {
            background: transparent;
            color: var(--text-secondary, #6b7280);
            border: 1px solid var(--border-color, #e5e7eb);
        }

        .filled {
            background: var(--accent-color, #3b82f6);
            color: white;
            border: 1px solid transparent;
        }

        .subtle {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-secondary, #6b7280);
            border: 1px solid transparent;
        }

        /* Domain colors */
        .domain-pm {
            --tag-color: var(--domain-pm, #6366f1);
        }
        .domain-user-experience {
            --tag-color: var(--domain-user-experience, #f472b6);
        }
        .domain-frontend {
            --tag-color: var(--domain-frontend, #22d3ee);
        }
        .domain-architecture {
            --tag-color: var(--domain-architecture, #a78bfa);
        }
        .domain-backend {
            --tag-color: var(--domain-backend, #4ade80);
        }
        .domain-testing {
            --tag-color: var(--domain-testing, #facc15);
        }
        .domain-devops {
            --tag-color: var(--domain-devops, #fb923c);
        }
        .domain-data {
            --tag-color: var(--domain-data, #60a5fa);
        }
        .domain-security {
            --tag-color: var(--domain-security, #f87171);
        }
        .domain-documentation {
            --tag-color: var(--domain-documentation, #a3e635);
        }
        .domain-external {
            --tag-color: var(--text-muted, #9ca3af);
        }

        /* Domain variant styling */
        .tag[data-domain].default,
        .tag[data-domain].outline {
            border-color: var(--tag-color);
            color: var(--tag-color);
        }

        .tag[data-domain].filled {
            background: var(--tag-color);
            color: white;
        }

        .tag[data-domain].subtle {
            background: color-mix(in srgb, var(--tag-color) 15%, transparent);
            color: var(--tag-color);
        }

        /* Clickable state */
        .clickable {
            cursor: pointer;
        }

        .clickable:hover {
            filter: brightness(0.95);
        }

        .clickable:active {
            filter: brightness(0.9);
        }

        /* Prefix styling */
        .prefix {
            opacity: 0.7;
        }

        /* Remove button */
        .remove-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            margin-left: 2px;
            margin-right: -4px;
            border: none;
            background: transparent;
            color: inherit;
            opacity: 0.6;
            cursor: pointer;
            border-radius: 50%;
            transition: all var(--transition-fast, 150ms ease);
        }

        .remove-btn:hover {
            opacity: 1;
            background: rgba(0, 0, 0, 0.1);
        }

        /* Icon */
        dash-icon {
            flex-shrink: 0;
        }
    `;

    constructor() {
        super();
        this.label = '';
        this.variant = 'default';
        this.size = 'sm';
        this.domain = '';
        this.icon = '';
        this.prefix = '';
        this.removable = false;
        this.clickable = false;
    }

    _handleClick(e) {
        if (!this.clickable) return;
        this.dispatchEvent(new CustomEvent('dash-click', {
            bubbles: true,
            composed: true,
            detail: { label: this.label }
        }));
    }

    _handleRemove(e) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('dash-remove', {
            bubbles: true,
            composed: true,
            detail: { label: this.label }
        }));
    }

    render() {
        const classes = [this.variant, this.size];
        if (this.domain) classes.push(`domain-${this.domain}`);
        if (this.clickable) classes.push('clickable');

        return html`
            <span
                class="tag ${classes.join(' ')}"
                ?data-domain="${this.domain}"
                @click="${this._handleClick}"
            >
                ${this.icon ? html`<dash-icon name="${this.icon}" size="12"></dash-icon>` : ''}
                ${this.prefix ? html`<span class="prefix">${this.prefix}</span>` : ''}
                <span class="label">${this.label}</span>
                ${this.removable ? html`
                    <button class="remove-btn" @click="${this._handleRemove}" aria-label="Remove">
                        <dash-icon name="x" size="10"></dash-icon>
                    </button>
                ` : ''}
            </span>
        `;
    }
}

customElements.define('dash-tag', DashTag);
export { DashTag };
