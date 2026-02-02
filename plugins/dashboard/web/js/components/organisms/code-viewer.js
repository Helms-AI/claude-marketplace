/**
 * Code Viewer Organism - Syntax highlighted code renderer
 * @module components/organisms/code-viewer
 *
 * Renders code with syntax highlighting and line numbers.
 * Supports multiple languages with basic token highlighting.
 *
 * @example
 * ```html
 * <code-viewer
 *   .content="${codeContent}"
 *   language="javascript"
 *   filename="example.js"
 * ></code-viewer>
 * ```
 */
import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import '../atoms/icon.js';

// Token patterns for syntax highlighting
const TOKEN_PATTERNS = {
    javascript: [
        { pattern: /(\/\/.*$)/gm, class: 'comment' },
        { pattern: /(\/\*[\s\S]*?\*\/)/g, class: 'comment' },
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, class: 'string' },
        { pattern: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of)\b/g, class: 'keyword' },
        { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, class: 'constant' },
        { pattern: /\b(\d+\.?\d*)\b/g, class: 'number' },
        { pattern: /\b([A-Z][a-zA-Z0-9]*)\b/g, class: 'class' },
        { pattern: /(\.[a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, class: 'function' },
    ],
    python: [
        { pattern: /(#.*$)/gm, class: 'comment' },
        { pattern: /("""[\s\S]*?"""|'''[\s\S]*?''')/g, class: 'string' },
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, class: 'string' },
        { pattern: /\b(def|class|return|if|elif|else|for|while|break|continue|pass|import|from|as|try|except|finally|raise|with|lambda|yield|global|nonlocal|assert|and|or|not|in|is)\b/g, class: 'keyword' },
        { pattern: /\b(True|False|None)\b/g, class: 'constant' },
        { pattern: /\b(\d+\.?\d*)\b/g, class: 'number' },
        { pattern: /\b([A-Z][a-zA-Z0-9]*)\b/g, class: 'class' },
        { pattern: /@(\w+)/g, class: 'decorator' },
    ],
    html: [
        { pattern: /(&lt;!--[\s\S]*?--&gt;)/g, class: 'comment' },
        { pattern: /(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g, class: 'tag' },
        { pattern: /(\s[a-zA-Z-]+)=/g, class: 'attribute' },
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, class: 'string' },
    ],
    css: [
        { pattern: /(\/\*[\s\S]*?\*\/)/g, class: 'comment' },
        { pattern: /([.#][a-zA-Z_-][a-zA-Z0-9_-]*)/g, class: 'selector' },
        { pattern: /([a-zA-Z-]+)\s*:/g, class: 'property' },
        { pattern: /:\s*([^;{]+)/g, class: 'value' },
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, class: 'string' },
        { pattern: /(#[0-9a-fA-F]{3,8})\b/g, class: 'color' },
        { pattern: /\b(\d+\.?\d*)(px|em|rem|%|vh|vw|deg|s|ms)?\b/g, class: 'number' },
    ],
    json: [
        { pattern: /("(?:[^"\\]|\\.)*")\s*:/g, class: 'key' },
        { pattern: /:\s*("(?:[^"\\]|\\.)*")/g, class: 'string' },
        { pattern: /\b(true|false|null)\b/g, class: 'constant' },
        { pattern: /\b(-?\d+\.?\d*)\b/g, class: 'number' },
    ],
    yaml: [
        { pattern: /(#.*$)/gm, class: 'comment' },
        { pattern: /^(\s*[a-zA-Z_][a-zA-Z0-9_-]*):/gm, class: 'key' },
        { pattern: /:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, class: 'string' },
        { pattern: /\b(true|false|null|yes|no|on|off)\b/gi, class: 'constant' },
        { pattern: /\b(\d+\.?\d*)\b/g, class: 'number' },
    ],
    bash: [
        { pattern: /(#.*$)/gm, class: 'comment' },
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, class: 'string' },
        { pattern: /\$\{?[a-zA-Z_][a-zA-Z0-9_]*\}?/g, class: 'variable' },
        { pattern: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|export|source|alias|cd|ls|echo|cat|grep|sed|awk|find|xargs|sudo|chmod|chown|mkdir|rm|cp|mv)\b/g, class: 'keyword' },
    ],
    rust: [
        { pattern: /(\/\/.*$)/gm, class: 'comment' },
        { pattern: /(\/\*[\s\S]*?\*\/)/g, class: 'comment' },
        { pattern: /("(?:[^"\\]|\\.)*")/g, class: 'string' },
        { pattern: /\b(fn|let|mut|const|static|struct|enum|impl|trait|pub|mod|use|as|self|super|crate|where|for|in|loop|while|if|else|match|return|break|continue|move|ref|type|async|await|dyn|unsafe)\b/g, class: 'keyword' },
        { pattern: /\b(true|false|None|Some|Ok|Err)\b/g, class: 'constant' },
        { pattern: /\b(\d+\.?\d*)\b/g, class: 'number' },
        { pattern: /\b([A-Z][a-zA-Z0-9]*)\b/g, class: 'type' },
    ],
    go: [
        { pattern: /(\/\/.*$)/gm, class: 'comment' },
        { pattern: /(\/\*[\s\S]*?\*\/)/g, class: 'comment' },
        { pattern: /("(?:[^"\\]|\\.)*"|`[^`]*`)/g, class: 'string' },
        { pattern: /\b(package|import|func|return|var|const|type|struct|interface|map|chan|go|defer|if|else|for|range|switch|case|default|break|continue|select|fallthrough)\b/g, class: 'keyword' },
        { pattern: /\b(true|false|nil|iota)\b/g, class: 'constant' },
        { pattern: /\b(\d+\.?\d*)\b/g, class: 'number' },
    ],
};

// Language aliases
const LANGUAGE_ALIASES = {
    js: 'javascript',
    ts: 'javascript',
    typescript: 'javascript',
    jsx: 'javascript',
    tsx: 'javascript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    htm: 'html',
    scss: 'css',
    sass: 'css',
    less: 'css',
    rs: 'rust',
    golang: 'go',
};

class CodeViewer extends LitElement {
    static properties = {
        content: { type: String },
        filename: { type: String },
        language: { type: String },
        showLineNumbers: { type: Boolean, attribute: 'show-line-numbers' },
        wordWrap: { type: Boolean, attribute: 'word-wrap' },
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

        .language-badge {
            font-size: 10px;
            padding: 2px 6px;
            background: var(--bg-tertiary, rgba(255, 255, 255, 0.1));
            border-radius: var(--radius-sm, 4px);
            color: var(--text-muted, #6e7681);
            text-transform: uppercase;
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
            line-height: 1.6;
        }

        .code-container {
            display: flex;
            min-width: fit-content;
        }

        /* Line numbers */
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
            height: 1.6em;
        }

        /* Code content */
        .code-content {
            flex: 1;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            white-space: pre;
            color: var(--text-primary, #cccccc);
        }

        :host([word-wrap]) .code-content {
            white-space: pre-wrap;
            word-break: break-word;
        }

        /* Syntax highlighting colors */
        .token-comment { color: var(--syntax-comment, #6a9955); font-style: italic; }
        .token-string { color: var(--syntax-string, #ce9178); }
        .token-keyword { color: var(--syntax-keyword, #569cd6); }
        .token-constant { color: var(--syntax-constant, #569cd6); }
        .token-number { color: var(--syntax-number, #b5cea8); }
        .token-class { color: var(--syntax-class, #4ec9b0); }
        .token-type { color: var(--syntax-class, #4ec9b0); }
        .token-function { color: var(--syntax-function, #dcdcaa); }
        .token-tag { color: var(--syntax-tag, #569cd6); }
        .token-attribute { color: var(--syntax-attribute, #9cdcfe); }
        .token-selector { color: var(--syntax-selector, #d7ba7d); }
        .token-property { color: var(--syntax-property, #9cdcfe); }
        .token-value { color: var(--syntax-value, #ce9178); }
        .token-color { color: var(--syntax-color, #ce9178); }
        .token-key { color: var(--syntax-key, #9cdcfe); }
        .token-variable { color: var(--syntax-variable, #9cdcfe); }
        .token-decorator { color: var(--syntax-decorator, #dcdcaa); }

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
        this.language = '';
        this.showLineNumbers = true;
        this.wordWrap = false;
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

    _getNormalizedLanguage() {
        const lang = this.language?.toLowerCase() || this._detectLanguage();
        return LANGUAGE_ALIASES[lang] || lang;
    }

    _detectLanguage() {
        if (!this.filename) return 'text';
        const ext = this.filename.split('.').pop()?.toLowerCase();
        const extMap = {
            js: 'javascript',
            ts: 'javascript',
            jsx: 'javascript',
            tsx: 'javascript',
            py: 'python',
            html: 'html',
            htm: 'html',
            css: 'css',
            scss: 'css',
            sass: 'css',
            json: 'json',
            yaml: 'yaml',
            yml: 'yaml',
            sh: 'bash',
            bash: 'bash',
            zsh: 'bash',
            rs: 'rust',
            go: 'go',
        };
        return extMap[ext] || 'text';
    }

    _highlight(code) {
        const language = this._getNormalizedLanguage();
        const patterns = TOKEN_PATTERNS[language];

        if (!patterns) {
            // No highlighting, just escape HTML
            return this._escapeHtml(code);
        }

        // First escape HTML
        let highlighted = this._escapeHtml(code);

        // Apply patterns (in order of priority)
        patterns.forEach(({ pattern, class: tokenClass }) => {
            highlighted = highlighted.replace(pattern, (match, ...groups) => {
                // Use the first captured group if available, otherwise the whole match
                const captured = groups.find(g => typeof g === 'string') || match;
                return match.replace(captured, `<span class="token-${tokenClass}">${captured}</span>`);
            });
        });

        return highlighted;
    }

    _escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    _getLines() {
        return this.content ? this.content.split('\n') : [];
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
        const language = this._getNormalizedLanguage();

        if (!this.content) {
            return html`
                <div class="container">
                    <div class="empty-state">
                        <dash-icon name="file-code" size="32"></dash-icon>
                        <span>No content to display</span>
                    </div>
                </div>
            `;
        }

        return html`
            <div class="container">
                <div class="toolbar">
                    <div class="toolbar-left">
                        <span class="filename">${this.filename || 'code'}</span>
                        <span class="language-badge">${language}</span>
                    </div>
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
                    <div class="code-container">
                        ${this.showLineNumbers ? html`
                            <div class="line-numbers">
                                ${lines.map((_, i) => html`
                                    <div class="line-number">${i + 1}</div>
                                `)}
                            </div>
                        ` : ''}
                        <div class="code-content">${unsafeHTML(this._highlight(this.content))}</div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('code-viewer', CodeViewer);
export { CodeViewer };
