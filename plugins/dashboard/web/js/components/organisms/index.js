/**
 * Organisms Barrel Export
 * Complex UI sections combining molecules and atoms
 * @module components/organisms
 */

// Global UI organisms
export { DashCommandPalette } from './command-palette.js';
export { DashProfileMenu } from './profile-menu.js';

// Panel organisms
export { DashWelcomePanel } from './welcome-panel.js';
export { DashActivityPanel } from './activity-panel.js';

// Detail modal organisms
export { AgentDetailModal } from './agent-detail-modal.js';
export { SkillDetailModal } from './skill-detail-modal.js';

// Activity organisms
export { ActivityTimeline } from './activity-timeline.js';
export { ActivityFileTree } from './activity-file-tree.js';
export { ActivitiesPanelContainer, PANEL_REGISTRY, registerPanel } from './activities-panel-container.js';
export { AttachmentPanel } from './attachment-panel.js';

// Events organisms
export { EventsPanel } from './events-panel.js';
export { EventItem, EVENT_TYPE_CONFIG } from './event-item.js';

// About modal
export { AboutModal } from './about-modal.js';

// Artifact viewer organisms
export { ArtifactTabBar } from './artifact-tab-bar.js';
export { TextViewer } from './text-viewer.js';
export { MarkdownViewer } from './markdown-viewer.js';
export { JsonTreeViewer } from './json-tree-viewer.js';
export { CodeViewer } from './code-viewer.js';
export { ArtifactViewer } from './artifact-viewer.js';
