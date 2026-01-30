"""Session tracker for monitoring active sessions and handoffs."""

import json
import os
import uuid
from datetime import datetime
from threading import Lock
from typing import Optional

from ..models import SessionInfo, HandoffInfo, ConversationEvent, EventType


class SessionTracker:
    """Tracks active sessions and cross-domain handoffs."""

    def __init__(self, project_paths: Optional[list[str]] = None, event_store=None):
        """Initialize the session tracker.

        Args:
            project_paths: List of project directories to scan for .claude/handoffs/.
            event_store: Optional EventStore to register events with for SSE broadcast.
        """
        self.project_paths = project_paths or []
        self.event_store = event_store
        self.sessions: dict[str, SessionInfo] = {}
        self.handoffs: list[HandoffInfo] = []
        self.lock = Lock()

    def get_or_create_session(self, session_id: Optional[str] = None) -> SessionInfo:
        """Get an existing session or create a new one.

        Args:
            session_id: Optional session ID. If None, creates a new session.

        Returns:
            SessionInfo object.
        """
        with self.lock:
            if session_id and session_id in self.sessions:
                return self.sessions[session_id]

            # Create new session
            new_id = session_id or str(uuid.uuid4())[:8]
            session = SessionInfo(
                id=new_id,
                started_at=datetime.now()
            )
            self.sessions[new_id] = session
            return session

    def get_session(self, session_id: str) -> Optional[SessionInfo]:
        """Get a session by ID.

        Args:
            session_id: The session ID.

        Returns:
            SessionInfo or None if not found.
        """
        return self.sessions.get(session_id)

    def get_all_sessions(self) -> list[SessionInfo]:
        """Get all active sessions.

        Returns:
            List of all SessionInfo objects.
        """
        return list(self.sessions.values())

    def add_event(self, session_id: str, event: ConversationEvent) -> None:
        """Add an event to a session.

        Args:
            session_id: The session ID.
            event: The event to add.
        """
        session = self.get_or_create_session(session_id)
        with self.lock:
            session.events.append(event)

            # Update session state based on event type
            if event.event_type == EventType.AGENT_ACTIVATED:
                session.current_agent = event.agent_id
                session.current_domain = event.domain

            elif event.event_type == EventType.HANDOFF_STARTED:
                session.phase = "handoff"

            elif event.event_type == EventType.HANDOFF_COMPLETED:
                session.phase = "active"

            elif event.event_type == EventType.ARTIFACT_CREATED:
                artifact_name = event.content.get('name', '')
                if artifact_name:
                    session.artifacts.append(artifact_name)

    def record_handoff(
        self,
        session_id: str,
        source_domain: str,
        target_domain: str,
        source_agent: Optional[str] = None,
        target_agent: Optional[str] = None,
        context: Optional[dict] = None
    ) -> HandoffInfo:
        """Record a cross-domain handoff.

        Args:
            session_id: The session ID.
            source_domain: The source domain.
            target_domain: The target domain.
            source_agent: Optional source agent ID.
            target_agent: Optional target agent ID.
            context: Optional handoff context.

        Returns:
            The created HandoffInfo.
        """
        handoff = HandoffInfo(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            session_id=session_id,
            source_domain=source_domain,
            target_domain=target_domain,
            source_agent=source_agent,
            target_agent=target_agent,
            context=context or {},
            status="in_progress"
        )

        with self.lock:
            self.handoffs.append(handoff)

            # Update session
            session = self.get_or_create_session(session_id)
            session.handoffs.append({
                'id': handoff.id,
                'source': source_domain,
                'target': target_domain,
                'timestamp': handoff.timestamp.isoformat()
            })

        return handoff

    def complete_handoff(self, handoff_id: str) -> None:
        """Mark a handoff as complete.

        Args:
            handoff_id: The handoff ID.
        """
        with self.lock:
            for handoff in self.handoffs:
                if handoff.id == handoff_id:
                    handoff.status = "completed"
                    break

    def get_recent_handoffs(self, limit: int = 20) -> list[HandoffInfo]:
        """Get recent handoffs.

        Args:
            limit: Maximum number of handoffs to return.

        Returns:
            List of recent HandoffInfo objects.
        """
        with self.lock:
            return list(reversed(self.handoffs[-limit:]))

    def get_session_handoffs(self, session_id: str) -> list[HandoffInfo]:
        """Get all handoffs for a session.

        Args:
            session_id: The session ID.

        Returns:
            List of HandoffInfo objects for the session.
        """
        with self.lock:
            return [h for h in self.handoffs if h.session_id == session_id]

    def scan(self) -> None:
        """Scan all project paths for sessions and handoffs."""
        with self.lock:
            self.sessions.clear()
            self.handoffs.clear()

        for project_path in self.project_paths:
            handoffs_dir = os.path.join(project_path, '.claude', 'handoffs')
            if os.path.isdir(handoffs_dir):
                self._scan_handoffs_directory(handoffs_dir, project_path)

    def _scan_handoffs_directory(self, handoffs_dir: str, project_path: str) -> None:
        """Scan a handoffs directory for sessions.

        The structure is: .claude/handoffs/<session-id>/session.json

        Args:
            handoffs_dir: Path to the handoffs directory.
            project_path: Path to the project root.
        """
        try:
            for entry in os.listdir(handoffs_dir):
                session_dir = os.path.join(handoffs_dir, entry)
                if not os.path.isdir(session_dir):
                    continue

                # Look for session.json in this session directory
                session_file = os.path.join(session_dir, 'session.json')
                if os.path.isfile(session_file):
                    self._load_session_file(session_file, entry, project_path)

                # Load handoff_*.json files in session directory
                self._load_handoff_files(session_dir, entry)

        except Exception as e:
            print(f"Error scanning handoffs directory {handoffs_dir}: {e}")

    def _load_session_file(self, filepath: str, session_id: str, project_path: str) -> None:
        """Load a session.json file.

        Args:
            filepath: Path to the session.json file.
            session_id: The session ID (directory name).
            project_path: Path to the project root.
        """
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)

            # Use session_id from file or directory name
            sid = data.get('session_id', session_id)
            session = self.get_or_create_session(sid)

            # Update session from file data
            session.phase = data.get('current_phase', data.get('phase', 'active'))
            session.current_domain = data.get('current_domain')

            # Store project path for context
            session.project_path = project_path

            # Load artifacts
            for artifact in data.get('artifacts', []):
                name = artifact.get('name', '')
                if name and name not in session.artifacts:
                    session.artifacts.append(name)

            # Load decisions as events
            for decision in data.get('decisions', []):
                event = ConversationEvent(
                    id=decision.get('id', str(uuid.uuid4())),
                    timestamp=session.started_at,
                    session_id=sid,
                    event_type=EventType.DECISION_MADE,
                    domain=decision.get('domain'),
                    content={
                        'decision': decision.get('decision'),
                        'rationale': decision.get('rationale')
                    }
                )
                session.events.append(event)

            # Store domains involved
            session.domains_involved = data.get('domains_involved', [])
            session.original_request = data.get('original_request', '')
            session.handoff_count = data.get('handoff_count', 0)

            # Store Claude Code session ID for transcript correlation
            session.claude_session_id = data.get('claude_session_id')

        except Exception as e:
            print(f"Error loading session file {filepath}: {e}")

    def _load_handoff_files(self, session_dir: str, session_id: str) -> None:
        """Load handoff_*.json files from a session directory.

        Args:
            session_dir: Path to the session directory.
            session_id: The session ID.
        """
        try:
            for filename in os.listdir(session_dir):
                if filename.startswith('handoff_') and filename.endswith('.json'):
                    filepath = os.path.join(session_dir, filename)
                    try:
                        with open(filepath, 'r') as f:
                            data = json.load(f)

                        # Extract domains with fallback chain for different JSON structures
                        # Supports: flat fields (source_domain), nested structure (source.plugin)
                        source_domain = (
                            data.get('source_domain') or
                            data.get('source', {}).get('plugin') or
                            data.get('from_domain') or
                            'pm'  # Default to PM as orchestrator
                        )

                        target_domain = (
                            data.get('target_domain') or
                            data.get('target', {}).get('plugin') or
                            data.get('to_domain') or
                            'unknown'
                        )

                        # Extract agent names from context or nested structure
                        source_agent = (
                            data.get('source_agent') or
                            data.get('source', {}).get('skill')  # Use skill as agent identifier
                        )

                        target_agent = (
                            data.get('target_agent') or
                            data.get('target', {}).get('skill')
                        )

                        handoff = HandoffInfo(
                            id=data.get('id', filename),
                            timestamp=datetime.fromisoformat(data.get('timestamp', datetime.now().isoformat())),
                            session_id=data.get('session_id', session_id),
                            source_domain=source_domain,
                            target_domain=target_domain,
                            source_agent=source_agent,
                            target_agent=target_agent,
                            context=data.get('context', {}),
                            status=data.get('status', 'completed')
                        )

                        with self.lock:
                            self.handoffs.append(handoff)

                    except Exception as e:
                        print(f"Error loading {filename}: {e}")

        except Exception as e:
            print(f"Error scanning session directory {session_dir}: {e}")

    def load_from_files(self) -> None:
        """Legacy method - calls scan() for backwards compatibility."""
        self.scan()

    def to_dict(self, session: SessionInfo) -> dict:
        """Convert a SessionInfo to a dictionary for JSON serialization.

        Args:
            session: The SessionInfo object.

        Returns:
            Dictionary representation.
        """
        return {
            'id': session.id,
            'started_at': session.started_at.isoformat(),
            'phase': session.phase,
            'current_domain': session.current_domain,
            'current_agent': session.current_agent,
            'event_count': len(session.events),
            'handoff_count': session.handoff_count or len(session.handoffs),
            'artifacts': session.artifacts,
            'project_path': session.project_path,
            'domains_involved': session.domains_involved,
            'original_request': session.original_request,
            'claude_session_id': session.claude_session_id
        }

    def handoff_to_dict(self, handoff: HandoffInfo) -> dict:
        """Convert a HandoffInfo to a dictionary for JSON serialization.

        Args:
            handoff: The HandoffInfo object.

        Returns:
            Dictionary representation.
        """
        return {
            'id': handoff.id,
            'timestamp': handoff.timestamp.isoformat(),
            'session_id': handoff.session_id,
            'source_domain': handoff.source_domain,
            'target_domain': handoff.target_domain,
            'source_agent': handoff.source_agent,
            'target_agent': handoff.target_agent,
            'context': handoff.context,
            'status': handoff.status
        }
