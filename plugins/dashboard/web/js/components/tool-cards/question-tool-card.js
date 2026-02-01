/**
 * Question Tool Card Component - Displays AskUserQuestion interactions
 * @module components/tool-cards/question-tool-card
 */

import { html, css } from 'lit';
import { ToolCardBase, ToolStatus, toolCardBaseStyles } from './tool-card-base.js';

class QuestionToolCard extends ToolCardBase {
    static properties = { ...ToolCardBase.properties, questions: { type: Array }, answers: { type: Object }, _selectedAnswers: { state: true } };

    static styles = [toolCardBaseStyles, css`
        .question-container { margin-bottom: var(--spacing-md, 12px); padding: var(--spacing-md, 12px); background: var(--bg-secondary, #f8f9fa); border-radius: var(--radius-md, 8px); border: 1px solid var(--border-color, #e0e0e0); }
        .question-container:last-child { margin-bottom: 0; }
        .question-header { display: flex; align-items: center; gap: var(--spacing-sm, 8px); margin-bottom: var(--spacing-sm, 8px); }
        .question-badge { display: inline-flex; padding: 2px 8px; background: var(--accent-color, #4a90d9); color: white; border-radius: var(--radius-sm, 4px); font-size: 10px; font-weight: 500; text-transform: uppercase; }
        .question-text { font-size: var(--font-size-md, 14px); font-weight: 500; color: var(--text-primary, #333); line-height: 1.4; }
        .options-list { display: flex; flex-direction: column; gap: var(--spacing-xs, 4px); }
        .option-item { display: flex; align-items: flex-start; gap: var(--spacing-sm, 8px); padding: var(--spacing-sm, 8px); background: var(--bg-primary, white); border: 1px solid var(--border-color, #e0e0e0); border-radius: var(--radius-sm, 4px); cursor: pointer; transition: all 0.15s ease; }
        .option-item:hover { border-color: var(--accent-color, #4a90d9); background: var(--accent-bg, #f0f7ff); }
        .option-item.selected { border-color: var(--accent-color, #4a90d9); background: var(--accent-bg, #f0f7ff); }
        .option-item.answered { opacity: 0.7; cursor: default; }
        .option-checkbox { width: 18px; height: 18px; border: 2px solid var(--border-color, #e0e0e0); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.15s ease; }
        .option-item.selected .option-checkbox { background: var(--accent-color, #4a90d9); border-color: var(--accent-color, #4a90d9); }
        .option-checkbox svg { width: 12px; height: 12px; color: white; opacity: 0; }
        .option-item.selected .option-checkbox svg { opacity: 1; }
        .option-content { flex: 1; }
        .option-label { font-size: var(--font-size-sm, 13px); font-weight: 500; color: var(--text-primary, #333); }
        .option-description { font-size: var(--font-size-xs, 11px); color: var(--text-muted, #999); margin-top: 2px; }
        .answered-badge { display: inline-flex; align-items: center; gap: var(--spacing-xs, 4px); padding: 4px 8px; background: var(--success-bg, #d4edda); color: var(--success-color, #28a745); border-radius: var(--radius-sm, 4px); font-size: var(--font-size-xs, 11px); font-weight: 500; }
        .answered-badge svg { width: 12px; height: 12px; }
    `];

    constructor() { super(); this.toolName = 'Question'; this.questions = []; this.answers = {}; this._selectedAnswers = {}; }

    _updateFromTool() {
        if (!this.tool) return;
        const { input, result, error } = this.tool;
        if (input?.questions) this.questions = input.questions;
        if (result?.answers) this.answers = result.answers;
        if (error) this.status = ToolStatus.ERROR;
        else if (this.tool.status === 'running') this.status = ToolStatus.RUNNING;
        else if (result !== undefined) this.status = ToolStatus.SUCCESS;
    }

    _renderToolIcon() { return html`<svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`; }
    _renderTitle() { return html`<span class="tool-title">User Question</span>`; }
    _renderBadges() { const answered = Object.keys(this.answers).length; if (answered > 0) return html`<span class="badge badge-success">Answered</span>`; if (this.status === ToolStatus.RUNNING) return html`<span class="badge badge-warning">Awaiting</span>`; return ''; }

    _handleOptionClick(questionIndex, optionIndex) {
        if (Object.keys(this.answers).length > 0) return;
        const key = `q${questionIndex}`;
        const question = this.questions[questionIndex];
        if (question?.multiSelect) {
            const current = this._selectedAnswers[key] || [];
            const idx = current.indexOf(optionIndex);
            if (idx >= 0) current.splice(idx, 1); else current.push(optionIndex);
            this._selectedAnswers = { ...this._selectedAnswers, [key]: current };
        } else {
            this._selectedAnswers = { ...this._selectedAnswers, [key]: [optionIndex] };
        }
        this.requestUpdate();
    }

    _isSelected(questionIndex, optionIndex) {
        const key = `q${questionIndex}`;
        const selected = this._selectedAnswers[key] || [];
        return selected.includes(optionIndex);
    }

    _renderContent() {
        const isAnswered = Object.keys(this.answers).length > 0;
        return html`<div class="tool-content">
            ${this.questions.map((q, qIndex) => html`
                <div class="question-container">
                    <div class="question-header">
                        ${q.header ? html`<span class="question-badge">${q.header}</span>` : ''}
                        ${isAnswered ? html`<span class="answered-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>Answered</span>` : ''}
                    </div>
                    <div class="question-text">${q.question}</div>
                    <div class="options-list">
                        ${(q.options || []).map((opt, oIndex) => html`
                            <div class="option-item ${this._isSelected(qIndex, oIndex) ? 'selected' : ''} ${isAnswered ? 'answered' : ''}" @click=${() => this._handleOptionClick(qIndex, oIndex)}>
                                <div class="option-checkbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                                <div class="option-content"><div class="option-label">${opt.label || opt}</div>${opt.description ? html`<div class="option-description">${opt.description}</div>` : ''}</div>
                            </div>
                        `)}
                    </div>
                </div>
            `)}
        </div>`;
    }
}

customElements.define('question-tool-card', QuestionToolCard);
export { QuestionToolCard };
