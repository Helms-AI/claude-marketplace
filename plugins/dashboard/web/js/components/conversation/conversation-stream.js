/**
 * Conversation Stream Component
 *
 * Efficiently renders a list of messages using Lit's repeat directive
 * for optimal DOM diffing. Handles auto-scrolling and streaming states.
 *
 * @module components/conversation/conversation-stream
 *
 * @example
 * <conversation-stream
 *   .messages=${messages}
 *   ?streaming=${isStreaming}
 * ></conversation-stream>
 */

import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import './message-bubble.js';

/**
 * Conversation Stream Web Component
 *
 * @fires message-click - When a message is clicked
 * @fires scroll-to-bottom - When scrolled to bottom
 */
class ConversationStream extends LitElement {
    static properties = {
        /** Array of message objects */
        messages: { type: Array },

        /** Whether the stream is currently receiving messages */
        streaming: { type: Boolean },

        /** Whether to auto-scroll to bottom on new messages */
        autoScroll: { type: Boolean, attribute: 'auto-scroll' },

        /** The currently streaming message content */
        streamingContent: { type: String, attribute: 'streaming-content' },

        /** Internal: Whether user has manually scrolled up */
        _userScrolled: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow: hidden;
            position: relative;
        }

        .stream-container {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            scroll-behavior: smooth;
        }

        .stream {
            display: flex;
            flex-direction: column;
            min-height: 100%;
            padding: var(--spacing-md, 12px) 0;
        }

        .messages {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        /* Empty state */
        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl, 32px);
            text-align: center;
            color: var(--text-muted, #999);
        }

        .empty-icon {
            width: 64px;
            height: 64px;
            margin-bottom: var(--spacing-md, 12px);
            opacity: 0.3;
        }

        .empty-title {
            font-size: var(--font-size-lg, 16px);
            font-weight: 500;
            color: var(--text-secondary, #666);
            margin-bottom: var(--spacing-sm, 8px);
        }

        .empty-text {
            font-size: var(--font-size-sm, 13px);
            max-width: 300px;
            line-height: 1.5;
        }

        /* Streaming indicator */
        .streaming-indicator {
            display: none;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            margin: 0 var(--spacing-md, 12px) var(--spacing-sm, 8px);
            background: var(--bg-secondary, #f8f9fa);
            border-radius: var(--radius-md, 8px);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #999);
        }

        :host([streaming]) .streaming-indicator {
            display: flex;
        }

        .streaming-dot {
            width: 6px;
            height: 6px;
            background: var(--accent-color, #4a90d9);
            border-radius: 50%;
            animation: pulse 1.5s ease-in-out infinite;
        }

        .streaming-dot:nth-child(2) {
            animation-delay: 0.2s;
        }

        .streaming-dot:nth-child(3) {
            animation-delay: 0.4s;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            50% {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* Scroll to bottom button */
        .scroll-bottom {
            position: absolute;
            bottom: var(--spacing-md, 12px);
            right: var(--spacing-md, 12px);
            display: none;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: var(--bg-primary, white);
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 50%;
            box-shadow: var(--shadow-md, 0 2px 8px rgba(0, 0, 0, 0.1));
            cursor: pointer;
            transition: all 0.15s ease;
            z-index: 10;
        }

        .scroll-bottom:hover {
            background: var(--bg-secondary, #f8f9fa);
            transform: translateY(-2px);
        }

        .scroll-bottom svg {
            width: 18px;
            height: 18px;
            color: var(--text-secondary, #666);
        }

        :host([user-scrolled]) .scroll-bottom {
            display: flex;
        }

        /* Date separators */
        .date-separator {
            display: flex;
            align-items: center;
            gap: var(--spacing-md, 12px);
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            color: var(--text-muted, #999);
            font-size: var(--font-size-xs, 11px);
        }

        .date-separator::before,
        .date-separator::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--border-color, #e0e0e0);
        }

        /* Loading skeleton */
        .skeleton {
            padding: var(--spacing-md, 12px);
        }

        .skeleton-bubble {
            display: flex;
            gap: var(--spacing-sm, 8px);
            margin-bottom: var(--spacing-md, 12px);
        }

        .skeleton-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--skeleton-bg, #e9ecef);
            animation: shimmer 1.5s infinite;
        }

        .skeleton-content {
            flex: 1;
            max-width: 60%;
        }

        .skeleton-line {
            height: 12px;
            border-radius: 4px;
            background: var(--skeleton-bg, #e9ecef);
            margin-bottom: 8px;
            animation: shimmer 1.5s infinite;
        }

        .skeleton-line:last-child {
            width: 70%;
        }

        @keyframes shimmer {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
    `;

    constructor() {
        super();
        this.messages = [];
        this.streaming = false;
        this.autoScroll = true;
        this.streamingContent = '';
        this._userScrolled = false;
        this._lastMessageCount = 0;
    }

    connectedCallback() {
        super.connectedCallback();
        this._setupScrollObserver();
    }

    updated(changedProperties) {
        if (changedProperties.has('messages')) {
            // Auto-scroll on new messages if enabled and user hasn't scrolled
            if (this.autoScroll && !this._userScrolled && this.messages.length > this._lastMessageCount) {
                this._scrollToBottom();
            }
            this._lastMessageCount = this.messages.length;
        }

        if (changedProperties.has('streamingContent') && this.streaming) {
            // Scroll during streaming
            if (this.autoScroll && !this._userScrolled) {
                this._scrollToBottom();
            }
        }
    }

    /**
     * Set up scroll position observer
     */
    _setupScrollObserver() {
        // Use requestAnimationFrame for efficient scroll handling
        let ticking = false;

        this.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this._checkScrollPosition();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true, capture: true });
    }

    /**
     * Check if user has scrolled away from bottom
     */
    _checkScrollPosition() {
        const container = this.shadowRoot?.querySelector('.stream-container');
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;

        if (atBottom !== !this._userScrolled) {
            this._userScrolled = !atBottom;
            if (this._userScrolled) {
                this.setAttribute('user-scrolled', '');
            } else {
                this.removeAttribute('user-scrolled');
            }
        }
    }

    /**
     * Scroll to bottom of the stream
     */
    _scrollToBottom() {
        requestAnimationFrame(() => {
            const container = this.shadowRoot?.querySelector('.stream-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
                this._userScrolled = false;
                this.removeAttribute('user-scrolled');
            }
        });
    }

    /**
     * Handle click on scroll-to-bottom button
     */
    _handleScrollToBottom() {
        this._scrollToBottom();
    }

    /**
     * Determine if avatar should be shown for a message
     * @param {number} index - Message index
     * @returns {boolean}
     */
    _shouldShowAvatar(index) {
        if (index === 0) return true;
        const prev = this.messages[index - 1];
        const curr = this.messages[index];
        return prev.role !== curr.role;
    }

    /**
     * Render empty state
     */
    _renderEmptyState() {
        return html`
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <div class="empty-title">No messages yet</div>
                <div class="empty-text">
                    Type a message below to start a conversation with Claude.
                </div>
            </div>
        `;
    }

    /**
     * Render streaming message
     */
    _renderStreamingMessage() {
        if (!this.streaming || !this.streamingContent) return '';

        return html`
            <message-bubble
                .message=${{
                    role: 'assistant',
                    content: this.streamingContent,
                    timestamp: Date.now()
                }}
                ?streaming=${true}
                show-avatar
            ></message-bubble>
        `;
    }

    render() {
        const hasMessages = this.messages?.length > 0;

        return html`
            <div class="stream-container" @scroll=${this._checkScrollPosition}>
                <div class="stream">
                    ${!hasMessages && !this.streaming
                        ? this._renderEmptyState()
                        : html`
                            <div class="messages">
                                ${repeat(
                                    this.messages,
                                    (msg) => msg.id || `${msg.role}-${msg.timestamp}`,
                                    (msg, index) => html`
                                        <message-bubble
                                            .message=${msg}
                                            ?user=${msg.role === 'user'}
                                            ?show-avatar=${this._shouldShowAvatar(index)}
                                        ></message-bubble>
                                    `
                                )}
                                ${this._renderStreamingMessage()}
                            </div>
                        `
                    }

                    <div class="streaming-indicator">
                        <span class="streaming-dot"></span>
                        <span class="streaming-dot"></span>
                        <span class="streaming-dot"></span>
                        <span>Claude is thinking...</span>
                    </div>
                </div>
            </div>

            <button
                class="scroll-bottom"
                @click=${this._handleScrollToBottom}
                title="Scroll to bottom"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
        `;
    }
}

customElements.define('conversation-stream', ConversationStream);
export { ConversationStream };
