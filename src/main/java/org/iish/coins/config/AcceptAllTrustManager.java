package org.iish.coins.config;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;

/**
 * Sets up an all trusting trust manager.
 * TODO: Replace by adding the Dataverse certificate to the trust store.
 */
public class AcceptAllTrustManager implements X509TrustManager {
    private AcceptAllTrustManager() {
    }

    /**
     * Initialize the trust manager.
     */
    public static void init() {
        try {
            TrustManager[] trustManagers = new TrustManager[]{new AcceptAllTrustManager()};
            SSLContext sslContext = SSLContext.getInstance("SSL");
            sslContext.init(null, trustManagers, new SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.getSocketFactory());
        }
        catch (NoSuchAlgorithmException | KeyManagementException e) {
            throw new RuntimeException("Failure to set up an all trusting trust manager.", e);
        }
    }

    @Override
    public void checkClientTrusted(X509Certificate[] x509Certificates, String s) throws CertificateException {
    }

    @Override
    public void checkServerTrusted(X509Certificate[] x509Certificates, String s) throws CertificateException {
    }

    @Override
    public X509Certificate[] getAcceptedIssuers() {
        return null;
    }
}
