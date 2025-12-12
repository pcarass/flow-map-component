import { LightningElement, api, track } from 'lwc';
import getObjectFields from '@salesforce/apex/FlowMapController.getObjectFields';
import getSObjects from '@salesforce/apex/FlowMapController.getSObjects';

/**
 * Custom Property Editor for Flow Map Component
 * Following Salesforce CPE best practices from:
 * https://developer.salesforce.com/docs/platform/lwc/guide/use-flow-custom-property-editor-interface.html
 */
export default class FlowMapCpe extends LightningElement {
    // ============================================
    // FLOW BUILDER INTERFACE PROPERTIES
    // ============================================
    
    _inputVariables = [];
    _builderContext = {};
    
    @api
    get inputVariables() {
        return this._inputVariables;
    }
    set inputVariables(value) {
        this._inputVariables = value || [];
        this.initializeValues();
    }
    
    @api
    get builderContext() {
        return this._builderContext;
    }
    set builderContext(value) {
        this._builderContext = value || {};
    }
    
    // ============================================
    // COMPONENT STATE
    // ============================================
    
    // Basic Configuration
    @track title = '';
    @track caption = '';
    @track iconName = '';
    @track height = '400px';
    @track isJoined = false;
    
    // Map Type
    @track mapType = 'google';
    
    // Data Source
    @track sourceType = 'query';
    @track objectApiName = '';
    @track queryFilter = '';
    @track recordLimit = 100;
    @track markersJson = '';
    
    // Field Mappings
    @track titleField = '';
    @track descriptionField = '';
    @track addressField = '';
    @track latitudeField = '';
    @track longitudeField = '';
    @track cityField = '';
    @track stateField = '';
    @track postalCodeField = '';
    @track streetField = '';
    @track countryField = '';
    @track customIconField = '';
    
    // Map Center
    @track centerType = 'auto';
    @track centerLatitude = '';
    @track centerLongitude = '';
    @track centerStreet = '';
    @track centerCity = '';
    @track centerState = '';
    @track centerPostalCode = '';
    @track centerCountry = '';
    @track displayCenterAsMarker = false;
    
    // Zoom
    @track zoomLevel = 10;
    
    // Marker Style
    @track markerType = 'default';
    @track markerFillColor = '#EA4335';
    @track markerFillOpacity = '0.7';
    @track markerStrokeColor = '#C62828';
    @track markerStrokeWidth = 2;
    @track markerRadius = 10;
    @track markerScale = '1';
    @track customIconSvg = '';
    
    // Clustering
    @track enableClustering = false;
    @track showCoverageOnHover = false;
    @track maxClusterRadius = 80;
    @track disableClusteringAtZoom = '';
    
    // Drawing
    @track enableDrawing = false;
    @track drawToolMarker = false;
    @track drawToolLine = false;
    @track drawToolPolygon = false;
    @track drawToolCircle = false;
    @track drawToolEdit = false;
    @track drawToolDelete = false;
    @track drawToolbarPosition = 'topright';
    
    // Content Document
    @track saveAsContentDocument = false;
    @track autoSaveContentDocument = false;
    @track contentDocumentLinkedEntityId = '';
    @track contentDocumentId = '';
    @track contentDocumentTitle = '';
    
    // GeoJSON
    @track geoJsonValue = '';
    @track drawContentDocumentId = '';
    
    // List & Search
    @track listViewVisibility = 'auto';
    @track listPosition = 'left';
    @track listCollapsible = true;
    @track isSearchable = false;
    @track searchPlaceholder = 'Search locations...';
    @track searchPosition = 'right';
    
    // Filter
    @track showFilterOption = false;
    @track filterFieldsJson = '';
    
    // Header
    @track headerButtonsJson = '';
    
    // Marker Drag
    @track enableMarkerDrag = false;
    
    // UI State
    @track objectOptions = [];
    @track fieldOptions = [];
    @track isLoadingObjects = false;
    @track isLoadingFields = false;
    @track expandedSections = {
        basic: true,
        mapType: true,
        dataSource: true,
        fieldMappings: false,
        mapCenter: false,
        markerStyle: false,
        clustering: false,
        drawing: false,
        listSearch: false
    };
    
    // ============================================
    // LIFECYCLE HOOKS
    // ============================================
    
    connectedCallback() {
        this.loadSObjects();
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    initializeValues() {
        console.log('FlowMapCpe: initializeValues called with', this._inputVariables?.length || 0, 'variables');
        
        if (!this._inputVariables || this._inputVariables.length === 0) {
            console.log('FlowMapCpe: No input variables to initialize');
            return;
        }
        
        // Build a map for easy access
        const valueMap = {};
        this._inputVariables.forEach(variable => {
            if (variable && variable.name !== undefined) {
                valueMap[variable.name] = variable.value;
            }
        });
        
        console.log('FlowMapCpe: Value map:', JSON.stringify(valueMap));
        
        // String properties
        const stringProps = [
            'title', 'caption', 'iconName', 'height', 'mapType', 'sourceType',
            'objectApiName', 'queryFilter', 'markersJson', 'titleField', 
            'descriptionField', 'addressField', 'latitudeField', 'longitudeField',
            'cityField', 'stateField', 'postalCodeField', 'streetField', 'countryField',
            'customIconField', 'centerLatitude', 'centerLongitude', 'centerStreet',
            'centerCity', 'centerState', 'centerPostalCode', 'centerCountry',
            'markerType', 'markerFillColor', 'markerStrokeColor', 'markerFillOpacity',
            'markerScale', 'customIconSvg', 'drawToolbarPosition', 'geoJsonValue',
            'drawContentDocumentId', 'contentDocumentLinkedEntityId', 'contentDocumentId',
            'contentDocumentTitle', 'listViewVisibility', 'listPosition', 'searchPlaceholder',
            'searchPosition', 'filterFieldsJson', 'headerButtonsJson', 'disableClusteringAtZoom'
        ];
        
        stringProps.forEach(prop => {
            if (valueMap[prop] !== undefined && valueMap[prop] !== null && valueMap[prop] !== '') {
                this[prop] = String(valueMap[prop]);
            }
        });
        
        // Integer properties
        const intProps = {
            'recordLimit': 100,
            'zoomLevel': 10,
            'markerStrokeWidth': 2,
            'markerRadius': 10,
            'maxClusterRadius': 80
        };
        
        Object.keys(intProps).forEach(prop => {
            if (valueMap[prop] !== undefined && valueMap[prop] !== null) {
                const parsed = parseInt(valueMap[prop], 10);
                this[prop] = isNaN(parsed) ? intProps[prop] : parsed;
            }
        });
        
        // Boolean properties - handle $GlobalConstant.True/False format
        const boolProps = [
            'isJoined', 'displayCenterAsMarker', 'enableClustering', 'showCoverageOnHover',
            'enableDrawing', 'drawToolMarker', 'drawToolLine', 'drawToolPolygon',
            'drawToolCircle', 'drawToolEdit', 'drawToolDelete', 'saveAsContentDocument',
            'autoSaveContentDocument', 'isSearchable', 'showFilterOption', 'enableMarkerDrag',
            'listCollapsible'
        ];
        
        boolProps.forEach(prop => {
            if (valueMap[prop] !== undefined && valueMap[prop] !== null) {
                this[prop] = this.parseBooleanValue(valueMap[prop]);
            }
        });
        
        // Determine center type
        if (this.centerLatitude || this.centerLongitude) {
            this.centerType = 'coordinates';
        } else if (this.centerCity || this.centerCountry || this.centerStreet) {
            this.centerType = 'address';
        } else {
            this.centerType = 'auto';
        }
        
        // Load fields if we have an object
        if (this.objectApiName) {
            this.loadObjectFields();
        }
        
        console.log('FlowMapCpe: Initialized - mapType:', this.mapType, 'sourceType:', this.sourceType, 'objectApiName:', this.objectApiName);
        console.log('FlowMapCpe: Field mappings - title:', this.titleField, 'city:', this.cityField, 'street:', this.streetField);
        console.log('FlowMapCpe: List settings - visibility:', this.listViewVisibility, 'position:', this.listPosition);
    }
    
    parseBooleanValue(value) {
        if (value === true || value === 'true' || value === '$GlobalConstant.True') {
            return true;
        }
        return false;
    }
    
    // ============================================
    // VALIDATION (Required by Flow Builder)
    // ============================================
    
    @api
    validate() {
        const errors = [];
        
        // Validate required fields based on source type
        if (this.sourceType === 'query') {
            if (!this.objectApiName) {
                errors.push({
                    key: 'objectApiName',
                    errorString: 'Object API Name is required when using Query data source'
                });
            }
        }
        
        // Validate location fields based on map type
        if (this.mapType === 'leaflet' && this.sourceType === 'query') {
            if (!this.latitudeField || !this.longitudeField) {
                // Only warn, not error - they might be using address fields
            }
        }
        
        return errors;
    }
    
    // ============================================
    // DATA LOADING
    // ============================================
    
    async loadSObjects() {
        this.isLoadingObjects = true;
        try {
            const objects = await getSObjects();
            this.objectOptions = objects.map(obj => ({
                label: obj.label,
                value: obj.apiName
            }));
        } catch (error) {
            console.error('Error loading sObjects:', error);
            this.objectOptions = [];
        } finally {
            this.isLoadingObjects = false;
        }
    }
    
    async loadObjectFields() {
        if (!this.objectApiName) {
            this.fieldOptions = [];
            return;
        }
        
        this.isLoadingFields = true;
        try {
            const fields = await getObjectFields({ objectApiName: this.objectApiName });
            this.fieldOptions = fields.map(field => ({
                label: field.label,
                value: field.apiName
            }));
        } catch (error) {
            console.error('Error loading fields:', error);
            this.fieldOptions = [];
        } finally {
            this.isLoadingFields = false;
        }
    }
    
    // ============================================
    // VALUE CHANGE DISPATCH
    // This is the critical method that communicates with Flow Builder
    // ============================================
    
    dispatchValueChange(name, value, dataType = 'String') {
        // Ensure we have valid values
        const safeValue = (value === undefined || value === null) ? '' : value;
        
        console.log('FlowMapCpe: Dispatching', name, '=', safeValue, '(', dataType, ')');
        
        const detail = {
            name: name,
            newValue: safeValue,
            newValueDataType: dataType
        };
        
        const valueChangedEvent = new CustomEvent('configuration_editor_input_value_changed', {
            bubbles: true,
            composed: true,
            cancelable: false,
            detail: detail
        });
        
        this.dispatchEvent(valueChangedEvent);
    }
    
    // ============================================
    // OPTION GETTERS
    // ============================================
    
    get mapTypeOptions() {
        return [
            { label: 'Google', value: 'google' },
            { label: 'Leaflet', value: 'leaflet' }
        ];
    }
    
    get sourceTypeOptions() {
        return [
            { label: 'Query', value: 'query' },
            { label: 'Manual JSON', value: 'manual' },
            { label: 'Flow Variable', value: 'variable' }
        ];
    }
    
    get centerTypeOptions() {
        return [
            { label: 'Auto (Fit to Markers)', value: 'auto' },
            { label: 'Coordinates', value: 'coordinates' },
            { label: 'Address', value: 'address' }
        ];
    }
    
    get markerTypeOptions() {
        return [
            { label: 'Default Pin', value: 'default' },
            { label: 'Circle', value: 'circle' },
            { label: 'Custom Icon', value: 'customIcon' }
        ];
    }
    
    get listViewOptions() {
        return [
            { label: 'Auto (Show when multiple)', value: 'auto' },
            { label: 'Always Visible', value: 'visible' },
            { label: 'Always Hidden', value: 'hidden' }
        ];
    }
    
    get listPositionOptions() {
        return [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' }
        ];
    }
    
    get searchPositionOptions() {
        return [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
            { label: 'Center', value: 'center' },
            { label: 'Full Width', value: 'fill' }
        ];
    }
    
    get toolbarPositionOptions() {
        return [
            { label: 'Top Left', value: 'topleft' },
            { label: 'Top Right', value: 'topright' },
            { label: 'Bottom Left', value: 'bottomleft' },
            { label: 'Bottom Right', value: 'bottomright' }
        ];
    }
    
    // ============================================
    // UI STATE GETTERS
    // ============================================
    
    get isGoogleMaps() {
        return this.mapType === 'google';
    }
    
    get isLeaflet() {
        return this.mapType === 'leaflet';
    }
    
    get isQuerySource() {
        return this.sourceType === 'query';
    }
    
    get isManualSource() {
        return this.sourceType === 'manual' || this.sourceType === 'variable';
    }
    
    get showCoordinateCenter() {
        return this.centerType === 'coordinates';
    }
    
    get showAddressCenter() {
        return this.centerType === 'address';
    }
    
    get showMarkerColorOptions() {
        return this.markerType === 'circle' || this.markerType === 'default';
    }
    
    get showCustomIconOptions() {
        return this.markerType === 'customIcon';
    }
    
    // ============================================
    // SECTION TOGGLE HANDLERS
    // ============================================
    
    toggleSection(event) {
        const section = event.currentTarget.dataset.section;
        this.expandedSections = {
            ...this.expandedSections,
            [section]: !this.expandedSections[section]
        };
    }
    
    get basicExpanded() { return this.expandedSections.basic; }
    get mapTypeExpanded() { return this.expandedSections.mapType; }
    get dataSourceExpanded() { return this.expandedSections.dataSource; }
    get fieldMappingsExpanded() { return this.expandedSections.fieldMappings; }
    get mapCenterExpanded() { return this.expandedSections.mapCenter; }
    get markerStyleExpanded() { return this.expandedSections.markerStyle; }
    get clusteringExpanded() { return this.expandedSections.clustering; }
    get drawingExpanded() { return this.expandedSections.drawing; }
    get listSearchExpanded() { return this.expandedSections.listSearch; }
    
    // Chevron icons for sections
    get basicChevron() { return this.expandedSections.basic ? 'utility:chevrondown' : 'utility:chevronright'; }
    get mapTypeChevron() { return this.expandedSections.mapType ? 'utility:chevrondown' : 'utility:chevronright'; }
    get dataSourceChevron() { return this.expandedSections.dataSource ? 'utility:chevrondown' : 'utility:chevronright'; }
    get fieldMappingsChevron() { return this.expandedSections.fieldMappings ? 'utility:chevrondown' : 'utility:chevronright'; }
    get mapCenterChevron() { return this.expandedSections.mapCenter ? 'utility:chevrondown' : 'utility:chevronright'; }
    get markerStyleChevron() { return this.expandedSections.markerStyle ? 'utility:chevrondown' : 'utility:chevronright'; }
    get clusteringChevron() { return this.expandedSections.clustering ? 'utility:chevrondown' : 'utility:chevronright'; }
    get drawingChevron() { return this.expandedSections.drawing ? 'utility:chevrondown' : 'utility:chevronright'; }
    get listSearchChevron() { return this.expandedSections.listSearch ? 'utility:chevrondown' : 'utility:chevronright'; }
    
    // ============================================
    // INPUT CHANGE HANDLERS
    // ============================================
    
    // Basic Configuration
    handleTitleChange(event) {
        this.title = event.detail.value;
        this.dispatchValueChange('title', this.title, 'String');
    }
    
    handleCaptionChange(event) {
        this.caption = event.detail.value;
        this.dispatchValueChange('caption', this.caption, 'String');
    }
    
    handleIconNameChange(event) {
        this.iconName = event.detail.value;
        this.dispatchValueChange('iconName', this.iconName, 'String');
    }
    
    handleHeightChange(event) {
        this.height = event.detail.value;
        this.dispatchValueChange('height', this.height, 'String');
    }
    
    handleIsJoinedChange(event) {
        this.isJoined = event.detail.checked;
        this.dispatchValueChange('isJoined', this.isJoined ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    // Map Type
    handleMapTypeChange(event) {
        this.mapType = event.detail.value;
        this.dispatchValueChange('mapType', this.mapType, 'String');
    }
    
    // Data Source
    handleSourceTypeChange(event) {
        this.sourceType = event.detail.value;
        this.dispatchValueChange('sourceType', this.sourceType, 'String');
    }
    
    handleObjectChange(event) {
        this.objectApiName = event.detail.value;
        this.dispatchValueChange('objectApiName', this.objectApiName, 'String');
        this.loadObjectFields();
    }
    
    handleQueryFilterChange(event) {
        this.queryFilter = event.detail.value;
        this.dispatchValueChange('queryFilter', this.queryFilter, 'String');
    }
    
    handleRecordLimitChange(event) {
        this.recordLimit = parseInt(event.detail.value, 10) || 100;
        this.dispatchValueChange('recordLimit', this.recordLimit, 'Number');
    }
    
    handleMarkersJsonChange(event) {
        this.markersJson = event.detail.value;
        this.dispatchValueChange('markersJson', this.markersJson, 'String');
    }
    
    // Field Mappings
    handleTitleFieldChange(event) {
        this.titleField = event.detail.value;
        this.dispatchValueChange('titleField', this.titleField, 'String');
    }
    
    handleDescriptionFieldChange(event) {
        this.descriptionField = event.detail.value;
        this.dispatchValueChange('descriptionField', this.descriptionField, 'String');
    }
    
    handleLatitudeFieldChange(event) {
        this.latitudeField = event.detail.value;
        this.dispatchValueChange('latitudeField', this.latitudeField, 'String');
    }
    
    handleLongitudeFieldChange(event) {
        this.longitudeField = event.detail.value;
        this.dispatchValueChange('longitudeField', this.longitudeField, 'String');
    }
    
    handleStreetFieldChange(event) {
        this.streetField = event.detail.value;
        this.dispatchValueChange('streetField', this.streetField, 'String');
    }
    
    handleCityFieldChange(event) {
        this.cityField = event.detail.value;
        this.dispatchValueChange('cityField', this.cityField, 'String');
    }
    
    handleStateFieldChange(event) {
        this.stateField = event.detail.value;
        this.dispatchValueChange('stateField', this.stateField, 'String');
    }
    
    handlePostalCodeFieldChange(event) {
        this.postalCodeField = event.detail.value;
        this.dispatchValueChange('postalCodeField', this.postalCodeField, 'String');
    }
    
    handleCountryFieldChange(event) {
        this.countryField = event.detail.value;
        this.dispatchValueChange('countryField', this.countryField, 'String');
    }
    
    handleCustomIconFieldChange(event) {
        this.customIconField = event.detail.value;
        this.dispatchValueChange('customIconField', this.customIconField, 'String');
    }
    
    // Map Center
    handleCenterTypeChange(event) {
        this.centerType = event.detail.value;
        // Clear values when switching
        if (this.centerType === 'auto') {
            this.clearCenterValues();
        }
    }
    
    clearCenterValues() {
        const centerProps = ['centerLatitude', 'centerLongitude', 'centerStreet', 
                            'centerCity', 'centerState', 'centerPostalCode', 'centerCountry'];
        centerProps.forEach(prop => {
            this[prop] = '';
            this.dispatchValueChange(prop, '', 'String');
        });
    }
    
    handleCenterLatitudeChange(event) {
        this.centerLatitude = event.detail.value;
        this.dispatchValueChange('centerLatitude', this.centerLatitude, 'String');
    }
    
    handleCenterLongitudeChange(event) {
        this.centerLongitude = event.detail.value;
        this.dispatchValueChange('centerLongitude', this.centerLongitude, 'String');
    }
    
    handleCenterStreetChange(event) {
        this.centerStreet = event.detail.value;
        this.dispatchValueChange('centerStreet', this.centerStreet, 'String');
    }
    
    handleCenterCityChange(event) {
        this.centerCity = event.detail.value;
        this.dispatchValueChange('centerCity', this.centerCity, 'String');
    }
    
    handleCenterStateChange(event) {
        this.centerState = event.detail.value;
        this.dispatchValueChange('centerState', this.centerState, 'String');
    }
    
    handleCenterPostalCodeChange(event) {
        this.centerPostalCode = event.detail.value;
        this.dispatchValueChange('centerPostalCode', this.centerPostalCode, 'String');
    }
    
    handleCenterCountryChange(event) {
        this.centerCountry = event.detail.value;
        this.dispatchValueChange('centerCountry', this.centerCountry, 'String');
    }
    
    handleDisplayCenterAsMarkerChange(event) {
        this.displayCenterAsMarker = event.detail.checked;
        this.dispatchValueChange('displayCenterAsMarker', this.displayCenterAsMarker ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleZoomLevelChange(event) {
        this.zoomLevel = parseInt(event.detail.value, 10) || 10;
        this.dispatchValueChange('zoomLevel', this.zoomLevel, 'Number');
    }
    
    // Marker Style
    handleMarkerTypeChange(event) {
        this.markerType = event.detail.value;
        this.dispatchValueChange('markerType', this.markerType, 'String');
    }
    
    handleMarkerFillColorChange(event) {
        this.markerFillColor = event.detail.value;
        this.dispatchValueChange('markerFillColor', this.markerFillColor, 'String');
    }
    
    handleMarkerStrokeColorChange(event) {
        this.markerStrokeColor = event.detail.value;
        this.dispatchValueChange('markerStrokeColor', this.markerStrokeColor, 'String');
    }
    
    handleMarkerRadiusChange(event) {
        this.markerRadius = parseInt(event.detail.value, 10) || 10;
        this.dispatchValueChange('markerRadius', this.markerRadius, 'Number');
    }
    
    handleCustomIconSvgChange(event) {
        this.customIconSvg = event.detail.value;
        this.dispatchValueChange('customIconSvg', this.customIconSvg, 'String');
    }
    
    // Clustering
    handleEnableClusteringChange(event) {
        this.enableClustering = event.detail.checked;
        this.dispatchValueChange('enableClustering', this.enableClustering ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleShowCoverageOnHoverChange(event) {
        this.showCoverageOnHover = event.detail.checked;
        this.dispatchValueChange('showCoverageOnHover', this.showCoverageOnHover ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleMaxClusterRadiusChange(event) {
        this.maxClusterRadius = parseInt(event.detail.value, 10) || 80;
        this.dispatchValueChange('maxClusterRadius', this.maxClusterRadius, 'Number');
    }
    
    handleDisableClusteringAtZoomChange(event) {
        this.disableClusteringAtZoom = event.detail.value;
        this.dispatchValueChange('disableClusteringAtZoom', this.disableClusteringAtZoom, 'String');
    }
    
    // Drawing
    handleEnableDrawingChange(event) {
        this.enableDrawing = event.detail.checked;
        this.dispatchValueChange('enableDrawing', this.enableDrawing ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleDrawToolMarkerChange(event) {
        this.drawToolMarker = event.detail.checked;
        this.dispatchValueChange('drawToolMarker', this.drawToolMarker ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleDrawToolLineChange(event) {
        this.drawToolLine = event.detail.checked;
        this.dispatchValueChange('drawToolLine', this.drawToolLine ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleDrawToolPolygonChange(event) {
        this.drawToolPolygon = event.detail.checked;
        this.dispatchValueChange('drawToolPolygon', this.drawToolPolygon ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleDrawToolCircleChange(event) {
        this.drawToolCircle = event.detail.checked;
        this.dispatchValueChange('drawToolCircle', this.drawToolCircle ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleDrawToolEditChange(event) {
        this.drawToolEdit = event.detail.checked;
        this.dispatchValueChange('drawToolEdit', this.drawToolEdit ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleDrawToolDeleteChange(event) {
        this.drawToolDelete = event.detail.checked;
        this.dispatchValueChange('drawToolDelete', this.drawToolDelete ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleDrawToolbarPositionChange(event) {
        this.drawToolbarPosition = event.detail.value;
        this.dispatchValueChange('drawToolbarPosition', this.drawToolbarPosition, 'String');
    }
    
    // List & Search
    handleListViewVisibilityChange(event) {
        this.listViewVisibility = event.detail.value;
        this.dispatchValueChange('listViewVisibility', this.listViewVisibility, 'String');
    }
    
    handleListPositionChange(event) {
        this.listPosition = event.detail.value;
        this.dispatchValueChange('listPosition', this.listPosition, 'String');
    }
    
    handleListCollapsibleChange(event) {
        this.listCollapsible = event.detail.checked;
        this.dispatchValueChange('listCollapsible', this.listCollapsible ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleIsSearchableChange(event) {
        this.isSearchable = event.detail.checked;
        this.dispatchValueChange('isSearchable', this.isSearchable ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleSearchPlaceholderChange(event) {
        this.searchPlaceholder = event.detail.value;
        this.dispatchValueChange('searchPlaceholder', this.searchPlaceholder, 'String');
    }
    
    handleSearchPositionChange(event) {
        this.searchPosition = event.detail.value;
        this.dispatchValueChange('searchPosition', this.searchPosition, 'String');
    }
    
    handleShowFilterOptionChange(event) {
        this.showFilterOption = event.detail.checked;
        this.dispatchValueChange('showFilterOption', this.showFilterOption ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
    
    handleEnableMarkerDragChange(event) {
        this.enableMarkerDrag = event.detail.checked;
        this.dispatchValueChange('enableMarkerDrag', this.enableMarkerDrag ? '$GlobalConstant.True' : '$GlobalConstant.False', 'Boolean');
    }
}
