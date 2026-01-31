/**
 * Dashboard Main Application - IDE Style
 * Handles navigation, theme, SSE connection, panels, tabs, and global state
 */

const Dashboard = {
    state: {
        connected: false,
        theme: localStorage.getItem('dashboard-theme') || 'light',
        eventSource: null,
        sidebarCollapsed: false,
        sidebarWidth: parseInt(localStorage.getItem('dashboard-sidebar-width')) || 280,
        panelCollapsed: false,
        panelHeight: parseInt(localStorage.getItem('dashboard-panel-height')) || 200,
        activePanel: 'explorer',
        activePanelTab: 'activity',
        explorerActiveTab: localStorage.getItem('dashboard-explorer-tab') || 'work',
        tabs: [],
        activeTabId: 'welcome',
        commandPaletteOpen: false
    },

    init() {
        this.setupTheme();
        this.setupActivityBar();
        this.setupSidebar();
        this.setupBottomPanel();
        this.setupTabBar();
        this.setupCommandPalette();
        this.setupStatusBar();
        this.setupKeyboardShortcuts();
        this.setupProfileMenu();
        this.setupModals();
        this.setupExplorerTabs();
        this.loadVersion();
        this.connectSSE();

        // Initialize sub-modules (they now need to work with tree views)
        Agents.init();
        Skills.init();
        Changesets.init();
        Graph.init();
        Tasks.init();

        // Initialize observability modules
        if (typeof ErrorStream !== 'undefined') {
            ErrorStream.init();
        }
        if (typeof TokenMeter !== 'undefined') {
            TokenMeter.init();
        }

        // Load welcome stats
        this.loadWelcomeStats();
    },

    // ==================== Theme ====================
    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        this.updateThemeIcon();

        // Title bar theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Status bar theme toggle
        const statusTheme = document.getElementById('statusTheme');
        if (statusTheme) {
            statusTheme.addEventListener('click', () => this.toggleTheme());
        }
    },

    toggleTheme() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.state.theme);
        localStorage.setItem('dashboard-theme', this.state.theme);
        this.updateThemeIcon();

        // Re-render graph if visible
        if (this.state.activeTabId === 'graph') {
            Graph.render();
        }
    },

    updateThemeIcon() {
        const icons = document.querySelectorAll('.theme-icon');
        const icon = this.state.theme === 'light' ? '☽' : '☀';
        icons.forEach(el => el.textContent = icon);

        const statusTheme = document.getElementById('statusTheme');
        if (statusTheme) {
            statusTheme.querySelector('span').textContent = icon;
        }
    },

    // ==================== Activity Bar ====================
    setupActivityBar() {
        const activityBar = document.getElementById('activityBar');
        if (!activityBar) return;

        activityBar.querySelectorAll('.activity-btn[data-panel]').forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = btn.dataset.panel;
                this.handleActivityBarClick(panel, btn);
            });
        });

        // Settings button
        const settingsBtn = activityBar.querySelector('.activity-btn[data-action="settings"]');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                document.getElementById('profileMenu').classList.toggle('open');
            });
        }
    },

    handleActivityBarClick(panel, btn) {
        // Update active button
        document.querySelectorAll('.activity-btn[data-panel]').forEach(b => {
            b.classList.toggle('active', b === btn);
        });

        // Handle panel switching
        if (panel === 'graph') {
            this.openTab('graph', 'Graph', '📊');
        } else if (panel === 'search') {
            this.openCommandPalette();
        } else {
            // Show appropriate sidebar section
            this.showSidebarSection(panel);
            if (this.state.sidebarCollapsed) {
                this.toggleSidebar();
            }
        }

        this.state.activePanel = panel;
    },

    showSidebarSection(section) {
        // With the new tabbed layout, switch to appropriate explorer tab
        if (section === 'explorer') {
            this.switchExplorerTab('agents');
        } else if (section === 'changesets') {
            this.switchExplorerTab('work');
        }
    },

    // ==================== Sidebar ====================
    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const hamburger = document.getElementById('hamburgerMenu');
        const resizeHandle = document.getElementById('sidebarResizeHandle');

        // Hamburger menu (mobile)
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Resize handle
        if (resizeHandle) {
            let isResizing = false;

            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.style.cursor = 'ew-resize';
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const newWidth = e.clientX;
                if (newWidth >= 200 && newWidth <= 500) {
                    sidebar.style.width = newWidth + 'px';
                    this.state.sidebarWidth = newWidth;
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    localStorage.setItem('dashboard-sidebar-width', this.state.sidebarWidth);
                }
            });
        }

        // Apply saved width
        sidebar.style.width = this.state.sidebarWidth + 'px';

        // Tree group toggle
        document.querySelectorAll('.tree-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const expanded = header.dataset.expanded === 'true';
                header.dataset.expanded = !expanded;
            });
        });

        // Per-tab search inputs
        const workSearch = document.getElementById('workSearch');
        if (workSearch) {
            workSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                if (Changesets && Changesets.filter) {
                    Changesets.filter(query);
                }
            });
        }

        const agentsSearch = document.getElementById('agentsSearch');
        if (agentsSearch) {
            agentsSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                if (Agents && Agents.filter) {
                    Agents.filter(query);
                }
            });
        }

        const skillsSearch = document.getElementById('skillsSearch');
        if (skillsSearch) {
            skillsSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                if (Skills && Skills.filter) {
                    Skills.filter(query);
                }
            });
        }
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', this.state.sidebarCollapsed);
    },

    filterExplorer(query) {
        // Filter based on active explorer tab
        const activeTab = this.state.explorerActiveTab;
        if (activeTab === 'work' && Changesets && Changesets.filter) {
            Changesets.filter(query);
        } else if (activeTab === 'agents' && Agents && Agents.filter) {
            Agents.filter(query);
        } else if (activeTab === 'skills' && Skills && Skills.filter) {
            Skills.filter(query);
        }
    },

    // ==================== Explorer Tabs ====================
    setupExplorerTabs() {
        const tabs = document.querySelectorAll('.explorer-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchExplorerTab(tab.dataset.tab);
            });
        });

        // Apply saved active tab
        this.switchExplorerTab(this.state.explorerActiveTab);
    },

    switchExplorerTab(tabName) {
        this.state.explorerActiveTab = tabName;
        localStorage.setItem('dashboard-explorer-tab', tabName);

        // Update tab buttons
        document.querySelectorAll('.explorer-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.explorer-tab-content').forEach(content => {
            const contentTab = content.id.replace('TabContent', '');
            content.classList.toggle('active', contentTab === tabName);
        });
    },

    updateExplorerTabCounts() {
        // Update tab counts
        const workCount = document.getElementById('workTabCount');
        const agentsCount = document.getElementById('agentsTabCount');
        const skillsCount = document.getElementById('skillsTabCount');

        if (workCount && Changesets?.data?.changesets) {
            workCount.textContent = Changesets.data.changesets.length;
        }
        if (agentsCount && Agents?.data?.agents) {
            agentsCount.textContent = Agents.data.agents.length;
        }
        if (skillsCount && Skills?.data?.skills) {
            skillsCount.textContent = Skills.data.skills.length;
        }
    },

    // ==================== Bottom Panel ====================
    setupBottomPanel() {
        const panel = document.getElementById('bottomPanel');
        const resizeHandle = document.getElementById('panelResizeHandle');
        const closeBtn = document.getElementById('closePanel');
        const maximizeBtn = document.getElementById('maximizePanel');

        // Panel tabs
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchPanelTab(tab.dataset.tab);
            });
        });

        // Close button
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggleBottomPanel());
        }

        // Maximize button
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                if (this.state.panelHeight < 400) {
                    this.state.panelHeight = 400;
                } else {
                    this.state.panelHeight = 200;
                }
                panel.style.height = this.state.panelHeight + 'px';
            });
        }

        // Resize handle
        if (resizeHandle) {
            let isResizing = false;
            let startY, startHeight;

            resizeHandle.addEventListener('mousedown', (e) => {
                isResizing = true;
                startY = e.clientY;
                startHeight = panel.offsetHeight;
                document.body.style.cursor = 'ns-resize';
                document.body.style.userSelect = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const delta = startY - e.clientY;
                const newHeight = startHeight + delta;
                if (newHeight >= 100 && newHeight <= 500) {
                    panel.style.height = newHeight + 'px';
                    this.state.panelHeight = newHeight;
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    localStorage.setItem('dashboard-panel-height', this.state.panelHeight);
                }
            });
        }

        // Apply saved height
        panel.style.height = this.state.panelHeight + 'px';
    },

    toggleBottomPanel() {
        const panel = document.getElementById('bottomPanel');
        this.state.panelCollapsed = !this.state.panelCollapsed;
        panel.classList.toggle('collapsed', this.state.panelCollapsed);
    },

    switchPanelTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.panel-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Panel');
        });

        this.state.activePanelTab = tabName;
    },

    // ==================== Tab Bar ====================
    setupTabBar() {
        const newTabBtn = document.getElementById('newTabBtn');
        if (newTabBtn) {
            newTabBtn.addEventListener('click', () => {
                this.openTab('welcome', 'Welcome', '🏠');
            });
        }

        // Add welcome tab by default
        this.addTab('welcome', 'Welcome', '🏠');
    },

    addTab(id, label, icon) {
        // Check if tab already exists
        if (this.state.tabs.find(t => t.id === id)) {
            this.activateTab(id);
            return;
        }

        const tab = { id, label, icon };
        this.state.tabs.push(tab);
        this.renderTabs();
        this.activateTab(id);
    },

    openTab(id, label, icon) {
        this.addTab(id, label, icon);
    },

    closeTab(id) {
        const index = this.state.tabs.findIndex(t => t.id === id);
        if (index === -1) return;

        this.state.tabs.splice(index, 1);

        // If closing active tab, activate another
        if (this.state.activeTabId === id) {
            const newActive = this.state.tabs[Math.max(0, index - 1)];
            if (newActive) {
                this.activateTab(newActive.id);
            } else {
                this.addTab('welcome', 'Welcome', '🏠');
            }
        }

        this.renderTabs();
    },

    activateTab(id) {
        this.state.activeTabId = id;
        this.renderTabs();
        this.showTabContent(id);
        this.updateBreadcrumbs(id);
    },

    renderTabs() {
        const tabList = document.getElementById('tabList');
        if (!tabList) return;

        tabList.innerHTML = '';

        this.state.tabs.forEach(tab => {
            const tabEl = document.createElement('button');
            tabEl.className = `tab ${tab.id === this.state.activeTabId ? 'active' : ''}`;
            tabEl.innerHTML = `
                <span class="tab-icon">${tab.icon}</span>
                <span class="tab-label">${tab.label}</span>
                <span class="tab-close" title="Close">×</span>
            `;

            tabEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close')) {
                    this.closeTab(tab.id);
                } else {
                    this.activateTab(tab.id);
                }
            });

            // Middle-click to close
            tabEl.addEventListener('auxclick', (e) => {
                if (e.button === 1) {
                    this.closeTab(tab.id);
                }
            });

            tabList.appendChild(tabEl);
        });
    },

    showTabContent(id) {
        // Hide all tab content
        document.querySelectorAll('.editor-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show requested content
        const contentMap = {
            'welcome': 'welcomeTab',
            'graph': 'graphTab'
        };

        // Check if it's a changeset tab
        if (id.startsWith('changeset-')) {
            document.getElementById('conversationTab').classList.add('active');
            // Note: Changesets.selectChangeset is already called from the sidebar click
        } else if (id.startsWith('agent-')) {
            document.getElementById('agentDetailTab').classList.add('active');
            // Agent detail is rendered by Agents.openAgentTab
        } else if (id.startsWith('skill-')) {
            document.getElementById('skillDetailTab').classList.add('active');
            // Skill detail is rendered by Skills.openSkillTab
        } else if (id.startsWith('artifact-')) {
            document.getElementById('artifactTab').classList.add('active');
            // Artifact content is rendered by Changesets.renderArtifactContent
        } else if (contentMap[id]) {
            document.getElementById(contentMap[id]).classList.add('active');
            if (id === 'graph') {
                Graph.render();
            }
        } else {
            // Default to welcome
            document.getElementById('welcomeTab').classList.add('active');
        }
    },

    updateBreadcrumbs(tabId) {
        const breadcrumbBar = document.getElementById('breadcrumbBar');
        if (!breadcrumbBar) return;

        let breadcrumbs = '<span class="breadcrumb-item">Dashboard</span>';

        if (tabId === 'graph') {
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += '<span class="breadcrumb-item current">Graph</span>';
        } else if (tabId.startsWith('changeset-')) {
            const changesetId = tabId.replace('changeset-', '');
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += '<span class="breadcrumb-item clickable">Changesets</span>';
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += `<span class="breadcrumb-item current">${changesetId.length > 20 ? changesetId.substring(0, 20) + '...' : changesetId}</span>`;
        } else if (tabId.startsWith('artifact-')) {
            // Format: artifact-{changesetId}-{filename}
            const parts = tabId.replace('artifact-', '').split('-');
            const filename = parts.pop();
            const changesetId = parts.join('-');
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += '<span class="breadcrumb-item clickable">Changesets</span>';
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += `<span class="breadcrumb-item clickable">${changesetId.length > 15 ? changesetId.substring(0, 15) + '...' : changesetId}</span>`;
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += `<span class="breadcrumb-item current">${filename}</span>`;
        } else if (tabId.startsWith('agent-')) {
            const agentId = tabId.replace('agent-', '');
            const agent = Agents?.data?.agents?.find(a => a.id === agentId);
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += '<span class="breadcrumb-item clickable">Agents</span>';
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += `<span class="breadcrumb-item current">${agent?.name || agentId}</span>`;
        } else if (tabId.startsWith('skill-')) {
            const skillId = tabId.replace('skill-', '');
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += '<span class="breadcrumb-item clickable">Skills</span>';
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += `<span class="breadcrumb-item current">/${skillId}</span>`;
        } else if (tabId === 'welcome') {
            breadcrumbs += '<span class="breadcrumb-separator">›</span>';
            breadcrumbs += '<span class="breadcrumb-item current">Welcome</span>';
        }

        breadcrumbBar.innerHTML = breadcrumbs;
    },

    // ==================== Command Palette ====================
    setupCommandPalette() {
        const overlay = document.getElementById('commandPaletteOverlay');
        const input = document.getElementById('paletteInput');
        const results = document.getElementById('paletteResults');
        const trigger = document.getElementById('commandPaletteTrigger');

        if (!overlay || !input) return;

        // Open trigger
        if (trigger) {
            trigger.addEventListener('click', () => this.openCommandPalette());
        }

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeCommandPalette();
            }
        });

        // Input handling
        input.addEventListener('input', () => {
            this.searchCommandPalette(input.value);
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCommandPalette();
            } else if (e.key === 'Enter') {
                const selected = results.querySelector('.palette-item.selected');
                if (selected) {
                    selected.click();
                }
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigatePaletteResults(e.key === 'ArrowDown' ? 1 : -1);
            }
        });
    },

    openCommandPalette() {
        const overlay = document.getElementById('commandPaletteOverlay');
        const input = document.getElementById('paletteInput');

        overlay.classList.add('open');
        input.value = '';
        input.focus();
        this.state.commandPaletteOpen = true;
        this.showDefaultPaletteResults();
    },

    closeCommandPalette() {
        const overlay = document.getElementById('commandPaletteOverlay');
        overlay.classList.remove('open');
        this.state.commandPaletteOpen = false;
    },

    showDefaultPaletteResults() {
        const results = document.getElementById('paletteResults');
        results.innerHTML = `
            <div class="palette-section">
                <div class="palette-section-title">Quick Actions</div>
                <div class="palette-item" data-action="graph">
                    <span class="palette-item-icon">📊</span>
                    <div class="palette-item-content">
                        <div class="palette-item-title">Open Graph View</div>
                        <div class="palette-item-description">Domain collaboration visualization</div>
                    </div>
                    <span class="palette-item-shortcut">⌘⇧D</span>
                </div>
                <div class="palette-item" data-action="toggle-sidebar">
                    <span class="palette-item-icon">📂</span>
                    <div class="palette-item-content">
                        <div class="palette-item-title">Toggle Sidebar</div>
                    </div>
                    <span class="palette-item-shortcut">⌘B</span>
                </div>
                <div class="palette-item" data-action="toggle-panel">
                    <span class="palette-item-icon">📋</span>
                    <div class="palette-item-content">
                        <div class="palette-item-title">Toggle Panel</div>
                    </div>
                    <span class="palette-item-shortcut">⌘J</span>
                </div>
                <div class="palette-item" data-action="toggle-theme">
                    <span class="palette-item-icon">🎨</span>
                    <div class="palette-item-content">
                        <div class="palette-item-title">Toggle Theme</div>
                    </div>
                    <span class="palette-item-shortcut">⌘⇧T</span>
                </div>
            </div>
        `;

        this.attachPaletteItemListeners();
    },

    searchCommandPalette(query) {
        if (!query.trim()) {
            this.showDefaultPaletteResults();
            return;
        }

        const results = document.getElementById('paletteResults');
        const lowerQuery = query.toLowerCase();

        // Search agents, skills, and changesets using their cache
        const agentsCache = Agents?.cache || Agents?.data?.agents || [];
        const skillsCache = Skills?.cache || Skills?.data?.skills || [];
        const changesetsCache = Changesets?.cache || Changesets?.data?.changesets || [];

        const matchedAgents = agentsCache
            .filter(a =>
                a.name?.toLowerCase().includes(lowerQuery) ||
                a.role?.toLowerCase().includes(lowerQuery) ||
                a.domain?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5);

        const matchedSkills = skillsCache
            .filter(s =>
                s.name?.toLowerCase().includes(lowerQuery) ||
                s.id?.toLowerCase().includes(lowerQuery) ||
                (s.description || '').toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5);

        const matchedChangesets = changesetsCache
            .filter(c =>
                (c.changeset_id || c.id)?.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 5);

        let html = '';

        if (matchedAgents.length) {
            html += `<div class="palette-section"><div class="palette-section-title">Agents</div>`;
            matchedAgents.forEach(agent => {
                html += `
                    <div class="palette-item" data-type="agent" data-id="${agent.id}">
                        <span class="palette-item-icon">🤖</span>
                        <div class="palette-item-content">
                            <div class="palette-item-title">${agent.name}</div>
                            <div class="palette-item-description">${agent.role || agent.domain}</div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        if (matchedSkills.length) {
            html += `<div class="palette-section"><div class="palette-section-title">Skills</div>`;
            matchedSkills.forEach(skill => {
                html += `
                    <div class="palette-item" data-type="skill" data-id="${skill.id}">
                        <span class="palette-item-icon">🔧</span>
                        <div class="palette-item-content">
                            <div class="palette-item-title">${skill.name}</div>
                            <div class="palette-item-description">${skill.domain}</div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        if (matchedChangesets.length) {
            html += `<div class="palette-section"><div class="palette-section-title">Changesets</div>`;
            matchedChangesets.forEach(cs => {
                const csId = cs.changeset_id || cs.id;
                html += `
                    <div class="palette-item" data-type="changeset" data-id="${csId}">
                        <span class="palette-item-icon">📄</span>
                        <div class="palette-item-content">
                            <div class="palette-item-title">${csId}</div>
                            ${cs.phase ? `<div class="palette-item-description">Phase: ${cs.phase}</div>` : ''}
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        if (!html) {
            html = '<div class="palette-section"><div class="palette-item"><span class="palette-item-content">No results found</span></div></div>';
        }

        results.innerHTML = html;
        this.attachPaletteItemListeners();

        // Select first result
        const firstItem = results.querySelector('.palette-item');
        if (firstItem) firstItem.classList.add('selected');
    },

    attachPaletteItemListeners() {
        const results = document.getElementById('paletteResults');

        results.querySelectorAll('.palette-item').forEach(item => {
            item.addEventListener('click', () => {
                this.executePaletteAction(item);
            });

            item.addEventListener('mouseenter', () => {
                results.querySelectorAll('.palette-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            });
        });
    },

    executePaletteAction(item) {
        const action = item.dataset.action;
        const type = item.dataset.type;
        const id = item.dataset.id;

        this.closeCommandPalette();

        if (action) {
            switch (action) {
                case 'graph':
                    this.openTab('graph', 'Graph', '📊');
                    break;
                case 'toggle-sidebar':
                    this.toggleSidebar();
                    break;
                case 'toggle-panel':
                    this.toggleBottomPanel();
                    break;
                case 'toggle-theme':
                    this.toggleTheme();
                    break;
            }
        } else if (type === 'agent') {
            Agents.showAgentDetail(id);
        } else if (type === 'skill') {
            Skills.showSkillDetail(id);
        } else if (type === 'changeset') {
            this.openTab(`changeset-${id}`, id.substring(0, 20) + '...', '📄');
        }
    },

    navigatePaletteResults(direction) {
        const results = document.getElementById('paletteResults');
        const items = Array.from(results.querySelectorAll('.palette-item'));
        const current = results.querySelector('.palette-item.selected');

        if (!items.length) return;

        let index = items.indexOf(current);
        index += direction;

        if (index < 0) index = items.length - 1;
        if (index >= items.length) index = 0;

        items.forEach(i => i.classList.remove('selected'));
        items[index].classList.add('selected');
        items[index].scrollIntoView({ block: 'nearest' });
    },

    // ==================== Status Bar ====================
    setupStatusBar() {
        const statusConnection = document.getElementById('statusConnection');
        if (statusConnection) {
            statusConnection.addEventListener('click', () => {
                if (!this.state.connected) {
                    this.connectSSE();
                }
            });
        }

        // Task list popup toggle from status bar
        const statusTasks = document.getElementById('statusTasks');
        const taskListPanel = document.getElementById('taskListPanel');
        const closeTaskListPanel = document.getElementById('closeTaskListPanel');

        if (statusTasks) {
            statusTasks.addEventListener('click', (e) => {
                // Don't toggle if clicking inside the panel (except close button)
                if (taskListPanel && taskListPanel.contains(e.target) && e.target !== closeTaskListPanel) {
                    return;
                }
                if (Tasks && Tasks.togglePopup) {
                    Tasks.togglePopup();
                }
            });
        }

        // Close button for task list panel
        if (closeTaskListPanel) {
            closeTaskListPanel.addEventListener('click', (e) => {
                e.stopPropagation();
                if (Tasks && Tasks.closePopup) {
                    Tasks.closePopup();
                }
            });
        }

        // Click outside to close task list panel
        document.addEventListener('click', (e) => {
            if (taskListPanel && taskListPanel.classList.contains('open')) {
                if (!statusTasks.contains(e.target)) {
                    if (Tasks && Tasks.closePopup) {
                        Tasks.closePopup();
                    }
                }
            }
        });
    },

    updateStatusBar() {
        // Update tasks count in status bar (select only the direct child span, not panel spans)
        const statusTasks = document.getElementById('statusTasks');
        if (Tasks && Tasks.data && statusTasks) {
            const completed = Tasks.data.tasks?.filter(t => t.status === 'completed').length || 0;
            const total = Tasks.data.tasks?.length || 0;
            const span = statusTasks.querySelector(':scope > span');
            if (span) span.textContent = `Tasks: ${completed}/${total}`;
        }

        // Update domains count
        const statusDomains = document.getElementById('statusDomains');
        if (statusDomains && Agents?.data?.agents) {
            const domains = new Set(Agents.data.agents.map(a => a.domain));
            const span = statusDomains.querySelector('span');
            if (span) span.textContent = `Domains: ${domains.size}`;
        }

        // Update PM status based on active changeset
        const statusPM = document.getElementById('statusPM');
        if (statusPM && Changesets?.data) {
            const span = statusPM.querySelector('span');
            if (span) {
                if (Changesets.data.currentChangesetId) {
                    span.textContent = 'PM: Active';
                    statusPM.classList.add('active');
                } else {
                    span.textContent = 'PM: Idle';
                    statusPM.classList.remove('active');
                }
            }
        }
    },

    // ==================== Keyboard Shortcuts ====================
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't handle shortcuts when typing in input fields
            const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

            // Command palette: Cmd+K (always works)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (this.state.commandPaletteOpen) {
                    this.closeCommandPalette();
                } else {
                    this.openCommandPalette();
                }
                return;
            }

            // Escape key (always works)
            if (e.key === 'Escape') {
                if (this.state.commandPaletteOpen) {
                    this.closeCommandPalette();
                } else {
                    document.querySelectorAll('.modal.open').forEach(modal => {
                        this.closeModal(modal.id);
                    });
                    // Close task list panel
                    if (Tasks && Tasks.closePopup) {
                        Tasks.closePopup();
                    }
                    // Close mobile sidebar
                    document.getElementById('sidebar')?.classList.remove('open');
                }
                return;
            }

            // Skip other shortcuts when in input
            if (isInputFocused) return;

            // Toggle sidebar: Cmd+B
            if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }

            // Toggle panel: Cmd+J
            if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
                e.preventDefault();
                this.toggleBottomPanel();
            }

            // Close tab: Cmd+W
            if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
                e.preventDefault();
                if (this.state.activeTabId !== 'welcome') {
                    this.closeTab(this.state.activeTabId);
                }
            }

            // Toggle theme: Cmd+Shift+T
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }

            // Open explorer: Cmd+Shift+E
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'e') {
                e.preventDefault();
                this.handleActivityBarClick('explorer',
                    document.querySelector('.activity-btn[data-panel="explorer"]'));
            }

            // Open graph: Cmd+Shift+D
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') {
                e.preventDefault();
                this.openTab('graph', 'Graph', '📊');
            }

            // Open changesets: Cmd+Shift+G
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'g') {
                e.preventDefault();
                this.handleActivityBarClick('changesets',
                    document.querySelector('.activity-btn[data-panel="changesets"]'));
            }

            // Search focus: Cmd+Shift+F
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
                e.preventDefault();
                this.openCommandPalette();
            }

            // Tab navigation: Cmd+1-9
            if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const tabIndex = parseInt(e.key) - 1;
                if (this.state.tabs[tabIndex]) {
                    this.activateTab(this.state.tabs[tabIndex].id);
                }
            }

            // Next tab: Cmd+Tab or Ctrl+PageDown
            if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.navigateTabs(1);
            }

            // Previous tab: Cmd+Shift+Tab or Ctrl+PageUp
            if ((e.metaKey || e.ctrlKey) && e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                this.navigateTabs(-1);
            }

            // Reopen closed tab: Cmd+Shift+T (if no theme toggle)
            // Note: Theme toggle takes priority, so this is handled separately
        });
    },

    /**
     * Navigate between tabs
     * @param {number} direction - 1 for next, -1 for previous
     */
    navigateTabs(direction) {
        if (this.state.tabs.length <= 1) return;

        const currentIndex = this.state.tabs.findIndex(t => t.id === this.state.activeTabId);
        let newIndex = currentIndex + direction;

        if (newIndex < 0) newIndex = this.state.tabs.length - 1;
        if (newIndex >= this.state.tabs.length) newIndex = 0;

        this.activateTab(this.state.tabs[newIndex].id);
    },

    // ==================== Modals ====================
    setupModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        const closeAgentModal = document.getElementById('closeAgentModal');
        if (closeAgentModal) {
            closeAgentModal.addEventListener('click', () => this.closeModal('agentModal'));
        }

        const closeSkillModal = document.getElementById('closeSkillModal');
        if (closeSkillModal) {
            closeSkillModal.addEventListener('click', () => this.closeModal('skillModal'));
        }

        const closeProcessModal = document.getElementById('closeProcessModal');
        if (closeProcessModal) {
            closeProcessModal.addEventListener('click', () => this.closeModal('processModal'));
        }
    },

    openModal(modalId, content) {
        const modal = document.getElementById(modalId);
        const body = modal.querySelector('.modal-body');
        body.innerHTML = content;
        modal.classList.add('open');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('open');
    },

    // ==================== Profile Menu ====================
    setupProfileMenu() {
        const menu = document.getElementById('profileMenu');
        const btn = document.getElementById('profileBtn');
        const restartBtn = document.getElementById('restartServer');
        const killBtn = document.getElementById('killServer');

        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('open');
            });
        }

        document.addEventListener('click', (e) => {
            if (menu && !menu.contains(e.target)) {
                menu.classList.remove('open');
            }
        });

        if (restartBtn) {
            restartBtn.addEventListener('click', async () => {
                if (!confirm('Restart the dashboard server? The page will reload.')) return;
                menu.classList.remove('open');
                try {
                    await fetch('/api/server/restart', { method: 'POST' });
                    setTimeout(() => window.location.reload(), 1500);
                } catch (e) {
                    setTimeout(() => window.location.reload(), 1500);
                }
            });
        }

        if (killBtn) {
            killBtn.addEventListener('click', async () => {
                if (!confirm('Kill the dashboard server? You will need to restart it manually.')) return;
                menu.classList.remove('open');
                try {
                    await fetch('/api/server/kill', { method: 'POST' });
                } catch (e) {
                    // Expected
                }
                this.updateConnectionStatus('disconnected');
            });
        }

        const processManagerBtn = document.getElementById('processManager');
        if (processManagerBtn) {
            processManagerBtn.addEventListener('click', () => {
                menu.classList.remove('open');
                this.openProcessManager();
            });
        }
    },

    // ==================== Version ====================
    async loadVersion() {
        try {
            const data = await this.fetchAPI('/api/version');
            const versionEl = document.getElementById('dashboardVersion');
            if (versionEl && data.version) {
                versionEl.textContent = `v${data.version}`;

                if (data.update_available && data.source_version) {
                    versionEl.classList.add('update-available');
                    versionEl.title = `Click to update to v${data.source_version}`;
                    versionEl.style.cursor = 'pointer';
                    versionEl.addEventListener('click', () => this.promptUpdate(data));
                }
            }
        } catch (e) {
            console.error('Error loading version:', e);
        }
    },

    async promptUpdate(versionData) {
        const confirmed = confirm(
            `Update available!\n\n` +
            `Current: v${versionData.version}\n` +
            `Available: v${versionData.source_version}\n\n` +
            `The dashboard will restart from the source directory.\n` +
            `Continue?`
        );

        if (confirmed) {
            try {
                await fetch('/api/server/update', { method: 'POST' });
                setTimeout(() => window.location.reload(), 2000);
            } catch (e) {
                console.error('Update failed:', e);
                alert('Update failed. Check console for details.');
            }
        }
    },

    // ==================== SSE Connection ====================
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

            setTimeout(() => {
                if (!this.state.connected) {
                    this.connectSSE();
                }
            }, 5000);
        };
    },

    updateConnectionStatus(status) {
        // Title bar connection status
        const titleBarStatus = document.getElementById('connectionStatus');
        if (titleBarStatus) {
            const dot = titleBarStatus.querySelector('.status-dot');
            const text = titleBarStatus.querySelector('.status-text');

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
        }

        // Status bar connection
        const statusConnection = document.getElementById('statusConnection');
        if (statusConnection) {
            const dot = statusConnection.querySelector('.status-dot');
            const text = statusConnection.querySelector('span:last-child');

            if (dot) dot.className = 'status-dot ' + status;
            if (text) {
                switch (status) {
                    case 'connected': text.textContent = 'Connected'; break;
                    case 'connecting': text.textContent = 'Connecting...'; break;
                    case 'disconnected': text.textContent = 'Disconnected'; break;
                }
            }
        }
    },

    handleSSEEvent(data) {
        if (data.type === 'heartbeat') return;

        if (data.type === 'connected') {
            console.log('SSE connected, clients:', data.client_count);
            return;
        }

        if (data.type === 'changeset_created') {
            console.log('New changeset detected:', data.data.changeset_id);
            Changesets.addChangeset(data.data);
            this.addToActivityList({
                type: 'changeset',
                message: `Changeset ${data.data.changeset_id} created`,
                time: new Date()
            });
            return;
        }

        if (data.type === 'changeset_updated') {
            console.log('Changeset updated:', data.data.changeset_id);
            Changesets.updateChangeset(data.data);
            return;
        }

        if (data.type === 'changeset_deleted') {
            console.log('Changeset deleted:', data.data.changeset_id);
            Changesets.removeChangeset(data.data.changeset_id);
            return;
        }

        if (data.type === 'transcript_message') {
            const msgData = data.data;
            const isCurrentChangeset = msgData.changeset_id === Changesets.data?.currentChangesetId;
            const isCurrentSession = msgData.session_id === Changesets.data?.currentSessionId;
            if (isCurrentChangeset || isCurrentSession) {
                Conversation.addTranscriptMessage(msgData.message, msgData.source);
            }
            return;
        }

        if (data.type === 'task_state_change') {
            Tasks.handleTaskEvent(data.data);
            this.updateStatusBar();
            return;
        }

        if (data.type === 'conversation_event') {
            this.addToActivityList({
                type: data.data.event_type,
                message: data.data.agent_id || data.data.skill_id || 'Event',
                time: new Date(data.data.timestamp)
            });
            Changesets.handleEvent(data.data);

            if (data.data.agent_id) {
                Agents.updateActivity(data.data.agent_id);
            }
            if (data.data.skill_id) {
                Skills.updateActivity(data.data.skill_id);
            }
        }
    },

    addToActivityList(event) {
        const list = document.getElementById('activityList');
        if (!list) return;

        const item = document.createElement('div');
        item.className = 'activity-item';

        const time = event.time instanceof Date ? event.time.toLocaleTimeString() : new Date().toLocaleTimeString();
        const icon = event.type === 'changeset' ? '▶' : event.type === 'agent_activated' ? '●' : '→';

        item.innerHTML = `
            <span class="activity-time">${time}</span>
            <span class="activity-icon">${icon}</span>
            <span class="activity-message">${event.message}</span>
        `;

        list.insertBefore(item, list.firstChild);

        while (list.children.length > 50) {
            list.removeChild(list.lastChild);
        }
    },

    // ==================== Welcome Stats ====================
    async loadWelcomeStats() {
        const statsContainer = document.getElementById('welcomeStats');
        if (!statsContainer) return;

        try {
            const [agentsResponse, skillsResponse] = await Promise.all([
                this.fetchAPI('/api/agents'),
                this.fetchAPI('/api/skills')
            ]);

            // Handle API response format (may have agents/skills wrapper)
            const agents = agentsResponse.agents || agentsResponse || [];
            const skills = skillsResponse.skills || skillsResponse || [];

            const domains = new Set([
                ...agents.map(a => a.domain),
                ...skills.map(s => s.domain)
            ]);

            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${agents.length}</div>
                    <div class="stat-label">Agents</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${skills.length}</div>
                    <div class="stat-label">Skills</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${domains.size}</div>
                    <div class="stat-label">Domains</div>
                </div>
            `;

            // Update status bar after loading stats
            this.updateStatusBar();
        } catch (e) {
            console.error('Error loading welcome stats:', e);
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">--</div>
                    <div class="stat-label">Agents</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">--</div>
                    <div class="stat-label">Skills</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">--</div>
                    <div class="stat-label">Domains</div>
                </div>
            `;
        }
    },

    // ==================== Process Manager ====================
    openProcessManager() {
        const modal = document.getElementById('processModal');
        const body = document.getElementById('processModalBody');

        body.innerHTML = this.buildProcessManagerLoading();
        modal.classList.add('open');

        this.refreshProcessList();
    },

    async refreshProcessList() {
        const body = document.getElementById('processModalBody');

        try {
            const data = await this.fetchAPI('/api/processes');
            body.innerHTML = this.buildProcessManagerContent(data);
            this.setupProcessManagerHandlers(data);
        } catch (error) {
            body.innerHTML = this.buildProcessManagerError('Failed to load processes: ' + error.message);
        }
    },

    buildProcessManagerContent(data) {
        const { processes, current_pid, count } = data;

        let processListHtml = '';

        if (processes.length === 0) {
            processListHtml = `
                <div class="process-empty">
                    <div class="process-empty-icon">⚙️</div>
                    <div>No dashboard processes found</div>
                </div>
            `;
        } else {
            processListHtml = processes.map(proc => {
                const isCurrent = proc.current;
                const canKill = !isCurrent || processes.length > 1;

                return `
                    <div class="process-item${isCurrent ? ' current' : ''}">
                        <div class="process-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                                <rect x="9" y="9" width="6" height="6"></rect>
                                <line x1="9" y1="1" x2="9" y2="4"></line>
                                <line x1="15" y1="1" x2="15" y2="4"></line>
                                <line x1="9" y1="20" x2="9" y2="23"></line>
                                <line x1="15" y1="20" x2="15" y2="23"></line>
                                <line x1="20" y1="9" x2="23" y2="9"></line>
                                <line x1="20" y1="14" x2="23" y2="14"></line>
                                <line x1="1" y1="9" x2="4" y2="9"></line>
                                <line x1="1" y1="14" x2="4" y2="14"></line>
                            </svg>
                        </div>
                        <div class="process-info">
                            <div class="process-pid">
                                PID ${proc.pid}
                                ${isCurrent ? '<span class="process-current-badge">Current</span>' : ''}
                            </div>
                            <div class="process-started">${proc.started}</div>
                            <div class="process-command" title="${proc.command}">${proc.command}</div>
                        </div>
                        <button class="process-kill-btn"
                                data-pid="${proc.pid}"
                                data-current="${isCurrent}"
                                ${!canKill ? 'disabled title="Cannot kill the only running process"' : 'title="Kill process"'}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                `;
            }).join('');
        }

        return `
            <div class="process-manager-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                    <line x1="9" y1="1" x2="9" y2="4"></line>
                    <line x1="15" y1="1" x2="15" y2="4"></line>
                    <line x1="9" y1="20" x2="9" y2="23"></line>
                    <line x1="15" y1="20" x2="15" y2="23"></line>
                    <line x1="20" y1="9" x2="23" y2="9"></line>
                    <line x1="20" y1="14" x2="23" y2="14"></line>
                    <line x1="1" y1="9" x2="4" y2="9"></line>
                    <line x1="1" y1="14" x2="4" y2="14"></line>
                </svg>
                <h3>Process Manager</h3>
            </div>
            <div class="process-list">
                ${processListHtml}
            </div>
            <div class="process-manager-footer">
                <span class="process-count">${count} process${count !== 1 ? 'es' : ''} running</span>
                <button class="process-refresh-btn" id="processRefreshBtn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    Refresh
                </button>
            </div>
        `;
    },

    buildProcessManagerLoading() {
        return `
            <div class="process-manager-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                    <line x1="9" y1="1" x2="9" y2="4"></line>
                    <line x1="15" y1="1" x2="15" y2="4"></line>
                    <line x1="9" y1="20" x2="9" y2="23"></line>
                    <line x1="15" y1="20" x2="15" y2="23"></line>
                    <line x1="20" y1="9" x2="23" y2="9"></line>
                    <line x1="20" y1="14" x2="23" y2="14"></line>
                    <line x1="1" y1="9" x2="4" y2="9"></line>
                    <line x1="1" y1="14" x2="4" y2="14"></line>
                </svg>
                <h3>Process Manager</h3>
            </div>
            <div class="process-manager-loading">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 4v6h-6"></path>
                    <path d="M1 20v-6h6"></path>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                <div>Loading processes...</div>
            </div>
        `;
    },

    buildProcessManagerError(message) {
        return `
            <div class="process-manager-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                    <line x1="9" y1="1" x2="9" y2="4"></line>
                    <line x1="15" y1="1" x2="15" y2="4"></line>
                    <line x1="9" y1="20" x2="9" y2="23"></line>
                    <line x1="15" y1="20" x2="15" y2="23"></line>
                    <line x1="20" y1="9" x2="23" y2="9"></line>
                    <line x1="20" y1="14" x2="23" y2="14"></line>
                    <line x1="1" y1="9" x2="4" y2="9"></line>
                    <line x1="1" y1="14" x2="4" y2="14"></line>
                </svg>
                <h3>Process Manager</h3>
            </div>
            <div class="process-manager-error">
                <div>${message}</div>
            </div>
            <div class="process-manager-footer">
                <span class="process-count">Error loading processes</span>
                <button class="process-refresh-btn" id="processRefreshBtn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    Retry
                </button>
            </div>
        `;
    },

    setupProcessManagerHandlers(data) {
        // Refresh button
        const refreshBtn = document.getElementById('processRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.classList.add('spinning');
                await this.refreshProcessList();
            });
        }

        // Kill buttons
        document.querySelectorAll('.process-kill-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const pid = parseInt(btn.dataset.pid);
                const isCurrent = btn.dataset.current === 'true';
                const processItem = btn.closest('.process-item');

                const message = isCurrent
                    ? 'Kill this process? The dashboard will disconnect.'
                    : `Kill process ${pid}?`;

                if (!confirm(message)) return;

                // Set pending state
                processItem.classList.add('killing');
                btn.disabled = true;
                btn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinning">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                `;

                try {
                    const response = await fetch(`/api/processes/${pid}/kill`, { method: 'POST' });
                    const result = await response.json();

                    if (response.ok) {
                        if (isCurrent) {
                            this.closeModal('processModal');
                            this.updateConnectionStatus('disconnected');
                        } else {
                            // Verify process is actually gone by polling
                            await this.verifyProcessKilled(pid, processItem);
                        }
                    } else {
                        // Reset state on error
                        processItem.classList.remove('killing');
                        btn.disabled = false;
                        btn.innerHTML = `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        `;
                        alert(result.error || 'Failed to kill process');
                    }
                } catch (error) {
                    if (isCurrent) {
                        // Connection lost is expected when killing current
                        this.closeModal('processModal');
                        this.updateConnectionStatus('disconnected');
                    } else {
                        // Reset state on error
                        processItem.classList.remove('killing');
                        btn.disabled = false;
                        btn.innerHTML = `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        `;
                        alert('Failed to kill process: ' + error.message);
                    }
                }
            });
        });
    },

    async verifyProcessKilled(pid, processItem) {
        const maxAttempts = 10;
        const pollInterval = 300; // ms

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));

            try {
                const data = await this.fetchAPI('/api/processes');
                const stillExists = data.processes.some(p => p.pid === pid);

                if (!stillExists) {
                    // Process confirmed killed - animate removal
                    processItem.classList.add('removed');
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await this.refreshProcessList();
                    return;
                }
            } catch (e) {
                // API error, continue polling
            }
        }

        // Timeout - refresh anyway
        await this.refreshProcessList();
    },

    // ==================== Utilities ====================
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
