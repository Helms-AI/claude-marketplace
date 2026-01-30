"""Transcript reader for parsing Claude Code conversation logs."""

import json
import os
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class TranscriptMessage:
    """A single message from a Claude transcript."""
    id: str
    timestamp: datetime
    role: str  # 'user' | 'assistant'
    session_id: str
    agent_id: Optional[str] = None  # For subagent messages
    content: list = field(default_factory=list)  # List of content blocks
    text: str = ""  # Extracted text content
    tool_calls: list = field(default_factory=list)  # Tool use blocks


class TranscriptReader:
    """Reads and parses Claude Code transcript files."""

    def __init__(self, claude_home: str = "~/.claude"):
        """Initialize the transcript reader.

        Args:
            claude_home: Path to Claude home directory (default ~/.claude).
        """
        self.claude_home = os.path.expanduser(claude_home)
        self.projects_dir = os.path.join(self.claude_home, "projects")

    def escape_project_path(self, project_path: str) -> str:
        """Convert a project path to Claude's escaped directory name.

        Args:
            project_path: The actual project path (e.g., /Users/foo/project).

        Returns:
            Escaped path used by Claude (e.g., -Users-foo-project).
        """
        # Remove leading slash and replace all / with -
        if project_path.startswith('/'):
            project_path = project_path[1:]
        return '-' + project_path.replace('/', '-')

    def get_project_transcripts_dir(self, project_path: str) -> Optional[str]:
        """Get the Claude transcripts directory for a project.

        Args:
            project_path: The project's filesystem path.

        Returns:
            Path to the transcripts directory, or None if not found.
        """
        escaped = self.escape_project_path(project_path)
        transcripts_dir = os.path.join(self.projects_dir, escaped)

        if os.path.isdir(transcripts_dir):
            return transcripts_dir
        return None

    def list_transcripts(self, project_path: str) -> list[dict]:
        """List all transcript files for a project.

        Args:
            project_path: The project's filesystem path.

        Returns:
            List of dicts with transcript metadata (session_id, filepath, modified).
        """
        transcripts_dir = self.get_project_transcripts_dir(project_path)
        if not transcripts_dir:
            return []

        transcripts = []
        try:
            for entry in os.listdir(transcripts_dir):
                filepath = os.path.join(transcripts_dir, entry)

                # Main transcript files are <session-id>.jsonl
                if entry.endswith('.jsonl') and os.path.isfile(filepath):
                    session_id = entry[:-6]  # Remove .jsonl extension
                    stat = os.stat(filepath)
                    transcripts.append({
                        'session_id': session_id,
                        'filepath': filepath,
                        'modified': datetime.fromtimestamp(stat.st_mtime),
                        'size': stat.st_size,
                        'is_subagent': False
                    })

                # Session directories may contain subagent transcripts
                elif os.path.isdir(filepath):
                    subagents_dir = os.path.join(filepath, 'subagents')
                    if os.path.isdir(subagents_dir):
                        for subagent_file in os.listdir(subagents_dir):
                            if subagent_file.endswith('.jsonl'):
                                subagent_path = os.path.join(subagents_dir, subagent_file)
                                agent_id = subagent_file[6:-6]  # Remove 'agent-' prefix and '.jsonl'
                                stat = os.stat(subagent_path)
                                transcripts.append({
                                    'session_id': entry,
                                    'agent_id': agent_id,
                                    'filepath': subagent_path,
                                    'modified': datetime.fromtimestamp(stat.st_mtime),
                                    'size': stat.st_size,
                                    'is_subagent': True
                                })

        except Exception as e:
            print(f"Error listing transcripts for {project_path}: {e}")

        return transcripts

    def find_transcript_by_session(self, claude_session_id: str, project_path: str) -> Optional[str]:
        """Find a transcript file by Claude session ID.

        Args:
            claude_session_id: The Claude Code session ID (UUID).
            project_path: The project's filesystem path.

        Returns:
            Path to the transcript file, or None if not found.
        """
        transcripts_dir = self.get_project_transcripts_dir(project_path)
        if not transcripts_dir:
            return None

        # Direct lookup: <session-id>.jsonl
        direct_path = os.path.join(transcripts_dir, f"{claude_session_id}.jsonl")
        if os.path.isfile(direct_path):
            return direct_path

        return None

    def find_transcript_by_timestamp(
        self,
        project_path: str,
        target_time: datetime,
        tolerance_seconds: int = 300
    ) -> Optional[str]:
        """Find a transcript by creation time.

        Args:
            project_path: The project's filesystem path.
            target_time: The timestamp to search for.
            tolerance_seconds: Time window in seconds (default 5 minutes).

        Returns:
            Path to the closest matching transcript, or None.
        """
        transcripts = self.list_transcripts(project_path)
        if not transcripts:
            return None

        # Filter to main transcripts only (not subagents)
        main_transcripts = [t for t in transcripts if not t.get('is_subagent')]
        if not main_transcripts:
            return None

        # Find closest by modification time
        best_match = None
        best_diff = float('inf')

        for t in main_transcripts:
            diff = abs((t['modified'] - target_time).total_seconds())
            if diff < best_diff and diff <= tolerance_seconds:
                best_diff = diff
                best_match = t['filepath']

        return best_match

    def read_transcript(
        self,
        filepath: str,
        include_progress: bool = False,
        include_tool_results: bool = True
    ) -> list[TranscriptMessage]:
        """Read and parse a transcript file.

        Args:
            filepath: Path to the .jsonl file.
            include_progress: Whether to include progress messages (default False).
            include_tool_results: Whether to include tool_result content (default True).

        Returns:
            List of TranscriptMessage objects.
        """
        messages = []

        try:
            with open(filepath, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        entry = json.loads(line)
                        msg_type = entry.get('type')

                        # Filter by message type
                        if msg_type == 'progress' and not include_progress:
                            continue
                        if msg_type not in ('user', 'assistant'):
                            continue

                        message = self._parse_entry(entry, include_tool_results)
                        if message:
                            messages.append(message)

                    except json.JSONDecodeError:
                        continue

        except Exception as e:
            print(f"Error reading transcript {filepath}: {e}")

        return messages

    def _parse_entry(self, entry: dict, include_tool_results: bool = True) -> Optional[TranscriptMessage]:
        """Parse a single JSONL entry into a TranscriptMessage.

        Args:
            entry: The parsed JSON entry.
            include_tool_results: Whether to include tool_result content.

        Returns:
            TranscriptMessage or None if entry should be skipped.
        """
        msg_type = entry.get('type')
        if msg_type not in ('user', 'assistant'):
            return None

        # Extract timestamp
        timestamp_str = entry.get('timestamp')
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            timestamp = datetime.now()

        # Extract content
        message_data = entry.get('message', {})
        raw_content = message_data.get('content', [])

        # Handle string content (simple user messages)
        if isinstance(raw_content, str):
            return TranscriptMessage(
                id=entry.get('uuid', ''),
                timestamp=timestamp,
                role=msg_type,
                session_id=entry.get('sessionId', ''),
                agent_id=entry.get('agentId'),
                content=[{'type': 'text', 'text': raw_content}],
                text=raw_content,
                tool_calls=[]
            )

        # Parse content blocks
        text_parts = []
        tool_calls = []
        filtered_content = []

        for block in raw_content:
            if not isinstance(block, dict):
                continue

            block_type = block.get('type')

            if block_type == 'text':
                text = block.get('text', '')
                if text:
                    text_parts.append(text)
                    filtered_content.append(block)

            elif block_type == 'tool_use':
                tool_calls.append({
                    'id': block.get('id', ''),
                    'name': block.get('name', ''),
                    'input': block.get('input', {})
                })
                filtered_content.append(block)

            elif block_type == 'tool_result':
                if include_tool_results:
                    # Include but truncate large results
                    result_content = block.get('content', '')
                    if isinstance(result_content, str) and len(result_content) > 2000:
                        block = dict(block)
                        block['content'] = result_content[:2000] + '... [truncated]'
                    filtered_content.append(block)

        # Skip messages with no meaningful content
        if not text_parts and not tool_calls:
            return None

        return TranscriptMessage(
            id=entry.get('uuid', ''),
            timestamp=timestamp,
            role=msg_type,
            session_id=entry.get('sessionId', ''),
            agent_id=entry.get('agentId'),
            content=filtered_content,
            text='\n'.join(text_parts),
            tool_calls=tool_calls
        )

    def read_full_conversation(
        self,
        claude_session_id: str,
        project_path: str,
        include_subagents: bool = True
    ) -> dict:
        """Read a complete conversation including subagent transcripts.

        Args:
            claude_session_id: The Claude Code session ID.
            project_path: The project's filesystem path.
            include_subagents: Whether to include subagent conversations.

        Returns:
            Dict with 'main' messages and 'subagents' dict of agent_id -> messages.
        """
        result = {
            'session_id': claude_session_id,
            'main': [],
            'subagents': {}
        }

        transcripts_dir = self.get_project_transcripts_dir(project_path)
        if not transcripts_dir:
            return result

        # Read main transcript
        main_path = os.path.join(transcripts_dir, f"{claude_session_id}.jsonl")
        if os.path.isfile(main_path):
            result['main'] = self.read_transcript(main_path)

        # Read subagent transcripts
        if include_subagents:
            subagents_dir = os.path.join(transcripts_dir, claude_session_id, 'subagents')
            if os.path.isdir(subagents_dir):
                try:
                    for filename in os.listdir(subagents_dir):
                        if filename.startswith('agent-') and filename.endswith('.jsonl'):
                            agent_id = filename[6:-6]
                            agent_path = os.path.join(subagents_dir, filename)
                            result['subagents'][agent_id] = self.read_transcript(agent_path)
                except Exception as e:
                    print(f"Error reading subagents for {claude_session_id}: {e}")

        return result

    def merge_chronologically(
        self,
        main_messages: list[TranscriptMessage],
        subagent_messages: dict[str, list[TranscriptMessage]]
    ) -> list[dict]:
        """Merge parent and subagent messages into a single chronological timeline.

        Args:
            main_messages: List of messages from the main conversation.
            subagent_messages: Dict mapping agent_id to list of agent messages.

        Returns:
            List of timeline entries sorted by timestamp, each containing:
            - message: The TranscriptMessage data
            - source: 'main' or the agent_id
            - timestamp: ISO timestamp string
        """
        timeline = []

        # Add main messages
        for msg in main_messages:
            timeline.append({
                'message': self.to_dict(msg),
                'source': 'main',
                'timestamp': msg.timestamp.isoformat()
            })

        # Add subagent messages
        for agent_id, messages in subagent_messages.items():
            for msg in messages:
                timeline.append({
                    'message': self.to_dict(msg),
                    'source': agent_id,
                    'timestamp': msg.timestamp.isoformat()
                })

        # Sort by timestamp
        timeline.sort(key=lambda x: x['timestamp'])
        return timeline

    def to_dict(self, message: TranscriptMessage) -> dict:
        """Convert a TranscriptMessage to a dictionary for JSON serialization.

        Args:
            message: The TranscriptMessage object.

        Returns:
            Dictionary representation.
        """
        return {
            'id': message.id,
            'timestamp': message.timestamp.isoformat(),
            'role': message.role,
            'session_id': message.session_id,
            'agent_id': message.agent_id,
            'text': message.text,
            'tool_calls': message.tool_calls,
            'content': message.content
        }

    def extract_agent_types(
        self,
        main_messages: list[TranscriptMessage],
        subagent_ids: list[str] = None
    ) -> dict[str, dict]:
        """Extract agent_id -> agent_type mapping from Task tool calls.

        When the main conversation invokes a subagent via the Task tool, the tool_use
        block contains a subagent_type field. By matching Task tool calls with
        subagent IDs (from transcript directories), we can map agent_id to proper
        names and domains.

        Args:
            main_messages: List of messages from the main conversation.
            subagent_ids: List of agent IDs from subagent transcripts (optional).
                          If provided, matches Task calls to agents by order.

        Returns:
            Dict mapping agent_id to metadata:
            {
                'a9af56c': {
                    'type': 'Explore',
                    'name': 'Explore',
                    'domain': None,  # or 'frontend' if type is 'frontend:frontend-lead'
                    'description': 'Search for files'
                }
            }
        """
        agent_types = {}

        # Collect all Task tool calls in order
        task_calls = []
        for msg in main_messages:
            if msg.role == 'assistant':
                for tool_call in msg.tool_calls:
                    if tool_call.get('name') == 'Task':
                        input_data = tool_call.get('input', {})
                        subagent_type = input_data.get('subagent_type', '')
                        description = input_data.get('description', '')

                        # Parse domain from type like "frontend:frontend-lead"
                        domain = None
                        agent_name = subagent_type
                        if ':' in subagent_type:
                            parts = subagent_type.split(':', 1)
                            domain = parts[0]
                            agent_name = parts[1] if len(parts) > 1 else subagent_type

                        task_calls.append({
                            'tool_id': tool_call.get('id', ''),
                            'type': subagent_type,
                            'name': agent_name,
                            'domain': domain,
                            'description': description
                        })

        # If we have subagent IDs, match them with Task calls by order
        if subagent_ids and task_calls:
            # Match Task calls to subagent IDs by order of appearance
            for i, agent_id in enumerate(subagent_ids):
                if i < len(task_calls):
                    task_info = task_calls[i]
                    agent_types[agent_id] = {
                        'type': task_info['type'],
                        'name': task_info['name'],
                        'domain': task_info['domain'],
                        'description': task_info['description']
                    }

        return agent_types

    def get_recent_transcripts(self, project_path: str, limit: int = 10) -> list[str]:
        """Get the most recently modified transcript files.

        Args:
            project_path: The project's filesystem path.
            limit: Maximum number of transcripts to return.

        Returns:
            List of file paths to the most recent transcripts.
        """
        transcripts = self.list_transcripts(project_path)
        # Filter to main transcripts only
        main_transcripts = [t for t in transcripts if not t.get('is_subagent')]
        # Sort by modification time (newest first)
        main_transcripts.sort(key=lambda t: t['modified'], reverse=True)
        return [t['filepath'] for t in main_transcripts[:limit]]
