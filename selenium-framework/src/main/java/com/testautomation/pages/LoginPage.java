package com.testautomation.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for the Sign-In page.
 * Page text confirmed (via static HTML fetch) to contain:
 *   "Username", "Password", "Remember me", "Forgot password?", "Sign In"
 *   and footer text "Demo credentials: admin / Admin@12345"
 *
 * Exact tag/id/class attributes were NOT confirmed (SPA renders client-side).
 * Candidate locators below cover the most common real-world implementations
 * for a form matching this visible text. Calibrate against the live DOM if
 * none match — see README.md.
 */
public class LoginPage extends BasePage {

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    private static final By[] USERNAME_FIELD = {
            By.id("username"),
            By.name("username"),
            By.cssSelector("input[placeholder*='sername' i]"),
            By.cssSelector("input[type='text']"),
            By.xpath("//label[contains(translate(text(),'USERNAME','username'),'username')]/following::input[1]")
    };

    private static final By[] PASSWORD_FIELD = {
            By.id("password"),
            By.name("password"),
            By.cssSelector("input[type='password']"),
            By.xpath("//label[contains(translate(text(),'PASSWORD','password'),'password')]/following::input[1]")
    };

    private static final By[] SIGN_IN_BUTTON = {
            By.xpath("//button[normalize-space()='Sign In']"),
            By.xpath("//button[contains(translate(text(),'SIGN IN','sign in'),'sign in')]"),
            By.cssSelector("button[type='submit']"),
            By.id("signInButton")
    };

    private static final By[] ERROR_MESSAGE = {
            By.cssSelector("[role='alert']"),
            By.xpath("//*[contains(@class,'error') or contains(@class,'destructive')]")
    };

    public LoginPage enterUsername(String username) {
        type(username, USERNAME_FIELD);
        return this;
    }

    public LoginPage enterPassword(String password) {
        type(password, PASSWORD_FIELD);
        return this;
    }

    /**
     * Per the requested flow: enter name/password, then click the button
     * that submits the form (visible label is "Sign In" on this app).
     */
    public void clickSignIn() {
        click(SIGN_IN_BUTTON);
    }

    /**
     * Convenience method combining the full login flow in one call.
     */
    public void login(String username, String password) {
        enterUsername(username);
        enterPassword(password);
        clickSignIn();
        waitUtils.waitForPageLoad();
    }

    public boolean isErrorDisplayed() {
        return isDisplayed(ERROR_MESSAGE);
    }
}
