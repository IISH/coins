package org.iish.coins.record;

import com.google.gson.annotations.SerializedName;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.TreeMap;

/**
 * Representation of a record.
 */
public class Record {
    private @SerializedName("UID") String id;
    private @SerializedName("TYPEID") String typeId;
    private @SerializedName("SOURCE") String source;
    private @SerializedName("MINT") String mint;
    private @SerializedName("REGION") String region;
    private @SerializedName("DATEfrom") LocalDate dateFrom;
    private @SerializedName("DATEto") LocalDate dateTo;
    private @SerializedName("CoinNAME") String coinName;
    private @SerializedName("ALLOY") String alloy;
    private @SerializedName("VALUEd") BigDecimal value;
    private @SerializedName("QTTYcoins") BigDecimal quantity;
    private @SerializedName("FINEness") BigDecimal purity;
    private @SerializedName("WEIGHTraw") BigDecimal rawWeight;
    private @SerializedName("WEIGHTfine") BigDecimal fineWeight;
    private @SerializedName("TAILLE") BigDecimal taille;

    private long totalDays;
    private Map<Integer, Long> totalDaysPerYear;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTypeId() {
        return typeId;
    }

    public void setTypeId(String typeId) {
        this.typeId = typeId;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getMint() {
        return mint;
    }

    public void setMint(String mint) {
        this.mint = mint;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public LocalDate getDateFrom() {
        return dateFrom;
    }

    public void setDateFrom(LocalDate dateFrom) {
        this.dateFrom = dateFrom;
        if ((this.dateFrom != null) && (this.dateTo != null)) {
            computeTotalDays();
            computeTotalDaysPerYear();
        }
    }

    public LocalDate getDateTo() {
        return dateTo;
    }

    public void setDateTo(LocalDate dateTo) {
        this.dateTo = dateTo;
        if ((this.dateFrom != null) && (this.dateTo != null)) {
            computeTotalDays();
            computeTotalDaysPerYear();
        }
    }

    public String getCoinName() {
        return coinName;
    }

    public void setCoinName(String coinName) {
        this.coinName = coinName;
    }

    public String getAlloy() {
        return alloy;
    }

    public void setAlloy(String alloy) {
        this.alloy = alloy;
    }

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPurity() {
        return purity;
    }

    public void setPurity(BigDecimal purity) {
        this.purity = purity;
    }

    public BigDecimal getRawWeight() {
        return rawWeight;
    }

    public void setRawWeight(BigDecimal rawWeight) {
        this.rawWeight = rawWeight;
    }

    public BigDecimal getFineWeight() {
        return fineWeight;
    }

    public void setFineWeight(BigDecimal fineWeight) {
        this.fineWeight = fineWeight;
    }

    public BigDecimal getTaille() {
        return taille;
    }

    public void setTaille(BigDecimal taille) {
        this.taille = taille;
    }

    public long getTotalDays() {
        return totalDays;
    }

    public Map<Integer, Long> getTotalDaysPerYear() {
        return totalDaysPerYear;
    }

    private void computeTotalDays() {
        totalDays = ChronoUnit.DAYS.between(dateFrom, dateTo.plusDays(1));
    }

    private void computeTotalDaysPerYear() {
        totalDaysPerYear = new TreeMap<>();
        for (int i = 0; i <= (dateTo.getYear() - dateFrom.getYear()); i++) {
            int year = dateFrom.getYear() + i;
            LocalDate from = LocalDate.of(year, 1, 1);
            LocalDate to = LocalDate.of(year, 12, 31);

            if (year == dateFrom.getYear())
                from = dateFrom;
            if (year == dateTo.getYear())
                to = dateTo;

            totalDaysPerYear.put(year, ChronoUnit.DAYS.between(from, to.plusDays(1)));
        }
    }
}
