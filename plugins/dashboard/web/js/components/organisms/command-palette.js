/**
 * CommandPalette Organism - Global search and quick actions
 * @module components/organisms/command-palette
 */
import { LitElement, html, css } from 'lit';
import { signal, effect } from '@preact/signals-core';
import '../atoms/icon.js';
import '../atoms/input.js';
import '../atoms/kbd.js';

/**
 * @fires dash-select - When an item is selected
 * @fires dash-close - When palette is closed
 */
class DashCommandPalette extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        placeholder: { type: String },
        items: { type: Array },      // Search results
        sections: { type: Array },   // Grouped sections
        selectedIndex: { type: Number, state: true }
    };

    static styles = css`
        :host {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: none;
            align-items: flex-start;
            justify-content: center;
            padding-top: 15vh;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(2px);
        }

        :host([open]) {
            display: flex;
        }

        .palette {
            width: 100%;
            max-width: 560px;
            max-height: 70vh;
            background: var(--bg-primary, #ffffff);
            border-radius: var(--radius-lg, 8px);
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
            overflow: hidden;
            transform: scale(0.98) translateY(-8px);
            opacity: 0;
            transition: transform 0.15s ease-out, opacity 0.15s ease-out;
        }

        :host([open]) .palette {
            transform: scale(1) translateY(0);
            opacity: 1;
        }

        .search-container {
            display: flex;
            align-items: center;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .search-icon {
            color: var(--text-muted, #9ca3af);
            flex-shrink: 0;
        }

        .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: var(--font-size-md, 14px);
            color: var(--text-primary, #1f2937);
            outline: none;
        }

        .search-input::placeholder {
            color: var(--text-muted, #9ca3af);
        }

        .results {
            max-height: calc(70vh - 60px);
            overflow-y: auto;
        }

        .section {
            padding: var(--spacing-sm, 8px) 0;
        }

        .section:not(:last-child) {
            border-bottom: 1px solid var(--border-subtle, #f3f4f6);
        }

        .section-title {
            padding: var(--spacing-xs, 4px) var(--spacing-lg, 16px);
            font-size: var(--font-size-xs, 11px);
            font-weight: 600;
            color: var(--text-muted, #9ca3af);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .item {
            display: flex;
            align-items: center;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-sm, 8px) var(--spacing-lg, 16px);
            cursor: pointer;
            transition: background 0.1s;
        }

        .item:hover,
        .item.selected {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
        }

        .item.selected {
            background: var(--accent-bg, rgba(59, 130, 246, 0.1));
        }

        .item-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: var(--radius-sm, 4px);
            background: var(--bg-secondary, #f3f4f6);
            font-size: 14px;
            flex-shrink: 0;
        }

        .item-content {
            flex: 1;
            min-width: 0;
        }

        .item-title {
            font-size: var(--font-size-sm, 12px);
            color: var(--text-primary, #1f2937);
            font-weight: 500;
        }

        .item-description {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #6b7280);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .item-shortcut {
            flex-shrink: 0;
        }

        .empty-state {
            padding: var(--spacing-xl, 24px);
            text-align: center;
            color: var(--text-muted, #9ca3af);
            font-size: var(--font-size-sm, 12px);
        }

        .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-sm, 8px) var(--spacing-lg, 16px);
            border-top: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-secondary, #f9fafb);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
        }

        .hints {
            display: flex;
            gap: var(--spacing-md, 12px);
        }

        .hint {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.placeholder = 'Search or type a command...';
        this.items = [];
        this.sections = [];
        this.selectedIndex = 0;
        this._query = '';
    }

    connectedCallback() {
        super.connectedCallback();
        this._handleKeydown = this._handleKeydown.bind(this);
        document.addEventListener('keydown', this._handleKeydown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this._handleKeydown);
    }

    render() {
        const allItems = this._getAllItems();

        return html`
            <div class="palette" @click="${e => e.stopPropagation()}">
                <div class="search-container">
                    <dash-icon class="search-icon" name="search" size="18"></dash-icon>
                    <input
                        class="search-input"
                        type="text"
                        placeholder="${this.placeholder}"
                        @input="${this._handleInput}"
                        @keydown="${this._handleInputKeydown}"
                    />
                </div>

                <div class="results">
                    ${this.sections.length > 0 ? this._renderSections() : this._renderItems(allItems)}
                </div>

                <div class="footer">
                    <div class="hints">
                        <span class="hint">
                            <dash-kbd keys="↑↓"></dash-kbd>
                            Navigate
                        </span>
                        <span class="hint">
                            <dash-kbd keys="Enter"></dash-kbd>
                            Select
                        </span>
                        <span class="hint">
                            <dash-kbd keys="Esc"></dash-kbd>
                            Close
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    _renderSections() {
        let globalIndex = 0;

        return this.sections.map(section => html`
            <div class="section">
                <div class="section-title">${section.title}</div>
                ${section.items.map(item => {
                    const index = globalIndex++;
                    return this._renderItem(item, index);
                })}
            </div>
        `);
    }

    _renderItems(items) {
        if (items.length === 0) {
            return html`<div class="empty-state">No results found</div>`;
        }

        return html`
            <div class="section">
                ${items.map((item, index) => this._renderItem(item, index))}
            </div>
        `;
    }

    _renderItem(item, index) {
        return html`
            <div
                class="item ${index === this.selectedIndex ? 'selected' : ''}"
                @click="${() => this._selectItem(item)}"
                @mouseenter="${() => this.selectedIndex = index}"
            >
                <span class="item-icon">${item.icon || '📄'}</span>
                <div class="item-content">
                    <div class="item-title">${item.title || item.label}</div>
                    ${item.description ? html`
                        <div class="item-description">${item.description}</div>
                    ` : ''}
                </div>
                ${item.shortcut ? html`
                    <dash-kbd class="item-shortcut" keys="${item.shortcut}"></dash-kbd>
                ` : ''}
            </div>
        `;
    }

    _getAllItems() {
        if (this.sections.length > 0) {
            return this.sections.flatMap(s => s.items);
        }
        return this.items;
    }

    _handleInput(e) {
        this._query = e.target.value;
        this.selectedIndex = 0;
        this.dispatchEvent(new CustomEvent('dash-search', {
            detail: { query: this._query },
            bubbles: true,
            composed: true
        }));
    }

    _handleInputKeydown(e) {
        const allItems = this._getAllItems();

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, allItems.length - 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = allItems[this.selectedIndex];
            if (selected) this._selectItem(selected);
        }
    }

    _handleKeydown(e) {
        if (e.key === 'Escape' && this.open) {
            this.close();
        }
    }

    _selectItem(item) {
        this.dispatchEvent(new CustomEvent('dash-select', {
            detail: { item },
            bubbles: true,
            composed: true
        }));
        this.close();
    }

    show() {
        this.open = true;
        this.selectedIndex = 0;
        this.updateComplete.then(() => {
            const input = this.shadowRoot.querySelector('.search-input');
            if (input) {
                input.value = '';
                input.focus();
            }
        });
    }

    close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('dash-close', {
            bubbles: true,
            composed: true
        }));
    }

    toggle() {
        if (this.open) this.close();
        else this.show();
    }
}

customElements.define('dash-command-palette', DashCommandPalette);
export { DashCommandPalette };
