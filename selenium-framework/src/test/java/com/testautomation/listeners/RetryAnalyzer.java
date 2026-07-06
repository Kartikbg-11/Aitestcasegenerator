package com.testautomation.listeners;

import com.testautomation.utils.ConfigReader;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.testng.IRetryAnalyzer;
import org.testng.ITestResult;

/**
 * Retries a failed test method automatically before TestNG gives up on it
 * and reports it as FAILED for good.
 *
 * IMPORTANT — how this is wired (this is the part that's easy to get wrong):
 * IRetryAnalyzer is NOT a suite-level <listener>. It must be attached to
 * individual @Test methods, either:
 *   (a) manually:  @Test(retryAnalyzer = RetryAnalyzer.class)
 *   (b) automatically for every test in the suite, via the
 *       RetryTransformer (an IAnnotationTransformer) registered in
 *       testng.xml's <listeners> block — this is what this framework does,
 *       so you don't have to tag every single @Test by hand.
 *
 * A fresh RetryAnalyzer instance is created by TestNG for each @Test
 * method invocation, so retryCount below is naturally per-test, not shared
 * or reset incorrectly across different tests.
 */
public class RetryAnalyzer implements IRetryAnalyzer {

    private static final Logger logger = LogManager.getLogger(RetryAnalyzer.class);
    private int retryCount = 0;
    private final int maxRetryCount;

    public RetryAnalyzer() {
        // Falls back to 1 retry if config can't be read for any reason,
        // rather than throwing and breaking the whole run.
        int configured;
        try {
            configured = ConfigReader.getInt("retryCount", 1);
        } catch (Exception e) {
            configured = 1;
        }
        this.maxRetryCount = configured;
    }

    @Override
    public boolean retry(ITestResult result) {
        if (retryCount < maxRetryCount) {
            retryCount++;
            logger.warn("Retrying test '{}' — attempt {} of {}",
                    result.getMethod().getMethodName(), retryCount, maxRetryCount);
            return true;
        }
        return false;
    }
}
