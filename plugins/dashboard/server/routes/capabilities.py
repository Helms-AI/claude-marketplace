"""Capabilities API routes."""

from flask import Blueprint, jsonify, request, current_app

from ..parsers.capability_parser import CapabilityParser

capabilities_bp = Blueprint('capabilities', __name__)


@capabilities_bp.route('/api/capabilities', methods=['GET'])
def get_all_capabilities():
    """Get all capabilities."""
    registry = current_app.config['skill_registry']
    capabilities = registry.get_all_capabilities()
    return jsonify({
        'capabilities': [registry.capability_to_dict(c) for c in capabilities],
        'count': len(capabilities)
    })


@capabilities_bp.route('/api/capabilities/<domain>', methods=['GET'])
def get_capabilities_by_domain(domain):
    """Get capabilities for a specific domain."""
    registry = current_app.config['skill_registry']
    capabilities = [c for c in registry.get_all_capabilities() if c.domain == domain]
    return jsonify({
        'domain': domain,
        'capabilities': [registry.capability_to_dict(c) for c in capabilities],
        'count': len(capabilities)
    })


@capabilities_bp.route('/api/collaboration-graph', methods=['GET'])
def get_collaboration_graph():
    """Get the domain collaboration graph for visualization."""
    agent_registry = current_app.config['agent_registry']
    domains = agent_registry.get_all_domains()

    # Build graph from domain collaboration data
    graph = CapabilityParser.build_collaboration_graph(
        {d.name: d for d in domains}
    )

    # Convert to node/edge format for D3.js
    nodes = []
    edges = []

    for domain in domains:
        node = {
            'id': domain.name,
            'name': domain.name.replace('-', ' ').title(),
            'agent_count': len(domain.agents),
            'skill_count': len(domain.skills),
            'subdomains': domain.subdomains
        }
        nodes.append(node)

    for source, targets in graph.items():
        for target in targets:
            edges.append({
                'source': source,
                'target': target
            })

    return jsonify({
        'nodes': nodes,
        'edges': edges
    })


@capabilities_bp.route('/api/search', methods=['GET'])
def search_capabilities():
    """Search capabilities by keyword."""
    from flask import request
    query = request.args.get('q', '').lower()

    if not query:
        return jsonify({'error': 'Query parameter q is required'}), 400

    registry = current_app.config['skill_registry']
    capabilities = registry.get_all_capabilities()

    # Search in keywords, artifacts, and intent patterns
    results = []
    for cap in capabilities:
        score = 0

        # Check keywords
        for keyword in cap.keywords:
            if query in keyword.lower():
                score += 2

        # Check artifacts
        for artifact in cap.artifacts:
            if query in artifact.lower():
                score += 1

        # Check verb
        if query in cap.verb.lower():
            score += 1

        if score > 0:
            results.append({
                'capability': registry.capability_to_dict(cap),
                'score': score
            })

    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)

    return jsonify({
        'query': query,
        'results': results,
        'count': len(results)
    })


@capabilities_bp.route('/api/agent-graph', methods=['GET'])
def get_agent_graph():
    """Get agent-level graph with domain clusters for visualization.

    Query Parameters:
        mode: 'domain' (default) - domain nodes only
              'agent' - includes individual agent nodes clustered around domains

    Returns:
        JSON with nodes, edges, and cluster mappings.
    """
    mode = request.args.get('mode', 'domain')
    agent_registry = current_app.config['agent_registry']
    skill_registry = current_app.config['skill_registry']

    domains = agent_registry.get_all_domains()
    agents = agent_registry.get_all()

    # Build graph from domain collaboration data
    graph = CapabilityParser.build_collaboration_graph(
        {d.name: d for d in domains}
    )

    nodes = []
    edges = []
    clusters = {}

    # Domain colors for consistency
    domain_colors = {
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
    }

    # Add domain nodes
    for domain in domains:
        domain_node = {
            'id': domain.name,
            'type': 'domain',
            'name': domain.name.replace('-', ' ').title(),
            'agent_count': len(domain.agents),
            'skill_count': len(domain.skills),
            'subdomains': domain.subdomains,
            'color': domain_colors.get(domain.name, '#666666')
        }
        nodes.append(domain_node)
        clusters[domain.name] = []

    # Add agent nodes if in agent mode
    if mode == 'agent':
        for agent in agents:
            agent_node = {
                'id': f"{agent.domain}:{agent.id}",
                'type': 'agent',
                'name': agent.name,
                'role': agent.role,
                'domain': agent.domain,
                'color': domain_colors.get(agent.domain, '#666666')
            }
            nodes.append(agent_node)

            # Track cluster membership
            if agent.domain in clusters:
                clusters[agent.domain].append(f"{agent.domain}:{agent.id}")

    # Add domain-level edges (collaboration relationships)
    for source, targets in graph.items():
        for target in targets:
            edges.append({
                'source': source,
                'target': target,
                'type': 'domain'
            })

    # Add agent-level edges for handoff patterns if in agent mode
    if mode == 'agent':
        # Find skills that trigger handoffs and map to backing agents
        for skill in skill_registry.get_all():
            if skill.handoff_outputs:
                for target_skill_id in skill.handoff_outputs:
                    target_skill = skill_registry.get_by_id(target_skill_id)
                    if target_skill and skill.backing_agent and target_skill.backing_agent:
                        source_agent_id = f"{skill.domain}:{skill.backing_agent}"
                        target_agent_id = f"{target_skill.domain}:{target_skill.backing_agent}"

                        # Only add if both agents exist and are in different domains
                        if skill.domain != target_skill.domain:
                            edges.append({
                                'source': source_agent_id,
                                'target': target_agent_id,
                                'type': 'agent',
                                'skill': skill.id
                            })

    return jsonify({
        'nodes': nodes,
        'edges': edges,
        'clusters': clusters,
        'mode': mode
    })
