"""Skills API routes."""

from flask import Blueprint, jsonify, current_app

skills_bp = Blueprint('skills', __name__)


@skills_bp.route('/api/skills', methods=['GET'])
def get_all_skills():
    """Get all skills."""
    registry = current_app.config['skill_registry']
    skills = registry.get_all()
    return jsonify({
        'skills': [registry.to_dict(s) for s in skills],
        'count': len(skills)
    })


@skills_bp.route('/api/skills/<domain>', methods=['GET'])
def get_skills_by_domain(domain):
    """Get skills for a specific domain."""
    registry = current_app.config['skill_registry']
    skills = registry.get_by_domain(domain)
    return jsonify({
        'domain': domain,
        'skills': [registry.to_dict(s) for s in skills],
        'count': len(skills)
    })


@skills_bp.route('/api/skills/id/<skill_id>', methods=['GET'])
def get_skill_by_id(skill_id):
    """Get a specific skill by ID."""
    registry = current_app.config['skill_registry']
    skill = registry.get_by_id(skill_id)
    if not skill:
        return jsonify({'error': 'Skill not found'}), 404
    return jsonify(registry.to_dict(skill))


@skills_bp.route('/api/skills/id/<skill_id>/invocations', methods=['GET'])
def get_skill_invocations(skill_id):
    """Get invocation history for a skill."""
    registry = current_app.config['skill_registry']
    event_store = current_app.config['event_store']

    skill = registry.get_by_id(skill_id)
    if not skill:
        return jsonify({'error': 'Skill not found'}), 404

    events = event_store.get_by_skill(skill_id, limit=50)
    return jsonify({
        'skill': registry.to_dict(skill),
        'invocations': [event_store.to_dict(e) for e in events],
        'invocation_count': len(events)
    })


@skills_bp.route('/api/skills/recent', methods=['GET'])
def get_recent_invoked_skills():
    """Get recently invoked skills."""
    registry = current_app.config['skill_registry']
    skills = registry.get_recent_invoked(limit=10)
    return jsonify({
        'skills': [registry.to_dict(s) for s in skills],
        'count': len(skills)
    })


@skills_bp.route('/api/skills/handoff-graph', methods=['GET'])
def get_handoff_graph():
    """Get the skill handoff graph."""
    registry = current_app.config['skill_registry']
    graph = registry.build_handoff_graph()

    # Convert to node/edge format for D3.js
    nodes = []
    edges = []
    skill_ids = set()

    for skill_id, targets in graph.items():
        skill_ids.add(skill_id)
        for target in targets:
            skill_ids.add(target)
            edges.append({
                'source': skill_id,
                'target': target
            })

    for skill_id in skill_ids:
        skill = registry.get_by_id(skill_id)
        nodes.append({
            'id': skill_id,
            'name': skill.name if skill else skill_id,
            'domain': skill.domain if skill else 'unknown'
        })

    return jsonify({
        'nodes': nodes,
        'edges': edges
    })
