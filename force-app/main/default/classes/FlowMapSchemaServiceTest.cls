/**
 * @description Test class for FlowMapSchemaService
 */
@isTest
public class FlowMapSchemaServiceTest {
    
    @isTest
    static void testGetQueryableObjects() {
        Test.startTest();
        List<FlowMapSchemaService.ObjectOption> objects = FlowMapSchemaService.getQueryableObjects();
        Test.stopTest();
        
        // Should return at least Account
        System.assertNotEquals(0, objects.size(), 'Should return queryable objects');
        
        // Find Account in the list
        Boolean hasAccount = false;
        for (FlowMapSchemaService.ObjectOption obj : objects) {
            if (obj.value == 'Account') {
                hasAccount = true;
                System.assertEquals('Account', obj.label);
                System.assertEquals(false, obj.isCustom);
                break;
            }
        }
        System.assert(hasAccount, 'Account should be in queryable objects');
    }
    
    @isTest
    static void testGetObjectFields() {
        Test.startTest();
        List<FlowMapSchemaService.FieldOption> fields = FlowMapSchemaService.getObjectFields('Account');
        Test.stopTest();
        
        // Should return fields
        System.assertNotEquals(0, fields.size(), 'Should return Account fields');
        
        // Find Name field
        Boolean hasName = false;
        for (FlowMapSchemaService.FieldOption field : fields) {
            if (field.value == 'Name') {
                hasName = true;
                System.assertEquals('STRING', field.fieldType);
                System.assertNotEquals(null, field.iconName);
                break;
            }
        }
        System.assert(hasName, 'Name field should exist on Account');
    }
    
    @isTest
    static void testGetObjectFieldsInvalidObject() {
        Test.startTest();
        List<FlowMapSchemaService.FieldOption> fields = FlowMapSchemaService.getObjectFields('InvalidObject__c');
        Test.stopTest();
        
        System.assertEquals(0, fields.size(), 'Should return empty list for invalid object');
    }
    
    @isTest
    static void testGetObjectFieldsBlankObject() {
        Test.startTest();
        List<FlowMapSchemaService.FieldOption> fields = FlowMapSchemaService.getObjectFields('');
        Test.stopTest();
        
        System.assertEquals(0, fields.size(), 'Should return empty list for blank object');
    }
    
    @isTest
    static void testGetFieldsByCategory() {
        Test.startTest();
        
        // Test text category
        List<FlowMapSchemaService.FieldOption> textFields = FlowMapSchemaService.getFieldsByCategory('Account', 'text');
        System.assertNotEquals(0, textFields.size(), 'Should return text fields');
        
        // Test location category
        List<FlowMapSchemaService.FieldOption> locationFields = FlowMapSchemaService.getFieldsByCategory('Account', 'location');
        // May be empty if no numeric fields accessible
        
        // Test all category
        List<FlowMapSchemaService.FieldOption> allFields = FlowMapSchemaService.getFieldsByCategory('Account', 'all');
        System.assertNotEquals(0, allFields.size(), 'Should return all fields');
        
        Test.stopTest();
    }
    
    @isTest
    static void testGetPreviewData() {
        // Create test account
        Account testAccount = new Account(
            Name = 'Test Account',
            BillingCity = 'San Francisco',
            BillingState = 'CA',
            BillingCountry = 'USA'
        );
        insert testAccount;
        
        Map<String, Object> fieldMappings = new Map<String, Object>{
            'titleField' => 'Name',
            'cityField' => 'BillingCity',
            'stateField' => 'BillingState',
            'countryField' => 'BillingCountry'
        };
        
        Test.startTest();
        List<Map<String, Object>> results = FlowMapSchemaService.getPreviewData(
            'Account',
            JSON.serialize(fieldMappings),
            'Name = \'Test Account\'',
            5
        );
        Test.stopTest();
        
        System.assertNotEquals(0, results.size(), 'Should return preview data');
    }
    
    @isTest
    static void testObjectOptionComparable() {
        FlowMapSchemaService.ObjectOption optionA = new FlowMapSchemaService.ObjectOption('Account', 'Account', false);
        FlowMapSchemaService.ObjectOption optionB = new FlowMapSchemaService.ObjectOption('Contact', 'Contact', false);
        
        System.assert(optionA.compareTo(optionB) < 0, 'Account should come before Contact');
    }
    
    @isTest
    static void testFieldOptionComparable() {
        FlowMapSchemaService.FieldOption optionA = new FlowMapSchemaService.FieldOption('Account Name', 'Name', 'STRING', 'utility:text', false);
        FlowMapSchemaService.FieldOption optionB = new FlowMapSchemaService.FieldOption('Billing City', 'BillingCity', 'STRING', 'utility:text', false);
        
        System.assert(optionA.compareTo(optionB) < 0, 'Account Name should come before Billing City');
    }
}
