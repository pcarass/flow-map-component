import { LightningElement, api, track } from 'lwc';

export default class FlowMapCpe extends LightningElement {
    // Flow Builder provides these
    @api builderContext;
    @api inputVariables;
    @api genericTypeMappings;

    // Local state for UI
    @track _values = {};
    _isInitialized = false;

    connectedCallback() {
        this._initializeValues();
    }

    renderedCallback() {
        if (!this._isInitialized && this.inputVariables) {
            this._initializeValues();
        }
    }

    _initializeValues() {
        if (!this.inputVariables) {
            return;
        }

        this._isInitialized = true;
        
        // Build a map of current values
        const values = {};
        this.inputVariables.forEach(variable => {
            if (variable && variable.name !== undefined) {
                values[variable.name] = variable.value;
            }
        });
        
        this._values = values;
    }

    // Get a value with a default
    _getValue(name, defaultValue) {
        if (this._values && this._values[name] !== undefined && this._values[name] !== null) {
            return this._values[name];
        }
        return defaultValue;
    }

    // Dispatch a value change to Flow Builder
    _dispatchChange(name, value, dataType) {
        this._values[name] = value;
        
        const detail = {
            name: name,
            newValue: value,
            newValueDataType: dataType || 'String'
        };
        
        const event = new CustomEvent('configuration_editor_input_value_changed', {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: detail
        });
        
        this.dispatchEvent(event);
    }

    // ============================================
    // GETTERS FOR UI
    // ============================================
    
    get mapType() {
        return this._getValue('mapType', 'google');
    }

    get height() {
        return this._getValue('height', '400px');
    }

    get zoomLevel() {
        const val = this._getValue('zoomLevel', 10);
        return typeof val === 'number' ? val : parseInt(val, 10) || 10;
    }

    get objectApiName() {
        return this._getValue('objectApiName', '');
    }

    get isGoogleMaps() {
        return this.mapType === 'google';
    }

    get isLeafletMaps() {
        return this.mapType === 'leaflet';
    }

    get googleButtonVariant() {
        return this.isGoogleMaps ? 'brand' : 'neutral';
    }

    get leafletButtonVariant() {
        return this.isLeafletMaps ? 'brand' : 'neutral';
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    handleGoogleClick() {
        this._dispatchChange('mapType', 'google', 'String');
    }

    handleLeafletClick() {
        this._dispatchChange('mapType', 'leaflet', 'String');
    }

    handleHeightChange(event) {
        const value = event.target.value || '400px';
        this._dispatchChange('height', value, 'String');
    }

    handleZoomChange(event) {
        const value = parseInt(event.target.value, 10) || 10;
        this._dispatchChange('zoomLevel', value, 'Integer');
    }

    handleObjectChange(event) {
        const value = event.detail.value || '';
        this._dispatchChange('objectApiName', value, 'String');
    }

    // ============================================
    // VALIDATION
    // ============================================

    @api
    validate() {
        // Return empty array = valid
        // Return array with objects = invalid
        return [];
    }
}
