package org.iish.coins.dataset;

/**
 * Thrown on failure to communicate with DataverseApiClient.
 */
public class DataverseException extends Exception {
    public DataverseException(String message) {
        super(message);
    }

    public DataverseException(String message, Throwable cause) {
        super(message, cause);
    }
}
