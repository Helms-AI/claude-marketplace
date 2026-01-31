/**
 * Question Renderer - AskUserQuestion operations
 * Shows question count, preview of first question, and expandable options
 */

const QuestionRenderer = {
    /**
     * Render an AskUserQuestion tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    render(tool) {
        const input = tool.input || {};
        const questions = input.questions || [];

        const icon = ToolIcons.question;
        const color = ToolColors.user;

        const questionCount = questions.length;

        if (questionCount === 0) {
            return `
                <div class="tool-card tool-card-question tool-card-simple" style="--tool-color: ${color}">
                    <div class="tool-card-header">
                        <span class="tool-card-icon">${icon}</span>
                        <span class="tool-card-primary">Asking user question</span>
                    </div>
                </div>
            `;
        }

        const firstQuestion = questions[0];
        const questionText = firstQuestion.question || '';
        const questionHeader = firstQuestion.header || '';

        // Build badges
        const badges = [];
        if (questionCount > 1) {
            badges.push({ text: `${questionCount} questions`, type: 'accent' });
        }
        if (firstQuestion.multiSelect) {
            badges.push({ text: 'multi-select', type: 'muted' });
        }

        const badgeHtml = badges.map(b => BaseRenderer.badge(b.text, b.type)).join('');

        // Build expandable content with all questions
        let expandContent = '';
        questions.forEach((q, i) => {
            const header = q.header || `Q${i + 1}`;
            const text = q.question || '';
            const options = q.options || [];

            let optionsHtml = '';
            if (options.length > 0) {
                optionsHtml = `<div class="tool-question-options">` +
                    options.map(opt => {
                        const label = opt.label || opt;
                        const desc = opt.description || '';
                        return `<div class="tool-question-option">
                            <span class="option-label">${BaseRenderer.escapeHtml(label)}</span>
                            ${desc ? `<span class="option-desc">${BaseRenderer.escapeHtml(BaseRenderer.truncate(desc, 50))}</span>` : ''}
                        </div>`;
                    }).join('') +
                    `</div>`;
            }

            expandContent += `
                <div class="tool-question-item">
                    <div class="tool-question-header">${BaseRenderer.escapeHtml(header)}</div>
                    <div class="tool-question-text">${BaseRenderer.escapeHtml(text)}</div>
                    ${optionsHtml}
                </div>
            `;
        });

        return `
            <details class="tool-card tool-card-question" style="--tool-color: ${color}">
                <summary class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Asking user: <span class="tool-question-preview">${BaseRenderer.escapeHtml(questionHeader || BaseRenderer.truncate(questionText, 40))}</span></span>
                    ${badgeHtml}
                    <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                </summary>
                <div class="tool-card-secondary">${BaseRenderer.escapeHtml(BaseRenderer.truncate(questionText, 80))}</div>
                <div class="tool-card-body">
                    ${expandContent}
                </div>
            </details>
        `;
    }
};

// Register the renderer
ToolRendererRegistry.register('AskUserQuestion', QuestionRenderer);
