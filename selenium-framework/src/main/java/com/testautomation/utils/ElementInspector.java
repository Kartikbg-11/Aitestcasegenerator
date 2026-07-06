package com.testautomation.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Utility to enumerate every element present on the current page
 * (tag name, id, class, visible text, type) and dump it to a text file
 * under test-output/. This satisfies the requirement: "get all the
 * elements present in the page" (used on the Dashboard page in the flow).
 *
 * This is also genuinely useful for the manual locator-discovery step
 * described in README.md, since it dumps every id/class/name attribute
 * actually present in the live DOM.
 */
public class ElementInspector {

    private static final Logger logger = LogManager.getLogger(ElementInspector.class);

    /**
     * Finds all elements on the page (using "*" universal selector),
     * logs a summary count by tag, and writes full details to a file.
     *
     * @param driver   active WebDriver session
     * @param pageName label used in the output filename (e.g. "Dashboard")
     * @return total number of elements found
     */
    public static int captureAllElements(WebDriver driver, String pageName) {
        List<WebElement> allElements = driver.findElements(By.cssSelector("*"));
        logger.info("Total elements found on '{}' page: {}", pageName, allElements.size());

        String dir = "test-output/element-reports";
        try {
            Files.createDirectories(Paths.get(dir));
        } catch (IOException e) {
            logger.error("Could not create directory {}: {}", dir, e.getMessage());
        }

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filePath = dir + "/" + pageName.replaceAll("[^a-zA-Z0-9_-]", "_") + "_elements_" + timestamp + ".txt";

        try (FileWriter writer = new FileWriter(filePath)) {
            writer.write("Element Inventory for page: " + pageName + "\n");
            writer.write("Captured at: " + timestamp + "\n");
            writer.write("Current URL: " + driver.getCurrentUrl() + "\n");
            writer.write("Total elements: " + allElements.size() + "\n");
            writer.write("=".repeat(100) + "\n\n");

            int index = 1;
            for (WebElement el : allElements) {
                try {
                    String tag = safe(el.getTagName());
                    String id = safe(el.getDomAttribute("id"));
                    String cls = safe(el.getDomAttribute("class"));
                    String name = safe(el.getDomAttribute("name"));
                    String type = safe(el.getDomAttribute("type"));
                    String text = safe(el.getText());
                    if (text.length() > 80) {
                        text = text.substring(0, 80) + "...";
                    }
                    boolean displayed = el.isDisplayed();

                    writer.write(String.format(
                            "[%d] <%s> id=\"%s\" name=\"%s\" type=\"%s\" class=\"%s\" displayed=%s text=\"%s\"%n",
                            index++, tag, id, name, type, cls, displayed, text));
                } catch (Exception innerEx) {
                    // Stale/detached element (common on dynamic SPA pages mid-render) — skip, don't fail the run
                    writer.write(String.format("[%d] <stale element - skipped: %s>%n", index++, innerEx.getMessage()));
                }
            }

            logger.info("Full element inventory written to: {}", filePath);
        } catch (IOException e) {
            logger.error("Failed to write element report: {}", e.getMessage());
        }

        return allElements.size();
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }
}
