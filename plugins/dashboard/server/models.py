"""Pydantic models for dashboard data structures."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class EventType(Enum):
    """Types of conversation events."""
    SKILL_INVOKED = "skill_invoked"
    AGENT_ACTIVATED = "agent_activated"
    TOOL_CALLED = "tool_called"
    USER_RESPONSE = "user_response"
    HANDOFF_STARTED = "handoff_started"
    HANDOFF_COMPLETED = "handoff_completed"
    TEAM_SESSION = "team_session"
    ARTIFACT_CREATED = "artifact_created"
    DECISION_MADE = "decision_made"


@dataclass
class AgentInfo:
    """Information about an agent persona."""
    id: str
    name: str
    role: str
    domain: str
    description: str
    tools: list[str] = field(default_factory=list)
    key_phrases: list[str] = field(default_factory=list)
    file_path: str = ""
    last_active: Optional[datetime] = None


@dataclass
class SkillInfo:
    """Information about a skill."""
    id: str
    name: str
    domain: str
    description: str
    backing_agent: Optional[str] = None
    handoff_inputs: list[str] = field(default_factory=list)
    handoff_outputs: list[str] = field(default_factory=list)
    file_path: str = ""
    invocation_count: int = 0
    last_invoked: Optional[datetime] = None


@dataclass
class CapabilityInfo:
    """Information about a capability."""
    id: str
    verb: str
    domain: str
    artifacts: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    skill: str = ""
    priority: int = 5


@dataclass
class DomainInfo:
    """Information about a domain."""
    name: str
    subdomains: list[str] = field(default_factory=list)
    collaborates_with: list[str] = field(default_factory=list)
    agents: list[str] = field(default_factory=list)
    skills: list[str] = field(default_factory=list)
    capabilities: list[str] = field(default_factory=list)


@dataclass
class ConversationEvent:
    """A single event in a conversation."""
    id: str
    timestamp: datetime
    changeset_id: str
    event_type: EventType
    domain: str
    agent_id: Optional[str] = None
    skill_id: Optional[str] = None
    content: dict = field(default_factory=dict)


@dataclass
class ChangesetInfo:
    """Information about an active changeset (dashboard tracking unit)."""
    changeset_id: str
    started_at: datetime
    phase: str = "active"
    current_domain: Optional[str] = None
    current_agent: Optional[str] = None
    events: list[ConversationEvent] = field(default_factory=list)
    handoffs: list[dict] = field(default_factory=list)
    artifacts: list[str] = field(default_factory=list)
    # Additional fields for file-based changesets
    project_path: Optional[str] = None
    domains_involved: list[str] = field(default_factory=list)
    original_request: str = ""
    handoff_count: int = 0
    # Claude Code's native session ID (from transcripts)
    session_id: Optional[str] = None


@dataclass
class HandoffInfo:
    """Information about a cross-domain handoff."""
    id: str
    timestamp: datetime
    changeset_id: str
    source_domain: str
    target_domain: str
    source_agent: Optional[str] = None
    target_agent: Optional[str] = None
    context: dict = field(default_factory=dict)
    status: str = "pending"
