/**
 * Tag List Molecule - Collection of tags with overflow handling
 * @module components/molecules/tag-list
 *
 * Displays a list of tags with optional truncation and "+N more" indicator.
 * Built on the dash-tag atom.
 */
import { LitElement, html, css } from 'lit';
import '../atoms/tag.js';

class DashTagList extends LitElement {
    static properties = {
        items: { type: Array },         // [{label, domain?, icon?}] or string[]
        maxVisible: { type: Number, attribute: 'max-visible' },
        variant: { type: String },      // 'wrap' | 'scroll' | 'truncate'
        tagVariant: { type: String, attribute: 'tag-variant' },
        tagSize: { type: String, attribute: 'tag-size' },
        prefix: { type: String },       // Applied to all tags (e.g., "/" for skills)
        clickable: { type: Boolean },   // Make tags clickable
        emptyText: { type: String, attribute: 'empty-text' }
    };

    static styles = css`
        :host {
            display: block;
        }

        .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs, 4px);
        }

        .scroll {
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--border-color) transparent;
            padding-bottom: 2px;
        }

        .scroll::-webkit-scrollbar {
            height: 4px;
        }

        .scroll::-webkit-scrollbar-track {
            background: transparent;
        }

        .scroll::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 2px;
        }

        .truncate {
            flex-wrap: nowrap;
            overflow: hidden;
        }

        .more-indicator {
            display: inline-flex;
            align-items: center;
            padding: 0 var(--spacing-sm, 8px);
            height: 22px;
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            color: var(--text-muted, #9ca3af);
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            border-radius: var(--radius-sm, 4px);
            cursor: default;
            flex-shrink: 0;
        }

        .more-indicator.clickable {
            cursor: pointer;
            transition: all var(--transition-fast, 150ms ease);
        }

        .more-indicator.clickable:hover {
            color: var(--text-secondary);
            background: var(--bg-secondary);
        }

        .empty-state {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-muted, #9ca3af);
            font-style: italic;
        }
    `;

    constructor() {
        super();
        this.items = [];
        this.maxVisible = 0;  // 0 = show all
        this.variant = 'wrap';
        this.tagVariant = 'default';
        this.tagSize = 'sm';
        this.prefix = '';
        this.clickable = false;
        this.emptyText = '';
    }

    _normalizeItems() {
        return this.items.map(item => {
            if (typeof item === 'string') {
                return { label: item };
            }
            return item;
        });
    }

    _handleTagClick(e, item) {
        if (!this.clickable) return;
        this.dispatchEvent(new CustomEvent('dash-tag-click', {
            bubbles: true,
            composed: true,
            detail: { item, label: item.label }
        }));
    }

    _handleMoreClick() {
        this.dispatchEvent(new CustomEvent('dash-more-click', {
            bubbles: true,
            composed: true,
            detail: {
                hiddenCount: this._normalizeItems().length - (this.maxVisible || this._normalizeItems().length),
                allItems: this._normalizeItems()
            }
        }));
    }

    render() {
        const normalizedItems = this._normalizeItems();

        if (normalizedItems.length === 0) {
            if (this.emptyText) {
                return html`<span class="empty-state">${this.emptyText}</span>`;
            }
            return html``;
        }

        const visibleItems = this.maxVisible > 0
            ? normalizedItems.slice(0, this.maxVisible)
            : normalizedItems;

        const hiddenCount = this.maxVisible > 0
            ? normalizedItems.length - this.maxVisible
            : 0;

        return html`
            <div class="tag-list ${this.variant}">
                ${visibleItems.map(item => html`
                    <dash-tag
                        label="${item.label}"
                        variant="${item.variant || this.tagVariant}"
                        size="${this.tagSize}"
                        domain="${item.domain || ''}"
                        icon="${item.icon || ''}"
                        prefix="${this.prefix}"
                        ?clickable="${this.clickable}"
                        @dash-click="${(e) => this._handleTagClick(e, item)}"
                    ></dash-tag>
                `)}
                ${hiddenCount > 0 ? html`
                    <span
                        class="more-indicator ${this.clickable ? 'clickable' : ''}"
                        @click="${this._handleMoreClick}"
                        title="Show ${hiddenCount} more"
                    >+${hiddenCount} more</span>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('dash-tag-list', DashTagList);
export { DashTagList };
