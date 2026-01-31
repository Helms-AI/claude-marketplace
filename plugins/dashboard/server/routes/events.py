"""Events API routes for receiving hook data."""

import re
from datetime import datetime
from flask import Blueprint, jsonify, request, current_app

from ..models import EventType

events_bp = Blueprint('events', __name__)


@events_bp.route('/api/events', methods=['POST'])
def receive_event():
    """Receive an event from a hook."""
    data = request.get_json() or {}

    event_store = current_app.config['event_store']
    session_tracker = current_app.config['session_tracker']
    agent_registry = current_app.config['agent_registry']
    skill_registry = current_app.config['skill_registry']

    # Parse event data
    tool_name = data.get('tool', '')
    tool_output = data.get('result', '')
    session_id = data.get('session_id', 'default')

    # Determine event type based on tool and output
    event_type = EventType.TOOL_CALLED
    domain = 'unknown'
    agent_id = None
    skill_id = None
    content = {
        'tool': tool_name,
        'output_preview': tool_output[:500] if tool_output else ''
    }

    # Detect skill invocation
    if tool_name == 'Skill':
        event_type = EventType.SKILL_INVOKED
        skill_id = data.get('skill_id') or _extract_skill_id(tool_output)
        if skill_id:
            skill = skill_registry.get_by_id(skill_id)
            if skill:
                domain = skill.domain
                skill_registry.update_invocation(skill_id)
                content['skill_name'] = skill.name

                # Broadcast graph activity for skill invocation
                sse_manager = current_app.config.get('sse_manager')
                if sse_manager:
                    sse_manager.broadcast_graph_activity(
                        node_id=skill.domain,
                        agent_id=skill.backing_agent,
                        skill=skill_id,
                        activity_type='skill'
                    )

    # Detect agent activation from output patterns
    agent_match = re.search(
        r'\*\*([A-Z][a-z]+\s+[A-Z][a-z]+)\s+-\s+([^*]+)\*\*\s+is now working',
        tool_output
    )
    if agent_match:
        event_type = EventType.AGENT_ACTIVATED
        agent_name = agent_match.group(1)
        agent_role = agent_match.group(2).strip()
        content['agent_name'] = agent_name
        content['agent_role'] = agent_role

        # Try to find agent ID
        for agent in agent_registry.get_all():
            if agent.name == agent_name:
                agent_id = agent.id
                domain = agent.domain
                agent_registry.update_activity(agent_id)

                # Broadcast graph activity for agent activation
                sse_manager = current_app.config.get('sse_manager')
                if sse_manager:
                    sse_manager.broadcast_graph_activity(
                        node_id=agent.domain,
                        agent_id=agent_id,
                        activity_type='agent'
                    )
                break

    # Detect handoff patterns
    handoff_match = re.search(
        r'(?:Routed to|Delegated to|Passing to|Handoff to)\s+[`/]?([a-z-]+)',
        tool_output,
        re.IGNORECASE
    )
    if handoff_match:
        target_skill = handoff_match.group(1)
        target_skill_info = skill_registry.get_by_id(target_skill)

        if target_skill_info:
            # Record handoff
            source_domain = domain
            target_domain = target_skill_info.domain

            if source_domain != target_domain:
                event_type = EventType.HANDOFF_STARTED
                session_tracker.record_handoff(
                    session_id=session_id,
                    source_domain=source_domain,
                    target_domain=target_domain,
                    source_agent=agent_id,
                    target_agent=target_skill_info.backing_agent,
                    context={'trigger': tool_output[:200]}
                )
                content['handoff_target'] = target_skill

                # Broadcast graph handoff event
                sse_manager = current_app.config.get('sse_manager')
                if sse_manager:
                    sse_manager.broadcast_graph_handoff(
                        source=source_domain,
                        target=target_domain,
                        source_agent=agent_id,
                        target_agent=target_skill_info.backing_agent
                    )

    # Detect AskUserQuestion responses
    if tool_name == 'AskUserQuestion':
        event_type = EventType.USER_RESPONSE
        content['question_type'] = 'user_question'

    # Detect artifact creation
    artifact_match = re.search(
        r'(?:Created|Generated|Produced|Output):\s*([A-Z][a-z\s]+)',
        tool_output
    )
    if artifact_match:
        event_type = EventType.ARTIFACT_CREATED
        content['artifact_name'] = artifact_match.group(1).strip()

    # Create and store the event
    event = event_store.create_event(
        event_type=event_type,
        session_id=session_id,
        domain=domain,
        agent_id=agent_id,
        skill_id=skill_id,
        content=content
    )

    # Update session tracker
    session_tracker.add_event(session_id, event)

    return jsonify({
        'status': 'received',
        'event_id': event.id,
        'event_type': event_type.value
    })


@events_bp.route('/api/events/recent', methods=['GET'])
def get_recent_events():
    """Get recent events."""
    limit = request.args.get('limit', 100, type=int)
    event_store = current_app.config['event_store']
    events = event_store.get_recent(limit=limit)
    return jsonify({
        'events': [event_store.to_dict(e) for e in events],
        'count': len(events)
    })


def _extract_skill_id(output: str) -> str:
    """Extract skill ID from tool output.

    Args:
        output: Tool output string.

    Returns:
        Skill ID or empty string.
    """
    match = re.search(r'/([a-z-]+)', output)
    return match.group(1) if match else ''
