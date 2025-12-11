import { LightningElement, api, track, wire } from 'lwc';
import getQueryableObjects from '@salesforce/apex/FlowMapSchemaService.getQueryableObjects';

export default class FlowMapCpe extends LightningElement {
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
    
    @api genericTypeMappings;
    
    // Properties
    @track mapType = 'google';
    @track height = '400px';
    @track sourceType = 'query';
    @track objectApiName = '';
    @track titleField = '';
    @track latitudeField = '';
    @track longitudeField = '';
    @track zoomLevel = 10;
    
    @track objectOptions = [];
    @track isLoadingObjects = true;
    
    @wire(getQueryableObjects)
    wiredObjects({ error, data }) {
        this.isLoadingObjects = false;
        if (data) {
            this.objectOptions = data.map(obj => ({
                label: obj.label,
                value: obj.value
            }));
        }
    }
    
    initializeValues() {
        if (!this._inputVariables || this._inputVariables.length === 0) return;
        
        this._inputVariables.forEach(variable => {
            if (variable.value !== undefined && variable.value !== null) {
                const name = variable.name;
                const val = variable.value;
                
                if (name === 'mapType') this.mapType = String(val);
                else if (name === 'height') this.height = String(val);
                else if (name === 'sourceType') this.sourceType = String(val);
                else if (name === 'objectApiName') this.objectApiName = String(val);
                else if (name === 'titleField') this.titleField = String(val);
                else if (name === 'latitudeField') this.latitudeField = String(val);
                else if (name === 'longitudeField') this.longitudeField = String(val);
                else if (name === 'zoomLevel') this.zoomLevel = parseInt(val, 10) || 10;
            }
        });
    }
    
    dispatchValueChange(name, value, dataType) {
        const event = new CustomEvent('configuration_editor_input_value_changed', {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
                name: name,
                newValue: value,
                newValueDataType: dataType
            }
        });
        this.dispatchEvent(event);
    }
    
    // Getters
    get isLeafletMaps() {
        return this.mapType === 'leaflet';
    }
    
    get googleMapClass() {
        return this.mapType === 'google' ? 'map-option selected' : 'map-option';
    }
    
    get leafletMapClass() {
        return this.mapType === 'leaflet' ? 'map-option selected' : 'map-option';
    }
    
    // Handlers
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
    
    handleObjectChange(event) {
        this.objectApiName = event.detail.value;
        this.dispatchValueChange('objectApiName', this.objectApiName, 'String');
    }
    
    handleZoomLevelChange(event) {
        this.zoomLevel = parseInt(event.target.value, 10) || 10;
        this.dispatchValueChange('zoomLevel', this.zoomLevel, 'Integer');
    }
    
    @api
    validate() {
        const validity = [];
        if (this.sourceType === 'query' && !this.objectApiName) {
            validity.push({
                key: 'objectApiName',
                errorString: 'Object is required'
            });
        }
        return validity;
    }
}
