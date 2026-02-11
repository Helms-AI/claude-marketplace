/**
 * Activity Group Molecule - Time-grouped activities header with collapsible list
 * @module components/molecules/activity-group
 *
 * Displays a time group header (e.g., "Just now", "5 minutes ago")
 * with a collapsible list of activity items.
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';
import './activity-item.js';

class ActivityGroup extends LitElement {
    static properties = {
        label: { type: String },          // Group label (e.g., "Just now")
        activities: { type: Array },      // Array of activity objects
        expanded: { type: Boolean },      // Whether group is expanded
        icon: { type: String },           // Icon name for group
        count: { type: Number }           // Override count display
    };

    static styles = css`
        :host {
            display: block;
        }

        .group {
            border-bottom: 1px solid var(--border-color, #3c3c3c);
        }

        .group:last-child {
            border-bottom: none;
        }

        .group-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            cursor: pointer;
            user-select: none;
            transition: background var(--transition-fast, 150ms ease);
        }

        .group-header:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
        }

        .chevron {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted, #9ca3af);
            transition: transform var(--transition-fast, 150ms ease);
        }

        .chevron.expanded {
            transform: rotate(90deg);
        }

        .group-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted, #9ca3af);
        }

        .group-label {
            flex: 1;
            font-size: var(--font-size-xs, 11px);
            font-weight: 600;
            color: var(--text-secondary, #a0a0a0);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .group-count {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            padding: 1px 6px;
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.05));
            border-radius: 10px;
        }

        .group-content {
            display: none;
            padding-left: var(--spacing-xs, 4px);
        }

        .group-content.expanded {
            display: block;
        }

        .activity-list {
            display: flex;
            flex-direction: column;
        }

        /* Empty state */
        .empty {
            padding: var(--spacing-md, 12px);
            text-align: center;
            color: var(--text-muted, #9ca3af);
            font-size: var(--font-size-sm, 12px);
        }
    `;

    constructor() {
        super();
        this.label = 'Activities';
        this.activities = [];
        this.expanded = true;
        this.icon = 'clock';
        this.count = null;
    }

    /**
     * Toggle expansion state
     * @private
     */
    _toggleExpanded() {
        this.expanded = !this.expanded;
        this.dispatchEvent(new CustomEvent('toggle', {
            detail: { expanded: this.expanded, label: this.label },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get display count
     * @private
     */
    _getCount() {
        return this.count !== null ? this.count : this.activities.length;
    }

    render() {
        const displayCount = this._getCount();

        return html`
            <div class="group">
                <div
                    class="group-header"
                    @click=${this._toggleExpanded}
                    role="button"
                    aria-expanded="${this.expanded}"
                    tabindex="0"
                    @keydown=${(e) => e.key === 'Enter' && this._toggleExpanded()}
                >
                    <span class="chevron ${this.expanded ? 'expanded' : ''}">
                        <dash-icon name="chevron-right" size="14"></dash-icon>
                    </span>
                    <span class="group-icon">
                        <dash-icon name="${this.icon}" size="14"></dash-icon>
                    </span>
                    <span class="group-label">${this.label}</span>
                    <span class="group-count">${displayCount}</span>
                </div>

                <div class="group-content ${this.expanded ? 'expanded' : ''}">
                    ${this.activities.length === 0 ? html`
                        <div class="empty">No activities</div>
                    ` : html`
                        <div class="activity-list">
                            ${this.activities.map(activity => html`
                                <activity-item
                                    tool="${activity.tool || activity.content?.tool || 'Unknown'}"
                                    file="${activity.file || activity.content?.file || ''}"
                                    status="${activity.status || 'success'}"
                                    timestamp="${activity.timestamp}"
                                    duration="${activity.duration || null}"
                                ></activity-item>
                            `)}
                        </div>
                    `}
                </div>
            </div>
        `;
    }
}

customElements.define('activity-group', ActivityGroup);
export { ActivityGroup };
