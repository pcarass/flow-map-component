import { LightningElement, api, track } from 'lwc';

export default class FlowMapCpe extends LightningElement {
    // ============================================
    // INPUT PROPERTIES FROM FLOW
    // ============================================
    _inputVariables = [];
    _builderContext = {};
    _elementInfo = {};

    @api
    get inputVariables() {
        return this._inputVariables;
    }
    set inputVariables(variables) {
        this._inputVariables = variables || [];
        this.initializeValues();
    }

    @api
    get builderContext() {
        return this._builderContext;
    }
    set builderContext(context) {
        this._builderContext = context || {};
    }

    @api
    get elementInfo() {
        return this._elementInfo;
    }
    set elementInfo(info) {
        this._elementInfo = info || {};
    }

    // ============================================
    // TRACKED STATE
    // ============================================
    
    // Section collapse state
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
    
    // All property values
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
    @track disableClusteringAtZoom = null;
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
        
        this._inputVariables.forEach(variable => {
            const name = variable.name;
            const value = variable.value;
            
            if (value !== undefined && value !== null) {
                if (this.hasOwnProperty(name)) {
                    this[name] = value;
                }
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
    // COMPUTED PROPERTIES - CONDITIONAL DISPLAY
    // ============================================
    
    get isGoogleMaps() {
        return this.mapType === 'google';
    }
    
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
    
    get queryButtonVariant() {
        return this.sourceType === 'query' ? 'brand' : 'neutral';
    }
    
    get variableButtonVariant() {
        return this.sourceType === 'variable' ? 'brand' : 'neutral';
    }
    
    get manualButtonVariant() {
        return this.sourceType === 'manual' ? 'brand' : 'neutral';
    }
    
    get isCoordinatesCenter() {
        return this.centerType === 'coordinates';
    }
    
    get isAddressCenter() {
        return this.centerType === 'address';
    }
    
    get isAutoCenter() {
        return this.centerType === 'auto';
    }
    
    get coordinatesCenterVariant() {
        return this.centerType === 'coordinates' ? 'brand' : 'neutral';
    }
    
    get addressCenterVariant() {
        return this.centerType === 'address' ? 'brand' : 'neutral';
    }
    
    get autoCenterVariant() {
        return this.centerType === 'auto' ? 'brand' : 'neutral';
    }
    
    get isCustomIconType() {
        return this.markerType === 'customIcon';
    }

    // ============================================
    // MARKER TYPES CONFIGURATION
    // ============================================
    
    get markerTypes() {
        return [
            {
                value: 'default',
                label: 'Default',
                preview: '<svg viewBox="0 0 24 24" width="32" height="32"><path fill="#EA4335" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>',
                className: this.markerType === 'default' ? 'marker-type-option selected' : 'marker-type-option'
            },
            {
                value: 'circle',
                label: 'Circle',
                preview: '<svg viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="8" fill="#EA4335" stroke="#C62828" stroke-width="2"/></svg>',
                className: this.markerType === 'circle' ? 'marker-type-option selected' : 'marker-type-option'
            },
            {
                value: 'pin',
                label: 'Pin',
                preview: '<svg viewBox="0 0 24 24" width="32" height="32"><path fill="#EA4335" stroke="#C62828" stroke-width="1" d="M12 2C8.69 2 6 4.69 6 8c0 5.5 6 14 6 14s6-8.5 6-14c0-3.31-2.69-6-6-6zm0 9c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>',
                className: this.markerType === 'pin' ? 'marker-type-option selected' : 'marker-type-option'
            },
            {
                value: 'customIcon',
                label: 'Custom',
                preview: '<svg viewBox="0 0 24 24" width="32" height="32"><rect x="4" y="4" width="16" height="16" fill="none" stroke="#EA4335" stroke-width="2" stroke-dasharray="4"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="#EA4335">SVG</text></svg>',
                className: this.markerType === 'customIcon' ? 'marker-type-option selected' : 'marker-type-option'
            }
        ];
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
        this.dispatchValueChange('mapType', 'google');
    }
    
    selectLeafletMaps() {
        this.mapType = 'leaflet';
        this.dispatchValueChange('mapType', 'leaflet');
    }
    
    handleHeightChange(event) {
        this.height = event.target.value;
        this.dispatchValueChange('height', this.height);
    }

    // ============================================
    // DATA SOURCE HANDLERS
    // ============================================
    
    handleSourceTypeChange(event) {
        this.sourceType = event.target.dataset.value;
        this.dispatchValueChange('sourceType', this.sourceType);
    }
    
    handleObjectApiNameChange(event) {
        this.objectApiName = event.target.value;
        this.dispatchValueChange('objectApiName', this.objectApiName);
    }
    
    handleQueryFilterChange(event) {
        this.queryFilter = event.target.value;
        this.dispatchValueChange('queryFilter', this.queryFilter);
    }
    
    handleRecordLimitChange(event) {
        this.recordLimit = parseInt(event.target.value, 10);
        this.dispatchValueChange('recordLimit', this.recordLimit, 'Number');
    }
    
    handleMarkersJsonChange(event) {
        this.markersJson = event.target.value;
        this.dispatchValueChange('markersJson', this.markersJson);
    }

    // ============================================
    // FIELD MAPPING HANDLERS
    // ============================================
    
    handleTitleFieldChange(event) {
        this.titleField = event.target.value;
        this.dispatchValueChange('titleField', this.titleField);
    }
    
    handleDescriptionFieldChange(event) {
        this.descriptionField = event.target.value;
        this.dispatchValueChange('descriptionField', this.descriptionField);
    }
    
    handleAddressFieldChange(event) {
        this.addressField = event.target.value;
        this.dispatchValueChange('addressField', this.addressField);
    }
    
    handleLatitudeFieldChange(event) {
        this.latitudeField = event.target.value;
        this.dispatchValueChange('latitudeField', this.latitudeField);
    }
    
    handleLongitudeFieldChange(event) {
        this.longitudeField = event.target.value;
        this.dispatchValueChange('longitudeField', this.longitudeField);
    }
    
    handleCityFieldChange(event) {
        this.cityField = event.target.value;
        this.dispatchValueChange('cityField', this.cityField);
    }
    
    handleStateFieldChange(event) {
        this.stateField = event.target.value;
        this.dispatchValueChange('stateField', this.stateField);
    }
    
    handlePostalCodeFieldChange(event) {
        this.postalCodeField = event.target.value;
        this.dispatchValueChange('postalCodeField', this.postalCodeField);
    }
    
    handleCountryFieldChange(event) {
        this.countryField = event.target.value;
        this.dispatchValueChange('countryField', this.countryField);
    }
    
    handleCustomIconFieldChange(event) {
        this.customIconField = event.target.value;
        this.dispatchValueChange('customIconField', this.customIconField);
    }
    
    handleStreetFieldChange(event) {
        // Note: streetField is not currently in the component, but handle it anyway
        this.dispatchValueChange('streetField', event.target.value);
    }

    // ============================================
    // MAP CENTER HANDLERS
    // ============================================
    
    handleCenterTypeChange(event) {
        this.centerType = event.target.dataset.value;
        
        // Clear values when switching types
        if (this.centerType === 'auto') {
            this.centerLatitude = '';
            this.centerLongitude = '';
            this.centerStreet = '';
            this.centerCity = '';
            this.centerState = '';
            this.centerPostalCode = '';
            this.centerCountry = '';
            
            this.dispatchValueChange('centerLatitude', '');
            this.dispatchValueChange('centerLongitude', '');
            this.dispatchValueChange('centerStreet', '');
            this.dispatchValueChange('centerCity', '');
            this.dispatchValueChange('centerState', '');
            this.dispatchValueChange('centerPostalCode', '');
            this.dispatchValueChange('centerCountry', '');
        }
    }
    
    handleCenterLatitudeChange(event) {
        this.centerLatitude = event.target.value;
        this.dispatchValueChange('centerLatitude', this.centerLatitude);
    }
    
    handleCenterLongitudeChange(event) {
        this.centerLongitude = event.target.value;
        this.dispatchValueChange('centerLongitude', this.centerLongitude);
    }
    
    handleCenterStreetChange(event) {
        this.centerStreet = event.target.value;
        this.dispatchValueChange('centerStreet', this.centerStreet);
    }
    
    handleCenterCityChange(event) {
        this.centerCity = event.target.value;
        this.dispatchValueChange('centerCity', this.centerCity);
    }
    
    handleCenterStateChange(event) {
        this.centerState = event.target.value;
        this.dispatchValueChange('centerState', this.centerState);
    }
    
    handleCenterPostalCodeChange(event) {
        this.centerPostalCode = event.target.value;
        this.dispatchValueChange('centerPostalCode', this.centerPostalCode);
    }
    
    handleCenterCountryChange(event) {
        this.centerCountry = event.target.value;
        this.dispatchValueChange('centerCountry', this.centerCountry);
    }
    
    handleDisplayCenterAsMarkerChange(event) {
        this.displayCenterAsMarker = event.target.checked;
        this.dispatchValueChange('displayCenterAsMarker', this.displayCenterAsMarker, 'Boolean');
    }
    
    handleZoomLevelChange(event) {
        this.zoomLevel = parseInt(event.target.value, 10);
        this.dispatchValueChange('zoomLevel', this.zoomLevel, 'Number');
    }

    // ============================================
    // MARKER STYLE HANDLERS
    // ============================================
    
    handleMarkerTypeChange(event) {
        this.markerType = event.currentTarget.dataset.value;
        this.dispatchValueChange('markerType', this.markerType);
    }
    
    handleMarkerFillColorChange(event) {
        this.markerFillColor = event.target.value;
        this.dispatchValueChange('markerFillColor', this.markerFillColor);
    }
    
    handleMarkerStrokeColorChange(event) {
        this.markerStrokeColor = event.target.value;
        this.dispatchValueChange('markerStrokeColor', this.markerStrokeColor);
    }
    
    handleMarkerFillOpacityChange(event) {
        this.markerFillOpacity = parseFloat(event.target.value);
        this.dispatchValueChange('markerFillOpacity', this.markerFillOpacity.toString());
    }
    
    handleMarkerStrokeWidthChange(event) {
        this.markerStrokeWidth = parseInt(event.target.value, 10);
        this.dispatchValueChange('markerStrokeWidth', this.markerStrokeWidth, 'Number');
    }
    
    handleMarkerRadiusChange(event) {
        this.markerRadius = parseInt(event.target.value, 10);
        this.dispatchValueChange('markerRadius', this.markerRadius, 'Number');
    }
    
    handleMarkerScaleChange(event) {
        this.markerScale = parseFloat(event.target.value);
        this.dispatchValueChange('markerScale', this.markerScale.toString());
    }
    
    handleCustomIconSvgChange(event) {
        this.customIconSvg = event.target.value;
        this.dispatchValueChange('customIconSvg', this.customIconSvg);
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
        this.dispatchValueChange('maxClusterRadius', this.maxClusterRadius, 'Number');
    }
    
    handleDisableClusteringAtZoomChange(event) {
        this.disableClusteringAtZoom = event.target.value ? parseInt(event.target.value, 10) : null;
        this.dispatchValueChange('disableClusteringAtZoom', this.disableClusteringAtZoom, 'Number');
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
        this.dispatchValueChange('drawToolbarPosition', this.drawToolbarPosition);
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
        this.dispatchValueChange('contentDocumentLinkedEntityId', this.contentDocumentLinkedEntityId);
    }
    
    handleContentDocumentIdChange(event) {
        this.contentDocumentId = event.target.value;
        this.dispatchValueChange('contentDocumentId', this.contentDocumentId);
    }
    
    handleContentDocumentTitleChange(event) {
        this.contentDocumentTitle = event.target.value;
        this.dispatchValueChange('contentDocumentTitle', this.contentDocumentTitle);
    }

    // ============================================
    // GEOJSON HANDLERS
    // ============================================
    
    handleGeoJsonValueChange(event) {
        this.geoJsonValue = event.target.value;
        this.dispatchValueChange('geoJsonValue', this.geoJsonValue);
    }
    
    handleDrawContentDocumentIdChange(event) {
        this.drawContentDocumentId = event.target.value;
        this.dispatchValueChange('drawContentDocumentId', this.drawContentDocumentId);
    }

    // ============================================
    // HEADER & UI HANDLERS
    // ============================================
    
    handleTitleChange(event) {
        this.title = event.target.value;
        this.dispatchValueChange('title', this.title);
    }
    
    handleCaptionChange(event) {
        this.caption = event.target.value;
        this.dispatchValueChange('caption', this.caption);
    }
    
    handleIconNameChange(event) {
        this.iconName = event.target.value;
        this.dispatchValueChange('iconName', this.iconName);
    }
    
    handleIsJoinedChange(event) {
        this.isJoined = event.target.checked;
        this.dispatchValueChange('isJoined', this.isJoined, 'Boolean');
    }
    
    handleHeaderButtonsJsonChange(event) {
        this.headerButtonsJson = event.target.value;
        this.dispatchValueChange('headerButtonsJson', this.headerButtonsJson);
    }

    // ============================================
    // LIST & SEARCH HANDLERS
    // ============================================
    
    handleListViewVisibilityChange(event) {
        this.listViewVisibility = event.detail.value;
        this.dispatchValueChange('listViewVisibility', this.listViewVisibility);
    }
    
    handleIsSearchableChange(event) {
        this.isSearchable = event.target.checked;
        this.dispatchValueChange('isSearchable', this.isSearchable, 'Boolean');
    }
    
    handleSearchPlaceholderChange(event) {
        this.searchPlaceholder = event.target.value;
        this.dispatchValueChange('searchPlaceholder', this.searchPlaceholder);
    }
    
    handleSearchPositionChange(event) {
        this.searchPosition = event.detail.value;
        this.dispatchValueChange('searchPosition', this.searchPosition);
    }
    
    handleShowFilterOptionChange(event) {
        this.showFilterOption = event.target.checked;
        this.dispatchValueChange('showFilterOption', this.showFilterOption, 'Boolean');
    }
    
    handleFilterFieldsJsonChange(event) {
        this.filterFieldsJson = event.target.value;
        this.dispatchValueChange('filterFieldsJson', this.filterFieldsJson);
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
        
        // Validate object API name for query mode
        if (this.sourceType === 'query' && !this.objectApiName) {
            validity.push({
                key: 'objectApiName',
                errorString: 'Object API Name is required when using Query data source'
            });
        }
        
        // Validate latitude/longitude fields for Leaflet
        if (this.mapType === 'leaflet' && this.sourceType === 'query') {
            if (!this.latitudeField) {
                validity.push({
                    key: 'latitudeField',
                    errorString: 'Latitude Field is required for Leaflet maps'
                });
            }
            if (!this.longitudeField) {
                validity.push({
                    key: 'longitudeField',
                    errorString: 'Longitude Field is required for Leaflet maps'
                });
            }
        }
        
        // Validate Content Document save settings
        if (this.saveAsContentDocument && !this.contentDocumentLinkedEntityId) {
            validity.push({
                key: 'contentDocumentLinkedEntityId',
                errorString: 'Linked Entity ID is required when saving as Content Document'
            });
        }
        
        return validity;
    }
}
