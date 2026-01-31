/**
 * Thinking Indicator Component
 *
 * Displays an animated indicator while Claude is processing.
 * Shows optional thinking text and progress.
 *
 * @module components/indicators/thinking-indicator
 *
 * @example
 * <thinking-indicator active text="Analyzing code..."></thinking-indicator>
 */

import { LitElement, html, css } from 'lit';

/**
 * Thinking Indicator Web Component
 */
class ThinkingIndicator extends LitElement {
    static properties = {
        /** Whether the indicator is active/visible */
        active: { type: Boolean, reflect: true },

        /** Optional text to display */
        text: { type: String },

        /** Animation variant: dots, pulse, wave */
        variant: { type: String },

        /** Size: sm, md, lg */
        size: { type: String }
    };

    static styles = css`
        :host {
            display: none;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-radius: var(--radius-md, 8px);
            background: var(--bg-secondary, #f8f9fa);
            font-size: var(--font-size-sm, 13px);
            color: var(--text-secondary, #666);
        }

        :host([active]) {
            display: inline-flex;
            animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Size variants */
        :host([size="sm"]) {
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            font-size: var(--font-size-xs, 11px);
            gap: var(--spacing-xs, 4px);
        }

        :host([size="lg"]) {
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            font-size: var(--font-size-md, 14px);
        }

        .dots {
            display: flex;
            gap: 3px;
        }

        .dot {
            width: 6px;
            height: 6px;
            background: var(--accent-color, #4a90d9);
            border-radius: 50%;
            animation: bounce 1.4s ease-in-out infinite;
        }

        :host([size="sm"]) .dot {
            width: 4px;
            height: 4px;
        }

        :host([size="lg"]) .dot {
            width: 8px;
            height: 8px;
        }

        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.4;
            }
            30% {
                transform: translateY(-6px);
                opacity: 1;
            }
        }

        /* Pulse variant */
        .pulse {
            width: 12px;
            height: 12px;
            background: var(--accent-color, #4a90d9);
            border-radius: 50%;
            animation: pulse 1.5s ease-in-out infinite;
        }

        :host([size="sm"]) .pulse {
            width: 8px;
            height: 8px;
        }

        :host([size="lg"]) .pulse {
            width: 16px;
            height: 16px;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            50% {
                transform: scale(1.1);
                opacity: 1;
            }
        }

        /* Wave variant */
        .wave {
            display: flex;
            align-items: center;
            gap: 2px;
            height: 16px;
        }

        .bar {
            width: 3px;
            height: 100%;
            background: var(--accent-color, #4a90d9);
            border-radius: 2px;
            animation: wave 1s ease-in-out infinite;
        }

        .bar:nth-child(1) { animation-delay: 0s; }
        .bar:nth-child(2) { animation-delay: 0.1s; }
        .bar:nth-child(3) { animation-delay: 0.2s; }
        .bar:nth-child(4) { animation-delay: 0.3s; }

        @keyframes wave {
            0%, 100% { transform: scaleY(0.5); }
            50% { transform: scaleY(1); }
        }

        /* Spinner variant */
        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid var(--bg-tertiary, #e9ecef);
            border-top-color: var(--accent-color, #4a90d9);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        :host([size="sm"]) .spinner {
            width: 12px;
            height: 12px;
            border-width: 1.5px;
        }

        :host([size="lg"]) .spinner {
            width: 20px;
            height: 20px;
            border-width: 3px;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .text {
            color: var(--text-muted, #999);
        }
    `;

    constructor() {
        super();
        this.active = false;
        this.text = '';
        this.variant = 'dots';
        this.size = 'md';
    }

    _renderIndicator() {
        switch (this.variant) {
            case 'pulse':
                return html`<div class="pulse"></div>`;

            case 'wave':
                return html`
                    <div class="wave">
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                        <div class="bar"></div>
                    </div>
                `;

            case 'spinner':
                return html`<div class="spinner"></div>`;

            case 'dots':
            default:
                return html`
                    <div class="dots">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                `;
        }
    }

    render() {
        return html`
            ${this._renderIndicator()}
            ${this.text ? html`<span class="text">${this.text}</span>` : ''}
        `;
    }
}

customElements.define('thinking-indicator', ThinkingIndicator);
export { ThinkingIndicator };
