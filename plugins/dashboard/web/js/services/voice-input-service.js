/**
 * Voice Input Service - Speech-to-text with audio level analysis
 * @module services/voice-input-service
 *
 * Provides voice transcription using Web Speech API with real-time
 * audio level analysis for visual feedback (glow animations).
 *
 * @example
 * const voice = new VoiceInputService();
 * voice.onTranscript((text, isFinal) => console.log(text));
 * voice.onAudioLevel((level) => updateGlow(level));
 * voice.start();
 */

class VoiceInputService {
    constructor() {
        this._recognition = null;
        this._audioContext = null;
        this._analyser = null;
        this._mediaStream = null;
        this._animationFrame = null;

        this._state = 'idle'; // idle | listening | processing | error
        this._callbacks = {
            transcript: [],
            audioLevel: [],
            stateChange: [],
            error: []
        };

        this._initRecognition();
    }

    /**
     * Check if voice input is supported in this browser
     */
    static get isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    /**
     * Get current state
     */
    get state() {
        return this._state;
    }

    /**
     * Check if currently recording
     */
    get isRecording() {
        return this._state === 'listening';
    }

    /**
     * Initialize Web Speech API
     */
    _initRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('[VoiceInput] Web Speech API not supported');
            return;
        }

        this._recognition = new SpeechRecognition();
        this._recognition.continuous = true;
        this._recognition.interimResults = true;
        this._recognition.lang = 'en-US';

        this._recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            this._emit('transcript', transcript, isFinal);
        };

        this._recognition.onerror = (event) => {
            console.error('[VoiceInput] Recognition error:', event.error);
            this._emit('error', event.error);

            if (event.error !== 'no-speech') {
                this._setState('error');
            }
        };

        this._recognition.onend = () => {
            // Auto-restart if still in listening state (handles Chrome's auto-stop)
            if (this._state === 'listening') {
                try {
                    this._recognition.start();
                } catch (e) {
                    // Already started, ignore
                }
            }
        };
    }

    /**
     * Initialize audio analysis for level metering
     */
    async _initAudioAnalysis() {
        try {
            this._mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this._analyser = this._audioContext.createAnalyser();
            this._analyser.fftSize = 256;
            this._analyser.smoothingTimeConstant = 0.8;

            const source = this._audioContext.createMediaStreamSource(this._mediaStream);
            source.connect(this._analyser);

            this._startLevelMonitoring();
        } catch (err) {
            console.error('[VoiceInput] Failed to initialize audio analysis:', err);
            this._emit('error', 'microphone-denied');
        }
    }

    /**
     * Start monitoring audio levels
     */
    _startLevelMonitoring() {
        const dataArray = new Uint8Array(this._analyser.frequencyBinCount);

        const analyze = () => {
            if (this._state !== 'listening') return;

            this._analyser.getByteFrequencyData(dataArray);

            // Calculate average level (0-255) and normalize to 0-1
            const sum = dataArray.reduce((a, b) => a + b, 0);
            const average = sum / dataArray.length;
            const normalizedLevel = Math.min(1, average / 128); // Boost sensitivity

            this._emit('audioLevel', normalizedLevel);

            this._animationFrame = requestAnimationFrame(analyze);
        };

        analyze();
    }

    /**
     * Stop audio level monitoring
     */
    _stopLevelMonitoring() {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }

        // Emit zero level to reset any visual feedback
        this._emit('audioLevel', 0);
    }

    /**
     * Clean up audio resources
     */
    _cleanupAudio() {
        this._stopLevelMonitoring();

        if (this._mediaStream) {
            this._mediaStream.getTracks().forEach(track => track.stop());
            this._mediaStream = null;
        }

        if (this._audioContext && this._audioContext.state !== 'closed') {
            this._audioContext.close();
            this._audioContext = null;
        }

        this._analyser = null;
    }

    /**
     * Set state and emit change
     */
    _setState(state) {
        if (this._state !== state) {
            this._state = state;
            this._emit('stateChange', state);
        }
    }

    /**
     * Emit event to callbacks
     */
    _emit(event, ...args) {
        this._callbacks[event]?.forEach(cb => {
            try {
                cb(...args);
            } catch (err) {
                console.error(`[VoiceInput] Callback error for ${event}:`, err);
            }
        });
    }

    /**
     * Start voice recording and transcription
     */
    async start() {
        if (!VoiceInputService.isSupported) {
            this._emit('error', 'not-supported');
            return false;
        }

        if (this._state === 'listening') {
            return true; // Already recording
        }

        try {
            // Initialize audio analysis first (requests mic permission)
            await this._initAudioAnalysis();

            // Start speech recognition
            this._recognition.start();
            this._setState('listening');

            console.log('[VoiceInput] Started recording');
            return true;
        } catch (err) {
            console.error('[VoiceInput] Failed to start:', err);
            this._emit('error', err.message);
            this._setState('error');
            return false;
        }
    }

    /**
     * Stop voice recording
     */
    stop() {
        if (this._state !== 'listening') {
            return;
        }

        try {
            this._recognition?.stop();
        } catch (e) {
            // Ignore if already stopped
        }

        this._cleanupAudio();
        this._setState('idle');

        console.log('[VoiceInput] Stopped recording');
    }

    /**
     * Toggle recording state
     * @returns {Promise<boolean>} Whether recording is now active
     */
    async toggle() {
        if (this._state === 'listening') {
            this.stop();
            return false;
        } else {
            return await this.start();
        }
    }

    /**
     * Register transcript callback
     * @param {Function} callback - (transcript: string, isFinal: boolean) => void
     */
    onTranscript(callback) {
        this._callbacks.transcript.push(callback);
        return () => this._removeCallback('transcript', callback);
    }

    /**
     * Register audio level callback
     * @param {Function} callback - (level: number) => void, level is 0-1
     */
    onAudioLevel(callback) {
        this._callbacks.audioLevel.push(callback);
        return () => this._removeCallback('audioLevel', callback);
    }

    /**
     * Register state change callback
     * @param {Function} callback - (state: 'idle'|'listening'|'processing'|'error') => void
     */
    onStateChange(callback) {
        this._callbacks.stateChange.push(callback);
        return () => this._removeCallback('stateChange', callback);
    }

    /**
     * Register error callback
     * @param {Function} callback - (error: string) => void
     */
    onError(callback) {
        this._callbacks.error.push(callback);
        return () => this._removeCallback('error', callback);
    }

    /**
     * Remove a callback
     */
    _removeCallback(event, callback) {
        const idx = this._callbacks[event]?.indexOf(callback);
        if (idx > -1) {
            this._callbacks[event].splice(idx, 1);
        }
    }

    /**
     * Clean up all resources
     */
    destroy() {
        this.stop();
        this._callbacks = { transcript: [], audioLevel: [], stateChange: [], error: [] };
        this._recognition = null;
    }
}

// Export singleton instance for easy use
const voiceInputService = new VoiceInputService();

export { VoiceInputService, voiceInputService };
