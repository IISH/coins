package org.iish.coins.util;

import com.google.gson.annotations.SerializedName;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;

/**
 * Obtains values from objects by their serialized names.
 *
 * @param <T> The type of object to obtain values from.
 */
public class Getter<T> {
    private Map<String, Field> fields;

    /**
     * Sets up the getter for objects of the given class.
     *
     * @param type The class.
     */
    public Getter(Class<T> type) {
        fields = new HashMap<>();
        for (Field field : type.getDeclaredFields()) {
            SerializedName serializedName = field.getAnnotation(SerializedName.class);
            if (serializedName != null) {
                field.setAccessible(true);
                fields.put(serializedName.value(), field);
            }
        }
    }

    /**
     * Determines whether there the object contains a field with the given serialized name.
     *
     * @param name The serialized name.
     * @return True if found.
     */
    public boolean hasName(String name) {
        return fields.containsKey(name);
    }

    /**
     * Returns the type of the field with the given serialized name.
     *
     * @param name The serialized name.
     * @return The class.
     */
    public Class<?> getType(String name) {
        if (fields.containsKey(name))
            return fields.get(name).getType();
        return null;
    }

    /**
     * Returns the value of the field with the given serialized name from the given object.
     *
     * @param name The serialized name.
     * @param obj  The object to obtain the value from.
     * @return The value mapped to the serialized name for the given object.
     */
    public Object getValue(String name, T obj) {
        try {
            if ((obj != null) && fields.containsKey(name))
                return fields.get(name).get(obj);
            return null;
        }
        catch (IllegalAccessException iae) {
            return null;
        }
    }
}
