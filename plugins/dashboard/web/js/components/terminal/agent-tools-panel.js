/**
 * Agent Tools Panel Organism - Expandable settings panel
 * @module components/terminal/agent-tools-panel
 */
import { LitElement, html, css } from 'lit';
import '../atoms/toggle.js';
import '../atoms/icon.js';
import '../molecules/autonomy-selector.js';

class AgentToolsPanel extends LitElement {
    static properties = {
        expanded: { type: Boolean, reflect: true },
        fastMode: { type: Boolean, attribute: 'fast-mode' },
        autonomyLevel: { type: String, attribute: 'autonomy-level' },
        appTesting: { type: Boolean, attribute: 'app-testing' },
        animated: { type: Boolean }
    };

    static styles = css`
        :host {
            display: block;
            overflow: hidden;
            max-height: 0;
            opacity: 0;
            transition: max-height 0.25s ease-out, opacity 0.2s ease-out;
        }

        :host([expanded]) {
            max-height: 300px;
            opacity: 1;
        }

        .panel {
            background: var(--bg-secondary, #252526);
            border-top: 1px solid var(--border-color, #3c3c3c);
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--spacing-md, 12px);
        }

        .panel-title {
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #cccccc);
        }

        .close-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            color: var(--text-muted, #6e7681);
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: all 0.15s ease;
        }

        .close-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            color: var(--text-primary, #cccccc);
        }

        .close-btn svg {
            width: 14px;
            height: 14px;
        }

        .sections {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md, 12px);
        }

        .section {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs, 4px);
        }

        .section-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--spacing-md, 12px);
        }

        .section-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        .label-text {
            font-size: var(--font-size-sm, 12px);
            font-weight: 500;
            color: var(--text-primary, #cccccc);
        }

        .label-icon {
            color: var(--text-muted, #6e7681);
        }

        dash-icon.label-icon {
            --icon-color: currentColor;
        }

        .section-description {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            margin-left: 24px;
        }

        /* Fast mode section */
        .fast-section .label-icon {
            color: var(--accent-color, #007acc);
        }

        /* Autonomy section */
        .autonomy-section {
            padding-top: var(--spacing-sm, 8px);
            border-top: 1px solid var(--border-color, #3c3c3c);
        }

        /* App testing section */
        .testing-section {
            padding-top: var(--spacing-sm, 8px);
            border-top: 1px solid var(--border-color, #3c3c3c);
        }

        .testing-section .label-icon {
            color: var(--warning-color, #f59e0b);
        }
    `;

    constructor() {
        super();
        this.expanded = false;
        this.fastMode = false;
        this.autonomyLevel = 'medium';
        this.appTesting = false;
        this.animated = true;
    }

    _handleClose() {
        this.expanded = false;
        this.dispatchEvent(new CustomEvent('panel-close', { bubbles: true, composed: true }));
    }

    _handleFastModeChange(e) {
        this.fastMode = e.detail.checked;
        this.dispatchEvent(new CustomEvent('fast-mode-change', {
            detail: { enabled: this.fastMode },
            bubbles: true,
            composed: true
        }));
    }

    _handleAutonomyChange(e) {
        this.autonomyLevel = e.detail.level;
        this.dispatchEvent(new CustomEvent('autonomy-change', {
            detail: { level: this.autonomyLevel },
            bubbles: true,
            composed: true
        }));
    }

    _handleAppTestingChange(e) {
        this.appTesting = e.detail.checked;
        this.dispatchEvent(new CustomEvent('app-testing-change', {
            detail: { enabled: this.appTesting },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div class="panel">
                <div class="panel-header">
                    <span class="panel-title">Agent Tools</span>
                    <button class="close-btn" @click="${this._handleClose}" title="Close">
                        <dash-icon name="x" size="14"></dash-icon>
                    </button>
                </div>

                <div class="sections">
                    <!-- Fast Mode -->
                    <div class="section fast-section">
                        <div class="section-row">
                            <div class="section-label">
                                <dash-icon class="label-icon" name="zap" size="16"></dash-icon>
                                <span class="label-text">Fast</span>
                            </div>
                            <dash-toggle
                                .checked="${this.fastMode}"
                                size="sm"
                                @dash-change="${this._handleFastModeChange}"
                            ></dash-toggle>
                        </div>
                        <div class="section-description">Make lightweight changes, quickly</div>
                    </div>

                    <!-- Autonomy Level -->
                    <div class="section autonomy-section">
                        <autonomy-selector
                            .level="${this.autonomyLevel}"
                            @autonomy-change="${this._handleAutonomyChange}"
                        ></autonomy-selector>
                    </div>

                    <!-- App Testing -->
                    <div class="section testing-section">
                        <div class="section-row">
                            <div class="section-label">
                                <dash-icon class="label-icon" name="flag" size="16"></dash-icon>
                                <span class="label-text">App testing</span>
                            </div>
                            <dash-toggle
                                .checked="${this.appTesting}"
                                size="sm"
                                @dash-change="${this._handleAppTestingChange}"
                            ></dash-toggle>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('agent-tools-panel', AgentToolsPanel);
export { AgentToolsPanel };
