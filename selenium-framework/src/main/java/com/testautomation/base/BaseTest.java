package com.testautomation.base;

import com.testautomation.utils.ConfigReader;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.WebDriver;
import org.testng.ITestResult;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Parameters;

/**
 * Every test class extends this. Uses ThreadLocal<WebDriver> so that if you
 * later enable TestNG parallel="methods"/"classes" in testng.xml, each
 * thread gets its own isolated browser instance — no shared-state bugs.
 */
public class BaseTest {

    protected static final Logger logger = LogManager.getLogger(BaseTest.class);

    private static final ThreadLocal<WebDriver> driverThreadLocal = new ThreadLocal<>();

    public WebDriver getDriver() {
        return driverThreadLocal.get();
    }

    @BeforeMethod(alwaysRun = true)
    @Parameters({"browser"})
    public void setUp(org.testng.ITestContext context) {
        String browser = ConfigReader.get("browser", "chrome");
        logger.info("Launching browser: {}", browser);

        WebDriver driver = DriverFactory.createDriver(browser);
        driverThreadLocal.set(driver);

        String baseUrl = ConfigReader.get("baseUrl");
        logger.info("Navigating to base URL: {}", baseUrl);
        driver.get(baseUrl);
    }

    @AfterMethod(alwaysRun = true)
    public void tearDown(ITestResult result) {
        WebDriver driver = getDriver();
        if (driver != null) {
            if (result.getStatus() == ITestResult.FAILURE) {
                logger.error("Test FAILED: {}", result.getName());
                com.testautomation.utils.ScreenshotUtils.capture(driver, result.getName());
            }
            logger.info("Closing browser session.");
            driver.quit();
            driverThreadLocal.remove();
        }
    }
}
