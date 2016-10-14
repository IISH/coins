package org.iish.coins.record;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Holds a list of records and a set of values for each field.
 */
public class RecordsHolder {
    private List<Record> records;
    private Map<String, Set<String>> values;

    /**
     * Sets up the RecordsHolder.
     *
     * @param records The list of records to hold.
     * @param values  The map of field values to hold.
     */
    public RecordsHolder(List<Record> records, Map<String, Set<String>> values) {
        this.records = records;
        this.values = values;
    }

    /**
     * Obtain the records from the holder.
     *
     * @return A list of records.
     */
    public List<Record> getRecords() {
        return records;
    }

    /**
     * Obtain the values map from the holder.
     *
     * @return A map containing a set of values for each field.
     */
    public Map<String, Set<String>> getValues() {
        return values;
    }
}
