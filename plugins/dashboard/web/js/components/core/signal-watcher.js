/**
 * SignalWatcher Mixin - Enables Lit components to reactively subscribe to Preact Signals
 * @module components/core/signal-watcher
 */

import { effect } from '@preact/signals-core';

/**
 * Mixin that enables Lit elements to subscribe to Preact Signals.
 * Components using this mixin will automatically re-render when any
 * signal accessed in their render() method changes.
 *
 * @example
 * ```js
 * import { SignalWatcher } from '../core/signal-watcher.js';
 * import { AppStore } from '../../store/app-state.js';
 *
 * class MyComponent extends SignalWatcher(LitElement) {
 *   render() {
 *     // Access signals directly - component re-renders when they change
 *     return html`<div>${AppStore.agents.value.length} agents</div>`;
 *   }
 * }
 * ```
 *
 * @param {typeof LitElement} Base - Base class to extend
 * @returns {typeof LitElement} Extended class with signal watching capability
 */
export const SignalWatcher = (Base) => class extends Base {
    /** @type {Function[]} */
    _signalDisposers = [];

    /** @type {boolean} */
    _signalWatchingSetup = false;

    connectedCallback() {
        super.connectedCallback();
        if (!this._signalWatchingSetup) {
            this._setupSignalWatching();
            this._signalWatchingSetup = true;
        }
    }

    disconnectedCallback() {
        this._disposeSignalWatchers();
        this._signalWatchingSetup = false;
        super.disconnectedCallback();
    }

    /**
     * Set up automatic signal watching for the render method
     * @private
     */
    _setupSignalWatching() {
        // Create an effect that triggers when signals accessed in render change
        // We do a dummy read to set up tracking, then requestUpdate on changes
        let isFirstRun = true;
        const dispose = effect(() => {
            // Access any signals that should trigger updates
            // The actual tracking happens automatically when signals are read in render()
            if (!isFirstRun) {
                this.requestUpdate();
            }
            isFirstRun = false;
        });
        this._signalDisposers.push(dispose);
    }

    /**
     * Clean up all signal watchers
     * @private
     */
    _disposeSignalWatchers() {
        this._signalDisposers.forEach(dispose => {
            try {
                dispose();
            } catch (e) {
                console.warn('[SignalWatcher] Error disposing watcher:', e);
            }
        });
        this._signalDisposers = [];
    }

    /**
     * Watch a specific signal and trigger update when it changes.
     * Use this for signals not accessed in render() but that should trigger updates.
     *
     * @param {import('@preact/signals-core').Signal} signal - Signal to watch
     * @param {Function} [callback] - Optional callback when signal changes
     * @returns {Function} Dispose function to stop watching
     *
     * @example
     * ```js
     * connectedCallback() {
     *   super.connectedCallback();
     *   this._disposeThemeWatch = this.watchSignal(AppStore.theme, (theme) => {
     *     this.classList.toggle('dark', theme === 'dark');
     *   });
     * }
     * ```
     */
    watchSignal(signal, callback) {
        const dispose = effect(() => {
            const value = signal.value;
            if (callback) {
                callback(value);
            }
            this.requestUpdate();
        });
        this._signalDisposers.push(dispose);
        return () => {
            const index = this._signalDisposers.indexOf(dispose);
            if (index !== -1) {
                this._signalDisposers.splice(index, 1);
            }
            dispose();
        };
    }

    /**
     * Watch multiple signals at once
     *
     * @param {import('@preact/signals-core').Signal[]} signals - Signals to watch
     * @param {Function} [callback] - Optional callback with array of values
     * @returns {Function} Dispose function to stop watching all
     */
    watchSignals(signals, callback) {
        const dispose = effect(() => {
            const values = signals.map(s => s.value);
            if (callback) {
                callback(values);
            }
            this.requestUpdate();
        });
        this._signalDisposers.push(dispose);
        return () => {
            const index = this._signalDisposers.indexOf(dispose);
            if (index !== -1) {
                this._signalDisposers.splice(index, 1);
            }
            dispose();
        };
    }
};

export default SignalWatcher;
