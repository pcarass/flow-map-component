import { LightningElement, api, track, wire } from 'lwc';
import getQueryableObjects from '@salesforce/apex/FlowMapSchemaService.getQueryableObjects';
import getPreviewData from '@salesforce/apex/FlowMapSchemaService.getPreviewData';

// Module-level state cache - persists even when component is destroyed/recreated
// This is necessary because Flow Builder frequently re-renders the CPE
const STATE_CACHE = {
    values: {},
    initialized: false
};

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
        // Use module-level cache to determine if we should initialize
        // This persists even if Flow Builder destroys and recreates the component
        if (!STATE_CACHE.initialized) {
            STATE_CACHE.initialized = true;
            this.initializeFromInputVariables();
        }
        // Always restore from cache (handles component recreation)
        this.restoreFromCache();
    }
    
    initializeFromInputVariables() {
        // Parse inputVariables into the cache
        this._inputVariables.forEach(variable => {
            if (variable.value !== undefined && variable.value !== null) {
                STATE_CACHE.values[variable.name] = variable.value;
            }
        });
    }
    
    restoreFromCache() {
        // Restore all cached values to local state
        Object.keys(STATE_CACHE.values).forEach(key => {
            if (this.hasOwnProperty(key) || this[key] !== undefined) {
                const value = STATE_CACHE.values[key];
                if (typeof this[key] === 'boolean') {
                    this[key] = value === true || value === 'true';
                } else if (typeof this[key] === 'number') {
                    this[key] = Number(value);
                } else {
                    this[key] = value;
                }
            }
        });
        
        // Determine center type based on cached values
        if (this.centerLatitude || this.centerLongitude) {
            this.centerType = 'coordinates';
        } else if (this.centerCity || this.centerCountry || this.centerStreet) {
            this.centerType = 'address';
        } else {
            this.centerType = 'auto';
        }
    }
    
    // Helper to update cache and dispatch to Flow
    updateValue(name, value, dataType = 'String') {
        this[name] = value;
        STATE_CACHE.values[name] = value;
        this.dispatchValueChange(name, value, dataType);
    }
    
    @api genericTypeMappings;
    
    // ============================================
    // SECTION COLLAPSE STATE
    // ============================================
    
    @track expandedSections = {
        mapType: true,
        dataSource: true,
        fieldMappings: true,
        mapCenter: false,
        markerStyle: false,
        clustering: false,
        drawing: false,
        geojson: false,
        headerUI: false,
        listSearch: false,
        popupCustomization: false
    };
    
    @track centerType = 'auto';
    
    // ============================================
    // OBJECT/FIELD DATA
    // ============================================
    
    @track objectOptions = [];
    @track isLoadingObjects = true;
    
    // ============================================
    // PREVIEW STATE
    // ============================================
    
    @track previewMarkers = [];
    @track isLoadingPreview = false;
    @track previewError = null;
    
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
    @track streetField = '';
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
    @track listPosition = 'left';
    @track listCollapsible = false;
    @track popupTitleField = '';
    @track popupDescriptionField = '';
    @track popupAddressField = '';
    @track popupCustomFieldsJson = '';
    @track popupShowNavigateButton = false;

    // ============================================
    // WIRE: GET OBJECTS
    // ============================================
    
    @wire(getQueryableObjects)
    wiredObjects({ error, data }) {
        this.isLoadingObjects = false;
        if (data) {
            this.objectOptions = data.map(obj => ({
                label: obj.label + (obj.isCustom ? ' (Custom)' : ''),
                value: obj.value
            }));
        } else if (error) {
            console.error('Error loading objects:', error);
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    
    initializeValues() {
        // This method is now only called once via initializeFromInputVariables
        // It processes the inputVariables into the module-level cache
        if (!this._inputVariables || this._inputVariables.length === 0) return;
        
        const valueMap = {};
        this._inputVariables.forEach(variable => {
            if (variable.value !== undefined && variable.value !== null) {
                valueMap[variable.name] = variable.value;
            }
        });
        
        // Store in cache
        Object.assign(STATE_CACHE.values, valueMap);
        
        // String properties
        const stringProps = [
            'mapType', 'height', 'sourceType', 'objectApiName', 'queryFilter', 'markersJson',
            'titleField', 'descriptionField', 'addressField', 'latitudeField', 'longitudeField',
            'cityField', 'stateField', 'postalCodeField', 'countryField', 'streetField', 'customIconField',
            'centerLatitude', 'centerLongitude', 'centerStreet', 'centerCity', 'centerState',
            'centerPostalCode', 'centerCountry', 'markerType', 'markerFillColor', 'markerStrokeColor',
            'customIconSvg', 'drawToolbarPosition', 'contentDocumentLinkedEntityId', 'contentDocumentId',
            'contentDocumentTitle', 'geoJsonValue', 'drawContentDocumentId', 'title', 'caption',
            'iconName', 'headerButtonsJson', 'listViewVisibility', 'searchPlaceholder', 'searchPosition',
            'filterFieldsJson', 'disableClusteringAtZoom', 'listPosition', 'popupTitleField', 
            'popupDescriptionField', 'popupAddressField', 'popupCustomFieldsJson'
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
            'isSearchable', 'showFilterOption', 'enableMarkerDrag', 'listCollapsible', 'popupShowNavigateButton'
        ];
        
        boolProps.forEach(prop => {
            if (valueMap[prop] !== undefined) {
                this[prop] = valueMap[prop] === true || valueMap[prop] === 'true';
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
        
        // Load preview if we have enough data
        if (this.objectApiName) {
            this.loadPreview();
        }
    }

    // ============================================
    // PREVIEW METHODS
    // ============================================
    
    get previewContainerStyle() {
        return 'height: 200px;';
    }
    
    get hasPreviewMarkers() {
        return this.previewMarkers && this.previewMarkers.length > 0;
    }
    
    get previewMarkerCount() {
        return this.previewMarkers ? this.previewMarkers.length : 0;
    }
    
    refreshPreview() {
        this.loadPreview();
    }
    
    async loadPreview() {
        if (!this.objectApiName || this.sourceType !== 'query') {
            this.previewMarkers = [];
            return;
        }
        
        this.isLoadingPreview = true;
        this.previewError = null;
        
        try {
            const fieldMappings = {
                titleField: this.titleField,
                descriptionField: this.descriptionField,
                streetField: this.streetField,
                cityField: this.cityField,
                stateField: this.stateField,
                postalCodeField: this.postalCodeField,
                countryField: this.countryField,
                latitudeField: this.latitudeField,
                longitudeField: this.longitudeField
            };
            
            const data = await getPreviewData({
                objectApiName: this.objectApiName,
                fieldMappingsJson: JSON.stringify(fieldMappings),
                filterClause: this.queryFilter,
                recordLimit: 5
            });
            
            if (data && data.length > 0) {
                this.previewMarkers = data.map(record => ({
                    location: {
                        Street: record.street || '',
                        City: record.city || '',
                        State: record.state || '',
                        PostalCode: record.postalCode || '',
                        Country: record.country || ''
                    },
                    title: record.title || 'Marker',
                    description: record.description || ''
                })).filter(m => m.location.City || m.location.Country);
                
                if (this.previewMarkers.length === 0) {
                    this.previewError = 'No records with address data found';
                }
            } else {
                this.previewMarkers = [];
                this.previewError = 'No records found';
            }
        } catch (error) {
            console.error('Preview error:', error);
            this.previewError = 'Error loading preview';
            this.previewMarkers = [];
        } finally {
            this.isLoadingPreview = false;
        }
    }

    // ============================================
    // FLOW VARIABLE OPTIONS
    // ============================================
    
    get flowVariableOptions() {
        const options = [{ label: '-- Enter value --', value: '' }];
        
        if (this._builderContext && this._builderContext.variables) {
            this._builderContext.variables.forEach(variable => {
                if (variable.dataType === 'String' || variable.dataType === 'SObject') {
                    options.push({
                        label: '{!' + variable.name + '}',
                        value: '{!' + variable.name + '}'
                    });
                }
            });
        }
        
        return options;
    }
    
    get showManualJsonInput() {
        return this.sourceType === 'manual';
    }

    // ============================================
    // SECTION ICON GETTERS
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
    
    get popupCustomizationSectionIcon() {
        return this.expandedSections.popupCustomization ? 'utility:chevrondown' : 'utility:chevronright';
    }
    get popupCustomizationSectionClass() {
        return this.expandedSections.popupCustomization ? 'section-content expanded' : 'section-content collapsed';
    }

    // ============================================
    // CONDITION GETTERS
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
    
    get queryButtonVariant() {
        return this.sourceType === 'query' ? 'brand' : 'neutral';
    }
    
    get variableButtonVariant() {
        return this.sourceType === 'variable' ? 'brand' : 'neutral';
    }
    
    get manualButtonVariant() {
        return this.sourceType === 'manual' ? 'brand' : 'neutral';
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
    
    get isCoordinatesCenter() {
        return this.centerType === 'coordinates';
    }
    
    get isAddressCenter() {
        return this.centerType === 'address';
    }
    
    get isAutoCenter() {
        return this.centerType === 'auto';
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
    
    // Marker type class getters
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
            { label: 'Auto', value: 'auto' },
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
    
    get listPositionOptions() {
        return [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' }
        ];
    }

    // ============================================
    // SECTION TOGGLE
    // ============================================
    
    toggleSection(event) {
        const section = event.currentTarget.dataset.section;
        this.expandedSections = {
            ...this.expandedSections,
            [section]: !this.expandedSections[section]
        };
    }

    // ============================================
    // DISPATCH VALUE CHANGE
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
        this.updateValue('mapType', 'google', 'String');
    }
    
    selectLeafletMaps() {
        this.updateValue('mapType', 'leaflet', 'String');
    }
    
    handleHeightChange(event) {
        this.updateValue('height', event.target.value, 'String');
    }

    // ============================================
    // DATA SOURCE HANDLERS
    // ============================================
    
    handleSourceTypeChange(event) {
        this.updateValue('sourceType', event.currentTarget.dataset.value, 'String');
    }
    
    handleObjectChange(event) {
        this.updateValue('objectApiName', event.detail.value, 'String');
        
        // Clear field mappings when object changes
        this.titleField = '';
        this.descriptionField = '';
        this.streetField = '';
        this.cityField = '';
        this.stateField = '';
        this.postalCodeField = '';
        this.countryField = '';
        this.latitudeField = '';
        this.longitudeField = '';
        
        // Load preview with new object
        this.loadPreview();
    }
    
    handleQueryFilterChange(event) {
        this.updateValue('queryFilter', event.target.value, 'String');
    }
    
    handleRecordLimitChange(event) {
        const value = parseInt(event.target.value, 10) || 100;
        this.updateValue('recordLimit', value, 'Integer');
    }
    
    handleMarkersJsonChange(event) {
        this.updateValue('markersJson', event.detail ? event.detail.value : event.target.value, 'String');
    }

    // ============================================
    // FIELD MAPPING HANDLERS
    // ============================================
    
    handleTitleFieldChange(event) {
        this.updateValue('titleField', event.detail.value, 'String');
        this.loadPreview();
    }
    
    handleDescriptionFieldChange(event) {
        this.updateValue('descriptionField', event.detail.value, 'String');
    }
    
    handleCustomIconFieldChange(event) {
        this.updateValue('customIconField', event.detail.value, 'String');
    }
    
    handleStreetFieldChange(event) {
        this.updateValue('streetField', event.detail.value, 'String');
        this.loadPreview();
    }
    
    handleCityFieldChange(event) {
        this.updateValue('cityField', event.detail.value, 'String');
        this.loadPreview();
    }
    
    handleStateFieldChange(event) {
        this.updateValue('stateField', event.detail.value, 'String');
        this.loadPreview();
    }
    
    handlePostalCodeFieldChange(event) {
        this.updateValue('postalCodeField', event.detail.value, 'String');
    }
    
    handleCountryFieldChange(event) {
        this.updateValue('countryField', event.detail.value, 'String');
        this.loadPreview();
    }
    
    handleLatitudeFieldChange(event) {
        this.updateValue('latitudeField', event.detail.value, 'String');
    }
    
    handleLongitudeFieldChange(event) {
        this.updateValue('longitudeField', event.detail.value, 'String');
    }

    // ============================================
    // MAP CENTER HANDLERS
    // ============================================
    
    handleCenterTypeChange(event) {
        this.centerType = event.currentTarget.dataset.value;
    }
    
    handleCenterLatitudeChange(event) {
        this.updateValue('centerLatitude', event.target.value, 'String');
    }
    
    handleCenterLongitudeChange(event) {
        this.updateValue('centerLongitude', event.target.value, 'String');
    }
    
    handleCenterStreetChange(event) {
        this.updateValue('centerStreet', event.target.value, 'String');
    }
    
    handleCenterCityChange(event) {
        this.updateValue('centerCity', event.target.value, 'String');
    }
    
    handleCenterStateChange(event) {
        this.updateValue('centerState', event.target.value, 'String');
    }
    
    handleCenterPostalCodeChange(event) {
        this.updateValue('centerPostalCode', event.target.value, 'String');
    }
    
    handleCenterCountryChange(event) {
        this.updateValue('centerCountry', event.target.value, 'String');
    }
    
    handleZoomLevelChange(event) {
        this.updateValue('zoomLevel', parseInt(event.target.value, 10) || 10, 'Integer');
    }

    // ============================================
    // MARKER STYLE HANDLERS
    // ============================================
    
    handleMarkerTypeChange(event) {
        this.updateValue('markerType', event.currentTarget.dataset.value, 'String');
    }
    
    handleMarkerFillColorChange(event) {
        this.updateValue('markerFillColor', event.target.value, 'String');
    }
    
    handleMarkerStrokeColorChange(event) {
        this.updateValue('markerStrokeColor', event.target.value, 'String');
    }
    
    handleCustomIconSvgChange(event) {
        this.updateValue('customIconSvg', event.target.value, 'String');
    }

    // ============================================
    // CLUSTERING HANDLERS
    // ============================================
    
    handleEnableClusteringChange(event) {
        this.updateValue('enableClustering', event.target.checked, 'Boolean');
    }
    
    handleShowCoverageOnHoverChange(event) {
        this.updateValue('showCoverageOnHover', event.target.checked, 'Boolean');
    }
    
    handleMaxClusterRadiusChange(event) {
        this.updateValue('maxClusterRadius', parseInt(event.target.value, 10) || 80, 'Integer');
    }

    // ============================================
    // DRAWING HANDLERS
    // ============================================
    
    handleEnableDrawingChange(event) {
        this.updateValue('enableDrawing', event.target.checked, 'Boolean');
    }
    
    handleDrawToolMarkerChange(event) {
        this.updateValue('drawToolMarker', event.target.checked, 'Boolean');
    }
    
    handleDrawToolLineChange(event) {
        this.updateValue('drawToolLine', event.target.checked, 'Boolean');
    }
    
    handleDrawToolPolygonChange(event) {
        this.updateValue('drawToolPolygon', event.target.checked, 'Boolean');
    }
    
    handleDrawToolCircleChange(event) {
        this.updateValue('drawToolCircle', event.target.checked, 'Boolean');
    }
    
    handleDrawToolEditChange(event) {
        this.updateValue('drawToolEdit', event.target.checked, 'Boolean');
    }
    
    handleDrawToolDeleteChange(event) {
        this.updateValue('drawToolDelete', event.target.checked, 'Boolean');
    }
    
    handleDrawToolbarPositionChange(event) {
        this.updateValue('drawToolbarPosition', event.detail.value, 'String');
    }

    // ============================================
    // HEADER UI HANDLERS
    // ============================================
    
    handleTitleChange(event) {
        this.updateValue('title', event.target.value, 'String');
    }
    
    handleCaptionChange(event) {
        this.updateValue('caption', event.target.value, 'String');
    }
    
    handleIconNameChange(event) {
        this.updateValue('iconName', event.target.value, 'String');
    }
    
    handleIsJoinedChange(event) {
        this.updateValue('isJoined', event.target.checked, 'Boolean');
    }

    // ============================================
    // LIST & SEARCH HANDLERS
    // ============================================
    
    handleListViewVisibilityChange(event) {
        this.updateValue('listViewVisibility', event.detail.value, 'String');
    }
    
    handleIsSearchableChange(event) {
        this.updateValue('isSearchable', event.target.checked, 'Boolean');
    }
    
    handleSearchPlaceholderChange(event) {
        this.updateValue('searchPlaceholder', event.target.value, 'String');
    }
    
    handleSearchPositionChange(event) {
        this.updateValue('searchPosition', event.detail.value, 'String');
    }
    
    handleEnableMarkerDragChange(event) {
        this.updateValue('enableMarkerDrag', event.target.checked, 'Boolean');
    }
    
    handleListPositionChange(event) {
        this.updateValue('listPosition', event.detail.value, 'String');
    }
    
    handleListCollapsibleChange(event) {
        this.updateValue('listCollapsible', event.target.checked, 'Boolean');
    }
    
    handlePopupTitleFieldChange(event) {
        this.updateValue('popupTitleField', event.detail.value, 'String');
    }
    
    handlePopupDescriptionFieldChange(event) {
        this.updateValue('popupDescriptionField', event.detail.value, 'String');
    }
    
    handlePopupAddressFieldChange(event) {
        this.updateValue('popupAddressField', event.detail.value, 'String');
    }
    
    handlePopupCustomFieldsJsonChange(event) {
        this.updateValue('popupCustomFieldsJson', event.target.value, 'String');
    }
    
    handlePopupShowNavigateButtonChange(event) {
        this.updateValue('popupShowNavigateButton', event.target.checked, 'Boolean');
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
                errorString: 'Object is required for Query data source'
            });
        }
        
        return validity;
    }
}
