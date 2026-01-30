"""Event store for tracking conversation events."""

import uuid
from collections import defaultdict
from datetime import datetime
from threading import Lock
from typing import Optional

from ..models import ConversationEvent, EventType


class EventStore:
    """In-memory store for conversation events."""

    def __init__(self, max_events: int = 10000):
        """Initialize the event store.

        Args:
            max_events: Maximum number of events to keep in memory.
        """
        self.max_events = max_events
        self.events: list[ConversationEvent] = []
        self.events_by_changeset: dict[str, list[ConversationEvent]] = defaultdict(list)
        self.events_by_agent: dict[str, list[ConversationEvent]] = defaultdict(list)
        self.events_by_skill: dict[str, list[ConversationEvent]] = defaultdict(list)
        self.lock = Lock()
        self.listeners: list[callable] = []

    def add_event(self, event: ConversationEvent) -> None:
        """Add an event to the store.

        Args:
            event: The event to add.
        """
        with self.lock:
            self.events.append(event)
            self.events_by_changeset[event.changeset_id].append(event)

            if event.agent_id:
                self.events_by_agent[event.agent_id].append(event)

            if event.skill_id:
                self.events_by_skill[event.skill_id].append(event)

            # Trim if over max
            if len(self.events) > self.max_events:
                # Remove oldest events
                to_remove = self.events[:len(self.events) - self.max_events]
                self.events = self.events[-self.max_events:]

                # Clean up indexes
                for event in to_remove:
                    if event in self.events_by_changeset[event.changeset_id]:
                        self.events_by_changeset[event.changeset_id].remove(event)
                    if event.agent_id and event in self.events_by_agent[event.agent_id]:
                        self.events_by_agent[event.agent_id].remove(event)
                    if event.skill_id and event in self.events_by_skill[event.skill_id]:
                        self.events_by_skill[event.skill_id].remove(event)

        # Notify listeners
        for listener in self.listeners:
            try:
                listener(event)
            except Exception:
                pass

    def create_event(
        self,
        event_type: EventType,
        changeset_id: str,
        domain: str,
        agent_id: Optional[str] = None,
        skill_id: Optional[str] = None,
        content: Optional[dict] = None
    ) -> ConversationEvent:
        """Create and store a new event.

        Args:
            event_type: The type of event.
            changeset_id: The changeset ID.
            domain: The domain.
            agent_id: Optional agent ID.
            skill_id: Optional skill ID.
            content: Optional event content.

        Returns:
            The created event.
        """
        event = ConversationEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(),
            changeset_id=changeset_id,
            event_type=event_type,
            domain=domain,
            agent_id=agent_id,
            skill_id=skill_id,
            content=content or {}
        )
        self.add_event(event)
        return event

    def get_recent(self, limit: int = 100) -> list[ConversationEvent]:
        """Get recent events.

        Args:
            limit: Maximum number of events to return.

        Returns:
            List of recent events.
        """
        with self.lock:
            return list(reversed(self.events[-limit:]))

    def get_by_changeset(self, changeset_id: str) -> list[ConversationEvent]:
        """Get all events for a changeset.

        Args:
            changeset_id: The changeset ID.

        Returns:
            List of events for the changeset.
        """
        with self.lock:
            return list(self.events_by_changeset.get(changeset_id, []))

    def get_by_agent(self, agent_id: str, limit: int = 100) -> list[ConversationEvent]:
        """Get recent events for an agent.

        Args:
            agent_id: The agent ID.
            limit: Maximum number of events to return.

        Returns:
            List of events for the agent.
        """
        with self.lock:
            events = self.events_by_agent.get(agent_id, [])
            return list(reversed(events[-limit:]))

    def get_by_skill(self, skill_id: str, limit: int = 100) -> list[ConversationEvent]:
        """Get recent events for a skill.

        Args:
            skill_id: The skill ID.
            limit: Maximum number of events to return.

        Returns:
            List of events for the skill.
        """
        with self.lock:
            events = self.events_by_skill.get(skill_id, [])
            return list(reversed(events[-limit:]))

    def get_changesets(self) -> list[str]:
        """Get all changeset IDs.

        Returns:
            List of changeset IDs.
        """
        with self.lock:
            return list(self.events_by_changeset.keys())

    def add_listener(self, listener: callable) -> None:
        """Add an event listener.

        Args:
            listener: Callback function that receives events.
        """
        self.listeners.append(listener)

    def remove_listener(self, listener: callable) -> None:
        """Remove an event listener.

        Args:
            listener: The listener to remove.
        """
        if listener in self.listeners:
            self.listeners.remove(listener)

    def to_dict(self, event: ConversationEvent) -> dict:
        """Convert an event to a dictionary for JSON serialization.

        Args:
            event: The event.

        Returns:
            Dictionary representation.
        """
        return {
            'id': event.id,
            'timestamp': event.timestamp.isoformat(),
            'changeset_id': event.changeset_id,
            'event_type': event.event_type.value,
            'domain': event.domain,
            'agent_id': event.agent_id,
            'skill_id': event.skill_id,
            'content': event.content
        }
