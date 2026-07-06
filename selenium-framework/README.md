# Selenium + TestNG + Maven (POM) Framework
### Target app: https://ai-testcase-generator-nu.vercel.app/

## ⚠️ Read this first

This framework was built without live browser access to your application
(sandboxed build environment, no internet to that domain). The login page's
text content **was** fetched and confirmed:

> Username / Password fields, a **"Sign In"** button, and the line
> *"Demo credentials: admin / Admin@12345"* printed on the page itself.

So the flow is built around a **sign-in** form (not a separate "sign up"
step — there isn't one on this app). Everything past the login page
(Dashboard → Projects → New Project form) could not be inspected, since the
HTML is rendered client-side by JavaScript and a plain fetch can't see it.

**Net effect:** the framework, structure, and Java code are complete and
correct — but the exact element locators (IDs/classes) on Dashboard/Projects/
New Project are educated guesses based on common UI conventions, with several
fallback strategies built in per element. You will very likely need to spend
~10 minutes confirming/adjusting a handful of them. That process is described
below and is designed to be fast.

---

## 1. Prerequisites

- Java 11+ (`java -version`)
- Maven 3.6+ (`mvn -version`)
- Google Chrome installed (or Firefox/Edge if you change the `browser` config)

No manual driver download needed — `WebDriverManager` auto-downloads the
correct ChromeDriver/GeckoDriver/EdgeDriver binary on first run.

## 2. Project Structure

```
selenium-pom-framework/
├── pom.xml
├── testng.xml
├── README.md
├── src/
│   ├── main/java/com/testautomation/
│   │   ├── base/
│   │   │   ├── DriverFactory.java      # creates Chrome/Firefox/Edge sessions
│   │   │   └── BaseTest.java           # ThreadLocal driver, setup/teardown
│   │   ├── pages/
│   │   │   ├── BasePage.java           # multi-locator fallback engine
│   │   │   ├── LoginPage.java
│   │   │   ├── DashboardPage.java
│   │   │   ├── ProjectsPage.java
│   │   │   └── NewProjectPage.java
│   │   └── utils/
│   │       ├── ConfigReader.java       # reads config.properties (+ -D overrides)
│   │       ├── WaitUtils.java          # centralized explicit waits
│   │       ├── ScreenshotUtils.java    # screenshot-on-failure
│   │       └── ElementInspector.java   # dumps full element inventory of a page
│   └── test/java/com/testautomation/
│       ├── tests/
│       │   └── ProjectCreationE2ETest.java   # the 5-step flow as @Test methods
│       └── listeners/
│           ├── ExtentReportListener.java     # builds ExtentReport.html
│           ├── ExcelReportListener.java      # builds Test_Results.xlsx (Apache POI)
│           ├── RetryAnalyzer.java            # retries a failed test N times
│           └── RetryTransformer.java         # auto-attaches RetryAnalyzer to every @Test
└── src/test/resources/
    ├── config.properties      # baseUrl, credentials, test data, timeouts
    └── log4j2.xml
```

## 3. Configuration

Everything that could change between environments lives in
`src/test/resources/config.properties` — nothing is hardcoded in test logic:

```properties
baseUrl=https://ai-testcase-generator-nu.vercel.app/
username=admin
password=Admin@12345
browser=chrome
headless=false
project.name=kilo
project.description=hello
project.status=Planning
retryCount=2
excelReportPath=test-output/Test_Results.xlsx
```

Any value can be overridden from the command line without touching files:

```bash
mvn clean test -Dbrowser=firefox -Dheadless=true -DbaseUrl=https://staging.example.com/
```

## 4. Running the Suite

```bash
cd selenium-pom-framework
mvn clean test
```

This will:
1. Download all dependencies + the correct browser driver (first run only)
2. Launch the browser, run all 5 ordered test steps
3. Write logs to `test-output/logs/execution.log`
4. Write an element inventory of the Dashboard page to `test-output/element-reports/`
5. Write a screenshot for any failed step to `test-output/screenshots/`
6. Generate `test-output/ExtentReport.html` — open this in a browser for the
   pass/fail report with timestamps and failure details
7. Generate `test-output/Test_Results.xlsx` — a color-coded Excel workbook
   (green/red/amber rows) of the same results, for anyone who'd rather open
   a spreadsheet than a browser
8. Automatically retry any failed test up to `retryCount` times (default 2,
   set in `config.properties`) before marking it FAILED for good

## 5. Locator Calibration (do this once, ~10 minutes)

**Recommended order:**

1. Run just the first two steps to get past login and dump the Dashboard:
   ```bash
   mvn test -Dtest=ProjectCreationE2ETest#testLogin+testCaptureDashboardElements
   ```
2. If `testLogin` fails: open the app in Chrome, press **F12 → Elements tab**,
   click the username field, and look at its `id`/`name`/`placeholder`
   attribute. Open `LoginPage.java`, find `USERNAME_FIELD`, and add a new
   `By.id("...")` (or whatever you found) as the **first** candidate in the
   array. Same for `PASSWORD_FIELD` and `SIGN_IN_BUTTON` if needed.
3. If `testLogin` passes but `testCaptureDashboardElements` reports 0
   elements (very unlikely) — check `DASHBOARD_MARKER` in `DashboardPage.java`.
4. Open `test-output/element-reports/Dashboard_elements_<timestamp>.txt`.
   This is a full dump of every element on the Dashboard, including ids and
   classes — use it to confirm the `PROJECTS_NAV` locator in
   `DashboardPage.java` quickly (search the file for "project").
5. Run the next step, repeat the same F12-inspect-and-add-locator process for:
   - `NEW_PROJECT_BUTTON` in `ProjectsPage.java`
   - `PROJECT_NAME_FIELD`, `DESCRIPTION_FIELD`, `STATUS_DROPDOWN` (or
     `STATUS_TRIGGER`), `SAVE_BUTTON` in `NewProjectPage.java`

You are only ever editing a `By[]` array of candidates — never the test
logic itself. This is intentional: it keeps maintenance localized to one
line per element, in one file, even as the app's markup evolves.

## 6. Excel (.xlsx) Reporting

`ExcelReportListener` (registered in `testng.xml`) builds a workbook at
`test-output/Test_Results.xlsx` with one row per test method:

| # | Test Name | Description | Status | Duration (sec) | Failure Reason |
|---|-----------|-------------|--------|-----------------|-----------------|

Rows are shaded green (PASS), red (FAIL), or amber (SKIP) so the result is
readable at a glance even before reading a single cell. This runs alongside
the HTML ExtentReport — both are generated from the same test run, no extra
command needed. The output path is configurable via `excelReportPath` in
`config.properties`.

## 7. Automatic Retry on Failure

Flaky steps (a slow-loading element, a momentary network hiccup) shouldn't
need a full manual re-run. `RetryAnalyzer` retries any failed `@Test` method
up to `retryCount` times (default 2, configurable in `config.properties`)
before TestNG reports it as failed for good.

This is wired in a way that's easy to get wrong, so it's worth calling out
explicitly: `IRetryAnalyzer` (which `RetryAnalyzer` implements) is **not**
a valid `<listener>` type in `testng.xml` — it has to be attached to each
`@Test` method individually. Rather than tag every `@Test` by hand with
`@Test(retryAnalyzer = RetryAnalyzer.class)`, this framework registers
`RetryTransformer` — an `IAnnotationTransformer` — as the `<listener>`
instead. It runs once per test method at suite startup and attaches
`RetryAnalyzer` automatically, so every test in the suite gets retry
behavior for free.

To disable retries entirely, set `retryCount=0` in `config.properties`.

## 8. About the "Status" Field

The requirement says *"status check box select planing."* A literal checkbox
can't represent one choice out of several states (Planning / Active /
Completed, etc.), so this is almost certainly a dropdown or radio group in
the real UI. `NewProjectPage.selectStatus()` already handles both: it tries
a native `<select>` first, then falls back to clicking a custom
dropdown/option element labeled "Planning." No code change needed unless
calibration reveals something unusual.

## 9. Scaling This Framework Further

- **Parallel execution:** change `<test name="..." parallel="false">` to
  `parallel="methods" thread-count="3"` in `testng.xml` — `BaseTest` already
  uses `ThreadLocal<WebDriver>`, so this works with no other changes.
- **Cross-browser CI matrix:** run the same suite 3 times with
  `-Dbrowser=chrome`, `-Dbrowser=firefox`, `-Dbrowser=edge`.
- **More test cases:** add new `@Test` methods to `ProjectCreationE2ETest`,
  or new test classes + add them to `testng.xml`'s `<classes>` block — the
  Page Object classes are already reusable across any new test.
- **CI/CD:** add `-Dheadless=true` for pipeline runs (GitHub Actions,
  Jenkins, GitLab CI) — Xvfb is not required since both Chrome/Firefox
  headless modes are configured in `DriverFactory`.
