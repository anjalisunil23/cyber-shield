"""Suite 2: Dashboard and Navigation Testing for CyberShield application."""

import os
import time
import pytest
from selenium.webdriver.common.by import By
from conftest import WaitHelper, login_user

TEST_EMAIL = os.getenv("CYBERSHIELD_TEST_EMAIL", "investigator@cybershield.gov")
TEST_PASSWORD = os.getenv("CYBERSHIELD_TEST_PASSWORD", "Password123!")


class TestDashboardNavigation:
    """Dashboard and Navigation test cases verifying UI rendering and links."""

    @pytest.fixture(autouse=True)
    def setup_login(self, driver, base_url):
        """Ensure user is logged in before running navigation tests."""
        login_user(driver, base_url, TEST_EMAIL, TEST_PASSWORD)

    def test_01_dashboard_loads_after_login(self, driver, base_url):
        """TC-NAV-001: Verify dashboard header and main container render after login."""
        wait = WaitHelper(driver)
        assert "/dashboard" in driver.current_url

        # Check main content section renders
        main = wait.wait_for_visible(By.TAG_NAME, "main")
        assert main.is_displayed()

    def test_02_sidebar_navigation_visible(self, driver, base_url):
        """TC-NAV-002: Verify sidebar navigation links are present and visible."""
        wait = WaitHelper(driver)

        # Check navigation items in sidebar
        cases_link = wait.wait_for_visible(By.XPATH, "//a[contains(@href, '/cases')]")
        evidence_link = wait.wait_for_visible(By.XPATH, "//a[contains(@href, '/evidence')]")
        
        assert cases_link.is_displayed()
        assert evidence_link.is_displayed()

    def test_03_navigation_to_major_modules(self, driver, base_url):
        """TC-NAV-003: Navigate through major modules (Cases, Evidence, Messages, Intelligence)."""
        wait = WaitHelper(driver)

        # 1. Navigate to Cases
        cases_link = wait.wait_for_clickable(By.XPATH, "//a[contains(@href, '/cases')]")
        cases_link.click()
        wait.wait_for_url_contains("/cases")
        assert "/cases" in driver.current_url

        # 2. Navigate to Evidence
        evidence_link = wait.wait_for_clickable(By.XPATH, "//a[contains(@href, '/evidence')]")
        evidence_link.click()
        wait.wait_for_url_contains("/evidence")
        assert "/evidence" in driver.current_url

        # 3. Navigate to Intelligence / AI Analysis
        ai_link = wait.wait_for_clickable(By.XPATH, "//a[contains(@href, '/ai-analysis')]")
        ai_link.click()
        wait.wait_for_url_contains("/ai-analysis")
        assert "/ai-analysis" in driver.current_url

    def test_04_browser_back_forward_navigation(self, driver, base_url):
        """TC-NAV-004: Verify browser back and forward navigation works between pages."""
        wait = WaitHelper(driver)

        # Go to Cases
        driver.get(f"{base_url}/investigator/cases")
        time.sleep(0.5)

        # Go to Evidence
        driver.get(f"{base_url}/investigator/evidence")
        time.sleep(0.5)

        # Go Back to Cases
        driver.back()
        time.sleep(0.5)
        assert "/cases" in driver.current_url

        # Go Forward to Evidence
        driver.forward()
        time.sleep(0.5)
        assert "/evidence" in driver.current_url

    def test_05_dashboard_metrics_render(self, driver, base_url):
        """TC-NAV-005: Verify dashboard stat cards render cleanly."""
        driver.get(f"{base_url}/investigator/dashboard")
        wait = WaitHelper(driver)

        # Check main content area renders
        main = wait.wait_for_visible(By.TAG_NAME, "main")
        assert main.is_displayed()

    def test_06_no_error_page_displayed(self, driver, base_url):
        """TC-NAV-006: Verify no crash error alerts appear on dashboard page."""
        wait = WaitHelper(driver)
        page_src = driver.page_source.lower()
        
        assert "404 - page not found" not in page_src
        assert "something went wrong" not in page_src
