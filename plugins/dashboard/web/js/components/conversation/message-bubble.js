/**
 * Message Bubble Component - Displays a single message in conversation
 * @module components/conversation/message-bubble
 */

import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

class MessageBubble extends LitElement {
    static properties = {
        message: { type: Object },
        showAvatar: { type: Boolean, attribute: 'show-avatar' },
        user: { type: Boolean, reflect: true },
        streaming: { type: Boolean, reflect: true },
        _lightboxImage: { type: String, state: true }
    };

    static styles = css`
        :host { display: flex; gap: var(--spacing-sm, 8px); margin: var(--spacing-sm, 8px) 0; padding: 0 var(--spacing-md, 12px); animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        :host([user]) { flex-direction: row-reverse; }
        .avatar { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; background: var(--bg-tertiary, #e9ecef); color: var(--text-secondary, #666); }
        :host([user]) .avatar { background: var(--accent-color, #4a90d9); color: white; }
        .avatar svg { width: 18px; height: 18px; }
        .avatar-placeholder { width: 32px; flex-shrink: 0; }
        .bubble { max-width: 80%; min-width: 60px; }
        .header { display: flex; align-items: center; gap: var(--spacing-sm, 8px); margin-bottom: var(--spacing-xs, 4px); font-size: var(--font-size-xs, 11px); color: var(--text-muted, #999); }
        .author { font-weight: 500; color: var(--text-secondary, #666); }
        :host([user]) .author { color: var(--accent-color, #4a90d9); }
        .time { opacity: 0.7; }
        .content-wrapper { padding: var(--spacing-sm, 8px) var(--spacing-md, 12px); border-radius: var(--radius-lg, 12px); background: var(--bg-secondary, #f8f9fa); border: 1px solid var(--border-color, #e0e0e0); }
        :host([user]) .content-wrapper { background: var(--accent-color, #4a90d9); border-color: transparent; color: white; }
        .content { line-height: 1.5; font-size: var(--font-size-sm, 13px); word-wrap: break-word; overflow-wrap: break-word; }
        .content :first-child { margin-top: 0; }
        .content :last-child { margin-bottom: 0; }
        .content p { margin: 0.5em 0; }
        .content code { font-family: var(--font-mono, 'IBM Plex Mono', monospace); font-size: 0.9em; padding: 0.15em 0.4em; background: var(--bg-tertiary, rgba(0, 0, 0, 0.05)); border-radius: 4px; }
        :host([user]) .content code { background: rgba(255, 255, 255, 0.2); }
        .content pre { margin: 0.5em 0; padding: var(--spacing-sm, 8px); background: var(--bg-tertiary, #e9ecef); border-radius: var(--radius-sm, 4px); overflow-x: auto; }
        :host([user]) .content pre { background: rgba(0, 0, 0, 0.1); }
        .content pre code { padding: 0; background: none; }
        .content ul, .content ol { margin: 0.5em 0; padding-left: 1.5em; }
        .content a { color: var(--link-color, #4a90d9); text-decoration: underline; }
        :host([user]) .content a { color: white; }
        :host([streaming]) .content::after { content: ''; display: inline-block; width: 8px; height: 16px; background: currentColor; margin-left: 2px; animation: blink 1s infinite; vertical-align: text-bottom; }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        .tools { margin-top: var(--spacing-sm, 8px); display: flex; flex-direction: column; gap: var(--spacing-xs, 4px); }
        .tool-indicator { display: inline-flex; align-items: center; gap: var(--spacing-xs, 4px); padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); font-size: var(--font-size-xs, 11px); background: var(--bg-tertiary, #e9ecef); border-radius: var(--radius-sm, 4px); color: var(--text-secondary, #666); }
        .tool-indicator.running { background: var(--info-bg, #e7f3ff); color: var(--info-color, #0066cc); }
        .tool-indicator.complete { background: var(--success-bg, #e6f7e6); color: var(--success-color, #28a745); }
        .tool-indicator.error { background: var(--error-bg, #ffe6e6); color: var(--error-color, #dc3545); }
        .tool-indicator svg { width: 12px; height: 12px; }
        :host(:not([streaming])) .bubble:empty { display: none; }

        /* Tool call cards */
        .tool-calls { display: flex; flex-direction: column; gap: var(--spacing-xs, 4px); margin-top: var(--spacing-xs, 4px); }
        .tool-call { padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); background: var(--bg-tertiary, rgba(255, 255, 255, 0.03)); border: 1px solid var(--border-color, #2d2d2d); border-radius: var(--radius-sm, 4px); font-size: var(--font-size-xs, 11px); }
        .tool-call-header { display: flex; align-items: center; gap: var(--spacing-xs, 4px); color: var(--text-secondary, #a0a0a0); }
        .tool-call.has-result .tool-call-header { cursor: pointer; }
        .tool-call.has-result .tool-call-header:hover { color: var(--text-primary, #e0e0e0); }
        .tool-call-name { font-weight: 600; color: var(--accent-color, #4a90d9); }
        .tool-call-desc { opacity: 0.7; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }
        .tool-call-status { margin-left: auto; display: flex; align-items: center; gap: 4px; }
        .tool-call-status.success { color: var(--success-color, #28a745); }
        .tool-call-status.error { color: var(--error-color, #dc3545); }
        .tool-call-status.running { color: var(--info-color, #4a90d9); }
        .tool-call-status.running svg { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .tool-call-result { margin-top: var(--spacing-xs, 4px); padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); background: var(--bg-primary, #1e1e1e); border-radius: var(--radius-sm, 4px); font-family: var(--font-mono, monospace); font-size: 11px; max-height: 120px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; color: var(--text-secondary, #a0a0a0); display: none; }
        .tool-call.expanded .tool-call-result { display: block; }
        .tool-call-chevron { transition: transform 0.15s; font-size: 10px; visibility: hidden; }
        .tool-call.has-result .tool-call-chevron { visibility: visible; }
        .tool-call.expanded .tool-call-chevron { transform: rotate(90deg); }

        /* Thinking block */
        .thinking-block { display: flex; align-items: center; gap: var(--spacing-xs, 4px); padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); font-size: var(--font-size-xs, 11px); color: var(--text-muted, #888); background: var(--bg-tertiary, rgba(255, 255, 255, 0.03)); border-radius: var(--radius-sm, 4px); margin-bottom: var(--spacing-xs, 4px); cursor: pointer; }
        .thinking-block svg { width: 12px; height: 12px; opacity: 0.6; }
        .thinking-content { display: none; margin-top: var(--spacing-xs, 4px); padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px); font-size: 11px; color: var(--text-muted, #888); font-style: italic; max-height: 100px; overflow-y: auto; }
        .thinking-block.expanded + .thinking-content { display: block; }

        /* Error message */
        .error-wrapper { background: var(--error-bg, #2a1a1a); border-color: var(--error-color, #dc3545); }
        .error-wrapper .error-icon { display: inline; margin-right: var(--spacing-xs, 4px); }

        /* Image attachments */
        .attachments {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-sm, 8px);
            margin-bottom: var(--spacing-sm, 8px);
        }
        .attachment-image {
            position: relative;
            border-radius: var(--radius-md, 8px);
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.15s ease;
        }
        .attachment-image:hover {
            transform: scale(1.02);
        }
        .attachment-image img {
            display: block;
            max-width: 280px;
            max-height: 200px;
            object-fit: contain;
            border-radius: var(--radius-md, 8px);
            background: var(--bg-tertiary, #e9ecef);
        }
        :host([user]) .attachment-image img {
            background: rgba(0, 0, 0, 0.1);
        }
        .attachment-image .image-info {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
            color: white;
            font-size: var(--font-size-xs, 11px);
            opacity: 0;
            transition: opacity 0.15s ease;
        }
        .attachment-image:hover .image-info {
            opacity: 1;
        }
        /* Lightbox overlay for full-size image view */
        .lightbox {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-out;
        }
        .lightbox img {
            max-width: 90vw;
            max-height: 90vh;
            object-fit: contain;
            border-radius: var(--radius-md, 8px);
        }
        .lightbox-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.15s ease;
        }
        .lightbox-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .lightbox-close svg {
            width: 24px;
            height: 24px;
        }
    `;

    constructor() { super(); this.message = null; this.showAvatar = true; this.user = false; this.streaming = false; this._lightboxImage = null; this._mdCache = { text: null, result: '' }; }

    updated(changedProperties) { if (changedProperties.has('message') && this.message) this.user = this.message.role === 'user'; }

    _formatTime(ts) { if (!ts) return ''; return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

    _formatContent(text) {
        if (!text) return '';
        if (this._mdCache.text === text) return this._mdCache.result;
        let result;
        if (typeof marked !== 'undefined') { try { result = marked.parse(text, { breaks: true, gfm: true }); } catch { result = this._escapeHtml(text).replace(/\n/g, '<br>'); } }
        else { result = this._escapeHtml(text).replace(/\n/g, '<br>'); }
        this._mdCache = { text, result };
        return result;
    }

    _escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

    _renderAvatar() {
        if (!this.showAvatar) return html`<div class="avatar-placeholder"></div>`;
        if (this.user) return html`<div class="avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`;
        return html`<div class="avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><line x1="12" y1="7" x2="12" y2="11"></line><circle cx="8" cy="16" r="1"></circle><circle cx="16" cy="16" r="1"></circle></svg></div>`;
    }

    _renderTools() {
        const tools = this.message?.tools;
        if (!tools?.length) return '';
        return html`<div class="tools">${tools.map(tool => html`<span class="tool-indicator ${tool.status || 'running'}">${this._getToolIcon(tool)}<span>${tool.name}</span></span>`)}</div>`;
    }

    _getToolDescription(tc) {
        const input = tc.input || {};
        if (tc.name === 'Bash') return input.description || input.command?.slice(0, 80) || '';
        if (tc.name === 'Read') return input.file_path || '';
        if (tc.name === 'Edit') return input.file_path || '';
        if (tc.name === 'Write') return input.file_path || '';
        if (tc.name === 'Glob') return input.pattern || '';
        if (tc.name === 'Grep') return input.pattern || '';
        if (tc.name === 'Agent') return input.description || input.subagent_type || '';
        if (tc.name === 'WebFetch') return input.url || '';
        if (tc.name === 'TaskCreate') return input.subject || '';
        if (tc.name === 'TaskUpdate') return `#${input.taskId} → ${input.status || ''}`;
        if (tc.name === 'Skill') return input.skill || '';
        return Object.values(input).find(v => typeof v === 'string')?.slice(0, 60) || '';
    }

    _toggleToolCall(e) {
        const card = e.currentTarget.closest('.tool-call');
        if (card) card.classList.toggle('expanded');
    }

    _renderToolCalls() {
        const toolCalls = this.message?.tool_calls;
        if (!toolCalls?.length) return '';
        return html`
            <div class="tool-calls">
                ${toolCalls.map(tc => html`
                    <div class="tool-call">
                        <div class="tool-call-header" @click=${this._toggleToolCall}>
                            <span class="tool-call-chevron">&#9654;</span>
                            <span class="tool-call-name">${tc.name}</span>
                            <span class="tool-call-desc">${this._getToolDescription(tc)}</span>
                            ${tc.result != null ? html`
                                <span class="tool-call-status ${tc.is_error ? 'error' : 'success'}">
                                    ${tc.is_error ? '!' : '&#10003;'}
                                </span>
                            ` : ''}
                        </div>
                        ${tc.result != null ? html`
                            <div class="tool-call-result">${typeof tc.result === 'string' ? tc.result.slice(0, 2000) : JSON.stringify(tc.result, null, 2).slice(0, 2000)}</div>
                        ` : ''}
                    </div>
                `)}
            </div>
        `;
    }

    _getToolIcon(tool) {
        if (tool.status === 'error') return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        if (tool.status === 'complete') return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        return html`<svg class="spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>`;
    }

    _formatFileSize(bytes) {
        if (!bytes) return '';
        const units = ['B', 'KB', 'MB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
    }

    _openLightbox(dataUrl) {
        this._lightboxImage = dataUrl;
    }

    _closeLightbox() {
        this._lightboxImage = null;
    }

    _handleLightboxKeydown(e) {
        if (e.key === 'Escape') {
            this._closeLightbox();
        }
    }

    _renderAttachments() {
        const attachments = this.message?.attachments;
        if (!attachments?.length) return '';

        // Filter to only image attachments
        const images = attachments.filter(att => att.type?.startsWith('image/'));
        if (!images.length) return '';

        return html`
            <div class="attachments">
                ${images.map(img => html`
                    <div class="attachment-image"
                         @click=${() => this._openLightbox(img.dataUrl || `data:${img.type};base64,${img.data}`)}
                         title="Click to view full size">
                        <img src=${img.thumbnail || img.dataUrl || `data:${img.type};base64,${img.data}`}
                             alt=${img.name || 'Image attachment'}
                             loading="lazy" />
                        <div class="image-info">
                            ${img.name ? html`<span>${img.name}</span>` : ''}
                            ${img.size ? html`<span> · ${this._formatFileSize(img.size)}</span>` : ''}
                        </div>
                    </div>
                `)}
            </div>
        `;
    }

    _renderLightbox() {
        if (!this._lightboxImage) return '';
        return html`
            <div class="lightbox"
                 @click=${this._closeLightbox}
                 @keydown=${this._handleLightboxKeydown}
                 tabindex="0">
                <button class="lightbox-close" @click=${this._closeLightbox} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <img src=${this._lightboxImage} alt="Full size image" @click=${e => e.stopPropagation()} />
            </div>
        `;
    }

    _renderBlocks(blocks) {
        if (!blocks?.length) return '';
        // Group: render tool_use + tool_result pairs together
        const toolResultMap = new Map();
        for (const b of blocks) {
            if (b.type === 'tool_result') {
                const id = b.toolUseId || b.tool_use_id;
                if (id) toolResultMap.set(id, b);
            }
        }

        return blocks.map(block => {
            switch (block.type) {
                case 'text':
                    return block.text ? html`<div class="content">${unsafeHTML(this._formatContent(block.text))}</div>` : '';
                case 'thinking':
                    return html`
                        <div class="thinking-block" @click=${e => e.currentTarget.classList.toggle('expanded')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            <span>Thinking...</span>
                        </div>
                        ${block.thinking ? html`<div class="thinking-content">${block.thinking.slice(0, 500)}</div>` : ''}
                    `;
                case 'tool_use': {
                    const result = toolResultMap.get(block.id);
                    const hasResult = !!result;
                    return html`
                        <div class="tool-call ${hasResult ? 'has-result' : ''}">
                            <div class="tool-call-header" @click=${hasResult ? this._toggleToolCall : null}>
                                <span class="tool-call-chevron">&#9654;</span>
                                <span class="tool-call-name">${block.name}</span>
                                <span class="tool-call-desc">${this._getToolDescription(block)}</span>
                                ${hasResult ? html`
                                    <span class="tool-call-status ${result.isError || result.is_error ? 'error' : 'success'}">
                                        ${result.isError || result.is_error ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>` : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="20 6 9 17 4 12"></polyline></svg>`}
                                    </span>
                                ` : html`
                                    <span class="tool-call-status running">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                                    </span>
                                `}
                            </div>
                            ${hasResult && (result.content || result.is_error) ? html`
                                <div class="tool-call-result">${String(result.content || '').slice(0, 2000)}</div>
                            ` : ''}
                        </div>
                    `;
                }
                case 'tool_result':
                    // Rendered inline with tool_use above
                    return '';
                case 'image':
                    if (block.source?.data) {
                        const src = `data:${block.source.media_type || 'image/png'};base64,${block.source.data}`;
                        return html`<div class="attachment-image"><img src=${src} alt="Image" loading="lazy" /></div>`;
                    }
                    return '';
                default:
                    return '';
            }
        });
    }

    render() {
        if (!this.message) return '';
        const { role, content, timestamp, blocks, tool_calls, isError } = this.message;

        // Block-based rendering: filter out thinking blocks (handled by thinking indicator)
        const renderableBlocks = blocks?.filter(b => b.type !== 'thinking') || [];
        const hasBlocks = renderableBlocks.length > 0;
        // Legacy rendering
        const hasText = !hasBlocks && content && content.trim && content.trim().length > 0;
        const hasToolCalls = !hasBlocks && tool_calls?.length > 0;

        if (!hasBlocks && !hasText && !hasToolCalls && !this.streaming) return '';

        const author = role === 'user' ? 'You' : 'Claude';
        const wrapperClass = isError ? 'content-wrapper error-wrapper' : 'content-wrapper';
        return html`
            ${this._renderAvatar()}
            <div class="bubble">
                <div class="header">
                    <span class="author">${author}</span>
                    ${timestamp ? html`<span class="time">${this._formatTime(timestamp)}</span>` : ''}
                </div>
                <div class="${wrapperClass}">
                    ${this._renderAttachments()}
                    ${isError ? html`<span class="error-icon">&#9888;</span>` : ''}
                    ${hasBlocks ? this._renderBlocks(renderableBlocks) : html`
                        ${hasText ? html`<div class="content">${unsafeHTML(this._formatContent(content))}</div>` : ''}
                        ${this._renderToolCalls()}
                        ${this._renderTools()}
                    `}
                </div>
            </div>
            ${this._renderLightbox()}
        `;
    }
}

customElements.define('message-bubble', MessageBubble);
export { MessageBubble };
