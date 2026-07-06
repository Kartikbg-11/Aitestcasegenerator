package com.testautomation.pages;

import com.testautomation.utils.ElementInspector;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for the Dashboard (landing page after successful sign-in).
 */
public class DashboardPage extends BasePage {

    public DashboardPage(WebDriver driver) {
        super(driver);
    }

    private static final By[] PROJECTS_NAV = {
            By.xpath("//a[normalize-space()='Projects']"),
            By.xpath("//*[self::a or self::button or self::span][contains(translate(text(),'PROJECTS','projects'),'projects')]"),
            By.linkText("Projects"),
            By.partialLinkText("Project"),
            By.id("nav-projects")
    };

    private static final By[] DASHBOARD_MARKER = {
            By.xpath("//*[contains(translate(text(),'DASHBOARD','dashboard'),'dashboard')]"),
            By.cssSelector("[data-testid='dashboard']")
    };

    public boolean isLoaded() {
        waitUtils.waitForPageLoad();
        return isDisplayed(DASHBOARD_MARKER) || driver.getCurrentUrl().toLowerCase().contains("dashboard");
    }

    /**
     * Requirement: "get all the elements present in the page" — captures
     * a full inventory of every DOM element on the Dashboard and writes
     * it to test-output/element-reports/. Returns element count so the
     * test can assert the page actually rendered something.
     */
    public int captureAllPageElements() {
        return ElementInspector.captureAllElements(driver, "Dashboard");
    }

    public void clickProjects() {
        click(PROJECTS_NAV);
        waitUtils.waitForPageLoad();
    }
}
