/**
 * Question Renderer - AskUserQuestion operations
 * Shows interactive question cards that allow users to select answers
 * and continue the conversation
 */

const QuestionRenderer = {
    // Track active question state
    activeQuestions: {},

    /**
     * Generate a unique ID for a question card
     * @returns {string} Unique ID
     */
    generateQuestionId() {
        return 'q-' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Render an AskUserQuestion tool call
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string
     */
    render(tool) {
        const input = tool.input || {};
        const questions = input.questions || [];
        const toolId = tool.id || this.generateQuestionId();

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

        // Build expandable content with interactive questions
        let expandContent = '';
        questions.forEach((q, i) => {
            const header = q.header || `Q${i + 1}`;
            const text = q.question || '';
            const options = q.options || [];
            const isMultiSelect = q.multiSelect || false;
            const questionKey = `${toolId}-q${i}`;

            let optionsHtml = '';
            if (options.length > 0) {
                const inputType = isMultiSelect ? 'checkbox' : 'radio';

                optionsHtml = `<div class="tool-question-options tool-question-options-interactive" data-question-key="${questionKey}" data-multi-select="${isMultiSelect}">` +
                    options.map((opt, optIdx) => {
                        const label = opt.label || opt;
                        const desc = opt.description || '';
                        const inputId = `${questionKey}-opt${optIdx}`;

                        return `<label class="tool-question-option tool-question-option-interactive" for="${inputId}">
                            <input type="${inputType}"
                                   id="${inputId}"
                                   name="${questionKey}"
                                   value="${BaseRenderer.escapeHtml(label)}"
                                   class="tool-question-input"
                                   data-question-index="${i}"
                                   data-option-index="${optIdx}"
                                   onchange="QuestionRenderer.handleOptionChange(this, '${toolId}')">
                            <span class="option-checkbox">
                                ${isMultiSelect ?
                                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' :
                                    '<span class="option-radio-dot"></span>'
                                }
                            </span>
                            <span class="option-content">
                                <span class="option-label">${BaseRenderer.escapeHtml(label)}</span>
                                ${desc ? `<span class="option-desc">${BaseRenderer.escapeHtml(desc)}</span>` : ''}
                            </span>
                        </label>`;
                    }).join('') +
                    // Add "Other" option
                    `<label class="tool-question-option tool-question-option-interactive tool-question-option-other" for="${questionKey}-other">
                        <input type="${inputType}"
                               id="${questionKey}-other"
                               name="${questionKey}"
                               value="__other__"
                               class="tool-question-input tool-question-input-other"
                               data-question-index="${i}"
                               data-option-index="-1"
                               onchange="QuestionRenderer.handleOptionChange(this, '${toolId}')">
                        <span class="option-checkbox">
                            ${isMultiSelect ?
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' :
                                '<span class="option-radio-dot"></span>'
                            }
                        </span>
                        <span class="option-content">
                            <span class="option-label">Other</span>
                            <span class="option-desc">Provide custom response</span>
                        </span>
                    </label>
                    <div class="tool-question-other-input" id="${questionKey}-other-container" style="display: none;">
                        <input type="text"
                               class="tool-question-text-input"
                               id="${questionKey}-other-text"
                               placeholder="Type your response..."
                               onkeyup="QuestionRenderer.handleOtherTextChange(this, '${toolId}', ${i})">
                    </div>` +
                    `</div>`;
            }

            expandContent += `
                <div class="tool-question-item tool-question-item-interactive" data-question-index="${i}">
                    <div class="tool-question-header">${BaseRenderer.escapeHtml(header)}</div>
                    <div class="tool-question-text">${BaseRenderer.escapeHtml(text)}</div>
                    ${optionsHtml}
                </div>
            `;
        });

        // Add submit button
        expandContent += `
            <div class="tool-question-actions">
                <button class="tool-question-submit"
                        id="${toolId}-submit"
                        onclick="QuestionRenderer.submitAnswers('${toolId}')"
                        disabled>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    Submit Answers
                </button>
            </div>
        `;

        // Store question metadata for later
        this.activeQuestions[toolId] = {
            questions: questions,
            answers: {},
            submitted: false
        };

        return `
            <details class="tool-card tool-card-question tool-card-question-interactive"
                     style="--tool-color: ${color}"
                     data-tool-id="${toolId}"
                     open>
                <summary class="tool-card-header">
                    <span class="tool-card-icon">${icon}</span>
                    <span class="tool-card-primary">Asking user: <span class="tool-question-preview">${BaseRenderer.escapeHtml(questionHeader || BaseRenderer.truncate(questionText, 40))}</span></span>
                    ${badgeHtml}
                    <span class="tool-card-expand">${ToolIcons.chevronDown}</span>
                </summary>
                <div class="tool-card-secondary">${BaseRenderer.escapeHtml(BaseRenderer.truncate(questionText, 80))}</div>
                <div class="tool-card-body tool-card-body-interactive">
                    ${expandContent}
                </div>
            </details>
        `;
    },

    /**
     * Handle option selection change
     * @param {HTMLInputElement} input - The changed input element
     * @param {string} toolId - The tool ID
     */
    handleOptionChange(input, toolId) {
        const questionData = this.activeQuestions[toolId];
        if (!questionData || questionData.submitted) return;

        const questionIndex = parseInt(input.dataset.questionIndex);
        const optionIndex = parseInt(input.dataset.optionIndex);
        const questionKey = input.name;
        const isOther = input.value === '__other__';
        const isMultiSelect = input.type === 'checkbox';

        // Show/hide other text input
        const otherContainer = document.getElementById(`${questionKey}-other-container`);
        if (otherContainer) {
            if (isOther && input.checked) {
                otherContainer.style.display = 'block';
                const textInput = otherContainer.querySelector('.tool-question-text-input');
                if (textInput) textInput.focus();
            } else if (!isMultiSelect) {
                // For radio buttons, hide other container when selecting non-other option
                otherContainer.style.display = 'none';
            } else if (isOther && !input.checked) {
                // For checkboxes, hide when unchecking other
                otherContainer.style.display = 'none';
            }
        }

        // Update stored answers
        if (isMultiSelect) {
            // For multi-select, maintain an array of selected values
            if (!questionData.answers[questionIndex]) {
                questionData.answers[questionIndex] = [];
            }

            if (input.checked) {
                if (isOther) {
                    // Other option - will be populated by text input
                    questionData.answers[questionIndex].push({ isOther: true, value: '' });
                } else {
                    questionData.answers[questionIndex].push(input.value);
                }
            } else {
                // Remove from array
                if (isOther) {
                    questionData.answers[questionIndex] = questionData.answers[questionIndex].filter(
                        v => typeof v !== 'object' || !v.isOther
                    );
                } else {
                    questionData.answers[questionIndex] = questionData.answers[questionIndex].filter(
                        v => v !== input.value
                    );
                }
            }
        } else {
            // For single select, store the selected value
            if (isOther) {
                questionData.answers[questionIndex] = { isOther: true, value: '' };
            } else {
                questionData.answers[questionIndex] = input.value;
            }
        }

        // Update submit button state
        this.updateSubmitButton(toolId);
    },

    /**
     * Handle "Other" text input change
     * @param {HTMLInputElement} input - The text input
     * @param {string} toolId - The tool ID
     * @param {number} questionIndex - The question index
     */
    handleOtherTextChange(input, toolId, questionIndex) {
        const questionData = this.activeQuestions[toolId];
        if (!questionData || questionData.submitted) return;

        const value = input.value.trim();
        const answer = questionData.answers[questionIndex];

        if (Array.isArray(answer)) {
            // Multi-select: find and update the other entry
            const otherEntry = answer.find(v => typeof v === 'object' && v.isOther);
            if (otherEntry) {
                otherEntry.value = value;
            }
        } else if (answer && typeof answer === 'object' && answer.isOther) {
            // Single select with other
            answer.value = value;
        }

        this.updateSubmitButton(toolId);
    },

    /**
     * Update the submit button enabled state
     * @param {string} toolId - The tool ID
     */
    updateSubmitButton(toolId) {
        const questionData = this.activeQuestions[toolId];
        if (!questionData) return;

        const submitBtn = document.getElementById(`${toolId}-submit`);
        if (!submitBtn) return;

        // Check if all questions have answers
        const allAnswered = questionData.questions.every((q, i) => {
            const answer = questionData.answers[i];
            if (Array.isArray(answer)) {
                // Multi-select: at least one valid answer
                return answer.some(v => {
                    if (typeof v === 'object' && v.isOther) {
                        return v.value && v.value.trim().length > 0;
                    }
                    return true;
                }) && answer.length > 0;
            } else if (answer && typeof answer === 'object' && answer.isOther) {
                // Single select with "Other" - needs text
                return answer.value && answer.value.trim().length > 0;
            } else {
                // Single select with regular option
                return answer !== undefined && answer !== null;
            }
        });

        submitBtn.disabled = !allAnswered;
    },

    /**
     * Submit the answers to continue the conversation
     * @param {string} toolId - The tool ID
     */
    submitAnswers(toolId) {
        const questionData = this.activeQuestions[toolId];
        if (!questionData || questionData.submitted) return;

        // Build the response text
        const responseLines = [];
        questionData.questions.forEach((q, i) => {
            const header = q.header || `Question ${i + 1}`;
            const answer = questionData.answers[i];

            let answerText;
            if (Array.isArray(answer)) {
                // Multi-select
                answerText = answer.map(v => {
                    if (typeof v === 'object' && v.isOther) {
                        return v.value;
                    }
                    return v;
                }).join(', ');
            } else if (answer && typeof answer === 'object' && answer.isOther) {
                // Single with "Other"
                answerText = answer.value;
            } else {
                answerText = answer;
            }

            responseLines.push(`**${header}**: ${answerText}`);
        });

        const responseText = responseLines.join('\n');

        // Mark as submitted
        questionData.submitted = true;

        // Update UI to show submitted state
        const card = document.querySelector(`[data-tool-id="${toolId}"]`);
        if (card) {
            card.classList.add('tool-card-question-submitted');

            // Update submit button
            const submitBtn = document.getElementById(`${toolId}-submit`);
            if (submitBtn) {
                submitBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Submitted
                `;
                submitBtn.disabled = true;
                submitBtn.classList.add('submitted');
            }

            // Disable all inputs
            card.querySelectorAll('input').forEach(input => {
                input.disabled = true;
            });
        }

        // Send the response via Terminal's continueWithUserResponse method
        if (typeof Terminal !== 'undefined' && Terminal.continueWithUserResponse) {
            Terminal.continueWithUserResponse(responseText);
        } else {
            console.error('[QuestionRenderer] Terminal.continueWithUserResponse not available');
        }

        console.log('[QuestionRenderer] Submitted answers:', responseText);
    },

    /**
     * Compact preview for streaming indicator
     * @param {Object} tool - Tool call object
     * @returns {string} HTML string for compact preview
     */
    renderPreview(tool) {
        const input = tool.input || {};
        const questions = input.questions || [];

        const icon = ToolIcons.question;
        const color = ToolColors.user;

        const questionCount = questions.length;
        const firstQuestion = questions[0] || {};
        const header = firstQuestion.header || '';
        const questionText = firstQuestion.question || '';

        // Show header or truncated question text
        const displayText = header || BaseRenderer.truncate(questionText, 25) || 'Asking user';

        // Badge for multiple questions
        const badgeHtml = questionCount > 1
            ? `<span class="preview-badge">${questionCount}Q</span>`
            : '';

        return `
            <div class="streaming-tool-preview streaming-tool-question" style="--tool-color: ${color}">
                <span class="preview-icon">${icon}</span>
                <span class="preview-text">${BaseRenderer.escapeHtml(displayText)}</span>
                ${badgeHtml}
            </div>
        `;
    }
};

// Register the renderer
ToolRendererRegistry.register('AskUserQuestion', QuestionRenderer);
