/**
 * Autonomy Selector Molecule - Autonomy level control
 * @module components/molecules/autonomy-selector
 */
import { LitElement, html, css } from 'lit';
import '../atoms/segmented-control.js';

class AutonomySelector extends LitElement {
    static properties = {
        level: { type: String },          // 'low' | 'medium' | 'high' | 'max'
        disabled: { type: Boolean, reflect: true },
        compact: { type: Boolean },
        showDescription: { type: Boolean, attribute: 'show-description' }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs, 4px);
        }

        :host([disabled]) {
            pointer-events: none;
            opacity: 0.5;
        }

        .header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        .label {
            font-size: var(--font-size-sm, 12px);
            font-weight: 500;
            color: var(--text-secondary, #8b949e);
        }

        .badge {
            padding: 1px 6px;
            font-size: 10px;
            font-weight: 600;
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            border-radius: 4px;
        }

        .description {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #6e7681);
            margin-top: var(--spacing-xs, 4px);
        }

        /* Level-specific description colors */
        .description.low { color: var(--autonomy-low, #22c55e); }
        .description.medium { color: var(--autonomy-medium, #eab308); }
        .description.high { color: var(--autonomy-high, #f97316); }
        .description.max { color: var(--autonomy-max, #ef4444); }

        segmented-control {
            --segmented-bg: var(--bg-tertiary, #2d2d2d);
            --segmented-active-bg: var(--bg-secondary, #3c3c3c);
        }
    `;

    static levels = [
        { value: 'low', label: 'Low', compactLabel: 'L', description: 'Asks before each action' },
        { value: 'medium', label: 'Medium', compactLabel: 'M', description: 'Asks before file changes' },
        { value: 'high', label: 'High', compactLabel: 'H', description: 'Autonomous with check-ins' },
        { value: 'max', label: 'Max', compactLabel: 'X', description: 'Long-running, hands-off building experience' }
    ];

    constructor() {
        super();
        this.level = 'medium';
        this.disabled = false;
        this.compact = false;
        this.showDescription = true;
    }

    _getOptions() {
        return AutonomySelector.levels.map(l => ({
            value: l.value,
            label: this.compact ? l.compactLabel : l.label
        }));
    }

    _getCurrentDescription() {
        const current = AutonomySelector.levels.find(l => l.value === this.level);
        return current?.description || '';
    }

    _handleChange(e) {
        const previousLevel = this.level;
        this.level = e.detail.value;

        this.dispatchEvent(new CustomEvent('autonomy-change', {
            detail: { level: this.level, previousLevel },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        return html`
            <div class="header">
                <span class="label">Autonomous</span>
                <span class="badge">Core</span>
            </div>
            <segmented-control
                .options="${this._getOptions()}"
                .value="${this.level}"
                ?disabled="${this.disabled}"
                @dash-change="${this._handleChange}"
            ></segmented-control>
            ${this.showDescription ? html`
                <div class="description ${this.level}">${this._getCurrentDescription()}</div>
            ` : ''}
        `;
    }
}

customElements.define('autonomy-selector', AutonomySelector);
export { AutonomySelector };
