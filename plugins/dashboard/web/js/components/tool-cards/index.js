/**
 * Tool Cards Components Index
 * @module components/tool-cards
 */

export { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';
export { BashToolCard } from './bash-tool-card.js';
export { ReadToolCard } from './read-tool-card.js';
export { EditToolCard } from './edit-tool-card.js';
export { WriteToolCard } from './write-tool-card.js';
export { GlobToolCard } from './glob-tool-card.js';
export { GrepToolCard } from './grep-tool-card.js';
export { TaskToolCard } from './task-tool-card.js';
export { WebToolCard } from './web-tool-card.js';
export { QuestionToolCard } from './question-tool-card.js';

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

export function getToolCardTag(toolName) { return ToolCardRegistry[toolName] || 'tool-card-base'; }
