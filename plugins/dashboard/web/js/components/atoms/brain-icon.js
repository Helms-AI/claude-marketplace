/**
 * Brain Icon Atom - Specialized brain icon for model selection
 * @module components/atoms/brain-icon
 *
 * Uses Lucide's brain icon with highlighted (gold/Opus) and dim (gray/Sonnet) states
 */
import { LitElement, html, css } from 'lit';
import './icon.js';

class BrainIcon extends LitElement {
    static properties = {
        highlighted: { type: Boolean, reflect: true },
        size: { type: Number },
        animated: { type: Boolean }
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        dash-icon {
            transition: all 0.2s ease;
        }

        /* Dim state (Sonnet) */
        dash-icon {
            color: var(--brain-icon-color-dim, #8b949e);
        }

        /* Highlighted state (Opus) */
        :host([highlighted]) dash-icon {
            color: var(--brain-icon-color-highlight, #d4a853);
            filter: drop-shadow(0 0 4px var(--brain-icon-glow-color, rgba(212, 168, 83, 0.4)));
        }

        /* Pulse animation when highlighted */
        :host([highlighted]) dash-icon.animated {
            animation: pulse-glow 2s ease-in-out infinite;
        }

        @keyframes pulse-glow {
            0%, 100% {
                filter: drop-shadow(0 0 4px var(--brain-icon-glow-color, rgba(212, 168, 83, 0.4)));
            }
            50% {
                filter: drop-shadow(0 0 8px var(--brain-icon-glow-color, rgba(212, 168, 83, 0.6)));
            }
        }
    `;

    constructor() {
        super();
        this.highlighted = false;
        this.size = 20;
        this.animated = true;
    }

    render() {
        return html`
            <dash-icon
                class="${this.animated ? 'animated' : ''}"
                name="brain"
                size="${this.size}"
                stroke-width="1.5"
            ></dash-icon>
        `;
    }
}

customElements.define('brain-icon', BrainIcon);
export { BrainIcon };
