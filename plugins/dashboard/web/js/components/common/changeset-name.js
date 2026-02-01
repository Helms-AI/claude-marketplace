/**
 * Changeset Name Component - Formats raw changeset IDs into human-readable display
 * @module components/common/changeset-name
 *
 * Input format: YYYYMMDD-HHMMSS-task-description
 * Output format: Task description M/D HH:MM
 */

import { LitElement, html, css } from 'lit';

class ChangesetName extends LitElement {
    static properties = {
        name: { type: String },
        showTime: { type: Boolean, attribute: 'show-time' }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            min-width: 0;
        }

        .title {
            font-weight: 500;
            color: var(--text-primary, #1a1a1a);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .timestamp {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #999);
            white-space: nowrap;
            flex-shrink: 0;
        }
    `;

    constructor() {
        super();
        this.name = '';
        this.showTime = true;
    }

    /**
     * Parse the raw changeset name into components
     * Format: YYYYMMDD-HHMMSS-task-description
     */
    _parse() {
        if (!this.name) return { title: 'Unknown', timestamp: '' };

        // Match pattern: YYYYMMDD-HHMMSS-description
        const match = this.name.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-(.+)$/);

        if (!match) {
            // Fallback: just capitalize and clean the name
            return {
                title: this._formatTitle(this.name),
                timestamp: ''
            };
        }

        const [, year, month, day, hour, minute, , description] = match;

        // Format date as M/D (no leading zeros)
        const dateStr = `${parseInt(month, 10)}/${parseInt(day, 10)}`;

        // Format time as HH:MM (24-hour)
        const timeStr = `${hour}:${minute}`;

        // Format title: replace hyphens with spaces, capitalize first letter
        const title = this._formatTitle(description);

        return {
            title,
            timestamp: `${dateStr} ${timeStr}`
        };
    }

    /**
     * Format a hyphenated string into a readable title
     */
    _formatTitle(str) {
        if (!str) return 'Unknown';

        // Replace hyphens with spaces
        const words = str.replace(/-/g, ' ');

        // Capitalize first letter only
        return words.charAt(0).toUpperCase() + words.slice(1);
    }

    render() {
        const { title, timestamp } = this._parse();

        return html`
            <span class="title">${title}</span>
            ${this.showTime && timestamp ? html`<span class="timestamp">${timestamp}</span>` : ''}
        `;
    }
}

customElements.define('changeset-name', ChangesetName);
export { ChangesetName };
