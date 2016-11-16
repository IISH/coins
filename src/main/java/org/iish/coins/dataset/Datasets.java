package org.iish.coins.dataset;

import com.google.inject.Singleton;
import org.iish.coins.config.Config;
import org.iish.coins.record.Csv;
import org.iish.coins.record.Record;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Singleton which obtains the required datasets from Dataverse.
 */
@Singleton
public class Datasets {
    private static final Logger LOGGER = LoggerFactory.getLogger(Datasets.class);

    private final Config config;
    private final DataverseApiClient dataverseApiClient;

    private List<Record> cachedCsv = new ArrayList<>();
    private LocalDate dateCachedCsv;

    /**
     * Uses the provided configuration and Dataverse API client to obtain the datasets.
     *
     * @param config             The configuration.
     * @param dataverseApiClient The Dataverse API client.
     */
    @Inject
    public Datasets(Config config, DataverseApiClient dataverseApiClient) {
        this.config = config;
        this.dataverseApiClient = dataverseApiClient;
    }

    /**
     * Obtains the list of records from the Dataverse CSV file.
     *
     * @return A list of coin records.
     */
    public List<Record> getCsv() {
        if ((dateCachedCsv == null) || dateCachedCsv.isBefore(LocalDate.now().minusDays(1))) {
            try {
                InputStream coinsStream = dataverseApiClient.getFileById(config.datasets.coins);
                //InputStream wagesStream = dataverseApiClient.getFileById(config.datasets.wages);

                cachedCsv = new Csv().parse(coinsStream, new FileInputStream(System.getProperty("coins.wages")));
                dateCachedCsv = LocalDate.now();
            }
            catch (DataverseException de) {
                LOGGER.error("Failed to load the data from Dataverse!", de);
            }
            catch (IOException ioe) {
                LOGGER.error("Failed to read the CSV file!", ioe);
            }
        }
        return cachedCsv;
    }
}
