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
export { ConversationClient, ConversationEventType } from './conversation-client.js';
export { AgentService } from './agent-service.js';
export { SkillService } from './skill-service.js';
export { ChangesetService } from './changeset-service.js';
export { ActivityService, ActivityStatus } from './activity-service.js';
export { CommandService, CommandStatus } from './command-service.js';

// Input services
export { AttachmentService, SUPPORTED_IMAGE_TYPES, MAX_FILE_SIZE, MAX_ATTACHMENTS } from './attachment-service.js';

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
    // Time period utilities
    isSameDay,
    isYesterday,
    isSameWeek,
    isLastWeek,
    isSameMonth,
    isSameYear,
    getTimePeriod,
    formatWeekRange,
    getWeekLabel,
    Formatters
} from './formatters.js';

// Time grouping service
export {
    groupChangesetsByTime,
    getDefaultExpansionState,
    getTimeIcon
} from './time-grouping.js';

// Tool render service
export {
    getToolRenderConfig,
    shouldRenderInline,
    shouldRenderAside,
    filterInlineTools,
    filterAsideTools,
    getToolCounts,
    hasAsideTools,
    hasInlineTools,
    getToolNamesSummary,
    getAsideToolNamesSummary,
    ToolRenderService
} from './tool-render-service.js';
