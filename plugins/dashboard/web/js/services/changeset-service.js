/**
 * Changeset Service - Handles changeset data, watching, and conversation loading
 * @module services/changeset-service
 */

import { AppStore, Actions, batch } from '../store/app-state.js';

/**
 * @typedef {Object} Changeset
 * @property {string} id - Unique changeset identifier
 * @property {string} [started_at] - ISO timestamp when started
 * @property {string} [phase] - Current phase (active, complete, etc.)
 * @property {string} [current_domain] - Currently active domain
 * @property {string} [current_agent] - Currently active agent
 * @property {number} [event_count] - Total events
 * @property {number} [handoff_count] - Total handoffs
 * @property {string[]} [artifacts] - List of artifact names
 * @property {string[]} [domains_involved] - Domains that participated
 * @property {string} [original_request] - Initial user request
 */

class ChangesetServiceClass {
    constructor() {
        this._baseUrl = '/api';
        this._conversationCache = new Map();
        this._cacheTimeout = 30000; // 30 second cache for conversations
    }

    /**
     * Fetch all changesets from the API
     * @param {Object} options - Fetch options
     * @param {boolean} [options.forceRefresh=false] - Bypass cache
     * @returns {Promise<Changeset[]>}
     */
    async fetchChangesets({ forceRefresh = false } = {}) {
        Actions.setLoadingChangesets(true);
        try {
            const response = await fetch(`${this._baseUrl}/changesets`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const changesets = data.changesets || [];

            Actions.setChangesets(changesets);
            return changesets;
        } catch (error) {
            console.error('[ChangesetService] Failed to fetch changesets:', error);
            Actions.addError({ type: 'changeset', message: error.message });
            throw error;
        } finally {
            Actions.setLoadingChangesets(false);
        }
    }

    /**
     * Fetch conversation data for a changeset
     * @param {string} changesetId - Changeset identifier
     * @returns {Promise<Object>}
     */
    async fetchConversation(changesetId) {
        Actions.setLoadingConversation(true);
        try {
            const response = await fetch(`${this._baseUrl}/changesets/${changesetId}/conversation`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            Actions.setConversationEvents(data.events || []);
            return data;
        } catch (error) {
            console.error(`[ChangesetService] Failed to fetch conversation for ${changesetId}:`, error);
            throw error;
        } finally {
            Actions.setLoadingConversation(false);
        }
    }

    /**
     * Fetch transcript data for a changeset
     * @param {string} changesetId - Changeset identifier
     * @param {Object} options - Fetch options
     * @param {boolean} [options.mergeTimeline=true] - Include merged timeline
     * @returns {Promise<Object>}
     */
    async fetchTranscript(changesetId, { mergeTimeline = true } = {}) {
        try {
            const url = `${this._baseUrl}/changesets/${changesetId}/transcript${mergeTimeline ? '?merge_timeline=true' : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            Actions.setTranscript(data);
            return data;
        } catch (error) {
            console.warn(`[ChangesetService] Transcript not available for ${changesetId}:`, error);
            return { messages: [], subagents: {}, merged_timeline: [] };
        }
    }

    /**
     * Fetch artifact content from a changeset
     * @param {string} changesetId - Changeset identifier
     * @param {string} artifactName - Artifact file name
     * @returns {Promise<{content: string, content_type: string}>}
     */
    async fetchArtifact(changesetId, artifactName) {
        try {
            const response = await fetch(
                `${this._baseUrl}/changesets/${changesetId}/artifacts/${encodeURIComponent(artifactName)}`
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`[ChangesetService] Failed to fetch artifact ${artifactName}:`, error);
            throw error;
        }
    }

    /**
     * Start watching a changeset for real-time updates
     * @param {string} changesetId - Changeset identifier
     * @returns {Promise<{session_id?: string}>}
     */
    async watchChangeset(changesetId) {
        const currentWatched = AppStore.watchedChangesetId.value;

        // Unwatch previous if different
        if (currentWatched && currentWatched !== changesetId) {
            await this.unwatchChangeset(currentWatched);
        }

        try {
            const response = await fetch(`${this._baseUrl}/changesets/${changesetId}/watch`, {
                method: 'POST'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            Actions.setWatchedChangeset(changesetId);
            const data = await response.json();
            return data;
        } catch (error) {
            console.warn(`[ChangesetService] Failed to watch changeset ${changesetId}:`, error);
            return {};
        }
    }

    /**
     * Stop watching a changeset
     * @param {string} changesetId - Changeset identifier
     */
    async unwatchChangeset(changesetId) {
        try {
            await fetch(`${this._baseUrl}/changesets/${changesetId}/unwatch`, {
                method: 'POST'
            });
            if (AppStore.watchedChangesetId.value === changesetId) {
                Actions.setWatchedChangeset(null);
            }
        } catch (error) {
            console.warn(`[ChangesetService] Failed to unwatch changeset ${changesetId}:`, error);
        }
    }

    /**
     * Delete a changeset
     * @param {string} changesetId - Changeset identifier
     * @returns {Promise<void>}
     */
    async deleteChangeset(changesetId) {
        try {
            const response = await fetch(`${this._baseUrl}/changesets/${changesetId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete');
            }

            Actions.removeChangeset(changesetId);
        } catch (error) {
            console.error(`[ChangesetService] Failed to delete changeset ${changesetId}:`, error);
            throw error;
        }
    }

    /**
     * Select a changeset and load its data
     * @param {Changeset} changeset - Changeset to select
     * @param {Object} options - Options
     * @param {boolean} [options.loadConversation=true] - Load conversation data
     * @param {boolean} [options.watch=true] - Start watching for updates
     * @param {boolean} [options.openTab=true] - Open changeset in editor tab
     */
    async select(changeset, { loadConversation = true, watch = true, openTab = true } = {}) {
        Actions.setSelectedChangeset(changeset);

        // Open changeset as a tab in the editor
        if (openTab && changeset) {
            const shortId = changeset.id.length > 25
                ? changeset.id.substring(0, 22) + '...'
                : changeset.id;
            Actions.openTab({
                id: `changeset-${changeset.id}`,
                title: shortId,
                type: 'changeset',
                changesetId: changeset.id
            });
        }

        if (watch && changeset) {
            await this.watchChangeset(changeset.id);
        }

        if (loadConversation && changeset) {
            await this.fetchConversation(changeset.id);
        }
    }

    /**
     * Get currently selected changeset
     * @returns {Changeset|null}
     */
    getSelected() {
        return AppStore.selectedChangeset.value;
    }

    /**
     * Get changeset by ID from store
     * @param {string} changesetId - Changeset identifier
     * @returns {Changeset|undefined}
     */
    getChangesetById(changesetId) {
        return AppStore.changesets.value.find(c => c.id === changesetId);
    }

    /**
     * Filter changesets by query string
     * @param {string} query - Filter query
     */
    filter(query) {
        Actions.setChangesetFilter(query);
    }

    /**
     * Handle SSE event for changesets
     * @param {Object} eventData - Event data from SSE
     */
    handleSSEEvent(eventData) {
        const { type, data } = eventData;

        switch (type) {
            case 'changeset_created':
                // Normalize: backend sends changeset_id, frontend expects id
                const normalizedChangeset = {
                    ...data,
                    id: data.id || data.changeset_id,
                    name: data.name || data.changeset_id || data.id
                };
                Actions.addChangeset(normalizedChangeset);
                break;
            case 'changeset_updated':
                // Normalize: backend sends changeset_id, frontend expects id
                const updateId = data.id || data.changeset_id;
                const normalizedUpdate = {
                    ...data,
                    id: updateId,
                    name: data.name || data.changeset_id || data.id
                };
                Actions.updateChangeset(updateId, normalizedUpdate);
                break;
            case 'changeset_deleted':
                Actions.removeChangeset(data.changeset_id || data.id);
                break;
            default:
                // Unknown event type
                break;
        }
    }

    /**
     * Get currently watched changeset ID
     * @returns {string|null}
     */
    get watchedChangesetId() {
        return AppStore.watchedChangesetId.value;
    }

    /**
     * Clear conversation cache
     */
    clearCache() {
        this._conversationCache.clear();
    }

    /**
     * Initialize the service - fetch initial data
     */
    async init() {
        if (AppStore.changesets.value.length === 0) {
            await this.fetchChangesets();
        }
    }
}

export const ChangesetService = new ChangesetServiceClass();
