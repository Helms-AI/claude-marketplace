/**
 * Terminal Input Component - Command line input for SDK interactions
 * Refactored to use Atomic Design pattern with composable molecules
 * Updated to use settings-panel for SDK configuration
 * @module components/terminal/terminal-input
 */

import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';
import '../molecules/model-toggle.js';
import '../molecules/input-toolbar.js';
import './settings-panel.js';
import { VoiceInputService } from '../../services/voice-input-service.js';

class TerminalInput extends LitElement {
    static properties = {
        placeholder: { type: String },
        disabled: { type: Boolean, reflect: true },
        streaming: { type: Boolean, reflect: true },
        value: { type: String },
        history: { type: Array },
        model: { type: String },
        _historyIndex: { type: Number, state: true },
        _showSettingsPanel: { type: Boolean, state: true },
        _recording: { type: Boolean, state: true },
        _audioLevel: { type: Number, state: true },
        _interimTranscript: { type: String, state: true },
        _currentSettings: { type: Object, state: true }
    };

    static styles = css`
        :host {
            display: block;
            background: var(--bg-secondary, #252526);
            border-top: 1px solid var(--border-color, #3c3c3c);
        }

        .input-container {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: 6px var(--spacing-sm, 8px);
            min-height: 40px;
        }

        /* Input area - more compact with integrated toolbar */
        .input-area {
            flex: 1;
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            background: var(--bg-primary, #1e1e1e);
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: var(--radius-lg, 8px);
            padding: 6px 4px 6px 10px;
            transition: border-color 0.15s ease;
            /* Clip content to container bounds */
            overflow: hidden;
        }

        .input-area:focus-within {
            border-color: var(--accent-color, #007acc);
        }

        .mic-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            min-width: 28px;
            min-height: 28px;
            padding: 0;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-muted, #6e7681);
            cursor: pointer;
            transition: color 0.15s ease, background 0.15s ease, transform 0.1s ease;
            flex-shrink: 0;
            align-self: center;
            /* Glow effect via box-shadow - intensity controlled by CSS variable */
            --glow-intensity: 0;
            box-shadow: 0 0 calc(var(--glow-intensity) * 20px) calc(var(--glow-intensity) * 8px) rgba(239, 68, 68, calc(var(--glow-intensity) * 0.6));
        }

        .mic-btn:hover:not(:disabled) {
            background: var(--bg-hover, rgba(255, 255, 255, 0.08));
            color: var(--text-secondary, #8b949e);
        }

        .mic-btn:active:not(:disabled) {
            transform: scale(0.95);
        }

        .mic-btn.recording {
            color: var(--danger-color, #ef4444);
            background: rgba(239, 68, 68, 0.15);
        }

        .mic-btn.not-supported {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .input-wrapper {
            flex: 1;
            min-width: 0;
            display: flex;
            align-items: center;
        }

        .input {
            width: 100%;
            border: none;
            background: transparent;
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: var(--font-size-sm, 13px);
            color: var(--text-primary, #cccccc);
            outline: none;
            padding: 0;
            line-height: 1.5;
            resize: none;
            overflow-x: hidden;
            overflow-y: auto;
            /* Single line height = font-size * line-height = 13px * 1.5 ≈ 20px */
            min-height: 20px;
            /* Max 3 lines: 20px * 3 = 60px */
            max-height: 60px;
            /* Use field-sizing for natural growth */
            field-sizing: content;
            /* Hide scrollbar until needed */
            scrollbar-width: thin;
            scrollbar-color: var(--text-muted, #6e7681) transparent;
        }

        .input::-webkit-scrollbar {
            width: 4px;
        }

        .input::-webkit-scrollbar-track {
            background: transparent;
        }

        .input::-webkit-scrollbar-thumb {
            background: var(--text-muted, #6e7681);
            border-radius: 2px;
        }

        .input::placeholder {
            color: var(--text-muted, #6e7681);
        }

        .input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        /* Model toggle before mic */
        .model-area {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            align-self: center;
        }

        model-toggle {
            --toggle-size: 28px;
        }

        /* Toolbar inside input area */
        .toolbar-area {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            align-self: center;
        }

        /* Settings panel */
        settings-panel {
            border-top: 1px solid var(--border-color, #3c3c3c);
        }
    `;

    constructor() {
        super();
        this.placeholder = 'Type a message...';
        this.disabled = false;
        this.streaming = false;
        this.value = '';
        this.history = [];
        this.model = 'sonnet';
        this._historyIndex = -1;
        this._showSettingsPanel = false;
        this._recording = false;
        this._audioLevel = 0;
        this._interimTranscript = '';
        this._currentSettings = null;

        // Initialize voice service
        this._voiceService = new VoiceInputService();
        this._voiceCleanup = [];
    }

    connectedCallback() {
        super.connectedCallback();

        // Set up voice service callbacks
        this._voiceCleanup.push(
            this._voiceService.onTranscript((text, isFinal) => {
                if (isFinal) {
                    // Append final transcript to value
                    this.value = this.value ? `${this.value} ${text}` : text;
                    this._interimTranscript = '';
                    // Update the textarea and resize
                    const textarea = this.shadowRoot?.querySelector('.input');
                    if (textarea) {
                        textarea.value = this.value;
                        this._autoResizeTextarea(textarea);
                    }
                } else {
                    // Show interim transcript
                    this._interimTranscript = text;
                }
            }),
            this._voiceService.onAudioLevel((level) => {
                this._audioLevel = level;
                // Update CSS variable for glow effect
                const micBtn = this.shadowRoot?.querySelector('.mic-btn');
                if (micBtn) {
                    micBtn.style.setProperty('--glow-intensity', level.toString());
                }
            }),
            this._voiceService.onStateChange((state) => {
                this._recording = state === 'listening';
                if (state === 'idle') {
                    this._audioLevel = 0;
                    const micBtn = this.shadowRoot?.querySelector('.mic-btn');
                    if (micBtn) micBtn.style.setProperty('--glow-intensity', '0');
                }
            }),
            this._voiceService.onError((error) => {
                console.error('[TerminalInput] Voice error:', error);
                this._recording = false;
                this._audioLevel = 0;
            })
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // Clean up voice service callbacks
        this._voiceCleanup.forEach(cleanup => cleanup());
        this._voiceCleanup = [];
        this._voiceService.stop();
    }

    /**
     * Get current SDK settings from the settings panel
     * @returns {Object|null} Current settings or null if panel not ready
     */
    getSettings() {
        const panel = this.shadowRoot?.querySelector('settings-panel');
        return panel ? panel.getSettings() : this._currentSettings;
    }

    async _handleMicClick() {
        if (!VoiceInputService.isSupported) {
            console.warn('[TerminalInput] Voice input not supported in this browser');
            return;
        }

        const isNowRecording = await this._voiceService.toggle();
        this._recording = isNowRecording;

        this.dispatchEvent(new CustomEvent('mic-toggle', {
            detail: { recording: this._recording },
            bubbles: true,
            composed: true
        }));
    }

    _handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this._handleSend();
        } else if (e.key === 'ArrowUp' && this.history.length > 0) {
            e.preventDefault();
            this._navigateHistory(-1);
        } else if (e.key === 'ArrowDown' && this._historyIndex >= 0) {
            e.preventDefault();
            this._navigateHistory(1);
        } else if (e.key === 'c' && e.ctrlKey && this.streaming) {
            e.preventDefault();
            this._handleInterrupt();
        } else if (e.key === 'Escape') {
            this._showSettingsPanel = false;
        }
    }

    _navigateHistory(direction) {
        const newIndex = this._historyIndex + direction;
        if (newIndex < -1 || newIndex >= this.history.length) return;
        this._historyIndex = newIndex;
        this.value = newIndex === -1 ? '' : this.history[this.history.length - 1 - newIndex];
        requestAnimationFrame(() => {
            const textarea = this.shadowRoot?.querySelector('.input');
            if (textarea) {
                textarea.value = this.value;
                this._autoResizeTextarea(textarea);
                // Move cursor to end
                textarea.setSelectionRange(this.value.length, this.value.length);
            }
        });
    }

    _handleInput(e) {
        this.value = e.target.value;
        this._historyIndex = -1;
        this._autoResizeTextarea(e.target);
    }

    /**
     * Auto-resize textarea to fit content (up to max-height)
     * Fallback for browsers without field-sizing: content support
     */
    _autoResizeTextarea(textarea) {
        if (!textarea) return;

        // Check if browser supports field-sizing (no JS resize needed)
        if (CSS.supports('field-sizing', 'content')) return;

        // Reset and measure
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        // Clamp between min (20px) and max (60px)
        textarea.style.height = `${Math.min(Math.max(scrollHeight, 20), 60)}px`;
    }

    /**
     * Reset textarea to single line
     */
    _resetTextareaHeight() {
        const textarea = this.shadowRoot?.querySelector('.input');
        if (textarea) {
            textarea.style.height = '';
        }
    }

    _handleSend() {
        const trimmed = this.value.trim();
        if (!trimmed || this.disabled || this.streaming) return;

        // Include current settings in send event
        const settings = this.getSettings();

        this.dispatchEvent(new CustomEvent('send', {
            detail: {
                message: trimmed,
                model: settings?.model || this.model,
                settings: settings
            },
            bubbles: true,
            composed: true
        }));

        this.value = '';
        this._historyIndex = -1;
        const textarea = this.shadowRoot?.querySelector('.input');
        if (textarea) {
            textarea.value = '';
            this._resetTextareaHeight();
        }
    }

    _handleInterrupt() {
        this.dispatchEvent(new CustomEvent('interrupt', { bubbles: true, composed: true }));
    }

    _handleModelChange(e) {
        this.model = e.detail.model;

        // Sync model change to settings panel (bidirectional sync)
        const panel = this.shadowRoot?.querySelector('settings-panel');
        if (panel) {
            panel.setModel(this.model);
        }

        this.dispatchEvent(new CustomEvent('model-change', {
            detail: { model: this.model },
            bubbles: true,
            composed: true
        }));
    }

    _handleToolbarSubmit() {
        this._handleSend();
    }

    _handleToolbarInterrupt() {
        this._handleInterrupt();
    }

    _handleToolbarSettings() {
        this._showSettingsPanel = !this._showSettingsPanel;
        this.dispatchEvent(new CustomEvent('settings-toggle', {
            detail: { expanded: this._showSettingsPanel },
            bubbles: true,
            composed: true
        }));
    }

    _handleToolbarAttachment() {
        this.dispatchEvent(new CustomEvent('attachment', { bubbles: true, composed: true }));
    }

    _handlePanelClose() {
        this._showSettingsPanel = false;
    }

    _handleSettingsChange(e) {
        // Track current settings state
        this._currentSettings = e.detail.settings;

        // Update model if it changed in settings
        if (e.detail.setting === 'model') {
            this.model = e.detail.value;
        }

        // Forward settings change event
        this.dispatchEvent(new CustomEvent('settings-change', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    _handleSettingsReset(e) {
        // Track reset settings
        this._currentSettings = e.detail.settings;

        // Update model from reset settings
        this.model = e.detail.settings.model;

        // Forward reset event
        this.dispatchEvent(new CustomEvent('settings-reset', {
            detail: e.detail,
            bubbles: true,
            composed: true
        }));
    }

    focus() {
        const input = this.shadowRoot?.querySelector('.input');
        if (input) input.focus();
    }

    render() {
        const canSubmit = this.value.trim().length > 0;

        return html`
            <div class="input-container">
                <div class="input-area">
                    <div class="model-area">
                        <model-toggle
                            .model="${this.model}"
                            ?disabled="${this.disabled || this.streaming}"
                            compact
                            @model-change="${this._handleModelChange}"
                        ></model-toggle>
                    </div>
                    <button
                        class="mic-btn ${this._recording ? 'recording' : ''} ${!VoiceInputService.isSupported ? 'not-supported' : ''}"
                        title="${!VoiceInputService.isSupported ? 'Voice input not supported in this browser' : this._recording ? 'Stop recording' : 'Voice input'}"
                        ?disabled="${this.disabled || this.streaming || !VoiceInputService.isSupported}"
                        @click="${this._handleMicClick}"
                    >
                        <dash-icon name="${this._recording ? 'mic-off' : 'mic'}" size="16"></dash-icon>
                    </button>
                    <div class="input-wrapper">
                        <textarea
                            class="input"
                            rows="1"
                            .value="${this.value}"
                            placeholder="${this._recording && this._interimTranscript ? this._interimTranscript : this.placeholder}"
                            ?disabled="${this.disabled || this.streaming}"
                            @input="${this._handleInput}"
                            @keydown="${this._handleKeyDown}"
                        ></textarea>
                    </div>
                    <div class="toolbar-area">
                        <input-toolbar
                            compact
                            .model="${this.model}"
                            ?streaming="${this.streaming}"
                            ?disabled="${this.disabled}"
                            ?can-submit="${canSubmit}"
                            .showModel="${false}"
                            @submit="${this._handleToolbarSubmit}"
                            @interrupt="${this._handleToolbarInterrupt}"
                            @settings="${this._handleToolbarSettings}"
                            @attachment="${this._handleToolbarAttachment}"
                        ></input-toolbar>
                    </div>
                </div>
            </div>

            <settings-panel
                ?expanded="${this._showSettingsPanel}"
                @panel-close="${this._handlePanelClose}"
                @settings-change="${this._handleSettingsChange}"
                @settings-reset="${this._handleSettingsReset}"
            ></settings-panel>
        `;
    }
}

customElements.define('terminal-input', TerminalInput);
export { TerminalInput };
