// Collection Templates System
// Defines specialized templates for different collection types

const COLLECTION_TEMPLATES = {
    general: {
        name: "General Collection",
        description: "Basic collection with standard fields",
        icon: "📦",
        fields: [
            { name: "Name", type: "text", required: true, description: "Item name" },
            { name: "Description", type: "textarea", required: false, description: "Item description" },
            { name: "Category", type: "text", required: false, description: "Item category" },
            { name: "Value", type: "currency", required: false, description: "Estimated value" },
            { name: "Condition", type: "select", options: ["Mint", "Near Mint", "Good", "Fair", "Poor"], required: false, description: "Item condition" },
            { name: "Notes", type: "textarea", required: false, description: "Additional notes" }
        ]
    },
    
    vinyl: {
        name: "Vinyl Records",
        description: "Specialized template for vinyl record collections",
        icon: "🎵",
        fields: [
            // Core Information
            { name: "Artist", type: "text", required: true, description: "Recording artist or band name" },
            { name: "Album Title", type: "text", required: true, description: "Album or single title" },
            { name: "Label", type: "text", required: false, description: "Record label (e.g., Blue Note, Sub Pop)" },
            { name: "Catalog Number", type: "text", required: false, description: "Label catalog number" },
            { name: "Release Year", type: "number", required: false, description: "Year of release" },
            
            // Format & Physical Details
            { name: "Format", type: "select", options: ["LP", "7\" Single", "10\" EP", "Box Set", "Double LP", "Triple LP"], required: true, description: "Record format" },
            { name: "Vinyl Color", type: "text", required: false, description: "Vinyl color (e.g., Black, Marbled, Picture Disc)" },
            { name: "Country of Pressing", type: "text", required: false, description: "Country where record was pressed" },
            
            // Condition Tracking (Critical for Vinyl)
            { name: "Media Condition", type: "select", options: ["Mint (M)", "Near Mint (NM)", "Very Good+ (VG+)", "Very Good (VG)", "Good+ (G+)", "Good (G)", "Fair (F)", "Poor (P)"], required: false, description: "Condition of the vinyl record itself" },
            { name: "Sleeve Condition", type: "select", options: ["Mint (M)", "Near Mint (NM)", "Very Good+ (VG+)", "Very Good (VG)", "Good+ (G+)", "Good (G)", "Fair (F)", "Poor (P)"], required: false, description: "Condition of the record sleeve/cover" },
            
            // Additional Details
            { name: "Genre(s)", type: "tags", required: false, description: "Music genres (comma-separated)" },
            { name: "Personal Notes", type: "textarea", required: false, description: "Personal notes (e.g., 'First pressing', 'Autographed copy')" },
            { name: "Discogs URL", type: "url", required: false, description: "Link to Discogs listing for detailed pressing info" },
            { name: "Purchase Price", type: "currency", required: false, description: "Price paid for this record" },
            { name: "Current Value", type: "currency", required: false, description: "Current estimated value" },
            { name: "Purchase Date", type: "date", required: false, description: "Date purchased" },
            { name: "Purchase Location", type: "text", required: false, description: "Where purchased (store, online, etc.)" }
        ]
    },
    
    custom: {
        name: "Custom Template",
        description: "Create your own custom fields",
        icon: "⚙️",
        fields: [
            { name: "Name", type: "text", required: true, description: "Item name" },
            { name: "Description", type: "textarea", required: false, description: "Item description" }
        ]
    }
};

// Template management functions
class TemplateManager {
    static async getTemplate(templateId) {
        // Check if it's a built-in template
        if (COLLECTION_TEMPLATES[templateId]) {
            return COLLECTION_TEMPLATES[templateId];
        }
        
        // Check if it's a custom template
        try {
            const customTemplates = await this.loadCustomTemplates();
            return customTemplates[templateId] || COLLECTION_TEMPLATES.general;
        } catch (error) {
            console.error('Error loading custom template:', error);
            return COLLECTION_TEMPLATES.general;
        }
    }
    
    static async getAllTemplates() {
        const builtInTemplates = Object.keys(COLLECTION_TEMPLATES).map(id => ({
            id,
            ...COLLECTION_TEMPLATES[id],
            isBuiltIn: true
        }));
        
        try {
            const customTemplates = await this.loadCustomTemplates();
            const customTemplatesList = Object.keys(customTemplates).map(id => ({
                id,
                ...customTemplates[id],
                isBuiltIn: false
            }));
            
            return [...builtInTemplates, ...customTemplatesList];
        } catch (error) {
            console.error('Error loading custom templates:', error);
            return builtInTemplates;
        }
    }
    
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
    
    static async incrementTemplateUsage(templateId) {
        // Only increment usage for custom templates
        if (!COLLECTION_TEMPLATES[templateId]) {
            try {
                await firebase.firestore().collection('customTemplates').doc(templateId).update({
                    usageCount: firebase.firestore.FieldValue.increment(1)
                });
            } catch (error) {
                console.error('Error incrementing template usage:', error);
            }
        }
    }
    
    static async renderTemplatePreview(templateId) {
        const template = await this.getTemplate(templateId);
        const previewDiv = document.getElementById('templatePreview');
        const fieldsDiv = document.getElementById('templateFields');
        
        if (!previewDiv || !fieldsDiv) return;
        
        if (templateId === 'general') {
            previewDiv.style.display = 'none';
            return;
        }
        
        fieldsDiv.innerHTML = '';
        
        template.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'template-field';
            
            fieldDiv.innerHTML = `
                <div class="template-field-name">${field.name}</div>
                <div class="template-field-type">${field.type}</div>
                <div class="template-field-description">${field.description}</div>
            `;
            
            fieldsDiv.appendChild(fieldDiv);
        });
        
        previewDiv.style.display = 'block';
    }
    
    static async generateItemForm(templateId, containerId) {
        const template = await this.getTemplate(templateId);
        const container = document.getElementById(containerId);
        
        if (!container) return;
        
        container.innerHTML = '';
        
        template.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';
            
            let inputHtml = '';
            const fieldId = `field_${field.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            
            switch (field.type) {
                case 'text':
                case 'url':
                    inputHtml = `<input type="text" id="${fieldId}" class="form-input" placeholder="${field.description}" ${field.required ? 'required' : ''}>`;
                    break;
                case 'paragraph':
                    inputHtml = `<textarea id="${fieldId}" class="form-input" rows="3" placeholder="${field.description}" ${field.required ? 'required' : ''}></textarea>`;
                    break;
                case 'number':
                    inputHtml = `<input type="number" id="${fieldId}" class="form-input" placeholder="${field.description}" ${field.required ? 'required' : ''}>`;
                    break;
                case 'currency':
                    inputHtml = `<input type="number" step="0.01" id="${fieldId}" class="form-input" placeholder="0.00" ${field.required ? 'required' : ''}>`;
                    break;
                case 'date':
                    inputHtml = `<input type="date" id="${fieldId}" class="form-input" ${field.required ? 'required' : ''}>`;
                    break;
                case 'boolean':
                    inputHtml = `
                        <div class="toggle-switch">
                            <input type="checkbox" id="${fieldId}" class="form-input-checkbox">
                            <label for="${fieldId}" class="toggle-label">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    `;
                    break;
                case 'textarea':
                    inputHtml = `<textarea id="${fieldId}" class="form-input" rows="3" placeholder="${field.description}" ${field.required ? 'required' : ''}></textarea>`;
                    break;
                case 'select':
                case 'dropdown':
                    const options = field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
                    inputHtml = `<select id="${fieldId}" class="form-input" ${field.required ? 'required' : ''}>
                        <option value="">Select ${field.name}</option>
                        ${options}
                    </select>`;
                    break;
                case 'tags':
                    inputHtml = `<input type="text" id="${fieldId}" class="form-input" placeholder="Enter tags separated by commas" ${field.required ? 'required' : ''}>`;
                    break;
            }
            
            fieldDiv.innerHTML = `
                <label class="form-label" for="${fieldId}">
                    ${field.name}${field.required ? ' *' : ''}
                </label>
                ${inputHtml}
                <small class="form-help">${field.description}</small>
            `;
            
            container.appendChild(fieldDiv);
        });
    }
    
    static async collectFormData(templateId, containerId) {
        const template = await this.getTemplate(templateId);
        const container = document.getElementById(containerId);
        const data = {};
        
        if (!container) return data;
        
        template.fields.forEach(field => {
            const fieldId = `field_${field.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            const element = document.getElementById(fieldId);
            
            if (element) {
                let value = element.value;
                
                // Process special field types
                if (field.type === 'tags' && value) {
                    value = value.split(',').map(tag => tag.trim()).filter(tag => tag);
                } else if (field.type === 'currency' && value) {
                    value = parseFloat(value) || 0;
                } else if (field.type === 'number' && value) {
                    value = parseInt(value) || 0;
                } else if (field.type === 'boolean') {
                    value = element.checked;
                }
                
                data[field.name] = value;
            }
        });
        
        return data;
    }
}

// Global function for template selection
async function updateTemplateFields() {
    const templateSelect = document.getElementById('collectionTemplate');
    if (templateSelect) {
        await TemplateManager.renderTemplatePreview(templateSelect.value);
    }
}

// Export for use in other modules
window.TemplateManager = TemplateManager;
window.COLLECTION_TEMPLATES = COLLECTION_TEMPLATES; 