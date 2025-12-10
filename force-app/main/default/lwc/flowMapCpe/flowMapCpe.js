import { LightningElement, api, track } from 'lwc';

export default class FlowMapCpe extends LightningElement {
    // ============================================
    // FLOW BUILDER CONTEXT
    // ============================================
    
    _builderContext;
    @api 
    get builderContext() {
        return this._builderContext;
    }
    set builderContext(value) {
        this._builderContext = value;
    }
    
    _inputVariables = [];
    @api
    get inputVariables() {
        return this._inputVariables;
    }
    set inputVariables(value) {
        this._inputVariables = value || [];
        this.initializeValues();
    }
    
    // Generic type descriptors (required by Flow Builder)
    @api genericTypeMappings;
    
    // ============================================
    // SECTION COLLAPSE STATE
    // ============================================
    
    @track expandedSections = {
        mapType: true,
        dataSource: true,
        fieldMappings: false,
        mapCenter: false,
        markerStyle: false,
        clustering: false,
        drawing: false,
        geojson: false,
        headerUI: false,
        listSearch: false
    };
    
    // Center type selection
    @track centerType = 'auto';
    
    // ============================================
    // ALL PROPERTY VALUES
    // ============================================
    
    @track mapType = 'google';
    @track height = '400px';
    @track sourceType = 'query';
    @track objectApiName = '';
    @track queryFilter = '';
    @track recordLimit = 100;
    @track markersJson = '';
    @track titleField = '';
    @track descriptionField = '';
    @track addressField = '';
    @track latitudeField = '';
    @track longitudeField = '';
    @track cityField = '';
    @track stateField = '';
    @track postalCodeField = '';
    @track countryField = '';
    @track customIconField = '';
    @track centerLatitude = '';
    @track centerLongitude = '';
    @track centerStreet = '';
    @track centerCity = '';
    @track centerState = '';
    @track centerPostalCode = '';
    @track centerCountry = '';
    @track displayCenterAsMarker = false;
    @track zoomLevel = 10;
    @track markerType = 'default';
    @track markerFillColor = '#EA4335';
    @track markerFillOpacity = 0.7;
    @track markerStrokeColor = '#C62828';
    @track markerStrokeWidth = 2;
    @track markerRadius = 10;
    @track markerScale = 1;
    @track customIconSvg = '';
    @track enableClustering = false;
    @track showCoverageOnHover = false;
    @track maxClusterRadius = 80;
    @track disableClusteringAtZoom = '';
    @track enableDrawing = false;
    @track drawToolMarker = false;
    @track drawToolLine = false;
    @track drawToolPolygon = false;
    @track drawToolCircle = false;
    @track drawToolEdit = false;
    @track drawToolDelete = false;
    @track drawToolbarPosition = 'topright';
    @track saveAsContentDocument = false;
    @track autoSaveContentDocument = false;
    @track contentDocumentLinkedEntityId = '';
    @track contentDocumentId = '';
    @track contentDocumentTitle = 'Flow Map Drawing Document';
    @track geoJsonValue = '';
    @track drawContentDocumentId = '';
    @track title = '';
    @track caption = '';
    @track iconName = '';
    @track isJoined = false;
    @track headerButtonsJson = '';
    @track listViewVisibility = 'auto';
    @track isSearchable = false;
    @track searchPlaceholder = 'Search locations...';
    @track searchPosition = 'right';
    @track showFilterOption = false;
    @track filterFieldsJson = '';
    @track enableMarkerDrag = false;

    // ============================================
    // INITIALIZATION
    // ============================================
    
    initializeValues() {
        if (!this._inputVariables || this._inputVariables.length === 0) return;
        
        // Create a map for easy lookup
        const valueMap = {};
        this._inputVariables.forEach(variable => {
            if (variable.value !== undefined && variable.value !== null) {
                valueMap[variable.name] = variable.value;
            }
        });
        
        console.log('CPE initializing with values:', JSON.stringify(valueMap));
        
        // String properties
        const stringProps = [
            'mapType', 'height', 'sourceType', 'objectApiName', 'queryFilter', 'markersJson',
            'titleField', 'descriptionField', 'addressField', 'latitudeField', 'longitudeField',
            'cityField', 'stateField', 'postalCodeField', 'countryField', 'customIconField',
            'centerLatitude', 'centerLongitude', 'centerStreet', 'centerCity', 'centerState',
            'centerPostalCode', 'centerCountry', 'markerType', 'markerFillColor', 'markerStrokeColor',
            'customIconSvg', 'drawToolbarPosition', 'contentDocumentLinkedEntityId', 'contentDocumentId',
            'contentDocumentTitle', 'geoJsonValue', 'drawContentDocumentId', 'title', 'caption',
            'iconName', 'headerButtonsJson', 'listViewVisibility', 'searchPlaceholder', 'searchPosition',
            'filterFieldsJson', 'disableClusteringAtZoom'
        ];
        
        stringProps.forEach(prop => {
            if (valueMap[prop] !== undefined && valueMap[prop] !== '') {
                this[prop] = String(valueMap[prop]);
            }
        });
        
        // Integer properties
        if (valueMap.recordLimit !== undefined) this.recordLimit = parseInt(valueMap.recordLimit, 10) || 100;
        if (valueMap.zoomLevel !== undefined) this.zoomLevel = parseInt(valueMap.zoomLevel, 10) || 10;
        if (valueMap.markerStrokeWidth !== undefined) this.markerStrokeWidth = parseInt(valueMap.markerStrokeWidth, 10) || 2;
        if (valueMap.markerRadius !== undefined) this.markerRadius = parseInt(valueMap.markerRadius, 10) || 10;
        if (valueMap.maxClusterRadius !== undefined) this.maxClusterRadius = parseInt(valueMap.maxClusterRadius, 10) || 80;
        
        // Float properties
        if (valueMap.markerFillOpacity !== undefined) this.markerFillOpacity = parseFloat(valueMap.markerFillOpacity) || 0.7;
        if (valueMap.markerScale !== undefined) this.markerScale = parseFloat(valueMap.markerScale) || 1;
        
        // Boolean properties
        const boolProps = [
            'displayCenterAsMarker', 'enableClustering', 'showCoverageOnHover', 'enableDrawing',
            'drawToolMarker', 'drawToolLine', 'drawToolPolygon', 'drawToolCircle', 'drawToolEdit',
            'drawToolDelete', 'saveAsContentDocument', 'autoSaveContentDocument', 'isJoined',
            'isSearchable', 'showFilterOption', 'enableMarkerDrag'
        ];
        
        boolProps.forEach(prop => {
            if (valueMap[prop] !== undefined) {
                this[prop] = valueMap[prop] === true || valueMap[prop] === 'true';
            }
        });
        
        // Determine center type based on values
        if (this.centerLatitude || this.centerLongitude) {
            this.centerType = 'coordinates';
        } else if (this.centerCity || this.centerCountry || this.centerStreet) {
            this.centerType = 'address';
        } else {
            this.centerType = 'auto';
        }
        
        console.log('CPE initialized. mapType =', this.mapType);
    }
    
    // ============================================
    // FLOW VARIABLE OPTIONS
    // ============================================
    
    get flowVariableOptions() {
        const options = [{ label: '-- Enter manually --', value: '' }];
        
        if (this._builderContext && this._builderContext.variables) {
            this._builderContext.variables.forEach(variable => {
                if (variable.dataType === 'String' || variable.dataType === 'Number' || variable.dataType === 'SObject') {
                    options.push({
                        label: '{!' + variable.name + '}',
                        value: '{!' + variable.name + '}'
                    });
                }
            });
        }
        
        return options;
    }
    
    get hasFlowVariables() {
        return this._builderContext && this._builderContext.variables && this._builderContext.variables.length > 0;
    }

    // ============================================
    // COMPUTED PROPERTIES - SECTIONS
    // ============================================
    
    get mapTypeSectionIcon() {
        return this.expandedSections.mapType ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get mapTypeSectionClass() {
        return this.expandedSections.mapType ? 'section-content expanded' : 'section-content collapsed';
    }
    
    get dataSourceSectionIcon() {
        return this.expandedSections.dataSource ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get dataSourceSectionClass() {
        return this.expandedSections.dataSource ? 'section-content expanded' : 'section-content collapsed';
    }
    
    get fieldMappingsSectionIcon() {
        return this.expandedSections.fieldMappings ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get fieldMappingsSectionClass() {
        return this.expandedSections.fieldMappings ? 'section-content expanded' : 'section-content collapsed';
    }
    
    get mapCenterSectionIcon() {
        return this.expandedSections.mapCenter ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get mapCenterSectionClass() {
        return this.expandedSections.mapCenter ? 'section-content expanded' : 'section-content collapsed';
    }
    
    get markerStyleSectionIcon() {
        return this.expandedSections.markerStyle ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get markerStyleSectionClass() {
        return this.expandedSections.markerStyle ? 'section-content expanded' : 'section-content collapsed';
    }
    
    get clusteringSectionIcon() {
        return this.expandedSections.clustering ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get clusteringSectionClass() {
        return this.expandedSections.clustering ? 'section-content expanded' : 'section-content collapsed';
    }
    
    get drawingSectionIcon() {
        return this.expandedSections.drawing ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get drawingSectionClass() {
        return this.expandedSections.drawing ? 'section-content expanded' : 'section-content collapsed';
    }
    
    get geojsonSectionIcon() {
        return this.expandedSections.geojson ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get geojsonSectionClass() {
        return this.expandedSections.geojson ? 'section-content expanded' : 'section-content collapsed';
    }
    
    get headerUISectionIcon() {
        return this.expandedSections.headerUI ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get headerUISectionClass() {
        return this.expandedSections.headerUI ? 'section-content expanded' : 'section-content collapsed';
    }
    
    get listSearchSectionIcon() {
        return this.expandedSections.listSearch ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get listSearchSectionClass() {
        return this.expandedSections.listSearch ? 'section-content expanded' : 'section-content collapsed';
    }

    // ============================================
    // COMPUTED PROPERTIES - CONDITIONS
    // ============================================
    
    get isLeafletMaps() {
        return this.mapType === 'leaflet';
    }
    
    get googleMapClass() {
        return this.mapType === 'google' ? 'map-type-card selected' : 'map-type-card';
    }
    
    get leafletMapClass() {
        return this.mapType === 'leaflet' ? 'map-type-card selected' : 'map-type-card';
    }
    
    get isQueryMode() {
        return this.sourceType === 'query';
    }
    
    get isVariableOrManualMode() {
        return this.sourceType === 'variable' || this.sourceType === 'manual';
    }
    
    get queryButtonClass() {
        return this.sourceType === 'query' ? 'source-button selected' : 'source-button';
    }
    
    get variableButtonClass() {
        return this.sourceType === 'variable' ? 'source-button selected' : 'source-button';
    }
    
    get manualButtonClass() {
        return this.sourceType === 'manual' ? 'source-button selected' : 'source-button';
    }
    
    get isCenterCoordinates() {
        return this.centerType === 'coordinates';
    }
    
    get isCenterAddress() {
        return this.centerType === 'address';
    }
    
    get coordinatesCenterClass() {
        return this.centerType === 'coordinates' ? 'source-button selected' : 'source-button';
    }
    
    get addressCenterClass() {
        return this.centerType === 'address' ? 'source-button selected' : 'source-button';
    }
    
    get autoCenterClass() {
        return this.centerType === 'auto' ? 'source-button selected' : 'source-button';
    }
    
    get isCustomMarkerType() {
        return this.markerType === 'customIcon';
    }
    
    get zoomLabel() {
        if (this.zoomLevel <= 3) return 'World';
        if (this.zoomLevel <= 6) return 'Continent';
        if (this.zoomLevel <= 10) return 'City';
        if (this.zoomLevel <= 15) return 'Streets';
        return 'Buildings';
    }
    
    // ============================================
    // MARKER TYPE CLASS GETTERS
    // ============================================
    
    get defaultMarkerClass() {
        return this.markerType === 'default' ? 'marker-type-option selected' : 'marker-type-option';
    }
    
    get circleMarkerClass() {
        return this.markerType === 'circle' ? 'marker-type-option selected' : 'marker-type-option';
    }
    
    get pinMarkerClass() {
        return this.markerType === 'pin' ? 'marker-type-option selected' : 'marker-type-option';
    }
    
    get customMarkerClass() {
        return this.markerType === 'customIcon' ? 'marker-type-option selected' : 'marker-type-option';
    }

    // ============================================
    // DROPDOWN OPTIONS
    // ============================================
    
    get toolbarPositionOptions() {
        return [
            { label: 'Top Left', value: 'topleft' },
            { label: 'Top Right', value: 'topright' },
            { label: 'Bottom Left', value: 'bottomleft' },
            { label: 'Bottom Right', value: 'bottomright' }
        ];
    }
    
    get listViewOptions() {
        return [
            { label: 'Auto (show when multiple markers)', value: 'auto' },
            { label: 'Always Visible', value: 'visible' },
            { label: 'Always Hidden', value: 'hidden' }
        ];
    }
    
    get searchPositionOptions() {
        return [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
            { label: 'Center', value: 'center' },
            { label: 'Fill', value: 'fill' }
        ];
    }

    // ============================================
    // SECTION TOGGLE HANDLER
    // ============================================
    
    toggleSection(event) {
        const section = event.currentTarget.dataset.section;
        this.expandedSections = {
            ...this.expandedSections,
            [section]: !this.expandedSections[section]
        };
    }

    // ============================================
    // DISPATCH VALUE CHANGE TO FLOW
    // ============================================
    
    dispatchValueChange(name, value, dataType = 'String') {
        console.log('Dispatching value change:', name, '=', value, '(', dataType, ')');
        const valueChangeEvent = new CustomEvent('configuration_editor_input_value_changed', {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
                name: name,
                newValue: value,
                newValueDataType: dataType
            }
        });
        this.dispatchEvent(valueChangeEvent);
    }

    // ============================================
    // MAP TYPE HANDLERS
    // ============================================
    
    selectGoogleMaps() {
        this.mapType = 'google';
        this.dispatchValueChange('mapType', 'google', 'String');
    }
    
    selectLeafletMaps() {
        this.mapType = 'leaflet';
        this.dispatchValueChange('mapType', 'leaflet', 'String');
    }
    
    handleHeightChange(event) {
        this.height = event.target.value;
        this.dispatchValueChange('height', this.height, 'String');
    }

    // ============================================
    // DATA SOURCE HANDLERS
    // ============================================
    
    handleSourceTypeChange(event) {
        const value = event.currentTarget.dataset.value;
        this.sourceType = value;
        this.dispatchValueChange('sourceType', value, 'String');
    }
    
    handleObjectApiNameChange(event) {
        this.objectApiName = event.target.value;
        this.dispatchValueChange('objectApiName', this.objectApiName, 'String');
    }
    
    handleQueryFilterChange(event) {
        this.queryFilter = event.target.value;
        this.dispatchValueChange('queryFilter', this.queryFilter, 'String');
    }
    
    handleRecordLimitChange(event) {
        this.recordLimit = parseInt(event.target.value, 10) || 100;
        this.dispatchValueChange('recordLimit', this.recordLimit, 'Integer');
    }
    
    handleMarkersJsonChange(event) {
        this.markersJson = event.target.value;
        this.dispatchValueChange('markersJson', this.markersJson, 'String');
    }

    // ============================================
    // FIELD MAPPING HANDLERS
    // ============================================
    
    handleTitleFieldChange(event) {
        this.titleField = event.target.value;
        this.dispatchValueChange('titleField', this.titleField, 'String');
    }
    
    handleDescriptionFieldChange(event) {
        this.descriptionField = event.target.value;
        this.dispatchValueChange('descriptionField', this.descriptionField, 'String');
    }
    
    handleCustomIconFieldChange(event) {
        this.customIconField = event.target.value;
        this.dispatchValueChange('customIconField', this.customIconField, 'String');
    }
    
    handleLatitudeFieldChange(event) {
        this.latitudeField = event.target.value;
        this.dispatchValueChange('latitudeField', this.latitudeField, 'String');
    }
    
    handleLongitudeFieldChange(event) {
        this.longitudeField = event.target.value;
        this.dispatchValueChange('longitudeField', this.longitudeField, 'String');
    }
    
    handleAddressFieldChange(event) {
        this.addressField = event.target.value;
        this.dispatchValueChange('addressField', this.addressField, 'String');
    }
    
    handleCityFieldChange(event) {
        this.cityField = event.target.value;
        this.dispatchValueChange('cityField', this.cityField, 'String');
    }
    
    handleStateFieldChange(event) {
        this.stateField = event.target.value;
        this.dispatchValueChange('stateField', this.stateField, 'String');
    }
    
    handlePostalCodeFieldChange(event) {
        this.postalCodeField = event.target.value;
        this.dispatchValueChange('postalCodeField', this.postalCodeField, 'String');
    }
    
    handleCountryFieldChange(event) {
        this.countryField = event.target.value;
        this.dispatchValueChange('countryField', this.countryField, 'String');
    }

    // ============================================
    // MAP CENTER HANDLERS
    // ============================================
    
    handleCenterTypeChange(event) {
        this.centerType = event.currentTarget.dataset.value;
    }
    
    handleCenterLatitudeChange(event) {
        this.centerLatitude = event.target.value;
        this.dispatchValueChange('centerLatitude', this.centerLatitude, 'String');
    }
    
    handleCenterLongitudeChange(event) {
        this.centerLongitude = event.target.value;
        this.dispatchValueChange('centerLongitude', this.centerLongitude, 'String');
    }
    
    handleCenterStreetChange(event) {
        this.centerStreet = event.target.value;
        this.dispatchValueChange('centerStreet', this.centerStreet, 'String');
    }
    
    handleCenterCityChange(event) {
        this.centerCity = event.target.value;
        this.dispatchValueChange('centerCity', this.centerCity, 'String');
    }
    
    handleCenterStateChange(event) {
        this.centerState = event.target.value;
        this.dispatchValueChange('centerState', this.centerState, 'String');
    }
    
    handleCenterPostalCodeChange(event) {
        this.centerPostalCode = event.target.value;
        this.dispatchValueChange('centerPostalCode', this.centerPostalCode, 'String');
    }
    
    handleCenterCountryChange(event) {
        this.centerCountry = event.target.value;
        this.dispatchValueChange('centerCountry', this.centerCountry, 'String');
    }
    
    handleDisplayCenterAsMarkerChange(event) {
        this.displayCenterAsMarker = event.target.checked;
        this.dispatchValueChange('displayCenterAsMarker', this.displayCenterAsMarker, 'Boolean');
    }
    
    handleZoomLevelChange(event) {
        this.zoomLevel = parseInt(event.target.value, 10);
        this.dispatchValueChange('zoomLevel', this.zoomLevel, 'Integer');
    }

    // ============================================
    // MARKER STYLE HANDLERS
    // ============================================
    
    handleMarkerTypeChange(event) {
        const value = event.currentTarget.dataset.value;
        this.markerType = value;
        this.dispatchValueChange('markerType', value, 'String');
    }
    
    handleMarkerFillColorChange(event) {
        this.markerFillColor = event.target.value;
        this.dispatchValueChange('markerFillColor', this.markerFillColor, 'String');
    }
    
    handleMarkerStrokeColorChange(event) {
        this.markerStrokeColor = event.target.value;
        this.dispatchValueChange('markerStrokeColor', this.markerStrokeColor, 'String');
    }
    
    handleMarkerFillOpacityChange(event) {
        this.markerFillOpacity = parseFloat(event.target.value);
        this.dispatchValueChange('markerFillOpacity', String(this.markerFillOpacity), 'String');
    }
    
    handleMarkerStrokeWidthChange(event) {
        this.markerStrokeWidth = parseInt(event.target.value, 10);
        this.dispatchValueChange('markerStrokeWidth', this.markerStrokeWidth, 'Integer');
    }
    
    handleMarkerRadiusChange(event) {
        this.markerRadius = parseInt(event.target.value, 10);
        this.dispatchValueChange('markerRadius', this.markerRadius, 'Integer');
    }
    
    handleMarkerScaleChange(event) {
        this.markerScale = parseFloat(event.target.value);
        this.dispatchValueChange('markerScale', String(this.markerScale), 'String');
    }
    
    handleCustomIconSvgChange(event) {
        this.customIconSvg = event.target.value;
        this.dispatchValueChange('customIconSvg', this.customIconSvg, 'String');
    }

    // ============================================
    // CLUSTERING HANDLERS
    // ============================================
    
    handleEnableClusteringChange(event) {
        this.enableClustering = event.target.checked;
        this.dispatchValueChange('enableClustering', this.enableClustering, 'Boolean');
    }
    
    handleShowCoverageOnHoverChange(event) {
        this.showCoverageOnHover = event.target.checked;
        this.dispatchValueChange('showCoverageOnHover', this.showCoverageOnHover, 'Boolean');
    }
    
    handleMaxClusterRadiusChange(event) {
        this.maxClusterRadius = parseInt(event.target.value, 10);
        this.dispatchValueChange('maxClusterRadius', this.maxClusterRadius, 'Integer');
    }
    
    handleDisableClusteringAtZoomChange(event) {
        this.disableClusteringAtZoom = event.target.value;
        this.dispatchValueChange('disableClusteringAtZoom', this.disableClusteringAtZoom ? parseInt(this.disableClusteringAtZoom, 10) : null, 'Integer');
    }

    // ============================================
    // DRAWING HANDLERS
    // ============================================
    
    handleEnableDrawingChange(event) {
        this.enableDrawing = event.target.checked;
        this.dispatchValueChange('enableDrawing', this.enableDrawing, 'Boolean');
    }
    
    handleDrawToolMarkerChange(event) {
        this.drawToolMarker = event.target.checked;
        this.dispatchValueChange('drawToolMarker', this.drawToolMarker, 'Boolean');
    }
    
    handleDrawToolLineChange(event) {
        this.drawToolLine = event.target.checked;
        this.dispatchValueChange('drawToolLine', this.drawToolLine, 'Boolean');
    }
    
    handleDrawToolPolygonChange(event) {
        this.drawToolPolygon = event.target.checked;
        this.dispatchValueChange('drawToolPolygon', this.drawToolPolygon, 'Boolean');
    }
    
    handleDrawToolCircleChange(event) {
        this.drawToolCircle = event.target.checked;
        this.dispatchValueChange('drawToolCircle', this.drawToolCircle, 'Boolean');
    }
    
    handleDrawToolEditChange(event) {
        this.drawToolEdit = event.target.checked;
        this.dispatchValueChange('drawToolEdit', this.drawToolEdit, 'Boolean');
    }
    
    handleDrawToolDeleteChange(event) {
        this.drawToolDelete = event.target.checked;
        this.dispatchValueChange('drawToolDelete', this.drawToolDelete, 'Boolean');
    }
    
    handleDrawToolbarPositionChange(event) {
        this.drawToolbarPosition = event.detail.value;
        this.dispatchValueChange('drawToolbarPosition', this.drawToolbarPosition, 'String');
    }
    
    handleSaveAsContentDocumentChange(event) {
        this.saveAsContentDocument = event.target.checked;
        this.dispatchValueChange('saveAsContentDocument', this.saveAsContentDocument, 'Boolean');
    }
    
    handleAutoSaveContentDocumentChange(event) {
        this.autoSaveContentDocument = event.target.checked;
        this.dispatchValueChange('autoSaveContentDocument', this.autoSaveContentDocument, 'Boolean');
    }
    
    handleContentDocumentLinkedEntityIdChange(event) {
        this.contentDocumentLinkedEntityId = event.target.value;
        this.dispatchValueChange('contentDocumentLinkedEntityId', this.contentDocumentLinkedEntityId, 'String');
    }
    
    handleContentDocumentTitleChange(event) {
        this.contentDocumentTitle = event.target.value;
        this.dispatchValueChange('contentDocumentTitle', this.contentDocumentTitle, 'String');
    }

    // ============================================
    // GEOJSON HANDLERS
    // ============================================
    
    handleGeoJsonValueChange(event) {
        this.geoJsonValue = event.target.value;
        this.dispatchValueChange('geoJsonValue', this.geoJsonValue, 'String');
    }
    
    handleDrawContentDocumentIdChange(event) {
        this.drawContentDocumentId = event.target.value;
        this.dispatchValueChange('drawContentDocumentId', this.drawContentDocumentId, 'String');
    }

    // ============================================
    // HEADER UI HANDLERS
    // ============================================
    
    handleTitleChange(event) {
        this.title = event.target.value;
        this.dispatchValueChange('title', this.title, 'String');
    }
    
    handleCaptionChange(event) {
        this.caption = event.target.value;
        this.dispatchValueChange('caption', this.caption, 'String');
    }
    
    handleIconNameChange(event) {
        this.iconName = event.target.value;
        this.dispatchValueChange('iconName', this.iconName, 'String');
    }
    
    handleIsJoinedChange(event) {
        this.isJoined = event.target.checked;
        this.dispatchValueChange('isJoined', this.isJoined, 'Boolean');
    }
    
    handleHeaderButtonsJsonChange(event) {
        this.headerButtonsJson = event.target.value;
        this.dispatchValueChange('headerButtonsJson', this.headerButtonsJson, 'String');
    }

    // ============================================
    // LIST VIEW & SEARCH HANDLERS
    // ============================================
    
    handleListViewVisibilityChange(event) {
        this.listViewVisibility = event.detail.value;
        this.dispatchValueChange('listViewVisibility', this.listViewVisibility, 'String');
    }
    
    handleIsSearchableChange(event) {
        this.isSearchable = event.target.checked;
        this.dispatchValueChange('isSearchable', this.isSearchable, 'Boolean');
    }
    
    handleSearchPlaceholderChange(event) {
        this.searchPlaceholder = event.target.value;
        this.dispatchValueChange('searchPlaceholder', this.searchPlaceholder, 'String');
    }
    
    handleSearchPositionChange(event) {
        this.searchPosition = event.detail.value;
        this.dispatchValueChange('searchPosition', this.searchPosition, 'String');
    }
    
    handleShowFilterOptionChange(event) {
        this.showFilterOption = event.target.checked;
        this.dispatchValueChange('showFilterOption', this.showFilterOption, 'Boolean');
    }
    
    handleFilterFieldsJsonChange(event) {
        this.filterFieldsJson = event.target.value;
        this.dispatchValueChange('filterFieldsJson', this.filterFieldsJson, 'String');
    }
    
    handleEnableMarkerDragChange(event) {
        this.enableMarkerDrag = event.target.checked;
        this.dispatchValueChange('enableMarkerDrag', this.enableMarkerDrag, 'Boolean');
    }

    // ============================================
    // VALIDATION
    // ============================================
    
    @api
    validate() {
        const validity = [];
        
        if (this.sourceType === 'query' && !this.objectApiName) {
            validity.push({
                key: 'objectApiName',
                errorString: 'Object API Name is required when using Query data source'
            });
        }
        
        return validity;
    }
}
