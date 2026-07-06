package com.testautomation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for the Projects listing page.
 */
public class ProjectsPage extends BasePage {

    public ProjectsPage(WebDriver driver) {
        super(driver);
    }

    private static final By[] NEW_PROJECT_BUTTON = {
            By.xpath("//button[normalize-space()='New Project']"),
            By.xpath("//*[self::button or self::a][contains(translate(text(),'NEW PROJECT','new project'),'new project')]"),
            By.id("newProjectButton"),
            By.cssSelector("[data-testid='new-project-button']")
    };

    public void clickNewProject() {
        click(NEW_PROJECT_BUTTON);
        waitUtils.waitForPageLoad();
    }
}
