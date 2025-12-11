/**
 * @description Schema service for Flow Map CPE - provides object and field metadata
 * @author Flow Map Component
 */
public with sharing class FlowMapSchemaService {
    
    /**
     * @description Get all queryable objects in the org
     * @return List of object options with label and value
     */
    @AuraEnabled(cacheable=true)
    public static List<ObjectOption> getQueryableObjects() {
        List<ObjectOption> objects = new List<ObjectOption>();
        
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        
        for (String objectName : globalDescribe.keySet()) {
            Schema.DescribeSObjectResult describe = globalDescribe.get(objectName).getDescribe();
            
            // Only include queryable, accessible objects
            if (describe.isQueryable() && describe.isAccessible() && !describe.isDeprecatedAndHidden()) {
                // Skip certain system objects
                if (!objectName.endsWith('__History') && 
                    !objectName.endsWith('__Feed') && 
                    !objectName.endsWith('__Share') &&
                    !objectName.endsWith('__Tag') &&
                    !objectName.endsWith('__ChangeEvent')) {
                    
                    objects.add(new ObjectOption(
                        describe.getLabel(),
                        describe.getName(),
                        describe.isCustom()
                    ));
                }
            }
        }
        
        // Sort by label
        objects.sort();
        
        return objects;
    }
    
    /**
     * @description Get fields for a specific object
     * @param objectApiName The API name of the object
     * @return List of field options with metadata
     */
    @AuraEnabled(cacheable=true)
    public static List<FieldOption> getObjectFields(String objectApiName) {
        List<FieldOption> fields = new List<FieldOption>();
        
        if (String.isBlank(objectApiName)) {
            return fields;
        }
        
        try {
            Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectApiName);
            if (objectType == null) {
                return fields;
            }
            
            Map<String, Schema.SObjectField> fieldMap = objectType.getDescribe().fields.getMap();
            
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                
                if (fieldDescribe.isAccessible()) {
                    String fieldType = String.valueOf(fieldDescribe.getType());
                    String iconName = getFieldIcon(fieldType);
                    
                    fields.add(new FieldOption(
                        fieldDescribe.getLabel(),
                        fieldDescribe.getName(),
                        fieldType,
                        iconName,
                        fieldDescribe.isCustom()
                    ));
                }
            }
            
            // Sort by label
            fields.sort();
            
        } catch (Exception e) {
            System.debug('Error getting fields: ' + e.getMessage());
        }
        
        return fields;
    }
    
    /**
     * @description Get fields suitable for specific mapping types
     * @param objectApiName The API name of the object
     * @param fieldCategory Category: 'text', 'location', 'address', 'all'
     * @return List of field options filtered by category
     */
    @AuraEnabled(cacheable=true)
    public static List<FieldOption> getFieldsByCategory(String objectApiName, String fieldCategory) {
        List<FieldOption> allFields = getObjectFields(objectApiName);
        
        if (fieldCategory == 'all') {
            return allFields;
        }
        
        List<FieldOption> filteredFields = new List<FieldOption>();
        
        for (FieldOption field : allFields) {
            Boolean include = false;
            
            if (fieldCategory == 'text') {
                // Text fields for title, description
                include = field.fieldType == 'STRING' || 
                          field.fieldType == 'TEXTAREA' || 
                          field.fieldType == 'PICKLIST' ||
                          field.fieldType == 'REFERENCE' ||
                          field.fieldType == 'ID';
            } else if (fieldCategory == 'location') {
                // Numeric fields for lat/lng
                include = field.fieldType == 'DOUBLE' || 
                          field.fieldType == 'DECIMAL' ||
                          field.fieldType == 'CURRENCY' ||
                          field.fieldType == 'PERCENT' ||
                          field.fieldType == 'INTEGER' ||
                          field.fieldType == 'LONG';
            } else if (fieldCategory == 'address') {
                // Address or text fields
                include = field.fieldType == 'ADDRESS' || 
                          field.fieldType == 'STRING' || 
                          field.fieldType == 'TEXTAREA';
            }
            
            if (include) {
                filteredFields.add(field);
            }
        }
        
        return filteredFields;
    }
    
    /**
     * @description Get sample records for map preview
     * @param objectApiName The object to query
     * @param fieldMappingsJson JSON string of field mappings
     * @param filterClause Optional WHERE clause
     * @param recordLimit Max records to return
     * @return List of marker data for preview
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getPreviewData(
        String objectApiName,
        String fieldMappingsJson,
        String filterClause,
        Integer recordLimit
    ) {
        // Reuse existing getMapData method from FlowMapController
        return FlowMapController.getMapData(objectApiName, fieldMappingsJson, filterClause, recordLimit != null ? recordLimit : 5);
    }
    
    /**
     * @description Get icon name based on field type
     */
    private static String getFieldIcon(String fieldType) {
        Map<String, String> iconMap = new Map<String, String>{
            'STRING' => 'utility:text',
            'TEXTAREA' => 'utility:textarea',
            'BOOLEAN' => 'utility:check',
            'INTEGER' => 'utility:number_input',
            'DOUBLE' => 'utility:number_input',
            'DECIMAL' => 'utility:number_input',
            'CURRENCY' => 'utility:moneybag',
            'PERCENT' => 'utility:percent',
            'DATE' => 'utility:date_input',
            'DATETIME' => 'utility:date_time',
            'TIME' => 'utility:clock',
            'PHONE' => 'utility:call',
            'EMAIL' => 'utility:email',
            'URL' => 'utility:link',
            'PICKLIST' => 'utility:picklist_type',
            'MULTIPICKLIST' => 'utility:multi_picklist',
            'REFERENCE' => 'utility:record_lookup',
            'ID' => 'utility:record',
            'ADDRESS' => 'utility:location',
            'LOCATION' => 'utility:location',
            'LONG' => 'utility:number_input',
            'BASE64' => 'utility:file',
            'ENCRYPTEDSTRING' => 'utility:lock'
        };
        
        return iconMap.containsKey(fieldType) ? iconMap.get(fieldType) : 'utility:text';
    }
    
    /**
     * @description Wrapper class for object options
     */
    public class ObjectOption implements Comparable {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        @AuraEnabled public Boolean isCustom;
        
        public ObjectOption(String label, String value, Boolean isCustom) {
            this.label = label;
            this.value = value;
            this.isCustom = isCustom;
        }
        
        public Integer compareTo(Object other) {
            ObjectOption otherOption = (ObjectOption) other;
            return this.label.compareTo(otherOption.label);
        }
    }
    
    /**
     * @description Wrapper class for field options
     */
    public class FieldOption implements Comparable {
        @AuraEnabled public String label;
        @AuraEnabled public String value;
        @AuraEnabled public String fieldType;
        @AuraEnabled public String iconName;
        @AuraEnabled public Boolean isCustom;
        
        public FieldOption(String label, String value, String fieldType, String iconName, Boolean isCustom) {
            this.label = label;
            this.value = value;
            this.fieldType = fieldType;
            this.iconName = iconName;
            this.isCustom = isCustom;
        }
        
        public Integer compareTo(Object other) {
            FieldOption otherOption = (FieldOption) other;
            return this.label.compareTo(otherOption.label);
        }
    }
}
