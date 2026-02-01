/**
 * TimelineView Organism - Handoff timeline with swimlanes
 * @module components/organisms/timeline-view
 */
import { LitElement, html, css, svg } from 'lit';

/**
 * Domain colors for visualization
 */
const DOMAIN_COLORS = {
    'pm': '#6366f1',
    'user-experience': '#f472b6',
    'frontend': '#22d3ee',
    'architecture': '#a78bfa',
    'backend': '#4ade80',
    'testing': '#facc15',
    'devops': '#fb923c',
    'data': '#60a5fa',
    'security': '#f87171',
    'documentation': '#a3e635'
};

/**
 * @fires dash-event-click - When an event is clicked
 */
class DashTimelineView extends LitElement {
    static properties = {
        events: { type: Array },
        domains: { type: Array },
        _width: { type: Number, state: true },
        _height: { type: Number, state: true }
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 80px;
        }

        .container {
            width: 100%;
            height: 100%;
            position: relative;
        }

        svg {
            width: 100%;
            height: 100%;
        }

        .lane-bg {
            fill-opacity: 0.1;
        }

        .lane-label {
            font-size: 11px;
            fill: var(--text-secondary, #6b7280);
            text-transform: capitalize;
        }

        .handoff-line {
            stroke-width: 2;
        }

        .handoff-dot {
            cursor: pointer;
        }

        .handoff-dot:hover {
            filter: brightness(1.2);
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-muted, #9ca3af);
            font-size: var(--font-size-sm, 12px);
        }
    `;

    constructor() {
        super();
        this.events = [];
        this.domains = [];
        this._width = 800;
        this._height = 80;
        this._resizeObserver = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                this._width = entry.contentRect.width;
                this._height = entry.contentRect.height || 80;
            }
        });
    }

    firstUpdated() {
        const container = this.shadowRoot.querySelector('.container');
        if (container) {
            this._resizeObserver.observe(container);
            this._width = container.clientWidth;
            this._height = container.clientHeight || 80;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
    }

    render() {
        if (!this.events || this.events.length === 0) {
            return html`
                <div class="container">
                    <div class="empty-state">No handoffs yet</div>
                </div>
            `;
        }

        return html`
            <div class="container">
                ${this._renderSvg()}
            </div>
        `;
    }

    _renderSvg() {
        const padding = { top: 10, right: 20, bottom: 10, left: 100 };
        const domains = this.domains.length > 0 ? this.domains : this._extractDomains();
        const laneHeight = (this._height - padding.top - padding.bottom) / Math.max(domains.length, 1);

        // Calculate time scale
        const timestamps = this.events.map(e => new Date(e.timestamp).getTime());
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const timeRange = maxTime - minTime || 1;

        const getX = (timestamp) => {
            const t = new Date(timestamp).getTime();
            const ratio = (t - minTime) / timeRange;
            return padding.left + ratio * (this._width - padding.left - padding.right);
        };

        const getY = (domain) => {
            const index = domains.indexOf(domain);
            return padding.top + index * laneHeight + laneHeight / 2;
        };

        return svg`
            <svg viewBox="0 0 ${this._width} ${this._height}">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7"
                            refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary, #6b7280)" />
                    </marker>
                </defs>

                <!-- Domain lanes -->
                ${domains.map((domain, i) => {
                    const y = padding.top + i * laneHeight;
                    const color = DOMAIN_COLORS[domain] || '#666';
                    return svg`
                        <g class="lane">
                            <rect class="lane-bg"
                                  x="${padding.left}"
                                  y="${y}"
                                  width="${this._width - padding.left - padding.right}"
                                  height="${laneHeight - 2}"
                                  fill="${color}"
                                  rx="4" />
                            <text class="lane-label"
                                  x="${padding.left - 8}"
                                  y="${y + laneHeight / 2}"
                                  text-anchor="end"
                                  dominant-baseline="middle">
                                ${domain.replace(/-/g, ' ')}
                            </text>
                        </g>
                    `;
                })}

                <!-- Handoff events -->
                ${this.events.filter(e => e.type === 'handoff').map(event => {
                    const x = getX(event.timestamp);
                    const y1 = getY(event.from_domain);
                    const y2 = getY(event.to_domain);
                    const color = DOMAIN_COLORS[event.to_domain] || '#666';

                    return svg`
                        <g class="handoff" @click="${() => this._handleEventClick(event)}">
                            <line class="handoff-line"
                                  x1="${x}" y1="${y1}"
                                  x2="${x}" y2="${y2}"
                                  stroke="${color}"
                                  marker-end="url(#arrowhead)" />
                            <circle class="handoff-dot"
                                    cx="${x}" cy="${y1}" r="4"
                                    fill="${DOMAIN_COLORS[event.from_domain] || '#666'}" />
                        </g>
                    `;
                })}
            </svg>
        `;
    }

    _extractDomains() {
        const domainSet = new Set();
        for (const event of this.events) {
            if (event.from_domain) domainSet.add(event.from_domain);
            if (event.to_domain) domainSet.add(event.to_domain);
        }
        return Array.from(domainSet);
    }

    _handleEventClick(event) {
        this.dispatchEvent(new CustomEvent('dash-event-click', {
            bubbles: true,
            composed: true,
            detail: { event }
        }));
    }

    /**
     * Set timeline data
     * @param {Object} data - { events, domains }
     */
    setData(data) {
        this.events = data.events || [];
        this.domains = data.domains || [];
    }
}

customElements.define('dash-timeline-view', DashTimelineView);
export { DashTimelineView };
