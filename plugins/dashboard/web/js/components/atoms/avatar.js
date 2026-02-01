/**
 * Avatar Atom - User/agent avatar with initials
 * @module components/atoms/avatar
 *
 * Displays an avatar with automatically generated initials from a name,
 * or an optional image. Supports domain-colored backgrounds.
 */
import { LitElement, html, css } from 'lit';

class DashAvatar extends LitElement {
    static properties = {
        name: { type: String },       // Full name for initials generation
        src: { type: String },        // Optional image URL
        size: { type: String },       // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
        domain: { type: String },     // Domain for colored background
        showStatus: { type: Boolean, attribute: 'show-status' },
        status: { type: String }      // 'active' | 'inactive' | 'busy'
    };

    static styles = css`
        :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }

        .avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            font-family: var(--font-sans);
            font-weight: 600;
            text-transform: uppercase;
            background: var(--avatar-bg, var(--bg-tertiary));
            color: var(--avatar-color, var(--text-primary));
            position: relative;
            flex-shrink: 0;
            user-select: none;
        }

        /* Sizes */
        .xs {
            width: 20px;
            height: 20px;
            font-size: 8px;
        }

        .sm {
            width: 28px;
            height: 28px;
            font-size: 10px;
        }

        .md {
            width: 36px;
            height: 36px;
            font-size: 12px;
        }

        .lg {
            width: 48px;
            height: 48px;
            font-size: 16px;
        }

        .xl {
            width: 64px;
            height: 64px;
            font-size: 20px;
        }

        /* Image mode */
        .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
        }

        /* Domain colors */
        .domain-pm {
            background: var(--domain-pm, #6366f1);
            color: white;
        }
        .domain-user-experience {
            background: var(--domain-user-experience, #f472b6);
            color: white;
        }
        .domain-frontend {
            background: var(--domain-frontend, #22d3ee);
            color: #1e1e1e;
        }
        .domain-architecture {
            background: var(--domain-architecture, #a78bfa);
            color: white;
        }
        .domain-backend {
            background: var(--domain-backend, #4ade80);
            color: #1e1e1e;
        }
        .domain-testing {
            background: var(--domain-testing, #facc15);
            color: #1e1e1e;
        }
        .domain-devops {
            background: var(--domain-devops, #fb923c);
            color: white;
        }
        .domain-data {
            background: var(--domain-data, #60a5fa);
            color: white;
        }
        .domain-security {
            background: var(--domain-security, #f87171);
            color: white;
        }
        .domain-documentation {
            background: var(--domain-documentation, #a3e635);
            color: #1e1e1e;
        }
        .domain-external {
            background: var(--bg-tertiary, #e8e8e8);
            color: var(--text-secondary);
        }

        /* Status indicator */
        .status-indicator {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 25%;
            height: 25%;
            min-width: 6px;
            min-height: 6px;
            border-radius: 50%;
            border: 2px solid var(--bg-primary, white);
            box-sizing: content-box;
        }

        .status-active { background: var(--success-color, #22c55e); }
        .status-inactive { background: var(--text-muted, #9ca3af); }
        .status-busy { background: var(--warning-color, #f59e0b); }
    `;

    constructor() {
        super();
        this.name = '';
        this.src = '';
        this.size = 'md';
        this.domain = '';
        this.showStatus = false;
        this.status = 'inactive';
    }

    /**
     * Generate initials from a name
     * @param {string} name - Full name
     * @returns {string} Up to 2 character initials
     */
    _getInitials(name) {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    render() {
        const classes = [this.size];
        if (this.domain) {
            classes.push(`domain-${this.domain}`);
        }

        const initials = this._getInitials(this.name);

        return html`
            <div class="avatar ${classes.join(' ')}">
                ${this.src
                    ? html`<img src="${this.src}" alt="${this.name}" />`
                    : html`<span>${initials}</span>`
                }
                ${this.showStatus ? html`
                    <span class="status-indicator status-${this.status}"></span>
                ` : ''}
            </div>
        `;
    }
}

customElements.define('dash-avatar', DashAvatar);
export { DashAvatar };
