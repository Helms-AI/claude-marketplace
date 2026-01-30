"""Changeset tracker for monitoring active changesets and handoffs."""

import json
import os
import uuid
from datetime import datetime
from threading import Lock
from typing import Optional

from ..models import ChangesetInfo, HandoffInfo, ConversationEvent, EventType


class ChangesetTracker:
    """Tracks active changesets and cross-domain handoffs."""

    def __init__(self, project_paths: Optional[list[str]] = None, event_store=None):
        """Initialize the changeset tracker.

        Args:
            project_paths: List of project directories to scan for .claude/changesets/.
            event_store: Optional EventStore to register events with for SSE broadcast.
        """
        self.project_paths = project_paths or []
        self.event_store = event_store
        self.changesets: dict[str, ChangesetInfo] = {}
        self.handoffs: list[HandoffInfo] = []
        self.lock = Lock()

    def get_or_create_changeset(self, changeset_id: Optional[str] = None) -> ChangesetInfo:
        """Get an existing changeset or create a new one.

        Args:
            changeset_id: Optional changeset ID. If None, creates a new changeset.

        Returns:
            ChangesetInfo object.
        """
        with self.lock:
            if changeset_id and changeset_id in self.changesets:
                return self.changesets[changeset_id]

            # Create new changeset
            new_id = changeset_id or str(uuid.uuid4())[:8]
            changeset = ChangesetInfo(
                changeset_id=new_id,
                started_at=datetime.now()
            )
            self.changesets[new_id] = changeset
            return changeset

    def get_changeset(self, changeset_id: str) -> Optional[ChangesetInfo]:
        """Get a changeset by ID.

        Args:
            changeset_id: The changeset ID.

        Returns:
            ChangesetInfo or None if not found.
        """
        return self.changesets.get(changeset_id)

    def get_all_changesets(self) -> list[ChangesetInfo]:
        """Get all active changesets.

        Returns:
            List of all ChangesetInfo objects.
        """
        return list(self.changesets.values())

    def add_event(self, changeset_id: str, event: ConversationEvent) -> None:
        """Add an event to a changeset.

        Args:
            changeset_id: The changeset ID.
            event: The event to add.
        """
        changeset = self.get_or_create_changeset(changeset_id)
        with self.lock:
            changeset.events.append(event)

            # Update changeset state based on event type
            if event.event_type == EventType.AGENT_ACTIVATED:
                changeset.current_agent = event.agent_id
                changeset.current_domain = event.domain

            elif event.event_type == EventType.HANDOFF_STARTED:
                changeset.phase = "handoff"

            elif event.event_type == EventType.HANDOFF_COMPLETED:
                changeset.phase = "active"

            elif event.event_type == EventType.ARTIFACT_CREATED:
                artifact_name = event.content.get('name', '')
                if artifact_name:
                    changeset.artifacts.append(artifact_name)

    def record_handoff(
        self,
        changeset_id: str,
        source_domain: str,
        target_domain: str,
        source_agent: Optional[str] = None,
        target_agent: Optional[str] = None,
        context: Optional[dict] = None
    ) -> HandoffInfo:
        """Record a cross-domain handoff.

        Args:
            changeset_id: The changeset ID.
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
            changeset_id=changeset_id,
            source_domain=source_domain,
            target_domain=target_domain,
            source_agent=source_agent,
            target_agent=target_agent,
            context=context or {},
            status="in_progress"
        )

        with self.lock:
            self.handoffs.append(handoff)

            # Update changeset
            changeset = self.get_or_create_changeset(changeset_id)
            changeset.handoffs.append({
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

    def get_changeset_handoffs(self, changeset_id: str) -> list[HandoffInfo]:
        """Get all handoffs for a changeset.

        Args:
            changeset_id: The changeset ID.

        Returns:
            List of HandoffInfo objects for the changeset.
        """
        with self.lock:
            return [h for h in self.handoffs if h.changeset_id == changeset_id]

    def scan(self) -> None:
        """Scan all project paths for changesets and handoffs."""
        with self.lock:
            self.changesets.clear()
            self.handoffs.clear()

        for project_path in self.project_paths:
            changesets_dir = os.path.join(project_path, '.claude', 'changesets')
            if os.path.isdir(changesets_dir):
                self._scan_changesets_directory(changesets_dir, project_path)

    def _scan_changesets_directory(self, changesets_dir: str, project_path: str) -> None:
        """Scan a changesets directory for changesets.

        The structure is: .claude/changesets/<changeset-id>/changeset.json

        Args:
            changesets_dir: Path to the changesets directory.
            project_path: Path to the project root.
        """
        try:
            for entry in os.listdir(changesets_dir):
                changeset_dir = os.path.join(changesets_dir, entry)
                if not os.path.isdir(changeset_dir):
                    continue

                # Look for changeset.json in this changeset directory
                changeset_file = os.path.join(changeset_dir, 'changeset.json')
                if os.path.isfile(changeset_file):
                    self._load_changeset_file(changeset_file, entry, project_path)

                # Load handoff_*.json files in changeset directory
                self._load_handoff_files(changeset_dir, entry)

                # Load artifacts from subdirectory
                self._load_artifacts(changeset_dir, entry)

        except Exception as e:
            print(f"Error scanning changesets directory {changesets_dir}: {e}")

    def _load_changeset_file(self, filepath: str, changeset_id: str, project_path: str) -> None:
        """Load a changeset.json file.

        Args:
            filepath: Path to the changeset.json file.
            changeset_id: The changeset ID (directory name).
            project_path: Path to the project root.
        """
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)

            # Use changeset_id from file or directory name
            cid = data.get('changeset_id', changeset_id)
            changeset = self.get_or_create_changeset(cid)

            # Update changeset from file data
            changeset.phase = data.get('current_phase', data.get('phase', 'active'))
            changeset.current_domain = data.get('current_domain')

            # Store project path for context
            changeset.project_path = project_path

            # Load artifacts
            for artifact in data.get('artifacts', []):
                name = artifact.get('name', '')
                if name and name not in changeset.artifacts:
                    changeset.artifacts.append(name)

            # Load decisions as events
            for decision in data.get('decisions', []):
                event = ConversationEvent(
                    id=decision.get('id', str(uuid.uuid4())),
                    timestamp=changeset.started_at,
                    changeset_id=cid,
                    event_type=EventType.DECISION_MADE,
                    domain=decision.get('domain'),
                    content={
                        'decision': decision.get('decision'),
                        'rationale': decision.get('rationale')
                    }
                )
                changeset.events.append(event)

            # Store domains involved
            changeset.domains_involved = data.get('domains_involved', [])
            changeset.original_request = data.get('original_request', '')
            changeset.handoff_count = data.get('handoff_count', 0)

            # Store Claude Code's native session ID for transcript correlation
            changeset.session_id = data.get('session_id')

        except Exception as e:
            print(f"Error loading changeset file {filepath}: {e}")

    def _load_handoff_files(self, changeset_dir: str, changeset_id: str) -> None:
        """Load handoff_*.json files from a changeset directory.

        Args:
            changeset_dir: Path to the changeset directory.
            changeset_id: The changeset ID.
        """
        try:
            for filename in os.listdir(changeset_dir):
                if filename.startswith('handoff_') and filename.endswith('.json'):
                    filepath = os.path.join(changeset_dir, filename)
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
                            changeset_id=data.get('session_id', changeset_id),
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
            print(f"Error scanning changeset directory {changeset_dir}: {e}")

    def _load_artifacts(self, changeset_dir: str, changeset_id: str) -> None:
        """Load artifacts from a changeset's artifacts subdirectory.

        Args:
            changeset_dir: Path to the changeset directory.
            changeset_id: The changeset ID.
        """
        artifacts_dir = os.path.join(changeset_dir, 'artifacts')
        if not os.path.isdir(artifacts_dir):
            return

        try:
            changeset = self.get_changeset(changeset_id)
            if not changeset:
                return

            for filename in os.listdir(artifacts_dir):
                filepath = os.path.join(artifacts_dir, filename)
                if os.path.isfile(filepath) and filename not in changeset.artifacts:
                    changeset.artifacts.append(filename)

        except Exception as e:
            print(f"Error loading artifacts from {artifacts_dir}: {e}")

    def load_from_files(self) -> None:
        """Legacy method - calls scan() for backwards compatibility."""
        self.scan()

    def to_dict(self, changeset: ChangesetInfo) -> dict:
        """Convert a ChangesetInfo to a dictionary for JSON serialization.

        Args:
            changeset: The ChangesetInfo object.

        Returns:
            Dictionary representation.
        """
        return {
            'id': changeset.changeset_id,
            'started_at': changeset.started_at.isoformat(),
            'phase': changeset.phase,
            'current_domain': changeset.current_domain,
            'current_agent': changeset.current_agent,
            'event_count': len(changeset.events),
            'handoff_count': changeset.handoff_count or len(changeset.handoffs),
            'artifacts': changeset.artifacts,
            'project_path': changeset.project_path,
            'domains_involved': changeset.domains_involved,
            'original_request': changeset.original_request,
            'session_id': changeset.session_id  # Claude Code's native session ID
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
            'changeset_id': handoff.changeset_id,
            'source_domain': handoff.source_domain,
            'target_domain': handoff.target_domain,
            'source_agent': handoff.source_agent,
            'target_agent': handoff.target_agent,
            'context': handoff.context,
            'status': handoff.status
        }
