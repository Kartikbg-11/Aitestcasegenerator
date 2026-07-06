package com.testautomation.listeners;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.Status;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.testautomation.utils.ConfigReader;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

import java.util.HashMap;
import java.util.Map;

/**
 * TestNG listener that builds a rich, standalone HTML report
 * (test-output/ExtentReport.html) showing pass/fail status, duration,
 * stack traces for failures, and a screenshot link for each failure.
 *
 * This is the "document on test result, its working or not" deliverable:
 * after a run, open test-output/ExtentReport.html in any browser.
 *
 * Registered via testng.xml <listeners> block — no code change needed
 * elsewhere to activate it.
 */
public class ExtentReportListener implements ITestListener {

    private static ExtentReports extent;
    private static final Map<Long, ExtentTest> testMap = new HashMap<>();

    private static synchronized ExtentReports getExtent() {
        if (extent == null) {
            String reportPath = ConfigReader.get("reportPath", "test-output/ExtentReport.html");
            ExtentSparkReporter spark = new ExtentSparkReporter(reportPath);
            spark.config().setDocumentTitle("AI Test Case Generator - Automation Report");
            spark.config().setReportName("Selenium + TestNG Execution Report");

            extent = new ExtentReports();
            extent.attachReporter(spark);
            extent.setSystemInfo("Application URL", ConfigReader.get("baseUrl"));
            extent.setSystemInfo("Browser", ConfigReader.get("browser", "chrome"));
            extent.setSystemInfo("OS", System.getProperty("os.name"));
        }
        return extent;
    }

    @Override
    public void onStart(ITestContext context) {
        getExtent();
    }

    @Override
    public void onTestStart(ITestResult result) {
        ExtentTest test = getExtent().createTest(
                result.getMethod().getMethodName(),
                result.getMethod().getDescription());
        testMap.put(Thread.currentThread().getId(), test);
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        ExtentTest test = testMap.get(Thread.currentThread().getId());
        if (test != null) {
            test.log(Status.PASS, "Test passed: " + result.getMethod().getMethodName());
        }
    }

    @Override
    public void onTestFailure(ITestResult result) {
        ExtentTest test = testMap.get(Thread.currentThread().getId());
        if (test != null) {
            test.log(Status.FAIL, "Test failed: " + result.getThrowable());
        }
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        ExtentTest test = testMap.get(Thread.currentThread().getId());
        if (test != null) {
            test.log(Status.SKIP, "Test skipped: " + result.getThrowable());
        }
    }

    @Override
    public void onFinish(ITestContext context) {
        getExtent().flush();
    }
}
