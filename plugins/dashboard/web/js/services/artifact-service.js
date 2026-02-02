/**
 * Artifact Service - Handles artifact fetching and management
 * @module services/artifact-service
 */

import { Actions, batch } from '../store/app-state.js';
import { ArtifactNegotiator } from '../lib/artifact-negotiator.js';

/**
 * @typedef {Object} ArtifactMetadata
 * @property {string} id - Unique artifact identifier
 * @property {string} path - File path
 * @property {string} filename - Filename only
 * @property {string} extension - File extension (with dot)
 * @property {string} [mimeType] - MIME type if known
 * @property {number} [size] - File size in bytes
 * @property {string} [changesetId] - Associated changeset
 * @property {string} [content] - File content
 * @property {string} [rendererType] - Negotiated renderer type
 */

class ArtifactServiceClass {
    constructor() {
        this._baseUrl = '/api';
        this._cache = new Map();
        this._cacheTimeout = 60000; // 1 minute cache
    }

    /**
     * Load an artifact and open it in the viewer
     * @param {string} path - File path to load
     * @param {string} [changesetId] - Optional changeset context
     * @returns {Promise<ArtifactMetadata>}
     */
    async loadArtifact(path, changesetId = null) {
        // Generate ID and prepare the tab
        const id = Actions.prepareArtifactLoad(path, changesetId);

        try {
            // Fetch the content
            const data = await this.fetchArtifact(path, changesetId);

            // Negotiate content type
            const negotiated = ArtifactNegotiator.negotiate({
                path,
                mimeType: data.mimeType,
                extension: this._getExtension(path),
                content: data.content
            });

            // Complete the load
            Actions.completeArtifactLoad(id, {
                content: data.content,
                mimeType: data.mimeType || negotiated.mimeType,
                size: data.size || data.content?.length || 0,
                rendererType: negotiated.rendererType
            });

            return Actions.getArtifact(id);
        } catch (error) {
            console.error(`[ArtifactService] Failed to load artifact: ${path}`, error);
            Actions.failArtifactLoad(id, error.message);
            throw error;
        }
    }

    /**
     * Fetch artifact content from API
     * @param {string} path - File path
     * @param {string} [changesetId] - Optional changeset context
     * @returns {Promise<{content: string, mimeType?: string, size?: number}>}
     */
    async fetchArtifact(path, changesetId = null) {
        // Check cache first
        const cacheKey = changesetId ? `${changesetId}:${path}` : path;
        const cached = this._getFromCache(cacheKey);
        if (cached) return cached;

        try {
            let url;
            if (changesetId) {
                // Fetch from changeset artifacts
                url = `${this._baseUrl}/changesets/${changesetId}/artifacts/${encodeURIComponent(path)}`;
            } else {
                // Fetch from general file API
                url = `${this._baseUrl}/files/${encodeURIComponent(path)}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const result = {
                content: data.content,
                mimeType: data.content_type || data.mimeType,
                size: data.size || data.content?.length
            };

            // Cache the result
            this._addToCache(cacheKey, result);

            return result;
        } catch (error) {
            console.error(`[ArtifactService] Failed to fetch: ${path}`, error);
            throw error;
        }
    }

    /**
     * Refresh an artifact (bypass cache)
     * @param {string} id - Artifact ID
     * @returns {Promise<ArtifactMetadata>}
     */
    async refreshArtifact(id) {
        const artifact = Actions.getArtifact(id);
        if (!artifact) {
            throw new Error(`Artifact not found: ${id}`);
        }

        // Clear cache for this artifact
        this._cache.delete(id);

        // Reload
        return this.loadArtifact(artifact.path, artifact.changesetId);
    }

    /**
     * Open a local file (for file system access)
     * @param {File} file - File object from file picker
     * @returns {Promise<ArtifactMetadata>}
     */
    async openLocalFile(file) {
        const id = `local:${file.name}:${Date.now()}`;
        const extension = this._getExtension(file.name);

        // Set up the artifact
        batch(() => {
            Actions.addArtifact({
                id,
                path: file.name,
                filename: file.name,
                extension,
                mimeType: file.type,
                size: file.size,
                content: null
            });
            Actions.setArtifactLoadState(id, 'loading');
            Actions.openArtifactTab(id);
        });

        try {
            // Read file content
            const content = await this._readFile(file);

            // Negotiate renderer
            const negotiated = ArtifactNegotiator.negotiate({
                path: file.name,
                mimeType: file.type,
                extension,
                content
            });

            // Complete load
            Actions.completeArtifactLoad(id, {
                content,
                mimeType: file.type || negotiated.mimeType,
                size: file.size,
                rendererType: negotiated.rendererType
            });

            return Actions.getArtifact(id);
        } catch (error) {
            Actions.failArtifactLoad(id, error.message);
            throw error;
        }
    }

    /**
     * Read file as text or base64
     * @private
     */
    _readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);

            // Read as text for text files, data URL for binary
            if (this._isTextFile(file.name, file.type)) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * Check if file should be read as text
     * @private
     */
    _isTextFile(filename, mimeType) {
        const ext = this._getExtension(filename).toLowerCase();
        const textExtensions = [
            '.txt', '.md', '.markdown', '.json', '.yaml', '.yml',
            '.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go',
            '.html', '.htm', '.css', '.scss', '.sass', '.less',
            '.xml', '.svg', '.csv', '.sql', '.sh', '.bash',
            '.c', '.cpp', '.h', '.java', '.rs', '.swift', '.kt'
        ];

        if (textExtensions.includes(ext)) return true;
        if (mimeType?.startsWith('text/')) return true;
        if (mimeType === 'application/json') return true;
        if (mimeType === 'application/javascript') return true;

        return false;
    }

    /**
     * Get file extension from path
     * @private
     */
    _getExtension(path) {
        const filename = path.split('/').pop();
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot) : '';
    }

    /**
     * Cache management
     * @private
     */
    _getFromCache(key) {
        const entry = this._cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > this._cacheTimeout) {
            this._cache.delete(key);
            return null;
        }
        return entry.data;
    }

    _addToCache(key, data) {
        this._cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Limit cache size
        if (this._cache.size > 50) {
            const oldest = [...this._cache.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
            this._cache.delete(oldest[0]);
        }
    }

    /**
     * Clear the artifact cache
     */
    clearCache() {
        this._cache.clear();
    }
}

// Export singleton
export const ArtifactService = new ArtifactServiceClass();
