"""Scanner for active Claude Code sessions.

Discovers running Claude Code sessions by reading ~/.claude/sessions/*.json
and correlating them with transcript files. Filters sessions by project path
and verifies PIDs are still alive.
"""

import json
import os
import signal
import sys
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class ActiveSession:
    """An active Claude Code session."""
    pid: int
    session_id: str  # Claude Code's native UUID
    cwd: str
    started_at: datetime
    kind: str = "interactive"
    entrypoint: str = "cli"
    name: Optional[str] = None
    transcript_path: Optional[str] = None
    is_alive: bool = True


class SessionScanner:
    """Scans for active Claude Code sessions.

    Reads session files from ~/.claude/sessions/ and filters them
    by project path. Verifies that session PIDs are still running.
    """

    def __init__(
        self,
        project_paths: list[str],
        claude_home: str = "~/.claude",
        debug: bool = False
    ):
        self.project_paths = [os.path.abspath(p) for p in project_paths]
        self.claude_home = os.path.expanduser(claude_home)
        self.sessions_dir = os.path.join(self.claude_home, "sessions")
        self.projects_dir = os.path.join(self.claude_home, "projects")
        self.debug = debug
        self._known_sessions: dict[str, ActiveSession] = {}

    def _log(self, msg: str) -> None:
        if self.debug:
            print(f"[SessionScanner] {msg}", file=sys.stderr, flush=True)

    def _is_pid_alive(self, pid: int) -> bool:
        """Check if a process with the given PID is still running."""
        try:
            os.kill(pid, 0)
            return True
        except (OSError, ProcessLookupError):
            return False

    def _escape_project_path(self, project_path: str) -> str:
        """Convert a project path to Claude's escaped directory name."""
        if project_path.startswith('/'):
            project_path = project_path[1:]
        return '-' + project_path.replace('/', '-')

    def _find_transcript(self, session_id: str, cwd: str) -> Optional[str]:
        """Find the transcript file for a session."""
        escaped = self._escape_project_path(cwd)
        transcript_path = os.path.join(
            self.projects_dir, escaped, f"{session_id}.jsonl"
        )
        if os.path.isfile(transcript_path):
            return transcript_path
        return None

    def _matches_project(self, cwd: str) -> bool:
        """Check if a session's cwd matches any of our project paths."""
        abs_cwd = os.path.abspath(cwd)
        for project_path in self.project_paths:
            if abs_cwd == project_path:
                return True
        return False

    def scan(self) -> list[ActiveSession]:
        """Scan for active sessions matching our project paths.

        Returns:
            List of ActiveSession objects for running sessions.
        """
        if not os.path.isdir(self.sessions_dir):
            self._log(f"Sessions directory not found: {self.sessions_dir}")
            return []

        sessions = []

        try:
            for filename in os.listdir(self.sessions_dir):
                if not filename.endswith('.json'):
                    continue

                filepath = os.path.join(self.sessions_dir, filename)
                try:
                    with open(filepath, 'r') as f:
                        data = json.load(f)
                except (json.JSONDecodeError, IOError) as e:
                    self._log(f"Error reading {filename}: {e}")
                    continue

                pid = data.get('pid')
                session_id = data.get('sessionId')
                cwd = data.get('cwd', '')

                if not pid or not session_id:
                    continue

                # Filter by project path
                if not self._matches_project(cwd):
                    continue

                # Check if PID is alive
                is_alive = self._is_pid_alive(pid)
                if not is_alive:
                    self._log(f"Session {session_id} (PID {pid}) is no longer running")
                    continue

                # Find transcript
                transcript_path = self._find_transcript(session_id, cwd)

                # Parse started_at (milliseconds timestamp)
                started_at_ms = data.get('startedAt', 0)
                started_at = datetime.fromtimestamp(started_at_ms / 1000)

                session = ActiveSession(
                    pid=pid,
                    session_id=session_id,
                    cwd=cwd,
                    started_at=started_at,
                    kind=data.get('kind', 'interactive'),
                    entrypoint=data.get('entrypoint', 'cli'),
                    name=data.get('name'),
                    transcript_path=transcript_path,
                    is_alive=True
                )
                sessions.append(session)
                self._log(f"Found active session: {session_id} (PID {pid})")

        except OSError as e:
            self._log(f"Error scanning sessions directory: {e}")

        return sessions

    def get_new_and_ended(
        self, current_sessions: list[ActiveSession]
    ) -> tuple[list[ActiveSession], list[ActiveSession]]:
        """Compare current scan with previous state to find changes.

        Args:
            current_sessions: Results from latest scan().

        Returns:
            Tuple of (new_sessions, ended_sessions).
        """
        current_ids = {s.session_id: s for s in current_sessions}
        previous_ids = set(self._known_sessions.keys())
        current_id_set = set(current_ids.keys())

        new_sessions = [
            current_ids[sid] for sid in (current_id_set - previous_ids)
        ]
        ended_sessions = [
            self._known_sessions[sid] for sid in (previous_ids - current_id_set)
        ]

        # Update known state
        self._known_sessions = current_ids

        return new_sessions, ended_sessions

    def to_dict(self, session: ActiveSession) -> dict:
        """Convert an ActiveSession to a JSON-serializable dict."""
        return {
            'pid': session.pid,
            'session_id': session.session_id,
            'cwd': session.cwd,
            'started_at': session.started_at.isoformat(),
            'kind': session.kind,
            'entrypoint': session.entrypoint,
            'name': session.name,
            'has_transcript': session.transcript_path is not None,
            'is_alive': session.is_alive
        }
