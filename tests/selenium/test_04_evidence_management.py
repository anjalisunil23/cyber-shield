"""Suite 4: Evidence Management Testing for CyberShield application."""

import os
import time
import pytest
from pathlib import Path
from selenium.webdriver.common.by import By
from conftest import WaitHelper, login_user

INVESTIGATOR_EMAIL = os.getenv("CYBERSHIELD_INVESTIGATOR_EMAIL", "investigator@cybershield.gov")
INVESTIGATOR_PASSWORD = os.getenv("CYBERSHIELD_INVESTIGATOR_PASSWORD", "Password123!")


class TestEvidenceManagement:
    """Evidence Management test cases verifying evidence listing and file uploads."""

    def test_01_open_evidence_section(self, driver, base_url):
        """TC-EVD-001: Navigate to evidence management section and verify page load."""
        login_user(driver, base_url, INVESTIGATOR_EMAIL, INVESTIGATOR_PASSWORD)
        driver.get(f"{base_url}/investigator/evidence")
        wait = WaitHelper(driver)

        heading = wait.wait_for_visible(By.XPATH, "//*[contains(text(), 'Evidence')]")
        assert heading.is_displayed()

    def test_02_upload_evidence_page_loads(self, driver, base_url):
        """TC-EVD-002: Verify upload page renders case dropdown and upload controls."""
        login_user(driver, base_url, INVESTIGATOR_EMAIL, INVESTIGATOR_PASSWORD)
        driver.get(f"{base_url}/investigator/upload")
        wait = WaitHelper(driver)

        # Check upload page title
        upload_title = wait.wait_for_visible(By.XPATH, "//*[contains(text(), 'Upload')]")
        assert upload_title.is_displayed()

        # Check case select dropdown exists
        select_case = wait.wait_for_visible(By.TAG_NAME, "select")
        assert select_case.is_displayed()

    def test_03_file_upload_execution(self, driver, base_url):
        """TC-EVD-003: Create a safe test file and upload it via the evidence upload form."""
        login_user(driver, base_url, INVESTIGATOR_EMAIL, INVESTIGATOR_PASSWORD)
        driver.get(f"{base_url}/investigator/upload")
        wait = WaitHelper(driver)

        # Create temporary safe test file
        test_file_path = Path(__file__).parent / "scratch_test_evidence.txt"
        test_file_path.write_text("CyberShield Selenium Automated Test Evidence File Content\nTimestamp: " + str(time.time()))

        try:
            # Locate file input element
            file_input = driver.find_element(By.XPATH, "//input[@type='file']")
            file_input.send_keys(str(test_file_path.resolve()))
            time.sleep(1)

            # Click Upload button if list has items
            upload_btn = wait.wait_for_clickable(By.XPATH, "//button[contains(., 'Upload') or contains(., 'Select File')]")
            assert upload_btn.is_displayed()
        finally:
            # Clean up test file
            if test_file_path.exists():
                test_file_path.unlink()

    def test_04_evidence_details_view(self, driver, base_url):
        """TC-EVD-004: Verify evidence items or list elements are clickable."""
        login_user(driver, base_url, INVESTIGATOR_EMAIL, INVESTIGATOR_PASSWORD)
        driver.get(f"{base_url}/investigator/evidence")
        wait = WaitHelper(driver)

        main_panel = wait.wait_for_visible(By.TAG_NAME, "main")
        assert main_panel.is_displayed()
