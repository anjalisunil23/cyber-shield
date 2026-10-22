"""Suite 8: Role-Based Access Control (RBAC) & Permissions Testing for CyberShield application."""

import os
import time
import pytest
from conftest import WaitHelper, login_user

INVESTIGATOR_EMAIL = os.getenv("CYBERSHIELD_INVESTIGATOR_EMAIL", "investigator@cybershield.gov")
INVESTIGATOR_PASSWORD = os.getenv("CYBERSHIELD_INVESTIGATOR_PASSWORD", "Password123!")

OFFICER_EMAIL = os.getenv("CYBERSHIELD_OFFICER_EMAIL", "supervisor@cybershield.gov")
OFFICER_PASSWORD = os.getenv("CYBERSHIELD_OFFICER_PASSWORD", "Supervisor123!")

ADMIN_EMAIL = os.getenv("CYBERSHIELD_ADMIN_EMAIL", "sysadmin@cybershield.gov")
ADMIN_PASSWORD = os.getenv("CYBERSHIELD_ADMIN_PASSWORD", "Admin123!")

MAJOR_ADMIN_EMAIL = os.getenv("CYBERSHIELD_MAJOR_ADMIN_EMAIL", "admin@cybershield.gov")
MAJOR_ADMIN_PASSWORD = os.getenv("CYBERSHIELD_MAJOR_ADMIN_PASSWORD", "Admin123!")


class TestRolePermissions:
    """Role-Based Access Control test cases verifying landing dashboards and permissions."""

    def test_01_investigator_role_dashboard(self, driver, base_url):
        """TC-RBAC-001: Verify Investigator logs in and lands on /investigator/dashboard."""
        login_user(driver, base_url, INVESTIGATOR_EMAIL, INVESTIGATOR_PASSWORD)
        wait = WaitHelper(driver)
        wait.wait_for_url_contains("/investigator/dashboard")
        assert "/investigator/dashboard" in driver.current_url

    def test_02_officer_role_dashboard(self, driver, base_url):
        """TC-RBAC-002: Verify Superior Officer logs in and lands on /superior/dashboard."""
        login_user(driver, base_url, OFFICER_EMAIL, OFFICER_PASSWORD)
        wait = WaitHelper(driver)
        wait.wait_for_url_contains("/superior/dashboard")
        assert "/superior/dashboard" in driver.current_url

    def test_03_admin_role_dashboard(self, driver, base_url):
        """TC-RBAC-003: Verify System Admin logs in and lands on /admin/dashboard."""
        login_user(driver, base_url, ADMIN_EMAIL, ADMIN_PASSWORD)
        wait = WaitHelper(driver)
        wait.wait_for_url_contains("/admin/dashboard")
        assert "/admin/dashboard" in driver.current_url

    def test_04_major_admin_role_dashboard(self, driver, base_url):
        """TC-RBAC-004: Verify Major Admin logs in and lands on /major-admin/dashboard."""
        login_user(driver, base_url, MAJOR_ADMIN_EMAIL, MAJOR_ADMIN_PASSWORD)
        wait = WaitHelper(driver)
        wait.wait_for_url_contains("/major-admin/dashboard")
        assert "/major-admin/dashboard" in driver.current_url

    def test_05_role_access_restriction(self, driver, base_url):
        """TC-RBAC-005: Verify Investigator accessing Major Admin route gets redirected."""
        login_user(driver, base_url, INVESTIGATOR_EMAIL, INVESTIGATOR_PASSWORD)
        
        # Attempt direct navigation to Major Admin dashboard
        driver.get(f"{base_url}/major-admin/dashboard")
        wait = WaitHelper(driver)

        time.sleep(1)
        # Verify user is redirected back to their role home
        assert "/major-admin/dashboard" not in driver.current_url or "/investigator" in driver.current_url
