"""Transcript watcher for real-time SSE updates of conversation messages."""

import json
import os
import sys
import threading
import time
from datetime import datetime
from typing import Callable, Optional

from .task_state_extractor import TaskStateExtractor


class TranscriptWatcher:
    """Watches transcript files for new content and broadcasts via SSE.

    Uses polling-based watching to detect new lines in JSONL transcript files.
    Tracks file positions to only read new content.
    """

    def __init__(
        self,
        transcript_reader,
        broadcast_callback: Callable[[dict, str], None],
        poll_interval: float = 0.5,
        debug: bool = False
    ):
        """Initialize the transcript watcher.

        Args:
            transcript_reader: TranscriptReader instance for parsing messages.
            broadcast_callback: Function to call when new messages are found.
                               Signature: callback(data: dict, event_type: str)
            poll_interval: Time between file checks in seconds (default 0.5).
            debug: Enable debug logging.
        """
        self.transcript_reader = transcript_reader
        self.broadcast_callback = broadcast_callback
        self.poll_interval = poll_interval
        self.debug = debug

        # Map of changeset_id -> watch info
        # watch info: {
        #   'project_path': str,
        #   'session_id': str,  # Claude Code's native session ID
        #   'main_path': str,
        #   'main_position': int,
        #   'subagent_paths': {agent_id: path},
        #   'subagent_positions': {agent_id: position}
        # }
        self._watches: dict[str, dict] = {}
        self._lock = threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._broadcast_count = 0

        # Task state extractors per changeset
        self._task_extractors: dict[str, TaskStateExtractor] = {}

    def _log(self, msg: str) -> None:
        """Log a debug message if debug mode is enabled."""
        if self.debug:
            print(f"[TranscriptWatcher] {msg}", file=sys.stderr, flush=True)

    def watch_changeset(
        self,
        changeset_id: str,
        project_path: str,
        session_id: str
    ) -> bool:
        """Start watching a changeset's transcript files.

        Args:
            changeset_id: The dashboard changeset ID.
            project_path: The project's filesystem path.
            session_id: The Claude Code session ID (UUID).

        Returns:
            True if watch was started, False if transcript not found.
        """
        self._log(f"watch_changeset called: changeset_id={changeset_id}, session_id={session_id}")

        transcripts_dir = self.transcript_reader.get_project_transcripts_dir(project_path)
        if not transcripts_dir:
            self._log(f"No transcripts dir found for project: {project_path}")
            return False

        main_path = os.path.join(transcripts_dir, f"{session_id}.jsonl")
        if not os.path.isfile(main_path):
            self._log(f"Transcript file not found: {main_path}")
            return False

        # Get current file positions (end of file)
        main_position = os.path.getsize(main_path)
        self._log(f"Watching transcript: {main_path} from position {main_position}")

        # Check for subagent transcripts
        subagent_paths = {}
        subagent_positions = {}
        subagents_dir = os.path.join(transcripts_dir, session_id, 'subagents')
        if os.path.isdir(subagents_dir):
            for filename in os.listdir(subagents_dir):
                if filename.startswith('agent-') and filename.endswith('.jsonl'):
                    agent_id = filename[6:-6]
                    agent_path = os.path.join(subagents_dir, filename)
                    subagent_paths[agent_id] = agent_path
                    subagent_positions[agent_id] = os.path.getsize(agent_path)
                    self._log(f"Found subagent transcript: {agent_id}")

        with self._lock:
            self._watches[changeset_id] = {
                'project_path': project_path,
                'session_id': session_id,
                'transcripts_dir': transcripts_dir,
                'main_path': main_path,
                'main_position': main_position,
                'subagent_paths': subagent_paths,
                'subagent_positions': subagent_positions
            }
            # Create a task extractor for this changeset
            self._task_extractors[changeset_id] = TaskStateExtractor()
            self._log(f"Now watching {len(self._watches)} changeset(s)")

        return True

    # Backwards compatibility alias
    def watch_session(
        self,
        session_id: str,
        project_path: str,
        claude_session_id: str
    ) -> bool:
        """Backwards compatible alias for watch_changeset.

        Args:
            session_id: The dashboard changeset ID (legacy name).
            project_path: The project's filesystem path.
            claude_session_id: The Claude Code session ID (UUID).

        Returns:
            True if watch was started, False if transcript not found.
        """
        return self.watch_changeset(session_id, project_path, claude_session_id)

    def unwatch_changeset(self, changeset_id: str) -> bool:
        """Stop watching a changeset's transcript.

        Args:
            changeset_id: The dashboard changeset ID.

        Returns:
            True if watch was removed, False if not found.
        """
        with self._lock:
            if changeset_id in self._watches:
                del self._watches[changeset_id]
                # Clean up task extractor
                if changeset_id in self._task_extractors:
                    del self._task_extractors[changeset_id]
                return True
            return False

    # Backwards compatibility alias
    def unwatch_session(self, session_id: str) -> bool:
        """Backwards compatible alias for unwatch_changeset."""
        return self.unwatch_changeset(session_id)

    def start(self):
        """Start the watcher thread."""
        if self._running:
            return

        self._running = True
        self._thread = threading.Thread(target=self._poll_loop, daemon=True)
        self._thread.start()

    def stop(self):
        """Stop the watcher thread."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None

    def _poll_loop(self):
        """Main polling loop that checks for file updates."""
        while self._running:
            try:
                self._check_for_updates()
            except Exception as e:
                print(f"Error in transcript watcher: {e}")

            time.sleep(self.poll_interval)

    def _check_for_updates(self):
        """Check all watched changesets for new content."""
        with self._lock:
            watches = dict(self._watches)

        for changeset_id, watch_info in watches.items():
            # Check main transcript
            main_path = watch_info['main_path']
            if os.path.isfile(main_path):
                current_size = os.path.getsize(main_path)
                if current_size > watch_info['main_position']:
                    self._log(f"File changed: {main_path} ({watch_info['main_position']} -> {current_size})")
                    new_lines = self._read_new_lines(
                        main_path,
                        watch_info['main_position']
                    )
                    self._log(f"Read {len(new_lines)} new lines")
                    for line in new_lines:
                        msg = self._parse_and_broadcast(
                            line, changeset_id, watch_info['session_id'], 'main'
                        )

                    # Update position
                    with self._lock:
                        if changeset_id in self._watches:
                            self._watches[changeset_id]['main_position'] = current_size

            # Check for new subagent transcripts
            subagents_dir = os.path.join(
                watch_info['transcripts_dir'],
                watch_info['session_id'],
                'subagents'
            )
            if os.path.isdir(subagents_dir):
                for filename in os.listdir(subagents_dir):
                    if filename.startswith('agent-') and filename.endswith('.jsonl'):
                        agent_id = filename[6:-6]
                        agent_path = os.path.join(subagents_dir, filename)

                        # Add new subagent if not tracked
                        if agent_id not in watch_info['subagent_paths']:
                            with self._lock:
                                if changeset_id in self._watches:
                                    self._watches[changeset_id]['subagent_paths'][agent_id] = agent_path
                                    self._watches[changeset_id]['subagent_positions'][agent_id] = 0
                            watch_info['subagent_paths'][agent_id] = agent_path
                            watch_info['subagent_positions'][agent_id] = 0

            # Check subagent transcripts
            for agent_id, agent_path in watch_info['subagent_paths'].items():
                if os.path.isfile(agent_path):
                    current_size = os.path.getsize(agent_path)
                    agent_position = watch_info['subagent_positions'].get(agent_id, 0)
                    if current_size > agent_position:
                        new_lines = self._read_new_lines(agent_path, agent_position)
                        for line in new_lines:
                            self._parse_and_broadcast(line, changeset_id, watch_info['session_id'], agent_id)

                        # Update position
                        with self._lock:
                            if changeset_id in self._watches:
                                self._watches[changeset_id]['subagent_positions'][agent_id] = current_size

    def _read_new_lines(self, filepath: str, start_pos: int) -> list[str]:
        """Read new lines from a file starting at a given position.

        Args:
            filepath: Path to the JSONL file.
            start_pos: Byte position to start reading from.

        Returns:
            List of new lines (stripped).
        """
        lines = []
        try:
            with open(filepath, 'r') as f:
                f.seek(start_pos)
                for line in f:
                    line = line.strip()
                    if line:
                        lines.append(line)
        except Exception as e:
            print(f"Error reading new lines from {filepath}: {e}")
        return lines

    def _parse_and_broadcast(
        self,
        line: str,
        changeset_id: str,
        session_id: str,
        source: str
    ) -> Optional[dict]:
        """Parse a JSONL line and broadcast if it's a message.

        Args:
            line: The JSONL line to parse.
            changeset_id: The dashboard changeset ID.
            session_id: Claude Code's native session ID.
            source: 'main' or the agent_id.

        Returns:
            The parsed message dict if broadcast, None otherwise.
        """
        try:
            entry = json.loads(line)
            msg_type = entry.get('type')

            # Only broadcast user/assistant messages
            if msg_type not in ('user', 'assistant'):
                self._log(f"Skipping message type: {msg_type}")
                return None

            # Parse the message using transcript reader's parser
            message = self.transcript_reader._parse_entry(entry)
            if not message:
                self._log("Failed to parse entry")
                return None

            # Convert to dict and broadcast
            msg_dict = self.transcript_reader.to_dict(message)

            self._broadcast_count += 1
            self._log(f"Broadcasting message #{self._broadcast_count}: role={msg_dict.get('role')} source={source}")

            self.broadcast_callback({
                'changeset_id': changeset_id,
                'session_id': session_id,  # Claude Code's native session ID
                'source': source,
                'message': msg_dict,
                'timestamp': msg_dict.get('timestamp', datetime.now().isoformat())
            }, 'transcript_message')

            # Process Task* tool calls for task state tracking
            task_extractor = self._task_extractors.get(changeset_id)
            if task_extractor:
                for tool_call in msg_dict.get('tool_calls', []):
                    task_event = task_extractor.process_tool_call(tool_call)
                    if task_event:
                        # Include BOTH changeset_id AND session_id in task events
                        task_event['changeset_id'] = changeset_id
                        task_event['session_id'] = session_id  # Claude's native ID for matching
                        self._log(f"Broadcasting task event: {task_event.get('event')}")
                        self.broadcast_callback(task_event, 'task_state_change')

            return msg_dict

        except json.JSONDecodeError as e:
            self._log(f"JSON decode error: {e}")
            return None
        except Exception as e:
            self._log(f"Error parsing transcript line: {e}")
            return None

    def get_watched_changesets(self) -> list[str]:
        """Get list of currently watched changeset IDs.

        Returns:
            List of changeset IDs being watched.
        """
        with self._lock:
            return list(self._watches.keys())

    # Backwards compatibility alias
    def get_watched_sessions(self) -> list[str]:
        """Backwards compatible alias for get_watched_changesets."""
        return self.get_watched_changesets()

    def watch_for_pid(self, pid: int) -> bool:
        """Start watching transcripts for a registered process.

        Looks up the process in the registry to get session_id and project_path,
        then starts watching that transcript. Uses a watch key of 'terminal-{pid}'
        to allow filtering SSE events by terminal.

        Args:
            pid: Process ID to watch.

        Returns:
            True if watch started successfully, False otherwise.
        """
        from .process_registry import ProcessRegistryManager

        process = ProcessRegistryManager.get_registry().get(pid)
        if not process:
            self._log(f"watch_for_pid: Process {pid} not found in registry")
            return False

        if not process.session_id:
            self._log(f"watch_for_pid: Process {pid} has no session_id")
            return False

        if not process.project_path:
            self._log(f"watch_for_pid: Process {pid} has no project_path")
            return False

        watch_key = f"terminal-{pid}"
        self._log(f"watch_for_pid: Starting watch for PID {pid} -> {watch_key}")

        return self.watch_changeset(watch_key, process.project_path, process.session_id)

    def unwatch_for_pid(self, pid: int) -> bool:
        """Stop watching transcripts for a PID.

        Args:
            pid: Process ID to stop watching.

        Returns:
            True if watch was removed, False if not found.
        """
        watch_key = f"terminal-{pid}"
        self._log(f"unwatch_for_pid: Stopping watch for PID {pid}")
        return self.unwatch_changeset(watch_key)

    def is_watching_pid(self, pid: int) -> bool:
        """Check if we're currently watching a PID.

        Args:
            pid: Process ID to check.

        Returns:
            True if currently watching this PID.
        """
        watch_key = f"terminal-{pid}"
        with self._lock:
            return watch_key in self._watches
