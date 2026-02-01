/**
 * Kbd Atom - Keyboard shortcut display
 * @module components/atoms/kbd
 */
import { LitElement, html, css } from 'lit';

class DashKbd extends LitElement {
    static properties = {
        keys: { type: String },  // Space-separated keys: "Cmd K" or "Ctrl Shift P"
        size: { type: String }   // 'sm' | 'md'
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            gap: 2px;
        }

        kbd {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 18px;
            height: 18px;
            padding: 0 4px;
            background: var(--bg-tertiary, #e5e7eb);
            border: 1px solid var(--border-color, #d1d5db);
            border-radius: var(--radius-sm, 4px);
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: 10px;
            font-weight: 500;
            color: var(--text-secondary, #6b7280);
            box-shadow: 0 1px 0 var(--border-color, #d1d5db);
        }

        :host([size="sm"]) kbd {
            min-width: 14px;
            height: 14px;
            padding: 0 3px;
            font-size: 9px;
            border-radius: 3px;
        }

        .plus {
            color: var(--text-muted, #9ca3af);
            font-size: 9px;
            margin: 0 1px;
        }
    `;

    constructor() {
        super();
        this.keys = '';
        this.size = 'md';
    }

    // Map common key names to display symbols
    _formatKey(key) {
        const keyMap = {
            'cmd': '\u2318',
            'command': '\u2318',
            'ctrl': '\u2303',
            'control': '\u2303',
            'alt': '\u2325',
            'option': '\u2325',
            'opt': '\u2325',
            'shift': '\u21E7',
            'enter': '\u21B5',
            'return': '\u21B5',
            'tab': '\u21E5',
            'esc': '\u238B',
            'escape': '\u238B',
            'backspace': '\u232B',
            'delete': '\u2326',
            'up': '\u2191',
            'down': '\u2193',
            'left': '\u2190',
            'right': '\u2192',
            'space': '\u2423'
        };

        const lower = key.toLowerCase();
        return keyMap[lower] || key.toUpperCase();
    }

    render() {
        const keys = this.keys.split(/\s+/).filter(Boolean);

        return html`
            ${keys.map((key, i) => html`
                ${i > 0 ? html`<span class="plus">+</span>` : ''}
                <kbd>${this._formatKey(key)}</kbd>
            `)}
        `;
    }
}

customElements.define('dash-kbd', DashKbd);
export { DashKbd };
