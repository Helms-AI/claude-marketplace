/**
 * Read Tool Card Component
 *
 * Displays file read operations with path, content preview, and line numbers.
 *
 * @module components/tool-cards/read-tool-card
 *
 * @example
 * <read-tool-card .tool=${readToolData}></read-tool-card>
 */

import { LitElement, html, css } from 'lit';
import { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';

/**
 * Read Tool Card Web Component
 */
class ReadToolCard extends ToolCardBase {
    static properties = {
        ...ToolCardBase.properties,
        /** File path that was read */
        filePath: { type: String, attribute: 'file-path' },
        /** File content */
        content: { type: String },
        /** Line offset (if partial read) */
        offset: { type: Number },
        /** Line limit */
        limit: { type: Number },
        /** Total lines in file */
        totalLines: { type: Number, attribute: 'total-lines' },
        /** Detected language for syntax highlighting */
        language: { type: String }
    };

    static styles = [
        toolCardBaseStyles,
        css`
            .file-info {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm, 8px);
                padding: var(--spacing-sm, 8px);
                background: var(--bg-tertiary, #f5f5f5);
                border-radius: var(--radius-sm, 4px);
                margin-bottom: var(--spacing-sm, 8px);
            }

            .file-icon {
                width: 16px;
                height: 16px;
                color: var(--accent-color, #4a90d9);
            }

            .file-path-display {
                flex: 1;
                font-family: var(--font-mono, 'IBM Plex Mono', monospace);
                font-size: var(--font-size-sm, 13px);
                color: var(--accent-color, #4a90d9);
                word-break: break-all;
            }

            .file-stats {
                display: flex;
                gap: var(--spacing-md, 12px);
                font-size: var(--font-size-xs, 11px);
                color: var(--text-muted, #999);
            }

            .stat-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-xs, 4px);
            }

            .code-container {
                position: relative;
                background: var(--code-bg, #1e1e1e);
                border-radius: var(--radius-sm, 4px);
                overflow: hidden;
            }

            .code-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .language-badge {
                font-size: 10px;
                padding: 2px 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: var(--radius-sm, 4px);
                color: var(--code-color, #d4d4d4);
                text-transform: uppercase;
            }

            .code-content {
                display: flex;
                max-height: 400px;
                overflow: auto;
            }

            .line-numbers {
                padding: var(--spacing-sm, 8px);
                background: rgba(0, 0, 0, 0.2);
                text-align: right;
                user-select: none;
                font-family: var(--font-mono, 'IBM Plex Mono', monospace);
                font-size: var(--font-size-xs, 11px);
                color: var(--text-muted, #666);
                line-height: 1.5;
            }

            .code-text {
                flex: 1;
                padding: var(--spacing-sm, 8px);
                font-family: var(--font-mono, 'IBM Plex Mono', monospace);
                font-size: var(--font-size-xs, 11px);
                color: var(--code-color, #d4d4d4);
                line-height: 1.5;
                white-space: pre;
                overflow-x: auto;
            }

            .truncation-notice {
                padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
                background: var(--warning-bg, #fff3cd);
                color: var(--warning-text, #856404);
                font-size: var(--font-size-xs, 11px);
                text-align: center;
            }

            .range-info {
                font-size: var(--font-size-xs, 11px);
                color: var(--text-muted, #999);
                padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
                background: rgba(255, 255, 255, 0.05);
            }

            /* File type icons */
            .file-type-icon {
                width: 16px;
                height: 16px;
            }

            .file-type-icon.js { color: #f7df1e; }
            .file-type-icon.ts { color: #3178c6; }
            .file-type-icon.py { color: #3776ab; }
            .file-type-icon.json { color: #292929; }
            .file-type-icon.md { color: #083fa1; }
            .file-type-icon.html { color: #e34f26; }
            .file-type-icon.css { color: #1572b6; }
        `
    ];

    constructor() {
        super();
        this.toolName = 'Read';
        this.filePath = '';
        this.content = '';
        this.offset = 0;
        this.limit = 0;
        this.totalLines = 0;
        this.language = '';
    }

    _updateFromTool() {
        if (!this.tool) return;

        const { input, result, error } = this.tool;

        // Extract file path from input
        if (input?.file_path) {
            this.filePath = input.file_path;
            this.language = this._detectLanguage(this.filePath);
        }

        // Extract offset and limit
        if (input?.offset) this.offset = input.offset;
        if (input?.limit) this.limit = input.limit;

        // Process result
        if (result) {
            if (typeof result === 'string') {
                this.content = result;
            } else if (typeof result === 'object') {
                this.content = result.content || result.text || '';
                if (result.totalLines) this.totalLines = result.totalLines;
            }
        }

        // Update status
        if (error) {
            this.status = ToolStatus.ERROR;
        } else if (this.tool.status === 'running') {
            this.status = ToolStatus.RUNNING;
        } else if (this.content !== undefined) {
            this.status = ToolStatus.SUCCESS;
        }
    }

    /**
     * Detect language from file extension
     */
    _detectLanguage(path) {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        const langMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'rb': 'ruby',
            'java': 'java',
            'go': 'go',
            'rs': 'rust',
            'c': 'c',
            'cpp': 'cpp',
            'h': 'c',
            'hpp': 'cpp',
            'cs': 'csharp',
            'php': 'php',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'json': 'json',
            'yaml': 'yaml',
            'yml': 'yaml',
            'xml': 'xml',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'bash',
            'fish': 'fish',
            'dockerfile': 'dockerfile',
            'makefile': 'makefile'
        };
        return langMap[ext] || ext;
    }

    /**
     * Get filename from path
     */
    _getFilename() {
        return this.filePath.split('/').pop() || this.filePath;
    }

    /**
     * Get line count
     */
    _getLineCount() {
        if (!this.content) return 0;
        return this.content.split('\n').length;
    }

    _renderToolIcon() {
        return html`
            <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
        `;
    }

    _renderTitle() {
        return html`
            <span class="tool-title" title="${this.filePath}">
                ${this._getFilename() || 'Read File'}
            </span>
        `;
    }

    _renderSubtitle() {
        if (!this.filePath) return '';

        const dir = this.filePath.substring(0, this.filePath.lastIndexOf('/'));
        if (!dir) return '';

        return html`<span class="tool-subtitle" title="${dir}">${dir}</span>`;
    }

    _renderBadges() {
        const badges = [];

        if (this.language) {
            badges.push(html`<span class="badge">${this.language}</span>`);
        }

        const lineCount = this._getLineCount();
        if (lineCount > 0) {
            badges.push(html`<span class="badge">${lineCount} lines</span>`);
        }

        return badges;
    }

    _renderLineNumbers() {
        if (!this.content) return '';

        const lines = this.content.split('\n');
        const startLine = this.offset || 1;

        return lines.map((_, i) => `${startLine + i}`).join('\n');
    }

    _renderContent() {
        const isPartialRead = this.offset > 0 || (this.limit > 0 && this.totalLines > this.limit);

        return html`
            <div class="tool-content">
                <div class="file-info">
                    ${this._renderToolIcon()}
                    <span class="file-path-display">${this.filePath}</span>
                    <button
                        class="copy-btn"
                        @click=${(e) => {
                            e.stopPropagation();
                            this._copyToClipboard(this.filePath, e.currentTarget);
                        }}
                        title="Copy path"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>

                ${this.content ? html`
                    <div class="code-container">
                        <div class="code-header">
                            ${this.language ? html`<span class="language-badge">${this.language}</span>` : ''}
                            <button
                                class="copy-btn"
                                @click=${(e) => {
                                    e.stopPropagation();
                                    this._copyToClipboard(this.content, e.currentTarget);
                                }}
                                title="Copy content"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                        ${isPartialRead ? html`
                            <div class="range-info">
                                Showing lines ${this.offset || 1} - ${(this.offset || 1) + this._getLineCount() - 1}
                                ${this.totalLines ? html` of ${this.totalLines}` : ''}
                            </div>
                        ` : ''}
                        <div class="code-content">
                            <div class="line-numbers">${this._renderLineNumbers()}</div>
                            <div class="code-text">${this.content}</div>
                        </div>
                    </div>
                ` : html`
                    <div class="code-container">
                        <div class="code-content">
                            <div class="code-text" style="color: var(--text-muted);">
                                ${this.status === ToolStatus.RUNNING ? 'Reading file...' : 'Empty file'}
                            </div>
                        </div>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('read-tool-card', ReadToolCard);
export { ReadToolCard };
