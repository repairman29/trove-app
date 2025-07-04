// Collection Management for Trove Application
// This file handles all collection-related operations with Firestore

// Collection operations
const CollectionManager = {
  // Create a new collection
  async createCollection(collectionData) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated to create collections');
    }
    
    const currentUser = AuthUtils.getCurrentUser();
    
    // Check user limits
    const canCreate = await checkUserLimits('CREATE_COLLECTION');
    if (!canCreate) {
      const tierInfo = await getUserTierInfo();
      throw new Error(`You've reached your collection limit (${tierInfo.limits.maxCollections}). Upgrade to create more collections.`);
    }
    
    try {
      // Prepare collection data
      const newCollection = {
        name: collectionData.name,
        description: collectionData.description || '',
        category: collectionData.category || 'General',
        tags: collectionData.tags || [],
        userId: currentUser.uid,
        itemCount: 0,
        estimatedValue: 0,
        coverImage: null,
        isPublic: collectionData.isPublic || false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add to Firestore under user's collections
      const userCollectionsRef = db.collection('users').doc(currentUser.uid).collection('collections');
      const docRef = await userCollectionsRef.add(newCollection);
      
      // Update user usage
      const tierInfo = await getUserTierInfo();
      await updateUserUsage({
        collections: tierInfo.usage.collections + 1
      });
      
      console.log('🏺 Collection created:', docRef.id);
      return {
        success: true,
        id: docRef.id,
        collection: newCollection
      };
      
    } catch (error) {
      console.error('❌ Error creating collection:', error);
      throw error;
    }
  },
  
  // Get all collections for current user
  async getUserCollections() {
    if (!AuthUtils.isAuthenticated()) {
      return [];
    }
    
    const currentUser = AuthUtils.getCurrentUser();
    
    try {
      const userCollectionsRef = db.collection('users').doc(currentUser.uid).collection('collections');
      const snapshot = await userCollectionsRef.orderBy('updatedAt', 'desc').get();
      
      const collections = [];
      snapshot.forEach(doc => {
        collections.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      console.log(`🏺 Loaded ${collections.length} collections`);
      return collections;
      
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      throw error;
    }
  },
  
  // Get a specific collection by ID
  async getCollection(collectionId) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      const doc = await db.collection('collections').doc(collectionId).get();
      
      if (!doc.exists) {
        throw new Error('Collection not found');
      }
      
      const data = doc.data();
      const currentUser = AuthUtils.getCurrentUser();
      
      // Check if user owns this collection
      if (data.userId !== currentUser.uid) {
        throw new Error('Access denied: You do not own this collection');
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
      
    } catch (error) {
      console.error('❌ Error getting collection:', error);
      throw error;
    }
  },
  
  // Update a collection
  async updateCollection(collectionId, updates) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Verify ownership first
      await this.getCollection(collectionId);
      
      const updateData = {
        ...updates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('collections').doc(collectionId).update(updateData);
      
      console.log('🏺 Collection updated:', collectionId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error updating collection:', error);
      throw error;
    }
  },
  
  // Delete a collection
  async deleteCollection(collectionId) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Verify ownership first
      const collection = await this.getCollection(collectionId);
      
      // Delete all items in the collection first
      const itemsSnapshot = await db.collection('collections')
        .doc(collectionId)
        .collection('items')
        .get();
      
      const batch = db.batch();
      itemsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete the collection
      batch.delete(db.collection('collections').doc(collectionId));
      
      await batch.commit();
      
      // Update user usage
      const tierInfo = await getUserTierInfo();
      await updateUserUsage({
        collections: Math.max(0, tierInfo.usage.collections - 1),
        totalItems: Math.max(0, tierInfo.usage.totalItems - collection.itemCount)
      });
      
      console.log('🏺 Collection deleted:', collectionId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error deleting collection:', error);
      throw error;
    }
  },
  
  // Add an item to a collection
  async addItem(collectionId, itemData) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    // Check user limits
    const canAdd = await checkUserLimits('ADD_ITEM', { collectionId });
    if (!canAdd) {
      const tierInfo = await getUserTierInfo();
      throw new Error(`You've reached your item limit. Upgrade to add more items.`);
    }
    
    try {
      // Verify collection ownership
      const collection = await this.getCollection(collectionId);
      
      const newItem = {
        name: itemData.name,
        description: itemData.description || '',
        category: itemData.category || '',
        condition: itemData.condition || 'Good',
        purchasePrice: itemData.purchasePrice || 0,
        currentValue: itemData.currentValue || 0,
        purchaseDate: itemData.purchaseDate || null,
        photos: [],
        attributes: itemData.attributes || {},
        tags: itemData.tags || [],
        notes: itemData.notes || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add item to collection's items subcollection
      const docRef = await db.collection('collections')
        .doc(collectionId)
        .collection('items')
        .add(newItem);
      
      // Update collection stats
      await db.collection('collections').doc(collectionId).update({
        itemCount: firebase.firestore.FieldValue.increment(1),
        estimatedValue: firebase.firestore.FieldValue.increment(newItem.currentValue),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user usage
      const tierInfo = await getUserTierInfo();
      await updateUserUsage({
        totalItems: tierInfo.usage.totalItems + 1
      });
      
      console.log('🏺 Item added to collection:', docRef.id);
      return {
        success: true,
        id: docRef.id,
        item: newItem
      };
      
    } catch (error) {
      console.error('❌ Error adding item:', error);
      throw error;
    }
  },
  
  // Get items in a collection
  async getCollectionItems(collectionId, limit = 50) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Verify collection ownership
      await this.getCollection(collectionId);
      
      const snapshot = await db.collection('collections')
        .doc(collectionId)
        .collection('items')
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();
      
      const items = [];
      snapshot.forEach(doc => {
        items.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      console.log(`🏺 Loaded ${items.length} items from collection`);
      return items;
      
    } catch (error) {
      console.error('❌ Error loading collection items:', error);
      throw error;
    }
  },
  
  // Search collections
  async searchCollections(query) {
    if (!AuthUtils.isAuthenticated()) {
      return [];
    }
    
    const currentUser = AuthUtils.getCurrentUser();
    
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple name-based search. For production, consider using Algolia
      const collections = await this.getUserCollections();
      
      const searchTerm = query.toLowerCase();
      const filtered = collections.filter(collection => 
        collection.name.toLowerCase().includes(searchTerm) ||
        collection.description.toLowerCase().includes(searchTerm) ||
        collection.category.toLowerCase().includes(searchTerm) ||
        collection.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
      
      console.log(`🏺 Search for "${query}" returned ${filtered.length} results`);
      return filtered;
      
    } catch (error) {
      console.error('❌ Error searching collections:', error);
      throw error;
    }
  },
  
  // Get collection statistics
  async getCollectionStats(collectionId) {
    try {
      const collection = await this.getCollection(collectionId);
      const items = await this.getCollectionItems(collectionId, 1000); // Get all items
      
      const stats = {
        totalItems: items.length,
        totalValue: items.reduce((sum, item) => sum + (item.currentValue || 0), 0),
        averageValue: 0,
        categories: {},
        conditions: {},
        recentActivity: items.slice(0, 5) // 5 most recent items
      };
      
      if (stats.totalItems > 0) {
        stats.averageValue = stats.totalValue / stats.totalItems;
      }
      
      // Count by category
      items.forEach(item => {
        const category = item.category || 'Uncategorized';
        stats.categories[category] = (stats.categories[category] || 0) + 1;
      });
      
      // Count by condition
      items.forEach(item => {
        const condition = item.condition || 'Unknown';
        stats.conditions[condition] = (stats.conditions[condition] || 0) + 1;
      });
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error getting collection stats:', error);
      throw error;
    }
  }
};

// UI Helper functions for collections
const CollectionUI = {
  // Render collections grid
  renderCollections(collections) {
    const grid = document.querySelector('.collections-grid');
    if (!grid) return;
    
    if (collections.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
          <div style="font-size: 4rem; margin-bottom: 20px;">📦</div>
          <h3 style="color: var(--text-primary); margin-bottom: 10px;">No collections yet</h3>
          <p style="color: var(--text-secondary); margin-bottom: 30px;">Create your first collection to get started organizing your treasures!</p>
          <button class="btn btn-primary" onclick="openCreateCollectionModal()">Create Your First Collection</button>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = collections.map(collection => `
      <div class="collection-card" onclick="openCollection('${collection.id}')" data-collection-id="${collection.id}">
        <div class="collection-image">
          ${collection.coverImage ? 
            `<img src="${collection.coverImage}" alt="${collection.name}" loading="lazy">` : 
            `<div class="placeholder-image">📦</div>`
          }
        </div>
        <div class="collection-info">
          <h3 class="collection-name">${collection.name}</h3>
          <p class="collection-description">${collection.description || 'No description'}</p>
          <div class="collection-stats">
            <span class="stat-item">
              <span class="stat-icon">📊</span>
              ${collection.itemCount || 0} items
            </span>
            <span class="stat-item">
              <span class="stat-icon">💰</span>
              $${(collection.estimatedValue || 0).toLocaleString()}
            </span>
          </div>
          <div class="collection-tags">
            ${(collection.tags || []).slice(0, 3).map(tag => 
              `<span class="tag">${tag}</span>`
            ).join('')}
          </div>
          <div class="collection-actions">
            <button class="btn-icon" onclick="event.stopPropagation(); editCollection('${collection.id}')" title="Edit">
              ⚙️
            </button>
            <button class="btn-icon" onclick="event.stopPropagation(); shareCollection('${collection.id}')" title="Share">
              🔗
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },
  
  // Show create collection modal
  showCreateModal() {
    const modalHTML = `
      <div class="modal-overlay" onclick="closeCreateCollectionModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2><span class="sonic-ring">⭕</span>Create New Collection</h2>
            <button class="modal-close" onclick="closeCreateCollectionModal()">×</button>
          </div>
          <form id="createCollectionForm" onsubmit="handleCreateCollection(event)">
            <div class="form-group">
              <label class="form-label">Collection Name *</label>
              <input type="text" name="name" class="form-input" required placeholder="e.g., Vintage Star Wars Figures">
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea name="description" class="form-input" rows="3" placeholder="Tell us about your collection..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select name="category" class="form-input">
                <option value="Action Figures">Action Figures</option>
                <option value="Trading Cards">Trading Cards</option>
                <option value="Video Games">Video Games</option>
                <option value="Comics">Comics</option>
                <option value="Toys">Toys</option>
                <option value="Books">Books</option>
                <option value="Art">Art</option>
                <option value="Collectibles">Collectibles</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tags (comma-separated)</label>
              <input type="text" name="tags" class="form-input" placeholder="vintage, rare, complete">
            </div>
            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" name="isPublic">
                <span class="checkmark"></span>
                Make this collection public
              </label>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" onclick="closeCreateCollectionModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Collection</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },
  
  // Show success message
  showSuccess(message) {
    const successHTML = `
      <div class="success-toast" style="position: fixed; top: 20px; right: 20px; background: var(--laser-green); color: var(--bg-dark); padding: 15px 20px; border-radius: 8px; z-index: 1000; font-weight: bold;">
        ✅ ${message}
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', successHTML);
    
    setTimeout(() => {
      const toast = document.querySelector('.success-toast');
      if (toast) toast.remove();
    }, 3000);
  },
  
  // Show error message
  showError(message) {
    const errorHTML = `
      <div class="error-toast" style="position: fixed; top: 20px; right: 20px; background: #ff4444; color: white; padding: 15px 20px; border-radius: 8px; z-index: 1000;">
        ❌ ${message}
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorHTML);
    
    setTimeout(() => {
      const toast = document.querySelector('.error-toast');
      if (toast) toast.remove();
    }, 5000);
  }
};

// Global functions for UI interaction
window.openCreateCollectionModal = () => {
  CollectionUI.showCreateModal();
};

window.closeCreateCollectionModal = () => {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
};

window.handleCreateCollection = async (event) => {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const collectionData = {
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
    isPublic: formData.get('isPublic') === 'on'
  };
  
  try {
    const result = await CollectionManager.createCollection(collectionData);
    
    if (result.success) {
      CollectionUI.showSuccess('Collection created successfully!');
      closeCreateCollectionModal();
      
      // Refresh the collections display
      if (typeof loadUserCollections === 'function') {
        loadUserCollections();
      }
    }
  } catch (error) {
    CollectionUI.showError(error.message);
  }
};

window.openCollection = (collectionId) => {
  // Navigate to collection detail page or show collection modal
  console.log('🏺 Opening collection:', collectionId);
  // TODO: Implement collection detail view
};

window.editCollection = (collectionId) => {
  console.log('🏺 Editing collection:', collectionId);
  // TODO: Implement collection editing
};

window.shareCollection = (collectionId) => {
  console.log('🏺 Sharing collection:', collectionId);
  // TODO: Implement collection sharing
};

// Export for use in other files
window.CollectionManager = CollectionManager;
window.CollectionUI = CollectionUI; 