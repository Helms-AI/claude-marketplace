/**
 * Timeline Module
 * Renders handoff timeline with swimlanes
 */

const Timeline = {
    render(data) {
        const container = document.getElementById('conversationTimeline');

        if (!data || !data.events || data.events.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No handoffs yet</p></div>';
            return;
        }

        const domains = data.domains || [];
        const events = data.events || [];

        // Calculate timeline dimensions
        const width = container.clientWidth;
        const height = container.clientHeight || 80;
        const padding = { top: 10, right: 20, bottom: 10, left: 100 };
        const laneHeight = (height - padding.top - padding.bottom) / Math.max(domains.length, 1);

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

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
            'documentation': '#a3e635'
        };

        // Draw domain lanes
        domains.forEach((domain, i) => {
            const y = padding.top + i * laneHeight;

            // Lane background
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', padding.left);
            rect.setAttribute('y', y);
            rect.setAttribute('width', width - padding.left - padding.right);
            rect.setAttribute('height', laneHeight - 2);
            rect.setAttribute('fill', domainColors[domain] || '#666');
            rect.setAttribute('opacity', '0.1');
            rect.setAttribute('rx', '4');
            svg.appendChild(rect);

            // Domain label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding.left - 8);
            text.setAttribute('y', y + laneHeight / 2);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-size', '11');
            text.setAttribute('fill', 'var(--text-secondary)');
            text.textContent = domain.replace(/-/g, ' ');
            svg.appendChild(text);
        });

        // Parse timestamps and calculate x positions
        const timestamps = events.map(e => new Date(e.timestamp).getTime());
        const minTime = Math.min(...timestamps);
        const maxTime = Math.max(...timestamps);
        const timeRange = maxTime - minTime || 1;

        const getX = (timestamp) => {
            const t = new Date(timestamp).getTime();
            const ratio = (t - minTime) / timeRange;
            return padding.left + ratio * (width - padding.left - padding.right);
        };

        const getY = (domain) => {
            const index = domains.indexOf(domain);
            return padding.top + index * laneHeight + laneHeight / 2;
        };

        // Draw handoff arrows
        events.forEach((event, i) => {
            if (event.type !== 'handoff') return;

            const x = getX(event.timestamp);
            const y1 = getY(event.from_domain);
            const y2 = getY(event.to_domain);

            // Arrow line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', domainColors[event.to_domain] || '#666');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('marker-end', 'url(#arrowhead)');
            svg.appendChild(line);

            // Event dot at source
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y1);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', domainColors[event.from_domain] || '#666');
            svg.appendChild(circle);
        });

        // Add arrowhead marker definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-secondary)" />
            </marker>
        `;
        svg.insertBefore(defs, svg.firstChild);

        container.innerHTML = '';
        container.appendChild(svg);
    }
};
