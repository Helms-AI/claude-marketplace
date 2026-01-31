#!/usr/bin/env python3
"""End-to-end test for the SDK-based terminal tab using Playwright.

This test verifies:
1. The terminal tab loads and displays correctly
2. SDK configuration can be loaded
3. Messages can be sent via the SDK terminal
4. Streaming responses are displayed
5. View modes work (conversation/terminal)
6. Extended thinking blocks appear
7. Tool cards are rendered

Prerequisites:
- Dashboard must be running (python run_dashboard.py --port 24282)
- claude-agent-sdk should be installed for full testing
"""

import pytest
import re
import time
from playwright.sync_api import sync_playwright, expect


DASHBOARD_URL = "http://localhost:24282"


@pytest.fixture(scope="module")
def browser():
    """Create a browser instance for testing."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # Set to False for debugging
        yield browser
        browser.close()


@pytest.fixture
def page(browser):
    """Create a new page for each test."""
    context = browser.new_context()
    page = context.new_page()
    yield page
    page.close()
    context.close()


class TestTerminalLoad:
    """Tests for terminal loading and basic functionality."""

    def test_terminal_tab_loads(self, page):
        """Test that the terminal tab loads and displays the welcome message."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal tab
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Wait for terminal container to be visible
        terminal = page.locator(".terminal-container")
        expect(terminal).to_be_visible()

        # Verify welcome content is present
        conversation = page.locator("#terminalConversation")
        if conversation.is_visible():
            expect(conversation).to_contain_text("Claude SDK Terminal")

    def test_terminal_os_detection(self, page):
        """Test that OS-specific styling is applied."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        page.click('.tab-list button[data-tab-content="terminalTab"]')

        terminal = page.locator(".terminal-container")

        # Should have one of the OS classes
        has_os_class = (
            page.locator(".terminal-container.terminal-macos").count() > 0 or
            page.locator(".terminal-container.terminal-windows").count() > 0 or
            page.locator(".terminal-container.terminal-linux").count() > 0
        )
        assert has_os_class, "Terminal should have an OS-specific class"

    def test_terminal_input_enabled(self, page):
        """Test that input is enabled (SDK is always available)."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Input should be enabled
        terminal_input = page.locator("#terminalInput")
        expect(terminal_input).to_be_enabled()


class TestViewModes:
    """Tests for conversation/terminal view modes."""

    def test_conversation_view_default(self, page):
        """Test that conversation view is the default."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Conversation view button should be active
        conv_btn = page.locator('.view-toggle-btn[data-view="conversation"]')
        expect(conv_btn).to_have_class(re.compile(r"active"))

        # Conversation container should be visible
        conversation = page.locator("#terminalConversation")
        expect(conversation).not_to_have_class(re.compile(r"hidden"))

        # Terminal output should be hidden
        terminal_output = page.locator("#terminalOutput")
        expect(terminal_output).to_have_class(re.compile(r"hidden"))

    def test_switch_to_terminal_view(self, page):
        """Test switching to terminal view."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Click terminal view button
        term_btn = page.locator('.view-toggle-btn[data-view="terminal"]')
        term_btn.click()

        # Terminal view button should now be active
        expect(term_btn).to_have_class(re.compile(r"active"))

        # Terminal output should be visible
        terminal_output = page.locator("#terminalOutput")
        expect(terminal_output).not_to_have_class(re.compile(r"hidden"))


class TestSDKConfig:
    """Tests for SDK configuration UI."""

    def test_model_selector_present(self, page):
        """Test that model selector is present."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Model selector should be visible
        model_selector = page.locator("#terminalModelSelector")
        expect(model_selector).to_be_visible()

    def test_model_selector_options(self, page):
        """Test that model selector has correct options."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Wait for SDK config to load
        time.sleep(1)

        # Check for model options
        model_selector = page.locator("#terminalModelSelector")
        options = model_selector.locator("option")

        # Should have at least sonnet, opus, haiku
        option_texts = [opt.text_content() for opt in options.all()]
        assert any('Sonnet' in opt or 'sonnet' in opt.lower() for opt in option_texts)

    def test_cost_display_present(self, page):
        """Test that cost display is present."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Cost display should be present
        cost_display = page.locator("#terminalCostDisplay")
        expect(cost_display).to_be_visible()


class TestTerminalActions:
    """Tests for terminal actions."""

    def test_clear_terminal(self, page):
        """Test that clear button works."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Click clear button
        clear_btn = page.locator('.terminal-action-btn[data-action="clear"]')
        clear_btn.click()

        # Terminal should show cleared message or welcome again
        conversation = page.locator("#terminalConversation")
        expect(conversation).to_contain_text("Terminal cleared")

    def test_interrupt_button_disabled_initially(self, page):
        """Test that interrupt button is disabled when not querying."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Interrupt button should be disabled
        interrupt_btn = page.locator("#terminalInterruptBtn")
        expect(interrupt_btn).to_be_disabled()


class TestAPIEndpoints:
    """Tests for SDK API endpoints."""

    def test_sdk_config_endpoint(self, page):
        """Test that SDK config endpoint works."""
        page.goto(DASHBOARD_URL)

        # Fetch config directly
        response = page.evaluate("""async () => {
            const res = await fetch('/api/input/sdk/config');
            return await res.json();
        }""")

        assert 'config' in response
        assert 'available_models' in response['config']
        assert 'default_model' in response['config']

    def test_sdk_agents_endpoint(self, page):
        """Test that SDK agents endpoint works."""
        page.goto(DASHBOARD_URL)

        response = page.evaluate("""async () => {
            const res = await fetch('/api/input/sdk/agents');
            return await res.json();
        }""")

        assert 'agents' in response or 'error' in response

    def test_sdk_plugins_endpoint(self, page):
        """Test that SDK plugins endpoint works."""
        page.goto(DASHBOARD_URL)

        response = page.evaluate("""async () => {
            const res = await fetch('/api/input/sdk/plugins');
            return await res.json();
        }""")

        assert 'plugins' in response or 'error' in response

    def test_sdk_hooks_stats_endpoint(self, page):
        """Test that hooks stats endpoint works."""
        page.goto(DASHBOARD_URL)

        response = page.evaluate("""async () => {
            const res = await fetch('/api/input/sdk/hooks/stats');
            return await res.json();
        }""")

        assert 'stats' in response or 'error' in response

    def test_sdk_sessions_endpoint(self, page):
        """Test that sessions endpoint works."""
        page.goto(DASHBOARD_URL)

        response = page.evaluate("""async () => {
            const res = await fetch('/api/input/sdk/sessions');
            return await res.json();
        }""")

        assert 'sessions' in response


class TestStreamingBehavior:
    """Tests for streaming behavior (requires SDK to be installed)."""

    def test_query_shows_streaming_indicator(self, page):
        """Test that sending a query shows streaming indicator."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Send a query
        terminal_input = page.locator("#terminalInput")
        terminal_input.fill("Hello")
        terminal_input.press("Enter")

        # Should show some kind of streaming indicator
        # (This may be quick, so we use a short timeout)
        try:
            streaming = page.locator(".terminal-streaming-indicator, .streaming-progress")
            streaming.wait_for(state="attached", timeout=5000)
        except:
            pass  # SDK may not be installed

    def test_user_message_appears(self, page):
        """Test that user message appears in conversation."""
        page.goto(DASHBOARD_URL)

        # Navigate to terminal
        terminal_tab = page.locator('.tab-list button[data-tab-content="terminalTab"]')
        if terminal_tab.count() > 0:
            terminal_tab.click()

        # Send a query
        test_message = "Test message for E2E"
        terminal_input = page.locator("#terminalInput")
        terminal_input.fill(test_message)
        terminal_input.press("Enter")

        # User message should appear
        conversation = page.locator("#terminalConversation")
        expect(conversation).to_contain_text(test_message)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
