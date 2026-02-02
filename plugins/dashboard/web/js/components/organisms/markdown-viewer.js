/**
 * Markdown Viewer Organism - Markdown renderer with syntax highlighting
 * @module components/organisms/markdown-viewer
 *
 * Renders markdown content using the marked library.
 * Supports syntax highlighting for code blocks.
 *
 * @example
 * ```html
 * <markdown-viewer
 *   .content="${markdownContent}"
 *   filename="README.md"
 * ></markdown-viewer>
 * ```
 */
import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../atoms/icon.js';

class MarkdownViewer extends LitElement {
    static properties = {
        content: { type: String },
        filename: { type: String },
        _copied: { type: Boolean, state: true },
        _viewMode: { type: String, state: true }  // 'rendered' | 'source'
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
            padding: var(--spacing-lg, 16px) var(--spacing-xl, 24px);
        }

        /* Source view */
        .source-view {
            font-family: var(--font-mono, 'Fira Code', monospace);
            font-size: var(--font-size-sm, 12px);
            line-height: 1.6;
            white-space: pre-wrap;
            color: var(--text-primary, #cccccc);
        }

        /* Markdown styles */
        .markdown-content {
            font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif);
            font-size: var(--font-size-base, 13px);
            line-height: 1.6;
            color: var(--text-primary, #cccccc);
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3,
        .markdown-content h4,
        .markdown-content h5,
        .markdown-content h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
            line-height: 1.3;
            color: var(--text-primary, #ffffff);
        }

        .markdown-content h1 { font-size: 1.75em; border-bottom: 1px solid var(--border-color, #3c3c3c); padding-bottom: 0.3em; }
        .markdown-content h2 { font-size: 1.5em; border-bottom: 1px solid var(--border-color, #3c3c3c); padding-bottom: 0.3em; }
        .markdown-content h3 { font-size: 1.25em; }
        .markdown-content h4 { font-size: 1em; }
        .markdown-content h5 { font-size: 0.9em; }
        .markdown-content h6 { font-size: 0.85em; color: var(--text-secondary, #8b949e); }

        .markdown-content p {
            margin: 0.75em 0;
        }

        .markdown-content a {
            color: var(--accent-color, #58a6ff);
            text-decoration: none;
        }

        .markdown-content a:hover {
            text-decoration: underline;
        }

        .markdown-content code {
            font-family: var(--font-mono, 'Fira Code', monospace);
            font-size: 0.9em;
            padding: 0.2em 0.4em;
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.1));
            border-radius: var(--radius-sm, 4px);
        }

        .markdown-content pre {
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: var(--radius-md, 6px);
            padding: var(--spacing-md, 12px);
            overflow-x: auto;
            margin: 1em 0;
        }

        .markdown-content pre code {
            background: none;
            padding: 0;
            font-size: var(--font-size-sm, 12px);
            line-height: 1.5;
        }

        .markdown-content blockquote {
            margin: 1em 0;
            padding: 0 1em;
            border-left: 4px solid var(--accent-color, #58a6ff);
            color: var(--text-secondary, #8b949e);
        }

        .markdown-content ul,
        .markdown-content ol {
            margin: 0.75em 0;
            padding-left: 2em;
        }

        .markdown-content li {
            margin: 0.25em 0;
        }

        .markdown-content img {
            max-width: 100%;
            border-radius: var(--radius-md, 6px);
        }

        .markdown-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }

        .markdown-content th,
        .markdown-content td {
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border: 1px solid var(--border-color, #3c3c3c);
            text-align: left;
        }

        .markdown-content th {
            background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
            font-weight: 600;
        }

        .markdown-content hr {
            border: none;
            border-top: 1px solid var(--border-color, #3c3c3c);
            margin: 2em 0;
        }

        /* Task list */
        .markdown-content input[type="checkbox"] {
            margin-right: 0.5em;
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
        this._copied = false;
        this._viewMode = 'rendered';
    }

    _toggleViewMode() {
        this._viewMode = this._viewMode === 'rendered' ? 'source' : 'rendered';
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

    _renderMarkdown() {
        if (!this.content) return '';

        // Use marked if available, otherwise basic conversion
        if (typeof marked !== 'undefined') {
            try {
                return marked.parse(this.content);
            } catch (e) {
                console.warn('Marked parsing failed:', e);
            }
        }

        // Basic fallback conversion
        return this._basicMarkdownToHtml(this.content);
    }

    _basicMarkdownToHtml(md) {
        // Very basic markdown conversion fallback
        let html = md
            // Escape HTML
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            // Headers
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            // Bold and italic
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/__(.+?)__/g, '<strong>$1</strong>')
            .replace(/_(.+?)_/g, '<em>$1</em>')
            // Code blocks
            .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
            // Lists
            .replace(/^\* (.+)$/gm, '<li>$1</li>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
            // Paragraphs (very basic)
            .replace(/\n\n/g, '</p><p>')
            // Line breaks
            .replace(/\n/g, '<br>');

        return `<p>${html}</p>`;
    }

    render() {
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
                    <span class="filename">${this.filename || 'markdown'}</span>
                    <div class="actions">
                        <button
                            class="action-btn ${this._viewMode === 'source' ? 'active' : ''}"
                            @click="${this._toggleViewMode}"
                            title="Toggle source/rendered view"
                        >
                            <dash-icon name="${this._viewMode === 'source' ? 'eye' : 'code'}" size="12"></dash-icon>
                            ${this._viewMode === 'source' ? 'Preview' : 'Source'}
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
                    ${this._viewMode === 'source'
                        ? html`<div class="source-view">${this.content}</div>`
                        : html`<div class="markdown-content">${unsafeHTML(this._renderMarkdown())}</div>`
                    }
                </div>
            </div>
        `;
    }
}

customElements.define('markdown-viewer', MarkdownViewer);
export { MarkdownViewer };
