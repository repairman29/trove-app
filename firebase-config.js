// Firebase Configuration for Trove Application
// This file contains the Firebase setup for authentication and Firestore

// Production Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBWHlFtoRe6ykVyfDNJzir5H9ywrSYN9c",
  authDomain: "collectors-hub-app-464902.firebaseapp.com",
  projectId: "collectors-hub-app-464902",
  storageBucket: "collectors-hub-app-464902.firebasestorage.app",
  messagingSenderId: "1080901223118",
  appId: "1:1080901223118:web:20dc54c5f915fa880d469f",
  measurementId: "G-T7NNY0J6Z7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// API Configuration
const API_CONFIG = {
  // Use Firebase Functions for API in production, localhost for development
  baseURL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/api`,
  
  // Helper function to make authenticated API calls
  async fetch(endpoint, options = {}) {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    };
    
    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  }
};

// Tier configuration
const TIER_LIMITS = {
  free: {
    maxCollections: 3,
    maxItemsPerCollection: 50,
    maxTotalItems: 150,
    maxPhotosPerItem: 5,
    maxStorageMB: 100
  },
  pro: {
    maxCollections: 25,
    maxItemsPerCollection: 1000,
    maxTotalItems: 25000,
    maxPhotosPerItem: 20,
    maxStorageMB: 2048
  },
  enterprise: {
    maxCollections: -1, // unlimited
    maxItemsPerCollection: -1, // unlimited
    maxTotalItems: -1, // unlimited
    maxPhotosPerItem: -1, // unlimited
    maxStorageMB: 51200 // 50GB
  }
};

// Auth state observer
let currentUser = null;

auth.onAuthStateChanged((user) => {
  currentUser = user;
  if (user) {
    console.log('🏺 User signed in:', user.displayName || user.email);
    // Initialize user profile if needed
    initializeUserProfile(user);
    
    // Update UI for authenticated state
    updateAuthUI(user);
  } else {
    console.log('🏺 User signed out');
    // Redirect to auth page if on protected pages
    if (window.location.pathname.includes('app.html')) {
      window.location.href = 'auth.html';
    }
  }
});

// Update UI based on authentication state
function updateAuthUI(user) {
  // Update user info in dashboard
  const userInfo = document.querySelector('.user-info');
  if (userInfo) {
    userInfo.innerHTML = `
      <span class="text-secondary">Welcome back, ${user.displayName || 'Collector'}!</span>
      <div class="user-avatar" onclick="showUserMenu()">
        ${user.photoURL ? `<img src="${user.photoURL}" alt="Avatar">` : '👤'}
      </div>
    `;
  }
  
  // Load user's collections
  if (window.location.pathname.includes('app.html')) {
    loadUserCollections();
  }
}

// Initialize user profile in Firestore
async function initializeUserProfile(user) {
  try {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create new user profile
      const newUserData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Collector',
        photoURL: user.photoURL || null,
        tier: 'free',
        subscription: {
          status: 'active',
          currentPeriodEnd: null,
          stripeCustomerId: null
        },
        usage: {
          collections: 0,
          totalItems: 0,
          storageUsed: 0,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        },
        preferences: {
          theme: 'neon-arcade',
          notifications: true,
          privacy: 'private'
        },
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await userRef.set(newUserData);
      console.log('🏺 New user profile created');
      
      // Show welcome message for new users
      showWelcomeMessage();
    } else {
      // Update last login
      await userRef.update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('🏺 User profile updated');
    }
  } catch (error) {
    console.error('❌ Error initializing user profile:', error);
    showErrorMessage('Failed to initialize user profile. Please try again.');
  }
}

// Show welcome message for new users
function showWelcomeMessage() {
  const welcomeHTML = `
    <div class="welcome-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(18, 18, 18, 0.95); display: flex; align-items: center; justify-content: center; z-index: 1000;">
      <div class="welcome-card" style="background: var(--bg-card); padding: 40px; border-radius: 16px; text-align: center; max-width: 500px; border: 1px solid var(--border-cyan);">
        <div style="font-size: 3rem; margin-bottom: 20px;"><span class="sonic-ring">⭕</span></div>
        <h2 style="color: var(--laser-green); margin-bottom: 20px;">Welcome to Trove!</h2>
        <p style="color: var(--text-secondary); margin-bottom: 30px;">You're all set up with a free account. Start by creating your first collection!</p>
        <button class="btn btn-primary" onclick="closeWelcomeMessage()">Get Started</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', welcomeHTML);
}

function closeWelcomeMessage() {
  const overlay = document.querySelector('.welcome-overlay');
  if (overlay) overlay.remove();
}

// Get current user's tier and limits
async function getUserTierInfo() {
  if (!currentUser) return null;
  
  try {
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        tier: userData.tier,
        limits: TIER_LIMITS[userData.tier],
        usage: userData.usage
      };
    }
  } catch (error) {
    console.error('❌ Error getting user tier info:', error);
  }
  return null;
}

// Check if user can perform an operation based on their tier limits
async function checkUserLimits(operation, additionalData = {}) {
  const tierInfo = await getUserTierInfo();
  if (!tierInfo) return false;
  
  const { limits, usage } = tierInfo;
  
  switch (operation) {
    case 'CREATE_COLLECTION':
      if (limits.maxCollections === -1) return true;
      return usage.collections < limits.maxCollections;
    
    case 'ADD_ITEM':
      const collectionId = additionalData.collectionId;
      if (limits.maxTotalItems !== -1 && usage.totalItems >= limits.maxTotalItems) {
        return false;
      }
      
      // Check items per collection limit
      if (limits.maxItemsPerCollection !== -1) {
        try {
          const itemsRef = db.collection('users').doc(currentUser.uid)
            .collection('collections').doc(collectionId).collection('items');
          const snapshot = await itemsRef.get();
          return snapshot.size < limits.maxItemsPerCollection;
        } catch (error) {
          console.error('❌ Error checking collection item count:', error);
          return false;
        }
      }
      return true;
    
    case 'UPLOAD_PHOTO':
      const fileSizeMB = additionalData.fileSizeMB || 0;
      return (usage.storageUsed + fileSizeMB) <= limits.maxStorageMB;
    
    default:
      return true;
  }
}

// Update user usage statistics
async function updateUserUsage(updates) {
  if (!currentUser) return;
  
  try {
    const userRef = db.collection('users').doc(currentUser.uid);
    await userRef.update({
      [`usage.${Object.keys(updates)[0]}`]: firebase.firestore.FieldValue.increment(Object.values(updates)[0]),
      'usage.lastUpdated': firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('❌ Error updating user usage:', error);
  }
}

// Load user's collections and update the dashboard
async function loadUserCollections() {
  if (!currentUser) {
    console.log('❌ No authenticated user');
    return;
  }

  try {
    const collectionsRef = db.collection('users').doc(currentUser.uid).collection('collections');
    const snapshot = await collectionsRef.orderBy('updatedAt', 'desc').get();
    
    const collections = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      collections.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      });
    });

    console.log('🏺 Loaded collections:', collections.length);
    
    // Update the collections grid
    updateCollectionsGrid(collections);
    
    // Update usage statistics
    updateUsageStats(collections);
    
  } catch (error) {
    console.error('❌ Error loading collections:', error);
    showErrorMessage('Failed to load collections. Please refresh the page.');
  }
}

// Update the collections grid in the dashboard
function updateCollectionsGrid(collections) {
  const grid = document.querySelector('.collections-grid');
  if (!grid) return;

  if (collections.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.3;">📦</div>
        <h3 style="color: var(--text-secondary); margin-bottom: 16px;">No collections yet</h3>
        <p style="color: var(--text-muted); margin-bottom: 30px;">Create your first collection to start organizing your treasures!</p>
        <button class="btn btn-primary" onclick="openCreateModal()">
          <span class="btn-icon">+</span>
          Create Collection
        </button>
      </div>
    `;
    return;
  }

  const collectionCards = collections.map(collection => {
    const emoji = getCollectionEmoji(collection.name);
    const itemCount = collection.itemCount || 0;
    const value = collection.estimatedValue || 0;
    
    return `
      <div class="collection-card" onclick="openCollection('${collection.id}')">
        <div class="collection-header">
          <div class="collection-emoji">${emoji}</div>
          <div class="collection-actions">
            <button class="btn btn-icon btn-secondary" onclick="event.stopPropagation(); editCollection('${collection.id}')" title="Edit">
              ✏️
            </button>
            <button class="btn btn-icon btn-secondary" onclick="event.stopPropagation(); shareCollection('${collection.id}')" title="Share">
              🔗
            </button>
          </div>
        </div>
        <h3 class="collection-name">${collection.name}</h3>
        <p class="collection-description">${collection.description || 'No description'}</p>
        <div class="collection-stats">
          <div class="stat">
            <span class="stat-value">${itemCount}</span>
            <span class="stat-label">Items</span>
          </div>
          <div class="stat">
            <span class="stat-value">$${value.toLocaleString()}</span>
            <span class="stat-label">Value</span>
          </div>
        </div>
        <div class="collection-tags">
          ${(collection.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = collectionCards;
}

// Get appropriate emoji for collection name
function getCollectionEmoji(name) {
  const emojis = {
    'nintendo': '🎮', 'game': '🎮', 'gaming': '🎮',
    'marvel': '🦸', 'action': '🦸', 'figure': '🦸', 'superhero': '🦸',
    'pokemon': '⚡', 'card': '🃏', 'trading': '🃏',
    'vinyl': '💿', 'record': '💿', 'music': '🎵',
    'book': '📚', 'comic': '📚', 'manga': '📚',
    'coin': '🪙', 'stamp': '📮', 'vintage': '🕰️',
    'toy': '🧸', 'doll': '🪆', 'bear': '🧸',
    'watch': '⌚', 'jewelry': '💎', 'ring': '💍'
  };
  
  const lowerName = name.toLowerCase();
  for (const [key, emoji] of Object.entries(emojis)) {
    if (lowerName.includes(key)) return emoji;
  }
  return '📦'; // Default emoji
}

// Update usage statistics in the dashboard
function updateUsageStats(collections) {
  const totalCollections = collections.length;
  const totalItems = collections.reduce((sum, col) => sum + (col.itemCount || 0), 0);
  const totalValue = collections.reduce((sum, col) => sum + (col.estimatedValue || 0), 0);

  // Update stats cards
  const statsElements = {
    collections: document.querySelector('[data-stat="collections"]'),
    items: document.querySelector('[data-stat="items"]'),
    value: document.querySelector('[data-stat="value"]')
  };

  if (statsElements.collections) {
    statsElements.collections.textContent = totalCollections.toLocaleString();
  }
  if (statsElements.items) {
    statsElements.items.textContent = totalItems.toLocaleString();
  }
  if (statsElements.value) {
    statsElements.value.textContent = `$${totalValue.toLocaleString()}`;
  }
}

// Show error message to user
function showErrorMessage(message) {
  const errorHTML = `
    <div class="error-toast" style="position: fixed; top: 20px; right: 20px; background: var(--bg-card); border: 1px solid #ff4444; padding: 16px 20px; border-radius: 8px; z-index: 1000; max-width: 400px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="color: #ff4444; font-size: 1.2rem;">⚠️</span>
        <span style="color: var(--text-primary);">${message}</span>
        <button onclick="this.closest('.error-toast').remove()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; margin-left: auto;">✕</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', errorHTML);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    const toast = document.querySelector('.error-toast');
    if (toast) toast.remove();
  }, 5000);
}

// Authentication utilities
const AuthUtils = {
  async signInWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await auth.signInWithPopup(provider);
      return {
        success: true,
        user: result.user
      };
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  async signInWithEmail(email, password) {
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      return {
        success: true,
        user: result.user
      };
    } catch (error) {
      console.error('❌ Email sign-in error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  async createAccount(email, password, displayName) {
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      
      // Update the user's display name
      if (displayName) {
        await result.user.updateProfile({
          displayName: displayName
        });
      }
      
      return {
        success: true,
        user: result.user
      };
    } catch (error) {
      console.error('❌ Account creation error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  async resetPassword(email) {
    try {
      await auth.sendPasswordResetEmail(email);
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  async signOut() {
    try {
      await auth.signOut();
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return {
        success: false,
        error: 'Failed to sign out'
      };
    }
  },

  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.'
    };
    
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
  },

  isAuthenticated() {
    return !!currentUser;
  },

  getCurrentUser() {
    return currentUser;
  }
};

// Export for use in other files
window.AuthUtils = AuthUtils;
window.checkUserLimits = checkUserLimits;
window.updateUserUsage = updateUserUsage;
window.getUserTierInfo = getUserTierInfo;
window.loadUserCollections = loadUserCollections;
window.TIER_LIMITS = TIER_LIMITS;
window.API_CONFIG = API_CONFIG; 