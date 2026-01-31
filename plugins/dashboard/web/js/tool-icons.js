/**
 * Tool Icons - SVG definitions for tool categories
 * Each icon is an inline SVG string for use in tool renderers
 */

const ToolIcons = {
    // Command Execution - Green (#4ade80)
    terminal: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="4 17 10 11 4 5"></polyline>
        <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>`,

    // File Operations - Blue (#60a5fa)
    fileRead: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <circle cx="12" cy="14" r="3"></circle>
    </svg>`,

    fileWrite: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <polyline points="9 15 12 12 15 15"></polyline>
    </svg>`,

    fileEdit: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <path d="M10 13l-2 2 2 2"></path>
        <path d="M14 13l2 2-2 2"></path>
    </svg>`,

    // Search Operations - Purple (#a78bfa)
    search: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>`,

    glob: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        <line x1="9" y1="13" x2="15" y2="13"></line>
    </svg>`,

    // Web Operations - Cyan (#22d3ee)
    globe: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>`,

    globeSearch: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <line x1="2" y1="11" x2="8" y2="11"></line>
        <path d="M11 2a7.3 7.3 0 0 1 2 5"></path>
    </svg>`,

    // Task Management - Amber (#facc15)
    task: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 11l3 3L22 4"></path>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>`,

    // Planning - Indigo (#818cf8)
    lightbulb: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18h6"></path>
        <path d="M10 22h4"></path>
        <path d="M12 2a7 7 0 0 0-4 12.9V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.1A7 7 0 0 0 12 2z"></path>
    </svg>`,

    // Skills - Pink (#f472b6)
    slash: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="5" y1="19" x2="19" y2="5"></line>
    </svg>`,

    // User Interaction - Orange (#fb923c)
    question: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>`,

    // Agent/Subagent - Indigo (#818cf8)
    agent: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>`,

    // Expand/Collapse
    chevronDown: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`,

    chevronRight: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 6 15 12 9 18"></polyline>
    </svg>`,

    // Generic tool fallback
    tool: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>`
};

// Category color mapping
const ToolColors = {
    command: '#4ade80',     // Green
    file: '#60a5fa',        // Blue
    search: '#a78bfa',      // Purple
    web: '#22d3ee',         // Cyan
    task: '#facc15',        // Amber
    planning: '#818cf8',    // Indigo
    skill: '#f472b6',       // Pink
    user: '#fb923c',        // Orange
    agent: '#818cf8',       // Indigo
    default: '#8b949e'      // Gray
};

// Tool to category mapping
const ToolCategories = {
    'Bash': 'command',
    'Read': 'file',
    'Write': 'file',
    'Edit': 'file',
    'NotebookEdit': 'file',
    'Grep': 'search',
    'Glob': 'search',
    'WebFetch': 'web',
    'WebSearch': 'web',
    'Task': 'agent',
    'TaskCreate': 'task',
    'TaskUpdate': 'task',
    'TaskGet': 'task',
    'TaskList': 'task',
    'TaskStop': 'task',
    'TaskOutput': 'task',
    'EnterPlanMode': 'planning',
    'ExitPlanMode': 'planning',
    'Skill': 'skill',
    'AskUserQuestion': 'user'
};

/**
 * Get the icon for a tool
 * @param {string} toolName - The tool name
 * @returns {string} SVG string
 */
function getToolIcon(toolName) {
    const category = ToolCategories[toolName] || 'default';

    switch (toolName) {
        case 'Bash': return ToolIcons.terminal;
        case 'Read': return ToolIcons.fileRead;
        case 'Write': return ToolIcons.fileWrite;
        case 'Edit': return ToolIcons.fileEdit;
        case 'NotebookEdit': return ToolIcons.fileEdit;
        case 'Grep': return ToolIcons.search;
        case 'Glob': return ToolIcons.glob;
        case 'WebFetch': return ToolIcons.globe;
        case 'WebSearch': return ToolIcons.globeSearch;
        case 'Task': return ToolIcons.agent;
        case 'TaskCreate':
        case 'TaskUpdate':
        case 'TaskGet':
        case 'TaskList':
        case 'TaskStop':
        case 'TaskOutput': return ToolIcons.task;
        case 'EnterPlanMode':
        case 'ExitPlanMode': return ToolIcons.lightbulb;
        case 'Skill': return ToolIcons.slash;
        case 'AskUserQuestion': return ToolIcons.question;
        default: return ToolIcons.tool;
    }
}

/**
 * Get the accent color for a tool
 * @param {string} toolName - The tool name
 * @returns {string} Hex color
 */
function getToolColor(toolName) {
    const category = ToolCategories[toolName] || 'default';
    return ToolColors[category] || ToolColors.default;
}

/**
 * Get the category for a tool
 * @param {string} toolName - The tool name
 * @returns {string} Category name
 */
function getToolCategory(toolName) {
    return ToolCategories[toolName] || 'default';
}
