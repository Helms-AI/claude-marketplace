/**
 * Graph Module
 * D3.js visualization of domain interactions
 */

const Graph = {
    data: {
        nodes: [],
        edges: []
    },
    simulation: null,

    async init() {
        await this.loadData();
        document.getElementById('resetGraph').addEventListener('click', () => {
            this.render();
        });
    },

    async loadData() {
        try {
            const response = await Dashboard.fetchAPI('/api/collaboration-graph');
            this.data.nodes = response.nodes || [];
            this.data.edges = response.edges || [];
        } catch (e) {
            console.error('Error loading graph data:', e);
        }
    },

    render() {
        const container = document.getElementById('graphContainer');
        const svg = d3.select('#graphSvg');

        // Clear previous content
        svg.selectAll('*').remove();

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Domain colors
        const domainColors = {
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

        // Create simulation
        this.simulation = d3.forceSimulation(this.data.nodes)
            .force('link', d3.forceLink(this.data.edges)
                .id(d => d.id)
                .distance(150))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(60));

        // Create container group for zoom
        const g = svg.append('g');

        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Draw edges
        const links = g.append('g')
            .selectAll('line')
            .data(this.data.edges)
            .join('line')
            .attr('class', 'graph-link')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 2);

        // Draw nodes
        const nodes = g.append('g')
            .selectAll('g')
            .data(this.data.nodes)
            .join('g')
            .attr('class', 'graph-node')
            .call(d3.drag()
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
                }));

        // Node circles
        nodes.append('circle')
            .attr('r', d => 20 + (d.agent_count || 0) * 2)
            .attr('fill', d => domainColors[d.id] || '#666');

        // Node labels
        nodes.append('text')
            .attr('dy', d => 30 + (d.agent_count || 0) * 2)
            .attr('text-anchor', 'middle')
            .text(d => d.name);

        // Agent count labels
        nodes.append('text')
            .attr('dy', 5)
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .attr('font-weight', 'bold')
            .attr('font-size', '12px')
            .text(d => d.agent_count || '');

        // Update positions on tick
        this.simulation.on('tick', () => {
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            nodes.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Render legend
        this.renderLegend(domainColors);
    },

    renderLegend(colors) {
        const legend = document.getElementById('graphLegend');
        legend.innerHTML = Object.entries(colors)
            .filter(([domain]) => this.data.nodes.some(n => n.id === domain))
            .map(([domain, color]) => `
                <div class="legend-item">
                    <span class="legend-color" style="background: ${color}"></span>
                    <span>${domain.replace(/-/g, ' ')}</span>
                </div>
            `).join('');
    }
};
