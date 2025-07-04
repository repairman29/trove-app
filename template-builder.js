// Template Builder System
// Handles creation, management, and usage of custom collection templates

class TemplateBuilder {
    constructor() {
        this.currentTemplate = {
            name: '',
            description: '',
            icon: '',
            attributes: []
        };
        this.attributeCounter = 0;
        this.isEditing = false;
        this.editingId = null;
        
        // Available data types for attributes
        this.dataTypes = {
            'text': 'Text',
            'paragraph': 'Paragraph',
            'number': 'Number',
            'date': 'Date',
            'boolean': 'Yes/No',
            'dropdown': 'Dropdown',
            'url': 'URL'
        };
        
        this.init();
    }
    
    async init() {
        // Check if user can create templates (subscription-based)
        const user = auth.currentUser;
        if (!user) {
            this.showError('Please sign in to access Template Builder');
            return;
        }

        const canCreate = await subscriptionManager.canCreateTemplates(user.uid);
        if (!canCreate) {
            // Show upgrade prompt instead of error
            subscriptionManager.showTemplateBuilderUpgradePrompt();
            return;
        }

        // Initialize event listeners and setup
        this.setupEventListeners();
        this.loadExistingTemplates();
    }
    
    setupEventListeners() {
        // Form input listeners for real-time updates
        document.getElementById('templateName').addEventListener('input', () => {
            this.updateCurrentTemplate();
        });
        
        document.getElementById('templateDescription').addEventListener('input', () => {
            this.updateCurrentTemplate();
        });
        
        // Icon selection
        document.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectIcon(e.target.dataset.icon);
            });
        });
    }
    
    updateCurrentTemplate() {
        this.currentTemplate.name = document.getElementById('templateName').value;
        this.currentTemplate.description = document.getElementById('templateDescription').value;
        this.currentTemplate.icon = document.querySelector('.icon-option.selected')?.dataset.icon || '';
    }
    
    selectIcon(icon) {
        document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
        document.querySelector(`[data-icon="${icon}"]`).classList.add('selected');
        this.currentTemplate.icon = icon;
    }
    
    addAttribute() {
        const attributeId = `attr_${this.attributeCounter++}`;
        const attributeHtml = this.generateAttributeHtml(attributeId);
        
        const attributesList = document.getElementById('attributesList');
        const attributeDiv = document.createElement('div');
        attributeDiv.className = 'attribute-item';
        attributeDiv.id = attributeId;
        attributeDiv.innerHTML = attributeHtml;
        
        attributesList.appendChild(attributeDiv);
        
        // Setup event listeners for this attribute
        this.setupAttributeEventListeners(attributeId);
        
        // Add to current template
        this.currentTemplate.attributes.push({
            id: attributeId,
            name: '',
            type: 'text',
            required: false,
            options: []
        });
        
        this.updatePreview();
    }
    
    generateAttributeHtml(attributeId) {
        const dataTypeOptions = Object.entries(this.dataTypes)
            .map(([key, value]) => `<option value="${key}">${value}</option>`)
            .join('');
        
        return `
            <div class="attribute-header">
                <div class="attribute-title">New Attribute</div>
                <div class="attribute-actions">
                    <button class="btn btn-small btn-secondary" onclick="templateBuilder.moveAttribute('${attributeId}', 'up')">↑</button>
                    <button class="btn btn-small btn-secondary" onclick="templateBuilder.moveAttribute('${attributeId}', 'down')">↓</button>
                    <button class="btn btn-small btn-danger" onclick="templateBuilder.removeAttribute('${attributeId}')">×</button>
                </div>
            </div>
            
            <div class="attribute-config">
                <div class="form-group">
                    <label class="form-label">Attribute Name *</label>
                    <input type="text" class="form-input attr-name" placeholder="e.g., Publisher" required>
                    <small class="form-help">The label users will see</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Data Type *</label>
                    <select class="form-input attr-type" required>
                        ${dataTypeOptions}
                    </select>
                    <small class="form-help">How users will input data</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Required?</label>
                    <div class="toggle-switch">
                        <input type="checkbox" class="attr-required" id="req_${attributeId}">
                        <label for="req_${attributeId}" class="toggle-label">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <small class="form-help">Must be filled out</small>
                </div>
            </div>
            
            <div class="predefined-values" id="predefined_${attributeId}">
                <div class="form-group">
                    <label class="form-label">Predefined Options</label>
                    <div class="tags-input">
                        <input type="text" class="form-input options-input" placeholder="Type option and press Enter">
                        <div class="tags-container" id="options_${attributeId}"></div>
                    </div>
                    <small class="form-help">Enter the dropdown options users can choose from</small>
                </div>
            </div>
        `;
    }
    
    setupAttributeEventListeners(attributeId) {
        const attributeElement = document.getElementById(attributeId);
        
        // Attribute name input
        const nameInput = attributeElement.querySelector('.attr-name');
        nameInput.addEventListener('input', (e) => {
            this.updateAttributeTitle(attributeId, e.target.value);
            this.updateAttributeData(attributeId, 'name', e.target.value);
        });
        
        // Data type selection
        const typeSelect = attributeElement.querySelector('.attr-type');
        typeSelect.addEventListener('change', (e) => {
            this.updateAttributeData(attributeId, 'type', e.target.value);
            this.togglePredefinedValues(attributeId, e.target.value);
            this.updatePreview();
        });
        
        // Required checkbox
        const requiredCheckbox = attributeElement.querySelector('.attr-required');
        requiredCheckbox.addEventListener('change', (e) => {
            this.updateAttributeData(attributeId, 'required', e.target.checked);
            this.updatePreview();
        });
        
        // Options input for dropdown type
        const optionsInput = attributeElement.querySelector('.options-input');
        optionsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addOption(attributeId, e.target.value);
                e.target.value = '';
            }
        });
    }
    
    updateAttributeTitle(attributeId, name) {
        const titleElement = document.querySelector(`#${attributeId} .attribute-title`);
        titleElement.textContent = name || 'New Attribute';
    }
    
    updateAttributeData(attributeId, field, value) {
        const attribute = this.currentTemplate.attributes.find(attr => attr.id === attributeId);
        if (attribute) {
            attribute[field] = value;
        }
    }
    
    togglePredefinedValues(attributeId, dataType) {
        const predefinedDiv = document.getElementById(`predefined_${attributeId}`);
        if (dataType === 'dropdown') {
            predefinedDiv.classList.add('show');
        } else {
            predefinedDiv.classList.remove('show');
        }
    }
    
    addOption(attributeId, optionText) {
        if (!optionText.trim()) return;
        
        const attribute = this.currentTemplate.attributes.find(attr => attr.id === attributeId);
        if (!attribute) return;
        
        if (!attribute.options) attribute.options = [];
        attribute.options.push(optionText.trim());
        
        this.renderOptions(attributeId);
        this.updatePreview();
    }
    
    renderOptions(attributeId) {
        const attribute = this.currentTemplate.attributes.find(attr => attr.id === attributeId);
        if (!attribute || !attribute.options) return;
        
        const optionsContainer = document.getElementById(`options_${attributeId}`);
        optionsContainer.innerHTML = '';
        
        attribute.options.forEach((option, index) => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${option}
                <span class="remove" onclick="templateBuilder.removeOption('${attributeId}', ${index})">×</span>
            `;
            optionsContainer.appendChild(tagElement);
        });
    }
    
    removeOption(attributeId, optionIndex) {
        const attribute = this.currentTemplate.attributes.find(attr => attr.id === attributeId);
        if (attribute && attribute.options) {
            attribute.options.splice(optionIndex, 1);
            this.renderOptions(attributeId);
            this.updatePreview();
        }
    }
    
    moveAttribute(attributeId, direction) {
        const attributesList = document.getElementById('attributesList');
        const attributeElement = document.getElementById(attributeId);
        
        if (direction === 'up' && attributeElement.previousElementSibling) {
            attributesList.insertBefore(attributeElement, attributeElement.previousElementSibling);
        } else if (direction === 'down' && attributeElement.nextElementSibling) {
            attributesList.insertBefore(attributeElement.nextElementSibling, attributeElement);
        }
        
        // Update the order in currentTemplate.attributes
        this.reorderAttributes();
        this.updatePreview();
    }
    
    reorderAttributes() {
        const attributeElements = document.querySelectorAll('.attribute-item');
        const newOrder = [];
        
        attributeElements.forEach(element => {
            const attribute = this.currentTemplate.attributes.find(attr => attr.id === element.id);
            if (attribute) {
                newOrder.push(attribute);
            }
        });
        
        this.currentTemplate.attributes = newOrder;
    }
    
    removeAttribute(attributeId) {
        if (confirm('Are you sure you want to remove this attribute?')) {
            document.getElementById(attributeId).remove();
            this.currentTemplate.attributes = this.currentTemplate.attributes.filter(attr => attr.id !== attributeId);
            this.updatePreview();
        }
    }
    
    updatePreview() {
        const previewForm = document.getElementById('previewForm');
        
        // Clear existing preview (except the default name field)
        const existingFields = previewForm.querySelectorAll('.dynamic-field');
        existingFields.forEach(field => field.remove());
        
        // Add preview fields for each attribute
        this.currentTemplate.attributes.forEach(attribute => {
            if (!attribute.name) return;
            
            const fieldHtml = this.generatePreviewField(attribute);
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group dynamic-field';
            fieldDiv.innerHTML = fieldHtml;
            previewForm.appendChild(fieldDiv);
        });
    }
    
    generatePreviewField(attribute) {
        const required = attribute.required ? ' *' : '';
        const requiredAttr = attribute.required ? 'required' : '';
        
        let inputHtml = '';
        
        switch (attribute.type) {
            case 'text':
            case 'url':
                inputHtml = `<input type="text" class="form-input" placeholder="Enter ${attribute.name.toLowerCase()}" ${requiredAttr} disabled>`;
                break;
            case 'paragraph':
                inputHtml = `<textarea class="form-input" rows="3" placeholder="Enter ${attribute.name.toLowerCase()}" ${requiredAttr} disabled></textarea>`;
                break;
            case 'number':
                inputHtml = `<input type="number" class="form-input" placeholder="Enter ${attribute.name.toLowerCase()}" ${requiredAttr} disabled>`;
                break;
            case 'date':
                inputHtml = `<input type="date" class="form-input" ${requiredAttr} disabled>`;
                break;
            case 'boolean':
                inputHtml = `
                    <div class="toggle-switch">
                        <input type="checkbox" disabled>
                        <label class="toggle-label">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                `;
                break;
            case 'dropdown':
                const options = attribute.options || [];
                const optionsHtml = options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                inputHtml = `
                    <select class="form-input" ${requiredAttr} disabled>
                        <option value="">Select ${attribute.name}</option>
                        ${optionsHtml}
                    </select>
                `;
                break;
        }
        
        return `
            <label class="form-label">${attribute.name}${required}</label>
            ${inputHtml}
            <small class="form-help">Preview of ${attribute.name} field</small>
        `;
    }
    
    async saveTemplate() {
        try {
            this.updateCurrentTemplate();
            
            // Validate template
            if (!this.validateTemplate()) {
                return;
            }
            
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                this.showError('You must be logged in to save templates');
                return;
            }
            
            // Prepare template data for Firestore
            const templateData = {
                name: this.currentTemplate.name,
                description: this.currentTemplate.description,
                icon: this.currentTemplate.icon,
                attributes: this.currentTemplate.attributes.map(attr => ({
                    name: attr.name,
                    type: attr.type,
                    required: attr.required,
                    options: attr.options || []
                })),
                createdBy: currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                usageCount: 0
            };
            
            // Save to Firestore
            let docRef;
            if (this.isEditing && this.editingId) {
                // Update existing template
                docRef = firebase.firestore().collection('customTemplates').doc(this.editingId);
                await docRef.update({
                    ...templateData,
                    createdAt: firebase.firestore.FieldValue.delete(), // Don't update createdAt
                });
                this.showSuccess('Template updated successfully!');
            } else {
                // Create new template
                docRef = await firebase.firestore().collection('customTemplates').add(templateData);
                this.showSuccess('Template created successfully!');
            }
            
            // Reset form
            this.resetForm();
            
            // Refresh templates list
            this.loadExistingTemplates();
            
        } catch (error) {
            console.error('Error saving template:', error);
            this.showError('Error saving template. Please try again.');
        }
    }
    
    validateTemplate() {
        if (!this.currentTemplate.name.trim()) {
            this.showError('Template name is required');
            return false;
        }
        
        if (!this.currentTemplate.description.trim()) {
            this.showError('Template description is required');
            return false;
        }
        
        if (!this.currentTemplate.icon) {
            this.showError('Please select an icon for your template');
            return false;
        }
        
        if (this.currentTemplate.attributes.length === 0) {
            this.showError('Please add at least one attribute to your template');
            return false;
        }
        
        // Validate each attribute
        for (const attr of this.currentTemplate.attributes) {
            if (!attr.name.trim()) {
                this.showError('All attributes must have a name');
                return false;
            }
            
            if (attr.type === 'dropdown' && (!attr.options || attr.options.length === 0)) {
                this.showError(`Dropdown attribute "${attr.name}" must have at least one option`);
                return false;
            }
        }
        
        return true;
    }
    
    resetForm() {
        // Reset current template
        this.currentTemplate = {
            name: '',
            description: '',
            icon: '',
            attributes: []
        };
        
        // Reset form fields
        document.getElementById('templateName').value = '';
        document.getElementById('templateDescription').value = '';
        document.querySelectorAll('.icon-option').forEach(opt => opt.classList.remove('selected'));
        
        // Clear attributes list
        document.getElementById('attributesList').innerHTML = '';
        
        // Clear preview
        const previewForm = document.getElementById('previewForm');
        const dynamicFields = previewForm.querySelectorAll('.dynamic-field');
        dynamicFields.forEach(field => field.remove());
        
        // Reset editing state
        this.isEditing = false;
        this.editingId = null;
        this.attributeCounter = 0;
    }
    
    async loadExistingTemplates() {
        try {
            const templatesSnapshot = await firebase.firestore()
                .collection('customTemplates')
                .where('isActive', '==', true)
                .orderBy('createdAt', 'desc')
                .get();
            
            this.renderTemplatesList(templatesSnapshot.docs);
            
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    }
    
    renderTemplatesList(templateDocs) {
        const templatesGrid = document.getElementById('templatesGrid');
        templatesGrid.innerHTML = '';
        
        templateDocs.forEach(doc => {
            const template = doc.data();
            const templateCard = this.createTemplateCard(doc.id, template);
            templatesGrid.appendChild(templateCard);
        });
    }
    
    createTemplateCard(templateId, template) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'template-card';
        
        cardDiv.innerHTML = `
            <div class="template-card-header">
                <div class="template-icon">${template.icon}</div>
                <div class="template-info">
                    <h4>${template.name}</h4>
                    <p>${template.description}</p>
                </div>
            </div>
            
            <div class="template-stats">
                <span>${template.attributes.length} attributes</span>
                <span>${template.usageCount || 0} uses</span>
            </div>
            
            <div class="template-actions">
                <button class="btn btn-small btn-secondary" onclick="templateBuilder.editTemplate('${templateId}')">Edit</button>
                <button class="btn btn-small btn-primary" onclick="templateBuilder.duplicateTemplate('${templateId}')">Duplicate</button>
                <button class="btn btn-small btn-danger" onclick="templateBuilder.deleteTemplate('${templateId}')">Delete</button>
            </div>
        `;
        
        return cardDiv;
    }
    
    async editTemplate(templateId) {
        try {
            const templateDoc = await firebase.firestore().collection('customTemplates').doc(templateId).get();
            if (!templateDoc.exists) {
                this.showError('Template not found');
                return;
            }
            
            const template = templateDoc.data();
            
            // Switch to builder tab
            document.querySelector('[onclick="switchTab(\'builder\')"]').click();
            
            // Set editing state
            this.isEditing = true;
            this.editingId = templateId;
            
            // Populate form
            document.getElementById('templateName').value = template.name;
            document.getElementById('templateDescription').value = template.description;
            this.selectIcon(template.icon);
            
            // Clear existing attributes
            document.getElementById('attributesList').innerHTML = '';
            this.currentTemplate.attributes = [];
            
            // Add template attributes
            template.attributes.forEach(attr => {
                this.addAttribute();
                const lastAttribute = this.currentTemplate.attributes[this.currentTemplate.attributes.length - 1];
                
                // Populate attribute data
                const attributeElement = document.getElementById(lastAttribute.id);
                attributeElement.querySelector('.attr-name').value = attr.name;
                attributeElement.querySelector('.attr-type').value = attr.type;
                attributeElement.querySelector('.attr-required').checked = attr.required;
                
                // Update attribute data
                lastAttribute.name = attr.name;
                lastAttribute.type = attr.type;
                lastAttribute.required = attr.required;
                lastAttribute.options = attr.options || [];
                
                // Update UI
                this.updateAttributeTitle(lastAttribute.id, attr.name);
                this.togglePredefinedValues(lastAttribute.id, attr.type);
                
                if (attr.options && attr.options.length > 0) {
                    this.renderOptions(lastAttribute.id);
                }
            });
            
            this.updateCurrentTemplate();
            this.updatePreview();
            
        } catch (error) {
            console.error('Error loading template for editing:', error);
            this.showError('Error loading template');
        }
    }
    
    async duplicateTemplate(templateId) {
        try {
            const templateDoc = await firebase.firestore().collection('customTemplates').doc(templateId).get();
            if (!templateDoc.exists) {
                this.showError('Template not found');
                return;
            }
            
            const template = templateDoc.data();
            
            // Create duplicate with modified name
            const duplicateData = {
                ...template,
                name: `${template.name} (Copy)`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                usageCount: 0
            };
            
            await firebase.firestore().collection('customTemplates').add(duplicateData);
            this.showSuccess('Template duplicated successfully!');
            this.loadExistingTemplates();
            
        } catch (error) {
            console.error('Error duplicating template:', error);
            this.showError('Error duplicating template');
        }
    }
    
    async deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            return;
        }
        
        try {
            // Soft delete - mark as inactive instead of actually deleting
            await firebase.firestore().collection('customTemplates').doc(templateId).update({
                isActive: false,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            this.showSuccess('Template deleted successfully!');
            this.loadExistingTemplates();
            
        } catch (error) {
            console.error('Error deleting template:', error);
            this.showError('Error deleting template');
        }
    }
    
    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }
    
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// Template Manager - handles loading and using templates in the main app
class CustomTemplateManager {
    static async loadCustomTemplates() {
        try {
            const templatesSnapshot = await firebase.firestore()
                .collection('customTemplates')
                .where('isActive', '==', true)
                .orderBy('usageCount', 'desc')
                .get();
            
            const customTemplates = {};
            
            templatesSnapshot.docs.forEach(doc => {
                const template = doc.data();
                customTemplates[doc.id] = {
                    name: template.name,
                    description: template.description,
                    icon: template.icon,
                    fields: template.attributes.map(attr => ({
                        name: attr.name,
                        type: attr.type,
                        required: attr.required,
                        options: attr.options || [],
                        description: `${attr.name} field`
                    }))
                };
            });
            
            return customTemplates;
            
        } catch (error) {
            console.error('Error loading custom templates:', error);
            return {};
        }
    }
    
    static async incrementUsageCount(templateId) {
        try {
            await firebase.firestore().collection('customTemplates').doc(templateId).update({
                usageCount: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('Error incrementing usage count:', error);
        }
    }
    
    static async getTemplateAnalytics() {
        try {
            const templatesSnapshot = await firebase.firestore()
                .collection('customTemplates')
                .where('isActive', '==', true)
                .get();
            
            const collectionsSnapshot = await firebase.firestore()
                .collection('collections')
                .get();
            
            const analytics = {
                totalTemplates: templatesSnapshot.size,
                totalCollections: collectionsSnapshot.size,
                mostUsedTemplate: null,
                mostUsedCount: 0
            };
            
            // Find most used template
            templatesSnapshot.docs.forEach(doc => {
                const template = doc.data();
                if (template.usageCount > analytics.mostUsedCount) {
                    analytics.mostUsedCount = template.usageCount;
                    analytics.mostUsedTemplate = template.name;
                }
            });
            
            return analytics;
            
        } catch (error) {
            console.error('Error getting analytics:', error);
            return {
                totalTemplates: 0,
                totalCollections: 0,
                mostUsedTemplate: '-',
                mostUsedCount: 0
            };
        }
    }
}

// Global functions for template management
async function loadTemplates() {
    if (window.templateBuilder) {
        await window.templateBuilder.loadExistingTemplates();
    }
}

async function loadAnalytics() {
    try {
        const analytics = await CustomTemplateManager.getTemplateAnalytics();
        
        document.getElementById('totalTemplates').textContent = analytics.totalTemplates;
        document.getElementById('totalCollections').textContent = analytics.totalCollections;
        document.getElementById('mostUsedTemplate').textContent = analytics.mostUsedTemplate || '-';
        
        // Get active users count (simplified)
        const usersSnapshot = await firebase.firestore().collection('users').get();
        document.getElementById('activeUsers').textContent = usersSnapshot.size;
        
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function previewTemplate() {
    if (window.templateBuilder) {
        window.templateBuilder.updatePreview();
    }
}

function saveTemplate() {
    if (window.templateBuilder) {
        window.templateBuilder.saveTemplate();
    }
}

function addAttribute() {
    if (window.templateBuilder) {
        window.templateBuilder.addAttribute();
    }
}

// Initialize Template Builder when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.templateBuilder = new TemplateBuilder();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TemplateBuilder, CustomTemplateManager };
}