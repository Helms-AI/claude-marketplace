"""Sessions API routes."""

from flask import Blueprint, jsonify, current_app

sessions_bp = Blueprint('sessions', __name__)


@sessions_bp.route('/api/sessions', methods=['GET'])
def get_all_sessions():
    """Get all active sessions."""
    tracker = current_app.config['session_tracker']
    sessions = tracker.get_all_sessions()
    return jsonify({
        'sessions': [tracker.to_dict(s) for s in sessions],
        'count': len(sessions)
    })


@sessions_bp.route('/api/sessions/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get a specific session."""
    tracker = current_app.config['session_tracker']
    session = tracker.get_session(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    return jsonify(tracker.to_dict(session))


@sessions_bp.route('/api/sessions/<session_id>/conversation', methods=['GET'])
def get_session_conversation(session_id):
    """Get full conversation transcript for a session."""
    tracker = current_app.config['session_tracker']
    event_store = current_app.config['event_store']

    session = tracker.get_session(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    # Get events from session directly (loaded from session.json)
    # Also check event_store for any real-time events
    session_events = session.events
    event_store_events = event_store.get_by_session(session_id)

    # Combine and dedupe by event id
    seen_ids = set()
    all_events = []
    for e in session_events + event_store_events:
        if e.id not in seen_ids:
            seen_ids.add(e.id)
            all_events.append(e)

    # Sort by timestamp
    all_events.sort(key=lambda e: e.timestamp)

    return jsonify({
        'session': tracker.to_dict(session),
        'events': [event_store.to_dict(e) for e in all_events],
        'event_count': len(all_events)
    })


@sessions_bp.route('/api/sessions/<session_id>/timeline', methods=['GET'])
def get_session_timeline(session_id):
    """Get visual timeline of agent handoffs for a session."""
    tracker = current_app.config['session_tracker']

    session = tracker.get_session(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    handoffs = tracker.get_session_handoffs(session_id)

    # Build timeline with swimlanes by domain
    timeline = {
        'session_id': session_id,
        'started_at': session.started_at.isoformat(),
        'domains': [],
        'events': []
    }

    # Collect unique domains
    domains_seen = set()
    for handoff in handoffs:
        domains_seen.add(handoff.source_domain)
        domains_seen.add(handoff.target_domain)

    timeline['domains'] = list(domains_seen)

    # Build events
    for handoff in handoffs:
        timeline['events'].append({
            'type': 'handoff',
            'timestamp': handoff.timestamp.isoformat(),
            'from_domain': handoff.source_domain,
            'to_domain': handoff.target_domain,
            'from_agent': handoff.source_agent,
            'to_agent': handoff.target_agent,
            'status': handoff.status
        })

    return jsonify(timeline)


@sessions_bp.route('/api/handoffs', methods=['GET'])
def get_recent_handoffs():
    """Get recent cross-domain handoffs."""
    tracker = current_app.config['session_tracker']
    handoffs = tracker.get_recent_handoffs(limit=20)
    return jsonify({
        'handoffs': [tracker.handoff_to_dict(h) for h in handoffs],
        'count': len(handoffs)
    })


@sessions_bp.route('/api/handoffs/<handoff_id>', methods=['GET'])
def get_handoff(handoff_id):
    """Get a specific handoff."""
    tracker = current_app.config['session_tracker']
    handoffs = tracker.get_recent_handoffs(limit=1000)

    for handoff in handoffs:
        if handoff.id == handoff_id:
            return jsonify(tracker.handoff_to_dict(handoff))

    return jsonify({'error': 'Handoff not found'}), 404


@sessions_bp.route('/api/sessions/<session_id>/transcript', methods=['GET'])
def get_session_transcript(session_id):
    """Get full Claude Code conversation transcript for a session.

    This reads the actual Claude Code JSONL transcript files that contain
    the complete conversation including user messages, assistant responses,
    tool calls, and subagent conversations.

    Query params:
        include_subagents: Whether to include subagent transcripts (default: true)
        merge_timeline: Whether to merge main and subagent messages chronologically (default: false)
    """
    from flask import request

    tracker = current_app.config['session_tracker']
    transcript_reader = current_app.config['transcript_reader']

    session = tracker.get_session(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404

    # Get the Claude transcript session ID if stored in session
    # This may differ from the PM session ID
    claude_session_id = getattr(session, 'claude_session_id', None)
    project_path = session.project_path

    if not project_path:
        return jsonify({
            'error': 'No project path for session',
            'session_id': session_id
        }), 404

    include_subagents = request.args.get('include_subagents', 'true').lower() == 'true'
    merge_timeline = request.args.get('merge_timeline', 'false').lower() == 'true'

    # If we have the direct Claude session ID, use it
    if claude_session_id:
        conversation = transcript_reader.read_full_conversation(
            claude_session_id,
            project_path,
            include_subagents=include_subagents
        )
    else:
        # Try to find transcript by session creation time
        transcript_path = transcript_reader.find_transcript_by_timestamp(
            project_path,
            session.started_at,
            tolerance_seconds=600  # 10 minute window
        )

        if transcript_path:
            # Extract session ID from filename
            import os
            filename = os.path.basename(transcript_path)
            claude_session_id = filename[:-6] if filename.endswith('.jsonl') else filename

            conversation = transcript_reader.read_full_conversation(
                claude_session_id,
                project_path,
                include_subagents=include_subagents
            )
        else:
            conversation = {'session_id': None, 'main': [], 'subagents': {}}

    # Convert messages to dicts
    main_messages = [transcript_reader.to_dict(m) for m in conversation['main']]
    subagent_messages = {
        agent_id: [transcript_reader.to_dict(m) for m in msgs]
        for agent_id, msgs in conversation.get('subagents', {}).items()
    }

    response = {
        'session_id': session_id,
        'claude_session_id': conversation.get('session_id'),
        'project_path': project_path,
        'messages': main_messages,
        'subagents': subagent_messages,
        'message_count': len(main_messages),
        'subagent_count': len(subagent_messages)
    }

    # Optionally include merged timeline
    if merge_timeline and include_subagents:
        response['merged_timeline'] = transcript_reader.merge_chronologically(
            conversation['main'],
            conversation.get('subagents', {})
        )

    return jsonify(response)


@sessions_bp.route('/api/transcripts', methods=['GET'])
def list_transcripts():
    """List available Claude Code transcripts for all projects.

    Query params:
        limit: Max transcripts per project (default: 10)
    """
    from flask import request

    transcript_reader = current_app.config['transcript_reader']
    project_paths = current_app.config.get('project_paths', [])

    limit = int(request.args.get('limit', 10))

    all_transcripts = []
    for project_path in project_paths:
        transcripts = transcript_reader.list_transcripts(project_path)
        # Filter to main transcripts only
        main_transcripts = [t for t in transcripts if not t.get('is_subagent')]
        # Sort by modification time and limit
        main_transcripts.sort(key=lambda t: t['modified'], reverse=True)
        for t in main_transcripts[:limit]:
            all_transcripts.append({
                'session_id': t['session_id'],
                'project_path': project_path,
                'modified': t['modified'].isoformat(),
                'size': t['size']
            })

    # Sort all by modification time
    all_transcripts.sort(key=lambda t: t['modified'], reverse=True)

    return jsonify({
        'transcripts': all_transcripts,
        'count': len(all_transcripts)
    })


@sessions_bp.route('/api/transcripts/<claude_session_id>', methods=['GET'])
def get_transcript(claude_session_id):
    """Get a specific Claude Code transcript by its session ID.

    Query params:
        project_path: The project path (required if ambiguous)
        include_subagents: Whether to include subagent transcripts (default: true)
    """
    from flask import request

    transcript_reader = current_app.config['transcript_reader']
    project_paths = current_app.config.get('project_paths', [])

    project_path = request.args.get('project_path')
    include_subagents = request.args.get('include_subagents', 'true').lower() == 'true'

    # If project_path not specified, search all projects
    if not project_path:
        for pp in project_paths:
            filepath = transcript_reader.find_transcript_by_session(claude_session_id, pp)
            if filepath:
                project_path = pp
                break

    if not project_path:
        return jsonify({'error': 'Transcript not found'}), 404

    conversation = transcript_reader.read_full_conversation(
        claude_session_id,
        project_path,
        include_subagents=include_subagents
    )

    # Convert messages to dicts
    main_messages = [transcript_reader.to_dict(m) for m in conversation['main']]
    subagent_messages = {
        agent_id: [transcript_reader.to_dict(m) for m in msgs]
        for agent_id, msgs in conversation.get('subagents', {}).items()
    }

    return jsonify({
        'claude_session_id': claude_session_id,
        'project_path': project_path,
        'messages': main_messages,
        'subagents': subagent_messages,
        'message_count': len(main_messages),
        'subagent_count': len(subagent_messages)
    })
