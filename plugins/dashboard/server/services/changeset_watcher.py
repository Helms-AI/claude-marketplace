"""Changeset watcher for instant detection of new/updated changesets."""

import os
import time
from threading import Thread, Event
from typing import Callable, Optional
from dataclasses import dataclass


@dataclass
class ChangesetFileEvent:
    """Represents a changeset file event."""
    changeset_id: str
    project_path: str
    changeset_file: str  # Path to the changeset.json file
    event_type: str  # 'created', 'modified', 'deleted'


class ChangesetWatcher:
    """Watches changesets directories for changeset.json changes.

    This provides instant detection of new changesets by watching
    the .claude/changesets/*/changeset.json pattern across all projects.
    """

    def __init__(
        self,
        project_paths: list[str],
        on_changeset_event: Callable[[ChangesetFileEvent], None],
        poll_interval: float = 0.5  # Fast polling for near-instant detection
    ):
        """Initialize the changeset watcher.

        Args:
            project_paths: List of project directories to watch.
            on_changeset_event: Callback when changeset.json is created/modified/deleted.
            poll_interval: Polling interval in seconds (default 0.5 for responsiveness).
        """
        self.project_paths = project_paths
        self.on_changeset_event = on_changeset_event
        self.poll_interval = poll_interval
        self.stop_event = Event()
        self.thread: Optional[Thread] = None

        # Track changeset files: {changeset_file_path: mtime}
        self.changeset_mtimes: dict[str, float] = {}
        # Track which changeset_id maps to which file
        self.changeset_files: dict[str, str] = {}

    def start(self) -> None:
        """Start watching for changeset changes."""
        if self.thread and self.thread.is_alive():
            return

        self.stop_event.clear()

        # Initialize state with existing changesets
        self._scan_all_changesets(notify=False)

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
                print(f"Error in changeset watcher: {e}")

            self.stop_event.wait(self.poll_interval)

    def _scan_all_changesets(self, notify: bool = True) -> None:
        """Scan all project paths for changeset.json files.

        Args:
            notify: Whether to notify callbacks for found changesets.
        """
        for project_path in self.project_paths:
            changesets_dir = os.path.join(project_path, '.claude', 'changesets')
            if not os.path.isdir(changesets_dir):
                continue

            try:
                for changeset_id in os.listdir(changesets_dir):
                    changeset_dir = os.path.join(changesets_dir, changeset_id)
                    if not os.path.isdir(changeset_dir):
                        continue

                    changeset_file = os.path.join(changeset_dir, 'changeset.json')
                    if os.path.isfile(changeset_file):
                        try:
                            mtime = os.path.getmtime(changeset_file)

                            if changeset_file not in self.changeset_mtimes:
                                # New changeset
                                self.changeset_mtimes[changeset_file] = mtime
                                self.changeset_files[changeset_id] = changeset_file

                                if notify:
                                    self._notify(ChangesetFileEvent(
                                        changeset_id=changeset_id,
                                        project_path=project_path,
                                        changeset_file=changeset_file,
                                        event_type='created'
                                    ))
                            else:
                                # Existing - just update tracking
                                self.changeset_mtimes[changeset_file] = mtime
                                self.changeset_files[changeset_id] = changeset_file

                        except OSError:
                            continue
            except OSError:
                continue

    def _check_for_changes(self) -> None:
        """Check for new, modified, or deleted changeset.json files."""
        current_files: set[str] = set()

        for project_path in self.project_paths:
            changesets_dir = os.path.join(project_path, '.claude', 'changesets')
            if not os.path.isdir(changesets_dir):
                continue

            try:
                for changeset_id in os.listdir(changesets_dir):
                    changeset_dir = os.path.join(changesets_dir, changeset_id)
                    if not os.path.isdir(changeset_dir):
                        continue

                    changeset_file = os.path.join(changeset_dir, 'changeset.json')
                    if not os.path.isfile(changeset_file):
                        continue

                    current_files.add(changeset_file)

                    try:
                        mtime = os.path.getmtime(changeset_file)
                    except OSError:
                        continue

                    if changeset_file not in self.changeset_mtimes:
                        # New changeset detected!
                        self.changeset_mtimes[changeset_file] = mtime
                        self.changeset_files[changeset_id] = changeset_file

                        self._notify(ChangesetFileEvent(
                            changeset_id=changeset_id,
                            project_path=project_path,
                            changeset_file=changeset_file,
                            event_type='created'
                        ))

                    elif mtime > self.changeset_mtimes[changeset_file]:
                        # Changeset modified
                        self.changeset_mtimes[changeset_file] = mtime

                        self._notify(ChangesetFileEvent(
                            changeset_id=changeset_id,
                            project_path=project_path,
                            changeset_file=changeset_file,
                            event_type='modified'
                        ))

            except OSError:
                continue

        # Check for deleted changesets
        deleted_files = set(self.changeset_mtimes.keys()) - current_files
        for changeset_file in deleted_files:
            # Find changeset_id for this file
            changeset_id = None
            for cid, cfile in list(self.changeset_files.items()):
                if cfile == changeset_file:
                    changeset_id = cid
                    del self.changeset_files[cid]
                    break

            del self.changeset_mtimes[changeset_file]

            if changeset_id:
                # Extract project_path from changeset_file
                # Path format: <project>/.claude/changesets/<changeset_id>/changeset.json
                parts = changeset_file.split(os.sep)
                try:
                    changesets_idx = parts.index('changesets')
                    project_path = os.sep.join(parts[:changesets_idx - 1])
                except ValueError:
                    project_path = ''

                self._notify(ChangesetFileEvent(
                    changeset_id=changeset_id,
                    project_path=project_path,
                    changeset_file=changeset_file,
                    event_type='deleted'
                ))

    def _notify(self, event: ChangesetFileEvent) -> None:
        """Notify callback of a changeset event."""
        try:
            self.on_changeset_event(event)
        except Exception as e:
            print(f"Error in changeset watcher callback: {e}")
