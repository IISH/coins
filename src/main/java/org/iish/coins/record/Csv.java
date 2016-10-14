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
import java.util.List;
import java.util.stream.Collectors;

/**
 * Reads and writes the CSV with records.
 */
public class Csv {
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("d-M-u");
    private static final Object[] HEADERS = {"UID", "TYPEID", "SOURCE", "MINT", "REGION", "DATEfrom", "DATEto",
            "CoinNAME", "ALLOY", "VALUEd", "QTTYcoins", "FINEness", "WEIGHTraw", "WEIGHTfine", "TAILLE"};
    private static final CSVFormat CSV_FORMAT = CSVFormat.EXCEL
            .withFirstRecordAsHeader()
            .withDelimiter(';')
            .withIgnoreEmptyLines()
            .withNullString("");

    /**
     * Parses the given CSV.
     *
     * @param inputStream The stream of the given CSV.
     * @return A list with records from the CSV.
     * @throws IOException When I/O problems occur.
     */
    public List<Record> parse(InputStream inputStream) throws IOException {
        CSVParser parser = new CSVParser(new InputStreamReader(inputStream, Charset.forName("Cp1252")), CSV_FORMAT);
        return parser.getRecords().parallelStream().map(csvRecord -> {
            Record record = new Record();

            record.setId(csvRecord.get("UID"));
            record.setTypeId(csvRecord.get("TYPEID"));
            record.setSource(csvRecord.get("SOURCE"));
            record.setMint(csvRecord.get("MINT"));
            record.setRegion(csvRecord.get("REGION"));

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

            return record;
        }).collect(Collectors.toList());
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
                        record.getRegion(),
                        formatLocalDate(record.getDateTo()),
                        formatLocalDate(record.getDateFrom()),
                        record.getCoinName(),
                        record.getAlloy(),
                        record.getValue(),
                        record.getQuantity(),
                        record.getPurity(),
                        record.getRawWeight(),
                        record.getFineWeight(),
                        record.getTaille());
            }
        }
        finally {
            writer.flush();
            writer.close();
        }

        return writer;
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
