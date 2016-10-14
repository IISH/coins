package org.iish.coins.config;

import java.util.Map;

/**
 * Holds the configuration.
 */
public class Config {
    public Dataverse dataverse;
    public Map<String, String> fields;

    public static class Dataverse {
        public String url;
        public int connectTimeoutMs;
        public int readTimeoutMs;
    }
}
