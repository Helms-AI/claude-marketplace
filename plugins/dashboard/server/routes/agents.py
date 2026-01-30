"""Agent API routes."""

from flask import Blueprint, jsonify, current_app

agents_bp = Blueprint('agents', __name__)


@agents_bp.route('/api/agents', methods=['GET'])
def get_all_agents():
    """Get all agents."""
    registry = current_app.config['agent_registry']
    agents = registry.get_all()
    return jsonify({
        'agents': [registry.to_dict(a) for a in agents],
        'count': len(agents)
    })


@agents_bp.route('/api/agents/<domain>', methods=['GET'])
def get_agents_by_domain(domain):
    """Get agents for a specific domain."""
    registry = current_app.config['agent_registry']
    agents = registry.get_by_domain(domain)
    return jsonify({
        'domain': domain,
        'agents': [registry.to_dict(a) for a in agents],
        'count': len(agents)
    })


@agents_bp.route('/api/agents/id/<agent_id>', methods=['GET'])
def get_agent_by_id(agent_id):
    """Get a specific agent by ID."""
    registry = current_app.config['agent_registry']
    agent = registry.get_by_id(agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404
    return jsonify(registry.to_dict(agent))


@agents_bp.route('/api/agents/id/<agent_id>/activity', methods=['GET'])
def get_agent_activity(agent_id):
    """Get recent activity for an agent."""
    registry = current_app.config['agent_registry']
    event_store = current_app.config['event_store']

    agent = registry.get_by_id(agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404

    events = event_store.get_by_agent(agent_id, limit=50)
    return jsonify({
        'agent': registry.to_dict(agent),
        'events': [event_store.to_dict(e) for e in events],
        'event_count': len(events)
    })


@agents_bp.route('/api/agents/recent', methods=['GET'])
def get_recent_active_agents():
    """Get recently active agents."""
    registry = current_app.config['agent_registry']
    agents = registry.get_recent_active(limit=10)
    return jsonify({
        'agents': [registry.to_dict(a) for a in agents],
        'count': len(agents)
    })


@agents_bp.route('/api/domains', methods=['GET'])
def get_all_domains():
    """Get all domains."""
    registry = current_app.config['agent_registry']
    domains = registry.get_all_domains()
    return jsonify({
        'domains': [registry.domain_to_dict(d) for d in domains],
        'count': len(domains)
    })


@agents_bp.route('/api/domains/<domain>', methods=['GET'])
def get_domain_info(domain):
    """Get information about a specific domain."""
    registry = current_app.config['agent_registry']
    domain_info = registry.get_domain_info(domain)
    if not domain_info:
        return jsonify({'error': 'Domain not found'}), 404
    return jsonify(registry.domain_to_dict(domain_info))
