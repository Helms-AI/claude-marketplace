#!/usr/bin/env python3
"""End-to-end test for the terminal tab using Playwright.

This test verifies that:
1. The terminal tab can connect to a Claude process
2. Messages can be sent via the terminal
3. Claude's responses appear in the terminal output

Prerequisites:
- Dashboard must be running (python run_dashboard.py --port 24282)
- A Claude Code process should be running for full conversation testing
"""

import pytest
import time
from playwright.sync_api import sync_playwright, expect


DASHBOARD_URL = "http://localhost:24282"
TERMINAL_TAB_SELECTOR = 'button[data-tab="terminal"]'
TERMINAL_INPUT_SELECTOR = "#terminalInput"
TERMINAL_OUTPUT_SELECTOR = "#terminalOutput"
PROCESS_SELECT_SELECTOR = "#terminalProcessSelect"
BRIDGE_BTN_SELECTOR = "#terminalBridgeBtn"
REFRESH_BTN_SELECTOR = "#terminalRefreshBtn"


@pytest.fixture(scope="module")
def browser():
    """Create a browser instance for testing."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Set to True for CI
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


def test_terminal_tab_loads(page):
    """Test that the terminal tab loads and displays the welcome message."""
    page.goto(DASHBOARD_URL)

    # Click on the Terminal tab
    page.click(TERMINAL_TAB_SELECTOR)

    # Wait for terminal container to be visible
    terminal = page.locator(".terminal-container")
    expect(terminal).to_be_visible()

    # Verify welcome ASCII art is present
    welcome = page.locator(".terminal-welcome")
    expect(welcome).to_be_visible()
    expect(welcome).to_contain_text("Claude Code Terminal")


def test_terminal_os_detection(page):
    """Test that OS-specific styling is applied."""
    page.goto(DASHBOARD_URL)
    page.click(TERMINAL_TAB_SELECTOR)

    terminal = page.locator(".terminal-container")

    # Should have one of the OS classes
    has_os_class = (
        page.locator(".terminal-container.terminal-macos").count() > 0 or
        page.locator(".terminal-container.terminal-windows").count() > 0 or
        page.locator(".terminal-container.terminal-linux").count() > 0
    )
    assert has_os_class, "Terminal should have an OS-specific class"


def test_process_discovery(page):
    """Test that the refresh button discovers processes."""
    page.goto(DASHBOARD_URL)
    page.click(TERMINAL_TAB_SELECTOR)

    # Click refresh button
    page.click(REFRESH_BTN_SELECTOR)

    # Wait for the process discovery to complete
    time.sleep(1)

    # Should see a system message about processes
    output = page.locator(TERMINAL_OUTPUT_SELECTOR)
    expect(output).to_contain_text("process")  # Either "Found X process(es)" or "No Claude processes found"


def test_bridge_discovery(page):
    """Test that the bridge button discovers Claude processes."""
    page.goto(DASHBOARD_URL)
    page.click(TERMINAL_TAB_SELECTOR)

    # Click bridge button
    page.click(BRIDGE_BTN_SELECTOR)

    # Wait for discovery
    time.sleep(2)

    # Should see discovery messages
    output = page.locator(TERMINAL_OUTPUT_SELECTOR)
    expect(output).to_contain_text("Searching for Claude Code processes")


def test_terminal_input_disabled_when_not_connected(page):
    """Test that input is disabled when not connected to a process."""
    page.goto(DASHBOARD_URL)
    page.click(TERMINAL_TAB_SELECTOR)

    # Input should be disabled initially
    terminal_input = page.locator(TERMINAL_INPUT_SELECTOR)
    expect(terminal_input).to_be_disabled()


def test_send_message_and_receive_response(page):
    """Test sending a message and receiving a response from Claude.

    This test requires:
    - A running Claude Code process
    - The dashboard to have bridged to that process
    """
    page.goto(DASHBOARD_URL)
    page.click(TERMINAL_TAB_SELECTOR)

    # Try to bridge to a Claude process
    page.click(BRIDGE_BTN_SELECTOR)
    time.sleep(3)  # Wait for bridge to complete

    # Check if we connected
    process_select = page.locator(PROCESS_SELECT_SELECTOR)
    selected_value = process_select.input_value()

    if not selected_value:
        pytest.skip("No Claude process available to connect to")

    # Verify connection status
    status = page.locator(".terminal-status")
    expect(status).to_have_text("Connected")

    # Input should now be enabled
    terminal_input = page.locator(TERMINAL_INPUT_SELECTOR)
    expect(terminal_input).to_be_enabled()

    # Send a test message
    test_message = "What is 2+2?"
    terminal_input.fill(test_message)
    terminal_input.press("Enter")

    # Verify command appears in output
    output = page.locator(TERMINAL_OUTPUT_SELECTOR)
    expect(output).to_contain_text(test_message)

    # Wait for Claude's response (up to 30 seconds)
    # The SSE handler should pick up the transcript_message and display it
    try:
        page.wait_for_function(
            """() => {
                const output = document.getElementById('terminalOutput');
                return output && output.textContent.includes('Claude:');
            }""",
            timeout=30000
        )

        # Verify Claude's response appeared
        expect(output).to_contain_text("Claude:")

        # The response should contain "4" for our math question
        # (This is a loose check since Claude might phrase it differently)
        expect(output).to_contain_text("4")

    except Exception as e:
        # Take a screenshot for debugging
        page.screenshot(path="/tmp/terminal_test_failure.png")
        raise AssertionError(f"Did not receive Claude's response in time: {e}")


def test_sse_connection(page):
    """Test that SSE connection is established for receiving responses."""
    page.goto(DASHBOARD_URL)

    # Wait for SSE to connect
    time.sleep(1)

    # Check network requests for SSE
    # This is a basic check that the EventSource was created
    sse_connected = page.evaluate("""() => {
        // Check if Terminal module has SSE source
        return typeof Terminal !== 'undefined' &&
               Terminal.state &&
               Terminal.state.sseSource !== null;
    }""")

    assert sse_connected, "SSE connection should be established"


def test_clear_terminal(page):
    """Test that Ctrl+L or clear button clears the terminal."""
    page.goto(DASHBOARD_URL)
    page.click(TERMINAL_TAB_SELECTOR)

    # Add some text to output first by refreshing processes
    page.click(REFRESH_BTN_SELECTOR)
    time.sleep(1)

    # Click clear button
    clear_btn = page.locator('.terminal-action-btn[data-action="clear"]')
    clear_btn.click()

    # Verify terminal was cleared (shows welcome message again with "cleared")
    output = page.locator(TERMINAL_OUTPUT_SELECTOR)
    expect(output).to_contain_text("Terminal cleared")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
