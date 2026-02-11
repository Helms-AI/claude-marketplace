/**
 * Events Settings Dropdown Component
 * @module components/molecules/events-settings-dropdown
 *
 * Settings dropdown for events panel:
 * - Buffer size slider (100-2000 events)
 * - Event type visibility toggles
 * - Clear all events button
 * - Export events button
 */

import { LitElement, html, css } from 'lit';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions, sseEventStats } from '../../store/app-state.js';
import { EventsService } from '../../services/events-service.js';
import '../atoms/icon.js';
import '../atoms/button.js';

/**
 * Common event types that can be toggled
 */
const TOGGLEABLE_TYPES = [
    { id: 'heartbeat', label: 'Heartbeat', description: 'Connection keep-alive signals' },
    { id: 'connected', label: 'Connected', description: 'SSE connection events' },
    { id: 'changeset_update', label: 'Bulk Updates', description: 'Full changeset data refreshes' }
];

class EventsSettingsDropdown extends SignalWatcher(LitElement) {
    static properties = {
        open: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: inline-block;
            position: relative;
        }

        .trigger {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            color: var(--text-muted, #9ca3af);
            cursor: pointer;
            border-radius: var(--radius-sm, 4px);
            transition: all var(--transition-fast, 150ms ease);
        }

        .trigger:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
            color: var(--text-primary, #e0e0e0);
        }

        .trigger.active {
            background: var(--accent-color-alpha, rgba(59, 130, 246, 0.15));
            color: var(--accent-color, #3b82f6);
        }

        .dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            width: 260px;
            margin-top: 4px;
            background: var(--bg-primary, #1e1e1e);
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: var(--radius-md, 8px);
            box-shadow: var(--shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.3));
            z-index: 100;
            display: none;
            overflow: hidden;
        }

        .dropdown.open {
            display: block;
            animation: dropdownSlide 0.15s ease-out;
        }

        @keyframes dropdownSlide {
            from {
                opacity: 0;
                transform: translateY(-4px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .section {
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #3c3c3c);
        }

        .section:last-child {
            border-bottom: none;
        }

        .section-title {
            font-size: var(--font-size-xs, 10px);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted, #6b7280);
            margin-bottom: var(--spacing-xs, 4px);
        }

        /* Buffer size slider */
        .slider-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        .slider-row input[type="range"] {
            flex: 1;
            height: 4px;
            -webkit-appearance: none;
            background: var(--bg-tertiary, #3c3c3c);
            border-radius: 2px;
            cursor: pointer;
        }

        .slider-row input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: var(--accent-color, #3b82f6);
            border-radius: 50%;
            cursor: pointer;
        }

        .slider-value {
            min-width: 40px;
            font-size: var(--font-size-xs, 11px);
            color: var(--text-secondary, #b0b0b0);
            text-align: right;
        }

        /* Toggle rows */
        .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-xs, 4px) 0;
        }

        .toggle-label {
            display: flex;
            flex-direction: column;
        }

        .toggle-label .name {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-primary, #e0e0e0);
        }

        .toggle-label .description {
            font-size: 9px;
            color: var(--text-muted, #6b7280);
        }

        .toggle-checkbox {
            width: 32px;
            height: 18px;
            -webkit-appearance: none;
            background: var(--bg-tertiary, #3c3c3c);
            border-radius: 9px;
            position: relative;
            cursor: pointer;
            transition: background-color var(--transition-fast, 150ms ease);
        }

        .toggle-checkbox:checked {
            background: var(--accent-color, #3b82f6);
        }

        .toggle-checkbox::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 14px;
            height: 14px;
            background: white;
            border-radius: 50%;
            transition: transform var(--transition-fast, 150ms ease);
        }

        .toggle-checkbox:checked::before {
            transform: translateX(14px);
        }

        /* Action buttons */
        .actions {
            display: flex;
            gap: var(--spacing-xs, 4px);
        }

        .action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-xs, 4px);
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            border: 1px solid var(--border-color, #3c3c3c);
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-secondary, #b0b0b0);
            font-size: var(--font-size-xs, 10px);
            cursor: pointer;
            transition: all var(--transition-fast, 150ms ease);
        }

        .action-btn:hover {
            background: var(--bg-hover, rgba(255, 255, 255, 0.05));
            color: var(--text-primary, #e0e0e0);
            border-color: var(--border-hover, #4c4c4c);
        }

        .action-btn.danger:hover {
            background: var(--error-color-alpha, rgba(239, 68, 68, 0.1));
            color: var(--error-color, #ef4444);
            border-color: var(--error-color, #ef4444);
        }

        /* Stats row */
        .stats-row {
            display: flex;
            justify-content: space-between;
            font-size: var(--font-size-xs, 10px);
            color: var(--text-muted, #6b7280);
        }

        .stats-row .value {
            color: var(--text-secondary, #b0b0b0);
        }

        /* Backdrop for closing */
        .backdrop {
            position: fixed;
            inset: 0;
            z-index: 99;
        }
    `;

    constructor() {
        super();
        this.open = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.sseEventBufferSize,
            AppStore.sseHiddenEventTypes,
            AppStore.sseEventCount,
            AppStore.sseEvents
        ]);
    }

    /**
     * Toggle dropdown open state
     * @private
     */
    _toggleDropdown() {
        this.open = !this.open;
    }

    /**
     * Close dropdown
     * @private
     */
    _closeDropdown() {
        this.open = false;
    }

    /**
     * Handle buffer size change
     * @private
     */
    _handleBufferSizeChange(e) {
        const size = parseInt(e.target.value, 10);
        Actions.setEventBufferSize(size);
    }

    /**
     * Handle event type visibility toggle
     * @private
     */
    _handleTypeToggle(typeId) {
        Actions.toggleEventTypeVisibility(typeId);
    }

    /**
     * Check if event type is visible (not hidden)
     * @private
     */
    _isTypeVisible(typeId) {
        return !AppStore.sseHiddenEventTypes.value.includes(typeId);
    }

    /**
     * Handle clear all events
     * @private
     */
    _handleClearAll() {
        if (confirm('Clear all captured events?')) {
            Actions.clearSSEEvents();
        }
    }

    /**
     * Handle export events
     * @private
     */
    _handleExport() {
        EventsService.exportEvents({ filtered: false });
    }

    render() {
        const bufferSize = AppStore.sseEventBufferSize.value;
        const totalEvents = AppStore.sseEventCount.value;
        const bufferedEvents = AppStore.sseEvents.value.length;
        const stats = sseEventStats.value;

        return html`
            ${this.open ? html`<div class="backdrop" @click=${this._closeDropdown}></div>` : ''}

            <button
                class="trigger ${this.open ? 'active' : ''}"
                @click=${this._toggleDropdown}
                aria-label="Event settings"
                aria-expanded="${this.open}"
            >
                <dash-icon name="settings" size="14"></dash-icon>
            </button>

            <div class="dropdown ${this.open ? 'open' : ''}">
                <!-- Buffer Size -->
                <div class="section">
                    <div class="section-title">Buffer Size</div>
                    <div class="slider-row">
                        <input
                            type="range"
                            min="100"
                            max="2000"
                            step="100"
                            .value="${bufferSize}"
                            @input=${this._handleBufferSizeChange}
                        />
                        <span class="slider-value">${bufferSize}</span>
                    </div>
                    <div class="stats-row">
                        <span>Total received: <span class="value">${totalEvents}</span></span>
                        <span>Buffered: <span class="value">${bufferedEvents}</span></span>
                    </div>
                </div>

                <!-- Event Type Visibility -->
                <div class="section">
                    <div class="section-title">Show Event Types</div>
                    ${TOGGLEABLE_TYPES.map(type => html`
                        <div class="toggle-row">
                            <div class="toggle-label">
                                <span class="name">${type.label}</span>
                                <span class="description">${type.description}</span>
                            </div>
                            <input
                                type="checkbox"
                                class="toggle-checkbox"
                                .checked=${this._isTypeVisible(type.id)}
                                @change=${() => this._handleTypeToggle(type.id)}
                            />
                        </div>
                    `)}
                </div>

                <!-- Actions -->
                <div class="section">
                    <div class="actions">
                        <button class="action-btn" @click=${this._handleExport}>
                            <dash-icon name="download" size="12"></dash-icon>
                            Export
                        </button>
                        <button class="action-btn danger" @click=${this._handleClearAll}>
                            <dash-icon name="trash-2" size="12"></dash-icon>
                            Clear All
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('events-settings-dropdown', EventsSettingsDropdown);
export { EventsSettingsDropdown };
