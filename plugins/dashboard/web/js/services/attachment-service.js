/**
 * AttachmentService - Handles image attachments via paste, drag-drop, and file picker
 * Provides validation, preview generation, and attachment management
 * @module services/attachment-service
 */

// Supported image types for Claude API
const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
];

// Maximum file size (20MB as per Claude API limits)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Maximum number of attachments per message
const MAX_ATTACHMENTS = 5;

/**
 * Attachment object structure
 * @typedef {Object} Attachment
 * @property {string} id - Unique identifier
 * @property {string} name - File name
 * @property {string} type - MIME type
 * @property {number} size - File size in bytes
 * @property {string} preview - Base64 data URL for preview
 * @property {string} data - Base64 encoded file data (without data URL prefix)
 * @property {File} [file] - Original File object if available
 */

class AttachmentService {
    /**
     * Generate unique attachment ID
     * @returns {string}
     */
    static generateId() {
        return `attach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if a MIME type is supported
     * @param {string} type - MIME type
     * @returns {boolean}
     */
    static isSupported(type) {
        return SUPPORTED_IMAGE_TYPES.includes(type);
    }

    /**
     * Get supported types for file input accept attribute
     * @returns {string}
     */
    static get acceptTypes() {
        return SUPPORTED_IMAGE_TYPES.join(',');
    }

    /**
     * Get maximum file size in bytes
     * @returns {number}
     */
    static get maxFileSize() {
        return MAX_FILE_SIZE;
    }

    /**
     * Get maximum number of attachments
     * @returns {number}
     */
    static get maxAttachments() {
        return MAX_ATTACHMENTS;
    }

    /**
     * Format file size for display
     * @param {number} bytes
     * @returns {string}
     */
    static formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    /**
     * Validate a file for attachment
     * @param {File|Blob} file
     * @returns {{ valid: boolean, error?: string }}
     */
    static validate(file) {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        if (!this.isSupported(file.type)) {
            return {
                valid: false,
                error: `Unsupported file type: ${file.type}. Supported: JPEG, PNG, GIF, WebP`
            };
        }

        if (file.size > MAX_FILE_SIZE) {
            return {
                valid: false,
                error: `File too large: ${this.formatSize(file.size)}. Maximum: ${this.formatSize(MAX_FILE_SIZE)}`
            };
        }

        return { valid: true };
    }

    /**
     * Read file as base64 data URL
     * @param {File|Blob} file
     * @returns {Promise<string>} Base64 data URL
     */
    static readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Extract base64 data from data URL (removes the data:type;base64, prefix)
     * @param {string} dataUrl
     * @returns {string}
     */
    static extractBase64(dataUrl) {
        const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/);
        return match ? match[1] : dataUrl;
    }

    /**
     * Create thumbnail preview (resized for display)
     * @param {string} dataUrl - Original data URL
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @returns {Promise<string>} Thumbnail data URL
     */
    static async createThumbnail(dataUrl, maxWidth = 100, maxHeight = 100) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                // Calculate scaled dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                // Create canvas and draw scaled image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        });
    }

    /**
     * Process a file into an Attachment object
     * @param {File|Blob} file
     * @param {string} [name] - Optional name override (for blobs)
     * @returns {Promise<Attachment>}
     */
    static async processFile(file, name = null) {
        const validation = this.validate(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const dataUrl = await this.readAsDataURL(file);
        const preview = await this.createThumbnail(dataUrl);

        return {
            id: this.generateId(),
            name: name || file.name || `image_${Date.now()}.${file.type.split('/')[1]}`,
            type: file.type,
            size: file.size,
            preview: preview,
            data: this.extractBase64(dataUrl),
            file: file instanceof File ? file : undefined
        };
    }

    /**
     * Extract images from clipboard event
     * @param {ClipboardEvent} event
     * @returns {Promise<Attachment[]>}
     */
    static async fromClipboard(event) {
        const items = event.clipboardData?.items;
        if (!items) return [];

        const attachments = [];

        for (const item of items) {
            if (item.kind === 'file' && this.isSupported(item.type)) {
                const file = item.getAsFile();
                if (file) {
                    try {
                        const attachment = await this.processFile(file, `pasted_image_${Date.now()}.${file.type.split('/')[1]}`);
                        attachments.push(attachment);
                    } catch (err) {
                        console.warn('[AttachmentService] Failed to process pasted image:', err);
                    }
                }
            }
        }

        return attachments;
    }

    /**
     * Extract images from drag event
     * @param {DragEvent} event
     * @returns {Promise<Attachment[]>}
     */
    static async fromDrop(event) {
        const files = event.dataTransfer?.files;
        if (!files) return [];

        const attachments = [];

        for (const file of files) {
            if (this.isSupported(file.type)) {
                try {
                    const attachment = await this.processFile(file);
                    attachments.push(attachment);
                } catch (err) {
                    console.warn('[AttachmentService] Failed to process dropped file:', err);
                }
            }
        }

        return attachments;
    }

    /**
     * Extract images from file input
     * @param {HTMLInputElement} input
     * @returns {Promise<Attachment[]>}
     */
    static async fromFileInput(input) {
        const files = input.files;
        if (!files) return [];

        const attachments = [];

        for (const file of files) {
            if (this.isSupported(file.type)) {
                try {
                    const attachment = await this.processFile(file);
                    attachments.push(attachment);
                } catch (err) {
                    console.warn('[AttachmentService] Failed to process selected file:', err);
                }
            }
        }

        return attachments;
    }

    /**
     * Convert attachments to Claude API format
     * @param {Attachment[]} attachments
     * @returns {Array<{type: 'image', source: {type: 'base64', media_type: string, data: string}}>}
     */
    static toClaudeFormat(attachments) {
        return attachments.map(att => ({
            type: 'image',
            source: {
                type: 'base64',
                media_type: att.type,
                data: att.data
            }
        }));
    }
}

export { AttachmentService, SUPPORTED_IMAGE_TYPES, MAX_FILE_SIZE, MAX_ATTACHMENTS };
