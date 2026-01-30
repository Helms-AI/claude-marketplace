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

        # Map of session_id -> watch info
        # watch info: {
        #   'project_path': str,
        #   'claude_session_id': str,
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

        # Task state extractors per session
        self._task_extractors: dict[str, TaskStateExtractor] = {}

    def _log(self, msg: str) -> None:
        """Log a debug message if debug mode is enabled."""
        if self.debug:
            print(f"[TranscriptWatcher] {msg}", file=sys.stderr, flush=True)

    def watch_session(
        self,
        session_id: str,
        project_path: str,
        claude_session_id: str
    ) -> bool:
        """Start watching a session's transcript files.

        Args:
            session_id: The dashboard session ID.
            project_path: The project's filesystem path.
            claude_session_id: The Claude Code session ID (UUID).

        Returns:
            True if watch was started, False if transcript not found.
        """
        self._log(f"watch_session called: session_id={session_id}, claude_session_id={claude_session_id}")

        transcripts_dir = self.transcript_reader.get_project_transcripts_dir(project_path)
        if not transcripts_dir:
            self._log(f"No transcripts dir found for project: {project_path}")
            return False

        main_path = os.path.join(transcripts_dir, f"{claude_session_id}.jsonl")
        if not os.path.isfile(main_path):
            self._log(f"Transcript file not found: {main_path}")
            return False

        # Get current file positions (end of file)
        main_position = os.path.getsize(main_path)
        self._log(f"Watching transcript: {main_path} from position {main_position}")

        # Check for subagent transcripts
        subagent_paths = {}
        subagent_positions = {}
        subagents_dir = os.path.join(transcripts_dir, claude_session_id, 'subagents')
        if os.path.isdir(subagents_dir):
            for filename in os.listdir(subagents_dir):
                if filename.startswith('agent-') and filename.endswith('.jsonl'):
                    agent_id = filename[6:-6]
                    agent_path = os.path.join(subagents_dir, filename)
                    subagent_paths[agent_id] = agent_path
                    subagent_positions[agent_id] = os.path.getsize(agent_path)
                    self._log(f"Found subagent transcript: {agent_id}")

        with self._lock:
            self._watches[session_id] = {
                'project_path': project_path,
                'claude_session_id': claude_session_id,
                'transcripts_dir': transcripts_dir,
                'main_path': main_path,
                'main_position': main_position,
                'subagent_paths': subagent_paths,
                'subagent_positions': subagent_positions
            }
            # Create a task extractor for this session
            self._task_extractors[session_id] = TaskStateExtractor()
            self._log(f"Now watching {len(self._watches)} session(s)")

        return True

    def unwatch_session(self, session_id: str) -> bool:
        """Stop watching a session's transcript.

        Args:
            session_id: The dashboard session ID.

        Returns:
            True if watch was removed, False if not found.
        """
        with self._lock:
            if session_id in self._watches:
                del self._watches[session_id]
                # Clean up task extractor
                if session_id in self._task_extractors:
                    del self._task_extractors[session_id]
                return True
            return False

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
        """Check all watched sessions for new content."""
        with self._lock:
            watches = dict(self._watches)

        for session_id, watch_info in watches.items():
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
                            line, session_id, 'main'
                        )

                    # Update position
                    with self._lock:
                        if session_id in self._watches:
                            self._watches[session_id]['main_position'] = current_size

            # Check for new subagent transcripts
            subagents_dir = os.path.join(
                watch_info['transcripts_dir'],
                watch_info['claude_session_id'],
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
                                if session_id in self._watches:
                                    self._watches[session_id]['subagent_paths'][agent_id] = agent_path
                                    self._watches[session_id]['subagent_positions'][agent_id] = 0
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
                            self._parse_and_broadcast(line, session_id, agent_id)

                        # Update position
                        with self._lock:
                            if session_id in self._watches:
                                self._watches[session_id]['subagent_positions'][agent_id] = current_size

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
        session_id: str,
        source: str
    ) -> Optional[dict]:
        """Parse a JSONL line and broadcast if it's a message.

        Args:
            line: The JSONL line to parse.
            session_id: The dashboard session ID.
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
                'session_id': session_id,
                'source': source,
                'message': msg_dict,
                'timestamp': msg_dict.get('timestamp', datetime.now().isoformat())
            }, 'transcript_message')

            # Process Task* tool calls for task state tracking
            task_extractor = self._task_extractors.get(session_id)
            if task_extractor:
                for tool_call in msg_dict.get('tool_calls', []):
                    task_event = task_extractor.process_tool_call(tool_call)
                    if task_event:
                        task_event['session_id'] = session_id
                        self._log(f"Broadcasting task event: {task_event.get('event')}")
                        self.broadcast_callback(task_event, 'task_state_change')

            return msg_dict

        except json.JSONDecodeError as e:
            self._log(f"JSON decode error: {e}")
            return None
        except Exception as e:
            self._log(f"Error parsing transcript line: {e}")
            return None

    def get_watched_sessions(self) -> list[str]:
        """Get list of currently watched session IDs.

        Returns:
            List of session IDs being watched.
        """
        with self._lock:
            return list(self._watches.keys())
