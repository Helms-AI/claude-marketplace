/**
 * Graph Module
 * D3.js visualization of domain interactions with agent clustering
 */

const Graph = {
    data: {
        nodes: [],
        edges: [],
        clusters: {}
    },
    simulation: null,
    state: {
        mode: 'domain', // 'domain' | 'agent'
        currentZoom: null
    },

    // Domain colors - consistent with backend and CSS
    domainColors: {
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
    },

    async init() {
        await this.loadData();

        // Set up toolbar event listeners
        document.getElementById('resetGraph').addEventListener('click', () => {
            this.render();
        });

        document.getElementById('toggleGraphMode').addEventListener('click', () => {
            this.toggleMode();
        });

        // Set up SSE listeners for activity
        this.setupActivityListeners();
    },

    async loadData() {
        try {
            const response = await Dashboard.fetchAPI(`/api/agent-graph?mode=${this.state.mode}`);
            this.data.nodes = response.nodes || [];
            this.data.edges = response.edges || [];
            this.data.clusters = response.clusters || {};
        } catch (e) {
            console.error('Error loading graph data:', e);
            // Fallback to legacy endpoint
            try {
                const fallback = await Dashboard.fetchAPI('/api/collaboration-graph');
                this.data.nodes = (fallback.nodes || []).map(n => ({
                    ...n,
                    type: 'domain',
                    color: this.domainColors[n.id] || '#666'
                }));
                this.data.edges = (fallback.edges || []).map(e => ({
                    ...e,
                    type: 'domain'
                }));
                this.data.clusters = {};
            } catch (e2) {
                console.error('Error loading fallback graph data:', e2);
            }
        }
    },

    async toggleMode() {
        const newMode = this.state.mode === 'domain' ? 'agent' : 'domain';
        this.state.mode = newMode;

        // Update button text
        const label = document.getElementById('graphModeLabel');
        const toggleBtn = document.getElementById('toggleGraphMode');
        if (label) {
            label.textContent = newMode === 'domain' ? 'Show Agents' : 'Show Domains';
        }
        toggleBtn.classList.toggle('active', newMode === 'agent');

        // Reload data with new mode
        await this.loadData();
        this.render();
    },

    setupActivityListeners() {
        // Listen for graph activity events
        Dashboard.addEventListener('graph_activity', (event) => {
            const data = event.data;
            if (data.node_id) {
                this.pulseNode(data.node_id);
            }
            if (data.agent_id && this.state.mode === 'agent') {
                this.pulseNode(`${data.node_id}:${data.agent_id}`);
            }
        });

        // Listen for handoff events
        Dashboard.addEventListener('graph_handoff', (event) => {
            const data = event.data;
            this.animateEdge(data.source, data.target);

            // Also pulse the nodes
            this.pulseNode(data.source);
            this.pulseNode(data.target);
        });
    },

    render() {
        const container = document.getElementById('graphContainer');
        const svg = d3.select('#graphSvg');

        // Clear previous content
        svg.selectAll('*').remove();

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Create container group for zoom
        const g = svg.append('g').attr('class', 'graph-main');

        // Create separate groups for different elements (for proper layering)
        const edgesGroup = g.append('g').attr('class', 'edges-layer');
        const nodesGroup = g.append('g').attr('class', 'nodes-layer');
        const pulseGroup = g.append('g').attr('class', 'pulse-layer');

        // Store references
        this.svgGroups = { edges: edgesGroup, nodes: nodesGroup, pulse: pulseGroup };

        // Set up zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                this.state.currentZoom = event.transform;
                this.updateZoomLevel(event.transform.k);
            });

        svg.call(zoom);

        // Separate domain nodes and agent nodes
        const domainNodes = this.data.nodes.filter(n => n.type === 'domain');
        const agentNodes = this.data.nodes.filter(n => n.type === 'agent');

        // Create node map for edge lookups
        const nodeMap = new Map(this.data.nodes.map(n => [n.id, n]));

        // Process edges - ensure source/target are proper references
        const processedEdges = this.data.edges
            .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
            .map(e => ({
                ...e,
                source: e.source,
                target: e.target
            }));

        // Create simulation with forces
        const forces = this.createForces(width, height, domainNodes, agentNodes);
        this.simulation = d3.forceSimulation(this.data.nodes)
            .force('link', forces.link(processedEdges))
            .force('charge', forces.charge)
            .force('center', forces.center)
            .force('collision', forces.collision);

        // Add clustering force for agent mode
        if (this.state.mode === 'agent') {
            this.simulation.force('cluster', this.createClusterForce(domainNodes));
        }

        // Draw edges
        const links = edgesGroup.selectAll('line')
            .data(processedEdges)
            .join('line')
            .attr('class', d => `graph-link ${d.type === 'agent' ? 'agent-link' : 'domain-link'}`)
            .attr('stroke', d => d.type === 'agent' ? '#666' : '#999')
            .attr('stroke-opacity', d => d.type === 'agent' ? 0.3 : 0.6)
            .attr('stroke-width', d => d.type === 'agent' ? 1 : 2)
            .attr('data-source', d => d.source)
            .attr('data-target', d => d.target);

        // Draw nodes
        const nodes = nodesGroup.selectAll('g')
            .data(this.data.nodes)
            .join('g')
            .attr('class', d => `graph-node ${d.type === 'agent' ? 'agent-node' : 'domain-node'}`)
            .attr('data-id', d => d.id)
            .call(this.createDragBehavior());

        // Add circles for nodes
        nodes.append('circle')
            .attr('r', d => this.getNodeRadius(d))
            .attr('fill', d => d.color || this.domainColors[d.domain] || '#666');

        // Add labels
        this.addNodeLabels(nodes);

        // Set up hover tooltips for agent nodes
        if (this.state.mode === 'agent') {
            this.setupTooltips(nodes.filter(d => d.type === 'agent'));
        }

        // Update positions on tick
        this.simulation.on('tick', () => {
            links
                .attr('x1', d => this.getNodeById(d.source)?.x || 0)
                .attr('y1', d => this.getNodeById(d.source)?.y || 0)
                .attr('x2', d => this.getNodeById(d.target)?.x || 0)
                .attr('y2', d => this.getNodeById(d.target)?.y || 0);

            nodes.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
        });

        // Render legend
        this.renderLegend();

        // Set up zoom controls
        this.setupZoomControls(svg, zoom);
    },

    getNodeById(id) {
        return this.data.nodes.find(n => n.id === id);
    },

    createForces(width, height, domainNodes, agentNodes) {
        const isAgentMode = this.state.mode === 'agent';

        return {
            link: (edges) => d3.forceLink(edges)
                .id(d => d.id)
                .distance(d => {
                    if (d.type === 'agent') return 60;
                    return isAgentMode ? 200 : 150;
                })
                .strength(d => d.type === 'agent' ? 0.3 : 0.5),

            charge: d3.forceManyBody()
                .strength(d => d.type === 'agent' ? -50 : -400),

            center: d3.forceCenter(width / 2, height / 2),

            collision: d3.forceCollide()
                .radius(d => this.getNodeRadius(d) + (d.type === 'agent' ? 5 : 20))
        };
    },

    createClusterForce(domainNodes) {
        // Custom force to cluster agents around their domain
        const strength = 0.15;
        const domainPositions = new Map();

        return (alpha) => {
            // Update domain positions from current simulation state
            for (const domain of domainNodes) {
                domainPositions.set(domain.id, { x: domain.x, y: domain.y });
            }

            // Pull agent nodes towards their domain
            for (const node of this.data.nodes) {
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
    },

    getNodeRadius(node) {
        if (node.type === 'agent') {
            return 8;
        }
        // Domain nodes - scale by agent count
        const baseRadius = 25;
        const agentBonus = (node.agent_count || 0) * 1.5;
        return Math.min(baseRadius + agentBonus, 50);
    },

    addNodeLabels(nodes) {
        // Domain node labels
        nodes.filter(d => d.type === 'domain')
            .each(function(d) {
                const node = d3.select(this);
                const radius = Graph.getNodeRadius(d);

                // Name label below node
                node.append('text')
                    .attr('dy', radius + 14)
                    .attr('text-anchor', 'middle')
                    .attr('class', 'node-label')
                    .text(d.name);

                // Agent count inside node
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

        // Agent node labels (only on hover or if few agents)
        const agentNodes = nodes.filter(d => d.type === 'agent');
        const showAllLabels = agentNodes.size() < 20;

        if (showAllLabels) {
            agentNodes.append('text')
                .attr('dy', 20)
                .attr('text-anchor', 'middle')
                .attr('class', 'node-label agent-label')
                .text(d => d.name.split(' ')[0]); // First name only for space
        }
    },

    setupTooltips(agentNodes) {
        const tooltip = document.getElementById('graphTooltip');

        agentNodes
            .on('mouseenter', (event, d) => {
                const titleEl = tooltip.querySelector('.graph-tooltip-title');
                const roleEl = tooltip.querySelector('.graph-tooltip-role');

                titleEl.textContent = d.name;
                roleEl.textContent = d.role || d.domain.replace('-', ' ');

                tooltip.classList.add('visible');
                this.positionTooltip(event, tooltip);
            })
            .on('mousemove', (event) => {
                this.positionTooltip(event, tooltip);
            })
            .on('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
    },

    positionTooltip(event, tooltip) {
        const container = document.getElementById('graphContainer');
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left + 15;
        const y = event.clientY - rect.top - 10;

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
    },

    createDragBehavior() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    },

    setupZoomControls(svg, zoom) {
        document.getElementById('zoomIn').addEventListener('click', () => {
            svg.transition().call(zoom.scaleBy, 1.3);
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            svg.transition().call(zoom.scaleBy, 0.7);
        });
    },

    updateZoomLevel(scale) {
        const level = Math.round(scale * 100);
        document.getElementById('zoomLevel').textContent = `${level}%`;
    },

    // Activity pulse animation
    pulseNode(nodeId) {
        const node = this.data.nodes.find(n => n.id === nodeId);
        if (!node || !this.svgGroups) return;

        const isAgent = node.type === 'agent';
        const color = node.color || this.domainColors[node.domain] || '#666';
        const baseRadius = this.getNodeRadius(node);

        // Create pulse ring
        const pulse = this.svgGroups.pulse.append('circle')
            .attr('class', `graph-pulse-ring ${isAgent ? 'agent' : ''}`)
            .attr('cx', node.x)
            .attr('cy', node.y)
            .attr('r', baseRadius)
            .attr('stroke', color);

        // Remove after animation completes
        setTimeout(() => {
            pulse.remove();
        }, isAgent ? 1200 : 1500);
    },

    // Edge animation for handoffs
    animateEdge(source, target) {
        if (!this.svgGroups) return;

        const edge = this.svgGroups.edges.select(
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

            // Revert after animation
            setTimeout(() => {
                edge
                    .classed('graph-edge-active', false)
                    .attr('stroke-width', originalWidth)
                    .attr('stroke-opacity', originalOpacity);
            }, 2000);
        }
    },

    renderLegend() {
        const legend = document.getElementById('graphLegend');
        const activeColors = {};

        // Only include colors for domains that are in the graph
        for (const node of this.data.nodes) {
            if (node.type === 'domain') {
                activeColors[node.id] = node.color || this.domainColors[node.id];
            }
        }

        legend.innerHTML = Object.entries(activeColors)
            .map(([domain, color]) => `
                <div class="legend-item">
                    <span class="legend-color" style="background: ${color}"></span>
                    <span>${domain.replace(/-/g, ' ')}</span>
                </div>
            `).join('');

        // Add mode indicator
        if (this.state.mode === 'agent') {
            legend.innerHTML += `
                <div class="legend-item" style="margin-left: auto;">
                    <span style="font-size: 10px; color: var(--text-muted);">
                        ${this.data.nodes.filter(n => n.type === 'agent').length} agents
                    </span>
                </div>
            `;
        }
    }
};
