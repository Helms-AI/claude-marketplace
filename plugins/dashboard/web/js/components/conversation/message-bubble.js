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

    constructor() { super(); this.message = null; this.showAvatar = true; this.user = false; this.streaming = false; this._lightboxImage = null; }

    updated(changedProperties) { if (changedProperties.has('message') && this.message) this.user = this.message.role === 'user'; }

    _formatTime(ts) { if (!ts) return ''; return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

    _formatContent(text) {
        if (!text) return '';
        if (typeof marked !== 'undefined') { try { return marked.parse(text, { breaks: true, gfm: true }); } catch {} }
        return this._escapeHtml(text).replace(/\n/g, '<br>');
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

    render() {
        if (!this.message) return '';
        const { role, content, timestamp } = this.message;
        const author = role === 'user' ? 'You' : 'Claude';
        return html`
            ${this._renderAvatar()}
            <div class="bubble">
                <div class="header">
                    <span class="author">${author}</span>
                    ${timestamp ? html`<span class="time">${this._formatTime(timestamp)}</span>` : ''}
                </div>
                <div class="content-wrapper">
                    ${this._renderAttachments()}
                    <div class="content">${unsafeHTML(this._formatContent(content))}</div>
                    ${this._renderTools()}
                </div>
            </div>
            ${this._renderLightbox()}
        `;
    }
}

customElements.define('message-bubble', MessageBubble);
export { MessageBubble };
