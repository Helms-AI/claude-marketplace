/**
 * Empty State Atom - Placeholder for empty content
 * @module components/atoms/empty-state
 *
 * Displays a consistent empty state with optional icon, title,
 * description, and action button.
 */
import { LitElement, html, css } from 'lit';

class DashEmptyState extends LitElement {
    static properties = {
        icon: { type: String },         // Lucide icon name
        title: { type: String },        // Primary message
        description: { type: String },  // Secondary message
        action: { type: String },       // Optional action button text
        variant: { type: String }       // 'inline' | 'card' | 'centered'
    };

    static styles = css`
        :host {
            display: block;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: var(--text-muted, #9ca3af);
            font-family: var(--font-sans);
        }

        /* Variants */
        .inline {
            padding: var(--spacing-md, 12px);
            flex-direction: row;
            gap: var(--spacing-sm, 8px);
        }

        .inline .icon {
            width: 16px;
            height: 16px;
        }

        .inline .title {
            font-size: var(--font-size-sm, 12px);
        }

        .inline .description,
        .inline .action-btn {
            display: none;
        }

        .card {
            padding: var(--spacing-lg, 16px) var(--spacing-xl, 24px);
            background: var(--bg-secondary, #f3f4f6);
            border-radius: var(--radius-md, 6px);
            border: 1px dashed var(--border-color, #e5e7eb);
            gap: var(--spacing-sm, 8px);
        }

        .card .icon {
            width: 32px;
            height: 32px;
            margin-bottom: var(--spacing-xs, 4px);
        }

        .card .title {
            font-size: var(--font-size-sm, 12px);
            font-weight: 500;
        }

        .card .description {
            font-size: var(--font-size-xs, 11px);
            max-width: 200px;
        }

        .centered {
            padding: var(--spacing-xl, 24px) var(--spacing-xl, 24px);
            min-height: 120px;
            gap: var(--spacing-md, 12px);
        }

        .centered .icon {
            width: 48px;
            height: 48px;
            opacity: 0.5;
        }

        .centered .title {
            font-size: var(--font-size-md, 13px);
            font-weight: 500;
            color: var(--text-secondary, #6b7280);
        }

        .centered .description {
            font-size: var(--font-size-sm, 12px);
            max-width: 280px;
        }

        /* Icon container */
        .icon {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted, #9ca3af);
        }

        /* Action button */
        .action-btn {
            margin-top: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            height: 28px;
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            color: var(--accent-color, #3b82f6);
            background: transparent;
            border: 1px solid var(--accent-color, #3b82f6);
            border-radius: var(--radius-sm, 4px);
            cursor: pointer;
            transition: all var(--transition-fast, 150ms ease);
        }

        .action-btn:hover {
            background: var(--accent-color, #3b82f6);
            color: white;
        }

        .action-btn:active {
            transform: scale(0.98);
        }
    `;

    constructor() {
        super();
        this.icon = '';
        this.title = '';
        this.description = '';
        this.action = '';
        this.variant = 'inline';
    }

    _handleAction() {
        this.dispatchEvent(new CustomEvent('dash-action', {
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const iconSize = this.variant === 'inline' ? 16 :
                         this.variant === 'card' ? 32 : 48;

        return html`
            <div class="empty-state ${this.variant}">
                ${this.icon ? html`
                    <div class="icon">
                        <dash-icon name="${this.icon}" size="${iconSize}"></dash-icon>
                    </div>
                ` : ''}
                ${this.title ? html`
                    <div class="title">${this.title}</div>
                ` : ''}
                ${this.description ? html`
                    <div class="description">${this.description}</div>
                ` : ''}
                ${this.action ? html`
                    <button class="action-btn" @click="${this._handleAction}">
                        ${this.action}
                    </button>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('dash-empty-state', DashEmptyState);
export { DashEmptyState };
