/**
 * Question Renderer - AskUserQuestion operations
 * Shows interactive question cards that allow users to select answers
 * and continue the conversation
 *
 * Features:
 * - Tabbed interface for multiple questions
 * - Single/multi-select options
 * - "Other" custom text option
 * - Progress indicator
 *
 * Performance optimizations:
 * - DOM element caching
 * - Event delegation (single handler per card)
 * - Batched DOM updates via requestAnimationFrame
 * - SVG symbols for reduced markup
 * - Debounced text input handling
 */

const QuestionRenderer = {
    // Track active question state with cached DOM elements
    activeQuestions: {},

    // Shared SVG symbols (rendered once, referenced many times)
    _svgSymbols: null,

    // Debounce timers
    _debounceTimers: {},

    /**
     * Get or create SVG symbols (singleton pattern)
     * @returns {string} SVG symbol definitions
     */
    getSvgSymbols() {
        if (!this._svgSymbols) {
            this._svgSymbols = `
                <svg style="display:none" xmlns="http://www.w3.org/2000/svg">
                    <symbol id="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </symbol>
                    <symbol id="icon-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </symbol>
                </svg>
            `;
        }
        return this._svgSymbols;
    },

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

        // Determine if we should use tabs (2+ questions) or simple view (1 question)
        const useTabs = questionCount > 1;

        // Build content using array join (faster than string concatenation)
        const contentParts = [];

        if (useTabs) {
            contentParts.push(this.renderTabbedQuestions(questions, toolId));
        } else {
            contentParts.push(this.renderSingleQuestion(questions[0], toolId, 0));
        }

        // Add submit button
        contentParts.push(`
            <div class="tool-question-actions">
                <button class="tool-question-submit" data-action="submit" disabled>
                    <svg width="14" height="14"><use href="#icon-send"></use></svg>
                    Submit Answers
                </button>
            </div>
        `);

        // Store question metadata for later (lightweight - no DOM refs yet)
        // IMPORTANT: Preserve existing state if this is a re-render (prevents losing user selections)
        const existingData = this.activeQuestions[toolId];
        if (existingData && !existingData._cleaned) {
            // Preserve existing answers and state, just update the cache reference
            existingData._cache = null; // Clear stale DOM cache (will be rebuilt on first interaction)
        } else {
            // Fresh question - initialize state
            this.activeQuestions[toolId] = {
                questions: questions,
                answers: {},
                submitted: false,
                currentTab: 0,
                // DOM cache - populated on first interaction
                _cache: null
            };
        }

        // Include SVG symbols once per render
        const symbols = this.getSvgSymbols();

        return `
            ${symbols}
            <details class="tool-card tool-card-question tool-card-question-interactive ${useTabs ? 'tool-card-question-tabbed' : ''}"
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
                <div class="tool-card-body tool-card-body-interactive" onclick="QuestionRenderer.handleCardClick(event, '${toolId}')">
                    ${contentParts.join('')}
                </div>
            </details>
        `;
    },

    /**
     * Render tabbed interface for multiple questions
     * @param {Array} questions - Array of question objects
     * @param {string} toolId - Tool ID
     * @returns {string} HTML string
     */
    renderTabbedQuestions(questions, toolId) {
        // Build tab buttons using array
        const tabButtons = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const header = q.header || `Q${i + 1}`;
            const isActive = i === 0 ? 'active' : '';
            tabButtons.push(`
                <button class="tool-question-tab ${isActive}" data-tab-index="${i}" data-action="tab">
                    <span class="tab-label">${BaseRenderer.escapeHtml(header)}</span>
                    <span class="tab-status">
                        <svg class="tab-check" width="12" height="12"><use href="#icon-check"></use></svg>
                    </span>
                </button>
            `);
        }

        // Build tab panels using array
        const tabPanels = [];
        for (let i = 0; i < questions.length; i++) {
            const isActive = i === 0 ? 'active' : '';
            tabPanels.push(`
                <div class="tool-question-panel ${isActive}" data-panel-index="${i}">
                    ${this.renderSingleQuestion(questions[i], toolId, i)}
                </div>
            `);
        }

        return `
            <div class="tool-question-tabs-container">
                <div class="tool-question-tabs-header">
                    <div class="tool-question-tabs-nav">
                        ${tabButtons.join('')}
                    </div>
                    <div class="tool-question-progress">
                        <span class="progress-text">0 of ${questions.length} answered</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
                <div class="tool-question-tabs-content">
                    ${tabPanels.join('')}
                </div>
            </div>
        `;
    },

    /**
     * Render a single question
     * @param {Object} q - Question object
     * @param {string} toolId - Tool ID
     * @param {number} index - Question index
     * @returns {string} HTML string
     */
    renderSingleQuestion(q, toolId, index) {
        const header = q.header || `Q${index + 1}`;
        const text = q.question || '';
        const options = q.options || [];
        const isMultiSelect = q.multiSelect || false;
        const questionKey = `${toolId}-q${index}`;
        const inputType = isMultiSelect ? 'checkbox' : 'radio';

        // Build options using array (no event handlers - using delegation)
        const optionParts = [];

        if (options.length > 0) {
            optionParts.push(`<div class="tool-question-options tool-question-options-interactive" data-question-key="${questionKey}" data-multi-select="${isMultiSelect}">`);

            for (let optIdx = 0; optIdx < options.length; optIdx++) {
                const opt = options[optIdx];
                const label = opt.label || opt;
                const desc = opt.description || '';
                const inputId = `${questionKey}-opt${optIdx}`;

                optionParts.push(`
                    <label class="tool-question-option tool-question-option-interactive" for="${inputId}">
                        <input type="${inputType}"
                               id="${inputId}"
                               name="${questionKey}"
                               value="${BaseRenderer.escapeHtml(label)}"
                               class="tool-question-input"
                               data-question-index="${index}"
                               data-option-index="${optIdx}">
                        <span class="option-checkbox">
                            ${isMultiSelect ?
                                '<svg width="12" height="12"><use href="#icon-check"></use></svg>' :
                                '<span class="option-radio-dot"></span>'
                            }
                        </span>
                        <span class="option-content">
                            <span class="option-label">${BaseRenderer.escapeHtml(label)}</span>
                            ${desc ? `<span class="option-desc">${BaseRenderer.escapeHtml(desc)}</span>` : ''}
                        </span>
                    </label>
                `);
            }

            // Add "Other" option
            optionParts.push(`
                <label class="tool-question-option tool-question-option-interactive tool-question-option-other" for="${questionKey}-other">
                    <input type="${inputType}"
                           id="${questionKey}-other"
                           name="${questionKey}"
                           value="__other__"
                           class="tool-question-input tool-question-input-other"
                           data-question-index="${index}"
                           data-option-index="-1">
                    <span class="option-checkbox">
                        ${isMultiSelect ?
                            '<svg width="12" height="12"><use href="#icon-check"></use></svg>' :
                            '<span class="option-radio-dot"></span>'
                        }
                    </span>
                    <span class="option-content">
                        <span class="option-label">Other</span>
                        <span class="option-desc">Provide custom response</span>
                    </span>
                </label>
                <div class="tool-question-other-input" data-other-container="${questionKey}" style="display: none;">
                    <input type="text"
                           class="tool-question-text-input"
                           data-other-input="${questionKey}"
                           data-question-index="${index}"
                           placeholder="Type your response...">
                </div>
            `);

            optionParts.push('</div>');
        }

        return `
            <div class="tool-question-item tool-question-item-interactive" data-question-index="${index}">
                <div class="tool-question-header">${BaseRenderer.escapeHtml(header)}</div>
                <div class="tool-question-text">${BaseRenderer.escapeHtml(text)}</div>
                ${optionParts.join('')}
            </div>
        `;
    },

    /**
     * Get or create cached DOM references for a tool
     * @param {string} toolId - Tool ID
     * @returns {Object|null} Cached DOM elements
     */
    getCache(toolId) {
        const questionData = this.activeQuestions[toolId];
        if (!questionData) return null;

        // Lazy initialization of cache
        if (!questionData._cache) {
            const card = document.querySelector(`[data-tool-id="${toolId}"]`);
            if (!card) return null;

            questionData._cache = {
                card: card,
                submitBtn: card.querySelector('.tool-question-submit'),
                tabsContainer: card.querySelector('.tool-question-tabs-container'),
                tabs: card.querySelectorAll('.tool-question-tab'),
                panels: card.querySelectorAll('.tool-question-panel'),
                progress: card.querySelector('.tool-question-progress'),
                progressText: card.querySelector('.progress-text'),
                progressFill: card.querySelector('.progress-fill')
            };
        }

        return questionData._cache;
    },

    /**
     * Event delegation handler for all card interactions
     * @param {Event} event - The event object
     * @param {string} toolId - The tool ID
     */
    handleCardClick(event, toolId) {
        const target = event.target;
        const questionData = this.activeQuestions[toolId];
        if (!questionData || questionData.submitted) return;

        // Handle tab clicks
        const tabBtn = target.closest('[data-action="tab"]');
        if (tabBtn) {
            event.preventDefault();
            const tabIndex = parseInt(tabBtn.dataset.tabIndex);
            this.switchTab(toolId, tabIndex);
            return;
        }

        // Handle submit button
        const submitBtn = target.closest('[data-action="submit"]');
        if (submitBtn && !submitBtn.disabled) {
            event.preventDefault();
            this.submitAnswers(toolId);
            return;
        }

        // Handle radio/checkbox changes (bubbled from input)
        const input = target.closest('.tool-question-input');
        if (input && (input.type === 'radio' || input.type === 'checkbox')) {
            // Use requestAnimationFrame to batch the DOM updates
            requestAnimationFrame(() => {
                this.handleOptionChange(input, toolId);
            });
            return;
        }

        // Handle text input for "Other" option (with debounce)
        const textInput = target.closest('[data-other-input]');
        if (textInput) {
            this.handleOtherTextInput(textInput, toolId);
            return;
        }
    },

    /**
     * Handle text input changes with debouncing
     * @param {HTMLInputElement} input - The text input
     * @param {string} toolId - The tool ID
     */
    handleOtherTextInput(input, toolId) {
        const questionIndex = parseInt(input.dataset.questionIndex);
        const debounceKey = `${toolId}-${questionIndex}`;

        // Clear existing timer
        if (this._debounceTimers[debounceKey]) {
            clearTimeout(this._debounceTimers[debounceKey]);
        }

        // Debounce the update (150ms)
        this._debounceTimers[debounceKey] = setTimeout(() => {
            this.handleOtherTextChange(input, toolId, questionIndex);
            delete this._debounceTimers[debounceKey];
        }, 150);
    },

    /**
     * Switch to a different tab (optimized with caching)
     * @param {string} toolId - Tool ID
     * @param {number} tabIndex - Tab index to switch to
     */
    switchTab(toolId, tabIndex) {
        const questionData = this.activeQuestions[toolId];
        if (!questionData || questionData.submitted) return;
        if (questionData.currentTab === tabIndex) return; // No-op if same tab

        const cache = this.getCache(toolId);
        if (!cache || !cache.tabs.length) return;

        // Batch DOM updates
        requestAnimationFrame(() => {
            // Update tabs
            cache.tabs.forEach((tab, i) => {
                tab.classList.toggle('active', i === tabIndex);
            });

            // Update panels
            cache.panels.forEach((panel, i) => {
                panel.classList.toggle('active', i === tabIndex);
            });

            questionData.currentTab = tabIndex;
        });
    },

    /**
     * Handle option selection change (optimized)
     * @param {HTMLInputElement} input - The changed input element
     * @param {string} toolId - The tool ID
     */
    handleOptionChange(input, toolId) {
        const questionData = this.activeQuestions[toolId];
        if (!questionData || questionData.submitted) return;

        const questionIndex = parseInt(input.dataset.questionIndex);
        const questionKey = input.name;
        const isOther = input.value === '__other__';
        const isMultiSelect = input.type === 'checkbox';

        // Show/hide other text input (use cached lookup)
        const cache = this.getCache(toolId);
        const otherContainer = cache?.card?.querySelector(`[data-other-container="${questionKey}"]`);

        if (otherContainer) {
            if (isOther && input.checked) {
                otherContainer.style.display = 'block';
                const textInput = otherContainer.querySelector('.tool-question-text-input');
                if (textInput) textInput.focus();
            } else if (!isMultiSelect) {
                otherContainer.style.display = 'none';
            } else if (isOther && !input.checked) {
                otherContainer.style.display = 'none';
            }
        }

        // Update stored answers
        if (isMultiSelect) {
            if (!questionData.answers[questionIndex]) {
                questionData.answers[questionIndex] = [];
            }

            if (input.checked) {
                if (isOther) {
                    questionData.answers[questionIndex].push({ isOther: true, value: '' });
                } else {
                    questionData.answers[questionIndex].push(input.value);
                }
            } else {
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
            if (isOther) {
                questionData.answers[questionIndex] = { isOther: true, value: '' };
            } else {
                questionData.answers[questionIndex] = input.value;
            }
        }

        // Batch all UI updates in a single frame
        this.batchUpdateUI(toolId, questionIndex);
    },

    /**
     * Batch UI updates into a single animation frame
     * @param {string} toolId - Tool ID
     * @param {number} questionIndex - Question index that changed
     */
    batchUpdateUI(toolId, questionIndex) {
        requestAnimationFrame(() => {
            const questionData = this.activeQuestions[toolId];
            if (!questionData) return;

            const cache = this.getCache(toolId);
            if (!cache) return;

            // Update submit button
            const allAnswered = questionData.questions.every((_, i) =>
                this.isQuestionAnswered(questionData, i)
            );
            if (cache.submitBtn) {
                cache.submitBtn.disabled = !allAnswered;
            }

            // Update tab status (if tabbed)
            if (cache.tabs.length > 0 && questionIndex !== undefined) {
                const isAnswered = this.isQuestionAnswered(questionData, questionIndex);
                const tab = cache.tabs[questionIndex];
                if (tab) {
                    tab.classList.toggle('answered', isAnswered);
                }
            }

            // Update progress (if tabbed)
            if (cache.progressText && cache.progressFill) {
                const answeredCount = questionData.questions.filter((_, i) =>
                    this.isQuestionAnswered(questionData, i)
                ).length;
                const totalCount = questionData.questions.length;
                const percentage = (answeredCount / totalCount) * 100;

                cache.progressText.textContent = `${answeredCount} of ${totalCount} answered`;
                cache.progressFill.style.width = `${percentage}%`;
            }
        });
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
            const otherEntry = answer.find(v => typeof v === 'object' && v.isOther);
            if (otherEntry) {
                otherEntry.value = value;
            }
        } else if (answer && typeof answer === 'object' && answer.isOther) {
            answer.value = value;
        }

        this.batchUpdateUI(toolId, questionIndex);
    },

    /**
     * Check if a question has a valid answer
     * @param {Object} questionData - Question data
     * @param {number} index - Question index
     * @returns {boolean} True if answered
     */
    isQuestionAnswered(questionData, index) {
        const answer = questionData.answers[index];
        if (Array.isArray(answer)) {
            return answer.length > 0 && answer.some(v => {
                if (typeof v === 'object' && v.isOther) {
                    return v.value && v.value.trim().length > 0;
                }
                return true;
            });
        } else if (answer && typeof answer === 'object' && answer.isOther) {
            return answer.value && answer.value.trim().length > 0;
        } else {
            return answer !== undefined && answer !== null;
        }
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
        for (let i = 0; i < questionData.questions.length; i++) {
            const q = questionData.questions[i];
            const header = q.header || `Question ${i + 1}`;
            const answer = questionData.answers[i];

            let answerText;
            if (Array.isArray(answer)) {
                answerText = answer.map(v => {
                    if (typeof v === 'object' && v.isOther) {
                        return v.value;
                    }
                    return v;
                }).join(', ');
            } else if (answer && typeof answer === 'object' && answer.isOther) {
                answerText = answer.value;
            } else {
                answerText = answer;
            }

            responseLines.push(`**${header}**: ${answerText}`);
        }

        const responseText = responseLines.join('\n');

        // Mark as submitted
        questionData.submitted = true;

        // Get cached elements
        const cache = this.getCache(toolId);

        // Batch all DOM updates
        requestAnimationFrame(() => {
            if (cache?.card) {
                cache.card.classList.add('tool-card-question-submitted');

                if (cache.submitBtn) {
                    cache.submitBtn.innerHTML = `
                        <svg width="14" height="14"><use href="#icon-check"></use></svg>
                        Submitted
                    `;
                    cache.submitBtn.disabled = true;
                    cache.submitBtn.classList.add('submitted');
                }

                // Disable all inputs at once
                const inputs = cache.card.querySelectorAll('input');
                for (let i = 0; i < inputs.length; i++) {
                    inputs[i].disabled = true;
                }

                // Disable all tabs
                if (cache.tabs) {
                    for (let i = 0; i < cache.tabs.length; i++) {
                        cache.tabs[i].disabled = true;
                    }
                }
            }
        });

        // Send the response via Terminal's continueWithUserResponse method
        if (typeof Terminal !== 'undefined' && Terminal.continueWithUserResponse) {
            Terminal.continueWithUserResponse(responseText);
        } else {
            console.error('[QuestionRenderer] Terminal.continueWithUserResponse not available');
        }

        // Clean up after a delay (memory management)
        setTimeout(() => {
            this.cleanup(toolId);
        }, 5000);

        console.log('[QuestionRenderer] Submitted answers:', responseText);
    },

    /**
     * Clean up resources for a submitted question
     * @param {string} toolId - Tool ID
     */
    cleanup(toolId) {
        const questionData = this.activeQuestions[toolId];
        if (questionData && questionData.submitted) {
            // Clear cache references to allow GC
            if (questionData._cache) {
                questionData._cache = null;
            }
            // Keep minimal data for reference
            this.activeQuestions[toolId] = {
                submitted: true,
                _cleaned: true
            };
        }
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

        const displayText = header || BaseRenderer.truncate(questionText, 25) || 'Asking user';

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
