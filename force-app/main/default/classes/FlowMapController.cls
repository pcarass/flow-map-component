/**
 * @description Controller for the Flow Map component providing data retrieval and Content Document operations
 * @author Flow Map Component
 */
public with sharing class FlowMapController {
    
    /**
     * @description Retrieves map marker data from a Salesforce object with configurable field mappings
     * @param objectApiName The API name of the object to query
     * @param fieldMappingsJson JSON string containing field mappings
     * @param filterClause Optional WHERE clause (without WHERE keyword)
     * @param recordLimit Maximum number of records to return
     * @return List of Maps containing marker data
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getMapData(
        String objectApiName,
        String fieldMappingsJson,
        String filterClause,
        Integer recordLimit
    ) {
        List<Map<String, Object>> results = new List<Map<String, Object>>();
        
        if (String.isBlank(objectApiName)) {
            return results;
        }
        
        try {
            // Parse field mappings
            Map<String, Object> fieldMappings = (Map<String, Object>) JSON.deserializeUntyped(fieldMappingsJson);
            
            // Build field list
            Set<String> fieldsToQuery = new Set<String>();
            fieldsToQuery.add('Id');
            
            for (String mappingKey : fieldMappings.keySet()) {
                String fieldName = (String) fieldMappings.get(mappingKey);
                if (String.isNotBlank(fieldName)) {
                    fieldsToQuery.add(fieldName);
                }
            }
            
            // Build query
            String query = 'SELECT ' + String.join(new List<String>(fieldsToQuery), ', ');
            query += ' FROM ' + String.escapeSingleQuotes(objectApiName);
            
            if (String.isNotBlank(filterClause)) {
                query += ' WHERE ' + filterClause;
            }
            
            if (recordLimit != null && recordLimit > 0) {
                query += ' LIMIT ' + recordLimit;
            } else {
                query += ' LIMIT 100';
            }
            
            // Execute query
            List<SObject> records = Database.query(query);
            
            // Transform results
            for (SObject record : records) {
                Map<String, Object> markerData = new Map<String, Object>();
                markerData.put('id', record.Id);
                
                // Map fields
                String titleField = (String) fieldMappings.get('titleField');
                if (String.isNotBlank(titleField)) {
                    markerData.put('title', getFieldValue(record, titleField));
                }
                
                String descriptionField = (String) fieldMappings.get('descriptionField');
                if (String.isNotBlank(descriptionField)) {
                    markerData.put('description', getFieldValue(record, descriptionField));
                }
                
                String latitudeField = (String) fieldMappings.get('latitudeField');
                if (String.isNotBlank(latitudeField)) {
                    markerData.put('latitude', getFieldValue(record, latitudeField));
                }
                
                String longitudeField = (String) fieldMappings.get('longitudeField');
                if (String.isNotBlank(longitudeField)) {
                    markerData.put('longitude', getFieldValue(record, longitudeField));
                }
                
                String addressField = (String) fieldMappings.get('addressField');
                if (String.isNotBlank(addressField)) {
                    markerData.put('address', getFieldValue(record, addressField));
                }
                
                String cityField = (String) fieldMappings.get('cityField');
                if (String.isNotBlank(cityField)) {
                    markerData.put('city', getFieldValue(record, cityField));
                }
                
                String stateField = (String) fieldMappings.get('stateField');
                if (String.isNotBlank(stateField)) {
                    markerData.put('state', getFieldValue(record, stateField));
                }
                
                String postalCodeField = (String) fieldMappings.get('postalCodeField');
                if (String.isNotBlank(postalCodeField)) {
                    markerData.put('postalCode', getFieldValue(record, postalCodeField));
                }
                

                String streetField = (String) fieldMappings.get('streetField');
                if (String.isNotBlank(streetField)) {
                    markerData.put('street', getFieldValue(record, streetField));
                }
                String countryField = (String) fieldMappings.get('countryField');
                if (String.isNotBlank(countryField)) {
                    markerData.put('country', getFieldValue(record, countryField));
                }
                
                String customIconField = (String) fieldMappings.get('customIconField');
                if (String.isNotBlank(customIconField)) {
                    markerData.put('customIcon', getFieldValue(record, customIconField));
                }
                
                // Add raw record data
                Map<String, Object> rawData = new Map<String, Object>();
                for (String fieldName : fieldsToQuery) {
                    rawData.put(fieldName, getFieldValue(record, fieldName));
                }
                markerData.put('rawData', rawData);
                
                results.add(markerData);
            }
            
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving map data: ' + e.getMessage());
        }
        
        return results;
    }
    
    /**
     * @description Saves drawing GeoJSON as a Content Document
     * @param linkedEntityId The record ID to link the document to
     * @param geoJsonContent The GeoJSON content to save
     * @param title The document title
     * @param existingDocumentId Optional existing document ID to update
     * @return The Content Document ID
     */
    @AuraEnabled
    public static String saveDrawingDocument(
        String linkedEntityId,
        String geoJsonContent,
        String title,
        String existingDocumentId
    ) {
        try {
            ContentVersion cv = new ContentVersion();
            cv.Title = String.isNotBlank(title) ? title : 'Flow Map Drawing';
            cv.PathOnClient = cv.Title + '.geojson';
            cv.VersionData = Blob.valueOf(geoJsonContent);
            cv.Origin = 'C'; // Content origin
            
            if (String.isNotBlank(existingDocumentId)) {
                // Update existing document
                cv.ContentDocumentId = existingDocumentId;
            }
            
            insert cv;
            
            // Get the Content Document ID
            ContentVersion insertedCv = [
                SELECT ContentDocumentId 
                FROM ContentVersion 
                WHERE Id = :cv.Id
            ];
            
            // Link to the entity if provided and this is a new document
            if (String.isNotBlank(linkedEntityId) && String.isBlank(existingDocumentId)) {
                ContentDocumentLink cdl = new ContentDocumentLink();
                cdl.ContentDocumentId = insertedCv.ContentDocumentId;
                cdl.LinkedEntityId = linkedEntityId;
                cdl.ShareType = 'V'; // Viewer permission
                cdl.Visibility = 'AllUsers';
                insert cdl;
            }
            
            return insertedCv.ContentDocumentId;
            
        } catch (Exception e) {
            throw new AuraHandledException('Error saving drawing document: ' + e.getMessage());
        }
    }
    
    /**
     * @description Retrieves the content of a GeoJSON Content Document
     * @param contentDocumentId The Content Document ID
     * @return The GeoJSON content as a string
     */
    @AuraEnabled(cacheable=true)
    public static String getDrawingDocument(String contentDocumentId) {
        if (String.isBlank(contentDocumentId)) {
            return null;
        }
        
        try {
            ContentVersion cv = [
                SELECT VersionData
                FROM ContentVersion
                WHERE ContentDocumentId = :contentDocumentId
                AND IsLatest = true
                LIMIT 1
            ];
            
            return cv.VersionData.toString();
            
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving drawing document: ' + e.getMessage());
        }
    }
    
    /**
     * @description Gets the value of a field from an SObject, supporting relationship fields
     * @param record The SObject record
     * @param fieldPath The field API name (supports dot notation for relationships)
     * @return The field value
     */
    private static Object getFieldValue(SObject record, String fieldPath) {
        if (record == null || String.isBlank(fieldPath)) {
            return null;
        }
        
        try {
            // Handle relationship fields (e.g., Account.Name)
            if (fieldPath.contains('.')) {
                List<String> parts = fieldPath.split('\\.');
                SObject currentRecord = record;
                
                for (Integer i = 0; i < parts.size() - 1; i++) {
                    currentRecord = currentRecord.getSObject(parts[i]);
                    if (currentRecord == null) {
                        return null;
                    }
                }
                
                return currentRecord.get(parts[parts.size() - 1]);
            }
            
            return record.get(fieldPath);
            
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * @description Gets picklist values for a filter field
     * @param objectApiName The object API name
     * @param fieldApiName The field API name
     * @return List of picklist options
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getPicklistValues(String objectApiName, String fieldApiName) {
        List<Map<String, String>> options = new List<Map<String, String>>();
        
        try {
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectApiName);
            if (sObjectType == null) {
                return options;
            }
            
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
            Schema.SObjectField field = describeResult.fields.getMap().get(fieldApiName);
            
            if (field == null) {
                return options;
            }
            
            Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
            List<Schema.PicklistEntry> picklistEntries = fieldDescribe.getPicklistValues();
            
            for (Schema.PicklistEntry entry : picklistEntries) {
                if (entry.isActive()) {
                    options.add(new Map<String, String>{
                        'label' => entry.getLabel(),
                        'value' => entry.getValue()
                    });
                }
            }
            
        } catch (Exception e) {
            // Return empty list on error
        }
        
        return options;
    }
    
    /**
     * @description Geocodes an address using external service (placeholder for implementation)
     * @param street The street address
     * @param city The city
     * @param state The state/province
     * @param postalCode The postal code
     * @param country The country
     * @return Map containing latitude and longitude
     */
    @AuraEnabled
    public static Map<String, Decimal> geocodeAddress(
        String street,
        String city,
        String state,
        String postalCode,
        String country
    ) {
        // Placeholder for geocoding implementation
        // In production, this would call an external geocoding service
        // like Google Geocoding API or Salesforce Maps API
        
        Map<String, Decimal> result = new Map<String, Decimal>();
        
        // For now, return null to indicate geocoding is not implemented
        // The component should handle addresses directly via lightning-map for Google Maps
        
        return result;
    }
    
    /**
     * @description Gets a list of queryable SObjects for the CPE object picker
     * @return List of Maps containing label and apiName for each object
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getSObjects() {
        List<Map<String, String>> objects = new List<Map<String, String>>();
        
        // Get commonly used objects that typically have location data
        List<String> commonObjects = new List<String>{
            'Account', 'Contact', 'Lead', 'Opportunity', 'Case', 
            'Asset', 'Order', 'ServiceAppointment', 'WorkOrder',
            'User', 'Location'
        };
        
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        
        // First add common objects that exist
        for (String objName : commonObjects) {
            if (globalDescribe.containsKey(objName)) {
                Schema.DescribeSObjectResult describeResult = globalDescribe.get(objName).getDescribe();
                if (describeResult.isQueryable() && describeResult.isAccessible()) {
                    objects.add(new Map<String, String>{
                        'label' => describeResult.getLabel(),
                        'apiName' => describeResult.getName()
                    });
                }
            }
        }
        
        // Then add custom objects
        for (String objName : globalDescribe.keySet()) {
            if (objName.endsWith('__c')) {
                Schema.DescribeSObjectResult describeResult = globalDescribe.get(objName).getDescribe();
                if (describeResult.isQueryable() && describeResult.isAccessible() && describeResult.isCreateable()) {
                    objects.add(new Map<String, String>{
                        'label' => describeResult.getLabel(),
                        'apiName' => describeResult.getName()
                    });
                }
            }
        }
        
        // Sort by label
        objects.sort();
        
        return objects;
    }
    
    /**
     * @description Gets the fields for a specific SObject for the CPE field picker
     * @param objectApiName The API name of the object
     * @return List of Maps containing label and apiName for each field
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getObjectFields(String objectApiName) {
        List<Map<String, String>> fields = new List<Map<String, String>>();
        
        if (String.isBlank(objectApiName)) {
            return fields;
        }
        
        try {
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectApiName);
            if (sObjectType == null) {
                return fields;
            }
            
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
            Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
            
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                
                // Only include accessible fields
                if (fieldDescribe.isAccessible()) {
                    fields.add(new Map<String, String>{
                        'label' => fieldDescribe.getLabel(),
                        'apiName' => fieldDescribe.getName()
                    });
                }
            }
            
            // Sort by label
            fields.sort();
            
        } catch (Exception e) {
            // Return empty list on error
        }
        
        return fields;
    }
}
