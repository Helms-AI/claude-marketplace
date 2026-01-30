"""File watcher for monitoring handoffs directory changes."""

import os
import time
from threading import Thread, Event
from typing import Callable, Optional


class FileWatcher:
    """Watches a directory for file changes."""

    def __init__(
        self,
        watch_dir: str,
        callback: Callable[[str, str], None],
        poll_interval: float = 1.0
    ):
        """Initialize the file watcher.

        Args:
            watch_dir: Directory to watch.
            callback: Callback function(filepath, event_type) where event_type is 'created', 'modified', or 'deleted'.
            poll_interval: Polling interval in seconds.
        """
        self.watch_dir = watch_dir
        self.callback = callback
        self.poll_interval = poll_interval
        self.stop_event = Event()
        self.thread: Optional[Thread] = None
        self.file_mtimes: dict[str, float] = {}

    def start(self) -> None:
        """Start watching the directory."""
        if self.thread and self.thread.is_alive():
            return

        self.stop_event.clear()
        self.thread = Thread(target=self._watch_loop, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        """Stop watching the directory."""
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=2.0)

    def _watch_loop(self) -> None:
        """Main watch loop."""
        # Initialize file state
        self._scan_directory()

        while not self.stop_event.is_set():
            try:
                self._check_changes()
            except Exception as e:
                print(f"Error in file watcher: {e}")

            self.stop_event.wait(self.poll_interval)

    def _scan_directory(self) -> None:
        """Scan directory and record file modification times."""
        if not os.path.isdir(self.watch_dir):
            return

        for filename in os.listdir(self.watch_dir):
            filepath = os.path.join(self.watch_dir, filename)
            if os.path.isfile(filepath):
                try:
                    self.file_mtimes[filepath] = os.path.getmtime(filepath)
                except OSError:
                    pass

    def _check_changes(self) -> None:
        """Check for file changes."""
        if not os.path.isdir(self.watch_dir):
            return

        current_files = set()

        for filename in os.listdir(self.watch_dir):
            filepath = os.path.join(self.watch_dir, filename)
            if not os.path.isfile(filepath):
                continue

            current_files.add(filepath)

            try:
                mtime = os.path.getmtime(filepath)
            except OSError:
                continue

            if filepath not in self.file_mtimes:
                # New file
                self.file_mtimes[filepath] = mtime
                self._notify('created', filepath)

            elif mtime > self.file_mtimes[filepath]:
                # Modified file
                self.file_mtimes[filepath] = mtime
                self._notify('modified', filepath)

        # Check for deleted files
        deleted = set(self.file_mtimes.keys()) - current_files
        for filepath in deleted:
            del self.file_mtimes[filepath]
            self._notify('deleted', filepath)

    def _notify(self, event_type: str, filepath: str) -> None:
        """Notify callback of a file change.

        Args:
            event_type: Type of change ('created', 'modified', 'deleted').
            filepath: Path to the changed file.
        """
        try:
            self.callback(filepath, event_type)
        except Exception as e:
            print(f"Error in file watcher callback: {e}")
