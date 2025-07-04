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
        subCollections: [],
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
      throw new Error(`You've reached your item limit (${tierInfo.limits.maxItems}). Upgrade to add more items.`);
    }
    
    try {
      // Verify collection ownership
      await this.getCollection(collectionId);
      
      const newItem = {
        name: itemData.name,
        description: itemData.description || '',
        category: itemData.category || 'General',
        condition: itemData.condition || 'Good',
        estimatedValue: itemData.estimatedValue || 0,
        purchaseDate: itemData.purchaseDate || null,
        purchasePrice: itemData.purchasePrice || 0,
        location: itemData.location || '',
        notes: itemData.notes || '',
        tags: itemData.tags || [],
        images: itemData.images || [],
        attributes: itemData.attributes || {},
        userId: AuthUtils.getCurrentUser().uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add item to collection
      const itemRef = await db.collection('collections')
        .doc(collectionId)
        .collection('items')
        .add(newItem);
      
      // Update collection stats
      const collectionRef = db.collection('collections').doc(collectionId);
      await collectionRef.update({
        itemCount: firebase.firestore.FieldValue.increment(1),
        estimatedValue: firebase.firestore.FieldValue.increment(newItem.estimatedValue),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update user usage
      const tierInfo = await getUserTierInfo();
      await updateUserUsage({
        totalItems: tierInfo.usage.totalItems + 1
      });
      
      console.log('🏺 Item added to collection:', itemRef.id);
      return {
        success: true,
        id: itemRef.id,
        item: newItem
      };
      
    } catch (error) {
      console.error('❌ Error adding item:', error);
      throw error;
    }
  },
  
  // Get items from a collection
  async getCollectionItems(collectionId, limit = 50) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Verify collection ownership
      await this.getCollection(collectionId);
      
      const itemsSnapshot = await db.collection('collections')
        .doc(collectionId)
        .collection('items')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const items = [];
      itemsSnapshot.forEach(doc => {
        items.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      console.log(`🏺 Loaded ${items.length} items from collection ${collectionId}`);
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
      const userCollectionsRef = db.collection('users').doc(currentUser.uid).collection('collections');
      const snapshot = await userCollectionsRef.get();
      
      const collections = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.name.toLowerCase().includes(query.toLowerCase()) ||
            data.description.toLowerCase().includes(query.toLowerCase()) ||
            data.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
          collections.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          });
        }
      });
      
      return collections;
      
    } catch (error) {
      console.error('❌ Error searching collections:', error);
      throw error;
    }
  },
  
  // Get collection statistics
  async getCollectionStats(collectionId) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      const collection = await this.getCollection(collectionId);
      const items = await this.getCollectionItems(collectionId, 1000);
      
      const stats = {
        totalItems: items.length,
        totalValue: items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0),
        averageValue: items.length > 0 ? items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0) / items.length : 0,
        conditionBreakdown: {},
        categoryBreakdown: {},
        recentAdditions: items.filter(item => {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return item.createdAt > oneWeekAgo;
        }).length
      };
      
      // Calculate condition and category breakdowns
      items.forEach(item => {
        stats.conditionBreakdown[item.condition] = (stats.conditionBreakdown[item.condition] || 0) + 1;
        stats.categoryBreakdown[item.category] = (stats.categoryBreakdown[item.category] || 0) + 1;
      });
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error getting collection stats:', error);
      throw error;
    }
  },
  
  // Render collections in the UI
  renderCollections(collections) {
    const container = document.getElementById('collectionsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (!collections || collections.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }
    
    emptyState.style.display = 'none';
    
    const collectionsHTML = collections.map(collection => {
      const hasSubCollections = collection.subCollections && collection.subCollections.length > 0;
      const subCollectionCount = hasSubCollections ? collection.subCollections.length : 0;
      
      return `
        <div class="collection-card" onclick="handleCollectionClick('${collection.id}', ${hasSubCollections})">
          <div class="collection-image">
            ${collection.coverImage ? 
              `<img src="${collection.coverImage}" alt="${collection.name}" style="width: 100%; height: 100%; object-fit: cover;">` :
              `<div style="font-size: 3rem;">��</div>`
            }
            ${hasSubCollections ? `
              <div class="sub-collection-indicator">
                <div class="stack-icon">📚</div>
                <div class="sub-count">${subCollectionCount}</div>
              </div>
            ` : ''}
          </div>
          <div class="collection-content">
            <h3 class="collection-title">${collection.name}</h3>
            <p class="collection-description">${collection.description || 'No description'}</p>
            <div class="collection-stats">
              <span>${collection.itemCount || 0} items</span>
              <span>$${(collection.estimatedValue || 0).toLocaleString()}</span>
              <span>${collection.updatedAt ? new Date(collection.updatedAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = collectionsHTML;
  },
  
  // Show create collection modal
  showCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) {
      modal.style.display = 'block';
    }
  },
  
  // Show success message
  showSuccess(message) {
    // You can implement a toast notification system here
    console.log('✅ Success:', message);
  },
  
  // Show error message
  showError(message) {
    // You can implement a toast notification system here
    console.error('❌ Error:', message);
  }
};

// Sub-collection management functions
const SubCollectionManager = {
  // Create a new sub-collection
  async createSubCollection(collectionId, subCollectionData) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Verify collection ownership
      await CollectionManager.getCollection(collectionId);
      
      const newSubCollection = {
        name: subCollectionData.name,
        description: subCollectionData.description || '',
        category: subCollectionData.category || 'General',
        tags: subCollectionData.tags || [],
        itemCount: 0,
        estimatedValue: 0,
        coverImage: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add sub-collection to collection
      const subCollectionRef = await db.collection('collections')
        .doc(collectionId)
        .collection('subCollections')
        .add(newSubCollection);
      
      // Update parent collection
      await db.collection('collections').doc(collectionId).update({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('📚 Sub-collection created:', subCollectionRef.id);
      return {
        success: true,
        id: subCollectionRef.id,
        subCollection: newSubCollection
      };
      
    } catch (error) {
      console.error('❌ Error creating sub-collection:', error);
      throw error;
    }
  },
  
  // Get sub-collections for a collection
  async getSubCollections(collectionId) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Verify collection ownership
      await CollectionManager.getCollection(collectionId);
      
      const subCollectionsSnapshot = await db.collection('collections')
        .doc(collectionId)
        .collection('subCollections')
        .orderBy('updatedAt', 'desc')
        .get();
      
      const subCollections = [];
      subCollectionsSnapshot.forEach(doc => {
        subCollections.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      console.log(`📚 Loaded ${subCollections.length} sub-collections for collection ${collectionId}`);
      return subCollections;
      
    } catch (error) {
      console.error('❌ Error loading sub-collections:', error);
      throw error;
    }
  },
  
  // Get a specific sub-collection
  async getSubCollection(collectionId, subCollectionId) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Verify collection ownership
      await CollectionManager.getCollection(collectionId);
      
      const doc = await db.collection('collections')
        .doc(collectionId)
        .collection('subCollections')
        .doc(subCollectionId)
        .get();
      
      if (!doc.exists) {
        throw new Error('Sub-collection not found');
      }
      
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      };
      
    } catch (error) {
      console.error('❌ Error getting sub-collection:', error);
      throw error;
    }
  },
  
  // Add item to sub-collection
  async addItemToSubCollection(collectionId, subCollectionId, itemData) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Verify sub-collection exists
      await this.getSubCollection(collectionId, subCollectionId);
      
      const newItem = {
        name: itemData.name,
        description: itemData.description || '',
        category: itemData.category || 'General',
        condition: itemData.condition || 'Good',
        estimatedValue: itemData.estimatedValue || 0,
        purchaseDate: itemData.purchaseDate || null,
        purchasePrice: itemData.purchasePrice || 0,
        location: itemData.location || '',
        notes: itemData.notes || '',
        tags: itemData.tags || [],
        images: itemData.images || [],
        attributes: itemData.attributes || {},
        userId: AuthUtils.getCurrentUser().uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add item to sub-collection
      const itemRef = await db.collection('collections')
        .doc(collectionId)
        .collection('subCollections')
        .doc(subCollectionId)
        .collection('items')
        .add(newItem);
      
      // Update sub-collection stats
      const subCollectionRef = db.collection('collections')
        .doc(collectionId)
        .collection('subCollections')
        .doc(subCollectionId);
      
      await subCollectionRef.update({
        itemCount: firebase.firestore.FieldValue.increment(1),
        estimatedValue: firebase.firestore.FieldValue.increment(newItem.estimatedValue),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update parent collection stats
      const collectionRef = db.collection('collections').doc(collectionId);
      await collectionRef.update({
        itemCount: firebase.firestore.FieldValue.increment(1),
        estimatedValue: firebase.firestore.FieldValue.increment(newItem.estimatedValue),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('🏺 Item added to sub-collection:', itemRef.id);
      return {
        success: true,
        id: itemRef.id,
        item: newItem
      };
      
    } catch (error) {
      console.error('❌ Error adding item to sub-collection:', error);
      throw error;
    }
  },
  
  // Get items from sub-collection
  async getSubCollectionItems(collectionId, subCollectionId, limit = 50) {
    if (!AuthUtils.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
    
    try {
      // Verify sub-collection exists
      await this.getSubCollection(collectionId, subCollectionId);
      
      const itemsSnapshot = await db.collection('collections')
        .doc(collectionId)
        .collection('subCollections')
        .doc(subCollectionId)
        .collection('items')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const items = [];
      itemsSnapshot.forEach(doc => {
        items.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      console.log(`🏺 Loaded ${items.length} items from sub-collection ${subCollectionId}`);
      return items;
      
    } catch (error) {
      console.error('❌ Error loading sub-collection items:', error);
      throw error;
    }
  }
};

// Global functions for UI interaction
function handleCollectionClick(collectionId, hasSubCollections) {
  if (hasSubCollections) {
    // Navigate to sub-collections view
    window.location.href = `sub-collections.html?collectionId=${collectionId}`;
  } else {
    // Navigate directly to items view
    window.location.href = `collection-view.html?id=${collectionId}`;
  }
}

// Load user collections and render them
async function loadUserCollections() {
  try {
    const collections = await CollectionManager.getUserCollections();
    CollectionManager.renderCollections(collections);
    
    // Update stats
    updateCollectionStats(collections);
    
  } catch (error) {
    console.error('❌ Error loading collections:', error);
    CollectionManager.showError('Failed to load collections');
  }
}

// Update collection statistics in the UI
function updateCollectionStats(collections) {
  const totalCollections = collections.length;
  const totalItems = collections.reduce((sum, collection) => sum + (collection.itemCount || 0), 0);
  const totalValue = collections.reduce((sum, collection) => sum + (collection.estimatedValue || 0), 0);
  const recentCollections = collections.filter(collection => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return collection.updatedAt && collection.updatedAt > oneWeekAgo;
  }).length;
  
  // Update stats display
  const statsElements = {
    collections: document.querySelector('[data-stat="collections"]'),
    items: document.querySelector('[data-stat="items"]'),
    value: document.querySelector('[data-stat="value"]'),
    recent: document.querySelector('[data-stat="recent"]')
  };
  
  if (statsElements.collections) statsElements.collections.textContent = totalCollections;
  if (statsElements.items) statsElements.items.textContent = totalItems.toLocaleString();
  if (statsElements.value) statsElements.value.textContent = `$${totalValue.toLocaleString()}`;
  if (statsElements.recent) statsElements.recent.textContent = recentCollections;
}

// Initialize collections when page loads
document.addEventListener('DOMContentLoaded', () => {
  if (AuthUtils.isAuthenticated()) {
    loadUserCollections();
  }
});

// Export for use in other files
window.CollectionManager = CollectionManager;
window.SubCollectionManager = SubCollectionManager;
window.handleCollectionClick = handleCollectionClick; 