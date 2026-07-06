package com.testautomation.utils;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Properties;

/**
 * Reads framework configuration from config.properties.
 * Any property can be overridden at runtime via -D system properties,
 * e.g. mvn test -Dbrowser=firefox -DbaseUrl=https://staging.example.com
 *
 * This is what makes the framework "scalable" across environments
 * (dev/QA/staging/prod) without touching code.
 */
public class ConfigReader {

    private static Properties properties;
    private static final String CONFIG_PATH = "src/test/resources/config.properties";

    private ConfigReader() {
        // utility class, no instantiation
    }

    private static synchronized void load() {
        if (properties == null) {
            properties = new Properties();
            try (FileInputStream fis = new FileInputStream(CONFIG_PATH)) {
                properties.load(fis);
            } catch (IOException e) {
                throw new RuntimeException(
                        "Unable to load config.properties from " + CONFIG_PATH +
                                ". Make sure you are running from the project root.", e);
            }
        }
    }

    /**
     * Get a config value. System property (-Dkey=value) takes precedence
     * over the value in config.properties.
     */
    public static String get(String key) {
        load();
        String systemOverride = System.getProperty(key);
        if (systemOverride != null && !systemOverride.isEmpty()) {
            return systemOverride;
        }
        String value = properties.getProperty(key);
        if (value == null) {
            throw new RuntimeException("Property '" + key + "' not found in config.properties");
        }
        return value;
    }

    public static String get(String key, String defaultValue) {
        load();
        String systemOverride = System.getProperty(key);
        if (systemOverride != null && !systemOverride.isEmpty()) {
            return systemOverride;
        }
        return properties.getProperty(key, defaultValue);
    }

    public static int getInt(String key) {
        return Integer.parseInt(get(key));
    }

    public static int getInt(String key, int defaultValue) {
        try {
            return Integer.parseInt(get(key, String.valueOf(defaultValue)));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public static boolean getBoolean(String key) {
        return Boolean.parseBoolean(get(key));
    }
}
