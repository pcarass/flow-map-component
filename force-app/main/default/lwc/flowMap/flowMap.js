import { LightningElement, api, track, wire } from 'lwc';
import { FlowAttributeChangeEvent, FlowNavigationNextEvent } from 'lightning/flowSupport';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getMapData from '@salesforce/apex/FlowMapController.getMapData';
import saveDrawingDocument from '@salesforce/apex/FlowMapController.saveDrawingDocument';
import getDrawingDocument from '@salesforce/apex/FlowMapController.getDrawingDocument';
import LEAFLET from '@salesforce/resourceUrl/leaflet';
import LEAFLET_MARKERCLUSTER from '@salesforce/resourceUrl/leafletMarkerCluster';
import LEAFLET_DRAW from '@salesforce/resourceUrl/leafletDraw';

export default class FlowMap extends LightningElement {
    // ============================================
    // PUBLIC API - Flow Design Attributes
    // ============================================
    
    // Basic Configuration
    @api title;
    @api caption;
    @api iconName;
    @api height = '400px';
    @api isJoined = false;
    
    // Map Type Selection
    @api mapType = 'google'; // 'google' or 'leaflet'
    @api googleMapStyle = 'roadmap'; // 'roadmap', 'satellite', 'terrain', 'hybrid'
    
    // Data Source Configuration (renamed from dataSourceType)
    @api sourceType = 'query'; // 'manual', 'variable', 'query'
    @api objectApiName;
    @api queryFilter;
    @api recordLimit = 100;
    
    // Manual/Variable Data
    @api markersJson; // JSON string for manual/variable markers
    
    // Field Mappings
    @api titleField;
    @api descriptionField;
    @api addressField;
    @api latitudeField;
    @api longitudeField;
    @api cityField;
    @api stateField;
    @api postalCodeField;
    @api streetField;
    @api countryField;
    @api recordIdField = 'Id';
    @api customIconField; // Field containing SVG or icon identifier
    
    // Map Center Configuration
    @api centerLatitude;
    @api centerLongitude;
    @api centerCity;
    @api centerState;
    @api centerPostalCode;
    @api centerCountry;
    @api centerStreet;
    @api displayCenterAsMarker = false;
    
    // Zoom Configuration
    @api zoomLevel = 10;
    
    // Marker Configuration
    @api markerType = 'default'; // 'default', 'circle', 'rectangle', 'polygon', 'pin', 'customIcon'
    @api markerFillColor = '#EA4335';
    @api markerFillOpacity = 0.7;
    @api markerStrokeColor = '#C62828';
    @api markerStrokeWidth = 2;
    @api markerRadius = 10;
    @api markerScale = 1;
    @api customIconSvg;
    
    // Marker Clustering (Leaflet Only) - Boolean defaults changed to false
    @api enableClustering = false;
    @api showCoverageOnHover = false; // Changed from true
    @api maxClusterRadius = 80;
    @api disableClusteringAtZoom;
    
    // Drawing Features (Leaflet Only) - Boolean defaults changed to false
    @api enableDrawing = false;
    @api drawToolMarker = false; // Changed from true
    @api drawToolLine = false; // Changed from true
    @api drawToolPolygon = false; // Changed from true
    @api drawToolCircle = false; // Changed from true
    @api drawToolEdit = false; // Changed from true
    @api drawToolDelete = false; // Changed from true
    @api drawToolbarPosition = 'topright'; // 'topleft', 'topright', 'bottomleft', 'bottomright'
    
    // Drawing Save Configuration
    @api saveAsContentDocument = false;
    @api autoSaveContentDocument = false;
    @api contentDocumentLinkedEntityId;
    @api contentDocumentId;
    @api contentDocumentTitle = 'Flow Map Drawing Document';
    
    // GeoJSON Configuration
    @api geoJsonValue; // Static GeoJSON for display (read-only)
    @api drawContentDocumentId; // Editable GeoJSON from Content Document
    
    // List View Configuration
        @api listViewVisibility = 'auto'; // 'visible', 'hidden', 'auto'
    @api listPosition = 'left'; // 'left' or 'right'
    @api listCollapsible = false;
    
    // Popup customization
    @api enablePopups = false;
    @api popupFieldsJson; // JSON array of field API names to show in popup
    @api showViewRecordAction = true;
    @api showDirectionsAction = true;
    @api showCallAction = false;
    @api phoneField;
    
    // Legacy popup properties (kept for backward compatibility)
    @api popupTitleField;
    @api popupDescriptionField;
    @api popupAddressField;
    @api popupCustomFieldsJson; // JSON: [{"label": "Phone", "field": "Phone"}]
    @api popupShowNavigateButton = false;

    
    // Search Configuration
    @api isSearchable = false;
    @api searchPlaceholder = 'Search locations...';
    @api searchPosition = 'right'; // 'left', 'right', 'center', 'fill'
    
    // Filter Configuration
    @api showFilterOption = false;
    @api filterFieldsJson; // JSON string defining filter fields
    
    // Header Buttons
    @api headerButtonsJson; // JSON string for header buttons
    
    // Marker Dragging
    @api enableMarkerDrag = false;
    
    // ============================================
    // OUTPUT ATTRIBUTES - Flow Outputs
    // ============================================
    @api selectedMarkerId;
    @api selectedMarkerTitle;
    @api selectedMarkerLatitude;
    @api selectedMarkerLongitude;
    @api selectedMarkerData; // Full marker data as JSON
    @api drawnShapesGeoJson;
    @api draggedMarkerData;
    @api headerActionName;
    @api contentDocumentIdOutput;
    
    // ============================================
    // TRACKED INTERNAL STATE
    // ============================================
    @track markers = [];
    @track filteredMarkers = [];
    @track searchTerm = '';
    @track isLoading = true;
    @track errorMessage;
    @track isFilterOpen = false;
    @track filterValues = {};
    @track selectedMarkerIndex = -1;
    @track isListCollapsed = false;
    @track dynamicMapCenter = null; // For programmatic centering
    @track drawingMode = null; // 'marker', 'line', 'polygon', 'circle', 'edit', 'delete'
    @track isPopupOpen = false; // For info popup
    @track selectedMarkerForPopup = null; // Marker data for popup display
    
    // Internal State
    leafletInitialized = false;
    leafletMap;
    markerClusterGroup;
    drawnItems;
    drawControl;
    geoJsonLayer;
    autoSaveTimeout;
    markersLayer;
    
    // ============================================
    // LIFECYCLE HOOKS
    // ============================================
    
    connectedCallback() {
        console.log('FlowMap: connectedCallback');
        console.log('FlowMap: mapType =', this.mapType);
        console.log('FlowMap: sourceType =', this.sourceType);
        console.log('FlowMap: objectApiName =', this.objectApiName);
        console.log('FlowMap: titleField =', this.titleField);
        console.log('FlowMap: streetField =', this.streetField);
        console.log('FlowMap: cityField =', this.cityField);
        console.log('FlowMap: latitudeField =', this.latitudeField);
        console.log('FlowMap: longitudeField =', this.longitudeField);
        console.log('FlowMap: listViewVisibility =', this.listViewVisibility);
        console.log('FlowMap: listPosition =', this.listPosition);
        console.log('FlowMap: listCollapsible =', this.listCollapsible);
        this.loadMapData();
    }
    
    renderedCallback() {
        if (this.useLeafletMaps && !this.leafletInitialized) {
            this.initializeLeaflet();
        }
    }
    
    disconnectedCallback() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
    }
    
    // ============================================
    // COMPUTED PROPERTIES
    // ============================================
    
    get useGoogleMaps() {
        return this.mapType === 'google';
    }
    
    get useLeafletMaps() {
        return this.mapType === 'leaflet';
    }
    
    get showHeader() {
        return this.title || this.caption || this.iconName || this.headerButtons.length > 0 || this.isSearchable || this.showFilterOption;
    }
    
    get headerClasses() {
        let classes = 'slds-card__header slds-grid slds-p-around_small';
        if (this.isJoined) {
            classes += ' joined-header';
        }
        return classes;
    }
    
    get mainContainerClasses() {
        let classes = 'map-main-container slds-grid';
        if (this.showListView && !this.isListCollapsed) {
            classes += ' with-list-view';
        }
        if (this.listPosition === 'right') {
            classes += ' list-right';
        }
        console.log('FlowMap: mainContainerClasses =', classes, '| listPosition =', this.listPosition);
        return classes;
    }
    
    get listContainerClasses() {
        let classes = 'list-view-container';
        if (this.isListCollapsed) {
            classes += ' collapsed';
        }
        return classes;
    }
    
    get showCollapseToggle() {
        return this.listCollapsible && this.showListView;
    }
    
    get collapseToggleIcon() {
        if (this.listPosition === 'right') {
            return this.isListCollapsed ? 'utility:chevronleft' : 'utility:chevronright';
        }
        return this.isListCollapsed ? 'utility:chevronright' : 'utility:chevronleft';
    }
    
    get collapseToggleTitle() {
        return this.isListCollapsed ? 'Expand list' : 'Collapse list';
    }
    
    get isListExpanded() {
        return !this.isListCollapsed;
    }
    
    get collapseButtonClasses() {
        let classes = 'collapse-toggle-button';
        if (this.listPosition === 'right') {
            classes += ' position-right';
        }
        return classes;
    }
    
    get markerCount() {
        return this.filteredMarkers ? this.filteredMarkers.length : 0;
    }
    
    get showListView() {
        if (this.listViewVisibility === 'visible') return true;
        if (this.listViewVisibility === 'hidden') return false;
        // 'auto' - show only when multiple markers
        return this.filteredMarkers.length > 1;
    }
    
    // When our custom list is shown, hide lightning-map's built-in list
    get googleMapsListView() {
        if (this.showListView) {
            return 'hidden';
        }
        return this.listViewVisibility;
    }
    
    get searchContainerClasses() {
        let classes = 'search-container';
        if (this.searchPosition === 'fill') {
            classes += ' slds-grow';
        }
        return classes;
    }
    
    get headerButtons() {
        if (!this.headerButtonsJson) return [];
        try {
            return JSON.parse(this.headerButtonsJson);
        } catch (e) {
            console.error('Invalid headerButtonsJson:', e);
            return [];
        }
    }
    
    get filterFields() {
        if (!this.filterFieldsJson) return [];
        try {
            const fields = JSON.parse(this.filterFieldsJson);
            return fields.map(f => ({
                ...f,
                value: this.filterValues[f.fieldName] || '',
                isPicklist: f.type === 'picklist'
            }));
        } catch (e) {
            console.error('Invalid filterFieldsJson:', e);
            return [];
        }
    }
    
    get noResults() {
        return this.filteredMarkers.length === 0 && !this.isLoading;
    }
    
    // Cached Google Map markers - only recalculate when markers data actually changes
    @track _cachedGoogleMapMarkers = [];
    _lastMarkersHash = '';
    
    get googleMapMarkers() {
        // Create a simple hash of marker IDs to detect actual data changes
        const currentHash = this.filteredMarkers.map(m => m.id).join(',');
        
        // Only recalculate if marker data actually changed
        if (currentHash !== this._lastMarkersHash) {
            this._lastMarkersHash = currentHash;
            this._cachedGoogleMapMarkers = this.filteredMarkers.map(m => ({
                location: {
                    Latitude: m.latitude,
                    Longitude: m.longitude,
                    Street: m.street,
                    City: m.city,
                    State: m.state,
                    PostalCode: m.postalCode,
                    Country: m.country
                },
                title: m.title,
                description: m.description,
                value: m.id,
                icon: this.getMarkerIcon(m)
            }));
            console.log('FlowMap: Rebuilt googleMapMarkers cache, count:', this._cachedGoogleMapMarkers.length);
        }
        
        return this._cachedGoogleMapMarkers;
    }
    
    @track _selectedMarkerValue = null;
    
    get selectedMarkerValue() {
        return this._selectedMarkerValue;
    }
    
    set selectedMarkerValue(value) {
        this._selectedMarkerValue = value;
    }
    
    // Cached map center - only set once during initialization
    @track _cachedMapCenter = null;
    @track _dynamicMapCenter = null; // Set when user selects a marker from list
    _mapCenterInitialized = false;
    
    get mapCenter() {
        // If a marker was selected from the list, center on that marker
        if (this._dynamicMapCenter) {
            return this._dynamicMapCenter;
        }
        
        // Only calculate initial center once - after that, return the cached value
        // This prevents the map from resetting when other props change
        if (this._mapCenterInitialized) {
            return this._cachedMapCenter;
        }
        
        // For Google Maps: Return null to let lightning-map auto-fit to all markers
        // Only override if user explicitly set a center location
        if (this.centerLatitude && this.centerLongitude) {
            this._cachedMapCenter = {
                Latitude: parseFloat(this.centerLatitude),
                Longitude: parseFloat(this.centerLongitude)
            };
        } else if (this.centerCity || this.centerCountry) {
            this._cachedMapCenter = {
                City: this.centerCity,
                State: this.centerState,
                PostalCode: this.centerPostalCode,
                Country: this.centerCountry,
                Street: this.centerStreet
            };
        } else {
            // Return null - let lightning-map auto-fit to markers
            this._cachedMapCenter = null;
        }
        
        this._mapCenterInitialized = true;
        console.log('FlowMap: Initialized mapCenter:', this._cachedMapCenter);
        return this._cachedMapCenter;
    }
    
    /**
     * Center the map on a specific marker (used when clicking list items)
     */
    centerMapOnMarker(marker) {
        if (!marker) return;
        
        if (marker.latitude && marker.longitude) {
            this._dynamicMapCenter = {
                Latitude: parseFloat(marker.latitude),
                Longitude: parseFloat(marker.longitude)
            };
            console.log('FlowMap: Centering map on marker:', marker.title, this._dynamicMapCenter);
        } else if (marker.city || marker.country || marker.street) {
            // Use address-based centering
            this._dynamicMapCenter = {
                City: marker.city,
                State: marker.state,
                PostalCode: marker.postalCode,
                Country: marker.country,
                Street: marker.street
            };
            console.log('FlowMap: Centering map on address:', marker.title, this._dynamicMapCenter);
        }
    }
    
    get showDrawingToolbar() {
        return this.useLeafletMaps && this.enableDrawing;
    }
    
    get drawTools() {
        return {
            marker: this.drawToolMarker,
            line: this.drawToolLine,
            polygon: this.drawToolPolygon,
            circle: this.drawToolCircle,
            edit: this.drawToolEdit,
            delete: this.drawToolDelete
        };
    }
    
    get drawingToolbarClasses() {
        let classes = 'drawing-toolbar';
        switch (this.drawToolbarPosition) {
            case 'topleft':
                classes += ' toolbar-top-left';
                break;
            case 'topright':
                classes += ' toolbar-top-right';
                break;
            case 'bottomleft':
                classes += ' toolbar-bottom-left';
                break;
            case 'bottomright':
                classes += ' toolbar-bottom-right';
                break;
        }
        return classes;
    }
    
    get markerToolClass() {
        return this.drawingMode === 'marker' ? 'tool-active' : '';
    }
    
    get lineToolClass() {
        return this.drawingMode === 'line' ? 'tool-active' : '';
    }
    
    get polygonToolClass() {
        return this.drawingMode === 'polygon' ? 'tool-active' : '';
    }
    
    get circleToolClass() {
        return this.drawingMode === 'circle' ? 'tool-active' : '';
    }
    
    get editToolClass() {
        return this.drawingMode === 'edit' ? 'tool-active' : '';
    }
    
    get deleteToolClass() {
        return this.drawingMode === 'delete' ? 'tool-active' : '';
    }
    
    // ============================================
    // POPUP GETTERS
    // ============================================
    
    get showPopup() {
        return this.enablePopups && this.isPopupOpen && this.selectedMarkerForPopup;
    }
    
    get popupTitle() {
        if (!this.selectedMarkerForPopup) return '';
        return this.selectedMarkerForPopup.title || 'Location Details';
    }
    
    get popupAddress() {
        if (!this.selectedMarkerForPopup) return '';
        const m = this.selectedMarkerForPopup;
        const parts = [m.street, m.city, m.state, m.postalCode, m.country].filter(Boolean);
        return parts.join(', ') || m.address || '';
    }
    
    get popupFields() {
        if (!this.selectedMarkerForPopup || !this.popupFieldsJson) return [];
        
        try {
            const fieldNames = JSON.parse(this.popupFieldsJson);
            const rawData = this.selectedMarkerForPopup.rawData || {};
            
            return fieldNames.map((fieldName, index) => {
                // Get the label from the field name (convert API name to label)
                const label = this.formatFieldLabel(fieldName);
                const value = rawData[fieldName] || '';
                
                return {
                    key: `field-${index}`,
                    label: label,
                    value: value !== null && value !== undefined ? String(value) : ''
                };
            }).filter(f => f.value); // Only show fields with values
        } catch (e) {
            console.error('Error parsing popupFieldsJson:', e);
            return [];
        }
    }
    
    get showCallActionButton() {
        if (!this.showCallAction || !this.selectedMarkerForPopup) return false;
        
        // Check if we have a phone number
        const phoneNumber = this.getPhoneNumber();
        return !!phoneNumber;
    }
    
    formatFieldLabel(fieldName) {
        // Convert API name to readable label (e.g., "BillingCity" -> "Billing City")
        if (!fieldName) return '';
        return fieldName
            .replace(/__c$/i, '') // Remove custom field suffix
            .replace(/([A-Z])/g, ' $1') // Add space before capitals
            .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
            .trim();
    }
    
    getPhoneNumber() {
        if (!this.selectedMarkerForPopup) return null;
        const rawData = this.selectedMarkerForPopup.rawData || {};
        
        // If phoneField is specified, use it
        if (this.phoneField) {
            return rawData[this.phoneField];
        }
        
        // Otherwise try common phone field names
        return rawData.Phone || rawData.phone || rawData.MobilePhone || rawData.HomePhone || null;
    }
    
    // ============================================
    // POPUP HANDLERS
    // ============================================
    
    openPopup(marker) {
        this.selectedMarkerForPopup = marker;
        this.isPopupOpen = true;
    }
    
    closePopup() {
        this.isPopupOpen = false;
        this.selectedMarkerForPopup = null;
    }
    
    handleViewRecord() {
        if (!this.selectedMarkerForPopup) return;
        
        const recordId = this.selectedMarkerForPopup.id;
        if (recordId && recordId.length >= 15) {
            // Open record in new tab
            window.open(`/${recordId}`, '_blank');
        }
    }
    
    handleGetDirections() {
        if (!this.selectedMarkerForPopup) return;
        
        const m = this.selectedMarkerForPopup;
        let destination = '';
        
        if (m.latitude && m.longitude) {
            destination = `${m.latitude},${m.longitude}`;
        } else {
            const addressParts = [m.street, m.city, m.state, m.postalCode, m.country].filter(Boolean);
            destination = addressParts.join(', ');
        }
        
        if (destination) {
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
            window.open(mapsUrl, '_blank');
        }
    }
    
    handleCallAction() {
        const phoneNumber = this.getPhoneNumber();
        if (phoneNumber) {
            // Clean the phone number and open tel: link
            const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
            window.open(`tel:${cleanNumber}`, '_self');
        }
    }
    
    // ============================================
    // DATA LOADING
    // ============================================
    
    async loadMapData() {
        this.isLoading = true;
        this.errorMessage = null;
        
        try {
            if (this.sourceType === 'manual' || this.sourceType === 'variable') {
                await this.loadMarkersFromJson();
            } else {
                await this.loadMarkersFromQuery();
            }
            
            this.filteredMarkers = [...this.markers];
            this.applyMarkerListClasses();
            
            // Load existing drawings if applicable
            if (this.useLeafletMaps && this.drawContentDocumentId) {
                await this.loadDrawingsFromDocument();
            }
            
        } catch (error) {
            this.errorMessage = this.extractErrorMessage(error);
            console.error('Error loading map data:', error);
            console.error('Error details - body:', error?.body);
            console.error('Error details - message:', error?.message);
            console.error('Error details - stack:', error?.stack);
        } finally {
            this.isLoading = false;
        }
    }
    
    loadMarkersFromJson() {
        return new Promise((resolve, reject) => {
            if (!this.markersJson) {
                this.markers = [];
                resolve();
                return;
            }
            
            try {
                const parsedMarkers = JSON.parse(this.markersJson);
                this.markers = this.normalizeMarkers(parsedMarkers);
                resolve();
            } catch (e) {
                reject(new Error('Invalid markers JSON: ' + e.message));
            }
        });
    }
    
    async loadMarkersFromQuery() {
        if (!this.objectApiName) {
            console.log('FlowMap: No objectApiName provided, skipping query');
            this.markers = [];
            return;
        }
        
        const fieldMappings = {
            titleField: this.titleField,
            descriptionField: this.descriptionField,
            addressField: this.addressField,
            latitudeField: this.latitudeField,
            longitudeField: this.longitudeField,
            cityField: this.cityField,
            stateField: this.stateField,
            postalCodeField: this.postalCodeField,
            streetField: this.streetField,
            countryField: this.countryField,
            recordIdField: this.recordIdField,
            customIconField: this.customIconField
        };
        
        console.log('FlowMap: Loading data for', this.objectApiName);
        console.log('FlowMap: Field mappings:', JSON.stringify(fieldMappings));
        console.log('FlowMap: Filter:', this.queryFilter);
        console.log('FlowMap: Limit:', this.recordLimit);
        
        const result = await getMapData({
            objectApiName: this.objectApiName,
            fieldMappingsJson: JSON.stringify(fieldMappings),
            filterClause: this.queryFilter,
            recordLimit: this.recordLimit
        });
        
        console.log('FlowMap: Received', result?.length || 0, 'records');
        
        this.markers = this.normalizeMarkers(result);
        console.log('FlowMap: Normalized to', this.markers.length, 'markers');
    }
    
    normalizeMarkers(rawMarkers) {
        if (!Array.isArray(rawMarkers)) return [];
        
        return rawMarkers.map((m, index) => {
            // Handle compound address field (returns an object in Salesforce)
            let addressString = '';
            if (m.address && typeof m.address === 'object') {
                // Compound address - extract components
                addressString = [
                    m.address.street,
                    m.address.city,
                    m.address.state,
                    m.address.postalCode,
                    m.address.country
                ].filter(Boolean).join(', ');
            } else if (typeof m.address === 'string') {
                addressString = m.address;
            } else if (typeof m.Address === 'string') {
                addressString = m.Address;
            }
            
            const marker = {
                id: m.id || m.Id || m.recordId || `marker_${index}`,
                title: m.title || m.Title || m.name || m.Name || `Location ${index + 1}`,
                description: m.description || m.Description || '',
                latitude: parseFloat(m.latitude || m.Latitude || m.lat) || null,
                longitude: parseFloat(m.longitude || m.Longitude || m.lng || m.lon) || null,
                address: addressString,
                street: m.street || m.Street || '',
                city: m.city || m.City || '',
                state: m.state || m.State || '',
                postalCode: m.postalCode || m.PostalCode || '',
                country: m.country || m.Country || '',
                customIcon: m.customIcon || m.icon || null,
                rawData: m,
                listItemClass: 'slds-item marker-list-item'
            };
            
            // Build address if not provided but components exist
            if (!marker.address && (marker.street || marker.city)) {
                marker.address = [marker.street, marker.city, marker.state, marker.postalCode, marker.country]
                    .filter(Boolean)
                    .join(', ');
            }
            
            return marker;
        });
    }
    
    applyMarkerListClasses() {
        this.filteredMarkers = this.filteredMarkers.map((m, index) => ({
            ...m,
            listItemClass: index === this.selectedMarkerIndex 
                ? 'slds-item marker-list-item selected' 
                : 'slds-item marker-list-item'
        }));
    }
    
    getMarkerIcon(marker) {
        if (this.markerType === 'customIcon' && (marker.customIcon || this.customIconSvg)) {
            return marker.customIcon || this.customIconSvg;
        }
        return 'standard:location';
    }
    
    extractErrorMessage(error) {
        if (typeof error === 'string') return error;
        if (error.body && error.body.message) return error.body.message;
        if (error.message) return error.message;
        return 'An unknown error occurred';
    }
    
    // ============================================
    // LEAFLET INITIALIZATION
    // ============================================
    
    async initializeLeaflet() {
        try {
            // Load Leaflet CSS and JS
            await Promise.all([
                loadStyle(this, LEAFLET + '/leaflet.css'),
                loadScript(this, LEAFLET + '/leaflet.js')
            ]);
            
            // Load clustering plugin if enabled
            if (this.enableClustering) {
                await Promise.all([
                    loadStyle(this, LEAFLET_MARKERCLUSTER + '/MarkerCluster.css'),
                    loadStyle(this, LEAFLET_MARKERCLUSTER + '/MarkerCluster.Default.css'),
                    loadScript(this, LEAFLET_MARKERCLUSTER + '/leaflet.markercluster.js')
                ]);
            }
            
            // Load drawing plugin if enabled
            if (this.enableDrawing) {
                await Promise.all([
                    loadStyle(this, LEAFLET_DRAW + '/leaflet.draw.css'),
                    loadScript(this, LEAFLET_DRAW + '/leaflet.draw.js')
                ]);
            }
            
            this.leafletInitialized = true;
            this.createLeafletMap();
            
        } catch (error) {
            console.error('Error loading Leaflet:', error);
            this.errorMessage = 'Failed to load map library: ' + this.extractErrorMessage(error);
        }
    }
    
    createLeafletMap() {
        const mapContainer = this.refs.leafletMap;
        if (!mapContainer || !window.L) return;
        
        // Calculate center
        let center = [0, 0];
        let zoom = this.zoomLevel || 10;
        
        if (this.centerLatitude && this.centerLongitude) {
            center = [parseFloat(this.centerLatitude), parseFloat(this.centerLongitude)];
        } else if (this.filteredMarkers.length > 0) {
            const validMarkers = this.filteredMarkers.filter(m => m.latitude && m.longitude);
            if (validMarkers.length > 0) {
                const avgLat = validMarkers.reduce((sum, m) => sum + m.latitude, 0) / validMarkers.length;
                const avgLng = validMarkers.reduce((sum, m) => sum + m.longitude, 0) / validMarkers.length;
                center = [avgLat, avgLng];
            }
        }
        
        // Create map
        this.leafletMap = L.map(mapContainer, {
            center: center,
            zoom: zoom,
            scrollWheelZoom: true
        });
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.leafletMap);
        
        // Initialize layers
        this.markersLayer = L.layerGroup().addTo(this.leafletMap);
        
        // Add clustering if enabled
        if (this.enableClustering && window.L.markerClusterGroup) {
            this.markerClusterGroup = L.markerClusterGroup({
                showCoverageOnHover: this.showCoverageOnHover,
                maxClusterRadius: this.maxClusterRadius,
                disableClusteringAtZoom: this.disableClusteringAtZoom
            });
            this.leafletMap.addLayer(this.markerClusterGroup);
        }
        
        // Initialize drawing layer
        if (this.enableDrawing && window.L.Draw) {
            this.drawnItems = new L.FeatureGroup();
            this.leafletMap.addLayer(this.drawnItems);
            
            // Handle draw events
            this.leafletMap.on(L.Draw.Event.CREATED, this.handleDrawCreated.bind(this));
            this.leafletMap.on(L.Draw.Event.EDITED, this.handleDrawEdited.bind(this));
            this.leafletMap.on(L.Draw.Event.DELETED, this.handleDrawDeleted.bind(this));
        }
        
        // Load static GeoJSON if provided
        if (this.geoJsonValue) {
            this.loadStaticGeoJson();
        }
        
        // Add markers
        this.addLeafletMarkers();
        
        // Add center marker if configured
        if (this.displayCenterAsMarker && this.centerLatitude && this.centerLongitude) {
            this.addCenterMarker();
        }
        
        // Fit bounds to markers
        this.fitBoundsToMarkers();
    }
    
    addLeafletMarkers() {
        const targetLayer = this.markerClusterGroup || this.markersLayer;
        targetLayer.clearLayers();
        
        this.filteredMarkers.forEach((marker, index) => {
            if (!marker.latitude || !marker.longitude) return;
            
            const leafletMarker = this.createLeafletMarker(marker, index);
            targetLayer.addLayer(leafletMarker);
        });
    }
    
    createLeafletMarker(marker, index) {
        let leafletMarker;
        
        switch (this.markerType) {
            case 'circle':
                leafletMarker = L.circleMarker([marker.latitude, marker.longitude], {
                    radius: this.markerRadius * this.markerScale,
                    fillColor: this.markerFillColor,
                    fillOpacity: this.markerFillOpacity,
                    color: this.markerStrokeColor,
                    weight: this.markerStrokeWidth
                });
                break;
                
            case 'customIcon':
                const icon = this.createCustomIcon(marker);
                leafletMarker = L.marker([marker.latitude, marker.longitude], { 
                    icon: icon,
                    draggable: this.enableMarkerDrag
                });
                break;
                
            default:
                // Default pin marker
                const defaultIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color:${this.markerFillColor};width:24px;height:24px;border-radius:50% 50% 50% 0;border:2px solid ${this.markerStrokeColor};transform:rotate(-45deg);"></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 24]
                });
                leafletMarker = L.marker([marker.latitude, marker.longitude], { 
                    icon: defaultIcon,
                    draggable: this.enableMarkerDrag
                });
        }
        
        // Add popup
        if (marker.title || marker.description) {
            const popupContent = `
                <div class="marker-popup">
                    <strong>${marker.title || ''}</strong>
                    ${marker.description ? `<p>${marker.description}</p>` : ''}
                    ${marker.address ? `<p class="address">${marker.address}</p>` : ''}
                </div>
            `;
            leafletMarker.bindPopup(popupContent);
        }
        
        // Store marker data
        leafletMarker.markerData = marker;
        leafletMarker.markerIndex = index;
        
        // Add event handlers
        leafletMarker.on('click', this.handleLeafletMarkerClick.bind(this));
        
        if (this.enableMarkerDrag) {
            leafletMarker.on('dragend', this.handleMarkerDragEnd.bind(this));
        }
        
        return leafletMarker;
    }
    
    createCustomIcon(marker) {
        const svgContent = marker.customIcon || this.customIconSvg;
        
        if (svgContent) {
            return L.divIcon({
                className: 'custom-svg-icon',
                html: svgContent,
                iconSize: [32 * this.markerScale, 32 * this.markerScale],
                iconAnchor: [16 * this.markerScale, 32 * this.markerScale]
            });
        }
        
        // Fallback default icon
        return L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41]
        });
    }
    
    addCenterMarker() {
        if (!this.leafletMap) return;
        
        const centerIcon = L.divIcon({
            className: 'center-marker',
            html: '<div style="background-color:#1589ee;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11]
        });
        
        L.marker([parseFloat(this.centerLatitude), parseFloat(this.centerLongitude)], {
            icon: centerIcon
        }).addTo(this.leafletMap);
    }
    
    loadStaticGeoJson() {
        if (!this.leafletMap) return;
        
        try {
            let geoJsonData;
            
            if (typeof this.geoJsonValue === 'string') {
                // Check if it's a Content Document ID (18 chars starting with 069)
                if (this.geoJsonValue.length === 18 && this.geoJsonValue.startsWith('069')) {
                    // Load from Content Document - handled separately
                    this.loadGeoJsonFromDocument(this.geoJsonValue, false);
                    return;
                }
                geoJsonData = JSON.parse(this.geoJsonValue);
            } else {
                geoJsonData = this.geoJsonValue;
            }
            
            this.geoJsonLayer = L.geoJSON(geoJsonData, {
                style: {
                    fillColor: this.markerFillColor,
                    fillOpacity: this.markerFillOpacity,
                    color: this.markerStrokeColor,
                    weight: this.markerStrokeWidth
                }
            }).addTo(this.leafletMap);
            
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
        }
    }
    
    async loadGeoJsonFromDocument(documentId, editable = false) {
        try {
            const content = await getDrawingDocument({ contentDocumentId: documentId });
            if (content) {
                const geoJsonData = JSON.parse(content);
                
                if (editable && this.drawnItems) {
                    L.geoJSON(geoJsonData).eachLayer(layer => {
                        this.drawnItems.addLayer(layer);
                    });
                } else {
                    this.geoJsonLayer = L.geoJSON(geoJsonData, {
                        style: {
                            fillColor: this.markerFillColor,
                            fillOpacity: this.markerFillOpacity,
                            color: this.markerStrokeColor,
                            weight: this.markerStrokeWidth
                        }
                    }).addTo(this.leafletMap);
                }
            }
        } catch (error) {
            console.error('Error loading GeoJSON from document:', error);
        }
    }
    
    async loadDrawingsFromDocument() {
        if (!this.drawContentDocumentId) return;
        await this.loadGeoJsonFromDocument(this.drawContentDocumentId, true);
    }
    
    fitBoundsToMarkers() {
        if (!this.leafletMap) return;
        
        const validMarkers = this.filteredMarkers.filter(m => m.latitude && m.longitude);
        if (validMarkers.length === 0) return;
        
        const bounds = L.latLngBounds(validMarkers.map(m => [m.latitude, m.longitude]));
        this.leafletMap.fitBounds(bounds, { padding: [50, 50] });
    }
    
    // ============================================
    // EVENT HANDLERS
    // ============================================
    
    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        this.filterMarkers();
    }

    handleCollapseToggle() {
        this.isListCollapsed = !this.isListCollapsed;
    }
    
    
    filterMarkers() {
        let filtered = [...this.markers];
        
        // Apply search filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(m => 
                (m.title && m.title.toLowerCase().includes(term)) ||
                (m.description && m.description.toLowerCase().includes(term)) ||
                (m.address && m.address.toLowerCase().includes(term))
            );
        }
        
        // Apply field filters
        Object.entries(this.filterValues).forEach(([field, value]) => {
            if (value) {
                filtered = filtered.filter(m => {
                    const fieldValue = m.rawData && m.rawData[field];
                    return fieldValue && String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
                });
            }
        });
        
        this.filteredMarkers = filtered;
        this.applyMarkerListClasses();
        
        // Update Leaflet markers
        if (this.useLeafletMaps && this.leafletInitialized) {
            this.addLeafletMarkers();
            this.fitBoundsToMarkers();
        }
    }
    
    handleFilterClick() {
        this.isFilterOpen = !this.isFilterOpen;
    }
    
    handleFilterClose() {
        this.isFilterOpen = false;
    }
    
    handleFilterChange(event) {
        const field = event.target.dataset.field;
        this.filterValues = { ...this.filterValues, [field]: event.target.value };
    }
    
    applyFilters() {
        this.filterMarkers();
        this.isFilterOpen = false;
    }
    
    clearFilters() {
        this.filterValues = {};
        this.searchTerm = '';
        this.filterMarkers();
    }
    
    handleListItemClick(event) {
        const index = parseInt(event.currentTarget.dataset.index, 10);
        const markerId = event.currentTarget.dataset.id;
        console.log('FlowMap: List item clicked - index:', index, 'markerId:', markerId);
        this.selectMarker(index, markerId);
    }
    
    handleGoogleMarkerSelect(event) {
        const selectedValue = event.detail.selectedMarkerValue;
        console.log('FlowMap: Google marker selected - value:', selectedValue);
        const index = this.filteredMarkers.findIndex(m => m.id === selectedValue);
        if (index >= 0) {
            this.selectMarker(index, selectedValue);
        }
    }
    
    handleLeafletMarkerClick(event) {
        const marker = event.target;
        this.selectMarker(marker.markerIndex, marker.markerData.id);
    }
    
    selectMarker(index, markerId) {
        // Prevent re-selection of same marker (avoids unnecessary re-renders)
        if (this.selectedMarkerIndex === index) {
            // If same marker clicked again and popups enabled, toggle popup
            if (this.enablePopups && this.filteredMarkers[index]) {
                if (this.isPopupOpen) {
                    this.closePopup();
                } else {
                    this.openPopup(this.filteredMarkers[index]);
                }
            }
            return;
        }
        
        console.log('FlowMap: selectMarker called - index:', index, 'markerId:', markerId);
        
        this.selectedMarkerIndex = index;
        const marker = this.filteredMarkers[index];
        
        if (marker) {
            // Update output attributes locally first
            this.selectedMarkerId = marker.id;
            this.selectedMarkerTitle = marker.title;
            this.selectedMarkerLatitude = marker.latitude;
            this.selectedMarkerLongitude = marker.longitude;
            this.selectedMarkerData = JSON.stringify(marker.rawData);
            
            // Update selected marker value for Google Maps binding
            // This triggers the lightning-map to highlight/select the marker
            this._selectedMarkerValue = marker.id;
            
            // Update list styling immediately
            this.applyMarkerListClasses();
            
            // Center map on selected marker
            if (this.useLeafletMaps && this.leafletMap && marker.latitude && marker.longitude) {
                // Leaflet: Use setView to pan and zoom
                this.leafletMap.setView([marker.latitude, marker.longitude], this.zoomLevel || 14);
            } else if (!this.useLeafletMaps) {
                // Google Maps: Update the center property to pan to the marker
                this.centerMapOnMarker(marker);
            }
            
            // Open popup if enabled
            if (this.enablePopups) {
                this.openPopup(marker);
            }
            
            // Batch dispatch Flow attribute changes to prevent multiple re-renders
            Promise.resolve().then(() => {
                this.dispatchFlowAttributeChange('selectedMarkerId', marker.id);
                this.dispatchFlowAttributeChange('selectedMarkerTitle', marker.title);
                this.dispatchFlowAttributeChange('selectedMarkerLatitude', marker.latitude);
                this.dispatchFlowAttributeChange('selectedMarkerLongitude', marker.longitude);
                this.dispatchFlowAttributeChange('selectedMarkerData', JSON.stringify(marker.rawData));
            });
            
            // Dispatch custom event for interactions
            this.dispatchEvent(new CustomEvent('markerselect', {
                detail: { marker: marker }
            }));
        }
    }
    
    handleMarkerDragEnd(event) {
        const marker = event.target;
        const newLatLng = marker.getLatLng();
        const markerData = marker.markerData;
        
        const dragData = {
            id: markerData.id,
            title: markerData.title,
            originalLatitude: markerData.latitude,
            originalLongitude: markerData.longitude,
            newLatitude: newLatLng.lat,
            newLongitude: newLatLng.lng
        };
        
        this.draggedMarkerData = JSON.stringify(dragData);
        this.dispatchFlowAttributeChange('draggedMarkerData', this.draggedMarkerData);
        
        this.dispatchEvent(new CustomEvent('markerdrag', {
            detail: dragData
        }));
    }
    
    handleHeaderButtonClick(event) {
        const buttonName = event.target.dataset.name;
        this.headerActionName = buttonName;
        this.dispatchFlowAttributeChange('headerActionName', buttonName);
        
        this.dispatchEvent(new CustomEvent('headeraction', {
            detail: { actionName: buttonName }
        }));
    }
    
    // ============================================
    // DRAWING HANDLERS
    // ============================================
    
    handleDrawMarker() {
        this.activateDrawingMode('marker');
        new L.Draw.Marker(this.leafletMap, {}).enable();
    }
    
    handleDrawLine() {
        this.activateDrawingMode('line');
        new L.Draw.Polyline(this.leafletMap, {
            shapeOptions: {
                color: this.markerStrokeColor,
                weight: this.markerStrokeWidth
            }
        }).enable();
    }
    
    handleDrawPolygon() {
        this.activateDrawingMode('polygon');
        new L.Draw.Polygon(this.leafletMap, {
            shapeOptions: {
                color: this.markerStrokeColor,
                weight: this.markerStrokeWidth,
                fillColor: this.markerFillColor,
                fillOpacity: this.markerFillOpacity
            }
        }).enable();
    }
    
    handleDrawCircle() {
        this.activateDrawingMode('circle');
        new L.Draw.Circle(this.leafletMap, {
            shapeOptions: {
                color: this.markerStrokeColor,
                weight: this.markerStrokeWidth,
                fillColor: this.markerFillColor,
                fillOpacity: this.markerFillOpacity
            }
        }).enable();
    }
    
    handleEditMode() {
        if (this.drawingMode === 'edit') {
            this.drawingMode = null;
            this.drawnItems.eachLayer(layer => {
                if (layer.editing) layer.editing.disable();
            });
        } else {
            this.activateDrawingMode('edit');
            this.drawnItems.eachLayer(layer => {
                if (layer.editing) layer.editing.enable();
            });
        }
    }
    
    handleDeleteMode() {
        if (this.drawingMode === 'delete') {
            this.drawingMode = null;
        } else {
            this.activateDrawingMode('delete');
            // Delete mode - clicking on shapes will remove them
        }
    }
    
    activateDrawingMode(mode) {
        this.drawingMode = mode;
    }
    
    handleDrawCreated(event) {
        const layer = event.layer;
        this.drawnItems.addLayer(layer);
        this.updateDrawnShapesOutput();
        
        if (this.drawingMode === 'delete') {
            layer.on('click', () => {
                this.drawnItems.removeLayer(layer);
                this.updateDrawnShapesOutput();
            });
        }
        
        this.drawingMode = null;
    }
    
    handleDrawEdited(event) {
        this.updateDrawnShapesOutput();
    }
    
    handleDrawDeleted(event) {
        this.updateDrawnShapesOutput();
    }
    
    updateDrawnShapesOutput() {
        if (!this.drawnItems) return;
        
        const geoJson = this.drawnItems.toGeoJSON();
        this.drawnShapesGeoJson = JSON.stringify(geoJson);
        this.dispatchFlowAttributeChange('drawnShapesGeoJson', this.drawnShapesGeoJson);
        
        // Auto-save if enabled
        if (this.autoSaveContentDocument && this.contentDocumentLinkedEntityId) {
            this.scheduleAutoSave();
        }
    }
    
    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            this.saveDrawings();
        }, 2000); // 2 second debounce
    }
    
    async saveDrawings() {
        if (!this.saveAsContentDocument || !this.contentDocumentLinkedEntityId) return;
        
        try {
            const geoJson = this.drawnItems.toGeoJSON();
            const result = await saveDrawingDocument({
                linkedEntityId: this.contentDocumentLinkedEntityId,
                geoJsonContent: JSON.stringify(geoJson),
                title: this.contentDocumentTitle,
                existingDocumentId: this.contentDocumentId
            });
            
            this.contentDocumentIdOutput = result;
            this.dispatchFlowAttributeChange('contentDocumentIdOutput', result);
            
            this.showToast('Success', 'Map drawings saved', 'success');
            
        } catch (error) {
            console.error('Error saving drawings:', error);
            this.showToast('Error', 'Failed to save drawings: ' + this.extractErrorMessage(error), 'error');
        }
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    dispatchFlowAttributeChange(attributeName, value) {
        const event = new FlowAttributeChangeEvent(attributeName, value);
        this.dispatchEvent(event);
    }
    
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        }));
    }
    
    // ============================================
    // PUBLIC METHODS (Callable from Flow)
    // ============================================
    
    @api
    refreshData() {
        this.loadMapData();
    }
    
    @api
    centerOnMarker(markerId) {
        const index = this.filteredMarkers.findIndex(m => m.id === markerId);
        if (index >= 0) {
            this.selectMarker(index, markerId);
        }
    }
    
    @api
    saveMapDrawings() {
        return this.saveDrawings();
    }
    
    @api
    validate() {
        // For Flow validation if needed
        return { isValid: true };
    }
}
