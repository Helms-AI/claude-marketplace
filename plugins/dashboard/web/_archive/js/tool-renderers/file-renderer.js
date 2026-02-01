/**
 * File Renderer - Read, Write, Edit, NotebookEdit operations
 * Shows file operations with path, content previews, and inline diffs
 */

const FileRenderer = {
    /**
     * Render a Read tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderRead(tool) {
        const input = tool.input || {};
        const filePath = input.file_path || '';
        const offset = input.offset;
        const limit = input.limit;

        const icon = ToolIcons.fileRead;
        const color = ToolColors.file;
        const displayPath = BaseRenderer.formatPath(filePath, 60);

        // Build secondary info
        let secondary = '';
        if (offset || limit) {
            const parts = [];
            if (offset) parts.push(`from line ${offset}`);
            if (limit) parts.push(`${limit} lines`);
            secondary = parts.join(', ');
        }

        return `
            <div class="tool-card tool-card-file tool-card-simple" style="--tool-color: ${color}">
                <div class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Reading <span class="tool-file-path">${BaseRenderer.escapeHtml(displayPath)}</span></span>
                </div>
                ${secondary ? `<div class="tool-card-secondary">${BaseRenderer.escapeHtml(secondary)}</div>` : ''}
            </div>
        `;
    },

    /**
     * Render a Write tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderWrite(tool) {
        const input = tool.input || {};
        const filePath = input.file_path || '';
        const content = input.content || '';

        const icon = ToolIcons.fileWrite;
        const color = ToolColors.file;
        const displayPath = BaseRenderer.formatPath(filePath, 60);

        // Content preview (first line or truncated)
        const firstLine = content.split('\n')[0] || '';
        const preview = BaseRenderer.truncate(firstLine, 60);
        const lineCount = content.split('\n').length;

        return `
            <details class="tool-card tool-card-file" style="--tool-color: ${color}">
                <summary class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Writing to <span class="tool-file-path">${BaseRenderer.escapeHtml(displayPath)}</span></span>
                    ${BaseRenderer.badge(`${lineCount} lines`, 'muted')}
                    <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                </summary>
                ${preview ? `<div class="tool-card-secondary tool-content-preview">"${BaseRenderer.escapeHtml(preview)}"</div>` : ''}
                <div class="tool-card-body">
                    <pre class="tool-content-full">${BaseRenderer.escapeHtml(BaseRenderer.truncate(content, 500))}</pre>
                </div>
            </details>
        `;
    },

    /**
     * Render an Edit tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderEdit(tool) {
        const input = tool.input || {};
        const filePath = input.file_path || '';
        const oldString = input.old_string || '';
        const newString = input.new_string || '';
        const replaceAll = input.replace_all;

        const icon = ToolIcons.fileEdit;
        const color = ToolColors.file;
        const displayPath = BaseRenderer.formatPath(filePath, 60);

        // Build badges
        const badges = [];
        if (replaceAll) {
            badges.push({ text: 'replace all', type: 'accent' });
        }

        const badgeHtml = badges.map(b => BaseRenderer.badge(b.text, b.type)).join('');

        // Create inline diff preview
        const diffPreview = BaseRenderer.inlineDiff(oldString, newString);

        return `
            <details class="tool-card tool-card-file tool-card-edit" style="--tool-color: ${color}">
                <summary class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Editing <span class="tool-file-path">${BaseRenderer.escapeHtml(displayPath)}</span></span>
                    ${badgeHtml}
                    <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                </summary>
                <div class="tool-card-secondary">${diffPreview}</div>
                <div class="tool-card-body">
                    <div class="tool-edit-full">
                        <div class="tool-edit-section">
                            <span class="tool-edit-label">Old:</span>
                            <pre class="tool-edit-content">${BaseRenderer.escapeHtml(BaseRenderer.truncate(oldString, 300))}</pre>
                        </div>
                        <div class="tool-edit-section">
                            <span class="tool-edit-label">New:</span>
                            <pre class="tool-edit-content">${BaseRenderer.escapeHtml(BaseRenderer.truncate(newString, 300))}</pre>
                        </div>
                    </div>
                </div>
            </details>
        `;
    },

    /**
     * Render a NotebookEdit tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderNotebookEdit(tool) {
        const input = tool.input || {};
        const notebookPath = input.notebook_path || '';
        const cellType = input.cell_type || 'code';
        const editMode = input.edit_mode || 'replace';
        const newSource = input.new_source || '';

        const icon = ToolIcons.fileEdit;
        const color = ToolColors.file;
        const displayPath = BaseRenderer.formatPath(notebookPath, 50);

        // Build badges
        const badges = [
            { text: cellType, type: 'accent' },
            { text: editMode, type: 'muted' }
        ];

        const badgeHtml = badges.map(b => BaseRenderer.badge(b.text, b.type)).join('');

        const preview = BaseRenderer.truncate(newSource.split('\n')[0], 50);

        return `
            <details class="tool-card tool-card-file" style="--tool-color: ${color}">
                <summary class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Notebook: <span class="tool-file-path">${BaseRenderer.escapeHtml(displayPath)}</span></span>
                    ${badgeHtml}
                    <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                </summary>
                ${preview ? `<div class="tool-card-secondary">"${BaseRenderer.escapeHtml(preview)}"</div>` : ''}
                <div class="tool-card-body">
                    <pre class="tool-content-full">${BaseRenderer.escapeHtml(BaseRenderer.truncate(newSource, 300))}</pre>
                </div>
            </details>
        `;
    },

    /**
     * Main render dispatcher
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    render(tool) {
        const name = tool.name;
        switch (name) {
            case 'Read': return this.renderRead(tool);
            case 'Write': return this.renderWrite(tool);
            case 'Edit': return this.renderEdit(tool);
            case 'NotebookEdit': return this.renderNotebookEdit(tool);
            default: return ToolRendererRegistry.renderDefault(tool);
        }
    },

    /**
     * Preview dispatcher for streaming indicator
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string for compact preview
     */
    renderPreview(tool) {
        const name = tool.name;
        switch (name) {
            case 'Read': return this.renderReadPreview(tool);
            case 'Write': return this.renderWritePreview(tool);
            case 'Edit': return this.renderEditPreview(tool);
            case 'NotebookEdit': return this.renderNotebookEditPreview(tool);
            default: return ToolRendererRegistry.renderDefaultPreview(tool);
        }
    },

    /**
     * Compact preview for Read operation
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderReadPreview(tool) {
        const input = tool.input || {};
        const filePath = input.file_path || '';
        const offset = input.offset;
        const limit = input.limit;

        const icon = ToolIcons.fileRead;
        const color = ToolColors.file;
        const displayPath = BaseRenderer.formatPath(filePath, 30);

        // Build compact info badges
        const badges = [];
        if (offset) badges.push(`L${offset}`);
        if (limit) badges.push(`${limit}L`);

        const badgeHtml = badges.length > 0
            ? badges.map(b => `<span class="preview-badge">${b}</span>`).join('')
            : '';

        return `
            <div class="streaming-tool-preview streaming-tool-file" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${BaseRenderer.escapeHtml(displayPath)}</span>
                ${badgeHtml}
            </div>
        `;
    },

    /**
     * Compact preview for Write operation
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderWritePreview(tool) {
        const input = tool.input || {};
        const filePath = input.file_path || '';
        const content = input.content || '';

        const icon = ToolIcons.fileWrite;
        const color = ToolColors.file;
        const displayPath = BaseRenderer.formatPath(filePath, 25);
        const lineCount = content.split('\n').length;

        return `
            <div class="streaming-tool-preview streaming-tool-file" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${BaseRenderer.escapeHtml(displayPath)}</span>
                <span class="preview-badge">${lineCount}L</span>
            </div>
        `;
    },

    /**
     * Compact preview for Edit operation
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderEditPreview(tool) {
        const input = tool.input || {};
        const filePath = input.file_path || '';
        const replaceAll = input.replace_all;

        const icon = ToolIcons.fileEdit;
        const color = ToolColors.file;
        const displayPath = BaseRenderer.formatPath(filePath, 28);

        const badgeHtml = replaceAll
            ? '<span class="preview-badge preview-badge-accent">all</span>'
            : '';

        return `
            <div class="streaming-tool-preview streaming-tool-file" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${BaseRenderer.escapeHtml(displayPath)}</span>
                ${badgeHtml}
            </div>
        `;
    },

    /**
     * Compact preview for NotebookEdit operation
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    renderNotebookEditPreview(tool) {
        const input = tool.input || {};
        const notebookPath = input.notebook_path || '';
        const cellType = input.cell_type || 'code';
        const editMode = input.edit_mode || 'replace';

        const icon = ToolIcons.fileEdit;
        const color = ToolColors.file;
        const displayPath = BaseRenderer.formatPath(notebookPath, 22);

        return `
            <div class="streaming-tool-preview streaming-tool-file" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${BaseRenderer.escapeHtml(displayPath)}</span>
                <span class="preview-badge">${cellType}</span>
                <span class="preview-badge">${editMode}</span>
            </div>
        `;
    }
};

// Register the renderers
ToolRendererRegistry.register('Read', FileRenderer);
ToolRendererRegistry.register('Write', FileRenderer);
ToolRendererRegistry.register('Edit', FileRenderer);
ToolRendererRegistry.register('NotebookEdit', FileRenderer);
