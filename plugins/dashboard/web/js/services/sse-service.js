/**
 * SSE Service
 *
 * Handles Server-Sent Events connection for real-time updates.
 * Manages connection lifecycle, reconnection, and event dispatching.
 *
 * @module services/sse-service
 */

import { AppStore, Actions, ConnectionState } from '../store/app-state.js';

/**
 * SSE Event Types from the server
 */
export const SSEEventType = {
    CONNECTED: 'connected',
    CHANGESET_UPDATE: 'changeset_update',
    ACTIVITY: 'activity',
    ERROR: 'error',
    HEARTBEAT: 'heartbeat'
};

/**
 * SSE Service Class
 */
class SSEServiceClass {
    constructor() {
        /** @type {EventSource|null} */
        this._eventSource = null;

        /** @type {number} */
        this._reconnectDelay = 1000;

        /** @type {number} */
        this._maxReconnectDelay = 30000;

        /** @type {number|null} */
        this._reconnectTimeout = null;

        /** @type {boolean} */
        this._shouldReconnect = true;

        /** @type {Set<Function>} */
        this._listeners = new Set();

        /** @type {number|null} */
        this._heartbeatTimeout = null;

        /** @type {number} */
        this._heartbeatInterval = 30000; // Expect heartbeat every 30s
    }

    /**
     * Start SSE connection
     * @param {string} url - SSE endpoint URL
     */
    connect(url = '/api/events') {
        if (this._eventSource) {
            this.disconnect();
        }

        this._shouldReconnect = true;
        Actions.setConnectionState(ConnectionState.CONNECTING);

        try {
            this._eventSource = new EventSource(url);

            this._eventSource.onopen = () => {
                console.log('[SSE] Connection opened');
                Actions.setConnectionState(ConnectionState.CONNECTED);
                this._reconnectDelay = 1000; // Reset delay on successful connection
                this._startHeartbeatMonitor();
            };

            this._eventSource.onerror = (event) => {
                console.error('[SSE] Connection error', event);

                if (this._eventSource?.readyState === EventSource.CLOSED) {
                    Actions.setConnectionState(ConnectionState.DISCONNECTED);
                    this._stopHeartbeatMonitor();

                    if (this._shouldReconnect) {
                        this._scheduleReconnect(url);
                    }
                } else {
                    Actions.setConnectionState(ConnectionState.ERROR, 'Connection error');
                }
            };

            // Listen for specific event types
            this._eventSource.addEventListener('connected', (event) => {
                this._handleEvent(SSEEventType.CONNECTED, this._parseData(event));
            });

            this._eventSource.addEventListener('changeset_update', (event) => {
                this._handleEvent(SSEEventType.CHANGESET_UPDATE, this._parseData(event));
            });

            this._eventSource.addEventListener('activity', (event) => {
                this._handleEvent(SSEEventType.ACTIVITY, this._parseData(event));
            });

            this._eventSource.addEventListener('error', (event) => {
                this._handleEvent(SSEEventType.ERROR, this._parseData(event));
            });

            this._eventSource.addEventListener('heartbeat', () => {
                this._resetHeartbeatMonitor();
            });

            // Generic message handler for unlabeled events
            this._eventSource.onmessage = (event) => {
                const data = this._parseData(event);
                if (data) {
                    this._handleEvent('message', data);
                }
            };

        } catch (error) {
            console.error('[SSE] Failed to create EventSource', error);
            Actions.setConnectionState(ConnectionState.ERROR, error.message);
            this._scheduleReconnect(url);
        }
    }

    /**
     * Disconnect SSE
     */
    disconnect() {
        this._shouldReconnect = false;

        if (this._reconnectTimeout) {
            clearTimeout(this._reconnectTimeout);
            this._reconnectTimeout = null;
        }

        this._stopHeartbeatMonitor();

        if (this._eventSource) {
            this._eventSource.close();
            this._eventSource = null;
        }

        Actions.setConnectionState(ConnectionState.DISCONNECTED);
    }

    /**
     * Subscribe to SSE events
     * @param {Function} callback - Callback function (eventType, data)
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    /**
     * Parse event data
     * @param {MessageEvent} event
     * @returns {Object|null}
     */
    _parseData(event) {
        try {
            return JSON.parse(event.data);
        } catch {
            console.warn('[SSE] Failed to parse event data:', event.data);
            return null;
        }
    }

    /**
     * Handle incoming event
     * @param {string} eventType
     * @param {Object|null} data
     */
    _handleEvent(eventType, data) {
        if (!data) return;

        // Update store based on event type
        switch (eventType) {
            case SSEEventType.CHANGESET_UPDATE:
                if (data.changesets) {
                    Actions.setChangesets(data.changesets);
                }
                if (data.agents) {
                    Actions.setAgents(data.agents);
                }
                if (data.skills) {
                    Actions.setSkills(data.skills);
                }
                break;

            case SSEEventType.ACTIVITY:
                Actions.addActivity(data);
                break;

            case SSEEventType.ERROR:
                Actions.addError(data);
                break;
        }

        // Notify all listeners
        this._listeners.forEach(callback => {
            try {
                callback(eventType, data);
            } catch (error) {
                console.error('[SSE] Listener error:', error);
            }
        });
    }

    /**
     * Schedule reconnection attempt
     * @param {string} url
     */
    _scheduleReconnect(url) {
        if (!this._shouldReconnect) return;

        AppStore.reconnectAttempts.value += 1;
        console.log(`[SSE] Scheduling reconnect in ${this._reconnectDelay}ms (attempt ${AppStore.reconnectAttempts.value})`);

        this._reconnectTimeout = setTimeout(() => {
            this.connect(url);
        }, this._reconnectDelay);

        // Exponential backoff with max
        this._reconnectDelay = Math.min(this._reconnectDelay * 2, this._maxReconnectDelay);
    }

    /**
     * Start heartbeat monitoring
     */
    _startHeartbeatMonitor() {
        this._stopHeartbeatMonitor();
        this._heartbeatTimeout = setTimeout(() => {
            console.warn('[SSE] Heartbeat timeout - connection may be stale');
            // Don't disconnect yet, just log - the connection may still work
        }, this._heartbeatInterval * 2);
    }

    /**
     * Reset heartbeat monitor (called when heartbeat received)
     */
    _resetHeartbeatMonitor() {
        this._startHeartbeatMonitor();
    }

    /**
     * Stop heartbeat monitoring
     */
    _stopHeartbeatMonitor() {
        if (this._heartbeatTimeout) {
            clearTimeout(this._heartbeatTimeout);
            this._heartbeatTimeout = null;
        }
    }

    /**
     * Check if connected
     * @returns {boolean}
     */
    get isConnected() {
        return this._eventSource?.readyState === EventSource.OPEN;
    }
}

// Export singleton instance
export const SSEService = new SSEServiceClass();
