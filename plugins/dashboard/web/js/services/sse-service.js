/**
 * SSE Service - Handles Server-Sent Events connection for real-time updates
 * @module services/sse-service
 */

import { AppStore, Actions, ConnectionState } from '../store/app-state.js';

export const SSEEventType = {
    CONNECTED: 'connected',
    CHANGESET_UPDATE: 'changeset_update',
    CHANGESET_CREATED: 'changeset_created',
    CHANGESET_UPDATED: 'changeset_updated',
    CONVERSATION_EVENT: 'conversation_event',
    ACTIVITY: 'activity',
    GRAPH_ACTIVITY: 'graph_activity',
    GRAPH_HANDOFF: 'graph_handoff',
    ERROR: 'error',
    HEARTBEAT: 'heartbeat'
};

class SSEServiceClass {
    constructor() {
        this._eventSource = null;
        this._reconnectDelay = 1000;
        this._maxReconnectDelay = 30000;
        this._reconnectTimeout = null;
        this._shouldReconnect = true;
        this._listeners = new Set();
        this._heartbeatTimeout = null;
        this._heartbeatInterval = 30000;
    }

    connect(url = '/api/events') {
        if (this._eventSource) this.disconnect();
        this._shouldReconnect = true;
        Actions.setConnectionState(ConnectionState.CONNECTING);

        try {
            this._eventSource = new EventSource(url);

            this._eventSource.onopen = () => {
                console.log('[SSE] Connection opened');
                Actions.setConnectionState(ConnectionState.CONNECTED);
                this._reconnectDelay = 1000;
                this._startHeartbeatMonitor();
            };

            this._eventSource.onerror = (event) => {
                console.error('[SSE] Connection error', event);
                if (this._eventSource?.readyState === EventSource.CLOSED) {
                    Actions.setConnectionState(ConnectionState.DISCONNECTED);
                    this._stopHeartbeatMonitor();
                    if (this._shouldReconnect) this._scheduleReconnect(url);
                } else {
                    Actions.setConnectionState(ConnectionState.ERROR, 'Connection error');
                }
            };

            this._eventSource.addEventListener('connected', (e) => this._handleEvent(SSEEventType.CONNECTED, this._parseData(e)));
            this._eventSource.addEventListener('changeset_update', (e) => this._handleEvent(SSEEventType.CHANGESET_UPDATE, this._parseData(e)));
            this._eventSource.addEventListener('changeset_created', (e) => this._handleEvent(SSEEventType.CHANGESET_CREATED, this._parseData(e)));
            this._eventSource.addEventListener('changeset_updated', (e) => this._handleEvent(SSEEventType.CHANGESET_UPDATED, this._parseData(e)));
            this._eventSource.addEventListener('conversation_event', (e) => this._handleEvent(SSEEventType.CONVERSATION_EVENT, this._parseData(e)));
            this._eventSource.addEventListener('transcript_message', (e) => this._handleEvent('transcript_message', this._parseData(e)));
            this._eventSource.addEventListener('activity', (e) => this._handleEvent(SSEEventType.ACTIVITY, this._parseData(e)));
            this._eventSource.addEventListener('session_detected', (e) => this._handleEvent('session_detected', this._parseData(e)));
            this._eventSource.addEventListener('session_ended', (e) => this._handleEvent('session_ended', this._parseData(e)));
            this._eventSource.addEventListener('error', (e) => this._handleEvent(SSEEventType.ERROR, this._parseData(e)));
            this._eventSource.addEventListener('heartbeat', () => this._resetHeartbeatMonitor());

            this._eventSource.onmessage = (event) => {
                const data = this._parseData(event);
                if (data) {
                    // Use the type field from data as the event type (backend sends type in payload)
                    const eventType = data.type || 'message';
                    this._handleEvent(eventType, data.data || data);
                }
            };
        } catch (error) {
            console.error('[SSE] Failed to create EventSource', error);
            Actions.setConnectionState(ConnectionState.ERROR, error.message);
            this._scheduleReconnect(url);
        }
    }

    disconnect() {
        this._shouldReconnect = false;
        if (this._reconnectTimeout) { clearTimeout(this._reconnectTimeout); this._reconnectTimeout = null; }
        this._stopHeartbeatMonitor();
        if (this._eventSource) { this._eventSource.close(); this._eventSource = null; }
        Actions.setConnectionState(ConnectionState.DISCONNECTED);
    }

    subscribe(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    _parseData(event) {
        try { return JSON.parse(event.data); }
        catch { console.warn('[SSE] Failed to parse event data:', event.data); return null; }
    }

    _handleEvent(eventType, data) {
        if (!data) return;
        switch (eventType) {
            case SSEEventType.CHANGESET_UPDATE:
                if (data.changesets) Actions.setChangesets(data.changesets);
                if (data.agents) Actions.setAgents(data.agents);
                if (data.skills) Actions.setSkills(data.skills);
                break;
            case SSEEventType.ACTIVITY: Actions.addActivity(data); break;
            case SSEEventType.ERROR: Actions.addError(data); break;
        }
        this._listeners.forEach(cb => { try { cb(eventType, data); } catch (e) { console.error('[SSE] Listener error:', e); } });
    }

    _scheduleReconnect(url) {
        if (!this._shouldReconnect) return;
        AppStore.reconnectAttempts.value += 1;
        console.log(`[SSE] Scheduling reconnect in ${this._reconnectDelay}ms (attempt ${AppStore.reconnectAttempts.value})`);
        this._reconnectTimeout = setTimeout(() => this.connect(url), this._reconnectDelay);
        this._reconnectDelay = Math.min(this._reconnectDelay * 2, this._maxReconnectDelay);
    }

    _startHeartbeatMonitor() {
        this._stopHeartbeatMonitor();
        this._heartbeatTimeout = setTimeout(() => console.warn('[SSE] Heartbeat timeout'), this._heartbeatInterval * 2);
    }

    _resetHeartbeatMonitor() { this._startHeartbeatMonitor(); }

    _stopHeartbeatMonitor() {
        if (this._heartbeatTimeout) { clearTimeout(this._heartbeatTimeout); this._heartbeatTimeout = null; }
    }

    get isConnected() { return this._eventSource?.readyState === EventSource.OPEN; }
}

export const SSEService = new SSEServiceClass();
