/**
 * JSON Tree Viewer Organism - Collapsible JSON tree renderer
 * @module components/organisms/json-tree-viewer
 *
 * Renders JSON content as an interactive tree with expand/collapse.
 * Supports large files with virtualization hints.
 *
 * @example
 * ```html
 * <json-tree-viewer
 *   .content="${jsonString}"
 *   filename="data.json"
 * ></json-tree-viewer>
 * ```
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

class JsonTreeViewer extends LitElement {
    static properties = {
        content: { type: String },
        filename: { type: String },
        initialExpandDepth: { type: Number, attribute: 'initial-expand-depth' },
        _parsed: { type: Object, state: true },
        _parseError: { type: String, state: true },
        _copied: { type: Boolean, state: true },
        _viewMode: { type: String, state: true },  // 'tree' | 'raw'
        _expandedPaths: { type: Object, state: true }
    };

    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow: hidden;
            background: var(--bg-primary, #1e1e1e);
        }

        .container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        /* Toolbar */
        .toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
            border-bottom: 1px solid var(--border-color, #3c3c3c);
            flex-shrink: 0;
        }

        .toolbar-left {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        .filename {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            font-family: var(--font-mono, 'Fira Code', monospace);
        }

        .stats {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            padding: 2px 6px;
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.05));
            border-radius: var(--radius-sm, 4px);
        }

        .actions {
            display: flex;
            gap: var(--spacing-xs, 4px);
        }

        .action-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #6e7681);
            font-size: var(--font-size-xs, 11px);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .action-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            color: var(--text-primary, #cccccc);
        }

        .action-btn.active {
            background: var(--accent-color, #007acc);
            color: white;
        }

        .action-btn.copied {
            color: var(--success-color, #22c55e);
        }

        /* Content area */
        .content-wrapper {
            flex: 1;
            overflow: auto;
            padding: var(--spacing-sm, 8px);
        }

        /* Raw view */
        .raw-view {
            font-family: var(--font-mono, 'Fira Code', monospace);
            font-size: var(--font-size-sm, 12px);
            line-height: 1.5;
            white-space: pre-wrap;
            color: var(--text-primary, #cccccc);
        }

        /* Tree view */
        .tree-view {
            font-family: var(--font-mono, 'Fira Code', monospace);
            font-size: var(--font-size-sm, 12px);
            line-height: 1.6;
        }

        .tree-node {
            display: block;
        }

        .tree-line {
            display: flex;
            align-items: flex-start;
            gap: 4px;
            padding: 1px 0;
            cursor: default;
        }

        .tree-line:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
        }

        .tree-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            flex-shrink: 0;
            cursor: pointer;
            color: var(--text-muted, #6e7681);
            border: none;
            background: transparent;
            padding: 0;
            border-radius: var(--radius-sm, 4px);
        }

        .tree-toggle:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            color: var(--text-primary, #cccccc);
        }

        .tree-toggle.placeholder {
            visibility: hidden;
        }

        .tree-key {
            color: var(--json-key, #9cdcfe);
        }

        .tree-colon {
            color: var(--text-muted, #6e7681);
            margin: 0 2px;
        }

        .tree-value {
            color: var(--text-primary, #cccccc);
        }

        .tree-value.string {
            color: var(--json-string, #ce9178);
        }

        .tree-value.number {
            color: var(--json-number, #b5cea8);
        }

        .tree-value.boolean {
            color: var(--json-boolean, #569cd6);
        }

        .tree-value.null {
            color: var(--json-null, #569cd6);
            font-style: italic;
        }

        .tree-bracket {
            color: var(--text-muted, #6e7681);
        }

        .tree-children {
            margin-left: 20px;
        }

        .tree-children.collapsed {
            display: none;
        }

        .tree-count {
            color: var(--text-muted, #6e7681);
            font-size: 10px;
            margin-left: 4px;
        }

        /* Error state */
        .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--danger-color, #ef4444);
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-lg, 16px);
            text-align: center;
        }

        .error-message {
            font-family: var(--font-mono, 'Fira Code', monospace);
            font-size: var(--font-size-xs, 11px);
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
            padding: var(--spacing-sm, 8px);
            border-radius: var(--radius-sm, 4px);
            max-width: 100%;
            overflow-x: auto;
        }

        /* Empty state */
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-muted, #6e7681);
            gap: var(--spacing-sm, 8px);
        }

        .empty-state dash-icon {
            opacity: 0.5;
        }
    `;

    constructor() {
        super();
        this.content = '';
        this.filename = '';
        this.initialExpandDepth = 2;
        this._parsed = null;
        this._parseError = null;
        this._copied = false;
        this._viewMode = 'tree';
        this._expandedPaths = new Set();
    }

    updated(changedProperties) {
        if (changedProperties.has('content')) {
            this._parseContent();
        }
    }

    _parseContent() {
        if (!this.content) {
            this._parsed = null;
            this._parseError = null;
            return;
        }

        try {
            this._parsed = JSON.parse(this.content);
            this._parseError = null;
            // Initialize expanded paths based on depth
            this._initializeExpanded(this._parsed, '', 0);
        } catch (error) {
            this._parsed = null;
            this._parseError = error.message;
        }
    }

    _initializeExpanded(value, path, depth) {
        if (depth < this.initialExpandDepth && (typeof value === 'object' && value !== null)) {
            this._expandedPaths.add(path || 'root');

            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    this._initializeExpanded(item, `${path}[${index}]`, depth + 1);
                });
            } else {
                Object.keys(value).forEach(key => {
                    this._initializeExpanded(value[key], `${path}.${key}`, depth + 1);
                });
            }
        }
    }

    _togglePath(path) {
        const newExpanded = new Set(this._expandedPaths);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        this._expandedPaths = newExpanded;
    }

    _expandAll() {
        const expand = (value, path) => {
            if (typeof value === 'object' && value !== null) {
                this._expandedPaths.add(path || 'root');
                if (Array.isArray(value)) {
                    value.forEach((item, index) => expand(item, `${path}[${index}]`));
                } else {
                    Object.keys(value).forEach(key => expand(value[key], `${path}.${key}`));
                }
            }
        };
        this._expandedPaths = new Set();
        expand(this._parsed, '');
        this.requestUpdate();
    }

    _collapseAll() {
        this._expandedPaths = new Set();
    }

    _toggleViewMode() {
        this._viewMode = this._viewMode === 'tree' ? 'raw' : 'tree';
    }

    async _copyContent() {
        try {
            const formatted = JSON.stringify(this._parsed, null, 2);
            await navigator.clipboard.writeText(formatted);
            this._copied = true;
            setTimeout(() => {
                this._copied = false;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }

    _getStats() {
        if (!this._parsed) return null;

        const count = (obj) => {
            if (typeof obj !== 'object' || obj === null) return { keys: 0, items: 0 };
            if (Array.isArray(obj)) return { keys: 0, items: obj.length };
            return { keys: Object.keys(obj).length, items: 0 };
        };

        const stats = count(this._parsed);
        if (stats.items > 0) return `${stats.items} items`;
        if (stats.keys > 0) return `${stats.keys} keys`;
        return null;
    }

    _renderValue(value, key = null, path = 'root', isLast = true) {
        const type = this._getType(value);
        const isExpandable = type === 'object' || type === 'array';
        const isExpanded = this._expandedPaths.has(path);

        if (!isExpandable) {
            return html`
                <div class="tree-line">
                    <span class="tree-toggle placeholder"></span>
                    ${key !== null ? html`
                        <span class="tree-key">"${key}"</span>
                        <span class="tree-colon">:</span>
                    ` : ''}
                    ${this._renderPrimitive(value, type)}${isLast ? '' : ','}
                </div>
            `;
        }

        const isArray = type === 'array';
        const items = isArray ? value : Object.entries(value);
        const count = isArray ? value.length : Object.keys(value).length;
        const openBracket = isArray ? '[' : '{';
        const closeBracket = isArray ? ']' : '}';

        return html`
            <div class="tree-node">
                <div class="tree-line">
                    <button
                        class="tree-toggle"
                        @click="${() => this._togglePath(path)}"
                        title="${isExpanded ? 'Collapse' : 'Expand'}"
                    >
                        <dash-icon name="${isExpanded ? 'chevron-down' : 'chevron-right'}" size="12"></dash-icon>
                    </button>
                    ${key !== null ? html`
                        <span class="tree-key">"${key}"</span>
                        <span class="tree-colon">:</span>
                    ` : ''}
                    <span class="tree-bracket">${openBracket}</span>
                    ${!isExpanded ? html`
                        <span class="tree-count">${count} ${isArray ? 'items' : 'keys'}</span>
                        <span class="tree-bracket">${closeBracket}</span>${isLast ? '' : ','}
                    ` : ''}
                </div>
                ${isExpanded ? html`
                    <div class="tree-children">
                        ${isArray
                            ? items.map((item, index) =>
                                this._renderValue(item, null, `${path}[${index}]`, index === items.length - 1)
                            )
                            : items.map(([k, v], index) =>
                                this._renderValue(v, k, `${path}.${k}`, index === items.length - 1)
                            )
                        }
                    </div>
                    <div class="tree-line">
                        <span class="tree-toggle placeholder"></span>
                        <span class="tree-bracket">${closeBracket}</span>${isLast ? '' : ','}
                    </div>
                ` : ''}
            </div>
        `;
    }

    _renderPrimitive(value, type) {
        switch (type) {
            case 'string':
                return html`<span class="tree-value string">"${this._escapeString(value)}"</span>`;
            case 'number':
                return html`<span class="tree-value number">${value}</span>`;
            case 'boolean':
                return html`<span class="tree-value boolean">${value}</span>`;
            case 'null':
                return html`<span class="tree-value null">null</span>`;
            default:
                return html`<span class="tree-value">${String(value)}</span>`;
        }
    }

    _getType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    _escapeString(str) {
        if (str.length > 100) {
            return str.substring(0, 100) + '...';
        }
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    render() {
        if (!this.content) {
            return html`
                <div class="container">
                    <div class="empty-state">
                        <dash-icon name="braces" size="32"></dash-icon>
                        <span>No content to display</span>
                    </div>
                </div>
            `;
        }

        if (this._parseError) {
            return html`
                <div class="container">
                    <div class="toolbar">
                        <span class="filename">${this.filename || 'json'}</span>
                    </div>
                    <div class="error-state">
                        <dash-icon name="alert-circle" size="32"></dash-icon>
                        <span>Invalid JSON</span>
                        <div class="error-message">${this._parseError}</div>
                    </div>
                </div>
            `;
        }

        const stats = this._getStats();

        return html`
            <div class="container">
                <div class="toolbar">
                    <div class="toolbar-left">
                        <span class="filename">${this.filename || 'json'}</span>
                        ${stats ? html`<span class="stats">${stats}</span>` : ''}
                    </div>
                    <div class="actions">
                        <button class="action-btn" @click="${this._expandAll}" title="Expand all">
                            <dash-icon name="unfold-vertical" size="12"></dash-icon>
                        </button>
                        <button class="action-btn" @click="${this._collapseAll}" title="Collapse all">
                            <dash-icon name="fold-vertical" size="12"></dash-icon>
                        </button>
                        <button
                            class="action-btn ${this._viewMode === 'raw' ? 'active' : ''}"
                            @click="${this._toggleViewMode}"
                            title="Toggle tree/raw view"
                        >
                            <dash-icon name="${this._viewMode === 'raw' ? 'list-tree' : 'code'}" size="12"></dash-icon>
                            ${this._viewMode === 'raw' ? 'Tree' : 'Raw'}
                        </button>
                        <button
                            class="action-btn ${this._copied ? 'copied' : ''}"
                            @click="${this._copyContent}"
                            title="Copy formatted JSON"
                        >
                            <dash-icon name="${this._copied ? 'check' : 'copy'}" size="12"></dash-icon>
                            ${this._copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div class="content-wrapper">
                    ${this._viewMode === 'raw'
                        ? html`<div class="raw-view">${JSON.stringify(this._parsed, null, 2)}</div>`
                        : html`<div class="tree-view">${this._renderValue(this._parsed)}</div>`
                    }
                </div>
            </div>
        `;
    }
}

customElements.define('json-tree-viewer', JsonTreeViewer);
export { JsonTreeViewer };
