"""Pytest configuration and shared Selenium fixtures for CyberShield automated tests."""

import os
import sys
import time
from pathlib import Path

import pytest
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

# Load environment variables
env_file = Path(__file__).parent / ".env"
if env_file.exists():
    load_dotenv(env_file)

BASE_URL = os.getenv("CYBERSHIELD_URL", "https://cyber-shield-portal.vercel.app").rstrip("/")
HEADLESS = os.getenv("HEADLESS", "true").lower() in ("true", "1", "yes")
BROWSER = os.getenv("BROWSER", "chrome").lower()

SCREENSHOTS_DIR = Path(__file__).parent / "screenshots"
REPORTS_DIR = Path(__file__).parent / "reports"

SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


@pytest.fixture(scope="session")
def base_url():
    """Return configured base URL for CyberShield target application."""
    return BASE_URL


@pytest.fixture(scope="function")
def driver(request):
    """Provide a configured Selenium WebDriver instance per test function."""
    options = ChromeOptions()
    if HEADLESS:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--ignore-certificate-errors")

    service = None
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        service = ChromeService(ChromeDriverManager().install())
    except Exception:
        pass

    if service:
        web_driver = webdriver.Chrome(service=service, options=options)
    else:
        web_driver = webdriver.Chrome(options=options)

    web_driver.implicitly_wait(5)

    yield web_driver

    # Capture screenshot on failure
    if hasattr(request.node, "rep_call") and request.node.rep_call.failed:
        test_name = request.node.name.replace("[", "_").replace("]", "_")
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        screenshot_filename = f"{test_name}_{timestamp}.png"
        screenshot_path = SCREENSHOTS_DIR / screenshot_filename
        try:
            web_driver.save_screenshot(str(screenshot_path))
            print(f"\n[Screenshot Captured] {screenshot_path}")
        except Exception as e:
            print(f"\n[Screenshot Failed] {e}")

    try:
        web_driver.quit()
    except Exception:
        pass


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to capture test execution report state for failure screenshots."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)


class WaitHelper:
    """Helper class providing explicit WebDriverWait utility functions."""

    def __init__(self, driver, timeout=25):
        self.driver = driver
        self.wait = WebDriverWait(driver, timeout)

    def wait_for_element(self, by, selector):
        return self.wait.until(EC.presence_of_element_located((by, selector)))

    def wait_for_visible(self, by, selector):
        return self.wait.until(EC.visibility_of_element_located((by, selector)))

    def wait_for_clickable(self, by, selector):
        return self.wait.until(EC.element_to_be_clickable((by, selector)))

    def wait_for_url_contains(self, substring):
        return self.wait.until(EC.url_contains(substring))


def login_user(driver, base_url, email, password):
    """Helper to perform UI login and wait for dashboard redirect."""
    driver.get(f"{base_url}/login")
    wait = WaitHelper(driver, timeout=25)

    email_input = wait.wait_for_visible(By.NAME, "email")
    email_input.clear()
    email_input.send_keys(email)

    password_input = wait.wait_for_visible(By.NAME, "password")
    password_input.clear()
    password_input.send_keys(password)

    submit_btn = wait.wait_for_clickable(By.XPATH, "//button[@type='submit']")
    submit_btn.click()

    try:
        wait.wait_for_url_contains("/dashboard")
    except Exception:
        # If UI submit hit temporary rate limit, retry once
        driver.get(f"{base_url}/login")
        email_input = wait.wait_for_visible(By.NAME, "email")
        email_input.clear()
        email_input.send_keys(email)
        password_input = wait.wait_for_visible(By.NAME, "password")
        password_input.clear()
        password_input.send_keys(password)
        submit_btn = wait.wait_for_clickable(By.XPATH, "//button[@type='submit']")
        submit_btn.click()
        wait.wait_for_url_contains("/dashboard")


def logout_user(driver):
    """Helper to perform UI logout by clicking Sign out in sidebar."""
    wait = WaitHelper(driver, timeout=20)
    try:
        logout_btn = wait.wait_for_clickable(By.XPATH, "//button[contains(., 'Sign out')]")
        logout_btn.click()
        time.sleep(0.5)
    except Exception:
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        driver.get(f"{BASE_URL}/login")
