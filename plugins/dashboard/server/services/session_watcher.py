"""Session watcher for instant detection of new/updated sessions."""

import os
import time
from threading import Thread, Event
from typing import Callable, Optional
from dataclasses import dataclass


@dataclass
class SessionFileEvent:
    """Represents a session file event."""
    session_id: str
    project_path: str
    session_file: str
    event_type: str  # 'created', 'modified', 'deleted'


class SessionWatcher:
    """Watches handoffs directories for session.json changes.

    This provides instant detection of new sessions by watching
    the .claude/handoffs/*/session.json pattern across all projects.
    """

    def __init__(
        self,
        project_paths: list[str],
        on_session_event: Callable[[SessionFileEvent], None],
        poll_interval: float = 0.5  # Fast polling for near-instant detection
    ):
        """Initialize the session watcher.

        Args:
            project_paths: List of project directories to watch.
            on_session_event: Callback when session.json is created/modified/deleted.
            poll_interval: Polling interval in seconds (default 0.5 for responsiveness).
        """
        self.project_paths = project_paths
        self.on_session_event = on_session_event
        self.poll_interval = poll_interval
        self.stop_event = Event()
        self.thread: Optional[Thread] = None

        # Track session files: {session_file_path: mtime}
        self.session_mtimes: dict[str, float] = {}
        # Track which session_id maps to which file
        self.session_files: dict[str, str] = {}

    def start(self) -> None:
        """Start watching for session changes."""
        if self.thread and self.thread.is_alive():
            return

        self.stop_event.clear()

        # Initialize state with existing sessions
        self._scan_all_sessions(notify=False)

        self.thread = Thread(target=self._watch_loop, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        """Stop watching."""
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=2.0)

    def add_project_path(self, path: str) -> None:
        """Add a new project path to watch."""
        if path not in self.project_paths:
            self.project_paths.append(path)

    def _watch_loop(self) -> None:
        """Main watch loop with fast polling."""
        while not self.stop_event.is_set():
            try:
                self._check_for_changes()
            except Exception as e:
                print(f"Error in session watcher: {e}")

            self.stop_event.wait(self.poll_interval)

    def _scan_all_sessions(self, notify: bool = True) -> None:
        """Scan all project paths for session.json files.

        Args:
            notify: Whether to notify callbacks for found sessions.
        """
        for project_path in self.project_paths:
            handoffs_dir = os.path.join(project_path, '.claude', 'handoffs')
            if not os.path.isdir(handoffs_dir):
                continue

            try:
                for session_id in os.listdir(handoffs_dir):
                    session_dir = os.path.join(handoffs_dir, session_id)
                    if not os.path.isdir(session_dir):
                        continue

                    session_file = os.path.join(session_dir, 'session.json')
                    if os.path.isfile(session_file):
                        try:
                            mtime = os.path.getmtime(session_file)

                            if session_file not in self.session_mtimes:
                                # New session
                                self.session_mtimes[session_file] = mtime
                                self.session_files[session_id] = session_file

                                if notify:
                                    self._notify(SessionFileEvent(
                                        session_id=session_id,
                                        project_path=project_path,
                                        session_file=session_file,
                                        event_type='created'
                                    ))
                            else:
                                # Existing - just update tracking
                                self.session_mtimes[session_file] = mtime
                                self.session_files[session_id] = session_file

                        except OSError:
                            continue
            except OSError:
                continue

    def _check_for_changes(self) -> None:
        """Check for new, modified, or deleted session.json files."""
        current_files: set[str] = set()

        for project_path in self.project_paths:
            handoffs_dir = os.path.join(project_path, '.claude', 'handoffs')
            if not os.path.isdir(handoffs_dir):
                continue

            try:
                for session_id in os.listdir(handoffs_dir):
                    session_dir = os.path.join(handoffs_dir, session_id)
                    if not os.path.isdir(session_dir):
                        continue

                    session_file = os.path.join(session_dir, 'session.json')
                    if not os.path.isfile(session_file):
                        continue

                    current_files.add(session_file)

                    try:
                        mtime = os.path.getmtime(session_file)
                    except OSError:
                        continue

                    if session_file not in self.session_mtimes:
                        # New session detected!
                        self.session_mtimes[session_file] = mtime
                        self.session_files[session_id] = session_file

                        self._notify(SessionFileEvent(
                            session_id=session_id,
                            project_path=project_path,
                            session_file=session_file,
                            event_type='created'
                        ))

                    elif mtime > self.session_mtimes[session_file]:
                        # Session modified
                        self.session_mtimes[session_file] = mtime

                        self._notify(SessionFileEvent(
                            session_id=session_id,
                            project_path=project_path,
                            session_file=session_file,
                            event_type='modified'
                        ))

            except OSError:
                continue

        # Check for deleted sessions
        deleted_files = set(self.session_mtimes.keys()) - current_files
        for session_file in deleted_files:
            # Find session_id for this file
            session_id = None
            for sid, sfile in list(self.session_files.items()):
                if sfile == session_file:
                    session_id = sid
                    del self.session_files[sid]
                    break

            del self.session_mtimes[session_file]

            if session_id:
                # Extract project_path from session_file
                # Path format: <project>/.claude/handoffs/<session_id>/session.json
                parts = session_file.split(os.sep)
                try:
                    handoffs_idx = parts.index('handoffs')
                    project_path = os.sep.join(parts[:handoffs_idx - 1])
                except ValueError:
                    project_path = ''

                self._notify(SessionFileEvent(
                    session_id=session_id,
                    project_path=project_path,
                    session_file=session_file,
                    event_type='deleted'
                ))

    def _notify(self, event: SessionFileEvent) -> None:
        """Notify callback of a session event."""
        try:
            self.on_session_event(event)
        except Exception as e:
            print(f"Error in session watcher callback: {e}")
