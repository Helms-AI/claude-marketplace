/**
 * Skill Service - Handles skill data fetching and caching
 * @module services/skill-service
 */

import { AppStore, Actions } from '../store/app-state.js';

/**
 * @typedef {Object} Skill
 * @property {string} id - Unique skill identifier (command name)
 * @property {string} name - Display name
 * @property {string} domain - Domain/plugin the skill belongs to
 * @property {string} [description] - Skill description
 * @property {string} [backing_agent] - Agent that powers this skill
 * @property {string[]} [handoff_inputs] - Skills that hand off to this one
 * @property {string[]} [handoff_outputs] - Skills this one hands off to
 * @property {number} [invocation_count] - Total invocations
 * @property {string} [last_invoked] - ISO timestamp of last invocation
 */

class SkillServiceClass {
    constructor() {
        this._baseUrl = '/api';
        this._cache = new Map();
        this._invocationCache = new Map();
        this._cacheTimeout = 60000; // 1 minute cache
    }

    /**
     * Fetch all skills from the API
     * @param {Object} options - Fetch options
     * @param {boolean} [options.forceRefresh=false] - Bypass cache
     * @returns {Promise<Skill[]>}
     */
    async fetchSkills({ forceRefresh = false } = {}) {
        const cacheKey = 'all-skills';

        if (!forceRefresh && this._isCacheValid(cacheKey)) {
            return this._cache.get(cacheKey).data;
        }

        Actions.setLoadingSkills(true);
        try {
            const response = await fetch(`${this._baseUrl}/skills`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const skills = data.skills || [];

            this._setCache(cacheKey, skills);
            Actions.setSkills(skills);

            return skills;
        } catch (error) {
            console.error('[SkillService] Failed to fetch skills:', error);
            Actions.addError({ type: 'skill', message: error.message });
            throw error;
        } finally {
            Actions.setLoadingSkills(false);
        }
    }

    /**
     * Fetch invocations for a specific skill
     * @param {string} skillId - Skill identifier
     * @param {Object} options - Fetch options
     * @param {boolean} [options.forceRefresh=false] - Bypass cache
     * @returns {Promise<Object[]>}
     */
    async fetchSkillInvocations(skillId, { forceRefresh = false } = {}) {
        const cacheKey = `invocations-${skillId}`;

        if (!forceRefresh && this._isInvocationCacheValid(cacheKey)) {
            return this._invocationCache.get(cacheKey).data;
        }

        try {
            const response = await fetch(`${this._baseUrl}/skills/id/${skillId}/invocations`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const invocations = data.invocations || [];

            this._setInvocationCache(cacheKey, invocations);
            return invocations;
        } catch (error) {
            console.error(`[SkillService] Failed to fetch invocations for ${skillId}:`, error);
            return [];
        }
    }

    /**
     * Update skill activity from SSE event
     * @param {string} skillId - Skill identifier
     */
    updateSkillActivity(skillId) {
        Actions.updateSkillActivity(skillId);
        // Invalidate invocation cache for this skill
        this._invocationCache.delete(`invocations-${skillId}`);
    }

    /**
     * Get skill by ID from store
     * @param {string} skillId - Skill identifier
     * @returns {Skill|undefined}
     */
    getSkillById(skillId) {
        return AppStore.skills.value.find(s => s.id === skillId || s.name === skillId);
    }

    /**
     * Get skill by name from store
     * @param {string} name - Skill name
     * @returns {Skill|undefined}
     */
    getSkillByName(name) {
        return AppStore.skills.value.find(s => s.name === name);
    }

    /**
     * Filter skills by query string
     * @param {string} query - Filter query
     */
    filter(query) {
        Actions.setSkillFilter(query);
    }

    /**
     * Select a skill
     * @param {Skill} skill - Skill to select
     */
    select(skill) {
        Actions.setSelectedSkill(skill);
    }

    /**
     * Get currently selected skill
     * @returns {Skill|null}
     */
    getSelected() {
        return AppStore.selectedSkill.value;
    }

    /**
     * Check if skill has handoff relationships
     * @param {Skill} skill - Skill to check
     * @returns {boolean}
     */
    hasHandoffs(skill) {
        return (skill.handoff_inputs?.length > 0) || (skill.handoff_outputs?.length > 0);
    }

    // Cache helpers
    _isCacheValid(key) {
        const cached = this._cache.get(key);
        if (!cached) return false;
        return Date.now() - cached.timestamp < this._cacheTimeout;
    }

    _isInvocationCacheValid(key) {
        const cached = this._invocationCache.get(key);
        if (!cached) return false;
        return Date.now() - cached.timestamp < this._cacheTimeout;
    }

    _setCache(key, data) {
        this._cache.set(key, { data, timestamp: Date.now() });
    }

    _setInvocationCache(key, data) {
        this._invocationCache.set(key, { data, timestamp: Date.now() });
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this._cache.clear();
        this._invocationCache.clear();
    }

    /**
     * Initialize the service - fetch initial data
     */
    async init() {
        if (AppStore.skills.value.length === 0) {
            await this.fetchSkills();
        }
    }
}

export const SkillService = new SkillServiceClass();
