/**
 * Session Service - Loads historical sessions from the API
 * @module services/session-service
 */

import { Actions } from '../store/app-state.js';

export class SessionService {
    static async loadAll() {
        try {
            const response = await fetch('/api/sessions/all?limit=100');
            if (!response.ok) return;
            const data = await response.json();
            Actions.setHistoricalSessions(data.sessions || []);
        } catch (error) {
            console.warn('[SessionService] Could not load historical sessions:', error);
        }
    }
}
