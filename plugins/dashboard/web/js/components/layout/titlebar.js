/**
 * Titlebar Component - Dashboard header with logo and controls
 * @module components/layout/titlebar
 */

import { LitElement, html, css } from 'lit';
import '../atoms/icon.js';

class DashboardTitlebar extends LitElement {
    static properties = {
        title: { type: String },
        connected: { type: Boolean, reflect: true },
        theme: { type: String, reflect: true }
    };

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 40px;
            padding: 0 var(--spacing-md, 12px);
            background: var(--bg-secondary, #f8f9fa);
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            -webkit-app-region: drag;
        }
        .left, .right { display: flex; align-items: center; gap: var(--spacing-sm, 8px); -webkit-app-region: no-drag; }
        .hamburger {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: none;
            background: transparent;
            border-radius: var(--radius-sm, 4px);
            color: var(--text-secondary, #666);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .hamburger:hover { background: var(--bg-tertiary, #e9ecef); color: var(--text-primary, #333); }
        .logo {
            font-size: var(--font-size-md, 14px);
            font-weight: 600;
            color: var(--text-primary, #333);
        }
        .center { flex: 1; display: flex; justify-content: center; -webkit-app-region: no-drag; }
        .command-trigger {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            min-width: 280px;
            background: var(--bg-primary, white);
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: var(--radius-md, 8px);
            color: var(--text-muted, #999);
            font-size: var(--font-size-sm, 13px);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .command-trigger:hover { border-color: var(--accent-color, #4a90d9); }
        .command-trigger span { flex: 1; text-align: left; }
        .command-trigger kbd {
            padding: 2px 6px;
            font-size: 10px;
            font-family: inherit;
            background: var(--bg-tertiary, #e9ecef);
            border-radius: var(--radius-sm, 4px);
            color: var(--text-muted, #999);
        }
        .titlebar-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: none;
            background: transparent;
            border-radius: var(--radius-sm, 4px);
            color: var(--text-secondary, #666);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .titlebar-btn:hover { background: var(--bg-tertiary, #e9ecef); color: var(--text-primary, #333); }
    `;

    constructor() {
        super();
        this.title = 'Claude Code Console';
        this.connected = false;
        this.theme = 'dark';
    }

    _handleMenuClick() {
        this.dispatchEvent(new CustomEvent('menu-toggle', { bubbles: true, composed: true }));
    }

    _handleCommandPalette() {
        this.dispatchEvent(new CustomEvent('command-palette', { bubbles: true, composed: true }));
    }

    _handleThemeToggle() {
        this.dispatchEvent(new CustomEvent('theme-toggle', { bubbles: true, composed: true }));
    }

    _handleSettings() {
        this.dispatchEvent(new CustomEvent('settings-open', { bubbles: true, composed: true }));
    }

    render() {
        return html`
            <div class="left">
                <button class="hamburger" @click=${this._handleMenuClick} title="Toggle sidebar">
                    <dash-icon name="menu" size="18"></dash-icon>
                </button>
                <h1 class="logo">${this.title}</h1>
            </div>
            <div class="center">
                <button class="command-trigger" @click=${this._handleCommandPalette}>
                    <dash-icon name="search" size="14"></dash-icon>
                    <span>Search agents, skills, commands...</span>
                    <kbd>⌘K</kbd>
                </button>
            </div>
            <div class="right">
                <button class="titlebar-btn" @click=${this._handleThemeToggle} title="Toggle theme">
                    <dash-icon name="${this.theme === 'dark' ? 'sun' : 'moon'}" size="16"></dash-icon>
                </button>
                <button class="titlebar-btn" @click=${this._handleSettings} title="Settings">
                    <dash-icon name="settings" size="16"></dash-icon>
                </button>
            </div>
        `;
    }
}

customElements.define('dashboard-titlebar', DashboardTitlebar);
export { DashboardTitlebar };
