package com.testautomation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.Select;

/**
 * Page Object for the "New Project" creation form.
 *
 * NOTE on "status": the requirement says "status check box select planing".
 * In most project-management UIs, status is implemented as a <select>
 * dropdown or a set of radio/option buttons rather than a literal HTML
 * checkbox (a checkbox can't represent one-of-many states like
 * Planning/Active/Completed). This page object handles BOTH possibilities:
 * it first tries a <select> dropdown, and falls back to clicking a
 * matching option element (radio/button/listbox option) if no <select>
 * is found. Calibrate against the real DOM if neither matches.
 */
public class NewProjectPage extends BasePage {

    public NewProjectPage(WebDriver driver) {
        super(driver);
    }

    private static final By[] PROJECT_NAME_FIELD = {
            By.id("projectName"),
            By.name("name"),
            By.cssSelector("input[placeholder*='name' i]"),
            By.xpath("//label[contains(translate(text(),'NAME','name'),'name')]/following::input[1]")
    };

    private static final By[] DESCRIPTION_FIELD = {
            By.id("description"),
            By.name("description"),
            By.cssSelector("textarea[placeholder*='description' i]"),
            By.xpath("//label[contains(translate(text(),'DESCRIPTION','description'),'description')]/following::*[self::textarea or self::input][1]")
    };

    private static final By[] STATUS_DROPDOWN = {
            By.id("status"),
            By.name("status"),
            By.cssSelector("select[name='status']"),
            By.xpath("//label[contains(translate(text(),'STATUS','status'),'status')]/following::select[1]")
    };

    // Fallback if status is a custom dropdown / radio group rather than a native <select>
    private static final By[] STATUS_TRIGGER = {
            By.xpath("//label[contains(translate(text(),'STATUS','status'),'status')]/following::*[self::button or self::div[@role='combobox']][1]"),
            By.cssSelector("[data-testid='status-select']")
    };

    private static final By[] SAVE_BUTTON = {
            By.xpath("//button[normalize-space()='Save']"),
            By.xpath("//*[self::button or self::a][contains(translate(text(),'SAVE','save'),'save')]"),
            By.cssSelector("button[type='submit']"),
            By.id("saveButton")
    };

    public NewProjectPage enterProjectName(String name) {
        type(name, PROJECT_NAME_FIELD);
        return this;
    }

    public NewProjectPage enterDescription(String description) {
        type(description, DESCRIPTION_FIELD);
        return this;
    }

    /**
     * Selects the given status. Tries a native <select> first (most common
     * implementation); if that's not present, falls back to opening a
     * custom dropdown trigger and clicking the matching option text.
     */
    public NewProjectPage selectStatus(String statusValue) {
        try {
            var dropdown = findFirstMatch(STATUS_DROPDOWN);
            new Select(dropdown).selectByVisibleText(statusValue);
        } catch (Exception nativeSelectFailed) {
            // Fallback: custom dropdown component (common with shadcn/Radix/MUI selects)
            click(STATUS_TRIGGER);
            By[] optionLocator = {
                    By.xpath("//*[self::li or self::div or self::span][normalize-space()='" + statusValue + "']"),
                    By.xpath("//*[contains(translate(text(),'" + statusValue.toUpperCase() + "','" + statusValue.toLowerCase() + "'),'" + statusValue.toLowerCase() + "')]")
            };
            click(optionLocator);
        }
        return this;
    }

    public void clickSave() {
        click(SAVE_BUTTON);
        waitUtils.waitForPageLoad();
    }

    /**
     * Convenience method to fill and submit the entire new-project form
     * in one call, matching the requested flow.
     */
    public void createProject(String name, String description, String status) {
        enterProjectName(name);
        enterDescription(description);
        selectStatus(status);
        clickSave();
    }
}
