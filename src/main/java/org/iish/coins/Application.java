package org.iish.coins;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.inject.Guice;
import com.google.inject.Injector;
import org.iish.coins.config.AcceptAllTrustManager;
import org.iish.coins.config.CoinsModule;
import org.iish.coins.config.Config;
import org.iish.coins.dataset.Datasets;
import org.iish.coins.record.Csv;
import org.iish.coins.record.Record;
import org.iish.coins.record.RecordsFilter;
import org.iish.coins.record.RecordsHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import spark.Request;
import spark.Response;
import spark.servlet.SparkApplication;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static spark.Spark.*;

/**
 * Sets up the Coins application.
 */
public class Application implements SparkApplication {
    private static final Logger LOGGER = LoggerFactory.getLogger(Application.class);
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    private Config config;
    private RecordsFilter recordsFilter;
    private Datasets datasets;

    /**
     * Run the application from the command line with the packaged Jetty servlet container.
     *
     * @param args The application arguments.
     */
    public static void main(String[] args) {
        port(Integer.parseInt(System.getProperty("port", "8080")));
        new Application().init();
    }

    /**
     * Initializes the application.
     */
    @Override
    public void init() {
        AcceptAllTrustManager.init();
        setUpInjector();
        setUpPaths();
    }

    /**
     * Sets up the Guice dependency injection injector.
     */
    private void setUpInjector() {
        Injector injector = Guice.createInjector(new CoinsModule());
        this.config = injector.getInstance(Config.class);
        this.recordsFilter = injector.getInstance(RecordsFilter.class);
        this.datasets = injector.getInstance(Datasets.class);
    }

    /**
     * Sets up the various routes.
     */
    private void setUpPaths() {
        staticFiles.location("/public");
        staticFiles.expireTime(60 * 60 * 24); // 1 day in seconds

        get("/fields", this::fields, GSON::toJson);
        get("/geo/mints", this::geoMints);
        get("/geo/authorities", this::geoAuthorities);
        get("/json", this::json, GSON::toJson);
        get("/csv", this::csv);

        after((req, res) -> {
            res.header("Content-Encoding", "gzip");

            switch (req.pathInfo()) {
                case "/csv":
                    res.type("text/csv; charset=utf-8");
                    res.header("Content-Disposition", "attachment;filename=mint.csv");
                    break;
                default:
                    res.type("text/json; charset=utf-8");
            }
        });

        exception(Exception.class, (e, req, res) -> {
            LOGGER.error(e.getMessage(), e);
            res.status(400);
            res.body(e.getMessage());
        });
    }

    /**
     * Returns the fields.
     *
     * @param request  The request.
     * @param response The response.
     * @return A map with the fields and their labels.
     */
    private Map<String, String> fields(Request request, Response response) {
        return config.fields;
    }

    /**
     * Returns the mint houses GeoJSON.
     *
     * @param request  The request.
     * @param response The response.
     * @return The GeoJSON.
     */
    private byte[] geoMints(Request request, Response response) {
        return datasets.getGeoMints();
    }

    /**
     * Returns the authorities GeoJSON.
     *
     * @param request  The request.
     * @param response The response.
     * @return The GeoJSON.
     */
    private byte[] geoAuthorities(Request request, Response response) {
        return datasets.getGeoAuthorities();
    }

    /**
     * Returns the requested data as JSON.
     *
     * @param request  The request.
     * @param response The response.
     * @return A list of records and a list of values for each field.
     */
    private RecordsHolder json(Request request, Response response) {
        List<Record> records = recordsFilter.getRecords(request);
        Map<String, Set<String>> values = recordsFilter.getValues(records);
        Integer[] minAndMaxYear = recordsFilter.getMinAndMaxYear(records);
        return new RecordsHolder(records, values, minAndMaxYear[0], minAndMaxYear[1]);
    }

    /**
     * Returns the requested data as CSV.
     *
     * @param request  The request.
     * @param response The response.
     * @return A string representing the CSV.
     * @throws IOException On I/O related problems.
     */
    private String csv(Request request, Response response) throws IOException {
        List<Record> records = recordsFilter.getRecords(request);
        return new Csv().write(records).toString();
    }
}
