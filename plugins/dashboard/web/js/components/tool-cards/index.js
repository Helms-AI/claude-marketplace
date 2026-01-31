/**
 * Tool Cards Components Index
 *
 * Exports all tool card components.
 * Each tool card displays a specific type of tool execution.
 *
 * @module components/tool-cards
 */

export { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';
export { BashToolCard } from './bash-tool-card.js';
export { ReadToolCard } from './read-tool-card.js';

/**
 * Registry of tool name to component tag mappings
 * Used for dynamic tool card rendering
 */
export const ToolCardRegistry = {
    'Bash': 'bash-tool-card',
    'Read': 'read-tool-card',
    'Edit': 'edit-tool-card',
    'Write': 'write-tool-card',
    'Glob': 'glob-tool-card',
    'Grep': 'grep-tool-card',
    'Task': 'task-tool-card',
    'AskUserQuestion': 'question-tool-card',
    'WebFetch': 'web-tool-card',
    'WebSearch': 'web-tool-card'
};

/**
 * Get the appropriate tool card tag for a tool name
 * @param {string} toolName
 * @returns {string} Custom element tag name
 */
export function getToolCardTag(toolName) {
    return ToolCardRegistry[toolName] || 'tool-card-base';
}
