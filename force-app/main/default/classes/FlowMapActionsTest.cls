/**
 * @description Test class for FlowMapActions
 */
@IsTest
private class FlowMapActionsTest {
    
    @TestSetup
    static void setupTestData() {
        // Create test accounts with coordinates
        List<Account> accounts = new List<Account>();
        
        // San Francisco
        accounts.add(new Account(
            Name = 'SF Account',
            BillingLatitude = 37.7749,
            BillingLongitude = -122.4194
        ));
        
        // Los Angeles (roughly 350 miles from SF)
        accounts.add(new Account(
            Name = 'LA Account',
            BillingLatitude = 34.0522,
            BillingLongitude = -118.2437
        ));
        
        // Oakland (close to SF)
        accounts.add(new Account(
            Name = 'Oakland Account',
            BillingLatitude = 37.8044,
            BillingLongitude = -122.2712
        ));
        
        insert accounts;
    }
    
    @IsTest
    static void testCalculateDistance_Miles() {
        FlowMapActions.DistanceRequest req = new FlowMapActions.DistanceRequest();
        req.originLatitude = 37.7749; // San Francisco
        req.originLongitude = -122.4194;
        req.destinationLatitude = 34.0522; // Los Angeles
        req.destinationLongitude = -118.2437;
        req.unit = 'miles';
        
        Test.startTest();
        List<FlowMapActions.DistanceResponse> responses = 
            FlowMapActions.calculateDistance(new List<FlowMapActions.DistanceRequest>{ req });
        Test.stopTest();
        
        System.assertEquals(1, responses.size(), 'Should return one response');
        FlowMapActions.DistanceResponse resp = responses[0];
        
        System.assertEquals(true, resp.success, 'Should be successful');
        System.assertEquals('miles', resp.unit, 'Unit should be miles');
        
        // Distance from SF to LA is roughly 350 miles
        System.assert(resp.distance > 300, 'Distance should be greater than 300 miles');
        System.assert(resp.distance < 400, 'Distance should be less than 400 miles');
    }
    
    @IsTest
    static void testCalculateDistance_Kilometers() {
        FlowMapActions.DistanceRequest req = new FlowMapActions.DistanceRequest();
        req.originLatitude = 37.7749;
        req.originLongitude = -122.4194;
        req.destinationLatitude = 34.0522;
        req.destinationLongitude = -118.2437;
        req.unit = 'kilometers';
        
        Test.startTest();
        List<FlowMapActions.DistanceResponse> responses = 
            FlowMapActions.calculateDistance(new List<FlowMapActions.DistanceRequest>{ req });
        Test.stopTest();
        
        FlowMapActions.DistanceResponse resp = responses[0];
        
        System.assertEquals(true, resp.success, 'Should be successful');
        System.assertEquals('kilometers', resp.unit, 'Unit should be kilometers');
        
        // Distance should be roughly 560 km
        System.assert(resp.distance > 500, 'Distance should be greater than 500 km');
        System.assert(resp.distance < 650, 'Distance should be less than 650 km');
    }
    
    @IsTest
    static void testCalculateDistance_DefaultUnit() {
        FlowMapActions.DistanceRequest req = new FlowMapActions.DistanceRequest();
        req.originLatitude = 37.7749;
        req.originLongitude = -122.4194;
        req.destinationLatitude = 37.8044; // Oakland
        req.destinationLongitude = -122.2712;
        // No unit specified - should default to miles
        
        Test.startTest();
        List<FlowMapActions.DistanceResponse> responses = 
            FlowMapActions.calculateDistance(new List<FlowMapActions.DistanceRequest>{ req });
        Test.stopTest();
        
        FlowMapActions.DistanceResponse resp = responses[0];
        
        System.assertEquals(true, resp.success, 'Should be successful');
        System.assertEquals('miles', resp.unit, 'Unit should default to miles');
        
        // SF to Oakland is roughly 10-12 miles
        System.assert(resp.distance < 20, 'Distance should be less than 20 miles');
    }
    
    @IsTest
    static void testCalculateDistance_MissingCoordinates() {
        FlowMapActions.DistanceRequest req = new FlowMapActions.DistanceRequest();
        req.originLatitude = 37.7749;
        // Missing other coordinates
        
        Test.startTest();
        List<FlowMapActions.DistanceResponse> responses = 
            FlowMapActions.calculateDistance(new List<FlowMapActions.DistanceRequest>{ req });
        Test.stopTest();
        
        FlowMapActions.DistanceResponse resp = responses[0];
        
        System.assertEquals(false, resp.success, 'Should not be successful');
        System.assert(resp.errorMessage.contains('required'), 'Error message should mention required');
    }
    
    @IsTest
    static void testCalculateDistance_SamePoint() {
        FlowMapActions.DistanceRequest req = new FlowMapActions.DistanceRequest();
        req.originLatitude = 37.7749;
        req.originLongitude = -122.4194;
        req.destinationLatitude = 37.7749;
        req.destinationLongitude = -122.4194;
        
        Test.startTest();
        List<FlowMapActions.DistanceResponse> responses = 
            FlowMapActions.calculateDistance(new List<FlowMapActions.DistanceRequest>{ req });
        Test.stopTest();
        
        FlowMapActions.DistanceResponse resp = responses[0];
        
        System.assertEquals(true, resp.success, 'Should be successful');
        System.assert(resp.distance < 0.01, 'Distance should be essentially zero');
    }
    
    @IsTest
    static void testCalculateDistance_MultipleRequests() {
        List<FlowMapActions.DistanceRequest> requests = new List<FlowMapActions.DistanceRequest>();
        
        FlowMapActions.DistanceRequest req1 = new FlowMapActions.DistanceRequest();
        req1.originLatitude = 37.7749;
        req1.originLongitude = -122.4194;
        req1.destinationLatitude = 34.0522;
        req1.destinationLongitude = -118.2437;
        requests.add(req1);
        
        FlowMapActions.DistanceRequest req2 = new FlowMapActions.DistanceRequest();
        req2.originLatitude = 40.7128;
        req2.originLongitude = -74.0060;
        req2.destinationLatitude = 34.0522;
        req2.destinationLongitude = -118.2437;
        requests.add(req2);
        
        Test.startTest();
        List<FlowMapActions.DistanceResponse> responses = FlowMapActions.calculateDistance(requests);
        Test.stopTest();
        
        System.assertEquals(2, responses.size(), 'Should return two responses');
        System.assertEquals(true, responses[0].success, 'First should be successful');
        System.assertEquals(true, responses[1].success, 'Second should be successful');
    }
    
    @IsTest
    static void testFindNearbyRecords_WithinRadius() {
        FlowMapActions.NearbyRecordsRequest req = new FlowMapActions.NearbyRecordsRequest();
        req.objectApiName = 'Account';
        req.latitudeField = 'BillingLatitude';
        req.longitudeField = 'BillingLongitude';
        req.centerLatitude = 37.7749; // San Francisco
        req.centerLongitude = -122.4194;
        req.radiusMiles = 50; // 50 mile radius should include Oakland
        
        Test.startTest();
        List<FlowMapActions.NearbyRecordsResponse> responses = 
            FlowMapActions.findNearbyRecords(new List<FlowMapActions.NearbyRecordsRequest>{ req });
        Test.stopTest();
        
        FlowMapActions.NearbyRecordsResponse resp = responses[0];
        
        System.assertEquals(true, resp.success, 'Should be successful');
        System.assert(resp.recordCount >= 2, 'Should find at least SF and Oakland accounts');
    }
    
    @IsTest
    static void testFindNearbyRecords_SmallRadius() {
        FlowMapActions.NearbyRecordsRequest req = new FlowMapActions.NearbyRecordsRequest();
        req.objectApiName = 'Account';
        req.latitudeField = 'BillingLatitude';
        req.longitudeField = 'BillingLongitude';
        req.centerLatitude = 37.7749;
        req.centerLongitude = -122.4194;
        req.radiusMiles = 1; // Very small radius - only SF account
        
        Test.startTest();
        List<FlowMapActions.NearbyRecordsResponse> responses = 
            FlowMapActions.findNearbyRecords(new List<FlowMapActions.NearbyRecordsRequest>{ req });
        Test.stopTest();
        
        FlowMapActions.NearbyRecordsResponse resp = responses[0];
        
        System.assertEquals(true, resp.success, 'Should be successful');
        System.assertEquals(1, resp.recordCount, 'Should find only SF account');
    }
    
    @IsTest
    static void testFindNearbyRecords_WithLimit() {
        FlowMapActions.NearbyRecordsRequest req = new FlowMapActions.NearbyRecordsRequest();
        req.objectApiName = 'Account';
        req.latitudeField = 'BillingLatitude';
        req.longitudeField = 'BillingLongitude';
        req.centerLatitude = 37.7749;
        req.centerLongitude = -122.4194;
        req.radiusMiles = 500; // Large radius
        req.recordLimit = 2;
        
        Test.startTest();
        List<FlowMapActions.NearbyRecordsResponse> responses = 
            FlowMapActions.findNearbyRecords(new List<FlowMapActions.NearbyRecordsRequest>{ req });
        Test.stopTest();
        
        FlowMapActions.NearbyRecordsResponse resp = responses[0];
        
        System.assertEquals(true, resp.success, 'Should be successful');
        System.assert(resp.recordCount <= 2, 'Should respect limit');
    }
    
    @IsTest
    static void testFindNearbyRecords_WithFilter() {
        FlowMapActions.NearbyRecordsRequest req = new FlowMapActions.NearbyRecordsRequest();
        req.objectApiName = 'Account';
        req.latitudeField = 'BillingLatitude';
        req.longitudeField = 'BillingLongitude';
        req.centerLatitude = 37.7749;
        req.centerLongitude = -122.4194;
        req.radiusMiles = 500;
        req.additionalFilter = 'Name LIKE \'%SF%\'';
        
        Test.startTest();
        List<FlowMapActions.NearbyRecordsResponse> responses = 
            FlowMapActions.findNearbyRecords(new List<FlowMapActions.NearbyRecordsRequest>{ req });
        Test.stopTest();
        
        FlowMapActions.NearbyRecordsResponse resp = responses[0];
        
        System.assertEquals(true, resp.success, 'Should be successful');
        System.assertEquals(1, resp.recordCount, 'Should find only SF account');
    }
    
    @IsTest
    static void testGeocodeRequest_Coverage() {
        // Just for code coverage - constructor testing
        FlowMapActions.GeocodeRequest req = new FlowMapActions.GeocodeRequest();
        req.street = '1 Market St';
        req.city = 'San Francisco';
        req.state = 'CA';
        req.postalCode = '94105';
        req.country = 'USA';
        req.fullAddress = '1 Market St, San Francisco, CA 94105';
        
        System.assertNotEquals(null, req.street);
    }
    
    @IsTest
    static void testGeocodeResponse_Coverage() {
        // Just for code coverage - constructor testing
        FlowMapActions.GeocodeResponse resp = new FlowMapActions.GeocodeResponse();
        resp.latitude = 37.7749;
        resp.longitude = -122.4194;
        resp.formattedAddress = '1 Market St, San Francisco, CA 94105';
        resp.success = true;
        resp.errorMessage = null;
        
        System.assertEquals(37.7749, resp.latitude);
    }
}
