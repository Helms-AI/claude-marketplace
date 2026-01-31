/**
 * ConversationStorage - IndexedDB-based conversation persistence
 *
 * Provides persistent storage for terminal conversations across browser refreshes.
 * Uses IndexedDB for 50MB+ storage capacity (vs localStorage's ~10KB limit).
 *
 * Session IDs are stored in sessionStorage (tab-specific, cleared on tab close).
 * Conversation history is stored in IndexedDB (persists until explicitly cleared).
 */
const ConversationStorage = {
    db: null,
    DB_NAME: 'dashboardConversations',
    DB_VERSION: 1,
    STORE_NAME: 'messages',

    // Session storage keys
    SESSION_ID_KEY: 'dashboard-session-id',
    SESSION_TIMESTAMP_KEY: 'dashboard-session-timestamp',
    MODEL_KEY: 'dashboard-model',

    // Session expiry (23 hours - SDK sessions typically last 24 hours)
    SESSION_MAX_AGE_MS: 23 * 60 * 60 * 1000,

    /**
     * Initialize IndexedDB connection
     * @returns {Promise<void>}
     */
    async init() {
        if (this.db) return; // Already initialized

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error('[ConversationStorage] Failed to open database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('[ConversationStorage] Database initialized');

                // Run cleanup of old sessions in background
                this.cleanupOldSessions().catch(e =>
                    console.warn('[ConversationStorage] Cleanup failed:', e)
                );

                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create messages store if it doesn't exist
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // Index by session ID for efficient lookups
                    store.createIndex('sessionId', 'sessionId', { unique: false });

                    // Index by timestamp for cleanup queries
                    store.createIndex('timestamp', 'timestamp', { unique: false });

                    console.log('[ConversationStorage] Created messages store with indexes');
                }
            };
        });
    },

    /**
     * Save a message to IndexedDB
     * @param {string} sessionId - The session ID
     * @param {Object} message - The message to save
     * @returns {Promise<number>} The message ID
     */
    async saveMessage(sessionId, message) {
        if (!this.db) {
            console.warn('[ConversationStorage] Database not initialized');
            return null;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);

            const record = {
                sessionId,
                timestamp: Date.now(),
                ...message
            };

            const request = store.add(record);

            request.onsuccess = () => {
                console.debug('[ConversationStorage] Saved message:', request.result);
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('[ConversationStorage] Failed to save message:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Retrieve all messages for a session
     * @param {string} sessionId - The session ID
     * @returns {Promise<Array>} Array of messages sorted by timestamp
     */
    async getSessionMessages(sessionId) {
        if (!this.db) {
            console.warn('[ConversationStorage] Database not initialized');
            return [];
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.STORE_NAME);
            const index = store.index('sessionId');

            const request = index.getAll(sessionId);

            request.onsuccess = () => {
                // Sort by timestamp to maintain order
                const messages = request.result.sort((a, b) => a.timestamp - b.timestamp);
                console.log(`[ConversationStorage] Retrieved ${messages.length} messages for session ${sessionId}`);
                resolve(messages);
            };

            request.onerror = () => {
                console.error('[ConversationStorage] Failed to get messages:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Delete all messages for a session
     * @param {string} sessionId - The session ID
     * @returns {Promise<void>}
     */
    async clearSession(sessionId) {
        if (!this.db) {
            console.warn('[ConversationStorage] Database not initialized');
            return;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const index = store.index('sessionId');

            // Get all keys for this session
            const request = index.getAllKeys(sessionId);

            request.onsuccess = () => {
                const keys = request.result;
                let deleted = 0;

                if (keys.length === 0) {
                    console.log(`[ConversationStorage] No messages to clear for session ${sessionId}`);
                    resolve();
                    return;
                }

                // Delete each record
                for (const key of keys) {
                    const deleteRequest = store.delete(key);
                    deleteRequest.onsuccess = () => {
                        deleted++;
                        if (deleted === keys.length) {
                            console.log(`[ConversationStorage] Cleared ${deleted} messages for session ${sessionId}`);
                            resolve();
                        }
                    };
                    deleteRequest.onerror = () => {
                        console.error('[ConversationStorage] Failed to delete message:', deleteRequest.error);
                    };
                }
            };

            request.onerror = () => {
                console.error('[ConversationStorage] Failed to get session keys:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Remove sessions older than maxAgeHours
     * @param {number} maxAgeHours - Maximum age in hours (default 48)
     * @returns {Promise<number>} Number of records deleted
     */
    async cleanupOldSessions(maxAgeHours = 48) {
        if (!this.db) {
            return 0;
        }

        const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const index = store.index('timestamp');

            // Get all records older than cutoff
            const range = IDBKeyRange.upperBound(cutoff);
            const request = index.openCursor(range);

            let deleted = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    deleted++;
                    cursor.continue();
                } else {
                    if (deleted > 0) {
                        console.log(`[ConversationStorage] Cleaned up ${deleted} old messages`);
                    }
                    resolve(deleted);
                }
            };

            request.onerror = () => {
                console.error('[ConversationStorage] Cleanup failed:', request.error);
                reject(request.error);
            };
        });
    },

    // ========================================
    // SESSION STORAGE HELPERS
    // ========================================

    /**
     * Get the current session ID from sessionStorage
     * @returns {string|null} Session ID or null if not set
     */
    getSessionId() {
        return sessionStorage.getItem(this.SESSION_ID_KEY);
    },

    /**
     * Save session ID to sessionStorage
     * @param {string} sessionId - The session ID to save
     */
    setSessionId(sessionId) {
        sessionStorage.setItem(this.SESSION_ID_KEY, sessionId);
        sessionStorage.setItem(this.SESSION_TIMESTAMP_KEY, Date.now().toString());
    },

    /**
     * Check if the stored session is still valid (not expired)
     * @returns {boolean} True if session is valid
     */
    isSessionValid() {
        const sessionId = this.getSessionId();
        if (!sessionId) return false;

        const timestamp = sessionStorage.getItem(this.SESSION_TIMESTAMP_KEY);
        if (!timestamp) return false;

        const age = Date.now() - parseInt(timestamp, 10);
        return age < this.SESSION_MAX_AGE_MS;
    },

    /**
     * Get the saved model preference
     * @returns {string|null} Model name or null
     */
    getModel() {
        return sessionStorage.getItem(this.MODEL_KEY);
    },

    /**
     * Save model preference to sessionStorage
     * @param {string} model - The model name to save
     */
    setModel(model) {
        sessionStorage.setItem(this.MODEL_KEY, model);
    },

    /**
     * Clear all session storage
     */
    clearSessionStorage() {
        sessionStorage.removeItem(this.SESSION_ID_KEY);
        sessionStorage.removeItem(this.SESSION_TIMESTAMP_KEY);
        sessionStorage.removeItem(this.MODEL_KEY);
        console.log('[ConversationStorage] Session storage cleared');
    },

    /**
     * Get full session state for restoration
     * @returns {Object|null} Session state or null if invalid/missing
     */
    async getSessionState() {
        if (!this.isSessionValid()) {
            return null;
        }

        const sessionId = this.getSessionId();
        const model = this.getModel();
        const messages = await this.getSessionMessages(sessionId);

        return {
            sessionId,
            model,
            messages,
            timestamp: parseInt(sessionStorage.getItem(this.SESSION_TIMESTAMP_KEY), 10)
        };
    }
};

// Export for module systems if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationStorage;
}
