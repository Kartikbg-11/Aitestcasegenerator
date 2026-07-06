package com.testautomation.pages;

import com.testautomation.utils.WaitUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.util.List;

/**
 * Parent for all Page Objects.
 *
 * IMPORTANT — read this:
 * This app's exact element IDs/classes were not available for inspection
 * at the time this framework was generated (SPA, client-rendered, and the
 * generating environment had no live browser access to the target URL).
 *
 * To make the framework actually runnable against the real app without
 * constant rewrites, every locator-dependent action below accepts an
 * ARRAY of candidate locators (By...) and tries them in order until one
 * matches. This is a standard "self-healing locator" pattern used in
 * production frameworks (similar in spirit to how Selenium IDE / healing
 * tools work) and means:
 *   1) The framework works out-of-the-box for the common conventions
 *      (id, name, placeholder, common class names, text-based XPath).
 *   2) If your app uses something unusual, you only fix the candidate
 *      list in the relevant Page Object's *_LOCATORS array, not the
 *      test logic.
 *
 * See README.md section "Locator Calibration" for the 10-minute manual
 * step to confirm/tighten these against your real DOM.
 */
public abstract class BasePage {

    protected final WebDriver driver;
    protected final WaitUtils waitUtils;
    private static final Logger logger = LogManager.getLogger(BasePage.class);

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.waitUtils = new WaitUtils(driver);
    }

    /**
     * Tries each locator in order, returns the first one found visible.
     * Throws a descriptive exception (not a generic NoSuchElementException)
     * if none of the candidates match — this makes debugging real-DOM
     * mismatches fast.
     */
    protected WebElement findFirstMatch(By... candidates) {
        for (By locator : candidates) {
            try {
                List<WebElement> found = driver.findElements(locator);
                if (!found.isEmpty()) {
                    for (WebElement el : found) {
                        if (el.isDisplayed()) {
                            return el;
                        }
                    }
                }
            } catch (Exception ignored) {
                // try next candidate
            }
        }
        throw new NoSuchElementException(
                "None of the " + candidates.length + " candidate locators matched a visible element: "
                        + java.util.Arrays.toString(candidates)
                        + "\n--> Open the app in Chrome, press F12, inspect the real element, "
                        + "and add/adjust a locator candidate for this field in its Page Object class.");
    }

    protected void click(By... candidates) {
        WebElement el = findFirstMatch(candidates);
        try {
            el.click();
        } catch (Exception e) {
            // fallback for elements obscured by overlays/animations common in modern UIs
            ((org.openqa.selenium.JavascriptExecutor) driver).executeScript("arguments[0].click();", el);
        }
    }

    protected void type(String text, By... candidates) {
        WebElement el = findFirstMatch(candidates);
        el.clear();
        el.sendKeys(text);
    }

    protected String getText(By... candidates) {
        return findFirstMatch(candidates).getText();
    }

    protected boolean isDisplayed(By... candidates) {
        try {
            return findFirstMatch(candidates).isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        }
    }

    public String getCurrentUrl() {
        return driver.getCurrentUrl();
    }

    public String getPageTitle() {
        return driver.getTitle();
    }
}
