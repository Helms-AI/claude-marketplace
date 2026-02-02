/**
 * Atoms - Foundational UI components
 * @module components/atoms
 *
 * Atoms are the smallest, most basic building blocks.
 * They cannot be broken down further without losing functionality.
 */

// Icon component powered by Lucide (100% Lucide - no custom icons)
export { DashIcon, lucideIcons, getAllIconNames, isValidIconName } from './icon.js';

// Interactive elements
export { DashButton } from './button.js';
export { DashIconButton } from './icon-button.js';
export { DashInput } from './input.js';
export { DashFilterInput } from './filter-input.js';
export { DashSelect } from './select.js';
export { DashToggle } from './toggle.js';
export { DashSlider } from './slider.js';
export { SegmentedControl } from './segmented-control.js';

// Specialized icon with state (uses dash-icon internally)
export { BrainIcon } from './brain-icon.js';

// Status indicators
export { DashDot } from './dot.js';
export { DashSpinner } from './spinner.js';
export { DashProgressBar } from './progress-bar.js';

// Display elements
export { DashKbd } from './kbd.js';
export { DashAvatar } from './avatar.js';
export { DashTag } from './tag.js';
export { DashEmptyState } from './empty-state.js';
export { DashDivider } from './divider.js';

// Tab components
export { DashTab } from './tab.js';
export { DashTabPanel } from './tab-panel.js';
export { DashTabGroup } from './tab-group.js';

// Activity components
export { ActivityIndicator, ActivityIndicatorStatus } from './activity-indicator.js';
