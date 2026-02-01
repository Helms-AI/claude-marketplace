/**
 * ProfileMenu Organism - User settings dropdown
 * @module components/organisms/profile-menu
 */
import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';
import '../atoms/button.js';

/**
 * @fires dash-action - When a menu action is triggered
 */
class DashProfileMenu extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        version: { type: String },
        updateAvailable: { type: Boolean, attribute: 'update-available' }
    };

    static styles = css`
        :host {
            position: relative;
            display: inline-block;
        }

        .trigger {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: var(--radius-sm, 4px);
            background: transparent;
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
            transition: all 0.15s;
        }

        .trigger:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }

        .menu {
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 8px;
            min-width: 200px;
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-md, 6px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-4px) scale(0.98);
            transition: all 0.15s ease-out;
        }

        :host([open]) .menu {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
        }

        .menu-header {
            padding: var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .version {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            font-size: var(--font-size-sm, 12px);
            color: var(--text-secondary, #6b7280);
        }

        .version.update-available {
            color: var(--accent-color, #3b82f6);
            cursor: pointer;
        }

        .update-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--success-color, #22c55e);
        }

        .menu-section {
            padding: var(--spacing-xs, 4px) 0;
        }

        .menu-section:not(:last-child) {
            border-bottom: 1px solid var(--border-subtle, #f3f4f6);
        }

        .menu-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            width: 100%;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border: none;
            background: transparent;
            font-family: inherit;
            font-size: var(--font-size-sm, 12px);
            color: var(--text-primary, #1f2937);
            text-align: left;
            cursor: pointer;
            transition: background 0.1s;
        }

        .menu-item:hover {
            background: var(--bg-hover, #f3f4f6);
        }

        .menu-item.danger {
            color: var(--danger-color, #dc2626);
        }

        .menu-item.danger:hover {
            background: var(--danger-bg, #fef2f2);
        }

        .menu-item-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            color: var(--text-muted, #9ca3af);
        }

        .menu-item.danger .menu-item-icon {
            color: var(--danger-color, #dc2626);
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.version = '';
        this.updateAvailable = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this._handleClickOutside = this._handleClickOutside.bind(this);
        document.addEventListener('click', this._handleClickOutside);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._handleClickOutside);
    }

    render() {
        return html`
            <button class="trigger" @click="${this._toggleMenu}" title="Settings">
                <dash-icon name="settings" size="18"></dash-icon>
            </button>

            <div class="menu">
                ${this.version ? html`
                    <div class="menu-header">
                        <div class="version ${this.updateAvailable ? 'update-available' : ''}"
                             @click="${() => this.updateAvailable && this._handleAction('update')}">
                            ${this.updateAvailable ? html`<span class="update-dot"></span>` : ''}
                            Dashboard ${this.version}
                            ${this.updateAvailable ? ' (Update available)' : ''}
                        </div>
                    </div>
                ` : ''}

                <div class="menu-section">
                    <button class="menu-item" @click="${() => this._handleAction('theme')}">
                        <span class="menu-item-icon">
                            <dash-icon name="moon" size="14"></dash-icon>
                        </span>
                        Toggle Theme
                    </button>
                    <button class="menu-item" @click="${() => this._handleAction('shortcuts')}">
                        <span class="menu-item-icon">
                            <dash-icon name="command" size="14"></dash-icon>
                        </span>
                        Keyboard Shortcuts
                    </button>
                </div>

                <div class="menu-section">
                    <button class="menu-item" @click="${() => this._handleAction('processes')}">
                        <span class="menu-item-icon">
                            <dash-icon name="cpu" size="14"></dash-icon>
                        </span>
                        Process Manager
                    </button>
                    <button class="menu-item" @click="${() => this._handleAction('restart')}">
                        <span class="menu-item-icon">
                            <dash-icon name="refresh-cw" size="14"></dash-icon>
                        </span>
                        Restart Server
                    </button>
                </div>

                <div class="menu-section">
                    <button class="menu-item danger" @click="${() => this._handleAction('kill')}">
                        <span class="menu-item-icon">
                            <dash-icon name="power" size="14"></dash-icon>
                        </span>
                        Kill Server
                    </button>
                </div>
            </div>
        `;
    }

    _toggleMenu(e) {
        e.stopPropagation();
        this.open = !this.open;
    }

    _handleClickOutside(e) {
        if (!this.contains(e.target)) {
            this.open = false;
        }
    }

    _handleAction(action) {
        this.open = false;
        this.dispatchEvent(new CustomEvent('dash-action', {
            detail: { action },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('dash-profile-menu', DashProfileMenu);
export { DashProfileMenu };
