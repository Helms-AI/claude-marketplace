"""Command Queue Service for Passthrough Mode.

Manages a file-based command queue that allows dashboard input to be processed
by the parent Claude Code session, enabling unified conversation context and
reduced API costs.

The queue uses JSONL format for atomic append operations and fcntl for file locking.
"""

import fcntl
import json
import os
import tempfile
import time
import uuid
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Optional


@dataclass
class Command:
    """Represents a command in the queue."""
    id: str
    prompt: str
    status: str  # pending, processing, completed, cancelled, error
    submitted_at: str
    metadata: dict = None
    result: str = None
    completed_at: str = None
    error: str = None

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {k: v for k, v in asdict(self).items() if v is not None}


class CommandService:
    """Manages the command queue for passthrough mode.

    Commands are written to a JSONL file that hooks in the parent Claude Code
    session can read. Responses are matched back to commands via the transcript
    watcher.
    """

    # Queue file location relative to project root
    QUEUE_DIR = '.claude/dashboard'
    QUEUE_FILE = 'input-queue.jsonl'
    STATE_FILE = 'state.json'

    # Status constants
    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_ERROR = 'error'

    def __init__(self, project_path: str, debug: bool = False):
        """Initialize the command service.

        Args:
            project_path: Path to the project directory.
            debug: Enable debug logging.
        """
        self.project_path = Path(project_path)
        self.debug = debug
        self._ensure_queue_dir()

    def _log(self, msg: str) -> None:
        """Log a debug message if debug mode is enabled."""
        if self.debug:
            print(f"[CommandService] {msg}", flush=True)

    def _ensure_queue_dir(self) -> None:
        """Ensure the queue directory exists."""
        queue_dir = self.project_path / self.QUEUE_DIR
        queue_dir.mkdir(parents=True, exist_ok=True)
        self._log(f"Queue directory: {queue_dir}")

    @property
    def queue_path(self) -> Path:
        """Get the full path to the queue file."""
        return self.project_path / self.QUEUE_DIR / self.QUEUE_FILE

    @property
    def state_path(self) -> Path:
        """Get the full path to the state file."""
        return self.project_path / self.QUEUE_DIR / self.STATE_FILE

    def _read_queue(self) -> list[Command]:
        """Read all commands from the queue file.

        Returns:
            List of Command objects.
        """
        commands = []
        queue_path = self.queue_path

        if not queue_path.exists():
            return commands

        try:
            with open(queue_path, 'r') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                try:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                data = json.loads(line)
                                commands.append(Command(**data))
                            except (json.JSONDecodeError, TypeError) as e:
                                self._log(f"Error parsing line: {e}")
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            self._log(f"Error reading queue: {e}")

        return commands

    def _write_queue(self, commands: list[Command]) -> bool:
        """Write all commands to the queue file atomically.

        Uses temp file + rename for atomic writes.

        Args:
            commands: List of Command objects.

        Returns:
            True if successful, False otherwise.
        """
        queue_path = self.queue_path

        try:
            # Write to temp file first
            fd, temp_path = tempfile.mkstemp(
                dir=queue_path.parent,
                prefix='.queue_',
                suffix='.tmp'
            )
            try:
                with os.fdopen(fd, 'w') as f:
                    for cmd in commands:
                        f.write(json.dumps(cmd.to_dict()) + '\n')

                # Atomic rename
                os.rename(temp_path, queue_path)
                return True
            except Exception as e:
                self._log(f"Error writing temp file: {e}")
                os.unlink(temp_path)
                return False
        except Exception as e:
            self._log(f"Error creating temp file: {e}")
            return False

    def _append_command(self, command: Command) -> bool:
        """Append a single command to the queue file.

        Uses file locking for safe concurrent access.

        Args:
            command: Command to append.

        Returns:
            True if successful, False otherwise.
        """
        queue_path = self.queue_path

        try:
            with open(queue_path, 'a') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    f.write(json.dumps(command.to_dict()) + '\n')
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
            return True
        except Exception as e:
            self._log(f"Error appending command: {e}")
            return False

    def submit_command(self, prompt: str, metadata: dict = None) -> dict:
        """Submit a new command to the queue.

        Args:
            prompt: The command prompt text.
            metadata: Optional metadata (source, context_id, etc).

        Returns:
            Dict with command details including the generated ID.
        """
        command_id = f"cmd_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow().isoformat() + 'Z'

        command = Command(
            id=command_id,
            prompt=prompt,
            status=self.STATUS_PENDING,
            submitted_at=now,
            metadata=metadata or {'source': 'dashboard'}
        )

        if self._append_command(command):
            self._log(f"Submitted command: {command_id}")
            return command.to_dict()
        else:
            raise RuntimeError("Failed to submit command to queue")

    def get_command(self, command_id: str) -> Optional[dict]:
        """Get a specific command by ID.

        Args:
            command_id: The command ID to look up.

        Returns:
            Command dict if found, None otherwise.
        """
        commands = self._read_queue()
        for cmd in commands:
            if cmd.id == command_id:
                return cmd.to_dict()
        return None

    def list_commands(
        self,
        status: str = None,
        limit: int = 50
    ) -> list[dict]:
        """List commands with optional status filter.

        Args:
            status: Optional status filter.
            limit: Maximum number of commands to return.

        Returns:
            List of command dicts.
        """
        commands = self._read_queue()

        if status:
            commands = [c for c in commands if c.status == status]

        # Sort by submitted_at (oldest first for FIFO processing)
        commands.sort(key=lambda c: c.submitted_at)

        return [c.to_dict() for c in commands[:limit]]

    def update_command_status(
        self,
        command_id: str,
        status: str,
        result: str = None,
        error: str = None
    ) -> bool:
        """Update the status of a command.

        Args:
            command_id: The command ID to update.
            status: New status.
            result: Optional result text (for completed status).
            error: Optional error message (for error status).

        Returns:
            True if command was found and updated, False otherwise.
        """
        commands = self._read_queue()
        updated = False

        for cmd in commands:
            if cmd.id == command_id:
                cmd.status = status
                if result is not None:
                    cmd.result = result
                if error is not None:
                    cmd.error = error
                if status in (self.STATUS_COMPLETED, self.STATUS_ERROR, self.STATUS_CANCELLED):
                    cmd.completed_at = datetime.utcnow().isoformat() + 'Z'
                updated = True
                self._log(f"Updated command {command_id} to status: {status}")
                break

        if updated:
            return self._write_queue(commands)
        return False

    def cancel_command(self, command_id: str) -> bool:
        """Cancel a pending command.

        Args:
            command_id: The command ID to cancel.

        Returns:
            True if command was cancelled, False if not found or not pending.
        """
        commands = self._read_queue()

        for cmd in commands:
            if cmd.id == command_id:
                if cmd.status == self.STATUS_PENDING:
                    cmd.status = self.STATUS_CANCELLED
                    cmd.completed_at = datetime.utcnow().isoformat() + 'Z'
                    if self._write_queue(commands):
                        self._log(f"Cancelled command: {command_id}")
                        return True
                else:
                    self._log(f"Cannot cancel command {command_id}: status is {cmd.status}")
                    return False

        self._log(f"Command not found: {command_id}")
        return False

    def get_pending_command(self) -> Optional[dict]:
        """Get the oldest pending command (FIFO).

        Returns:
            Command dict if found, None if no pending commands.
        """
        pending = self.list_commands(status=self.STATUS_PENDING, limit=1)
        return pending[0] if pending else None

    def mark_processing(self, command_id: str) -> bool:
        """Mark a command as processing.

        Args:
            command_id: The command ID to mark.

        Returns:
            True if successful, False otherwise.
        """
        return self.update_command_status(command_id, self.STATUS_PROCESSING)

    def is_parent_active(self) -> bool:
        """Check if the parent Claude Code session is active.

        Looks for a heartbeat in the state file. Session is considered active
        if the last heartbeat was within 30 seconds.

        Returns:
            True if parent session appears active, False otherwise.
        """
        state_path = self.state_path

        if not state_path.exists():
            return False

        try:
            with open(state_path, 'r') as f:
                state = json.load(f)

            last_heartbeat = state.get('last_heartbeat')
            if not last_heartbeat:
                return False

            # Parse ISO format timestamp
            heartbeat_time = datetime.fromisoformat(
                last_heartbeat.replace('Z', '+00:00')
            )
            now = datetime.now(heartbeat_time.tzinfo)
            age_seconds = (now - heartbeat_time).total_seconds()

            return age_seconds < 30

        except Exception as e:
            self._log(f"Error checking parent status: {e}")
            return False

    def update_heartbeat(self) -> bool:
        """Update the heartbeat timestamp in the state file.

        Called by the parent session hook to indicate it's active.

        Returns:
            True if successful, False otherwise.
        """
        state_path = self.state_path
        now = datetime.utcnow().isoformat() + 'Z'

        try:
            state = {}
            if state_path.exists():
                try:
                    with open(state_path, 'r') as f:
                        state = json.load(f)
                except json.JSONDecodeError:
                    pass

            state['last_heartbeat'] = now

            # Atomic write via temp file
            fd, temp_path = tempfile.mkstemp(
                dir=state_path.parent,
                prefix='.state_',
                suffix='.tmp'
            )
            try:
                with os.fdopen(fd, 'w') as f:
                    json.dump(state, f)
                os.rename(temp_path, state_path)
                return True
            except Exception as e:
                self._log(f"Error writing state file: {e}")
                os.unlink(temp_path)
                return False

        except Exception as e:
            self._log(f"Error updating heartbeat: {e}")
            return False

    def cleanup_old_commands(self, max_age_hours: int = 24) -> int:
        """Remove old completed/cancelled commands from the queue.

        Args:
            max_age_hours: Maximum age in hours for completed commands.

        Returns:
            Number of commands removed.
        """
        commands = self._read_queue()
        cutoff = datetime.utcnow().timestamp() - (max_age_hours * 3600)

        original_count = len(commands)
        filtered = []

        for cmd in commands:
            # Keep pending and processing commands
            if cmd.status in (self.STATUS_PENDING, self.STATUS_PROCESSING):
                filtered.append(cmd)
                continue

            # Check age for completed/cancelled/error commands
            if cmd.completed_at:
                try:
                    completed_time = datetime.fromisoformat(
                        cmd.completed_at.replace('Z', '+00:00')
                    ).timestamp()
                    if completed_time > cutoff:
                        filtered.append(cmd)
                except Exception:
                    filtered.append(cmd)  # Keep if can't parse date
            else:
                filtered.append(cmd)  # Keep if no completed_at

        if len(filtered) < original_count:
            self._write_queue(filtered)

        removed = original_count - len(filtered)
        if removed > 0:
            self._log(f"Cleaned up {removed} old commands")

        return removed
