/**
 * Artifact Negotiator - Content type detection and renderer selection
 * @module lib/artifact-negotiator
 *
 * Implements multi-strategy content negotiation:
 * 1. Explicit renderer hint
 * 2. MIME type mapping
 * 3. File extension mapping
 * 4. Content sniffing (magic bytes for binaries)
 * 5. Default to text viewer
 */

/**
 * Renderer types
 * @enum {string}
 */
export const RendererType = {
    MARKDOWN: 'markdown',
    JSON: 'json',
    CODE: 'code',
    IMAGE: 'image',
    BINARY: 'binary',
    TEXT: 'text'
};

/**
 * Extension to renderer mapping
 */
const EXTENSION_RENDERERS = {
    // Markdown
    '.md': RendererType.MARKDOWN,
    '.markdown': RendererType.MARKDOWN,
    '.mdx': RendererType.MARKDOWN,

    // JSON/Data
    '.json': RendererType.JSON,

    // Images
    '.png': RendererType.IMAGE,
    '.jpg': RendererType.IMAGE,
    '.jpeg': RendererType.IMAGE,
    '.gif': RendererType.IMAGE,
    '.svg': RendererType.IMAGE,
    '.webp': RendererType.IMAGE,
    '.ico': RendererType.IMAGE,
    '.bmp': RendererType.IMAGE,

    // Code - JavaScript/TypeScript
    '.js': RendererType.CODE,
    '.ts': RendererType.CODE,
    '.jsx': RendererType.CODE,
    '.tsx': RendererType.CODE,
    '.mjs': RendererType.CODE,
    '.cjs': RendererType.CODE,

    // Code - Python
    '.py': RendererType.CODE,
    '.pyw': RendererType.CODE,
    '.pyi': RendererType.CODE,

    // Code - Web
    '.html': RendererType.CODE,
    '.htm': RendererType.CODE,
    '.css': RendererType.CODE,
    '.scss': RendererType.CODE,
    '.sass': RendererType.CODE,
    '.less': RendererType.CODE,

    // Code - Systems
    '.c': RendererType.CODE,
    '.cpp': RendererType.CODE,
    '.h': RendererType.CODE,
    '.hpp': RendererType.CODE,
    '.rs': RendererType.CODE,
    '.go': RendererType.CODE,

    // Code - JVM
    '.java': RendererType.CODE,
    '.kt': RendererType.CODE,
    '.scala': RendererType.CODE,
    '.groovy': RendererType.CODE,

    // Code - Other
    '.rb': RendererType.CODE,
    '.php': RendererType.CODE,
    '.swift': RendererType.CODE,
    '.cs': RendererType.CODE,
    '.r': RendererType.CODE,
    '.lua': RendererType.CODE,
    '.pl': RendererType.CODE,

    // Shell/Scripts
    '.sh': RendererType.CODE,
    '.bash': RendererType.CODE,
    '.zsh': RendererType.CODE,
    '.fish': RendererType.CODE,
    '.ps1': RendererType.CODE,
    '.bat': RendererType.CODE,
    '.cmd': RendererType.CODE,

    // Config/Data
    '.yaml': RendererType.CODE,
    '.yml': RendererType.CODE,
    '.toml': RendererType.CODE,
    '.ini': RendererType.CODE,
    '.xml': RendererType.CODE,
    '.csv': RendererType.CODE,
    '.sql': RendererType.CODE,
    '.graphql': RendererType.CODE,
    '.gql': RendererType.CODE,

    // Docker/Container
    '.dockerfile': RendererType.CODE,

    // Text
    '.txt': RendererType.TEXT,
    '.log': RendererType.TEXT,
    '.env': RendererType.CODE,
    '.gitignore': RendererType.CODE,
    '.dockerignore': RendererType.CODE,
    '.editorconfig': RendererType.CODE,

    // Binary
    '.exe': RendererType.BINARY,
    '.dll': RendererType.BINARY,
    '.so': RendererType.BINARY,
    '.dylib': RendererType.BINARY,
    '.bin': RendererType.BINARY,
    '.wasm': RendererType.BINARY,
    '.zip': RendererType.BINARY,
    '.tar': RendererType.BINARY,
    '.gz': RendererType.BINARY,
    '.rar': RendererType.BINARY,
    '.7z': RendererType.BINARY,
    '.pdf': RendererType.BINARY
};

/**
 * MIME type to renderer mapping
 */
const MIME_RENDERERS = {
    // Markdown
    'text/markdown': RendererType.MARKDOWN,
    'text/x-markdown': RendererType.MARKDOWN,

    // JSON
    'application/json': RendererType.JSON,
    'text/json': RendererType.JSON,

    // Images
    'image/png': RendererType.IMAGE,
    'image/jpeg': RendererType.IMAGE,
    'image/gif': RendererType.IMAGE,
    'image/svg+xml': RendererType.IMAGE,
    'image/webp': RendererType.IMAGE,
    'image/x-icon': RendererType.IMAGE,
    'image/bmp': RendererType.IMAGE,

    // Code
    'text/javascript': RendererType.CODE,
    'application/javascript': RendererType.CODE,
    'text/typescript': RendererType.CODE,
    'text/html': RendererType.CODE,
    'text/css': RendererType.CODE,
    'text/x-python': RendererType.CODE,
    'text/x-java-source': RendererType.CODE,
    'text/x-c': RendererType.CODE,
    'text/x-c++': RendererType.CODE,
    'text/x-go': RendererType.CODE,
    'text/x-rust': RendererType.CODE,
    'text/x-ruby': RendererType.CODE,
    'text/x-shellscript': RendererType.CODE,
    'text/yaml': RendererType.CODE,
    'application/xml': RendererType.CODE,
    'text/xml': RendererType.CODE,
    'text/csv': RendererType.CODE,
    'application/sql': RendererType.CODE,

    // Text
    'text/plain': RendererType.TEXT,

    // Binary
    'application/octet-stream': RendererType.BINARY,
    'application/pdf': RendererType.BINARY,
    'application/zip': RendererType.BINARY,
    'application/x-tar': RendererType.BINARY,
    'application/gzip': RendererType.BINARY
};

/**
 * Language mapping for syntax highlighting
 */
const EXTENSION_LANGUAGES = {
    '.js': 'javascript',
    '.ts': 'typescript',
    '.jsx': 'jsx',
    '.tsx': 'tsx',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.json': 'json',
    '.xml': 'xml',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'bash',
    '.ps1': 'powershell',
    '.md': 'markdown',
    '.graphql': 'graphql',
    '.gql': 'graphql',
    '.toml': 'toml',
    '.ini': 'ini',
    '.dockerfile': 'dockerfile',
    '.lua': 'lua',
    '.r': 'r',
    '.pl': 'perl'
};

/**
 * Magic bytes for binary detection
 */
const MAGIC_BYTES = {
    // Images
    '\x89PNG': RendererType.IMAGE,
    '\xFF\xD8\xFF': RendererType.IMAGE,  // JPEG
    'GIF87a': RendererType.IMAGE,
    'GIF89a': RendererType.IMAGE,

    // Archives
    'PK\x03\x04': RendererType.BINARY,  // ZIP
    '\x1F\x8B': RendererType.BINARY,     // GZIP
    '\x42\x5A\x68': RendererType.BINARY, // BZIP2

    // PDF
    '%PDF': RendererType.BINARY,

    // Executables
    'MZ': RendererType.BINARY,           // Windows EXE
    '\x7FELF': RendererType.BINARY       // Linux ELF
};

/**
 * Artifact Negotiator
 * Determines the appropriate renderer for a given artifact
 */
export class ArtifactNegotiator {
    /**
     * Negotiate renderer type for an artifact
     * @param {Object} artifact
     * @param {string} [artifact.path] - File path
     * @param {string} [artifact.mimeType] - MIME type if known
     * @param {string} [artifact.extension] - File extension
     * @param {string} [artifact.content] - File content (for sniffing)
     * @param {string} [artifact.rendererHint] - Explicit renderer hint
     * @returns {{rendererType: string, mimeType: string, language?: string}}
     */
    static negotiate(artifact) {
        const { path, mimeType, extension, content, rendererHint } = artifact;

        // 1. Explicit renderer hint takes precedence
        if (rendererHint && Object.values(RendererType).includes(rendererHint)) {
            return {
                rendererType: rendererHint,
                mimeType: mimeType || 'application/octet-stream',
                language: this._getLanguage(extension || this._getExtension(path))
            };
        }

        // 2. Try MIME type
        if (mimeType && MIME_RENDERERS[mimeType]) {
            const ext = extension || this._getExtension(path);
            return {
                rendererType: MIME_RENDERERS[mimeType],
                mimeType,
                language: this._getLanguage(ext)
            };
        }

        // 3. Try file extension
        const ext = extension || this._getExtension(path);
        if (ext && EXTENSION_RENDERERS[ext.toLowerCase()]) {
            return {
                rendererType: EXTENSION_RENDERERS[ext.toLowerCase()],
                mimeType: mimeType || this._getMimeFromExtension(ext),
                language: this._getLanguage(ext)
            };
        }

        // 4. Content sniffing for binary detection
        if (content && this._isBinaryContent(content)) {
            const sniffedType = this._sniffMagicBytes(content);
            return {
                rendererType: sniffedType || RendererType.BINARY,
                mimeType: 'application/octet-stream'
            };
        }

        // 5. Default to text
        return {
            rendererType: RendererType.TEXT,
            mimeType: mimeType || 'text/plain'
        };
    }

    /**
     * Get file extension from path
     * @private
     */
    static _getExtension(path) {
        if (!path) return '';
        const filename = path.split('/').pop();

        // Handle dotfiles
        if (filename.startsWith('.') && !filename.includes('.', 1)) {
            return filename; // e.g., .gitignore
        }

        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot).toLowerCase() : '';
    }

    /**
     * Get language for syntax highlighting
     * @private
     */
    static _getLanguage(extension) {
        if (!extension) return null;
        const ext = extension.toLowerCase();
        return EXTENSION_LANGUAGES[ext] || null;
    }

    /**
     * Get MIME type from extension
     * @private
     */
    static _getMimeFromExtension(extension) {
        const ext = extension.toLowerCase();
        const mimeMap = {
            '.md': 'text/markdown',
            '.json': 'application/json',
            '.js': 'text/javascript',
            '.ts': 'text/typescript',
            '.html': 'text/html',
            '.css': 'text/css',
            '.py': 'text/x-python',
            '.yaml': 'text/yaml',
            '.yml': 'text/yaml',
            '.xml': 'application/xml',
            '.txt': 'text/plain',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        return mimeMap[ext] || 'text/plain';
    }

    /**
     * Check if content appears to be binary
     * @private
     */
    static _isBinaryContent(content) {
        if (!content || typeof content !== 'string') return false;

        // Check for null bytes (strong binary indicator)
        if (content.includes('\x00')) return true;

        // Check first 512 bytes for non-printable characters
        const sample = content.substring(0, 512);
        let nonPrintable = 0;
        for (let i = 0; i < sample.length; i++) {
            const code = sample.charCodeAt(i);
            // Allow common control chars (tab, newline, carriage return)
            if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
                nonPrintable++;
            }
            // Non-ASCII in first portion suggests binary
            if (code > 127) {
                nonPrintable++;
            }
        }

        // If more than 10% are non-printable, likely binary
        return nonPrintable > sample.length * 0.1;
    }

    /**
     * Sniff magic bytes to detect file type
     * @private
     */
    static _sniffMagicBytes(content) {
        if (!content) return null;

        const prefix = content.substring(0, 8);
        for (const [magic, type] of Object.entries(MAGIC_BYTES)) {
            if (prefix.startsWith(magic)) {
                return type;
            }
        }
        return null;
    }

    /**
     * Get supported renderer types
     */
    static getRendererTypes() {
        return Object.values(RendererType);
    }

    /**
     * Check if a renderer type is valid
     */
    static isValidRenderer(type) {
        return Object.values(RendererType).includes(type);
    }
}

// Export constants for external use
export { EXTENSION_RENDERERS, MIME_RENDERERS, EXTENSION_LANGUAGES };
