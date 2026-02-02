/**
 * JSON Viewer Component - Multi-view JSON data display
 * @module components/molecules/json-viewer
 *
 * A versatile JSON viewer with three view modes:
 * - Raw: Minified single-line JSON
 * - Pretty: Formatted indented JSON with syntax highlighting
 * - Table: Key-value table view for flat/nested objects
 */

import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

/**
 * View modes for the JSON viewer
 */
const VIEW_MODE = {
    RAW: 'raw',
    PRETTY: 'pretty',
    TABLE: 'table'
};

class JsonViewer extends LitElement {
    static properties = {
        data: { type: Object },
        mode: { type: String },
        maxHeight: { type: String, attribute: 'max-height' },
        collapsible: { type: Boolean }
    };

    static styles = css`
        :host {
            display: block;
            font-family: var(--font-mono, 'SF Mono', 'Fira Code', 'Monaco', monospace);
            font-size: var(--font-size-xs, 10px);
        }

        .viewer-container {
            display: flex;
            flex-direction: column;
            background: var(--bg-tertiary, rgba(0, 0, 0, 0.2));
            border-radius: var(--radius-sm, 4px);
            overflow: hidden;
        }

        /* Mode tabs */
        .mode-tabs {
            display: flex;
            gap: 2px;
            padding: 4px;
            background: var(--bg-secondary, rgba(0, 0, 0, 0.1));
            border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
        }

        .mode-tab {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            border: none;
            background: transparent;
            color: var(--text-muted, #6b7280);
            font-size: 9px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            border-radius: var(--radius-xs, 2px);
            transition: all var(--transition-fast, 150ms ease);
        }

        .mode-tab:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
            color: var(--text-secondary, #b0b0b0);
        }

        .mode-tab.active {
            background: var(--accent-color-alpha, rgba(59, 130, 246, 0.15));
            color: var(--accent-color, #3b82f6);
        }

        .mode-tab dash-icon {
            opacity: 0.7;
        }

        /* Content area */
        .content {
            overflow: auto;
            padding: var(--spacing-sm, 8px);
        }

        /* Raw view */
        .raw-view {
            white-space: nowrap;
            overflow-x: auto;
            color: var(--text-secondary, #b0b0b0);
            line-height: 1.6;
        }

        /* Pretty view with syntax highlighting */
        .pretty-view {
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.6;
        }

        .pretty-view .key {
            color: var(--info-color, #60a5fa);
        }

        .pretty-view .string {
            color: var(--success-color, #4ade80);
        }

        .pretty-view .number {
            color: var(--warning-color, #fbbf24);
        }

        .pretty-view .boolean {
            color: var(--accent-color, #a78bfa);
        }

        .pretty-view .null {
            color: var(--text-muted, #6b7280);
        }

        .pretty-view .punctuation {
            color: var(--text-muted, #9ca3af);
        }

        /* Table view */
        .table-view {
            width: 100%;
            border-collapse: collapse;
        }

        .table-view th,
        .table-view td {
            padding: 4px 8px;
            text-align: left;
            border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
            vertical-align: top;
        }

        .table-view th {
            color: var(--text-muted, #6b7280);
            font-weight: 500;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: var(--bg-secondary, rgba(0, 0, 0, 0.1));
            position: sticky;
            top: 0;
        }

        .table-view td.key {
            color: var(--info-color, #60a5fa);
            font-weight: 500;
            white-space: nowrap;
            width: 30%;
            max-width: 120px;
        }

        .table-view td.value {
            color: var(--text-secondary, #b0b0b0);
            word-break: break-word;
        }

        .table-view td.value.string {
            color: var(--success-color, #4ade80);
        }

        .table-view td.value.number {
            color: var(--warning-color, #fbbf24);
        }

        .table-view td.value.boolean {
            color: var(--accent-color, #a78bfa);
        }

        .table-view td.value.null {
            color: var(--text-muted, #6b7280);
            font-style: italic;
        }

        .table-view td.value.object,
        .table-view td.value.array {
            font-size: 9px;
        }

        .table-view tr:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.02));
        }

        /* Nested indicator */
        .nested-badge {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            padding: 1px 4px;
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
            border-radius: var(--radius-xs, 2px);
            color: var(--text-muted, #6b7280);
            font-size: 9px;
            cursor: pointer;
        }

        .nested-badge:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
        }

        /* Copy button */
        .copy-row {
            display: flex;
            justify-content: flex-end;
            padding: 4px;
            border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.05));
            background: var(--bg-secondary, rgba(0, 0, 0, 0.1));
        }

        .copy-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 2px 6px;
            border: none;
            background: transparent;
            color: var(--text-muted, #6b7280);
            font-size: 9px;
            cursor: pointer;
            border-radius: var(--radius-xs, 2px);
            transition: all var(--transition-fast, 150ms ease);
        }

        .copy-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
            color: var(--text-primary, #e0e0e0);
        }

        .copy-btn.copied {
            color: var(--success-color, #22c55e);
        }

        /* Empty state */
        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-md, 12px);
            color: var(--text-muted, #6b7280);
            font-style: italic;
        }
    `;

    constructor() {
        super();
        this.data = null;
        this.mode = VIEW_MODE.PRETTY;
        this.maxHeight = '200px';
        this.collapsible = true;
        this._copied = false;
    }

    /**
     * Render syntax-highlighted JSON
     * @private
     */
    _renderPrettyJson(data, indent = 0) {
        if (data === null) {
            return html`<span class="null">null</span>`;
        }

        if (typeof data === 'undefined') {
            return html`<span class="null">undefined</span>`;
        }

        if (typeof data === 'boolean') {
            return html`<span class="boolean">${data.toString()}</span>`;
        }

        if (typeof data === 'number') {
            return html`<span class="number">${data}</span>`;
        }

        if (typeof data === 'string') {
            return html`<span class="string">"${this._escapeHtml(data)}"</span>`;
        }

        if (Array.isArray(data)) {
            if (data.length === 0) {
                return html`<span class="punctuation">[]</span>`;
            }

            const indentStr = '  '.repeat(indent);
            const nextIndentStr = '  '.repeat(indent + 1);
            const items = data.map((item, i) => {
                const comma = i < data.length - 1 ? ',' : '';
                return html`${nextIndentStr}${this._renderPrettyJson(item, indent + 1)}<span class="punctuation">${comma}</span>\n`;
            });

            return html`<span class="punctuation">[</span>\n${items}${indentStr}<span class="punctuation">]</span>`;
        }

        if (typeof data === 'object') {
            const keys = Object.keys(data);
            if (keys.length === 0) {
                return html`<span class="punctuation">{}</span>`;
            }

            const indentStr = '  '.repeat(indent);
            const nextIndentStr = '  '.repeat(indent + 1);
            const items = keys.map((key, i) => {
                const comma = i < keys.length - 1 ? ',' : '';
                return html`${nextIndentStr}<span class="key">"${key}"</span><span class="punctuation">: </span>${this._renderPrettyJson(data[key], indent + 1)}<span class="punctuation">${comma}</span>\n`;
            });

            return html`<span class="punctuation">{</span>\n${items}${indentStr}<span class="punctuation">}</span>`;
        }

        return html`<span>${String(data)}</span>`;
    }

    /**
     * Flatten object for table view
     * @private
     */
    _flattenObject(obj, prefix = '', maxDepth = 3, currentDepth = 0) {
        const result = [];

        if (currentDepth >= maxDepth) {
            result.push({ key: prefix || '(root)', value: obj, type: typeof obj });
            return result;
        }

        if (obj === null || obj === undefined || typeof obj !== 'object') {
            result.push({ key: prefix || '(value)', value: obj, type: obj === null ? 'null' : typeof obj });
            return result;
        }

        const keys = Object.keys(obj);
        for (const key of keys) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];

            if (value === null) {
                result.push({ key: fullKey, value: null, type: 'null' });
            } else if (Array.isArray(value)) {
                if (value.length === 0) {
                    result.push({ key: fullKey, value: '[]', type: 'array' });
                } else if (value.length <= 3 && value.every(v => typeof v !== 'object')) {
                    result.push({ key: fullKey, value: JSON.stringify(value), type: 'array' });
                } else {
                    result.push({ key: fullKey, value: `Array(${value.length})`, type: 'array', expandable: true, rawValue: value });
                }
            } else if (typeof value === 'object') {
                const childKeys = Object.keys(value);
                if (childKeys.length === 0) {
                    result.push({ key: fullKey, value: '{}', type: 'object' });
                } else if (childKeys.length <= 2 && currentDepth < maxDepth - 1) {
                    // Inline small objects
                    result.push(...this._flattenObject(value, fullKey, maxDepth, currentDepth + 1));
                } else {
                    result.push({ key: fullKey, value: `Object(${childKeys.length})`, type: 'object', expandable: true, rawValue: value });
                }
            } else {
                result.push({ key: fullKey, value, type: typeof value });
            }
        }

        return result;
    }

    /**
     * Escape HTML characters
     * @private
     */
    _escapeHtml(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Handle mode change
     * @private
     */
    _setMode(mode) {
        this.mode = mode;
    }

    /**
     * Copy JSON to clipboard
     * @private
     */
    async _copyToClipboard() {
        try {
            const json = this.mode === VIEW_MODE.RAW
                ? JSON.stringify(this.data)
                : JSON.stringify(this.data, null, 2);
            await navigator.clipboard.writeText(json);
            this._copied = true;
            this.requestUpdate();

            setTimeout(() => {
                this._copied = false;
                this.requestUpdate();
            }, 2000);
        } catch (err) {
            console.error('[JsonViewer] Failed to copy:', err);
        }
    }

    /**
     * Render the appropriate view based on mode
     * @private
     */
    _renderContent() {
        if (this.data === null || this.data === undefined) {
            return html`<div class="empty-state">No data</div>`;
        }

        switch (this.mode) {
            case VIEW_MODE.RAW:
                return html`
                    <div class="raw-view">${JSON.stringify(this.data)}</div>
                `;

            case VIEW_MODE.PRETTY:
                return html`
                    <div class="pretty-view">${this._renderPrettyJson(this.data)}</div>
                `;

            case VIEW_MODE.TABLE:
                const rows = this._flattenObject(this.data);
                return html`
                    <table class="table-view">
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map(row => html`
                                <tr>
                                    <td class="key">${row.key}</td>
                                    <td class="value ${row.type}">
                                        ${row.expandable
                                            ? html`<span class="nested-badge" title="Click to expand">
                                                <dash-icon name="chevron-right" size="10"></dash-icon>
                                                ${row.value}
                                            </span>`
                                            : row.value === null
                                                ? 'null'
                                                : typeof row.value === 'string'
                                                    ? row.value
                                                    : String(row.value)
                                        }
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                `;

            default:
                return html`<div class="empty-state">Unknown mode</div>`;
        }
    }

    render() {
        return html`
            <div class="viewer-container">
                <!-- Mode tabs -->
                <div class="mode-tabs">
                    <button
                        class="mode-tab ${this.mode === VIEW_MODE.RAW ? 'active' : ''}"
                        @click=${() => this._setMode(VIEW_MODE.RAW)}
                    >
                        <dash-icon name="code" size="10"></dash-icon>
                        Raw
                    </button>
                    <button
                        class="mode-tab ${this.mode === VIEW_MODE.PRETTY ? 'active' : ''}"
                        @click=${() => this._setMode(VIEW_MODE.PRETTY)}
                    >
                        <dash-icon name="braces" size="10"></dash-icon>
                        Pretty
                    </button>
                    <button
                        class="mode-tab ${this.mode === VIEW_MODE.TABLE ? 'active' : ''}"
                        @click=${() => this._setMode(VIEW_MODE.TABLE)}
                    >
                        <dash-icon name="table" size="10"></dash-icon>
                        Table
                    </button>
                </div>

                <!-- Content -->
                <div class="content" style="max-height: ${this.maxHeight}">
                    ${this._renderContent()}
                </div>

                <!-- Copy button -->
                <div class="copy-row">
                    <button
                        class="copy-btn ${this._copied ? 'copied' : ''}"
                        @click=${this._copyToClipboard}
                    >
                        <dash-icon name="${this._copied ? 'check' : 'copy'}" size="10"></dash-icon>
                        ${this._copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('json-viewer', JsonViewer);
export { JsonViewer, VIEW_MODE };
