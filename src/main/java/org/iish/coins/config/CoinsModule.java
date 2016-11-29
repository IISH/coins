package org.iish.coins.config;

import com.google.inject.AbstractModule;
import com.google.inject.Binder;
import com.google.inject.Provides;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.Constructor;

import javax.inject.Singleton;
import java.io.FileInputStream;
import java.io.FileNotFoundException;

/**
 * Guice dependency injection interface binding.
 */
public class CoinsModule extends AbstractModule {
    private static final Logger LOGGER = LoggerFactory.getLogger(CoinsModule.class);

    /**
     * Configures a {@link Binder} via the exposed methods.
     */
    @Override
    protected void configure() {
    }

    /**
     * Parses the config file and provides it as a singleton.
     *
     * @return The configuration.
     */
    @Provides
    @Singleton
    public Config providesConfig() {
        try {
            String configPath = System.getProperty("coins.config");
            LOGGER.info("Loading configuration from {}.", configPath);

            Yaml yaml = new Yaml(new Constructor(Config.class));
            return (Config) yaml.load(new FileInputStream(configPath));
        } catch (FileNotFoundException e) {
            LOGGER.error("Failed to load the configuration!", e);
            throw new RuntimeException(e);
        }
    }
}
