"""Task state extractor for parsing TaskCreate/TaskUpdate tool calls from transcripts."""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List


@dataclass
class Task:
    """Represents a task from Claude Code's task system."""
    id: str
    subject: str
    description: str = ""
    status: str = "pending"  # pending, in_progress, completed
    activeForm: str = ""
    blocks: List[str] = field(default_factory=list)
    blockedBy: List[str] = field(default_factory=list)
    owner: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        """Convert task to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'subject': self.subject,
            'description': self.description,
            'status': self.status,
            'activeForm': self.activeForm,
            'blocks': self.blocks,
            'blockedBy': self.blockedBy,
            'owner': self.owner,
            'metadata': self.metadata
        }


class TaskStateExtractor:
    """Extracts and tracks task state from TaskCreate/TaskUpdate/TaskList tool calls.

    Processes tool_use blocks from transcript messages and maintains current task state.
    Emits events when tasks are created, updated, or deleted.
    """

    def __init__(self):
        """Initialize the task state extractor."""
        self._tasks: Dict[str, Task] = {}
        self._next_id = 1  # Track auto-generated IDs

    def process_tool_call(self, tool_call: dict) -> Optional[dict]:
        """Process a tool call and return a task event if applicable.

        Args:
            tool_call: Tool call dict with 'name' and 'input' keys.

        Returns:
            Task event dict or None if not a task-related tool call.
            Event format: {
                'event': 'task_created' | 'task_updated' | 'task_deleted',
                'task': Task dict
            }
        """
        tool_name = tool_call.get('name', '')
        input_data = tool_call.get('input', {})

        if tool_name == 'TaskCreate':
            return self._handle_create(input_data)
        elif tool_name == 'TaskUpdate':
            return self._handle_update(input_data)
        elif tool_name == 'TaskList':
            # TaskList is a read operation, no event needed
            return None
        elif tool_name == 'TaskGet':
            # TaskGet is a read operation, no event needed
            return None

        return None

    def _handle_create(self, input_data: dict) -> dict:
        """Handle TaskCreate tool call.

        Args:
            input_data: Tool input containing subject, description, activeForm.

        Returns:
            Task created event dict.
        """
        task_id = str(self._next_id)
        self._next_id += 1

        task = Task(
            id=task_id,
            subject=input_data.get('subject', ''),
            description=input_data.get('description', ''),
            status='pending',
            activeForm=input_data.get('activeForm', ''),
            metadata=input_data.get('metadata', {})
        )

        self._tasks[task_id] = task

        return {
            'event': 'task_created',
            'task': task.to_dict()
        }

    def _handle_update(self, input_data: dict) -> Optional[dict]:
        """Handle TaskUpdate tool call.

        Args:
            input_data: Tool input containing taskId and update fields.

        Returns:
            Task updated or deleted event dict, or None if task not found.
        """
        task_id = input_data.get('taskId', '')

        if not task_id:
            return None

        # Handle deletion
        status = input_data.get('status', '')
        if status == 'deleted':
            if task_id in self._tasks:
                deleted_task = self._tasks.pop(task_id)
                return {
                    'event': 'task_deleted',
                    'task': deleted_task.to_dict()
                }
            return None

        # Get or create task (in case we missed the create call)
        if task_id not in self._tasks:
            # Create a placeholder task
            self._tasks[task_id] = Task(
                id=task_id,
                subject=input_data.get('subject', f'Task {task_id}'),
                description=input_data.get('description', '')
            )

        task = self._tasks[task_id]

        # Apply updates
        if 'subject' in input_data:
            task.subject = input_data['subject']
        if 'description' in input_data:
            task.description = input_data['description']
        if 'status' in input_data:
            task.status = input_data['status']
        if 'activeForm' in input_data:
            task.activeForm = input_data['activeForm']
        if 'owner' in input_data:
            task.owner = input_data['owner']

        # Handle dependency additions
        if 'addBlocks' in input_data:
            for block_id in input_data['addBlocks']:
                if block_id not in task.blocks:
                    task.blocks.append(block_id)
        if 'addBlockedBy' in input_data:
            for blocked_id in input_data['addBlockedBy']:
                if blocked_id not in task.blockedBy:
                    task.blockedBy.append(blocked_id)

        # Handle metadata merge
        if 'metadata' in input_data:
            for key, value in input_data['metadata'].items():
                if value is None:
                    task.metadata.pop(key, None)
                else:
                    task.metadata[key] = value

        return {
            'event': 'task_updated',
            'task': task.to_dict()
        }

    def get_all_tasks(self) -> List[dict]:
        """Get all current tasks as dicts.

        Returns:
            List of task dicts.
        """
        return [task.to_dict() for task in self._tasks.values()]

    def get_task(self, task_id: str) -> Optional[dict]:
        """Get a specific task by ID.

        Args:
            task_id: The task ID to retrieve.

        Returns:
            Task dict or None if not found.
        """
        task = self._tasks.get(task_id)
        return task.to_dict() if task else None

    def clear(self):
        """Reset all task state."""
        self._tasks.clear()
        self._next_id = 1

    def get_stats(self) -> dict:
        """Get task statistics.

        Returns:
            Dict with counts by status.
        """
        stats = {
            'total': len(self._tasks),
            'pending': 0,
            'in_progress': 0,
            'completed': 0
        }

        for task in self._tasks.values():
            if task.status in stats:
                stats[task.status] += 1

        return stats
