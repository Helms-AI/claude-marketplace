/**
 * DomainGraph Organism - D3.js visualization of domain interactions
 * @module components/organisms/domain-graph
 *
 * Note: This component requires D3.js to be loaded globally.
 * Include via CDN in index.html or import map.
 */
import { LitElement, html, css } from 'lit';

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
    'documentation': '#a3e635',
    'observability': '#8b5cf6'
};

/**
 * @fires dash-node-click - When a node is clicked
 * @fires dash-mode-change - When view mode changes
 */
class DashDomainGraph extends LitElement {
    static properties = {
        nodes: { type: Array },
        edges: { type: Array },
        mode: { type: String }, // 'domain' | 'agent'
        apiEndpoint: { type: String, attribute: 'api-endpoint' },
        _loading: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
        }

        .container {
            width: 100%;
            height: 100%;
        }

        svg {
            width: 100%;
            height: 100%;
        }

        .toolbar {
            position: absolute;
            top: var(--spacing-sm, 8px);
            right: var(--spacing-sm, 8px);
            display: flex;
            gap: var(--spacing-xs, 4px);
            z-index: 10;
        }

        .toolbar-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-sm, 4px);
            background: var(--bg-primary, #ffffff);
            color: var(--text-secondary, #6b7280);
            cursor: pointer;
            transition: all 0.15s;
        }

        .toolbar-btn:hover {
            background: var(--bg-hover, rgba(0, 0, 0, 0.05));
            color: var(--text-primary, #1f2937);
        }

        .toolbar-btn.active {
            background: var(--accent-color, #3b82f6);
            color: white;
            border-color: var(--accent-color, #3b82f6);
        }

        .zoom-level {
            display: flex;
            align-items: center;
            padding: 0 var(--spacing-sm, 8px);
            font-size: 10px;
            color: var(--text-muted, #9ca3af);
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-sm, 4px);
        }

        .legend {
            position: absolute;
            bottom: var(--spacing-sm, 8px);
            left: var(--spacing-sm, 8px);
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px);
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-sm, 4px);
            max-width: 300px;
            z-index: 10;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            color: var(--text-secondary, #6b7280);
        }

        .legend-color {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        .tooltip {
            position: absolute;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            background: var(--bg-primary, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: var(--radius-sm, 4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.15s;
            z-index: 100;
        }

        .tooltip.visible {
            opacity: 1;
        }

        .tooltip-title {
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: var(--text-primary, #1f2937);
        }

        .tooltip-role {
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #9ca3af);
            text-transform: capitalize;
        }

        /* D3 generated styles */
        .graph-link {
            stroke-linecap: round;
        }

        .graph-link.domain-link {
            stroke: var(--text-muted, #9ca3af);
            stroke-opacity: 0.6;
        }

        .graph-link.agent-link {
            stroke: var(--text-muted, #9ca3af);
            stroke-opacity: 0.3;
        }

        .graph-node {
            cursor: pointer;
        }

        .node-label {
            font-size: 11px;
            fill: var(--text-secondary, #6b7280);
            pointer-events: none;
        }

        .agent-label {
            font-size: 9px;
        }

        .graph-pulse-ring {
            fill: none;
            stroke-width: 2;
            opacity: 0;
            animation: pulse-ring 1.5s ease-out forwards;
        }

        .graph-pulse-ring.agent {
            animation-duration: 1.2s;
        }

        @keyframes pulse-ring {
            0% { r: inherit; opacity: 0.8; }
            100% { r: calc(inherit + 30px); opacity: 0; }
        }

        .graph-edge-active {
            stroke-dasharray: 5 5;
            animation: edge-flow 0.5s linear infinite;
        }

        @keyframes edge-flow {
            from { stroke-dashoffset: 10; }
            to { stroke-dashoffset: 0; }
        }

        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-muted, #9ca3af);
        }
    `;

    constructor() {
        super();
        this.nodes = [];
        this.edges = [];
        this.mode = 'domain';
        this.apiEndpoint = '/api/agent-graph';
        this._loading = false;
        this._simulation = null;
        this._svgGroups = null;
        this._currentZoom = null;
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver = new ResizeObserver(() => {
            this._render();
        });
    }

    firstUpdated() {
        const container = this.shadowRoot.querySelector('.container');
        if (container) {
            this._resizeObserver.observe(container);
        }
        if (this.nodes.length === 0) {
            this.loadData();
        } else {
            this._render();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
        if (this._simulation) {
            this._simulation.stop();
        }
    }

    render() {
        return html`
            <div class="container">
                <svg></svg>

                <div class="toolbar">
                    <button class="toolbar-btn" @click="${this._handleReset}" title="Reset view">
                        ⟲
                    </button>
                    <button class="toolbar-btn ${this.mode === 'agent' ? 'active' : ''}"
                            @click="${this._handleToggleMode}" title="Toggle agent view">
                        👥
                    </button>
                    <button class="toolbar-btn" @click="${this._handleZoomIn}" title="Zoom in">
                        +
                    </button>
                    <span class="zoom-level">100%</span>
                    <button class="toolbar-btn" @click="${this._handleZoomOut}" title="Zoom out">
                        −
                    </button>
                </div>

                <div class="legend"></div>
                <div class="tooltip">
                    <div class="tooltip-title"></div>
                    <div class="tooltip-role"></div>
                </div>
            </div>

            ${this._loading ? html`<div class="loading">Loading graph...</div>` : ''}
        `;
    }

    async loadData() {
        if (typeof d3 === 'undefined') {
            console.warn('D3.js not loaded, skipping graph render');
            return;
        }

        this._loading = true;
        this.requestUpdate();

        try {
            const response = await fetch(`${this.apiEndpoint}?mode=${this.mode}`);
            const data = await response.json();
            this.nodes = data.nodes || [];
            this.edges = data.edges || [];
            this._render();
        } catch (e) {
            console.error('Error loading graph data:', e);
        } finally {
            this._loading = false;
            this.requestUpdate();
        }
    }

    _render() {
        if (typeof d3 === 'undefined' || this.nodes.length === 0) return;

        const container = this.shadowRoot.querySelector('.container');
        const svgEl = this.shadowRoot.querySelector('svg');
        if (!container || !svgEl) return;

        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;

        const svg = d3.select(svgEl);
        svg.selectAll('*').remove();

        // Create container group for zoom
        const g = svg.append('g').attr('class', 'graph-main');
        const edgesGroup = g.append('g').attr('class', 'edges-layer');
        const nodesGroup = g.append('g').attr('class', 'nodes-layer');
        const pulseGroup = g.append('g').attr('class', 'pulse-layer');

        this._svgGroups = { edges: edgesGroup, nodes: nodesGroup, pulse: pulseGroup };

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                this._currentZoom = event.transform;
                this._updateZoomLevel(event.transform.k);
            });

        svg.call(zoom);
        this._zoom = zoom;
        this._svg = svg;

        // Separate domain and agent nodes
        const domainNodes = this.nodes.filter(n => n.type === 'domain');
        const nodeMap = new Map(this.nodes.map(n => [n.id, n]));

        // Process edges
        const processedEdges = this.edges
            .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
            .map(e => ({ ...e }));

        // Create simulation
        this._simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(processedEdges)
                .id(d => d.id)
                .distance(d => d.type === 'agent' ? 60 : 150)
                .strength(d => d.type === 'agent' ? 0.3 : 0.5))
            .force('charge', d3.forceManyBody()
                .strength(d => d.type === 'agent' ? -50 : -400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => this._getNodeRadius(d) + (d.type === 'agent' ? 5 : 20)));

        // Clustering force for agent mode
        if (this.mode === 'agent') {
            this._simulation.force('cluster', this._createClusterForce(domainNodes));
        }

        // Draw edges
        const links = edgesGroup.selectAll('line')
            .data(processedEdges)
            .join('line')
            .attr('class', d => `graph-link ${d.type === 'agent' ? 'agent-link' : 'domain-link'}`)
            .attr('stroke-width', d => d.type === 'agent' ? 1 : 2)
            .attr('data-source', d => d.source.id || d.source)
            .attr('data-target', d => d.target.id || d.target);

        // Draw nodes
        const nodes = nodesGroup.selectAll('g')
            .data(this.nodes)
            .join('g')
            .attr('class', d => `graph-node ${d.type === 'agent' ? 'agent-node' : 'domain-node'}`)
            .attr('data-id', d => d.id)
            .call(this._createDragBehavior());

        // Node circles
        nodes.append('circle')
            .attr('r', d => this._getNodeRadius(d))
            .attr('fill', d => d.color || DOMAIN_COLORS[d.domain] || DOMAIN_COLORS[d.id] || '#666');

        // Labels
        this._addNodeLabels(nodes);

        // Tooltips for agent nodes
        if (this.mode === 'agent') {
            this._setupTooltips(nodes.filter(d => d.type === 'agent'));
        }

        // Update on tick
        this._simulation.on('tick', () => {
            links
                .attr('x1', d => d.source.x || 0)
                .attr('y1', d => d.source.y || 0)
                .attr('x2', d => d.target.x || 0)
                .attr('y2', d => d.target.y || 0);

            nodes.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
        });

        this._renderLegend();
    }

    _getNodeRadius(node) {
        if (node.type === 'agent') return 8;
        const baseRadius = 25;
        const agentBonus = (node.agent_count || 0) * 1.5;
        return Math.min(baseRadius + agentBonus, 50);
    }

    _addNodeLabels(nodes) {
        // Domain node labels
        nodes.filter(d => d.type === 'domain')
            .each((d, i, elements) => {
                const node = d3.select(elements[i]);
                const radius = this._getNodeRadius(d);

                node.append('text')
                    .attr('dy', radius + 14)
                    .attr('text-anchor', 'middle')
                    .attr('class', 'node-label')
                    .text(d.name);

                if (d.agent_count) {
                    node.append('text')
                        .attr('dy', 5)
                        .attr('text-anchor', 'middle')
                        .attr('fill', 'white')
                        .attr('font-weight', 'bold')
                        .attr('font-size', '12px')
                        .text(d.agent_count);
                }
            });

        // Agent node labels
        const agentNodes = nodes.filter(d => d.type === 'agent');
        if (agentNodes.size() < 20) {
            agentNodes.append('text')
                .attr('dy', 20)
                .attr('text-anchor', 'middle')
                .attr('class', 'node-label agent-label')
                .text(d => d.name.split(' ')[0]);
        }
    }

    _setupTooltips(agentNodes) {
        const tooltip = this.shadowRoot.querySelector('.tooltip');
        const titleEl = tooltip.querySelector('.tooltip-title');
        const roleEl = tooltip.querySelector('.tooltip-role');

        agentNodes
            .on('mouseenter', (event, d) => {
                titleEl.textContent = d.name;
                roleEl.textContent = d.role || d.domain.replace('-', ' ');
                tooltip.classList.add('visible');
                this._positionTooltip(event, tooltip);
            })
            .on('mousemove', (event) => {
                this._positionTooltip(event, tooltip);
            })
            .on('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
    }

    _positionTooltip(event, tooltip) {
        const container = this.shadowRoot.querySelector('.container');
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left + 15;
        const y = event.clientY - rect.top - 10;
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    }

    _createDragBehavior() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this._simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this._simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    _createClusterForce(domainNodes) {
        const strength = 0.15;
        const domainPositions = new Map();

        return (alpha) => {
            for (const domain of domainNodes) {
                domainPositions.set(domain.id, { x: domain.x, y: domain.y });
            }

            for (const node of this.nodes) {
                if (node.type === 'agent' && node.domain) {
                    const domainPos = domainPositions.get(node.domain);
                    if (domainPos) {
                        const dx = domainPos.x - node.x;
                        const dy = domainPos.y - node.y;
                        node.vx += dx * strength * alpha;
                        node.vy += dy * strength * alpha;
                    }
                }
            }
        };
    }

    _renderLegend() {
        const legend = this.shadowRoot.querySelector('.legend');
        const activeColors = {};

        for (const node of this.nodes) {
            if (node.type === 'domain') {
                activeColors[node.id] = node.color || DOMAIN_COLORS[node.id];
            }
        }

        legend.innerHTML = Object.entries(activeColors)
            .map(([domain, color]) => `
                <div class="legend-item">
                    <span class="legend-color" style="background: ${color}"></span>
                    <span>${domain.replace(/-/g, ' ')}</span>
                </div>
            `).join('');

        if (this.mode === 'agent') {
            const agentCount = this.nodes.filter(n => n.type === 'agent').length;
            legend.innerHTML += `
                <div class="legend-item" style="margin-left: auto;">
                    <span style="font-size: 10px; color: var(--text-muted);">
                        ${agentCount} agents
                    </span>
                </div>
            `;
        }
    }

    _updateZoomLevel(scale) {
        const level = Math.round(scale * 100);
        const el = this.shadowRoot.querySelector('.zoom-level');
        if (el) el.textContent = `${level}%`;
    }

    _handleReset() {
        this._render();
    }

    async _handleToggleMode() {
        this.mode = this.mode === 'domain' ? 'agent' : 'domain';
        this.dispatchEvent(new CustomEvent('dash-mode-change', {
            bubbles: true,
            composed: true,
            detail: { mode: this.mode }
        }));
        await this.loadData();
    }

    _handleZoomIn() {
        if (this._svg && this._zoom) {
            this._svg.transition().call(this._zoom.scaleBy, 1.3);
        }
    }

    _handleZoomOut() {
        if (this._svg && this._zoom) {
            this._svg.transition().call(this._zoom.scaleBy, 0.7);
        }
    }

    /**
     * Pulse a node to show activity
     * @param {string} nodeId
     */
    pulseNode(nodeId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node || !this._svgGroups) return;

        const isAgent = node.type === 'agent';
        const color = node.color || DOMAIN_COLORS[node.domain] || '#666';
        const baseRadius = this._getNodeRadius(node);

        const pulse = this._svgGroups.pulse.append('circle')
            .attr('class', `graph-pulse-ring ${isAgent ? 'agent' : ''}`)
            .attr('cx', node.x)
            .attr('cy', node.y)
            .attr('r', baseRadius)
            .attr('stroke', color);

        setTimeout(() => pulse.remove(), isAgent ? 1200 : 1500);
    }

    /**
     * Animate an edge for handoff visualization
     * @param {string} source
     * @param {string} target
     */
    animateEdge(source, target) {
        if (!this._svgGroups) return;

        const edge = this._svgGroups.edges.select(
            `line[data-source="${source}"][data-target="${target}"], ` +
            `line[data-source="${target}"][data-target="${source}"]`
        );

        if (!edge.empty()) {
            const originalWidth = edge.attr('stroke-width');
            const originalOpacity = edge.attr('stroke-opacity');

            edge
                .classed('graph-edge-active', true)
                .attr('stroke-width', 4)
                .attr('stroke-opacity', 1);

            setTimeout(() => {
                edge
                    .classed('graph-edge-active', false)
                    .attr('stroke-width', originalWidth)
                    .attr('stroke-opacity', originalOpacity);
            }, 2000);
        }
    }
}

customElements.define('dash-domain-graph', DashDomainGraph);
export { DashDomainGraph };
