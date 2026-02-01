/**
 * Services Index
 * @module services
 *
 * All services are singletons - import and use directly.
 */

// Core infrastructure services
export { APIService } from './api-service.js';
export { SSEService, SSEEventType } from './sse-service.js';
export { StorageService } from './storage-service.js';

// UI services
export { ThemeService } from './theme-service.js';
export { TabService } from './tab-service.js';
export { ModalService } from './modal-service.js';
export { KeyboardService } from './keyboard-service.js';
export { PanelService } from './panel-service.js';

// Domain services
export { SDKClient, SDKEventType } from './sdk-client.js';
export { AgentService } from './agent-service.js';
export { SkillService } from './skill-service.js';
export { ChangesetService } from './changeset-service.js';

// Utility services
export {
    formatRelativeTime,
    formatShortTime,
    formatTimestamp,
    getInitials,
    formatEventType,
    getDomainDisplayName,
    getDomainClass,
    truncateText,
    formatNumber,
    formatBytes,
    Formatters
} from './formatters.js';
