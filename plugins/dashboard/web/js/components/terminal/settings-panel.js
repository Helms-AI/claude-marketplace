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
    permissionMode: 'default',        // enum: default, acceptEdits, bypassPermissions
    extendedThinking: true,           // boolean
    continueConversation: false,      // boolean
    maxTurns: 50,                     // integer: 10-200
    fileCheckpointing: false,         // boolean
    sandboxMode: true,                // boolean
    maxThinkingTokens: 16000,         // integer: 1000-32000
    betaFeatures: false,              // boolean
    mcpTools: true,                   // boolean
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

    render() {
        const modelOptions = [
            { value: 'sonnet', label: 'Sonnet' },
            { value: 'opus', label: 'Opus' }
        ];

        const permissionModeOptions = [
            { value: 'default', label: 'Default' },
            { value: 'acceptEdits', label: 'Auto-Edit' },
            { value: 'bypassPermissions', label: 'Bypass' }
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
                            </div>
                        </collapsible-section>

                        <!-- Safety Section - Collapsible, expanded by default -->
                        <collapsible-section title="Safety" expanded>
                            <div class="section-content">
                                <div class="setting-row">
                                    <div class="setting-row-header">
                                        <dash-icon name="lock" size="14"></dash-icon>
                                        <span class="setting-row-label">Permission Mode</span>
                                    </div>
                                    <span class="setting-row-description">Control how tool permissions are handled</span>
                                    <segmented-control
                                        full-width
                                        .options="${permissionModeOptions}"
                                        .value="${this._settings.permissionMode}"
                                        @dash-change="${this._handleSegmentedChange('permissionMode')}"
                                    ></segmented-control>
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
                                    label="Beta Features"
                                    description="Enable experimental SDK features"
                                    icon="flask"
                                    .checked="${this._settings.betaFeatures}"
                                    @change="${this._handleToggleChange('betaFeatures')}"
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
