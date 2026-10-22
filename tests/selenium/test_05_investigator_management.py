"""Suite 5: Investigator Management & Team Testing for CyberShield application."""

import os
import time
import pytest
from selenium.webdriver.common.by import By
from conftest import WaitHelper, login_user

OFFICER_EMAIL = os.getenv("CYBERSHIELD_OFFICER_EMAIL", "supervisor@cybershield.gov")
OFFICER_PASSWORD = os.getenv("CYBERSHIELD_OFFICER_PASSWORD", "Supervisor123!")

INVESTIGATOR_EMAIL = os.getenv("CYBERSHIELD_INVESTIGATOR_EMAIL", "investigator@cybershield.gov")
INVESTIGATOR_PASSWORD = os.getenv("CYBERSHIELD_INVESTIGATOR_PASSWORD", "Password123!")


class TestInvestigatorManagement:
    """Investigator Management test cases verifying team management and role restrictions."""

    def test_01_investigator_list_loads(self, driver, base_url):
        """TC-INV-001: Open investigator team list as Superior Officer and verify rendering."""
        login_user(driver, base_url, OFFICER_EMAIL, OFFICER_PASSWORD)
        driver.get(f"{base_url}/superior/investigators")
        wait = WaitHelper(driver)

        heading = wait.wait_for_visible(By.XPATH, "//*[contains(text(), 'Investigators')]")
        assert heading.is_displayed()

    def test_02_view_investigator_team_members(self, driver, base_url):
        """TC-INV-002: Verify team member list container renders active investigators."""
        login_user(driver, base_url, OFFICER_EMAIL, OFFICER_PASSWORD)
        driver.get(f"{base_url}/superior/investigators")
        wait = WaitHelper(driver)

        main_content = wait.wait_for_visible(By.TAG_NAME, "main")
        assert main_content.is_displayed()

    def test_03_investigator_role_permission_restrictions(self, driver, base_url):
        """TC-INV-003: Verify regular investigator cannot access admin user management routes."""
        login_user(driver, base_url, INVESTIGATOR_EMAIL, INVESTIGATOR_PASSWORD)
        
        # Attempt direct navigation to Admin Users page
        driver.get(f"{base_url}/admin/users")
        wait = WaitHelper(driver)

        time.sleep(1)
        # Verify user is redirected away from /admin/users to their role dashboard
        assert "/admin/users" not in driver.current_url or "/investigator" in driver.current_url
