/**
 * Agent Service - Handles agent data fetching and caching
 * @module services/agent-service
 */

import { AppStore, Actions } from '../store/app-state.js';

/**
 * @typedef {Object} Agent
 * @property {string} id - Unique agent identifier
 * @property {string} name - Display name
 * @property {string} domain - Domain/plugin the agent belongs to
 * @property {string} role - Agent's role description
 * @property {string} [description] - Extended description
 * @property {string[]} [tools] - Available tools
 * @property {string[]} [key_phrases] - Characteristic phrases
 * @property {string} [last_active] - ISO timestamp of last activity
 */

class AgentServiceClass {
    constructor() {
        this._baseUrl = '/api';
        this._cache = new Map();
        this._activityCache = new Map();
        this._cacheTimeout = 60000; // 1 minute cache
    }

    /**
     * Fetch all agents from the API
     * @param {Object} options - Fetch options
     * @param {boolean} [options.forceRefresh=false] - Bypass cache
     * @returns {Promise<Agent[]>}
     */
    async fetchAgents({ forceRefresh = false } = {}) {
        const cacheKey = 'all-agents';

        if (!forceRefresh && this._isCacheValid(cacheKey)) {
            return this._cache.get(cacheKey).data;
        }

        Actions.setLoadingAgents(true);
        try {
            const response = await fetch(`${this._baseUrl}/agents`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const agents = data.agents || [];

            // Update cache
            this._setCache(cacheKey, agents);

            // Update store
            Actions.setAgents(agents);

            return agents;
        } catch (error) {
            console.error('[AgentService] Failed to fetch agents:', error);
            Actions.addError({ type: 'agent', message: error.message });
            throw error;
        } finally {
            Actions.setLoadingAgents(false);
        }
    }

    /**
     * Fetch activity for a specific agent
     * @param {string} agentId - Agent identifier
     * @param {Object} options - Fetch options
     * @param {boolean} [options.forceRefresh=false] - Bypass cache
     * @returns {Promise<Object[]>}
     */
    async fetchAgentActivity(agentId, { forceRefresh = false } = {}) {
        const cacheKey = `activity-${agentId}`;

        if (!forceRefresh && this._isActivityCacheValid(cacheKey)) {
            return this._activityCache.get(cacheKey).data;
        }

        try {
            const response = await fetch(`${this._baseUrl}/agents/id/${agentId}/activity`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const events = data.events || [];

            this._setActivityCache(cacheKey, events);
            return events;
        } catch (error) {
            console.error(`[AgentService] Failed to fetch activity for ${agentId}:`, error);
            return [];
        }
    }

    /**
     * Update agent activity from SSE event
     * @param {string} agentId - Agent identifier
     */
    updateAgentActivity(agentId) {
        Actions.updateAgentActivity(agentId);
        // Invalidate activity cache for this agent
        this._activityCache.delete(`activity-${agentId}`);
    }

    /**
     * Get agent by ID from store
     * @param {string} agentId - Agent identifier
     * @returns {Agent|undefined}
     */
    getAgentById(agentId) {
        return AppStore.agents.value.find(a => a.id === agentId || a.name === agentId);
    }

    /**
     * Get agent by name from store
     * @param {string} name - Agent name
     * @returns {Agent|undefined}
     */
    getAgentByName(name) {
        return AppStore.agents.value.find(a => a.name === name);
    }

    /**
     * Filter agents by query string
     * @param {string} query - Filter query
     */
    filter(query) {
        Actions.setAgentFilter(query);
    }

    /**
     * Select an agent
     * @param {Agent} agent - Agent to select
     */
    select(agent) {
        Actions.setSelectedAgent(agent);
    }

    /**
     * Get currently selected agent
     * @returns {Agent|null}
     */
    getSelected() {
        return AppStore.selectedAgent.value;
    }

    // Cache helpers
    _isCacheValid(key) {
        const cached = this._cache.get(key);
        if (!cached) return false;
        return Date.now() - cached.timestamp < this._cacheTimeout;
    }

    _isActivityCacheValid(key) {
        const cached = this._activityCache.get(key);
        if (!cached) return false;
        return Date.now() - cached.timestamp < this._cacheTimeout;
    }

    _setCache(key, data) {
        this._cache.set(key, { data, timestamp: Date.now() });
    }

    _setActivityCache(key, data) {
        this._activityCache.set(key, { data, timestamp: Date.now() });
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this._cache.clear();
        this._activityCache.clear();
    }

    /**
     * Initialize the service - fetch initial data
     */
    async init() {
        if (AppStore.agents.value.length === 0) {
            await this.fetchAgents();
        }
    }
}

export const AgentService = new AgentServiceClass();
