package org.iish.coins.dataset;

import com.google.common.io.ByteStreams;
import com.google.inject.Singleton;
import org.iish.coins.config.Config;
import org.iish.coins.record.Csv;
import org.iish.coins.record.Record;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
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

    private byte[] cachedGeoMints;
    private LocalDate dateCachedGeoMints;

    private byte[] cachedGeoAuthorities;
    private LocalDate dateCachedGeoAuthorities;

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
                DataverseFile coinsFile =
                        dataverseApiClient.getFileForPidAndLabel(config.datasets.coins.pid, config.datasets.coins.label);
                DataverseFile wagesFile =
                        dataverseApiClient.getFileForPidAndLabel(config.datasets.wages.pid, config.datasets.wages.label);

                InputStream coinsStream = dataverseApiClient.getFileById(coinsFile.getId());
                InputStream wagesStream = dataverseApiClient.getFileById(wagesFile.getId());

                cachedCsv = new Csv().parse(coinsStream, wagesStream);
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

    /**
     * Obtains the latest GeoJSON with the authorities from Dataverse.
     *
     * @return The GeoJSON.
     */
    public byte[] getGeoAuthorities() {
        if ((dateCachedGeoAuthorities == null) || dateCachedGeoAuthorities.isBefore(LocalDate.now().minusDays(1))) {
            try {
                DataverseFile geoAuthoritiesFile =
                        dataverseApiClient.getFileForPidAndLabel(config.datasets.geoAuthorities.pid, config.datasets.geoAuthorities.label);
                InputStream geoAuthorities = dataverseApiClient.getFileById(geoAuthoritiesFile.getId());

                cachedGeoAuthorities = ByteStreams.toByteArray(geoAuthorities);
                dateCachedGeoAuthorities = LocalDate.now();
            }
            catch (DataverseException de) {
                LOGGER.error("Failed to load the data from Dataverse!", de);
            }
            catch (IOException ioe) {
                LOGGER.error("Failed to read the GeoJSON file!", ioe);
            }
        }
        return cachedGeoAuthorities;
    }

    /**
     * Obtains the latest GeoJSON with the mint houses from Dataverse.
     *
     * @return The GeoJSON.
     */
    public byte[] getGeoMints() {
        if ((dateCachedGeoMints == null) || dateCachedGeoMints.isBefore(LocalDate.now().minusDays(1))) {
            try {
                DataverseFile geoMintsFile =
                        dataverseApiClient.getFileForPidAndLabel(config.datasets.geoMint.pid, config.datasets.geoMint.label);
                InputStream geoMints = dataverseApiClient.getFileById(geoMintsFile.getId());

                cachedGeoMints = ByteStreams.toByteArray(geoMints);
                dateCachedGeoMints = LocalDate.now();
            }
            catch (DataverseException de) {
                LOGGER.error("Failed to load the data from Dataverse!", de);
            }
            catch (IOException ioe) {
                LOGGER.error("Failed to read the GeoJSON file!", ioe);
            }
        }
        return cachedGeoMints;
    }
}
