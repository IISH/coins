package org.iish.coins.dataset;

/**
 * Represents a file in Dataverse.
 */
public class DataverseFile {
    private final long id;
    private final String name;

    /**
     * Creates a representation of a file in Dataverse.
     *
     * @param id   The id of the file.
     * @param name The name of the file.
     */
    public DataverseFile(final long id, final String name) {
        this.id = id;
        this.name = name;
    }

    /**
     * Returns the id of the file.
     *
     * @return The id of the file.
     */
    public long getId() {
        return id;
    }

    /**
     * Returns the name of the file.
     *
     * @return The name of the file.
     */
    public String getName() {
        return name;
    }
}
