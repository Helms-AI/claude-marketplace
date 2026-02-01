/**
 * API Service - Centralized HTTP API calls
 * @module services/api-service
 */

class APIServiceClass {
    baseUrl = '';

    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} [options] - Fetch options
     * @returns {Promise<any>}
     */
    async get(endpoint, options = {}) {
        return this._request('GET', endpoint, options);
    }

    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} [data] - Request body
     * @param {Object} [options] - Fetch options
     * @returns {Promise<any>}
     */
    async post(endpoint, data = null, options = {}) {
        return this._request('POST', endpoint, {
            ...options,
            body: data ? JSON.stringify(data) : undefined,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }

    /**
     * Make a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} [data] - Request body
     * @param {Object} [options] - Fetch options
     * @returns {Promise<any>}
     */
    async put(endpoint, data = null, options = {}) {
        return this._request('PUT', endpoint, {
            ...options,
            body: data ? JSON.stringify(data) : undefined,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
    }

    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint
     * @param {Object} [options] - Fetch options
     * @returns {Promise<any>}
     */
    async delete(endpoint, options = {}) {
        return this._request('DELETE', endpoint, options);
    }

    /**
     * Internal request handler
     * @private
     */
    async _request(method, endpoint, options = {}) {
        const url = this.baseUrl + endpoint;

        const response = await fetch(url, {
            method,
            ...options
        });

        if (!response.ok) {
            const error = new Error(`API error: ${response.status}`);
            error.status = response.status;
            error.response = response;
            throw error;
        }

        // Handle empty responses
        const text = await response.text();
        if (!text) return null;

        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    // Convenience methods for common endpoints

    async getVersion() {
        return this.get('/api/version');
    }

    async getAgents() {
        const data = await this.get('/api/agents');
        return data.agents || data || [];
    }

    async getSkills() {
        const data = await this.get('/api/skills');
        return data.skills || data || [];
    }

    async getChangesets() {
        const data = await this.get('/api/changesets');
        return data.changesets || data || [];
    }

    async getChangeset(id) {
        return this.get(`/api/changesets/${id}`);
    }

    async getTasks() {
        const data = await this.get('/api/tasks');
        return data.tasks || data || [];
    }

    async getProcesses() {
        return this.get('/api/processes');
    }

    async killProcess(pid) {
        return this.post(`/api/processes/${pid}/kill`);
    }

    async restartServer() {
        return this.post('/api/server/restart');
    }

    async killServer() {
        return this.post('/api/server/kill');
    }

    async checkHealth() {
        return this.get('/api/health');
    }
}

// Singleton export
export const APIService = new APIServiceClass();
export { APIServiceClass };

// Alias for backwards compatibility
export const ApiService = APIService;
