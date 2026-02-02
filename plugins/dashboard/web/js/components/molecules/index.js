/**
 * Molecules Barrel Export
 * Compound components built from atoms
 * @module components/molecules
 */

// Form molecules
export { DashSearchInput } from './search-input.js';

// Navigation molecules
export { DashTabButton } from './tab-button.js';
export { DashDropdownMenu } from './dropdown-menu.js';
export { DashTreeNode } from './tree-node.js';

// Modal molecules
export { DashModalHeader } from './modal-header.js';
export { DashModalSection } from './modal-section.js';
export { DashModalIdentity } from './modal-identity.js';

// Display molecules
export { DashKeyboardShortcut } from './keyboard-shortcut.js';
export { DashStatCard } from './stat-card.js';
export { DashTagList } from './tag-list.js';
export { DashActivityList } from './activity-list.js';
export { DashDetailSection } from './detail-section.js';

// Terminal input molecules
export { ModeSelector } from './mode-selector.js';
export { ModelToggle } from './model-toggle.js';
export { InputToolbar } from './input-toolbar.js';
export { AutonomySelector } from './autonomy-selector.js';

// Settings molecules
export { CollapsibleSection } from './collapsible-section.js';
export { ToggleRow } from './toggle-row.js';
export { SliderRow } from './slider-row.js';

// Re-export indicators (these are molecules too)
export { ConnectionStatus, ConnectionState } from '../indicators/connection-status.js';
export { ThinkingIndicator } from '../indicators/thinking-indicator.js';

// Activity molecules
export { ActivityItem, TOOL_ICONS } from './activity-item.js';
export { ActivityGroup } from './activity-group.js';
export { CollapsedPreview } from './collapsed-preview.js';
export { ToolActivityBadge } from './tool-activity-badge.js';

// Events molecules
export { EventsFilterBar, CATEGORIES as EVENT_CATEGORIES } from './events-filter-bar.js';
export { EventsSettingsDropdown } from './events-settings-dropdown.js';
export { NetworkWidget } from './network-widget.js';

// Data display molecules
export { JsonViewer, VIEW_MODE as JSON_VIEW_MODE } from './json-viewer.js';

// Artifact viewer molecules
export { ArtifactTab } from './artifact-tab.js';
