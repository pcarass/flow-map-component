import { LightningElement, api, track, wire } from 'lwc';
import getFieldsByCategory from '@salesforce/apex/FlowMapSchemaService.getFieldsByCategory';

export default class FlowMapFieldPicker extends LightningElement {
    @api label = 'Select Field';
    @api placeholder = 'Search fields...';
    @api objectApiName;
    @api value;
    @api fieldCategory = 'all';
    @api required = false;
    @api helpText;
    @api disabled = false;
    
    @track fields = [];
    @track filteredFields = [];
    @track isOpen = false;
    @track searchTerm = '';
    @track isLoading = true;
    @track selectedField = null;
    @track errorMessage;
    
    _previousObjectApiName = null;
    
    connectedCallback() {
        this.handleClickOutside = this.handleClickOutside.bind(this);
        document.addEventListener('click', this.handleClickOutside);
    }
    
    disconnectedCallback() {
        document.removeEventListener('click', this.handleClickOutside);
    }
    
    handleClickOutside(event) {
        if (this.isOpen && !this.template.contains(event.target)) {
            this.isOpen = false;
        }
    }
    
    @wire(getFieldsByCategory, { objectApiName: '$objectApiName', fieldCategory: '$fieldCategory' })
    wiredFields({ error, data }) {
        this.isLoading = false;
        if (data) {
            this.fields = data;
            this.filteredFields = data;
            this.errorMessage = null;
            
            // Set selected field if value exists
            if (this.value) {
                this.selectedField = this.fields.find(f => f.value === this.value);
            }
            
            // If object changed, clear previous selection
            if (this._previousObjectApiName && this._previousObjectApiName !== this.objectApiName) {
                this.selectedField = null;
                this.value = '';
            }
            this._previousObjectApiName = this.objectApiName;
            
        } else if (error) {
            this.errorMessage = 'Error loading fields';
            this.fields = [];
            this.filteredFields = [];
            console.error('Error loading fields:', error);
        }
    }
    
    get hasFields() {
        return this.filteredFields && this.filteredFields.length > 0;
    }
    
    get noObjectSelected() {
        return !this.objectApiName;
    }
    
    get noFieldsFound() {
        return this.objectApiName && !this.isLoading && !this.hasFields;
    }
    
    get displayValue() {
        if (this.selectedField) {
            return this.selectedField.label;
        }
        return this.value || '';
    }
    
    get inputValue() {
        if (this.isOpen) {
            return this.searchTerm;
        }
        return this.displayValue;
    }
    
    get dropdownClass() {
        return this.isOpen ? 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click slds-is-open' : 'slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click';
    }
    
    get containerClass() {
        let classes = 'slds-form-element';
        if (this.required && !this.value) {
            classes += ' slds-has-error';
        }
        return classes;
    }
    
    get showClearButton() {
        return this.value && !this.disabled;
    }
    
    handleInputClick(event) {
        event.stopPropagation();
        if (!this.disabled && this.objectApiName) {
            this.isOpen = true;
            this.searchTerm = '';
            this.filteredFields = this.fields;
        }
    }
    
    handleInputChange(event) {
        this.searchTerm = event.target.value;
        
        // Open dropdown when typing
        if (!this.isOpen && this.objectApiName && this.fields.length > 0) {
            this.isOpen = true;
        }
        
        this.filterFields();
    }
    
    handleInputFocus(event) {
        if (!this.disabled && this.objectApiName) {
            this.isOpen = true;
            this.searchTerm = '';
            this.filteredFields = this.fields;
        }
    }
    
    handleKeyDown(event) {
        // Open dropdown on any key press
        if (!this.isOpen && this.objectApiName && this.fields.length > 0) {
            this.isOpen = true;
        }
    }
    
    filterFields() {
        if (!this.searchTerm) {
            this.filteredFields = this.fields;
            return;
        }
        
        const term = this.searchTerm.toLowerCase();
        this.filteredFields = this.fields.filter(field => 
            field.label.toLowerCase().includes(term) || 
            field.value.toLowerCase().includes(term)
        );
    }
    
    handleFieldSelect(event) {
        event.stopPropagation();
        const fieldValue = event.currentTarget.dataset.value;
        this.selectedField = this.fields.find(f => f.value === fieldValue);
        this.value = fieldValue;
        this.isOpen = false;
        this.searchTerm = '';
        this.dispatchChange(fieldValue);
    }
    
    handleClear(event) {
        event.stopPropagation();
        this.value = '';
        this.selectedField = null;
        this.searchTerm = '';
        this.dispatchChange('');
    }
    
    dispatchChange(newValue) {
        this.dispatchEvent(new CustomEvent('change', {
            detail: { value: newValue },
            bubbles: true,
            composed: true
        }));
    }
    
    @api
    setValue(newValue) {
        this.value = newValue;
        if (newValue && this.fields.length > 0) {
            this.selectedField = this.fields.find(f => f.value === newValue);
        } else {
            this.selectedField = null;
        }
    }
    
    @api
    clearValue() {
        this.value = '';
        this.selectedField = null;
        this.searchTerm = '';
    }
}
