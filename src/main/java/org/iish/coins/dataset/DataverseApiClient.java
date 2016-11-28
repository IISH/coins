package org.iish.coins.dataset;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.inject.Singleton;
import org.iish.coins.config.Config;

import javax.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

/**
 * Provides access to Dataverse APIs to obtain datasets.
 */
@Singleton
public class DataverseApiClient {
    private static final String API_DATASETS_PERSISTENT_ID = "/api/datasets/:persistentId/?persistentId=hdl:";
    private static final String API_ACCESS_DATAFILE = "/api/access/datafile/";

    private static final JsonParser JSON_PARSER = new JsonParser();

    private String url;
    private int connectTimeout;
    private int readTimeout;

    /**
     * Uses the provided configuration to configure DataverseApiClient access.
     *
     * @param config The configuration.
     */
    @Inject
    public DataverseApiClient(Config config) {
        this.url = config.dataverse.url;
        this.connectTimeout = config.dataverse.connectTimeoutMs;
        this.readTimeout = config.dataverse.readTimeoutMs;
    }

    /**
     * Find the dataset file using the DataverseApiClient for the given PID and label.
     *
     * @param pid   The PID.
     * @param label Filter out files that do no have this label.
     * @return The file found in DataverseApiClient.
     * @throws DataverseException Thrown when not successful to obtain data about the files in DataverseApiClient.
     */
    public DataverseFile getFileForPidAndLabel(String pid, String label) throws DataverseException {
        try {
            List<DataverseFile> files = new ArrayList<>();
            URL url = new URL(this.url + API_DATASETS_PERSISTENT_ID + pid);
            HttpURLConnection connection = getConnection(url);

            if (connection.getResponseCode() != 200) {
                throw new DataverseException("Could not obtain the files for PID " + pid
                        + ": " + connection.getResponseMessage());
            }

            JsonElement response = JSON_PARSER.parse(new InputStreamReader(connection.getInputStream()));
            response.getAsJsonObject()
                    .getAsJsonObject("data")
                    .getAsJsonObject("latestVersion")
                    .getAsJsonArray("files")
                    .forEach(file -> {
                        JsonObject dataFile = file.getAsJsonObject().getAsJsonObject("datafile");
                        if ((label == null) || dataFile.get("name").getAsString().equalsIgnoreCase(label)) {
                            files.add(new DataverseFile(
                                    dataFile.get("id").getAsLong(), dataFile.get("name").getAsString()
                            ));
                        }
                    });

            return (!files.isEmpty()) ? files.get(0) : null;
        }
        catch (IllegalStateException | IOException e) {
            throw new DataverseException("Could not obtain the files for PID " + pid, e);
        }
    }

    /**
     * Returns an input stream for the given file id from DataverseApiClient.
     *
     * @param id The file id.
     * @return An input stream.
     * @throws DataverseException Thrown when not successful to obtain the file from DataverseApiClient.
     */
    public InputStream getFileById(long id) throws DataverseException {
        try {
            URL url = new URL(this.url + API_ACCESS_DATAFILE + id + "?format=original");
            HttpURLConnection connection = getConnection(url);

            if (connection.getResponseCode() != 200) {
                throw new DataverseException("Could not obtain the file for id " + id
                        + ": " + connection.getResponseMessage());
            }

            return connection.getInputStream();
        }
        catch (IOException e) {
            throw new DataverseException("Could not obtain the file with id " + id, e);
        }
    }

    /**
     * Sets up a connection for the given URL.
     *
     * @param url The URL to establish a connection to.
     * @return The established connection.
     * @throws IOException Thrown when an I/O exception occurs.
     */
    private HttpURLConnection getConnection(URL url) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        connection.setConnectTimeout(connectTimeout);
        connection.setReadTimeout(readTimeout);

        return connection;
    }
}
