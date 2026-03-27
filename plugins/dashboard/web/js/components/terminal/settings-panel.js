/**
 * Settings Panel - SDK configuration panel with localStorage persistence
 * Replaces agent-tools-panel with comprehensive SDK settings
 * @module components/terminal/settings-panel
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';
import '../atoms/segmented-control.js';
import '../molecules/collapsible-section.js';
import '../molecules/toggle-row.js';
import '../molecules/slider-row.js';

/**
 * Default SDK settings configuration
 * @type {Object}
 */
const DEFAULT_SETTINGS = {
    model: 'opus',                    // enum: sonnet, opus
    permissionMode: 'bypassPermissions',  // enum: default, acceptEdits, plan, bypassPermissions
    extendedThinking: true,           // boolean
    continueConversation: false,      // boolean
    maxTurns: 50,                     // integer: 10-200
    fileCheckpointing: false,         // boolean
    sandboxMode: true,                // boolean
    maxThinkingTokens: 16000,         // integer: 1000-32000
    betaContext1m: false,             // boolean: enable 1M context beta
    mcpTools: true,                   // boolean
    toolRestrictions: 'all',          // enum: all, read-only, no-bash, custom
    fallbackModel: 'sonnet',          // display only
    maxRetries: 3                     // integer: 0-10
};

const STORAGE_KEY = 'claude-sdk-settings';

class SettingsPanel extends LitElement {
    static properties = {
        expanded: { type: Boolean, reflect: true },
        _settings: { type: Object, state: true }
    };

    static styles = css`
        :host {
            display: block;
            overflow: hidden;
            max-height: 0;
            opacity: 0;
            transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
        }

        :host([expanded]) {
            max-height: 600px;
            opacity: 1;
        }

        .panel {
            background: var(--bg-secondary, #252526);
            border-top: 1px solid var(--border-color, #3c3c3c);
        }

        /* Header */
        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            border-bottom: 1px solid var(--border-color, #3c3c3c);
        }

        .panel-title {
            font-size: var(--font-size-md, 13px);
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

        .close-btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--accent-color, #007acc);
        }

        /* Content */
        .panel-content {
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            max-height: 450px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--text-muted, #6e7681) transparent;
        }

        .panel-content::-webkit-scrollbar {
            width: 6px;
        }

        .panel-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .panel-content::-webkit-scrollbar-thumb {
            background: var(--text-muted, #6e7681);
            border-radius: 3px;
        }

        /* Sections */
        .sections {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md, 12px);
        }

        /* Model Section - Always visible */
        .model-section {
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            background: var(--bg-tertiary, #2d2d2d);
            border-radius: var(--radius-md, 6px);
        }

        .model-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--spacing-sm, 8px);
        }

        .model-label {
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #cccccc);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        segmented-control {
            width: 100%;
        }

        /* Section content spacing */
        .section-content {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm, 8px);
        }

        .section-divider {
            height: 1px;
            background: var(--border-color, #3c3c3c);
            margin: var(--spacing-xs, 4px) 0;
        }

        /* Setting row with segmented control */
        .setting-row {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) 0;
        }

        .setting-row-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        .setting-row-header dash-icon {
            color: var(--text-muted, #6e7681);
            flex-shrink: 0;
        }

        .setting-row-label {
            font-size: var(--font-size-sm, 12px);
            font-weight: 500;
            color: var(--text-primary, #cccccc);
        }

        .setting-row-description {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            margin-left: 22px;
            margin-bottom: var(--spacing-xs, 4px);
        }

        .setting-row segmented-control {
            width: 100%;
        }

        /* Info row for display-only values */
        .info-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-xs, 4px) 0;
        }

        .info-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            font-size: var(--font-size-sm, 12px);
            color: var(--text-secondary, #8b949e);
        }

        .info-label dash-icon {
            color: var(--text-muted, #6e7681);
        }

        .info-value {
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: var(--font-size-sm, 12px);
            color: var(--text-muted, #6e7681);
        }

        /* Footer */
        .panel-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding: var(--spacing-sm, 8px) var(--spacing-lg, 16px);
            border-top: 1px solid var(--border-color, #3c3c3c);
        }

        .reset-btn {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            border: none;
            background: transparent;
            color: var(--text-muted, #6e7681);
            font-size: var(--font-size-xs, 11px);
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: all 0.15s ease;
        }

        .reset-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.1));
            color: var(--text-secondary, #8b949e);
        }

        .reset-btn:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px var(--accent-color, #007acc);
        }

        /* Permission Mode Card Selector */
        .perm-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
        }

        .perm-card {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 2px;
            padding: 8px 10px;
            border-radius: var(--radius-md, 6px);
            border: 1px solid var(--border-color, #3c3c3c);
            background: var(--bg-tertiary, #2d2d2d);
            cursor: pointer;
            transition: all 0.15s ease;
            overflow: hidden;
        }

        .perm-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 3px;
            height: 100%;
            border-radius: 3px 0 0 3px;
            opacity: 0;
            transition: opacity 0.15s ease;
        }

        .perm-card:hover {
            border-color: var(--text-muted, #6e7681);
        }

        .perm-card[data-active] {
            border-color: transparent;
        }

        .perm-card[data-active]::before {
            opacity: 1;
        }

        .perm-card-top {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .perm-card-icon {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-sm, 4px);
            flex-shrink: 0;
        }

        .perm-card-icon svg {
            width: 11px;
            height: 11px;
        }

        .perm-card-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary, #8b949e);
            letter-spacing: 0.2px;
        }

        .perm-card[data-active] .perm-card-label {
            color: var(--text-primary, #ccc);
        }

        .perm-card-desc {
            font-size: 10px;
            color: var(--text-muted, #6e7681);
            line-height: 1.3;
            padding-left: 22px;
        }

        /* Default mode - neutral gray */
        .perm-card.mode-default::before { background: var(--text-muted, #6e7681); }
        .perm-card.mode-default[data-active] { background: rgba(110, 118, 129, 0.1); border-color: rgba(110, 118, 129, 0.3); }
        .perm-card.mode-default .perm-card-icon { background: rgba(110, 118, 129, 0.15); color: #8b949e; }

        /* Plan mode - blue/purple */
        .perm-card.mode-plan::before { background: #a882ff; }
        .perm-card.mode-plan[data-active] { background: rgba(168, 130, 255, 0.08); border-color: rgba(168, 130, 255, 0.3); }
        .perm-card.mode-plan .perm-card-icon { background: rgba(168, 130, 255, 0.15); color: #a882ff; }

        /* Auto-edit mode - green */
        .perm-card.mode-acceptEdits::before { background: #4ade80; }
        .perm-card.mode-acceptEdits[data-active] { background: rgba(74, 222, 128, 0.08); border-color: rgba(74, 222, 128, 0.3); }
        .perm-card.mode-acceptEdits .perm-card-icon { background: rgba(74, 222, 128, 0.15); color: #4ade80; }

        /* Bypass mode - amber/warning */
        .perm-card.mode-bypassPermissions::before { background: #fbbf24; }
        .perm-card.mode-bypassPermissions[data-active] { background: rgba(251, 191, 36, 0.08); border-color: rgba(251, 191, 36, 0.3); }
        .perm-card.mode-bypassPermissions .perm-card-icon { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    `;

    constructor() {
        super();
        this.expanded = false;
        this._settings = { ...DEFAULT_SETTINGS };
    }

    connectedCallback() {
        super.connectedCallback();
        this._loadSettings();
    }

    /**
     * Load settings from localStorage
     */
    _loadSettings() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to ensure all keys exist
                this._settings = { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (e) {
            console.warn('[SettingsPanel] Failed to load settings from localStorage:', e);
            this._settings = { ...DEFAULT_SETTINGS };
        }
    }

    /**
     * Save settings to localStorage
     */
    _saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
        } catch (e) {
            console.warn('[SettingsPanel] Failed to save settings to localStorage:', e);
        }
    }

    /**
     * Update a single setting and persist
     * @param {string} setting - Setting key
     * @param {*} value - New value
     */
    _updateSetting(setting, value) {
        this._settings = { ...this._settings, [setting]: value };
        this._saveSettings();

        this.dispatchEvent(new CustomEvent('settings-change', {
            detail: { setting, value, settings: { ...this._settings } },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Reset all settings to defaults
     */
    _resetSettings() {
        this._settings = { ...DEFAULT_SETTINGS };
        this._saveSettings();

        this.dispatchEvent(new CustomEvent('settings-reset', {
            detail: { settings: { ...this._settings } },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Get current settings (public API)
     * @returns {Object} Current settings
     */
    getSettings() {
        return { ...this._settings };
    }

    /**
     * Set model externally (public API for bidirectional sync)
     * @param {string} model - 'sonnet' or 'opus'
     */
    setModel(model) {
        if (model !== this._settings.model && ['sonnet', 'opus'].includes(model)) {
            this._updateSetting('model', model);
        }
    }

    _handleClose() {
        this.expanded = false;
        this.dispatchEvent(new CustomEvent('panel-close', { bubbles: true, composed: true }));
    }

    _handleModelChange(e) {
        this._updateSetting('model', e.detail.value);
    }

    _handleToggleChange(setting) {
        return (e) => {
            this._updateSetting(setting, e.detail.checked);
        };
    }

    _handleSliderChange(setting) {
        return (e) => {
            this._updateSetting(setting, e.detail.value);
        };
    }

    _handleSegmentedChange(setting) {
        return (e) => {
            this._updateSetting(setting, e.detail.value);
        };
    }

    _handlePermissionSelect(mode) {
        this._updateSetting('permissionMode', mode);
    }

    render() {
        const modelOptions = [
            { value: 'sonnet', label: 'Sonnet' },
            { value: 'opus', label: 'Opus' }
        ];

        const permissionModeOptions = [
            { value: 'default', label: 'Default' },
            { value: 'plan', label: 'Plan' },
            { value: 'acceptEdits', label: 'Auto-Edit' },
            { value: 'bypassPermissions', label: 'Bypass' }
        ];

        const toolRestrictionOptions = [
            { value: 'all', label: 'All Tools' },
            { value: 'read-only', label: 'Read Only' },
            { value: 'no-bash', label: 'No Bash' }
        ];

        return html`
            <div class="panel">
                <!-- Header -->
                <div class="panel-header">
                    <span class="panel-title">Settings</span>
                    <button class="close-btn" @click="${this._handleClose}" title="Close">
                        <dash-icon name="x" size="14"></dash-icon>
                    </button>
                </div>

                <!-- Content -->
                <div class="panel-content">
                    <div class="sections">
                        <!-- Model Section - Always visible -->
                        <div class="model-section">
                            <div class="model-header">
                                <span class="model-label">Model</span>
                            </div>
                            <segmented-control
                                full-width
                                .options="${modelOptions}"
                                .value="${this._settings.model}"
                                @dash-change="${this._handleModelChange}"
                            ></segmented-control>
                        </div>

                        <!-- Behavior Section - Collapsible, expanded by default -->
                        <collapsible-section title="Behavior" expanded>
                            <div class="section-content">
                                <toggle-row
                                    label="Extended Thinking"
                                    description="Enable Claude's extended thinking for complex reasoning"
                                    icon="brain"
                                    .checked="${this._settings.extendedThinking}"
                                    @change="${this._handleToggleChange('extendedThinking')}"
                                ></toggle-row>

                                <toggle-row
                                    label="Continue Conversation"
                                    description="Resume from previous conversation context"
                                    icon="message-circle"
                                    .checked="${this._settings.continueConversation}"
                                    @change="${this._handleToggleChange('continueConversation')}"
                                ></toggle-row>

                                <div class="section-divider"></div>

                                <slider-row
                                    label="Max Turns"
                                    description="Maximum agentic turns per request"
                                    icon="repeat"
                                    .min="${10}"
                                    .max="${200}"
                                    .value="${this._settings.maxTurns}"
                                    .step="${10}"
                                    @change="${this._handleSliderChange('maxTurns')}"
                                ></slider-row>

                                <toggle-row
                                    label="MCP Tools"
                                    description="Enable Model Context Protocol tools"
                                    icon="plug"
                                    .checked="${this._settings.mcpTools}"
                                    @change="${this._handleToggleChange('mcpTools')}"
                                ></toggle-row>

                                <div class="section-divider"></div>

                                <div class="setting-row">
                                    <div class="setting-row-header">
                                        <dash-icon name="wrench" size="14"></dash-icon>
                                        <span class="setting-row-label">Tool Access</span>
                                    </div>
                                    <span class="setting-row-description">Restrict which tools Claude can use</span>
                                    <segmented-control
                                        full-width
                                        .options="${toolRestrictionOptions}"
                                        .value="${this._settings.toolRestrictions}"
                                        @dash-change="${this._handleSegmentedChange('toolRestrictions')}"
                                    ></segmented-control>
                                </div>
                            </div>
                        </collapsible-section>

                        <!-- Safety Section - Collapsible, expanded by default -->
                        <collapsible-section title="Safety" expanded>
                            <div class="section-content">
                                <div class="setting-row">
                                    <div class="setting-row-header">
                                        <dash-icon name="shield" size="14"></dash-icon>
                                        <span class="setting-row-label">Permission Mode</span>
                                    </div>
                                    <div class="perm-grid">
                                        <div class="perm-card mode-default" ?data-active=${this._settings.permissionMode === 'default'} @click=${() => this._handlePermissionSelect('default')}>
                                            <div class="perm-card-top">
                                                <span class="perm-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 12 15 16 10"></polyline></svg></span>
                                                <span class="perm-card-label">Default</span>
                                            </div>
                                            <span class="perm-card-desc">Ask before each action</span>
                                        </div>
                                        <div class="perm-card mode-plan" ?data-active=${this._settings.permissionMode === 'plan'} @click=${() => this._handlePermissionSelect('plan')}>
                                            <div class="perm-card-top">
                                                <span class="perm-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg></span>
                                                <span class="perm-card-label">Plan</span>
                                            </div>
                                            <span class="perm-card-desc">Review plan before execution</span>
                                        </div>
                                        <div class="perm-card mode-acceptEdits" ?data-active=${this._settings.permissionMode === 'acceptEdits'} @click=${() => this._handlePermissionSelect('acceptEdits')}>
                                            <div class="perm-card-top">
                                                <span class="perm-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></span>
                                                <span class="perm-card-label">Auto-Edit</span>
                                            </div>
                                            <span class="perm-card-desc">Auto-approve file changes</span>
                                        </div>
                                        <div class="perm-card mode-bypassPermissions" ?data-active=${this._settings.permissionMode === 'bypassPermissions'} @click=${() => this._handlePermissionSelect('bypassPermissions')}>
                                            <div class="perm-card-top">
                                                <span class="perm-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg></span>
                                                <span class="perm-card-label">YOLO</span>
                                            </div>
                                            <span class="perm-card-desc">Skip all permission checks</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="section-divider"></div>

                                <toggle-row
                                    label="Sandbox Mode"
                                    description="Run file operations in isolated sandbox"
                                    icon="shield"
                                    .checked="${this._settings.sandboxMode}"
                                    @change="${this._handleToggleChange('sandboxMode')}"
                                ></toggle-row>

                                <toggle-row
                                    label="File Checkpointing"
                                    description="Create restore points before file modifications"
                                    icon="save"
                                    .checked="${this._settings.fileCheckpointing}"
                                    @change="${this._handleToggleChange('fileCheckpointing')}"
                                ></toggle-row>
                            </div>
                        </collapsible-section>

                        <!-- Advanced Section - Collapsible, collapsed by default -->
                        <collapsible-section title="Advanced">
                            <div class="section-content">
                                <slider-row
                                    label="Max Thinking Tokens"
                                    description="Token budget for extended thinking"
                                    icon="activity"
                                    .min="${1000}"
                                    .max="${32000}"
                                    .value="${this._settings.maxThinkingTokens}"
                                    .step="${1000}"
                                    @change="${this._handleSliderChange('maxThinkingTokens')}"
                                ></slider-row>

                                <slider-row
                                    label="Max Retries"
                                    description="Retry attempts on transient errors"
                                    icon="refresh-cw"
                                    .min="${0}"
                                    .max="${10}"
                                    .value="${this._settings.maxRetries}"
                                    .step="${1}"
                                    @change="${this._handleSliderChange('maxRetries')}"
                                ></slider-row>

                                <div class="section-divider"></div>

                                <toggle-row
                                    label="1M Context Window"
                                    description="Enable extended 1M token context (beta)"
                                    icon="maximize-2"
                                    .checked="${this._settings.betaContext1m}"
                                    @change="${this._handleToggleChange('betaContext1m')}"
                                ></toggle-row>

                                <div class="section-divider"></div>

                                <!-- Display-only info -->
                                <div class="info-row">
                                    <span class="info-label">
                                        <dash-icon name="arrow-down" size="14"></dash-icon>
                                        Fallback Model
                                    </span>
                                    <span class="info-value">${this._settings.fallbackModel}</span>
                                </div>
                            </div>
                        </collapsible-section>
                    </div>
                </div>

                <!-- Footer -->
                <div class="panel-footer">
                    <button class="reset-btn" @click="${this._resetSettings}" title="Reset to defaults">
                        <dash-icon name="rotate-ccw" size="12"></dash-icon>
                        Reset to Defaults
                    </button>
                </div>
            </div>
        `;
    }
}

customElements.define('settings-panel', SettingsPanel);
export { SettingsPanel, DEFAULT_SETTINGS, STORAGE_KEY };
