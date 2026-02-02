/**
 * Events Service - Captures and manages SSE events for the Events Monitor
 * @module services/events-service
 *
 * Subscribes to all SSE events via SSEService.subscribe() and provides:
 * - Event batching (50ms window) to prevent render thrashing
 * - Events/second calculation via rolling 1-second window
 * - Export functionality for debugging
 */

import { SSEService } from './sse-service.js';
import { AppStore, Actions, batch } from '../store/app-state.js';

class EventsServiceClass {
    constructor() {
        this._unsubscribe = null;
        this._eventBatch = [];
        this._batchTimeout = null;
        this._batchDelayMs = 50;

        // Rate calculation
        this._recentEvents = [];  // Timestamps of recent events
        this._rateInterval = null;
        this._rateWindowMs = 1000;  // 1 second window
    }

    /**
     * Initialize the events service
     * Should be called after SSE connection is established
     */
    init() {
        // Load saved preferences
        Actions.loadEventPreferences();

        // Subscribe to all SSE events
        this._unsubscribe = SSEService.subscribe((eventType, data) => {
            this._captureEvent(eventType, data);
        });

        // Start rate calculation interval
        this._rateInterval = setInterval(() => {
            this._calculateRate();
        }, 250);  // Update rate 4 times per second

        console.log('[EventsService] Initialized');
    }

    /**
     * Capture an SSE event
     * @private
     */
    _captureEvent(eventType, data) {
        const event = {
            type: eventType,
            data: data,
            timestamp: Date.now()
        };

        // Add to batch
        this._eventBatch.push(event);

        // Track for rate calculation
        this._recentEvents.push(Date.now());

        // Schedule batch flush
        if (!this._batchTimeout) {
            this._batchTimeout = setTimeout(() => {
                this._flushBatch();
            }, this._batchDelayMs);
        }
    }

    /**
     * Flush the event batch to the store
     * @private
     */
    _flushBatch() {
        if (this._eventBatch.length === 0) {
            this._batchTimeout = null;
            return;
        }

        const eventsToAdd = [...this._eventBatch];
        this._eventBatch = [];
        this._batchTimeout = null;

        // Add events to store in batch
        batch(() => {
            eventsToAdd.forEach(event => {
                Actions.addSSEEvent(event);
            });
        });
    }

    /**
     * Calculate events per second using rolling window
     * @private
     */
    _calculateRate() {
        const now = Date.now();
        const windowStart = now - this._rateWindowMs;

        // Remove events outside the window
        this._recentEvents = this._recentEvents.filter(ts => ts > windowStart);

        // Calculate rate
        const rate = this._recentEvents.length;
        Actions.updateSSEEventsPerSecond(rate);
    }

    /**
     * Export events to JSON file
     * @param {Object} options - Export options
     * @param {boolean} options.filtered - Whether to export only filtered events
     * @returns {string} JSON string of events
     */
    exportEvents(options = {}) {
        const events = options.filtered
            ? AppStore.sseEvents.value.filter(e =>
                !AppStore.sseHiddenEventTypes.value.includes(e.type)
              )
            : AppStore.sseEvents.value;

        const exportData = {
            exportedAt: new Date().toISOString(),
            totalEvents: events.length,
            bufferSize: AppStore.sseEventBufferSize.value,
            events: events
        };

        const json = JSON.stringify(exportData, null, 2);

        // Trigger download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sse-events-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return json;
    }

    /**
     * Get statistics about captured events
     * @returns {Object} Event statistics
     */
    getStats() {
        const events = AppStore.sseEvents.value;
        const hidden = AppStore.sseHiddenEventTypes.value;

        const stats = {
            total: AppStore.sseEventCount.value,
            buffered: events.length,
            bufferSize: AppStore.sseEventBufferSize.value,
            eventsPerSecond: AppStore.sseEventsPerSecond.value,
            hiddenTypes: hidden,
            byType: {}
        };

        events.forEach(e => {
            const type = e.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        return stats;
    }

    /**
     * Disconnect the events service
     */
    disconnect() {
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }

        if (this._batchTimeout) {
            clearTimeout(this._batchTimeout);
            this._batchTimeout = null;
        }

        if (this._rateInterval) {
            clearInterval(this._rateInterval);
            this._rateInterval = null;
        }

        console.log('[EventsService] Disconnected');
    }
}

export const EventsService = new EventsServiceClass();
