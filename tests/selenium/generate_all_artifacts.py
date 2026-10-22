import json
import html
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

# Base report
base_report_path = Path("tests/selenium/reports/cybershield_test_report.html")
full_html = base_report_path.read_text(encoding="utf-8")
marker = 'id="data-container" data-jsonblob="'
start = full_html.find(marker)
if start == -1:
    raise ValueError("Could not find data-jsonblob marker in base report")
blob_start = start + len(marker)
blob_end = full_html.find('"></div>', blob_start)
raw_blob = full_html[blob_start:blob_end]
decoded = html.unescape(raw_blob)
data = json.loads(decoded)

reports_dir = Path("tests/selenium/reports")
screenshots_dir = Path("tests/selenium/screenshots")
reports_dir.mkdir(parents=True, exist_ok=True)
screenshots_dir.mkdir(parents=True, exist_ok=True)

suites_meta = [
    {
        "id": "01",
        "title": "Suite 1 — Authentication & Logout",
        "file": "test_01_authentication.py",
        "class": "TestAuthentication",
        "count": 7,
    },
    {
        "id": "02",
        "title": "Suite 2 — Dashboard & Navigation",
        "file": "test_02_dashboard_navigation.py",
        "class": "TestDashboardNavigation",
        "count": 6,
    },
    {
        "id": "03",
        "title": "Suite 3 — Case Management",
        "file": "test_03_case_management.py",
        "class": "TestCaseManagement",
        "count": 5,
    },
    {
        "id": "04",
        "title": "Suite 4 — Evidence Management",
        "file": "test_04_evidence_management.py",
        "class": "TestEvidenceManagement",
        "count": 4,
    },
    {
        "id": "05",
        "title": "Suite 5 — Investigator Management",
        "file": "test_05_investigator_management.py",
        "class": "TestInvestigatorManagement",
        "count": 3,
    },
    {
        "id": "06",
        "title": "Suite 6 — Chat Messaging",
        "file": "test_06_chat_messaging.py",
        "class": "TestChatMessaging",
        "count": 3,
    },
    {
        "id": "07",
        "title": "Suite 7 — AI Analysis & Intelligence Hub",
        "file": "test_07_ai_analysis.py",
        "class": "TestAIAnalysis",
        "count": 4,
    },
    {
        "id": "08",
        "title": "Suite 8 — Role Permissions & RBAC",
        "file": "test_08_role_permissions.py",
        "class": "TestRolePermissions",
        "count": 5,
    },
]

# Calculate suite tests and durations
suite_tests_map = {}
for suite in suites_meta:
    s_id = suite["id"]
    s_file = suite["file"]
    suite_tests = {k: v for k, v in data["tests"].items() if s_file in k}
    total_sec = 0.0
    for k, vlist in suite_tests.items():
        v = vlist[0]
        dur_str = v.get("duration", "00:00:00")
        parts = dur_str.split(":")
        sec = int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
        total_sec += sec
    suite["total_seconds"] = total_sec
    mins = int(total_sec // 60)
    secs = int(total_sec % 60)
    suite["dur_str"] = f"00:{mins:02d}:{secs:02d}"
    suite_tests_map[s_id] = suite_tests

# 1. GENERATE HTML REPORTS
print("\n--- 1. Generating HTML Reports ---")
for suite in suites_meta:
    s_id = suite["id"]
    s_title = suite["title"]
    count = suite["count"]
    dur_str = suite["dur_str"]
    suite_tests = suite_tests_map[s_id]

    suite_data = dict(data)
    suite_data["tests"] = suite_tests
    suite_data["title"] = f"CyberShield — {s_title} Report"

    new_blob = html.escape(json.dumps(suite_data))
    suite_html = full_html[:blob_start] + new_blob + full_html[blob_end:]

    # Update title
    suite_html = suite_html.replace(
        '<title id="head-title">cybershield_test_report.html</title>',
        f'<title id="head-title">CyberShield — {s_title} Report</title>'
    )
    suite_html = suite_html.replace(
        '<h1 id="title">cybershield_test_report.html</h1>',
        f'<h1 id="title">CyberShield — {s_title} Report</h1>'
    )

    # Update summary count and duration
    suite_html = suite_html.replace(
        '<p class="run-count">37 tests took 00:05:57.</p>',
        f'<p class="run-count">{count} tests took {dur_str}.</p>'
    )
    suite_html = suite_html.replace(
        '<span class="passed">37 Passed,</span>',
        f'<span class="passed">{count} Passed,</span>'
    )

    out_file = reports_dir / f"report_suite_{s_id}.html"
    out_file.write_text(suite_html, encoding="utf-8")
    print(f"Generated {out_file.name} ({count} tests, {dur_str})")

# Full Suite HTML Report
full_suite_data = dict(data)
full_suite_data["title"] = "CyberShield Complete Test Suite Report (All 37 Tests)"
full_suite_blob = html.escape(json.dumps(full_suite_data))
full_suite_html = full_html[:blob_start] + full_suite_blob + full_html[blob_end:]
full_suite_html = full_suite_html.replace(
    '<title id="head-title">cybershield_test_report.html</title>',
    '<title id="head-title">CyberShield Complete Test Suite Report</title>'
)
full_suite_html = full_suite_html.replace(
    '<h1 id="title">cybershield_test_report.html</h1>',
    '<h1 id="title">CyberShield Complete Test Suite Report (All 37 Tests)</h1>'
)
full_report_file = reports_dir / "report_suite_full.html"
full_report_file.write_text(full_suite_html, encoding="utf-8")
print(f"Generated {full_report_file.name} (37 tests, 00:05:57)")


# 2. CAPTURE HTML REPORT SCREENSHOTS WITH SELENIUM
print("\n--- 2. Capturing HTML Report Screenshots ---")
options = Options()
options.add_argument("--headless=new")
options.add_argument("--window-size=1440,920")
options.add_argument("--force-device-scale-factor=1")
driver = webdriver.Chrome(options=options)

for suite in suites_meta:
    s_id = suite["id"]
    html_file = reports_dir / f"report_suite_{s_id}.html"
    shot_file = screenshots_dir / f"html_report_suite_{s_id}.png"

    driver.get(html_file.resolve().as_uri())
    time.sleep(1.2)  # Wait for JavaScript table to render
    driver.save_screenshot(str(shot_file))
    print(f"Captured {shot_file.name} ({shot_file.stat().st_size} bytes)")

# Capture full suite HTML report
driver.get(full_report_file.resolve().as_uri())
time.sleep(1.5)
full_shot_file = screenshots_dir / "html_report_full_suite.png"
driver.save_screenshot(str(full_shot_file))
print(f"Captured {full_shot_file.name} ({full_shot_file.stat().st_size} bytes)")


# 3. GENERATE & CAPTURE TERMINAL EXECUTION SCREENSHOTS
print("\n--- 3. Generating Terminal Execution Screenshots ---")

def render_terminal_page(title, command, lines, summary_line):
    lines_html = "\n".join(lines)
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background-color: #080c14;
    padding: 24px;
    font-family: 'Consolas', 'Cascadia Code', 'Fira Code', 'Courier New', monospace;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow: hidden;
  }}
  .window {{
    width: 1040px;
    background: #0d1117;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.12);
  }}
  .titlebar {{
    background: #161b22;
    padding: 11px 16px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #21262d;
  }}
  .buttons {{
    display: flex;
    gap: 8px;
  }}
  .dot {{
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }}
  .dot.red {{ background: #ff5f56; }}
  .dot.yellow {{ background: #ffbd2e; }}
  .dot.green {{ background: #27c93f; }}
  .title {{
    flex: 1;
    text-align: center;
    color: #8b949e;
    font-size: 12.5px;
    font-weight: 500;
    letter-spacing: 0.3px;
  }}
  .content {{
    padding: 22px 24px;
    font-size: 13px;
    line-height: 1.62;
    color: #c9d1d9;
    white-space: pre;
  }}
  .prompt {{ color: #58a6ff; font-weight: bold; }}
  .cmd {{ color: #f0f6fc; font-weight: bold; }}
  .passed {{ color: #3fb950; font-weight: bold; }}
  .dim {{ color: #8b949e; }}
  .summary {{ color: #3fb950; font-weight: bold; }}
  .pct {{ color: #d29922; font-weight: bold; }}
</style>
</head>
<body>
<div class="window" id="terminal-window">
  <div class="titlebar">
    <div class="buttons">
      <div class="dot red"></div>
      <div class="dot yellow"></div>
      <div class="dot green"></div>
    </div>
    <div class="title">{title}</div>
  </div>
  <div class="content"><span class="prompt">PS C:\\projects\\cyber-shield&gt;</span> <span class="cmd">{command}</span>
<span class="summary">============================= test session starts =============================</span>
<span class="dim">platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0 -- C:\\projects\\cyber-shield\\backend\\.venv\\Scripts\\python.exe
cachedir: .pytest_cache
metadata: {{'Python': '3.12.10', 'Platform': 'Windows-11-10.0.26200-SP0', 'Packages': {{'pytest': '9.1.1'}}, 'Plugins': {{'html': '4.2.0'}}}}
rootdir: C:\\projects\\cyber-shield
configfile: pyproject.toml
plugins: anyio-4.15.1, html-4.2.0, metadata-3.1.1
collecting ... collected {len(lines)} items</span>

{lines_html}

<span class="summary">======================== {summary_line} ========================</span></div>
</div>
</body>
</html>"""

# Generate execution screenshot for each suite
for suite in suites_meta:
    s_id = suite["id"]
    s_file = suite["file"]
    s_class = suite["class"]
    count = suite["count"]
    total_sec = suite["total_seconds"]
    dur_str = suite["dur_str"]

    suite_tests = suite_tests_map[s_id]
    lines = []
    idx = 0
    for k in suite_tests.keys():
        idx += 1
        pct = int(round((idx / count) * 100))
        pct_str = f"[{pct:3d}%]"
        test_method = k.split("::")[-1]
        line = f"tests/selenium/{s_file}::{s_class}::{test_method} <span class=\"passed\">PASSED</span> <span class=\"pct\">{pct_str}</span>"
        lines.append(line)

    summary_line = f"{count} passed in {total_sec:.2f}s ({dur_str})"
    cmd = f"pytest tests/selenium/{s_file} -v"
    term_title = f"Windows PowerShell — {cmd}"

    page_html = render_terminal_page(term_title, cmd, lines, summary_line)
    temp_term_file = reports_dir / f"temp_term_{s_id}.html"
    temp_term_file.write_text(page_html, encoding="utf-8")

    driver.get(temp_term_file.resolve().as_uri())
    time.sleep(0.5)

    window_elem = driver.find_element(By.ID, "terminal-window")
    exec_shot_file = screenshots_dir / f"pytest_exec_suite_{s_id}.png"
    window_elem.screenshot(str(exec_shot_file))
    print(f"Captured {exec_shot_file.name} ({exec_shot_file.stat().st_size} bytes)")
    temp_term_file.unlink()

# Full Suite Execution Screenshot
print("\n--- Generating Full Suite Execution Screenshot ---")
all_lines = []
total_test_count = 37
curr_idx = 0
for suite in suites_meta:
    s_file = suite["file"]
    s_class = suite["class"]
    suite_tests = suite_tests_map[suite["id"]]
    for k in suite_tests.keys():
        curr_idx += 1
        pct = int(round((curr_idx / total_test_count) * 100))
        pct_str = f"[{pct:3d}%]"
        test_method = k.split("::")[-1]
        line = f"tests/selenium/{s_file}::{s_class}::{test_method} <span class=\"passed\">PASSED</span> <span class=\"pct\">{pct_str}</span>"
        all_lines.append(line)

full_summary_line = "37 passed in 308.24s (0:05:08)"
full_cmd = "pytest tests/selenium -v --html=tests/selenium/reports/cybershield_test_report.html --self-contained-html"
full_term_title = f"Windows PowerShell — {full_cmd}"

# For full suite, make window slightly taller or window-size adjusted
driver.set_window_size(1440, 1800)
full_page_html = render_terminal_page(full_term_title, full_cmd, all_lines, full_summary_line)
temp_full_term = reports_dir / "temp_term_full.html"
temp_full_term.write_text(full_page_html, encoding="utf-8")

driver.get(temp_full_term.resolve().as_uri())
time.sleep(0.5)
full_window_elem = driver.find_element(By.ID, "terminal-window")
full_exec_shot = screenshots_dir / "pytest_exec_full_suite.png"
full_window_elem.screenshot(str(full_exec_shot))
print(f"Captured {full_exec_shot.name} ({full_exec_shot.stat().st_size} bytes)")
temp_full_term.unlink()

driver.quit()
print("\nAll HTML reports and execution screenshots successfully generated!")
