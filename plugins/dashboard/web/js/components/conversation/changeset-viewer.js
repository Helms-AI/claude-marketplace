/**
 * Changeset Viewer Component - Full conversation viewer for selected changesets
 * Renders conversation transcripts with tool calls, subagent context, and view modes
 * @module components/conversation/changeset-viewer
 */

import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { SignalWatcher } from '../core/signal-watcher.js';
import { AppStore, Actions } from '../../store/app-state.js';
import { ChangesetService } from '../../services/changeset-service.js';
import { SDKClient } from '../../services/sdk-client.js';
import '../common/changeset-name.js';
import '../molecules/tool-activity-badge.js';
import '../terminal/terminal-input.js';
import {
    filterInlineTools,
    filterAsideTools,
    hasAsideTools,
    getAsideToolNamesSummary
} from '../../services/tool-render-service.js';

// Domain configuration
const DOMAIN_CONFIG = {
    'pm': { initial: 'PM', color: '#6366f1' },
    'user-experience': { initial: 'UX', color: '#f472b6' },
    'frontend': { initial: 'FE', color: '#22d3ee' },
    'backend': { initial: 'BE', color: '#4ade80' },
    'architecture': { initial: 'AR', color: '#a78bfa' },
    'testing': { initial: 'QA', color: '#facc15' },
    'devops': { initial: 'DO', color: '#fb923c' },
    'data': { initial: 'DA', color: '#60a5fa' },
    'security': { initial: 'SC', color: '#f87171' },
    'documentation': { initial: 'DC', color: '#a3e635' }
};

class ChangesetViewer extends SignalWatcher(LitElement) {
    static properties = {
        changesetId: { type: String, attribute: 'changeset-id' },
        _changeset: { type: Object, state: true },
        _events: { type: Array, state: true },
        _transcript: { type: Object, state: true },
        _viewMode: { type: String, state: true },
        _loading: { type: Boolean, state: true },
        _autoScroll: { type: Boolean, state: true }
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: var(--bg-primary, #fff);
        }

        /* Header */
        .viewer-header {
            flex-shrink: 0;
            padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
            border-bottom: 1px solid var(--border-color, #e0e0e0);
            background: var(--bg-secondary, #f8f9fa);
        }

        .header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--spacing-md, 12px);
        }

        .header-identity {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            min-width: 0;
        }

        .changeset-id {
            font-size: var(--font-size-sm, 13px);
            min-width: 0;
            overflow: hidden;
        }

        .phase-badge {
            padding: 2px 8px;
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            border-radius: var(--radius-sm, 4px);
            background: var(--bg-tertiary, #e9ecef);
            color: var(--text-secondary, #666);
            text-transform: uppercase;
        }

        .phase-badge.active { background: #0284c7; color: white; }
        .phase-badge.completed { background: #166534; color: white; }
        .phase-badge.design { background: #fce7f3; color: #be185d; }
        .phase-badge.implementation { background: var(--warning-bg, #fff3cd); color: var(--warning-color, #856404); }
        .phase-badge.pending { background: var(--warning-bg, #fff3cd); color: var(--warning-color, #856404); }
        .phase-badge.error, .phase-badge.failed { background: var(--error-bg, #fee2e2); color: var(--error-color, #dc2626); }
        .phase-badge.planning { background: #ede9fe; color: #7c3aed; }
        .phase-badge.review { background: #fef3c7; color: #d97706; }

        .header-actions {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
        }

        /* View Toggle */
        .view-toggle {
            display: flex;
            background: var(--bg-tertiary, #e9ecef);
            border-radius: var(--radius-sm, 4px);
            padding: 2px;
        }

        .view-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 24px;
            border: none;
            background: transparent;
            color: var(--text-muted, #999);
            cursor: pointer;
            border-radius: var(--radius-xs, 2px);
            transition: all 0.15s ease;
        }

        .view-btn:hover { color: var(--text-secondary, #666); }
        .view-btn.active { background: var(--bg-primary, white); color: var(--accent-color, #4a90d9); box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.1)); }
        .view-btn svg { width: 14px; height: 14px; }

        /* Stats */
        .header-stats {
            display: flex;
            align-items: center;
            gap: var(--spacing-md, 12px);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #999);
        }

        .stat { display: flex; align-items: center; gap: 4px; }
        .stat svg { width: 12px; height: 12px; }

        /* Domains */
        .domains-inline {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
        }

        .domain-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 20px;
            font-size: 10px;
            font-weight: 600;
            border-radius: var(--radius-sm, 4px);
            color: white;
        }

        /* Conversation Container */
        .conversation-container {
            flex: 1;
            min-height: 0; /* Critical for flex layout with terminal-input */
            overflow-y: auto;
            overflow-x: hidden;
            padding: var(--spacing-md, 12px);
        }

        /* Terminal Input Integration */
        terminal-input {
            flex-shrink: 0;
            border-top: 2px solid var(--accent-color, #007acc);
        }

        /* Chat Stream - matches original vanilla JS */
        .chat-stream {
            padding: var(--spacing-lg, 16px);
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md, 12px);
        }

        /* Messages - chat-message style from original */
        .message {
            display: flex;
            gap: var(--spacing-md, 12px);
            animation: messageSlideIn 0.3s ease;
        }

        @keyframes messageSlideIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .message.consecutive { margin-top: calc(-1 * var(--spacing-xs, 4px)); }
        .message.consecutive .avatar { visibility: hidden; }
        .message.consecutive .avatar-spacer { display: block; }

        /* Message Avatars - exact match to original */
        .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: var(--agent-color, var(--accent-color, #007acc));
            position: relative;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .avatar-spacer {
            width: 36px;
            flex-shrink: 0;
        }

        .avatar-initial {
            font-size: var(--font-size-sm, 12px);
            font-weight: 600;
            color: white;
            text-transform: uppercase;
        }

        .avatar.user {
            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        }

        .avatar-pulse {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 10px;
            height: 10px;
            background: var(--success-color, #4ade80);
            border-radius: 50%;
            border: 2px solid var(--bg-primary, #fff);
        }

        /* Message Body - exact match to original */
        .message-body {
            flex: 1;
            min-width: 0;
        }

        .message-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            margin-bottom: var(--spacing-xs, 4px);
        }

        .message.consecutive .message-header { display: flex; }
        .message.consecutive .message-header .message-author,
        .message.consecutive .message-header .subagent-badge { display: none; }

        .message-author {
            font-weight: 600;
            font-size: var(--font-size-sm, 12px);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--agent-color, var(--accent-color, #007acc));
        }

        .message-author.user {
            color: var(--text-muted, #8b8b8b);
        }


        /* Subagent Badge - exact match */
        .subagent-badge {
            font-size: var(--font-size-xs, 11px);
            padding: 2px 8px;
            background: var(--agent-color, #a78bfa);
            color: white;
            border-radius: 10px;
            font-weight: 500;
        }

        /* Message Content Styling - exact match */
        .message-content {
            font-size: var(--font-size-md, 13px);
            line-height: 1.7;
            color: var(--text-primary, #1e1e1e);
            word-break: break-word;
        }

        /* User Message Styling */
        .message.user-message .message-content {
            background: var(--bg-secondary, #f3f3f3);
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            border-radius: var(--radius-lg, 8px);
            border-top-left-radius: var(--radius-sm, 4px);
            border: 1px solid var(--border-color, #e1e4e8);
        }

        /* Agent Message Styling */
        .message.agent-message .message-content {
            background: linear-gradient(135deg, rgba(0, 122, 204, 0.05) 0%, rgba(0, 122, 204, 0.02) 100%);
            padding: var(--spacing-md, 12px) var(--spacing-lg, 16px);
            border-radius: var(--radius-lg, 8px);
            border-top-left-radius: var(--radius-sm, 4px);
            border: 1px solid rgba(0, 122, 204, 0.1);
        }

        /* Subagent Message Styling */
        .message.subagent-message .message-content {
            background: linear-gradient(135deg, rgba(167, 139, 250, 0.08) 0%, rgba(167, 139, 250, 0.03) 100%);
            border: 1px solid rgba(167, 139, 250, 0.15);
        }

        /* Subagent indentation and visual threading */
        .message.subagent-indent {
            margin-left: var(--spacing-xl, 24px);
            position: relative;
        }

        .message.subagent-indent::before {
            content: '';
            position: absolute;
            left: -16px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--agent-color, #a78bfa);
            border-radius: 1px;
            opacity: 0.5;
        }

        .message-content p { margin: 0.5em 0; }
        .message-content p:first-child { margin-top: 0; }
        .message-content p:last-child { margin-bottom: 0; }

        .message-content code {
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: 0.9em;
            padding: 2px 6px;
            background: var(--bg-tertiary, #e8e8e8);
            border-radius: var(--radius-sm, 4px);
            color: var(--accent-color, #007acc);
        }

        .message-content pre {
            background: var(--bg-tertiary, #e8e8e8);
            border: 1px solid var(--border-color, #e1e4e8);
            border-radius: var(--radius-md, 6px);
            padding: var(--spacing-md, 12px);
            margin: var(--spacing-md, 12px) 0;
            overflow-x: auto;
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: var(--font-size-sm, 12px);
            line-height: 1.5;
        }

        .message-content pre code {
            background: transparent;
            padding: 0;
            color: inherit;
        }

        /* Transcript Text Formatting */
        .transcript-text {
            word-break: break-word;
        }

        .transcript-text br {
            content: '';
            display: block;
            margin-top: var(--spacing-sm, 8px);
        }

        /* Subagent Context Markers - exact match to original */
        .subagent-context {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            margin: var(--spacing-lg, 16px) 0;
            padding: 0 var(--spacing-md, 12px);
            position: relative;
        }

        .subagent-line {
            flex: 1;
            height: 1px;
            background: linear-gradient(
                to right,
                transparent,
                var(--agent-color, var(--border-color, #e1e4e8)),
                transparent
            );
        }

        .subagent-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs, 4px);
            padding: 4px 12px;
            font-size: var(--font-size-xs, 11px);
            font-weight: 500;
            color: var(--agent-color, var(--text-muted, #8b8b8b));
            background: var(--bg-secondary, #f3f3f3);
            border-radius: 999px;
            border: 1px solid var(--agent-color, var(--border-color, #e1e4e8));
            white-space: nowrap;
        }

        .subagent-label svg { width: 12px; height: 12px; opacity: 0.7; }

        .subagent-context.start .subagent-label {
            animation: contextStart 0.3s ease-out;
        }

        .subagent-context.end .subagent-label {
            color: var(--success-color, #4ade80);
            animation: contextEnd 0.3s ease-out;
        }

        @keyframes contextStart {
            from { opacity: 0; transform: translateX(-10px); }
            to { opacity: 1; transform: translateX(0); }
        }

        @keyframes contextEnd {
            from { opacity: 0; transform: translateX(10px); }
            to { opacity: 1; transform: translateX(0); }
        }

        /* Tool Cards - simplified without container */
        .tool-cards {
            margin-top: var(--spacing-sm, 8px);
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs, 4px);
        }

        /* Aside tools badge indicator */
        .aside-tools-indicator {
            margin-top: var(--spacing-sm, 8px);
            display: flex;
            align-items: center;
        }

        .tool-card {
            background: transparent;
            border: none;
            overflow: hidden;
        }

        .tool-card-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) 0;
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: var(--font-size-sm, 12px);
        }

        .tool-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            background: var(--accent-color, #007acc);
            border-radius: var(--radius-sm, 4px);
            color: white;
        }

        .tool-icon svg { width: 12px; height: 12px; }

        .tool-name {
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-weight: 600;
            color: var(--accent-color, #007acc);
        }

        .tool-badge {
            padding: 1px 6px;
            background: var(--bg-tertiary, #e8e8e8);
            border-radius: var(--radius-xs, 2px);
            color: var(--text-muted, #8b8b8b);
            font-size: var(--font-size-xs, 11px);
        }

        .tool-content {
            padding-left: 28px;
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: var(--font-size-sm, 12px);
            color: var(--text-secondary, #616161);
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 150px;
            overflow-y: auto;
        }

        /* Empty & Loading States */
        .empty-state, .loading-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl, 32px);
            text-align: center;
            color: var(--text-muted, #8b8b8b);
        }

        .empty-icon { width: 64px; height: 64px; margin-bottom: var(--spacing-md, 12px); opacity: 0.3; }
        .empty-title { font-size: var(--font-size-lg, 14px); font-weight: 500; color: var(--text-secondary, #616161); margin-bottom: var(--spacing-sm, 8px); }
        .empty-text { font-size: var(--font-size-md, 13px); max-width: 300px; line-height: 1.5; }

        /* Empty Terminal State - matches original */
        .conversation-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
        }

        .empty-terminal {
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            color: var(--text-muted, #8b8b8b);
        }

        .terminal-line {
            margin-bottom: var(--spacing-xs, 4px);
        }

        .terminal-cursor {
            display: inline-block;
            width: 8px;
            height: 14px;
            background: var(--accent-color, #007acc);
            animation: blink 1s step-end infinite;
            margin-left: 4px;
        }

        @keyframes blink {
            50% { opacity: 0; }
        }

        .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid var(--border-color, #e1e4e8);
            border-top-color: var(--accent-color, #007acc);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Scroll to bottom button */
        .scroll-bottom {
            position: absolute;
            bottom: var(--spacing-md, 12px);
            right: var(--spacing-lg, 24px);
            display: none;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            background: var(--bg-primary, white);
            border: 1px solid var(--border-color, #e1e4e8);
            border-radius: 50%;
            box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.07));
            cursor: pointer;
            z-index: 10;
        }

        .scroll-bottom:hover { background: var(--bg-secondary, #f3f3f3); }
        .scroll-bottom svg { width: 18px; height: 18px; color: var(--text-secondary, #616161); }
        :host([user-scrolled]) .scroll-bottom { display: flex; }

        /* Animations for new messages */
        .message.animate-in,
        .subagent-context.animate-in {
            animation: messageSlideIn 0.3s ease forwards;
        }

        .message.new-message,
        .subagent-context.new-message {
            animation-delay: 0s;
        }

        /* Decision Cards - restored from original conversation.js */
        .chat-decision {
            display: flex;
            gap: var(--spacing-md, 12px);
            margin: var(--spacing-md, 12px) 0;
            animation: messageSlideIn 0.3s ease;
        }

        .decision-marker {
            display: flex;
            align-items: flex-start;
            padding-top: var(--spacing-sm, 8px);
        }

        .decision-card {
            flex: 1;
            background: linear-gradient(135deg, rgba(74, 222, 128, 0.08) 0%, rgba(74, 222, 128, 0.02) 100%);
            border: 1px solid rgba(74, 222, 128, 0.2);
            border-left: 3px solid var(--domain-color, var(--success-color, #4ade80));
            border-radius: var(--radius-md, 8px);
            padding: var(--spacing-md, 12px);
        }

        .decision-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            margin-bottom: var(--spacing-sm, 8px);
        }

        .decision-label {
            font-size: var(--font-size-xs, 11px);
            font-weight: 700;
            color: var(--success-color, #4ade80);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .decision-domain-pill {
            font-size: var(--font-size-xs, 11px);
            padding: 2px 8px;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            text-transform: capitalize;
        }

        .decision-time {
            margin-left: auto;
            font-family: var(--font-mono, 'IBM Plex Mono', monospace);
            font-size: var(--font-size-xs, 11px);
            color: var(--text-muted, #8b8b8b);
        }

        .decision-text {
            font-size: var(--font-size-md, 13px);
            font-weight: 500;
            color: var(--text-primary, #1e1e1e);
            line-height: 1.5;
        }

        .decision-rationale {
            margin-top: var(--spacing-sm, 8px);
            padding-top: var(--spacing-sm, 8px);
            border-top: 1px solid rgba(74, 222, 128, 0.2);
            font-size: var(--font-size-sm, 12px);
            color: var(--text-secondary, #616161);
        }

        .rationale-label {
            font-weight: 600;
            color: var(--text-muted, #8b8b8b);
            margin-right: var(--spacing-xs, 4px);
        }

        /* Handoff Divider - restored from original */
        .chat-divider.handoff-divider {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            margin: var(--spacing-lg, 16px) 0;
            animation: messageSlideIn 0.3s ease;
        }

        .divider-line {
            flex: 1;
            height: 1px;
            background: var(--border-color, #e1e4e8);
        }

        .handoff-indicator {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm, 8px);
            padding: var(--spacing-xs, 4px) var(--spacing-md, 12px);
            background: var(--bg-secondary, #f3f3f3);
            border-radius: 999px;
            border: 1px solid var(--border-color, #e1e4e8);
        }

        .handoff-from, .handoff-to {
            display: flex;
            align-items: center;
        }

        .handoff-arrow {
            color: var(--text-muted, #8b8b8b);
        }
    `;

    constructor() {
        super();
        this.changesetId = null;
        this._changeset = null;
        this._events = [];
        this._transcript = null;
        this._viewMode = 'unified';
        this._loading = false;
        this._autoScroll = true;
        this._agentMetadata = {};
        this._processedEventIds = new Set(); // Track which SSE events we've already processed
    }

    connectedCallback() {
        super.connectedCallback();
        this.watchSignals([
            AppStore.selectedChangeset,
            AppStore.conversationEvents,
            AppStore.transcript,
            AppStore.conversationViewMode,
            AppStore.loadingConversation
        ]);

        // Track previous event count for auto-scroll on new events
        this._prevEventCount = 0;
    }

    willUpdate(changedProperties) {
        super.willUpdate && super.willUpdate(changedProperties);

        // Process new SSE events and append to merged timeline for real-time updates
        const storeEvents = AppStore.conversationEvents.value || [];
        const currentEventCount = storeEvents.length;

        if (currentEventCount > this._prevEventCount) {
            // Process only new events
            const newEvents = storeEvents.slice(this._prevEventCount);
            this._processRealtimeEvents(newEvents);

            // Schedule scroll after render if auto-scroll is enabled
            if (this._autoScroll) {
                this.updateComplete.then(() => this._scrollToBottom());
            }
        }
        this._prevEventCount = currentEventCount;
    }

    /**
     * Process real-time SSE events and append to local transcript timeline
     * This enables unified view to update in real-time without full re-fetch
     */
    _processRealtimeEvents(newEvents) {
        if (!newEvents?.length) return;

        // Only process transcript_message events for the unified timeline
        for (const event of newEvents) {
            // Skip if already processed (dedup by id)
            if (event.id && this._processedEventIds.has(event.id)) continue;
            if (event.id) this._processedEventIds.add(event.id);

            // Handle transcript_message events - append to merged timeline
            if (event.type === 'transcript_message' && event.message) {
                this._appendToTimeline(event.message, event.source || 'main');
            }
        }

        // Trigger re-render by creating a new transcript reference
        if (this._transcript) {
            this._transcript = { ...this._transcript };
            this.requestUpdate(); // Explicitly request re-render
        }
    }

    /**
     * Append a message to the merged timeline
     */
    _appendToTimeline(message, source) {
        if (!this._transcript) {
            // Initialize transcript if not loaded yet
            this._transcript = {
                messages: [],
                subagents: {},
                merged_timeline: [],
                agent_metadata: {}
            };
        }

        // Ensure merged_timeline exists
        if (!this._transcript.merged_timeline) {
            this._transcript.merged_timeline = [];
        }

        // Create timeline entry matching the format from transcript reader
        const timelineEntry = {
            message: {
                role: message.role,
                text: message.text || '',
                tool_calls: message.tool_calls || [],
                timestamp: message.timestamp
            },
            source: source,
            timestamp: message.timestamp
        };

        this._transcript.merged_timeline.push(timelineEntry);
        console.log(`[ChangesetViewer] Appended ${message.role} message from ${source} to timeline`);
    }

    updated(changedProperties) {
        if (changedProperties.has('changesetId') && this.changesetId) {
            this._loadChangeset();
        }
    }

    async _loadChangeset() {
        if (!this.changesetId) return;

        this._loading = true;

        try {
            // Find changeset in store or use selected changeset
            let changeset = AppStore.changesets.value.find(c => c.id === this.changesetId);

            // Fall back to selectedChangeset if not found in store
            if (!changeset && AppStore.selectedChangeset.value?.id === this.changesetId) {
                changeset = AppStore.selectedChangeset.value;
            }

            if (changeset) {
                this._changeset = changeset;
                // Only load data, don't open another tab (we're already in one!)
                await ChangesetService.select(changeset, {
                    loadConversation: false,  // We load below
                    watch: true,
                    openTab: false  // Important: Don't try to open tab again
                });
            }

            // Load transcript with merged timeline
            const transcript = await ChangesetService.fetchTranscript(this.changesetId, { mergeTimeline: true });
            this._transcript = transcript;
            this._agentMetadata = transcript?.agent_metadata || {};

            // Load events
            const conversation = await ChangesetService.fetchConversation(this.changesetId);
            this._events = conversation?.events || [];

        } catch (error) {
            console.error('[ChangesetViewer] Failed to load changeset:', error);
        } finally {
            this._loading = false;
            this._scrollToBottom();
        }
    }

    _scrollToBottom() {
        requestAnimationFrame(() => {
            const container = this.shadowRoot?.querySelector('.conversation-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        });
    }

    _handleScroll(e) {
        const container = e.target;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const atBottom = scrollHeight - scrollTop - clientHeight < 50;
        this._autoScroll = atBottom;

        if (atBottom) {
            this.removeAttribute('user-scrolled');
        } else {
            this.setAttribute('user-scrolled', '');
        }
    }

    _setViewMode(mode) {
        this._viewMode = mode;
        Actions.setConversationViewMode(mode);
    }

    _getAgentInfo(agentId) {
        const info = this._agentMetadata[agentId] || {};
        const type = info.type || agentId;
        const domain = info.domain || this._inferDomain(type);
        const config = domain ? DOMAIN_CONFIG[domain] : null;

        return {
            name: info.name || this._formatName(type),
            domain,
            color: config?.color || '#a78bfa',
            initial: this._getInitial(info.name || type)
        };
    }

    _inferDomain(type) {
        const map = { 'Explore': 'pm', 'Plan': 'architecture', 'Bash': 'devops', 'general-purpose': 'pm' };
        return map[type] || null;
    }

    _formatName(type) {
        if (!type) return 'Agent';
        if (/^[a-f0-9]+$/.test(type) && type.length <= 8) return `Agent ${type}`;
        return type.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    _getInitial(name) {
        if (!name) return 'AG';
        if (/^[a-f0-9]+$/.test(name) && name.length <= 8) return name.substring(0, 2).toUpperCase();
        const words = name.split(/[\s-_]+/);
        return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
    }

    _formatTime(timestamp) {
        if (!timestamp) return '--:--';
        return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }

    _formatContent(text) {
        if (!text) return '';
        // Remove system tags
        let processed = text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '');
        processed = processed.replace(/<command-message>([\s\S]*?)<\/command-message>/g, '$1');
        processed = processed.replace(/<command-name>([\s\S]*?)<\/command-name>/g, '**/$1**');

        if (typeof marked !== 'undefined') {
            try {
                return marked.parse(processed, { gfm: true, breaks: true });
            } catch (e) { /* fallback */ }
        }
        return this._escapeHtml(processed).replace(/\n/g, '<br>');
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    _renderHeader() {
        const changeset = this._changeset || AppStore.selectedChangeset.value;
        if (!changeset) return '';

        const domains = changeset.domains_involved || [];

        return html`
            <div class="viewer-header">
                <div class="header-row">
                    <div class="header-identity">
                        <span class="phase-badge ${changeset.phase || 'active'}">${changeset.phase || 'active'}</span>
                        <changeset-name class="changeset-id" .name=${changeset.id}></changeset-name>
                        ${domains.length ? html`
                            <div class="domains-inline">
                                ${domains.map(d => {
                                    const config = DOMAIN_CONFIG[d] || { initial: d.substring(0, 2).toUpperCase(), color: '#6e6e73' };
                                    return html`<span class="domain-badge" style="background: ${config.color}" title="${d}">${config.initial}</span>`;
                                })}
                            </div>
                        ` : ''}
                    </div>
                    <div class="header-actions">
                        <div class="view-toggle">
                            <button class="view-btn ${this._viewMode === 'unified' ? 'active' : ''}" @click=${() => this._setViewMode('unified')} title="Unified view">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/></svg>
                            </button>
                            <button class="view-btn ${this._viewMode === 'transcript' ? 'active' : ''}" @click=${() => this._setViewMode('transcript')} title="Transcript view">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </button>
                            <button class="view-btn ${this._viewMode === 'events' ? 'active' : ''}" @click=${() => this._setViewMode('events')} title="Events view">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderMergedTimeline() {
        const timeline = this._transcript?.merged_timeline || [];
        if (!timeline.length) return this._renderEmpty();

        let currentSource = null;
        let prevRole = null;
        let prevSource = null;
        const elements = [];

        timeline.forEach((entry, index) => {
            const { message, source } = entry;
            const isSubagent = source !== 'main';

            // Handle subagent context transitions
            if (isSubagent && currentSource !== source) {
                if (currentSource) elements.push(this._renderSubagentEnd(currentSource));
                elements.push(this._renderSubagentStart(source));
                currentSource = source;
            } else if (!isSubagent && currentSource) {
                elements.push(this._renderSubagentEnd(currentSource));
                currentSource = null;
            }

            const isConsecutive = prevRole === message.role && prevSource === source;
            elements.push(this._renderMessage(message, source, isSubagent, isConsecutive));

            prevRole = message.role;
            prevSource = source;
        });

        if (currentSource) elements.push(this._renderSubagentEnd(currentSource));

        return html`<div class="chat-stream">${elements}</div>`;
    }

    _renderSubagentStart(agentId) {
        const info = this._getAgentInfo(agentId);
        return html`
            <div class="subagent-context start" data-agent-id="${agentId}" style="--agent-color: ${info.color}">
                <div class="subagent-line"></div>
                <div class="subagent-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    ${info.name} started
                </div>
                <div class="subagent-line"></div>
            </div>
        `;
    }

    _renderSubagentEnd(agentId) {
        const info = this._getAgentInfo(agentId);
        return html`
            <div class="subagent-context end" data-agent-id="${agentId}" style="--agent-color: ${info.color}">
                <div class="subagent-line"></div>
                <div class="subagent-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    ${info.name} completed
                </div>
                <div class="subagent-line"></div>
            </div>
        `;
    }

    _renderMessage(message, source, isSubagent, isConsecutive) {
        const { role, text, tool_calls, timestamp } = message;

        if (role === 'user') {
            // Skip empty tool_result messages
            if (!text && message.content?.every(c => c.type === 'tool_result')) return '';
            return this._renderUserMessage(text, timestamp, isSubagent, source, isConsecutive);
        }

        if (role === 'assistant') {
            if (!text && (!tool_calls || !tool_calls.length)) return '';
            return this._renderAssistantMessage(text, tool_calls, timestamp, isSubagent, source, isConsecutive);
        }

        return '';
    }

    _renderUserMessage(text, timestamp, isSubagent, source, isConsecutive) {
        const agentInfo = isSubagent ? this._getAgentInfo(source) : null;
        const subagentClasses = isSubagent ? 'subagent-indent' : '';
        const consecutiveClass = isConsecutive ? 'consecutive' : '';

        return html`
            <div class="message user-message ${subagentClasses} ${consecutiveClass}" data-source="${source}">
                ${isConsecutive
                    ? html`<div class="avatar-spacer"></div>`
                    : html`<div class="avatar user ${isSubagent ? 'subagent-avatar' : ''}"><span class="avatar-initial">U</span></div>`
                }
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-author user">USER</span>
                        ${isSubagent ? html`<span class="subagent-badge" style="--agent-color: ${agentInfo?.color}">to ${agentInfo?.name}</span>` : ''}
                    </div>
                    <div class="message-content">
                        <div class="transcript-text">${unsafeHTML(this._formatContent(text))}</div>
                    </div>
                </div>
            </div>
        `;
    }

    _renderAssistantMessage(text, toolCalls, timestamp, isSubagent, source, isConsecutive) {
        const agentInfo = isSubagent ? this._getAgentInfo(source) : { name: 'Claude', color: '#6366f1', initial: 'AI' };
        const subagentClasses = isSubagent ? 'subagent-indent subagent-message' : '';
        const consecutiveClass = isConsecutive ? 'consecutive' : '';

        return html`
            <div class="message agent-message ${subagentClasses} ${consecutiveClass}" data-source="${source}" style="--agent-color: ${agentInfo.color}">
                ${isConsecutive
                    ? html`<div class="avatar-spacer"></div>`
                    : html`
                        <div class="avatar ${isSubagent ? 'subagent-avatar' : ''}" style="--domain-color: ${agentInfo.color}; background: ${agentInfo.color}">
                            <span class="avatar-initial">${agentInfo.initial}</span>
                            <span class="avatar-pulse"></span>
                        </div>
                    `
                }
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-author" style="--domain-color: ${agentInfo.color}; color: ${agentInfo.color}">
                            ${isSubagent ? agentInfo.name : 'Claude'}
                        </span>
                    </div>
                    <div class="message-content">
                        ${text ? html`<div class="transcript-text">${unsafeHTML(this._formatContent(text))}</div>` : ''}
                        ${this._renderToolsSection(toolCalls)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render tools section with mode-based filtering
     * - Inline tools (AskUserQuestion) render as full cards
     * - Aside tools render as a compact badge with count
     */
    _renderToolsSection(toolCalls) {
        if (!toolCalls?.length) return '';

        const inlineTools = filterInlineTools(toolCalls);
        const asideTools = filterAsideTools(toolCalls);

        return html`
            ${inlineTools.length ? html`
                <div class="tool-cards transcript-tools">
                    ${inlineTools.map(tool => this._renderToolCard(tool))}
                </div>
            ` : ''}
            ${asideTools.length ? html`
                <div class="aside-tools-indicator">
                    <tool-activity-badge
                        .count=${asideTools.length}
                        .toolNames=${asideTools.map(t => t.name)}
                        @badge-click=${this._handleBadgeClick}
                    ></tool-activity-badge>
                </div>
            ` : ''}
        `;
    }

    /**
     * Handle badge click to expand activities aside
     */
    _handleBadgeClick(e) {
        // Expand the activities aside panel
        Actions.setActivitiesAsideCollapsed(false);
        // Could add scroll-to-tool behavior in the future
    }

    /**
     * Get the conversation ID for this changeset
     * @returns {{type: string, id: string}}
     */
    get _conversationId() {
        return { type: 'changeset', id: this.changesetId || 'unknown' };
    }

    /**
     * Build context prefix for changeset conversations
     * @returns {string|null}
     */
    _buildContextPrefix() {
        const changeset = this._changeset;
        if (!changeset) return null;

        return `You are assisting with changeset: ${changeset.id || this.changesetId}
Phase: ${changeset.phase || 'active'}
Domains involved: ${(changeset.domains_involved || []).join(', ') || 'none specified'}
${changeset.task ? `Task: ${changeset.task}` : ''}

Please provide responses in the context of this changeset.`.trim();
    }

    /**
     * Get messages for this changeset's conversation
     * @returns {Array}
     */
    get _conversationMessages() {
        const conv = Actions.getConversation(this._conversationId);
        return conv?.messages || [];
    }

    /**
     * Get streaming state for this changeset's conversation
     * @returns {boolean}
     */
    get _conversationIsStreaming() {
        const conv = Actions.getConversation(this._conversationId);
        return conv?.isStreaming || false;
    }

    /**
     * Handle send from terminal input - routes to SDKClient with changeset context
     */
    _handleTerminalSend(e) {
        const { message, model, settings, attachments } = e.detail;

        // Initialize conversation if needed
        Actions.initConversation(this._conversationId, {
            contextPrefix: this._buildContextPrefix()
        });

        SDKClient.sendMessage(message, {
            conversationId: this._conversationId,
            model,
            settings,
            attachments: attachments || [],
            contextPrefix: this._buildContextPrefix(),
            resumeSession: true
        });

        // Force scroll to bottom when user sends message
        this._autoScroll = true;
        this.removeAttribute('user-scrolled');
        this.updateComplete.then(() => this._scrollToBottom());
    }

    /**
     * Handle interrupt from terminal input
     */
    _handleTerminalInterrupt() {
        SDKClient.interrupt();
    }

    /**
     * Handle model change from terminal input
     */
    _handleTerminalModelChange(e) {
        Actions.setTerminalModel(e.detail.model);
    }

    _renderToolCard(tool) {
        const name = tool.name || 'Tool';
        const input = tool.input || {};

        // Get preview based on tool type
        let preview = '';
        if (name === 'Bash' && input.command) {
            preview = input.command.substring(0, 200);
        } else if ((name === 'Read' || name === 'Write' || name === 'Edit') && input.file_path) {
            preview = input.file_path;
        } else if ((name === 'Grep' || name === 'Glob') && input.pattern) {
            preview = input.pattern;
        } else if (name === 'Task' && input.prompt) {
            preview = input.prompt.substring(0, 150);
        } else if (name === 'WebFetch' && input.url) {
            preview = input.url;
        }

        // Get tool icon based on tool name
        const toolIcon = this._getToolIcon(name);

        return html`
            <div class="tool-card tool-call-card">
                <div class="tool-card-header tool-call-header">
                    <div class="tool-icon">${unsafeHTML(toolIcon)}</div>
                    <span class="tool-name">${name}</span>
                    ${tool.status ? html`<span class="tool-badge">${tool.status}</span>` : ''}
                </div>
                ${preview ? html`<div class="tool-content">${this._escapeHtml(preview)}</div>` : ''}
            </div>
        `;
    }

    _getToolIcon(toolName) {
        const icons = {
            'Bash': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
            'Read': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
            'Write': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
            'Edit': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
            'Grep': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
            'Glob': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
            'Task': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
            'WebFetch': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
            'WebSearch': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
        };
        return icons[toolName] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>';
    }

    _renderEmpty() {
        const changesetId = this._changeset?.id || this.changesetId || 'unknown';
        return html`
            <div class="conversation-empty">
                <div class="empty-terminal">
                    <div class="terminal-line">$ session loaded: ${changesetId}</div>
                    <div class="terminal-line">$ no events or transcript data</div>
                    <div class="terminal-cursor"></div>
                </div>
            </div>
        `;
    }

    _renderLoading() {
        return html`
            <div class="loading-state">
                <div class="loading-spinner"></div>
            </div>
        `;
    }

    _renderConversation() {
        const loading = this._loading || AppStore.loadingConversation.value;
        if (loading) return this._renderLoading();

        const timeline = this._transcript?.merged_timeline || [];
        const messages = this._transcript?.messages || [];
        // Use store's conversation events for real-time updates, fallback to local state
        const storeEvents = AppStore.conversationEvents.value || [];
        const events = storeEvents.length > 0 ? storeEvents : (this._events || []);

        // Choose view based on mode and available data
        if (this._viewMode === 'unified' || this._viewMode === 'transcript') {
            if (timeline.length) return this._renderMergedTimeline();
            if (messages.length) return this._renderMergedTimeline(); // fallback
        }

        if (this._viewMode === 'events' && events.length) {
            // Render events view with proper styling per event type
            return html`
                <div class="chat-stream">
                    ${events.map(event => this._renderEvent(event))}
                </div>
            `;
        }

        return this._renderEmpty();
    }

    _renderEvent(event) {
        const time = this._formatTime(event.timestamp);
        const domain = event.domain || 'pm';
        const config = DOMAIN_CONFIG[domain] || { initial: domain.substring(0, 2).toUpperCase(), color: '#6e6e73' };

        // Handle decision events with special styling
        if (event.event_type === 'decision_made' || event.type === 'decision') {
            return this._renderDecision(event, time, domain, config);
        }

        // Handle handoff events
        if (event.event_type === 'handoff' || event.type === 'handoff') {
            return this._renderHandoff(event, time);
        }

        // Default event rendering
        return html`
            <div class="message event-message">
                <div class="avatar" style="background: ${config.color}">
                    <span class="avatar-initial">${config.initial}</span>
                </div>
                <div class="message-body">
                    <div class="message-header">
                        <span class="message-author" style="color: ${config.color}">${domain.toUpperCase()}</span>
                        <span class="message-time" style="margin-left: auto; font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--text-muted)">${time}</span>
                    </div>
                    <div class="message-content">${event.event_type?.replace(/_/g, ' ') || event.type || 'event'}</div>
                </div>
            </div>
        `;
    }

    _renderDecision(event, time, domain, config) {
        const decision = event.content?.decision || event.decision || 'Decision made';
        const rationale = event.content?.rationale || event.rationale || '';

        return html`
            <div class="chat-decision" data-domain="${domain}">
                <div class="decision-marker">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${config.color}" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <div class="decision-card" style="--domain-color: ${config.color}">
                    <div class="decision-header">
                        <span class="decision-label">DECISION</span>
                        <span class="decision-domain-pill" style="background: ${config.color}">${domain}</span>
                        <span class="decision-time">${time}</span>
                    </div>
                    <div class="decision-text">${this._escapeHtml(decision)}</div>
                    ${rationale ? html`
                        <div class="decision-rationale">
                            <span class="rationale-label">Rationale:</span>
                            ${this._escapeHtml(rationale)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    _renderHandoff(event, time) {
        const fromDomain = event.from_domain || event.source_domain || 'pm';
        const toDomain = event.to_domain || event.target_domain || 'pm';
        const fromConfig = DOMAIN_CONFIG[fromDomain] || { initial: fromDomain.substring(0, 2).toUpperCase(), color: '#6e6e73' };
        const toConfig = DOMAIN_CONFIG[toDomain] || { initial: toDomain.substring(0, 2).toUpperCase(), color: '#6e6e73' };

        return html`
            <div class="chat-divider handoff-divider">
                <div class="divider-line"></div>
                <div class="handoff-indicator">
                    <span class="handoff-from" style="--domain-color: ${fromConfig.color}">
                        <span class="handoff-badge" style="background: ${fromConfig.color}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;">${fromConfig.initial}</span>
                        <span style="margin-left: 4px; font-size: 12px; color: var(--text-secondary)">${fromDomain}</span>
                    </span>
                    <span class="handoff-arrow">
                        <svg width="20" height="12" viewBox="0 0 20 12">
                            <path d="M0 6h16M12 1l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </span>
                    <span class="handoff-to" style="--domain-color: ${toConfig.color}">
                        <span class="handoff-badge" style="background: ${toConfig.color}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;">${toConfig.initial}</span>
                        <span style="margin-left: 4px; font-size: 12px; color: var(--text-secondary)">${toDomain}</span>
                    </span>
                </div>
                <div class="divider-line"></div>
            </div>
        `;
    }

    render() {
        return html`
            ${this._renderHeader()}
            <div class="conversation-container" @scroll=${this._handleScroll}>
                ${this._renderConversation()}
            </div>
            <terminal-input
                .model=${AppStore.terminalModel?.value || 'sonnet'}
                .history=${this._conversationMessages
                    .filter(m => m.role === 'user')
                    .map(m => m.content)}
                ?streaming=${this._conversationIsStreaming}
                ?disabled=${!(AppStore.sdkConnected?.value ?? true)}
                placeholder="Chat with this changeset..."
                @send=${this._handleTerminalSend}
                @interrupt=${this._handleTerminalInterrupt}
                @model-change=${this._handleTerminalModelChange}
            ></terminal-input>
            <button class="scroll-bottom" @click=${this._scrollToBottom} title="Scroll to bottom">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
        `;
    }
}

customElements.define('changeset-viewer', ChangesetViewer);
export { ChangesetViewer };
