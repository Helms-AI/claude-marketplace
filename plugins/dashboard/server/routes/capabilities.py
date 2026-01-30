"""Capabilities API routes."""

from flask import Blueprint, jsonify, current_app

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
