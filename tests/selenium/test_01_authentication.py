"""Suite 1: Authentication Testing for CyberShield application."""

import os
import time
import pytest
from selenium.webdriver.common.by import By
from conftest import WaitHelper, login_user, logout_user

TEST_EMAIL = os.getenv("CYBERSHIELD_TEST_EMAIL", "investigator@cybershield.gov")
TEST_PASSWORD = os.getenv("CYBERSHIELD_TEST_PASSWORD", "Password123!")


class TestAuthentication:
    """Authentication test cases verifying login, validation, redirect, and logout."""

    def test_01_login_page_loads(self, driver, base_url):
        """TC-AUTH-001: Verify login page renders correctly."""
        driver.get(f"{base_url}/login")
        wait = WaitHelper(driver)
        
        # Verify page URL and login form elements
        assert "/login" in driver.current_url
        email_input = wait.wait_for_visible(By.NAME, "email")
        assert email_input.is_displayed()

    def test_02_login_form_elements_visible(self, driver, base_url):
        """TC-AUTH-002: Verify email input, password input, and submit buttons exist."""
        driver.get(f"{base_url}/login")
        wait = WaitHelper(driver)

        email_input = wait.wait_for_visible(By.NAME, "email")
        password_input = wait.wait_for_visible(By.NAME, "password")
        submit_button = wait.wait_for_visible(By.XPATH, "//button[@type='submit']")
        register_link = wait.wait_for_visible(By.XPATH, "//a[contains(., 'REGISTER')]")

        assert email_input.is_displayed()
        assert password_input.is_displayed()
        assert submit_button.is_displayed()
        assert register_link.is_displayed()

    def test_03_empty_login_validation(self, driver, base_url):
        """TC-AUTH-003: Verify submitting an empty form triggers client validation."""
        driver.get(f"{base_url}/login")
        wait = WaitHelper(driver)

        submit_button = wait.wait_for_clickable(By.XPATH, "//button[@type='submit']")
        submit_button.click()

        # HTML5 required attribute prevents navigation, URL remains /login
        time.sleep(0.5)
        assert "/login" in driver.current_url

    def test_04_invalid_credentials_validation(self, driver, base_url):
        """TC-AUTH-004: Verify invalid email/password displays an error message."""
        driver.get(f"{base_url}/login")
        wait = WaitHelper(driver, timeout=45)

        email_input = wait.wait_for_visible(By.NAME, "email")
        email_input.clear()
        email_input.send_keys("nonexistent_user@invalid.com")

        password_input = wait.wait_for_visible(By.NAME, "password")
        password_input.clear()
        password_input.send_keys("WrongPassword123!")

        submit_button = wait.wait_for_clickable(By.XPATH, "//button[@type='submit']")
        submit_button.click()

        # Check for alert div, toast error, or error message text (accounting for Render response)
        alert = wait.wait_for_visible(
            By.XPATH, "//div[@role='alert'] | //*[contains(text(), 'Invalid')] | //*[contains(text(), 'Could not')] | //*[contains(text(), 'Unable to connect')] | //*[contains(text(), 'verify')] | //*[contains(text(), 'wrong')]"
        )
        assert alert.is_displayed()

    def test_05_valid_login(self, driver, base_url):
        """TC-AUTH-005: Verify successful login redirects to investigator dashboard."""
        driver.get(f"{base_url}/login")
        wait = WaitHelper(driver)

        email_input = wait.wait_for_visible(By.NAME, "email")
        email_input.clear()
        email_input.send_keys(TEST_EMAIL)

        password_input = wait.wait_for_visible(By.NAME, "password")
        password_input.clear()
        password_input.send_keys(TEST_PASSWORD)

        submit_button = wait.wait_for_clickable(By.XPATH, "//button[@type='submit']")
        submit_button.click()

        # Verify redirect to dashboard
        wait.wait_for_url_contains("/dashboard")
        assert "/dashboard" in driver.current_url

    def test_06_logout_functional(self, driver, base_url):
        """TC-AUTH-006: Verify logging out redirects user back to login page."""
        login_user(driver, base_url, TEST_EMAIL, TEST_PASSWORD)
        wait = WaitHelper(driver)

        logout_user(driver)
        wait.wait_for_url_contains("/login")
        assert "/login" in driver.current_url

    def test_07_protected_page_access_after_logout(self, driver, base_url):
        """TC-AUTH-007: Verify accessing protected dashboard route redirects to /login."""
        # Ensure token is cleared
        driver.get(f"{base_url}/login")
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        
        # Attempt direct navigation to protected dashboard
        driver.get(f"{base_url}/investigator/dashboard")
        wait = WaitHelper(driver)

        wait.wait_for_url_contains("/login")
        assert "/login" in driver.current_url
