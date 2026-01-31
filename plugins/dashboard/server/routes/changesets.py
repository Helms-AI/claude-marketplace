"""Changesets API routes."""

from flask import Blueprint, jsonify, current_app

changesets_bp = Blueprint('changesets', __name__)


@changesets_bp.route('/api/changesets', methods=['GET'])
def get_all_changesets():
    """Get all active changesets."""
    tracker = current_app.config['changeset_tracker']
    changesets = tracker.get_all_changesets()
    return jsonify({
        'changesets': [tracker.to_dict(c) for c in changesets],
        'count': len(changesets)
    })


@changesets_bp.route('/api/changesets/<changeset_id>', methods=['GET'])
def get_changeset(changeset_id):
    """Get a specific changeset."""
    tracker = current_app.config['changeset_tracker']
    changeset = tracker.get_changeset(changeset_id)
    if not changeset:
        return jsonify({'error': 'Changeset not found'}), 404
    return jsonify(tracker.to_dict(changeset))


@changesets_bp.route('/api/changesets/<changeset_id>', methods=['DELETE'])
def delete_changeset(changeset_id):
    """Delete a changeset and all its files.

    This removes the entire changeset directory from .claude/changesets/<changeset_id>/
    """
    import os
    import shutil

    tracker = current_app.config['changeset_tracker']
    changeset = tracker.get_changeset(changeset_id)

    if not changeset:
        return jsonify({'error': 'Changeset not found'}), 404

    project_path = changeset.project_path
    if not project_path:
        return jsonify({'error': 'No project path for changeset'}), 400

    # Build the changeset directory path
    changeset_dir = os.path.join(project_path, '.claude', 'changesets', changeset_id)

    if not os.path.isdir(changeset_dir):
        return jsonify({'error': 'Changeset directory not found', 'path': changeset_dir}), 404

    # Delete the entire changeset directory
    try:
        shutil.rmtree(changeset_dir)
    except Exception as e:
        return jsonify({'error': f'Failed to delete changeset: {str(e)}'}), 500

    # Remove from tracker's in-memory state
    with tracker.lock:
        if changeset_id in tracker.changesets:
            del tracker.changesets[changeset_id]
        # Remove related handoffs
        tracker.handoffs = [h for h in tracker.handoffs if h.changeset_id != changeset_id]

    # Broadcast deletion via SSE
    sse_manager = current_app.config.get('sse_manager')
    if sse_manager:
        sse_manager.broadcast({
            'changeset_id': changeset_id
        }, event_type='changeset_deleted')

    return jsonify({
        'status': 'deleted',
        'changeset_id': changeset_id,
        'deleted_path': changeset_dir
    })


@changesets_bp.route('/api/changesets/<changeset_id>/conversation', methods=['GET'])
def get_changeset_conversation(changeset_id):
    """Get full conversation transcript for a changeset."""
    tracker = current_app.config['changeset_tracker']
    event_store = current_app.config['event_store']

    changeset = tracker.get_changeset(changeset_id)
    if not changeset:
        return jsonify({'error': 'Changeset not found'}), 404

    # Get events from changeset directly (loaded from session.json)
    # Also check event_store for any real-time events
    changeset_events = changeset.events
    event_store_events = event_store.get_by_changeset(changeset_id)

    # Combine and dedupe by event id
    seen_ids = set()
    all_events = []
    for e in changeset_events + event_store_events:
        if e.id not in seen_ids:
            seen_ids.add(e.id)
            all_events.append(e)

    # Sort by timestamp
    all_events.sort(key=lambda e: e.timestamp)

    return jsonify({
        'changeset': tracker.to_dict(changeset),
        'events': [event_store.to_dict(e) for e in all_events],
        'event_count': len(all_events)
    })


@changesets_bp.route('/api/changesets/<changeset_id>/timeline', methods=['GET'])
def get_changeset_timeline(changeset_id):
    """Get visual timeline of agent handoffs for a changeset."""
    tracker = current_app.config['changeset_tracker']

    changeset = tracker.get_changeset(changeset_id)
    if not changeset:
        return jsonify({'error': 'Changeset not found'}), 404

    handoffs = tracker.get_changeset_handoffs(changeset_id)

    # Build timeline with swimlanes by domain
    timeline = {
        'changeset_id': changeset_id,
        'started_at': changeset.started_at.isoformat(),
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


@changesets_bp.route('/api/handoffs', methods=['GET'])
def get_recent_handoffs():
    """Get recent cross-domain handoffs."""
    tracker = current_app.config['changeset_tracker']
    handoffs = tracker.get_recent_handoffs(limit=20)
    return jsonify({
        'handoffs': [tracker.handoff_to_dict(h) for h in handoffs],
        'count': len(handoffs)
    })


@changesets_bp.route('/api/handoffs/<handoff_id>', methods=['GET'])
def get_handoff(handoff_id):
    """Get a specific handoff."""
    tracker = current_app.config['changeset_tracker']
    handoffs = tracker.get_recent_handoffs(limit=1000)

    for handoff in handoffs:
        if handoff.id == handoff_id:
            return jsonify(tracker.handoff_to_dict(handoff))

    return jsonify({'error': 'Handoff not found'}), 404


@changesets_bp.route('/api/changesets/<changeset_id>/transcript', methods=['GET'])
def get_changeset_transcript(changeset_id):
    """Get full Claude Code conversation transcript for a changeset.

    This reads the actual Claude Code JSONL transcript files that contain
    the complete conversation including user messages, assistant responses,
    tool calls, and subagent conversations.

    Query params:
        include_subagents: Whether to include subagent transcripts (default: true)
        merge_timeline: Whether to merge main and subagent messages chronologically (default: false)
    """
    from flask import request

    tracker = current_app.config['changeset_tracker']
    transcript_reader = current_app.config['transcript_reader']

    changeset = tracker.get_changeset(changeset_id)
    if not changeset:
        return jsonify({'error': 'Changeset not found'}), 404

    # Get the Claude transcript session ID if stored in changeset
    # This may differ from the PM changeset ID
    session_id = getattr(changeset, 'session_id', None)
    project_path = changeset.project_path

    if not project_path:
        return jsonify({
            'error': 'No project path for changeset',
            'changeset_id': changeset_id
        }), 404

    include_subagents = request.args.get('include_subagents', 'true').lower() == 'true'
    merge_timeline = request.args.get('merge_timeline', 'false').lower() == 'true'

    # If we have the direct Claude session ID, use it
    if session_id:
        conversation = transcript_reader.read_full_conversation(
            session_id,
            project_path,
            include_subagents=include_subagents
        )
    else:
        # Try to find transcript by changeset creation time
        transcript_path = transcript_reader.find_transcript_by_timestamp(
            project_path,
            changeset.started_at,
            tolerance_seconds=600  # 10 minute window
        )

        if transcript_path:
            # Extract session ID from filename
            import os
            filename = os.path.basename(transcript_path)
            session_id = filename[:-6] if filename.endswith('.jsonl') else filename

            conversation = transcript_reader.read_full_conversation(
                session_id,
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

    # Extract agent type metadata from Task tool calls
    # Pass subagent IDs so we can match Task calls to agents by order
    subagent_ids = list(conversation.get('subagents', {}).keys())
    agent_metadata = transcript_reader.extract_agent_types(conversation['main'], subagent_ids)

    response = {
        'changeset_id': changeset_id,
        'session_id': conversation.get('session_id'),  # Claude Code's native session ID
        'project_path': project_path,
        'messages': main_messages,
        'subagents': subagent_messages,
        'message_count': len(main_messages),
        'subagent_count': len(subagent_messages),
        'agent_metadata': agent_metadata
    }

    # Optionally include merged timeline
    if merge_timeline and include_subagents:
        response['merged_timeline'] = transcript_reader.merge_chronologically(
            conversation['main'],
            conversation.get('subagents', {})
        )

    return jsonify(response)


@changesets_bp.route('/api/transcripts', methods=['GET'])
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


@changesets_bp.route('/api/changesets/<changeset_id>/artifacts/<path:filename>', methods=['GET'])
def get_artifact_content(changeset_id, filename):
    """Get content of a specific artifact file.

    Returns:
        {
            'content': str,           # File content
            'content_type': str,      # 'markdown', 'json', 'text', etc.
            'artifact_name': str,     # Filename
            'size': int               # File size in bytes
        }
    """
    import os
    import mimetypes

    tracker = current_app.config['changeset_tracker']
    changeset = tracker.get_changeset(changeset_id)

    if not changeset:
        return jsonify({'error': 'Changeset not found'}), 404

    project_path = changeset.project_path
    if not project_path:
        return jsonify({'error': 'No project path for changeset'}), 400

    # Build artifact path
    artifact_path = os.path.join(
        project_path, '.claude', 'changesets', changeset_id, 'artifacts', filename
    )

    if not os.path.isfile(artifact_path):
        return jsonify({'error': 'Artifact not found', 'path': artifact_path}), 404

    # Determine content type
    ext = os.path.splitext(filename)[1].lower()
    content_type_map = {
        '.md': 'markdown',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.txt': 'text',
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.html': 'html',
        '.css': 'css',
    }
    content_type = content_type_map.get(ext, 'text')

    try:
        with open(artifact_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        return jsonify({
            'error': 'Binary file cannot be displayed',
            'artifact_name': filename
        }), 415

    file_size = os.path.getsize(artifact_path)

    return jsonify({
        'content': content,
        'content_type': content_type,
        'artifact_name': filename,
        'size': file_size
    })


@changesets_bp.route('/api/transcripts/<session_id>', methods=['GET'])
def get_transcript(session_id):
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
            filepath = transcript_reader.find_transcript_by_session(session_id, pp)
            if filepath:
                project_path = pp
                break

    if not project_path:
        return jsonify({'error': 'Transcript not found'}), 404

    conversation = transcript_reader.read_full_conversation(
        session_id,
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
        'session_id': session_id,  # Claude Code's native session ID
        'project_path': project_path,
        'messages': main_messages,
        'subagents': subagent_messages,
        'message_count': len(main_messages),
        'subagent_count': len(subagent_messages)
    })
