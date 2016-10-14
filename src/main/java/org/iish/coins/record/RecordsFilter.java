package org.iish.coins.record;

import org.iish.coins.config.Config;
import org.iish.coins.util.Getter;
import spark.Request;

import javax.inject.Inject;
import javax.inject.Singleton;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Allows one to filter the records.
 */
@Singleton
public class RecordsFilter {
    private @Inject Config config;
    private @Inject List<Record> records;

    /**
     * For the given request, filter the list of records.
     *
     * @param request The request with filters set.
     * @return The filtered records.
     */
    public List<Record> getRecords(Request request) {
        Stream<Record> recordStream = records.parallelStream();

        String years = request.queryParams("years");
        LocalDate from = getDate(request.queryParams("from"), true);
        LocalDate to = getDate(request.queryParams("to"), false);
        if ((from != null) && (to != null) && from.isBefore(to)) {
            recordStream = recordStream.filter(record -> filterOnDate(record, from, to, years));
        }

        Getter<Record> recordGetter = new Getter<>(Record.class);
        for (String param : request.queryParams()) {
            if (recordGetter.hasName(param)) {
                String[] values = request.queryParamsValues(param);

                if (recordGetter.getType(param) == String.class) {
                    recordStream = recordStream.filter(record -> {
                        String value = (String) recordGetter.getValue(param, record);
                        return filterOnString(value, values);
                    });
                }

                if (recordGetter.getType(param) == BigDecimal.class) {
                    recordStream = recordStream.filter(record -> {
                        BigDecimal value = (BigDecimal) recordGetter.getValue(param, record);
                        return filterOnBigDecimal(value, values);
                    });
                }
            }
        }

        return recordStream.collect(Collectors.toList());
    }

    /**
     * For the given list of filtered records, return a map with String values found for each field.
     *
     * @param filteredRecords The list with filtered records.
     * @return A map with a set of String values found for each field.
     */
    public Map<String, Set<String>> getValues(List<Record> filteredRecords) {
        Map<String, Set<String>> values = new HashMap<>();
        Getter<Record> recordGetter = new Getter<>(Record.class);

        filteredRecords.parallelStream().forEach(record -> {
            config.fields.keySet().forEach(field -> {
                Object value = recordGetter.getValue(field, record);

                if ((value != null) && (value instanceof String)) {
                    if (!values.containsKey(field))
                        values.put(field, new HashSet<>());

                    Set<String> valuesForKey = values.get(field);
                    valuesForKey.add((String) value);
                }
            });
        });

        return values;
    }

    /**
     * Determines whether the given record should be filtered out, based on a year range.
     *
     * @param record The record in question.
     * @param from   The lower bound year.
     * @param to     The upper bound year.
     * @param years  How to determine which date ranges are valid.
     * @return Whether the record should be filtered in.
     */
    private boolean filterOnDate(Record record, LocalDate from, LocalDate to, String years) {
        if ((record.getDateFrom() != null) && (record.getDateTo() != null)) {
            if ((years != null) && years.equalsIgnoreCase("complete")) {
                return record.getDateFrom().isAfter(from) && record.getDateTo().isBefore(to);
            }

            boolean partlyBeforeFrom = record.getDateFrom().isAfter(from) && record.getDateFrom().isBefore(to);
            boolean partlyAfterTo = record.getDateTo().isAfter(from) && record.getDateTo().isBefore(to);

            return partlyBeforeFrom || partlyAfterTo;
        }
        return false;
    }

    /**
     * Determines whether the given record value should be filtered out, based on string criteria.
     *
     * @param value    The record value in question.
     * @param criteria An array of criteria.
     * @return Whether the record should be filtered in.
     */
    private boolean filterOnString(String value, String[] criteria) {
        for (String criterion : Arrays.asList(criteria)) {
            String[] criterionSplit = criterion.split(":", 3);
            if (criterionSplit.length == 3) {
                String negative = criterionSplit[0];
                String contains = criterionSplit[1];
                String toMatch = criterionSplit[2];

                boolean match = false;
                if (value != null) {
                    if (contains.equals("ctns"))
                        match = value.toLowerCase().contains(toMatch.toLowerCase());
                    else
                        match = value.equalsIgnoreCase(toMatch);
                }

                if ((negative.equals("eq") && match) || (!negative.equals("eq") && !match))
                    return true;
            }
        }
        return false;
    }

    /**
     * Determines whether the given record value should be filtered out, based on number criteria.
     *
     * @param value    The record value in question.
     * @param criteria An array of criteria.
     * @return Whether the record should be filtered in.
     */
    private boolean filterOnBigDecimal(BigDecimal value, String[] criteria) {
        for (String criterion : Arrays.asList(criteria)) {
            String[] criterionSplit = criterion.split(":", 3);
            if (criterionSplit.length == 3) {
                String negative = criterionSplit[0];
                String minStr = criterionSplit[1];
                String maxStr = criterionSplit[2];

                boolean match = false;
                if (value != null) {
                    try {
                        BigDecimal min = new BigDecimal(minStr);
                        BigDecimal max = new BigDecimal(maxStr);
                        match = (min.compareTo(value) <= 0) && (max.compareTo(value) >= 0);
                    }
                    catch (NumberFormatException nfe) {
                        match = false;
                    }
                }

                if ((negative.equals("eq") && match) || (!negative.equals("eq") && !match))
                    return true;
            }
        }
        return false;
    }

    /**
     * For a given year, obtain the LocalDate representation.
     *
     * @param year  The year in question.
     * @param start Whether it should be a date from the start, or the end of the year.
     * @return The LocalDate.
     */
    private LocalDate getDate(String year, boolean start) {
        try {
            return start ? LocalDate.of(Integer.valueOf(year), 1, 1) : LocalDate.of(Integer.valueOf(year), 12, 31);
        }
        catch (NumberFormatException | DateTimeParseException | NullPointerException ex) {
            return null;
        }
    }
}
