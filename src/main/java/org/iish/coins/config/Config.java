package org.iish.coins.config;

import java.util.Map;

/**
 * Holds the configuration.
 */
public class Config {
    public Dataverse dataverse;
    public Datasets datasets;
    public Map<String, String> fields;

    public static class Dataverse {
        public String url;
        public int connectTimeoutMs;
        public int readTimeoutMs;
    }

    public static class Datasets {
        public Dataset coins;
        public Dataset wages;
    }

    public static class Dataset {
        public String pid;
        public String key;
    }
}
