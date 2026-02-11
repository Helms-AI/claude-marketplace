/**
 * Tool Activity Badge - Minimal inline indicator for aside tools
 * @module components/molecules/tool-activity-badge
 *
 * A subtle badge that appears in the conversation where tool cards
 * would normally render. Shows count of tools that ran, clickable
 * to scroll to the activities aside.
 *
 * Design: "whispers 'tools ran here' not shouts"
 * - Monospace font, muted gray, 11px
 * - Lightning bolt icon (⚡)
 * - Clickable to expand aside and scroll to tools
 */

import { LitElement, html, css } from 'lit';

/**
 * @element tool-activity-badge
 * @fires badge-click - When badge is clicked (for scroll-to-aside behavior)
 */
class ToolActivityBadge extends LitElement {
    static properties = {
        /** Number of tools to display */
        count: { type: Number },
        /** Tool names for tooltip */
        toolNames: { type: Array },
        /** Whether the badge is interactive (clickable) */
        interactive: { type: Boolean },
        /** Optional timestamp for grouping */
        timestamp: { type: String }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: var(--radius-sm, 4px);
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.03));
            border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
            font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
            font-size: 11px;
            color: var(--text-muted, #6b7280);
            cursor: default;
            user-select: none;
            transition: all 150ms ease;
        }

        .badge.interactive {
            cursor: pointer;
        }

        .badge.interactive:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.06));
            border-color: var(--border-muted, rgba(255, 255, 255, 0.1));
            color: var(--text-secondary, #9ca3af);
        }

        .badge.interactive:active {
            transform: scale(0.98);
        }

        .icon {
            font-size: 10px;
            opacity: 0.7;
        }

        .count {
            font-weight: 500;
        }

        .label {
            opacity: 0.8;
        }

        /* Tooltip styles */
        .badge[title] {
            position: relative;
        }
    `;

    constructor() {
        super();
        this.count = 0;
        this.toolNames = [];
        this.interactive = true;
        this.timestamp = '';
    }

    /**
     * Generate tooltip text from tool names
     */
    get tooltipText() {
        if (!this.toolNames?.length) {
            return `${this.count} tool${this.count !== 1 ? 's' : ''} executed`;
        }

        // Count occurrences of each tool
        const counts = this.toolNames.reduce((acc, name) => {
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {});

        // Format as "Read (2), Write (1), Bash (1)"
        const parts = Object.entries(counts)
            .map(([name, count]) => count > 1 ? `${name} (${count})` : name);

        return parts.join(', ');
    }

    /**
     * Format the count display
     */
    get displayText() {
        const count = this.count || this.toolNames?.length || 0;
        return count === 1 ? '1 tool' : `${count} tools`;
    }

    _handleClick(e) {
        if (!this.interactive) return;

        this.dispatchEvent(new CustomEvent('badge-click', {
            detail: {
                count: this.count || this.toolNames?.length,
                toolNames: this.toolNames,
                timestamp: this.timestamp
            },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const count = this.count || this.toolNames?.length || 0;
        if (count === 0) return null;

        return html`
            <span
                class="badge ${this.interactive ? 'interactive' : ''}"
                title="${this.tooltipText}"
                @click=${this._handleClick}
                role="${this.interactive ? 'button' : 'status'}"
                tabindex="${this.interactive ? '0' : '-1'}"
                aria-label="${this.tooltipText}"
            >
                <span class="icon" aria-hidden="true">⚡</span>
                <span class="count">${count}</span>
                <span class="label">${count === 1 ? 'tool' : 'tools'}</span>
            </span>
        `;
    }
}

customElements.define('tool-activity-badge', ToolActivityBadge);

export { ToolActivityBadge };
