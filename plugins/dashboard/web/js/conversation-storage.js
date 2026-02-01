/**
 * ConversationStorage - IndexedDB-based conversation persistence
 *
 * Provides persistent storage for terminal conversations across browser refreshes.
 * Uses IndexedDB for 50MB+ storage capacity (vs localStorage's ~10KB limit).
 *
 * Session IDs are stored in localStorage (persists across tabs and browser restarts).
 * Conversation history is stored in IndexedDB (persists until explicitly cleared).
 */
const ConversationStorage = {
    db: null,
    DB_NAME: 'dashboardConversations',
    DB_VERSION: 2,
    STORE_NAME: 'messages',
    SESSIONS_STORE_NAME: 'sessions',

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

                // Create sessions store if it doesn't exist (added in version 2)
                if (!db.objectStoreNames.contains(this.SESSIONS_STORE_NAME)) {
                    const sessionsStore = db.createObjectStore(this.SESSIONS_STORE_NAME, {
                        keyPath: 'sessionId'
                    });

                    // Index by lastActivity for sorting and cleanup queries
                    sessionsStore.createIndex('lastActivity', 'lastActivity', { unique: false });

                    console.log('[ConversationStorage] Created sessions store with indexes');
                }
            };
        });
    },

    /**
     * Save a message to IndexedDB and upsert the session record
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
            // Open transaction on both stores
            const transaction = this.db.transaction(
                [this.STORE_NAME, this.SESSIONS_STORE_NAME],
                'readwrite'
            );
            const messagesStore = transaction.objectStore(this.STORE_NAME);
            const sessionsStore = transaction.objectStore(this.SESSIONS_STORE_NAME);

            const now = Date.now();
            const record = {
                sessionId,
                timestamp: now,
                ...message
            };

            // Save the message
            const messageRequest = messagesStore.add(record);
            let messageId = null;

            messageRequest.onsuccess = () => {
                messageId = messageRequest.result;
                console.debug('[ConversationStorage] Saved message:', messageId);
            };

            messageRequest.onerror = () => {
                console.error('[ConversationStorage] Failed to save message:', messageRequest.error);
            };

            // Upsert the session record
            const sessionRequest = sessionsStore.get(sessionId);

            sessionRequest.onsuccess = () => {
                const existing = sessionRequest.result;
                let sessionRecord;

                if (existing) {
                    // Update existing session
                    sessionRecord = {
                        ...existing,
                        lastActivity: now,
                        messageCount: (existing.messageCount || 0) + 1
                    };
                } else {
                    // Create new session record
                    sessionRecord = {
                        sessionId,
                        firstSeen: now,
                        lastActivity: now,
                        messageCount: 1
                    };
                }

                sessionsStore.put(sessionRecord);
                console.debug('[ConversationStorage] Upserted session:', sessionId);
            };

            sessionRequest.onerror = () => {
                console.warn('[ConversationStorage] Failed to get session for upsert:', sessionRequest.error);
            };

            // Resolve when transaction completes
            transaction.oncomplete = () => {
                resolve(messageId);
            };

            transaction.onerror = () => {
                console.error('[ConversationStorage] Transaction failed:', transaction.error);
                reject(transaction.error);
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

    // ========================================
    // SESSION STORE METHODS
    // ========================================

    /**
     * Get all sessions, sorted by lastActivity (most recent first)
     * @returns {Promise<Array>} Array of session records
     */
    async getAllSessions() {
        if (!this.db) {
            console.warn('[ConversationStorage] Database not initialized');
            return [];
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.SESSIONS_STORE_NAME], 'readonly');
            const store = transaction.objectStore(this.SESSIONS_STORE_NAME);
            const index = store.index('lastActivity');

            const request = index.getAll();

            request.onsuccess = () => {
                // Sort by lastActivity descending (most recent first)
                const sessions = request.result.sort((a, b) => b.lastActivity - a.lastActivity);
                console.log(`[ConversationStorage] Retrieved ${sessions.length} sessions`);
                resolve(sessions);
            };

            request.onerror = () => {
                console.error('[ConversationStorage] Failed to get sessions:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Get session IDs only (for dropdown)
     * @returns {Promise<Array<string>>} Array of session ID strings
     */
    async getSessionIds() {
        const sessions = await this.getAllSessions();
        return sessions.map(s => s.sessionId);
    },

    /**
     * Delete a session and all its messages
     * @param {string} sessionId - The session ID to delete
     * @returns {Promise<void>}
     */
    async deleteSession(sessionId) {
        if (!this.db) {
            console.warn('[ConversationStorage] Database not initialized');
            return;
        }

        // First clear all messages for this session
        await this.clearSession(sessionId);

        // Then delete the session record
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.SESSIONS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.SESSIONS_STORE_NAME);

            const request = store.delete(sessionId);

            request.onsuccess = () => {
                console.log(`[ConversationStorage] Deleted session ${sessionId}`);
                resolve();
            };

            request.onerror = () => {
                console.error('[ConversationStorage] Failed to delete session:', request.error);
                reject(request.error);
            };
        });
    },

    /**
     * Remove sessions older than maxAgeHours (cleans up both messages and session records)
     * @param {number} maxAgeHours - Maximum age in hours (default 48)
     * @returns {Promise<{messages: number, sessions: number}>} Count of deleted records
     */
    async cleanupOldSessions(maxAgeHours = 48) {
        if (!this.db) {
            return { messages: 0, sessions: 0 };
        }

        const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);

        // Clean up old messages
        const messagesDeleted = await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            const index = store.index('timestamp');

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
                console.error('[ConversationStorage] Message cleanup failed:', request.error);
                reject(request.error);
            };
        });

        // Clean up old session records
        const sessionsDeleted = await new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.SESSIONS_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(this.SESSIONS_STORE_NAME);
            const index = store.index('lastActivity');

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
                        console.log(`[ConversationStorage] Cleaned up ${deleted} old session records`);
                    }
                    resolve(deleted);
                }
            };

            request.onerror = () => {
                console.error('[ConversationStorage] Session cleanup failed:', request.error);
                reject(request.error);
            };
        });

        return { messages: messagesDeleted, sessions: sessionsDeleted };
    },

    // ========================================
    // SESSION STORAGE HELPERS
    // ========================================

    /**
     * Get the current session ID from localStorage
     * @returns {string|null} Session ID or null if not set
     */
    getSessionId() {
        return localStorage.getItem(this.SESSION_ID_KEY);
    },

    /**
     * Save session ID to localStorage
     * @param {string} sessionId - The session ID to save
     */
    setSessionId(sessionId) {
        localStorage.setItem(this.SESSION_ID_KEY, sessionId);
        localStorage.setItem(this.SESSION_TIMESTAMP_KEY, Date.now().toString());
        console.log('[ConversationStorage] Saved session ID to localStorage:', sessionId);
    },

    /**
     * Check if the stored session is still valid (not expired)
     * @returns {boolean} True if session is valid
     */
    isSessionValid() {
        const sessionId = this.getSessionId();
        if (!sessionId) return false;

        const timestamp = localStorage.getItem(this.SESSION_TIMESTAMP_KEY);
        if (!timestamp) return false;

        const age = Date.now() - parseInt(timestamp, 10);
        const isValid = age < this.SESSION_MAX_AGE_MS;

        if (!isValid) {
            console.log('[ConversationStorage] Session expired, age:', Math.round(age / 1000 / 60), 'minutes');
        }

        return isValid;
    },

    /**
     * Get the saved model preference
     * @returns {string|null} Model name or null
     */
    getModel() {
        return localStorage.getItem(this.MODEL_KEY);
    },

    /**
     * Save model preference to localStorage
     * @param {string} model - The model name to save
     */
    setModel(model) {
        localStorage.setItem(this.MODEL_KEY, model);
    },

    /**
     * Clear all session storage (localStorage keys)
     */
    clearSessionStorage() {
        localStorage.removeItem(this.SESSION_ID_KEY);
        localStorage.removeItem(this.SESSION_TIMESTAMP_KEY);
        localStorage.removeItem(this.MODEL_KEY);
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
            timestamp: parseInt(localStorage.getItem(this.SESSION_TIMESTAMP_KEY), 10)
        };
    }
};

// ES module export
export { ConversationStorage };

// CommonJS export for backwards compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConversationStorage;
}
