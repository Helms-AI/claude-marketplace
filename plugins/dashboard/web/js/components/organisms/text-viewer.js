/**
 * Text Viewer Organism - Plain text renderer with line numbers
 * @module components/organisms/text-viewer
 *
 * Default fallback renderer for any text content.
 * Features line numbers, word wrap toggle, and copy functionality.
 *
 * @example
 * ```html
 * <text-viewer
 *   .content="${textContent}"
 *   filename="example.txt"
 * ></text-viewer>
 * ```
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

class TextViewer extends LitElement {
    static properties = {
        content: { type: String },
        filename: { type: String },
        showLineNumbers: { type: Boolean, attribute: 'show-line-numbers' },
        wordWrap: { type: Boolean, attribute: 'word-wrap' },
        maxLines: { type: Number, attribute: 'max-lines' },
        _copied: { type: Boolean, state: true }
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

        .filename {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            font-family: var(--font-mono, 'Fira Code', monospace);
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
            font-family: var(--font-mono, 'Fira Code', monospace);
            font-size: var(--font-size-sm, 12px);
            line-height: 1.5;
        }

        .content {
            display: flex;
            min-width: fit-content;
        }

        /* Line numbers gutter */
        .line-numbers {
            display: flex;
            flex-direction: column;
            padding: var(--spacing-sm, 8px) var(--spacing-sm, 8px);
            padding-right: var(--spacing-md, 12px);
            background: var(--bg-secondary, rgba(255, 255, 255, 0.03));
            border-right: 1px solid var(--border-color, #3c3c3c);
            color: var(--text-muted, #6e7681);
            text-align: right;
            user-select: none;
            flex-shrink: 0;
        }

        .line-number {
            height: 1.5em;
        }

        /* Text content */
        .text-content {
            flex: 1;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            white-space: pre;
            color: var(--text-primary, #cccccc);
        }

        :host([word-wrap]) .text-content {
            white-space: pre-wrap;
            word-break: break-word;
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
        this.showLineNumbers = true;
        this.wordWrap = false;
        this.maxLines = 0;
        this._copied = false;
    }

    updated(changedProperties) {
        if (changedProperties.has('wordWrap')) {
            if (this.wordWrap) {
                this.setAttribute('word-wrap', '');
            } else {
                this.removeAttribute('word-wrap');
            }
        }
    }

    _getLines() {
        if (!this.content) return [];
        const lines = this.content.split('\n');
        if (this.maxLines && lines.length > this.maxLines) {
            return lines.slice(0, this.maxLines);
        }
        return lines;
    }

    _toggleWordWrap() {
        this.wordWrap = !this.wordWrap;
    }

    async _copyContent() {
        try {
            await navigator.clipboard.writeText(this.content);
            this._copied = true;
            setTimeout(() => {
                this._copied = false;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }

    render() {
        const lines = this._getLines();
        const lineCount = lines.length;
        const isTruncated = this.maxLines && this.content.split('\n').length > this.maxLines;

        if (!this.content) {
            return html`
                <div class="container">
                    <div class="empty-state">
                        <dash-icon name="file-text" size="32"></dash-icon>
                        <span>No content to display</span>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="container">
                <div class="toolbar">
                    <span class="filename">${this.filename || 'text'}</span>
                    <div class="actions">
                        <button
                            class="action-btn ${this.wordWrap ? 'active' : ''}"
                            @click="${this._toggleWordWrap}"
                            title="Toggle word wrap"
                        >
                            <dash-icon name="wrap-text" size="12"></dash-icon>
                            Wrap
                        </button>
                        <button
                            class="action-btn ${this._copied ? 'copied' : ''}"
                            @click="${this._copyContent}"
                            title="Copy to clipboard"
                        >
                            <dash-icon name="${this._copied ? 'check' : 'copy'}" size="12"></dash-icon>
                            ${this._copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div class="content-wrapper">
                    <div class="content">
                        ${this.showLineNumbers ? html`
                            <div class="line-numbers">
                                ${lines.map((_, i) => html`
                                    <div class="line-number">${i + 1}</div>
                                `)}
                                ${isTruncated ? html`
                                    <div class="line-number">...</div>
                                ` : ''}
                            </div>
                        ` : ''}
                        <div class="text-content">${lines.join('\n')}${isTruncated ? '\n...' : ''}</div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('text-viewer', TextViewer);
export { TextViewer };
