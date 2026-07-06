package com.testautomation.utils;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Captures screenshots and saves them with a timestamped, test-name-based
 * filename. Used by both the test base (on failure) and individual test
 * steps (for evidence in the final report).
 */
public class ScreenshotUtils {

    private static final Logger logger = LogManager.getLogger(ScreenshotUtils.class);

    public static String capture(WebDriver driver, String testName) {
        String dir = ConfigReader.get("screenshotDir", "test-output/screenshots");
        try {
            Files.createDirectories(Paths.get(dir));
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = testName.replaceAll("[^a-zA-Z0-9_-]", "_") + "_" + timestamp + ".png";
            String fullPath = dir + File.separator + fileName;

            File srcFile = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            Files.copy(srcFile.toPath(), Paths.get(fullPath));

            logger.info("Screenshot saved: {}", fullPath);
            return fullPath;
        } catch (IOException e) {
            logger.error("Failed to capture screenshot for test '{}': {}", testName, e.getMessage());
            return null;
        }
    }
}
