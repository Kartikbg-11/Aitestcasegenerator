package com.testautomation.utils;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * Centralized explicit-wait helpers.
 * The app under test is a client-side rendered (Next.js) SPA, so elements
 * often aren't present in the DOM immediately after navigation/clicks.
 * Always prefer these over Thread.sleep().
 */
public class WaitUtils {

    private final WebDriver driver;
    private final WebDriverWait wait;

    public WaitUtils(WebDriver driver) {
        this.driver = driver;
        int explicitWait = ConfigReader.getInt("explicitWait");
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(explicitWait));
    }

    public WebElement waitForVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    public WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    public List<WebElement> waitForAllVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfAllElementsLocatedBy(locator));
    }

    public boolean waitForUrlContains(String fraction) {
        return wait.until(ExpectedConditions.urlContains(fraction));
    }

    public boolean waitForInvisible(By locator) {
        return wait.until(ExpectedConditions.invisibilityOfElementLocated(locator));
    }

    public <T> T waitFor(ExpectedCondition<T> condition) {
        return wait.until(condition);
    }

    /**
     * Waits until document.readyState === 'complete' AND there is no visible
     * spinner/loader element (best-effort) — useful right after navigation
     * on SPAs before interacting with anything.
     */
    public void waitForPageLoad() {
        wait.until(d -> ((org.openqa.selenium.JavascriptExecutor) d)
                .executeScript("return document.readyState").equals("complete"));
    }
}
