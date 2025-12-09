/**
 * @description Test class for FlowMapController
 */
@IsTest
private class FlowMapControllerTest {
    
    @TestSetup
    static void setupTestData() {
        // Create test accounts with address data
        List<Account> accounts = new List<Account>();
        
        accounts.add(new Account(
            Name = 'Test Account 1',
            BillingStreet = '1 Market Street',
            BillingCity = 'San Francisco',
            BillingState = 'CA',
            BillingPostalCode = '94105',
            BillingCountry = 'USA',
            BillingLatitude = 37.7937,
            BillingLongitude = -122.3965
        ));
        
        accounts.add(new Account(
            Name = 'Test Account 2',
            BillingStreet = '123 Main Street',
            BillingCity = 'Los Angeles',
            BillingState = 'CA',
            BillingPostalCode = '90001',
            BillingCountry = 'USA',
            BillingLatitude = 34.0522,
            BillingLongitude = -118.2437
        ));
        
        accounts.add(new Account(
            Name = 'Test Account 3',
            BillingCity = 'New York',
            BillingState = 'NY',
            BillingCountry = 'USA'
        ));
        
        insert accounts;
    }
    
    @IsTest
    static void testGetMapData_WithAllFields() {
        // Prepare field mappings
        Map<String, String> fieldMappings = new Map<String, String>{
            'titleField' => 'Name',
            'descriptionField' => 'Description',
            'latitudeField' => 'BillingLatitude',
            'longitudeField' => 'BillingLongitude',
            'addressField' => 'BillingStreet',
            'cityField' => 'BillingCity',
            'stateField' => 'BillingState',
            'postalCodeField' => 'BillingPostalCode',
            'countryField' => 'BillingCountry'
        };
        
        Test.startTest();
        List<Map<String, Object>> results = FlowMapController.getMapData(
            'Account',
            JSON.serialize(fieldMappings),
            null,
            100
        );
        Test.stopTest();
        
        System.assertEquals(3, results.size(), 'Should return 3 accounts');
        
        // Verify first result has expected fields
        Map<String, Object> firstResult = results[0];
        System.assertNotEquals(null, firstResult.get('id'), 'Should have id');
        System.assertNotEquals(null, firstResult.get('title'), 'Should have title');
    }
    
    @IsTest
    static void testGetMapData_WithFilter() {
        Map<String, String> fieldMappings = new Map<String, String>{
            'titleField' => 'Name',
            'latitudeField' => 'BillingLatitude',
            'longitudeField' => 'BillingLongitude'
        };
        
        Test.startTest();
        List<Map<String, Object>> results = FlowMapController.getMapData(
            'Account',
            JSON.serialize(fieldMappings),
            'BillingCity = \'San Francisco\'',
            100
        );
        Test.stopTest();
        
        System.assertEquals(1, results.size(), 'Should return 1 account in San Francisco');
    }
    
    @IsTest
    static void testGetMapData_WithLimit() {
        Map<String, String> fieldMappings = new Map<String, String>{
            'titleField' => 'Name'
        };
        
        Test.startTest();
        List<Map<String, Object>> results = FlowMapController.getMapData(
            'Account',
            JSON.serialize(fieldMappings),
            null,
            1
        );
        Test.stopTest();
        
        System.assertEquals(1, results.size(), 'Should return only 1 account due to limit');
    }
    
    @IsTest
    static void testGetMapData_EmptyObjectName() {
        Test.startTest();
        List<Map<String, Object>> results = FlowMapController.getMapData(
            '',
            '{}',
            null,
            100
        );
        Test.stopTest();
        
        System.assertEquals(0, results.size(), 'Should return empty list for empty object name');
    }
    
    @IsTest
    static void testSaveDrawingDocument_New() {
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        
        String geoJsonContent = '{"type":"FeatureCollection","features":[]}';
        
        Test.startTest();
        String documentId = FlowMapController.saveDrawingDocument(
            testAccount.Id,
            geoJsonContent,
            'Test Drawing',
            null
        );
        Test.stopTest();
        
        System.assertNotEquals(null, documentId, 'Should return a document ID');
        
        // Verify document was created
        ContentDocument doc = [
            SELECT Id, Title 
            FROM ContentDocument 
            WHERE Id = :documentId
        ];
        System.assertEquals('Test Drawing', doc.Title, 'Document title should match');
        
        // Verify document is linked to account
        List<ContentDocumentLink> links = [
            SELECT Id 
            FROM ContentDocumentLink 
            WHERE ContentDocumentId = :documentId 
            AND LinkedEntityId = :testAccount.Id
        ];
        System.assertEquals(1, links.size(), 'Document should be linked to account');
    }
    
    @IsTest
    static void testSaveDrawingDocument_Update() {
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        
        // Create initial document
        String initialContent = '{"type":"FeatureCollection","features":[]}';
        String documentId = FlowMapController.saveDrawingDocument(
            testAccount.Id,
            initialContent,
            'Test Drawing',
            null
        );
        
        // Update document
        String updatedContent = '{"type":"FeatureCollection","features":[{"type":"Feature"}]}';
        
        Test.startTest();
        String updatedDocumentId = FlowMapController.saveDrawingDocument(
            testAccount.Id,
            updatedContent,
            'Test Drawing Updated',
            documentId
        );
        Test.stopTest();
        
        System.assertEquals(documentId, updatedDocumentId, 'Document ID should remain the same');
        
        // Verify there are now 2 versions
        List<ContentVersion> versions = [
            SELECT Id, Title 
            FROM ContentVersion 
            WHERE ContentDocumentId = :documentId
        ];
        System.assertEquals(2, versions.size(), 'Should have 2 versions');
    }
    
    @IsTest
    static void testGetDrawingDocument() {
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        
        String geoJsonContent = '{"type":"FeatureCollection","features":[]}';
        String documentId = FlowMapController.saveDrawingDocument(
            testAccount.Id,
            geoJsonContent,
            'Test Drawing',
            null
        );
        
        Test.startTest();
        String retrievedContent = FlowMapController.getDrawingDocument(documentId);
        Test.stopTest();
        
        System.assertEquals(geoJsonContent, retrievedContent, 'Content should match');
    }
    
    @IsTest
    static void testGetDrawingDocument_NullId() {
        Test.startTest();
        String result = FlowMapController.getDrawingDocument(null);
        Test.stopTest();
        
        System.assertEquals(null, result, 'Should return null for null ID');
    }
    
    @IsTest
    static void testGetDrawingDocument_BlankId() {
        Test.startTest();
        String result = FlowMapController.getDrawingDocument('');
        Test.stopTest();
        
        System.assertEquals(null, result, 'Should return null for blank ID');
    }
    
    @IsTest
    static void testGetPicklistValues() {
        Test.startTest();
        List<Map<String, String>> options = FlowMapController.getPicklistValues(
            'Account',
            'Industry'
        );
        Test.stopTest();
        
        System.assert(options.size() > 0, 'Should return picklist values for Industry');
        
        // Verify structure
        Map<String, String> firstOption = options[0];
        System.assert(firstOption.containsKey('label'), 'Should have label');
        System.assert(firstOption.containsKey('value'), 'Should have value');
    }
    
    @IsTest
    static void testGetPicklistValues_InvalidObject() {
        Test.startTest();
        List<Map<String, String>> options = FlowMapController.getPicklistValues(
            'InvalidObject__c',
            'SomeField'
        );
        Test.stopTest();
        
        System.assertEquals(0, options.size(), 'Should return empty list for invalid object');
    }
    
    @IsTest
    static void testGetPicklistValues_InvalidField() {
        Test.startTest();
        List<Map<String, String>> options = FlowMapController.getPicklistValues(
            'Account',
            'InvalidField__c'
        );
        Test.stopTest();
        
        System.assertEquals(0, options.size(), 'Should return empty list for invalid field');
    }
    
    @IsTest
    static void testGeocodeAddress() {
        Test.startTest();
        Map<String, Decimal> result = FlowMapController.geocodeAddress(
            '1 Market Street',
            'San Francisco',
            'CA',
            '94105',
            'USA'
        );
        Test.stopTest();
        
        // Placeholder implementation returns empty map
        System.assertNotEquals(null, result, 'Should return a map');
    }
    
    @IsTest
    static void testGetMapData_ErrorHandling() {
        Map<String, String> fieldMappings = new Map<String, String>{
            'titleField' => 'Name'
        };
        
        Test.startTest();
        try {
            // This should throw an error due to invalid object
            FlowMapController.getMapData(
                'InvalidObject__c',
                JSON.serialize(fieldMappings),
                null,
                100
            );
            System.assert(false, 'Should have thrown an exception');
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Error'), 'Should contain error message');
        }
        Test.stopTest();
    }
}
