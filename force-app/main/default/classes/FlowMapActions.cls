/**
 * @description Invocable Action for geocoding addresses and map-related operations in Flow
 * @author Flow Map Component
 */
public with sharing class FlowMapActions {
    
    /**
     * @description Request wrapper for geocoding
     */
    public class GeocodeRequest {
        @InvocableVariable(label='Street Address' required=false)
        public String street;
        
        @InvocableVariable(label='City' required=false)
        public String city;
        
        @InvocableVariable(label='State/Province' required=false)
        public String state;
        
        @InvocableVariable(label='Postal Code' required=false)
        public String postalCode;
        
        @InvocableVariable(label='Country' required=false)
        public String country;
        
        @InvocableVariable(label='Full Address' required=false description='Complete address as a single string')
        public String fullAddress;
    }
    
    /**
     * @description Response wrapper for geocoding
     */
    public class GeocodeResponse {
        @InvocableVariable(label='Latitude')
        public Decimal latitude;
        
        @InvocableVariable(label='Longitude')
        public Decimal longitude;
        
        @InvocableVariable(label='Formatted Address')
        public String formattedAddress;
        
        @InvocableVariable(label='Success')
        public Boolean success;
        
        @InvocableVariable(label='Error Message')
        public String errorMessage;
    }
    
    /**
     * @description Request wrapper for calculating distance
     */
    public class DistanceRequest {
        @InvocableVariable(label='Origin Latitude' required=true)
        public Decimal originLatitude;
        
        @InvocableVariable(label='Origin Longitude' required=true)
        public Decimal originLongitude;
        
        @InvocableVariable(label='Destination Latitude' required=true)
        public Decimal destinationLatitude;
        
        @InvocableVariable(label='Destination Longitude' required=true)
        public Decimal destinationLongitude;
        
        @InvocableVariable(label='Unit' required=false description='miles or kilometers (default: miles)')
        public String unit;
    }
    
    /**
     * @description Response wrapper for distance calculation
     */
    public class DistanceResponse {
        @InvocableVariable(label='Distance')
        public Decimal distance;
        
        @InvocableVariable(label='Unit')
        public String unit;
        
        @InvocableVariable(label='Success')
        public Boolean success;
        
        @InvocableVariable(label='Error Message')
        public String errorMessage;
    }
    
    /**
     * @description Request wrapper for finding nearby records
     */
    public class NearbyRecordsRequest {
        @InvocableVariable(label='Object API Name' required=true)
        public String objectApiName;
        
        @InvocableVariable(label='Latitude Field' required=true)
        public String latitudeField;
        
        @InvocableVariable(label='Longitude Field' required=true)
        public String longitudeField;
        
        @InvocableVariable(label='Center Latitude' required=true)
        public Decimal centerLatitude;
        
        @InvocableVariable(label='Center Longitude' required=true)
        public Decimal centerLongitude;
        
        @InvocableVariable(label='Radius (miles)' required=true)
        public Decimal radiusMiles;
        
        @InvocableVariable(label='Record Limit' required=false)
        public Integer recordLimit;
        
        @InvocableVariable(label='Additional Filter' required=false description='WHERE clause without WHERE keyword')
        public String additionalFilter;
    }
    
    /**
     * @description Response wrapper for nearby records
     */
    public class NearbyRecordsResponse {
        @InvocableVariable(label='Record IDs')
        public List<String> recordIds;
        
        @InvocableVariable(label='Record Count')
        public Integer recordCount;
        
        @InvocableVariable(label='Success')
        public Boolean success;
        
        @InvocableVariable(label='Error Message')
        public String errorMessage;
    }
    
    /**
     * @description Calculate the distance between two geographic points
     * @param requests List of distance calculation requests
     * @return List of distance responses
     */
    @InvocableMethod(
        label='Calculate Distance Between Points'
        description='Calculate the distance between two latitude/longitude coordinates'
        category='Flow Map'
    )
    public static List<DistanceResponse> calculateDistance(List<DistanceRequest> requests) {
        List<DistanceResponse> responses = new List<DistanceResponse>();
        
        for (DistanceRequest req : requests) {
            DistanceResponse resp = new DistanceResponse();
            
            try {
                if (req.originLatitude == null || req.originLongitude == null ||
                    req.destinationLatitude == null || req.destinationLongitude == null) {
                    throw new FlowMapException('All coordinates are required');
                }
                
                String unit = String.isNotBlank(req.unit) ? req.unit.toLowerCase() : 'miles';
                
                // Haversine formula
                Double earthRadiusMiles = 3958.8;
                Double earthRadiusKm = 6371.0;
                Double radius = unit == 'kilometers' ? earthRadiusKm : earthRadiusMiles;
                
                Double lat1Rad = Math.toRadians((Double) req.originLatitude);
                Double lat2Rad = Math.toRadians((Double) req.destinationLatitude);
                Double deltaLatRad = Math.toRadians((Double) (req.destinationLatitude - req.originLatitude));
                Double deltaLonRad = Math.toRadians((Double) (req.destinationLongitude - req.originLongitude));
                
                Double a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                           Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                           Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
                Double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                
                resp.distance = (Decimal) (radius * c);
                resp.unit = unit;
                resp.success = true;
                
            } catch (Exception e) {
                resp.success = false;
                resp.errorMessage = e.getMessage();
            }
            
            responses.add(resp);
        }
        
        return responses;
    }
    
    /**
     * @description Find records within a radius of a center point
     * @param requests List of nearby records requests
     * @return List of nearby records responses
     */
    public static List<NearbyRecordsResponse> findNearbyRecords(List<NearbyRecordsRequest> requests) {
        List<NearbyRecordsResponse> responses = new List<NearbyRecordsResponse>();
        
        for (NearbyRecordsRequest req : requests) {
            NearbyRecordsResponse resp = new NearbyRecordsResponse();
            resp.recordIds = new List<String>();
            
            try {
                // Build SOQL query
                String query = 'SELECT Id, ' + 
                    String.escapeSingleQuotes(req.latitudeField) + ', ' +
                    String.escapeSingleQuotes(req.longitudeField) +
                    ' FROM ' + String.escapeSingleQuotes(req.objectApiName);
                
                // Add filter for non-null coordinates
                query += ' WHERE ' + req.latitudeField + ' != null AND ' + req.longitudeField + ' != null';
                
                // Add additional filter if provided
                if (String.isNotBlank(req.additionalFilter)) {
                    query += ' AND (' + req.additionalFilter + ')';
                }
                
                // Add limit
                Integer limit_val = req.recordLimit != null && req.recordLimit > 0 ? req.recordLimit : 200;
                query += ' LIMIT ' + limit_val;
                
                // Execute query
                List<SObject> records = Database.query(query);
                
                // Filter by distance
                for (SObject record : records) {
                    Decimal lat = (Decimal) record.get(req.latitudeField);
                    Decimal lng = (Decimal) record.get(req.longitudeField);
                    
                    if (lat != null && lng != null) {
                        Decimal distance = calculateDistanceInternal(
                            req.centerLatitude, req.centerLongitude,
                            lat, lng
                        );
                        
                        if (distance <= req.radiusMiles) {
                            resp.recordIds.add((String) record.get('Id'));
                        }
                    }
                }
                
                resp.recordCount = resp.recordIds.size();
                resp.success = true;
                
            } catch (Exception e) {
                resp.success = false;
                resp.errorMessage = e.getMessage();
            }
            
            responses.add(resp);
        }
        
        return responses;
    }
    
    /**
     * @description Internal method to calculate distance between two points
     */
    private static Decimal calculateDistanceInternal(
        Decimal lat1, Decimal lon1,
        Decimal lat2, Decimal lon2
    ) {
        Double earthRadiusMiles = 3958.8;
        
        Double lat1Rad = Math.toRadians((Double) lat1);
        Double lat2Rad = Math.toRadians((Double) lat2);
        Double deltaLatRad = Math.toRadians((Double) (lat2 - lat1));
        Double deltaLonRad = Math.toRadians((Double) (lon2 - lon1));
        
        Double a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
        Double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return (Decimal) (earthRadiusMiles * c);
    }
    
    /**
     * @description Custom exception for Flow Map operations
     */
    public class FlowMapException extends Exception {}
}
