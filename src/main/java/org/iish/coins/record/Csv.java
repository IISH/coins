package org.iish.coins.record;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Reads and writes the CSV with records.
 */
public class Csv {
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("d-M-u");

    private static final Object[] HEADERS = {"UID", "TYPEID", "SOURCE", "MINT", "AUTHORITY", "DATEfrom", "DATEto",
            "CoinNAME", "ALLOY", "VALUEd", "QTTYcoins", "FINEness", "WEIGHTraw", "WEIGHTfine", "TAILLE",
            "AUTHORITY_SUPRA", "ALT_CoinNAME", "ALT_TYPEID", "VALUE_HourlyWAGE"};

    private static final CSVFormat CSV_FORMAT = CSVFormat.EXCEL
            .withFirstRecordAsHeader()
            .withDelimiter(';')
            .withIgnoreEmptyLines()
            .withNullString("");

    /**
     * Parses the given coins CSV with extra data from the wages CSV.
     *
     * @param coinsStream The stream of the given coins CSV.
     * @param wagesStream The stream of the given wages CSV.
     * @return A list with records from the coins CSV (including some extra wages from the wages CSV).
     * @throws IOException When I/O problems occur.
     */
    public List<Record> parse(InputStream coinsStream, InputStream wagesStream) throws IOException {
        Map<String, Record> recordsById = new ConcurrentHashMap<>();
        Map<String, String[]> recordLinks = new ConcurrentHashMap<>();
        Map<Integer, BigDecimal> wages = getWages(wagesStream);

        CSVParser parser = new CSVParser(new InputStreamReader(coinsStream, Charset.forName("UTF-8")), CSV_FORMAT);
        List<Record> records = parser.getRecords().parallelStream().map(csvRecord -> {
            Record record = new Record();

            record.setId(csvRecord.get("UID"));
            record.setTypeId(csvRecord.get("TYPEID"));
            record.setSource(csvRecord.get("SOURCE"));
            record.setMint(csvRecord.get("MINT"));
            record.setAuthority(csvRecord.get("AUTHORITY"));

            record.setDateFrom(getLocalDate(csvRecord.get("DATEfrom")));
            record.setDateTo(getLocalDate(csvRecord.get("DATEto")));

            record.setCoinName(csvRecord.get("CoinNAME"));
            record.setAlloy(csvRecord.get("ALLOY"));

            record.setValue(getBigDecimal(csvRecord.get("VALUEd"), 3));
            record.setQuantity(getBigDecimal(csvRecord.get("QTTYcoins"), 0));
            record.setPurity(getBigDecimal(csvRecord.get("FINEness"), 3));
            record.setRawWeight(getBigDecimal(csvRecord.get("WEIGHTraw"), 3));
            record.setFineWeight(getBigDecimal(csvRecord.get("WEIGHTfine"), 3));
            record.setTaille(getBigDecimal(csvRecord.get("TAILLE"), 3));

            record.setHigherAuthority(csvRecord.get("AUTHORITY_SUPRA"));
            record.setAlternativeCoinName(csvRecord.get("ALT_CoinNAME"));
            record.setAlternativeTypeId(csvRecord.get("ALT_TYPEID"));

            // Also map each record by its id and record the links
            recordsById.put(record.getId(), record);
            if (csvRecord.get("LINK") != null)
                recordLinks.put(record.getId(), csvRecord.get("LINK").split(","));

            return record;
        }).collect(Collectors.toList());

        records.parallelStream().forEach(record -> {
            // Determine if we should base the quantity coins on the link
            if ((record.getQuantity() != null) && (record.getQuantity().compareTo(BigDecimal.ZERO) == 0)
                    && (recordLinks.containsKey(record.getId()))) {
                Stream.of(recordLinks.get(record.getId()))
                        .map(id -> recordsById.getOrDefault(id, null))
                        .filter(Objects::nonNull)
                        .forEach(linkRecord -> {
                            BigDecimal totalQuantity = linkRecord.getQuantity();
                            long totalDays = record.getTotalDays() + linkRecord.getTotalDays();

                            linkRecord.setQuantity(
                                    totalQuantity
                                            .multiply(new BigDecimal(linkRecord.getTotalDays()))
                                            .divide(new BigDecimal(totalDays), BigDecimal.ROUND_HALF_UP)
                            );

                            record.setQuantity(
                                    totalQuantity
                                            .multiply(new BigDecimal(record.getTotalDays()))
                                            .divide(new BigDecimal(totalDays), BigDecimal.ROUND_HALF_UP)
                            );
                        });
            }

            // Calculate the coin values in hourly wages
            if (record.getValue() != null) {
                long totalDays = 0;
                BigDecimal totalValue = BigDecimal.ZERO;
                for (Map.Entry<Integer, Long> yearEntry : record.getTotalDaysPerYear().entrySet()) {
                    if (wages.containsKey(yearEntry.getKey())) {
                        BigDecimal hourlyWage = wages.get(yearEntry.getKey());
                        BigDecimal daysInYear = new BigDecimal(yearEntry.getValue());

                        totalDays += yearEntry.getValue();
                        totalValue = totalValue.add(hourlyWage.multiply(daysInYear));
                    }
                }

                if (totalDays > 0) {
                    BigDecimal averageWage = totalValue.divide(new BigDecimal(totalDays), BigDecimal.ROUND_HALF_UP);
                    record.setValueInHourlyWages(record.getValue().divide(averageWage, BigDecimal.ROUND_HALF_UP));
                }
            }
        });

        return records;
    }

    /**
     * Writes the given list of records to CSV.
     *
     * @param records The list of records to write.
     * @return A writer with the CSV.
     * @throws IOException When I/O problems occur.
     */
    public Writer write(List<Record> records) throws IOException {
        CSVPrinter csvPrinter;
        StringWriter writer = new StringWriter();

        try {
            csvPrinter = new CSVPrinter(writer, CSV_FORMAT);
            csvPrinter.printRecord(HEADERS);

            for (Record record : records) {
                csvPrinter.printRecord(
                        record.getId(),
                        record.getTypeId(),
                        record.getSource(),
                        record.getMint(),
                        record.getAuthority(),
                        formatLocalDate(record.getDateTo()),
                        formatLocalDate(record.getDateFrom()),
                        record.getCoinName(),
                        record.getAlloy(),
                        record.getValue(),
                        record.getQuantity(),
                        record.getPurity(),
                        record.getRawWeight(),
                        record.getFineWeight(),
                        record.getTaille(),
                        record.getHigherAuthority(),
                        record.getAlternativeCoinName(),
                        record.getAlternativeTypeId(),
                        record.getValueInHourlyWages());
            }
        }
        finally {
            writer.flush();
            writer.close();
        }

        return writer;
    }

    /**
     * Parses the given wages CSV.
     *
     * @param inputStream The stream of the given wages CSV.
     * @return The mapping between the year and the hourly wage.
     * @throws IOException When I/O problems occur.
     */
    private Map<Integer, BigDecimal> getWages(InputStream inputStream) throws IOException {
        CSVParser parser = new CSVParser(new InputStreamReader(inputStream, Charset.forName("UTF-8")), CSV_FORMAT);
        return parser.getRecords().stream()
                .filter(csvRecord -> (csvRecord.get("Year") != null) && csvRecord.get("Year").matches("[0-9]+"))
                .filter(csvRecord -> (getBigDecimal(csvRecord.get("Hourly wage (VALUEd)"), 2) != null))
                .collect(Collectors.toMap(
                        csvRecord -> Integer.parseInt(csvRecord.get("Year")),
                        csvRecord -> getBigDecimal(csvRecord.get("Hourly wage (VALUEd)"), 2)
                ));
    }

    /**
     * Parses the date from the CSV to a LocalDate.
     *
     * @param value The date from the CSV.
     * @return The LocalDate.
     */
    private LocalDate getLocalDate(String value) {
        try {
            if (value != null)
                return LocalDate.parse(value, DATE_FORMATTER);
            return null;
        }
        catch (DateTimeParseException ex) {
            return null;
        }
    }

    /**
     * Formats a given LocalDate to a date in the CSV.
     *
     * @param value The LocalDate to format.
     * @return The formatted LocalDate.
     */
    private String formatLocalDate(LocalDate value) {
        if (value != null)
            return value.format(DATE_FORMATTER);
        return null;
    }

    /**
     * Parses a number from the CSV.
     *
     * @param value The number from the CSV.
     * @param scale The scale of the BigDecimal.
     * @return The parsed number as a BigDecimal.
     */
    private BigDecimal getBigDecimal(String value, int scale) {
        try {
            if (value != null)
                return new BigDecimal(value).setScale(scale, BigDecimal.ROUND_HALF_UP);
            return null;
        }
        catch (NumberFormatException ex) {
            return null;
        }
    }
}
