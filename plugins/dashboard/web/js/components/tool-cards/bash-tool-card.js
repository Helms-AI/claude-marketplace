/**
 * Bash Tool Card Component
 *
 * Displays Bash command execution with input, output, and exit code.
 *
 * @module components/tool-cards/bash-tool-card
 *
 * @example
 * <bash-tool-card .tool=${bashToolData}></bash-tool-card>
 */

import { LitElement, html, css } from 'lit';
import { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';

/**
 * Bash Tool Card Web Component
 */
class BashToolCard extends ToolCardBase {
    static properties = {
        ...ToolCardBase.properties,
        /** The command that was executed */
        command: { type: String },
        /** Command output (stdout) */
        output: { type: String },
        /** Error output (stderr) */
        stderr: { type: String },
        /** Exit code */
        exitCode: { type: Number, attribute: 'exit-code' },
        /** Working directory */
        cwd: { type: String }
    };

    static styles = [
        toolCardBaseStyles,
        css`
            .command-line {
                display: flex;
                align-items: flex-start;
                gap: var(--spacing-sm, 8px);
                padding: var(--spacing-sm, 8px);
                background: var(--code-bg, #1e1e1e);
                border-radius: var(--radius-sm, 4px);
                margin-bottom: var(--spacing-sm, 8px);
            }

            .prompt {
                color: var(--success-color, #28a745);
                font-family: var(--font-mono, 'IBM Plex Mono', monospace);
                font-size: var(--font-size-sm, 13px);
                user-select: none;
            }

            .command-text {
                flex: 1;
                font-family: var(--font-mono, 'IBM Plex Mono', monospace);
                font-size: var(--font-size-sm, 13px);
                color: var(--code-color, #d4d4d4);
                word-break: break-all;
                white-space: pre-wrap;
            }

            .output-block {
                background: var(--code-bg, #1e1e1e);
                border-radius: var(--radius-sm, 4px);
                overflow: hidden;
            }

            .output-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .output-title {
                font-size: var(--font-size-xs, 11px);
                color: var(--text-muted, #999);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .output-content {
                padding: var(--spacing-sm, 8px);
                max-height: 300px;
                overflow: auto;
                font-family: var(--font-mono, 'IBM Plex Mono', monospace);
                font-size: var(--font-size-xs, 11px);
                color: var(--code-color, #d4d4d4);
                line-height: 1.5;
                white-space: pre-wrap;
                word-break: break-all;
            }

            .output-content.stderr {
                color: var(--error-color, #dc3545);
            }

            .output-content.empty {
                color: var(--text-muted, #666);
                font-style: italic;
            }

            .exit-code {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-xs, 4px);
                padding: 2px 8px;
                border-radius: var(--radius-sm, 4px);
                font-size: var(--font-size-xs, 11px);
                font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            }

            .exit-code.success {
                background: var(--success-bg, #d4edda);
                color: var(--success-color, #28a745);
            }

            .exit-code.error {
                background: var(--error-bg, #f8d7da);
                color: var(--error-color, #dc3545);
            }

            .cwd-display {
                font-size: var(--font-size-xs, 11px);
                color: var(--text-muted, #999);
                margin-bottom: var(--spacing-sm, 8px);
            }

            .cwd-path {
                font-family: var(--font-mono, 'IBM Plex Mono', monospace);
                color: var(--accent-color, #4a90d9);
            }

            .line-numbers {
                color: var(--text-muted, #666);
                user-select: none;
                padding-right: var(--spacing-sm, 8px);
                text-align: right;
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                margin-right: var(--spacing-sm, 8px);
            }
        `
    ];

    constructor() {
        super();
        this.toolName = 'Bash';
        this.command = '';
        this.output = '';
        this.stderr = '';
        this.exitCode = null;
        this.cwd = '';
    }

    _updateFromTool() {
        if (!this.tool) return;

        const { input, result, error } = this.tool;

        // Extract command from input
        if (input?.command) {
            this.command = input.command;
        }

        // Extract working directory
        if (input?.cwd) {
            this.cwd = input.cwd;
        }

        // Process result
        if (result) {
            if (typeof result === 'string') {
                this.output = result;
            } else if (typeof result === 'object') {
                this.output = result.stdout || result.output || '';
                this.stderr = result.stderr || '';
                this.exitCode = result.exitCode ?? result.exit_code ?? null;
            }
        }

        // Update status
        if (error) {
            this.status = ToolStatus.ERROR;
            this.stderr = error.message || String(error);
        } else if (this.exitCode !== null) {
            this.status = this.exitCode === 0 ? ToolStatus.SUCCESS : ToolStatus.ERROR;
        } else if (this.tool.status === 'running') {
            this.status = ToolStatus.RUNNING;
        } else if (this.output || this.stderr) {
            this.status = ToolStatus.SUCCESS;
        }
    }

    _renderToolIcon() {
        return html`
            <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="4 17 10 11 4 5"></polyline>
                <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
        `;
    }

    _renderTitle() {
        const shortCommand = this.command.length > 50
            ? this.command.substring(0, 50) + '...'
            : this.command;

        return html`
            <span class="tool-title" title="${this.command}">
                ${shortCommand || 'Bash Command'}
            </span>
        `;
    }

    _renderBadges() {
        const badges = [];

        if (this.exitCode !== null) {
            const isSuccess = this.exitCode === 0;
            badges.push(html`
                <span class="exit-code ${isSuccess ? 'success' : 'error'}">
                    Exit: ${this.exitCode}
                </span>
            `);
        }

        if (this.status === ToolStatus.RUNNING) {
            badges.push(html`<span class="badge badge-info">Running</span>`);
        }

        return badges;
    }

    _renderContent() {
        return html`
            <div class="tool-content">
                ${this.cwd ? html`
                    <div class="cwd-display">
                        <span>Working directory: </span>
                        <span class="cwd-path">${this.cwd}</span>
                    </div>
                ` : ''}

                <div class="command-line">
                    <span class="prompt">$</span>
                    <span class="command-text">${this.command}</span>
                    <button
                        class="copy-btn"
                        @click=${(e) => {
                            e.stopPropagation();
                            this._copyToClipboard(this.command, e.currentTarget);
                        }}
                        title="Copy command"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>

                ${this.output ? html`
                    <div class="output-section">
                        <div class="output-block">
                            <div class="output-header">
                                <span class="output-title">Output</span>
                                <button
                                    class="copy-btn"
                                    @click=${(e) => {
                                        e.stopPropagation();
                                        this._copyToClipboard(this.output, e.currentTarget);
                                    }}
                                    title="Copy output"
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="output-content">${this.output}</div>
                        </div>
                    </div>
                ` : ''}

                ${this.stderr ? html`
                    <div class="output-section">
                        <div class="output-block">
                            <div class="output-header">
                                <span class="output-title">Error Output</span>
                            </div>
                            <div class="output-content stderr">${this.stderr}</div>
                        </div>
                    </div>
                ` : ''}

                ${!this.output && !this.stderr && this.status !== ToolStatus.RUNNING ? html`
                    <div class="output-block">
                        <div class="output-content empty">No output</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('bash-tool-card', BashToolCard);
export { BashToolCard };
