package com.testautomation.tests;

import com.testautomation.base.BaseTest;
import com.testautomation.pages.DashboardPage;
import com.testautomation.pages.LoginPage;
import com.testautomation.pages.NewProjectPage;
import com.testautomation.pages.ProjectsPage;
import com.testautomation.utils.ConfigReader;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * End-to-end regression test covering the full requested flow:
 *   1. Sign in (username/password)
 *   2. Land on Dashboard, capture full element inventory
 *   3. Navigate to Projects
 *   4. Click "New Project"
 *   5. Fill Name / Description / Status, click Save
 *
 * Broken into separate @Test methods (rather than one giant method) so:
 *   - TestNG reports show exactly which STEP failed, not just "the test"
 *   - Each step is independently re-runnable/extendable later
 *   - methodA -> dependsOnMethods -> methodB enforces correct order while
 *     still giving step-level pass/fail visibility in the report
 *
 * All test data is pulled from config.properties (no hardcoded values in
 * test logic) so the same script can be re-pointed at another environment
 * or dataset purely through configuration.
 */
public class ProjectCreationE2ETest extends BaseTest {

    private LoginPage loginPage;
    private DashboardPage dashboardPage;
    private ProjectsPage projectsPage;
    private NewProjectPage newProjectPage;

    @Test(priority = 1, description = "Sign in with valid admin credentials and land on Dashboard")
    public void testLogin() {
        String username = ConfigReader.get("username");
        String password = ConfigReader.get("password");

        logger.info("Step 1: Logging in as '{}'", username);
        loginPage = new LoginPage(getDriver());
        loginPage.login(username, password);

        dashboardPage = new DashboardPage(getDriver());
        Assert.assertTrue(dashboardPage.isLoaded(),
                "Expected to land on Dashboard after sign-in, but current URL was: " + getDriver().getCurrentUrl());
        logger.info("Login successful. Current URL: {}", getDriver().getCurrentUrl());
    }

    @Test(priority = 2, dependsOnMethods = "testLogin",
            description = "Capture full element inventory on the Dashboard page")
    public void testCaptureDashboardElements() {
        logger.info("Step 2: Capturing all elements present on Dashboard page");
        dashboardPage = new DashboardPage(getDriver());
        int elementCount = dashboardPage.captureAllPageElements();

        Assert.assertTrue(elementCount > 0, "Expected at least one element on the Dashboard page, found 0");
        logger.info("Captured {} elements from Dashboard. See test-output/element-reports/ for full inventory.", elementCount);
    }

    @Test(priority = 3, dependsOnMethods = "testCaptureDashboardElements",
            description = "Navigate to Projects section")
    public void testNavigateToProjects() {
        logger.info("Step 3: Clicking 'Projects' navigation");
        dashboardPage = new DashboardPage(getDriver());
        dashboardPage.clickProjects();

        projectsPage = new ProjectsPage(getDriver());
        logger.info("Navigated to Projects. Current URL: {}", getDriver().getCurrentUrl());
    }

    @Test(priority = 4, dependsOnMethods = "testNavigateToProjects",
            description = "Click 'New Project' button to open creation form")
    public void testOpenNewProjectForm() {
        logger.info("Step 4: Clicking 'New Project'");
        projectsPage = new ProjectsPage(getDriver());
        projectsPage.clickNewProject();

        newProjectPage = new NewProjectPage(getDriver());
        logger.info("New Project form opened. Current URL: {}", getDriver().getCurrentUrl());
    }

    @Test(priority = 5, dependsOnMethods = "testOpenNewProjectForm",
            description = "Fill project name, description, status and save")
    public void testCreateProject() {
        String projectName = ConfigReader.get("project.name");
        String description = ConfigReader.get("project.description");
        String status = ConfigReader.get("project.status");

        logger.info("Step 5: Creating project - name='{}', description='{}', status='{}'",
                projectName, description, status);

        newProjectPage = new NewProjectPage(getDriver());
        newProjectPage.createProject(projectName, description, status);

        logger.info("Project creation submitted. Current URL: {}", getDriver().getCurrentUrl());
        // NOTE: add a stronger assertion here once you confirm the real
        // post-save behavior (e.g. assert a success toast appears, or
        // assert the new project "kilo" is now visible in the projects list).
    }
}
