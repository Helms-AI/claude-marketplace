/**
 * About Modal - Dark Techie Aesthetic
 * @module components/organisms/about-modal
 *
 * A sophisticated "developer command center at 2AM" about modal featuring:
 * - Void black palette with cyan pulse accents
 * - JetBrains Mono typography throughout
 * - Noise grain texture overlay (3% opacity)
 * - Vignette effect for depth
 * - Atmospheric cyan/purple gradient blobs
 * - "System boot" entrance choreography with cyan flashes
 * - Data stream animated footer
 * - Glow-based hover interactions
 * - Full keyboard accessibility with focus trap
 * - prefers-reduced-motion support
 * - Live marketplace statistics
 * - Domain color legend
 *
 * Modified by 🦞 (Kade @ OpenClaw)
 */
import { LitElement, html, css } from 'lit';

class AboutModal extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        version: { type: String },
        stats: { type: Object }
    };

    static styles = css`
        /* ========================================
           CSS Custom Properties - Dark Techie Palette
           ======================================== */
        :host {
            /* Void Black Palette */
            --void-black: #0a0b0f;
            --carbon: #12141a;
            --graphite: #1a1d25;
            --steel: #2a2e38;
            --chrome: #7a8194;
            --silver: #b8bcc8;
            --white: #f0f0f2;

            /* Accent Colors - The Glow */
            --cyan-pulse: #00d4ff;
            --terminal-green: #00ff88;
            --warning-amber: #ffaa00;
            --phantom-purple: #6366f1;
            --lobster-red: #ff4500;

            /* Domain Colors */
            --domain-frontend: #00d4ff;
            --domain-backend: #00ff88;
            --domain-architecture: #6366f1;
            --domain-testing: #f59e0b;
            --domain-devops: #ef4444;
            --domain-security: #ec4899;
            --domain-data: #60a5fa;
            --domain-docs: #a78bfa;
            --domain-ux: #f472b6;
            --domain-mobile: #34d399;

            /* Glow Effects */
            --glow-cyan:
                0 0 20px rgba(0, 212, 255, 0.3),
                0 0 40px rgba(0, 212, 255, 0.15),
                0 0 60px rgba(0, 212, 255, 0.05);
            --glow-text: 0 0 30px rgba(0, 212, 255, 0.4);
            --glow-subtle: 0 0 15px rgba(0, 212, 255, 0.2);

            /* Typography */
            --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;

            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
        }

        :host([open]) {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* ========================================
           Backdrop
           ======================================== */
        .backdrop {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(12px);
            opacity: 0;
            animation: backdropFadeIn 100ms ease-out forwards;
        }

        @keyframes backdropFadeIn {
            to { opacity: 1; }
        }

        /* ========================================
           Modal Container - 90vw x 90vh
           ======================================== */
        .modal {
            position: relative;
            width: 90vw;
            height: 90vh;
            max-width: 1400px;
            background: var(--void-black);
            border-radius: 12px;
            border: 1px solid var(--steel);
            overflow: hidden;
            box-shadow:
                0 0 0 1px rgba(0, 212, 255, 0.1),
                0 25px 50px rgba(0, 0, 0, 0.5),
                0 0 100px rgba(0, 212, 255, 0.05);
            opacity: 0;
            transform: scale(0.98) translateY(-10px);
            animation: modalBootUp 200ms 50ms cubic-bezier(0.16, 1, 0.3, 1) forwards;

            display: grid;
            grid-template-rows: 1fr auto;
            gap: 0;
        }

        @keyframes modalBootUp {
            0% {
                opacity: 0;
                transform: scale(0.98) translateY(-10px);
            }
            20% {
                opacity: 0.8;
            }
            40% {
                opacity: 1;
            }
            60% {
                opacity: 0.9;
            }
            100% {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        /* Noise Grain Overlay */
        .modal::after {
            content: '';
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            opacity: 0.03;
            pointer-events: none;
            mix-blend-mode: overlay;
            z-index: 100;
            border-radius: 12px;
        }

        /* Vignette Effect */
        .vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(
                ellipse at center,
                transparent 0%,
                transparent 40%,
                rgba(5, 5, 10, 0.5) 100%
            );
            pointer-events: none;
            z-index: 50;
            border-radius: 12px;
        }

        /* Scan Lines (Very Subtle) */
        .scan-lines {
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.03) 2px,
                rgba(0, 0, 0, 0.03) 4px
            );
            pointer-events: none;
            z-index: 51;
            border-radius: 12px;
        }

        /* ========================================
           Main Content Grid - 60% / 35% Split
           ======================================== */
        .content-container {
            position: relative;
            z-index: 10;
            display: grid;
            grid-template-columns: 60% 35%;
            gap: 32px;
            padding: 32px;
            overflow-y: auto;
        }

        .content-container::-webkit-scrollbar {
            width: 6px;
        }

        .content-container::-webkit-scrollbar-track {
            background: var(--carbon);
        }

        .content-container::-webkit-scrollbar-thumb {
            background: var(--steel);
            border-radius: 3px;
        }

        .content-container::-webkit-scrollbar-thumb:hover {
            background: var(--chrome);
        }

        /* ========================================
           Hero Card (Left - 60%)
           ======================================== */
        .hero-card {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 32px;
            padding: 48px;
            background: var(--carbon);
            border-radius: 8px;
            border-left: 2px solid var(--cyan-pulse);
            overflow: hidden;
            opacity: 0;
            transform: translateX(-20px);
            filter: blur(4px);
            animation: heroMaterialize 250ms 150ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
            box-shadow:
                inset 2px 0 30px rgba(0, 212, 255, 0.08),
                0 4px 24px rgba(0, 0, 0, 0.4);
        }

        @keyframes heroMaterialize {
            0% {
                opacity: 0;
                transform: translateX(-20px);
                filter: blur(4px);
            }
            60% {
                filter: blur(0);
            }
            100% {
                opacity: 1;
                transform: translateX(0);
                filter: blur(0);
            }
        }

        /* Cyan atmospheric blob - top right */
        .hero-card::before {
            content: '';
            position: absolute;
            top: -30%;
            right: -20%;
            width: 70%;
            height: 80%;
            background: radial-gradient(
                ellipse at top right,
                rgba(0, 212, 255, 0.08) 0%,
                transparent 60%
            );
            pointer-events: none;
            z-index: 0;
        }

        .hero-content {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .hero-title {
            font-family: var(--font-mono);
            font-size: 56px;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.1;
            color: var(--white);
            margin: 0;
            text-shadow: var(--glow-text);
        }

        .hero-subtitle {
            font-family: var(--font-mono);
            font-size: 16px;
            font-weight: 400;
            color: var(--chrome);
            margin: 0;
            letter-spacing: 0.02em;
        }

        .version-badge {
            display: inline-flex;
            align-items: center;
            align-self: flex-start;
            padding: 6px 14px;
            font-family: var(--font-mono);
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.05em;
            color: var(--cyan-pulse);
            background: rgba(0, 212, 255, 0.1);
            border: 1px solid rgba(0, 212, 255, 0.3);
            border-radius: 4px;
            animation: heartbeat 5s ease-in-out infinite;
            animation-delay: 1s;
        }

        @keyframes heartbeat {
            0%, 90%, 100% { opacity: 1; }
            95% { opacity: 0.7; }
        }

        /* Stats Section */
        .stats-section {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
        }

        .stat-card {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 20px;
            background: var(--graphite);
            border-radius: 8px;
            border: 1px solid var(--steel);
            text-align: center;
            opacity: 0;
            transform: translateY(8px);
            animation: statReveal 200ms calc(350ms + var(--stat-delay)) cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transition: all 200ms ease-out;
        }

        .stat-card:nth-child(1) { --stat-delay: 0ms; }
        .stat-card:nth-child(2) { --stat-delay: 50ms; }
        .stat-card:nth-child(3) { --stat-delay: 100ms; }

        @keyframes statReveal {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .stat-card:hover {
            border-color: var(--cyan-pulse);
            box-shadow: var(--glow-subtle);
            transform: translateY(-2px);
        }

        .stat-value {
            font-family: var(--font-mono);
            font-size: 36px;
            font-weight: 700;
            color: var(--cyan-pulse);
            line-height: 1;
            text-shadow: var(--glow-text);
        }

        .stat-label {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--chrome);
        }

        /* Tech Stack Section */
        .tech-stack {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .section-header {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: var(--chrome);
            margin: 0;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--steel);
        }

        .tech-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }

        .tech-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            font-family: var(--font-mono);
            font-size: 13px;
            font-weight: 500;
            color: var(--silver);
            background: var(--graphite);
            border-radius: 6px;
            border: 1px solid transparent;
            opacity: 0;
            transform: translateY(4px);
            animation: techReveal 150ms calc(300ms + var(--stagger-delay)) cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transition: all 150ms ease-out;
        }

        @keyframes techReveal {
            0% {
                opacity: 0;
                transform: translateY(4px);
                box-shadow: inset 0 0 0 1px var(--cyan-pulse);
            }
            50% {
                opacity: 1;
                box-shadow: inset 0 0 0 1px var(--cyan-pulse);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
                box-shadow: none;
            }
        }

        .tech-item:nth-child(1) { --stagger-delay: 0ms; }
        .tech-item:nth-child(2) { --stagger-delay: 20ms; }
        .tech-item:nth-child(3) { --stagger-delay: 40ms; }
        .tech-item:nth-child(4) { --stagger-delay: 60ms; }
        .tech-item:nth-child(5) { --stagger-delay: 80ms; }
        .tech-item:nth-child(6) { --stagger-delay: 100ms; }
        .tech-item:nth-child(7) { --stagger-delay: 120ms; }
        .tech-item:nth-child(8) { --stagger-delay: 140ms; }

        .tech-item:hover {
            background: var(--steel);
            border-color: transparent;
            box-shadow: inset 3px 0 0 var(--cyan-pulse);
        }

        .domain-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
            transition: transform 200ms ease-out;
            box-shadow: 0 0 8px currentColor;
        }

        .tech-item:hover .domain-dot {
            transform: scale(1.3);
        }

        .domain-dot.frontend {
            background: var(--domain-frontend);
            color: var(--domain-frontend);
        }
        .domain-dot.backend {
            background: var(--domain-backend);
            color: var(--domain-backend);
        }
        .domain-dot.data {
            background: var(--domain-data);
            color: var(--domain-data);
        }
        .domain-dot.architecture {
            background: var(--domain-architecture);
            color: var(--domain-architecture);
        }

        /* ========================================
           System Card (Right - 35%)
           ======================================== */
        .system-card {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 32px;
            padding: 48px;
            background: var(--carbon);
            border-radius: 8px;
            border: 1px solid var(--steel);
            overflow: hidden;
            opacity: 0;
            transform: translateX(20px);
            animation: systemSlideIn 250ms 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        }

        @keyframes systemSlideIn {
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        /* Purple atmospheric blob - bottom left */
        .system-card::before {
            content: '';
            position: absolute;
            bottom: -20%;
            left: -30%;
            width: 80%;
            height: 70%;
            background: radial-gradient(
                ellipse at bottom left,
                rgba(99, 102, 241, 0.06) 0%,
                transparent 50%
            );
            pointer-events: none;
            z-index: 0;
        }

        .info-section,
        .links-section,
        .domains-section {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .info-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 16px;
            padding: 10px 0;
            border-bottom: 1px solid var(--steel);
        }

        .info-row:last-child {
            border-bottom: none;
        }

        .data-label {
            font-family: var(--font-mono);
            font-size: 12px;
            font-weight: 400;
            letter-spacing: 0.02em;
            color: var(--chrome);
        }

        .data-value {
            font-family: var(--font-mono);
            font-size: 13px;
            font-weight: 500;
            color: var(--silver);
            text-align: right;
        }

        /* Domain Pills */
        .domain-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .domain-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            font-family: var(--font-mono);
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--silver);
            background: var(--graphite);
            border-radius: 16px;
            border: 1px solid var(--steel);
            transition: all 150ms ease-out;
        }

        .domain-pill:hover {
            border-color: var(--pill-color, var(--cyan-pulse));
            box-shadow: 0 0 12px var(--pill-color, var(--cyan-pulse));
        }

        .domain-pill .pill-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--pill-color, var(--cyan-pulse));
        }

        /* Links Section */
        .links-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .link-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            font-family: var(--font-mono);
            font-size: 13px;
            font-weight: 500;
            color: var(--silver);
            text-decoration: none;
            background: transparent;
            border-radius: 6px;
            border: 1px solid transparent;
            transition: all 200ms ease-out;
            cursor: pointer;
        }

        .link-item:hover {
            background: rgba(0, 212, 255, 0.05);
            border-color: rgba(0, 212, 255, 0.2);
            text-shadow: var(--glow-text);
            color: var(--white);
        }

        .link-item:focus-visible {
            outline: 2px solid var(--cyan-pulse);
            outline-offset: 2px;
            box-shadow: var(--glow-subtle);
        }

        .link-arrow {
            color: var(--chrome);
            font-size: 14px;
            font-weight: 700;
            transition: all 200ms ease-out;
        }

        .link-item:hover .link-arrow {
            transform: translateX(4px);
            color: var(--cyan-pulse);
        }

        /* ========================================
           Footer Bar
           ======================================== */
        .modal-footer {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px 32px;
            background: var(--carbon);
            border-top: 1px solid var(--steel);
            opacity: 0;
            animation: footerFadeIn 150ms 450ms ease-out forwards;
        }

        @keyframes footerFadeIn {
            to { opacity: 1; }
        }

        /* Data Stream Animation */
        .data-stream {
            height: 2px;
            background: linear-gradient(
                90deg,
                transparent 0%,
                var(--cyan-pulse) 50%,
                transparent 100%
            );
            background-size: 200% 100%;
            border-radius: 1px;
            animation: dataFlow 3s linear infinite;
        }

        @keyframes dataFlow {
            0% { background-position: 100% 0; }
            100% { background-position: -100% 0; }
        }

        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .close-hint {
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 400;
            letter-spacing: 0.05em;
            color: var(--chrome);
        }

        .close-hint kbd {
            display: inline-block;
            padding: 2px 6px;
            font-family: var(--font-mono);
            font-size: 10px;
            background: var(--graphite);
            border: 1px solid var(--steel);
            border-radius: 3px;
            margin: 0 2px;
        }

        .attribution {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 400;
            color: var(--chrome);
        }

        .attribution .lobster {
            font-size: 16px;
            filter: drop-shadow(0 0 4px var(--lobster-red));
            animation: lobsterWave 2s ease-in-out infinite;
        }

        @keyframes lobsterWave {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
        }

        .attribution a {
            color: var(--lobster-red);
            text-decoration: none;
            transition: all 150ms ease-out;
        }

        .attribution a:hover {
            text-shadow: 0 0 8px var(--lobster-red);
        }

        /* ========================================
           Close Button
           ======================================== */
        .close-btn {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--carbon);
            border: 1px solid var(--steel);
            border-radius: 6px;
            color: var(--chrome);
            font-size: 20px;
            font-weight: 300;
            line-height: 1;
            cursor: pointer;
            transition: all 300ms ease-out;
            z-index: 110;
        }

        .close-btn:hover {
            transform: rotate(90deg);
            background: var(--graphite);
            border-color: var(--cyan-pulse);
            color: var(--cyan-pulse);
            box-shadow: var(--glow-cyan);
        }

        .close-btn:focus-visible {
            outline: 2px solid var(--cyan-pulse);
            outline-offset: 2px;
            box-shadow: var(--glow-cyan);
        }

        /* ========================================
           Accessibility - Reduced Motion
           ======================================== */
        @media (prefers-reduced-motion: reduce) {
            .backdrop,
            .modal,
            .hero-card,
            .system-card,
            .tech-item,
            .stat-card,
            .modal-footer,
            .version-badge,
            .data-stream,
            .attribution .lobster {
                animation: none !important;
                opacity: 1 !important;
                transform: none !important;
                filter: none !important;
            }

            .tech-item,
            .stat-card,
            .link-item,
            .close-btn,
            .domain-dot,
            .link-arrow,
            .domain-pill {
                transition: none !important;
            }
        }

        /* ========================================
           Responsive Stacking
           ======================================== */
        @media (max-width: 900px) {
            .modal {
                width: 95vw;
                height: 95vh;
            }

            .content-container {
                grid-template-columns: 1fr;
                gap: 24px;
                padding: 24px;
            }

            .hero-card,
            .system-card {
                padding: 32px;
            }

            .hero-title {
                font-size: 36px;
            }

            .tech-grid {
                grid-template-columns: 1fr;
            }

            .stats-grid {
                grid-template-columns: repeat(3, 1fr);
            }

            .stat-value {
                font-size: 28px;
            }
        }

        @media (max-width: 600px) {
            .hero-title {
                font-size: 28px;
            }

            .hero-card,
            .system-card {
                padding: 24px;
            }

            .content-container {
                padding: 16px;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .footer-content {
                flex-direction: column;
                gap: 8px;
                text-align: center;
            }
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.version = '?.?.?';
        this.stats = {
            agents: 58,
            skills: 77,
            domains: 10
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this._handleKeyDown = this._handleKeyDown.bind(this);
        // Load JetBrains Mono font
        this._loadFont();
        // Fetch live stats if available
        this._fetchStats();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this._handleKeyDown);
    }

    /**
     * Load JetBrains Mono from Google Fonts
     */
    _loadFont() {
        if (!document.querySelector('link[href*="JetBrains+Mono"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap';
            document.head.appendChild(link);
        }
    }

    /**
     * Fetch live stats from API
     */
    async _fetchStats() {
        try {
            const [agentsRes, skillsRes, domainsRes] = await Promise.all([
                fetch('/api/agents').then(r => r.ok ? r.json() : null),
                fetch('/api/skills').then(r => r.ok ? r.json() : null),
                fetch('/api/domains').then(r => r.ok ? r.json() : null)
            ]);

            this.stats = {
                agents: agentsRes?.length || this.stats.agents,
                skills: skillsRes?.length || this.stats.skills,
                domains: domainsRes?.length || this.stats.domains
            };
        } catch (e) {
            // Keep default stats on error
            console.debug('Could not fetch live stats:', e);
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('open')) {
            if (this.open) {
                // Add keyboard listener
                document.addEventListener('keydown', this._handleKeyDown);

                // Focus trap - focus close button
                this.updateComplete.then(() => {
                    const closeBtn = this.shadowRoot.querySelector('.close-btn');
                    if (closeBtn) closeBtn.focus();
                });
            } else {
                document.removeEventListener('keydown', this._handleKeyDown);
            }
        }
    }

    /**
     * Keyboard handler - Escape to close
     */
    _handleKeyDown(e) {
        if (e.key === 'Escape' && this.open) {
            this._handleClose();
        }
    }

    _handleClose() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    _handleBackdropClick(e) {
        if (e.target.classList.contains('backdrop')) {
            this._handleClose();
        }
    }

    _openLink(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    render() {
        const techStack = [
            { name: 'Lit 3.x', domain: 'frontend' },
            { name: 'Preact Signals', domain: 'frontend' },
            { name: 'Flask + Python', domain: 'backend' },
            { name: 'D3.js', domain: 'data' },
            { name: 'Claude SDK', domain: 'architecture' },
            { name: 'Web Components', domain: 'frontend' },
            { name: 'SSE Streaming', domain: 'backend' },
            { name: 'Atomic Design', domain: 'architecture' }
        ];

        const domains = [
            { name: 'Frontend', color: 'var(--domain-frontend)' },
            { name: 'Backend', color: 'var(--domain-backend)' },
            { name: 'Architecture', color: 'var(--domain-architecture)' },
            { name: 'Testing', color: 'var(--domain-testing)' },
            { name: 'DevOps', color: 'var(--domain-devops)' },
            { name: 'Security', color: 'var(--domain-security)' },
            { name: 'Data', color: 'var(--domain-data)' },
            { name: 'Docs', color: 'var(--domain-docs)' },
            { name: 'UX', color: 'var(--domain-ux)' },
            { name: 'Mobile', color: 'var(--domain-mobile)' }
        ];

        return html`
            <div class="backdrop" @click=${this._handleBackdropClick}>
                <div
                    class="modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    @click=${(e) => e.stopPropagation()}
                >
                    <!-- Atmospheric Layers -->
                    <div class="vignette"></div>
                    <div class="scan-lines"></div>

                    <button
                        class="close-btn"
                        @click=${this._handleClose}
                        aria-label="Close modal"
                    >×</button>

                    <div class="content-container">
                        <!-- Hero Card (60%) -->
                        <div class="hero-card">
                            <div class="hero-content">
                                <h1 id="modal-title" class="hero-title">
                                    Claude<br>Marketplace
                                </h1>
                                <p class="hero-subtitle">Enterprise plugin ecosystem for Claude Code</p>
                                <span class="version-badge">${this.version.startsWith('v') ? this.version : 'v' + this.version}</span>
                            </div>

                            <div class="stats-section">
                                <h2 class="section-header">Ecosystem</h2>
                                <div class="stats-grid">
                                    <div class="stat-card">
                                        <span class="stat-value">${this.stats.agents}</span>
                                        <span class="stat-label">Agents</span>
                                    </div>
                                    <div class="stat-card">
                                        <span class="stat-value">${this.stats.skills}</span>
                                        <span class="stat-label">Skills</span>
                                    </div>
                                    <div class="stat-card">
                                        <span class="stat-value">${this.stats.domains}</span>
                                        <span class="stat-label">Domains</span>
                                    </div>
                                </div>
                            </div>

                            <div class="tech-stack">
                                <h2 class="section-header">Technologies</h2>
                                <div class="tech-grid">
                                    ${techStack.map(tech => html`
                                        <div class="tech-item">
                                            <span class="domain-dot ${tech.domain}"></span>
                                            ${tech.name}
                                        </div>
                                    `)}
                                </div>
                            </div>
                        </div>

                        <!-- System Card (35%) -->
                        <div class="system-card">
                            <section class="info-section">
                                <h2 class="section-header">System Info</h2>
                                <dl class="info-list">
                                    <div class="info-row">
                                        <dt class="data-label">Developed by</dt>
                                        <dd class="data-value">Ryan Helms</dd>
                                    </div>
                                    <div class="info-row">
                                        <dt class="data-label">Powered by</dt>
                                        <dd class="data-value">Helms AI</dd>
                                    </div>
                                    <div class="info-row">
                                        <dt class="data-label">License</dt>
                                        <dd class="data-value">MIT</dd>
                                    </div>
                                    <div class="info-row">
                                        <dt class="data-label">Build</dt>
                                        <dd class="data-value">${new Date().toISOString().split('T')[0]}</dd>
                                    </div>
                                </dl>
                            </section>

                            <section class="domains-section">
                                <h2 class="section-header">Domains</h2>
                                <div class="domain-pills">
                                    ${domains.map(d => html`
                                        <span class="domain-pill" style="--pill-color: ${d.color}">
                                            <span class="pill-dot"></span>
                                            ${d.name}
                                        </span>
                                    `)}
                                </div>
                            </section>

                            <section class="links-section">
                                <h2 class="section-header">Links</h2>
                                <nav class="links-list">
                                    <a
                                        class="link-item"
                                        tabindex="0"
                                        @click=${() => this._openLink('https://github.com/Helms-AI/claude-marketplace')}
                                        @keydown=${(e) => e.key === 'Enter' && this._openLink('https://github.com/Helms-AI/claude-marketplace')}
                                    >
                                        <span class="link-arrow">→</span>
                                        GitHub
                                    </a>
                                    <a
                                        class="link-item"
                                        tabindex="0"
                                        @click=${() => this._openLink('https://docs.openclaw.ai')}
                                        @keydown=${(e) => e.key === 'Enter' && this._openLink('https://docs.openclaw.ai')}
                                    >
                                        <span class="link-arrow">→</span>
                                        Documentation
                                    </a>
                                    <a
                                        class="link-item"
                                        tabindex="0"
                                        @click=${() => this._openLink('https://helms.ai')}
                                        @keydown=${(e) => e.key === 'Enter' && this._openLink('https://helms.ai')}
                                    >
                                        <span class="link-arrow">→</span>
                                        Helms AI
                                    </a>
                                </nav>
                            </section>
                        </div>
                    </div>

                    <!-- Footer -->
                    <footer class="modal-footer">
                        <div class="data-stream" aria-hidden="true"></div>
                        <div class="footer-content">
                            <span class="close-hint">Press <kbd>ESC</kbd> to close</span>
                            <span class="attribution">
                                Modified by <span class="lobster">🦞</span>
                                <a href="https://openclaw.ai" target="_blank" rel="noopener">OpenClaw</a>
                            </span>
                        </div>
                    </footer>
                </div>
            </div>
        `;
    }
}

customElements.define('about-modal', AboutModal);
export { AboutModal };
