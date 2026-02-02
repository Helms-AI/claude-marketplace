/**
 * Tool Render Service - Determines where tools should be rendered
 * @module services/tool-render-service
 *
 * Provides helper functions for determining whether a tool should render
 * inline in the conversation or in the activities aside panel.
 */

import { TOOL_RENDER_CONFIG, ToolRenderMode } from '../store/app-state.js';

/**
 * Get the render configuration for a tool
 * @param {string} toolName - Name of the tool (e.g., "Bash", "Read", "AskUserQuestion")
 * @returns {Object} Configuration object with mode and optional reason
 */
export function getToolRenderConfig(toolName) {
    return TOOL_RENDER_CONFIG[toolName] || TOOL_RENDER_CONFIG._default;
}

/**
 * Check if a tool should render inline in the conversation
 * @param {string} toolName - Name of the tool
 * @returns {boolean} True if tool should render inline
 */
export function shouldRenderInline(toolName) {
    const config = getToolRenderConfig(toolName);
    return config.mode === ToolRenderMode.INLINE;
}

/**
 * Check if a tool should render in the activities aside
 * @param {string} toolName - Name of the tool
 * @returns {boolean} True if tool should render in aside
 */
export function shouldRenderAside(toolName) {
    const config = getToolRenderConfig(toolName);
    return config.mode === ToolRenderMode.ASIDE || config.mode === ToolRenderMode.HYBRID;
}

/**
 * Filter an array of tool calls to only inline tools
 * @param {Array} toolCalls - Array of tool call objects with 'name' property
 * @returns {Array} Filtered array of inline-only tools
 */
export function filterInlineTools(toolCalls) {
    if (!toolCalls?.length) return [];
    return toolCalls.filter(tool => shouldRenderInline(tool.name));
}

/**
 * Filter an array of tool calls to only aside tools
 * @param {Array} toolCalls - Array of tool call objects with 'name' property
 * @returns {Array} Filtered array of aside-only tools
 */
export function filterAsideTools(toolCalls) {
    if (!toolCalls?.length) return [];
    return toolCalls.filter(tool => shouldRenderAside(tool.name));
}

/**
 * Get counts of tools by render mode
 * @param {Array} toolCalls - Array of tool call objects
 * @returns {Object} Counts { inline: number, aside: number, total: number }
 */
export function getToolCounts(toolCalls) {
    if (!toolCalls?.length) return { inline: 0, aside: 0, total: 0 };

    const inlineTools = filterInlineTools(toolCalls);
    const asideTools = filterAsideTools(toolCalls);

    return {
        inline: inlineTools.length,
        aside: asideTools.length,
        total: toolCalls.length
    };
}

/**
 * Check if there are any aside tools in the array
 * @param {Array} toolCalls - Array of tool call objects
 * @returns {boolean} True if any tools should render in aside
 */
export function hasAsideTools(toolCalls) {
    return filterAsideTools(toolCalls).length > 0;
}

/**
 * Check if there are any inline tools in the array
 * @param {Array} toolCalls - Array of tool call objects
 * @returns {boolean} True if any tools should render inline
 */
export function hasInlineTools(toolCalls) {
    return filterInlineTools(toolCalls).length > 0;
}

/**
 * Get tool names as a summary string
 * @param {Array} toolCalls - Array of tool call objects
 * @returns {string} Comma-separated tool names (e.g., "Read, Write, Bash")
 */
export function getToolNamesSummary(toolCalls) {
    if (!toolCalls?.length) return '';
    const uniqueNames = [...new Set(toolCalls.map(t => t.name))];
    return uniqueNames.join(', ');
}

/**
 * Get aside tool names as a summary
 * @param {Array} toolCalls - Array of tool call objects
 * @returns {string} Comma-separated aside tool names
 */
export function getAsideToolNamesSummary(toolCalls) {
    return getToolNamesSummary(filterAsideTools(toolCalls));
}

// Export the service as an object for legacy compatibility
export const ToolRenderService = {
    getToolRenderConfig,
    shouldRenderInline,
    shouldRenderAside,
    filterInlineTools,
    filterAsideTools,
    getToolCounts,
    hasAsideTools,
    hasInlineTools,
    getToolNamesSummary,
    getAsideToolNamesSummary
};
