/**
 * Dashboard Main Application
 * Handles navigation, theme, SSE connection, and global state
 */

const Dashboard = {
    state: {
        connected: false,
        theme: localStorage.getItem('dashboard-theme') || 'light',
        currentView: 'agents',
        eventSource: null
    },

    init() {
        this.setupTheme();
        this.setupNavigation();
        this.setupModals();
        this.setupActivityFeed();
        this.setupProfileMenu();
        this.loadVersion();
        this.connectSSE();

        // Initialize sub-modules
        Agents.init();
        Skills.init();
        Sessions.init();
        Graph.init();
    },

    async loadVersion() {
        try {
            const data = await this.fetchAPI('/api/version');
            const versionEl = document.getElementById('dashboardVersion');
            if (versionEl && data.version) {
                versionEl.textContent = `Dashboard v${data.version}`;
            }
        } catch (e) {
            console.error('Error loading version:', e);
        }
    },

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        this.updateThemeIcon();

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', this.state.theme);
            localStorage.setItem('dashboard-theme', this.state.theme);
            this.updateThemeIcon();

            // Re-render graph if visible
            if (this.state.currentView === 'graph') {
                Graph.render();
            }
        });
    },

    updateThemeIcon() {
        const icon = document.querySelector('.theme-icon');
        icon.textContent = this.state.theme === 'light' ? '\u263E' : '\u2600';
    },

    setupNavigation() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
    },

    switchView(viewName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === viewName + 'View');
        });

        this.state.currentView = viewName;

        // Initialize view-specific content
        if (viewName === 'graph') {
            Graph.render();
        }
    },

    setupModals() {
        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close buttons
        document.getElementById('closeAgentModal').addEventListener('click', () => {
            this.closeModal('agentModal');
        });
        document.getElementById('closeSkillModal').addEventListener('click', () => {
            this.closeModal('skillModal');
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    this.closeModal(modal.id);
                });
            }
        });
    },

    openModal(modalId, content) {
        const modal = document.getElementById(modalId);
        const body = modal.querySelector('.modal-body');
        body.innerHTML = content;
        modal.classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    setupActivityFeed() {
        const feed = document.getElementById('activityFeed');
        const header = feed.querySelector('.feed-header');

        header.addEventListener('click', () => {
            feed.classList.toggle('collapsed');
        });
    },

    setupProfileMenu() {
        const menu = document.getElementById('profileMenu');
        const btn = document.getElementById('profileBtn');
        const restartBtn = document.getElementById('restartServer');
        const killBtn = document.getElementById('killServer');

        // Toggle dropdown
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('open');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                menu.classList.remove('open');
            }
        });

        // Restart server
        restartBtn.addEventListener('click', async () => {
            if (!confirm('Restart the dashboard server? The page will reload.')) return;
            menu.classList.remove('open');
            try {
                await fetch('/api/server/restart', { method: 'POST' });
                // Wait a moment then reload
                setTimeout(() => window.location.reload(), 1500);
            } catch (e) {
                // Server restarted, reload page
                setTimeout(() => window.location.reload(), 1500);
            }
        });

        // Kill server
        killBtn.addEventListener('click', async () => {
            if (!confirm('Kill the dashboard server? You will need to restart it manually.')) return;
            menu.classList.remove('open');
            try {
                await fetch('/api/server/kill', { method: 'POST' });
            } catch (e) {
                // Expected - server is dead
            }
            this.updateConnectionStatus('disconnected');
        });
    },

    connectSSE() {
        this.updateConnectionStatus('connecting');

        this.state.eventSource = new EventSource('/api/stream');

        this.state.eventSource.onopen = () => {
            this.state.connected = true;
            this.updateConnectionStatus('connected');
        };

        this.state.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleSSEEvent(data);
            } catch (e) {
                console.error('Error parsing SSE event:', e);
            }
        };

        this.state.eventSource.onerror = () => {
            this.state.connected = false;
            this.updateConnectionStatus('disconnected');

            // Reconnect after delay
            setTimeout(() => {
                if (!this.state.connected) {
                    this.connectSSE();
                }
            }, 5000);
        };
    },

    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connectionStatus');
        const dot = statusEl.querySelector('.status-dot');
        const text = statusEl.querySelector('.status-text');

        dot.className = 'status-dot ' + status;

        switch (status) {
            case 'connected':
                text.textContent = 'Connected';
                break;
            case 'connecting':
                text.textContent = 'Connecting...';
                break;
            case 'disconnected':
                text.textContent = 'Disconnected';
                break;
        }
    },

    handleSSEEvent(data) {
        if (data.type === 'heartbeat') {
            return;
        }

        if (data.type === 'connected') {
            console.log('SSE connected, clients:', data.client_count);
            return;
        }

        // Handle new session created
        if (data.type === 'session_created') {
            console.log('New session detected:', data.data.session_id);
            Sessions.addSession(data.data);
            return;
        }

        // Handle real-time transcript messages
        if (data.type === 'transcript_message') {
            const msgData = data.data;
            // Only update if we're viewing the relevant session
            if (msgData.session_id === Sessions.data.currentSessionId) {
                Conversation.addTranscriptMessage(msgData.message, msgData.source);
            }
            return;
        }

        if (data.type === 'conversation_event') {
            this.addToActivityFeed(data.data);
            Sessions.handleEvent(data.data);

            // Update agent/skill activity
            if (data.data.agent_id) {
                Agents.updateActivity(data.data.agent_id);
            }
            if (data.data.skill_id) {
                Skills.updateActivity(data.data.skill_id);
            }
        }
    },

    addToActivityFeed(event) {
        const feed = document.getElementById('feedContent');
        const item = document.createElement('div');
        item.className = 'feed-item';

        const time = new Date(event.timestamp).toLocaleTimeString();
        const type = event.event_type.replace(/_/g, ' ');

        let content = `<div class="feed-item-time">${time}</div>`;
        content += `<div class="feed-item-type">${type}</div>`;

        if (event.agent_id) {
            content += `<div>Agent: ${event.agent_id}</div>`;
        }
        if (event.skill_id) {
            content += `<div>Skill: ${event.skill_id}</div>`;
        }

        item.innerHTML = content;
        feed.insertBefore(item, feed.firstChild);

        // Limit feed items
        while (feed.children.length > 50) {
            feed.removeChild(feed.lastChild);
        }
    },

    async fetchAPI(endpoint) {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    },

    formatTime(isoString) {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return date.toLocaleDateString();
    },

    getDomainClass(domain) {
        return 'domain-' + domain.replace(/_/g, '-');
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});
