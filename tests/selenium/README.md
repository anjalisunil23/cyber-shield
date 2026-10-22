# CyberShield Selenium Automated Test Suite

A complete Selenium-based automated testing system for the CyberShield web application built with Python, Selenium WebDriver, and pytest.

---

## 📁 Directory Structure

```
tests/
└── selenium/
    ├── conftest.py                       # Pytest fixtures, WebDriver setup, wait helpers, screenshots hook
    ├── test_01_authentication.py         # Suite 1: Login, validation, logout, protected routes
    ├── test_02_dashboard_navigation.py   # Suite 2: Dashboard loading, sidebar navigation, browser history
    ├── test_03_case_management.py        # Suite 3: Case listing, creation form, search filtering, details
    ├── test_04_evidence_management.py    # Suite 4: Evidence listing, upload form, file selection upload
    ├── test_05_investigator_management.py # Suite 5: Team listing, investigator cards, RBAC restrictions
    ├── test_06_chat_messaging.py         # Suite 6: Conversation groups, thread view, sending messages
    ├── test_07_ai_analysis.py            # Suite 7: Intelligence Hub, case selector, graph tab, pipeline trigger
    ├── test_08_role_permissions.py       # Suite 8: Role landing dashboards & unauthorized route redirection
    ├── .env.example                      # Environment variables template
    ├── README.md                         # Framework overview & usage instructions
    ├── TESTING_REPORT.md                 # Detailed empirical test execution report
    ├── reports/                          # HTML test reports (pytest-html output)
    │   └── cybershield_test_report.html
    └── screenshots/                      # Automated failure screenshots
```

---

## 🛠️ Installation & Environment Setup

### 1. Install Dependencies

```bash
pip install selenium pytest pytest-html webdriver-manager python-dotenv
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` inside `tests/selenium/` or set variables in your shell:

```bash
cp tests/selenium/.env.example tests/selenium/.env
```

Default configuration:

```env
CYBERSHIELD_URL=https://cyber-shield-portal.vercel.app
CYBERSHIELD_TEST_EMAIL=investigator@cybershield.gov
CYBERSHIELD_TEST_PASSWORD=Password123!

CYBERSHIELD_ADMIN_EMAIL=sysadmin@cybershield.gov
CYBERSHIELD_ADMIN_PASSWORD=Admin123!

CYBERSHIELD_OFFICER_EMAIL=supervisor@cybershield.gov
CYBERSHIELD_OFFICER_PASSWORD=Supervisor123!

CYBERSHIELD_INVESTIGATOR_EMAIL=investigator@cybershield.gov
CYBERSHIELD_INVESTIGATOR_PASSWORD=Password123!

CYBERSHIELD_MAJOR_ADMIN_EMAIL=admin@cybershield.gov
CYBERSHIELD_MAJOR_ADMIN_PASSWORD=Admin123!

HEADLESS=true
BROWSER=chrome
```

---

## 🚀 Running Test Suites

### Run All 8 Test Suites

```bash
pytest tests/selenium -v
```

### Run an Individual Test Suite

```bash
# Suite 1: Authentication
pytest tests/selenium/test_01_authentication.py -v

# Suite 2: Dashboard Navigation
pytest tests/selenium/test_02_dashboard_navigation.py -v

# Suite 3: Case Management
pytest tests/selenium/test_03_case_management.py -v

# Suite 4: Evidence Management
pytest tests/selenium/test_04_evidence_management.py -v

# Suite 5: Investigator Management
pytest tests/selenium/test_05_investigator_management.py -v

# Suite 6: Chat Messaging
pytest tests/selenium/test_06_chat_messaging.py -v

# Suite 7: AI Analysis
pytest tests/selenium/test_07_ai_analysis.py -v

# Suite 8: Role Permissions
pytest tests/selenium/test_08_role_permissions.py -v
```

### Headed vs Headless Mode

To run tests with Chrome browser visible:

```bash
HEADLESS=false pytest tests/selenium -v
```

---

## 📊 Reports & Screenshots

### Generate HTML Test Report

```bash
pytest tests/selenium -v --html=tests/selenium/reports/cybershield_test_report.html --self-contained-html
```

- **HTML Report Path:** `tests/selenium/reports/cybershield_test_report.html`
- **Failure Screenshots:** `tests/selenium/screenshots/<test_name>_<timestamp>.png`
- **Markdown Testing Report:** `tests/selenium/TESTING_REPORT.md`
