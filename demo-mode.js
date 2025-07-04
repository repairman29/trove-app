// Demo Mode for Trove Application
// This file provides a simulated Firebase environment for testing
// when real Firebase credentials are not available

// ⚠️ IMPORTANT: Set this to false when you have real Firebase credentials
const DEMO_MODE = false;

// ⚠️ PRODUCTION CHECKLIST:
// 1. Set DEMO_MODE = false above
// 2. Update firebase-config.js with your real Firebase config
// 3. Test authentication flows
// 4. Verify Firestore security rules
// 5. Test tier limits enforcement

if (DEMO_MODE) {
  console.log('🎮 DEMO MODE ACTIVE: Simulating Firebase environment');
  console.log('🔧 To enable production mode:');
  console.log('   1. Set DEMO_MODE = false in demo-mode.js');
  console.log('   2. Update firebase-config.js with real credentials');
  
  // Mock Firebase objects
  window.firebase = {
    initializeApp: () => console.log('🎮 Demo: Firebase initialized'),
    auth: () => ({
      onAuthStateChanged: (callback) => {
        console.log('🎮 Demo: Auth state observer set up');
        // Simulate immediate authentication with demo user
        setTimeout(() => {
          const demoUser = {
            uid: 'demo-user-123',
            email: 'demo@trove.app',
            displayName: 'Demo Collector',
            photoURL: 'https://via.placeholder.com/40x40/00FF7F/121212?text=D'
          };
          callback(demoUser);
        }, 1000);
      },
      signInWithPopup: async (provider) => {
        console.log('🎮 Demo: Google sign-in simulated');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        return {
          user: {
            uid: 'demo-user-google',
            email: 'demo.google@trove.app',
            displayName: 'Demo Google User',
            photoURL: 'https://via.placeholder.com/40x40/00FF7F/121212?text=G'
          }
        };
      },
      signInWithEmailAndPassword: async (email, password) => {
        console.log('🎮 Demo: Email sign-in simulated');
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        if (email === 'demo@trove.app' && password === 'demo123') {
          return {
            user: {
              uid: 'demo-user-123',
              email: 'demo@trove.app',
              displayName: 'Demo Collector',
              photoURL: null
            }
          };
        }
        throw new Error('auth/wrong-password');
      },
      createUserWithEmailAndPassword: async (email, password) => {
        console.log('🎮 Demo: Account creation simulated');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
        
        return {
          user: {
            uid: 'demo-user-new-' + Date.now(),
            email: email,
            displayName: null,
            photoURL: null,
            updateProfile: async (profile) => {
              console.log('🎮 Demo: Profile updated', profile);
              return true;
            }
          }
        };
      },
      sendPasswordResetEmail: async (email) => {
        console.log('🎮 Demo: Password reset email sent to', email);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        return true;
      },
      signOut: async () => {
        console.log('🎮 Demo: User signed out');
        return true;
      },
      GoogleAuthProvider: function() {
        return { 
          providerId: 'google.com',
          addScope: () => console.log('🎮 Demo: Google provider scope added')
        };
      }
    }),
    firestore: () => ({
      collection: (name) => ({
        doc: (id) => ({
          get: async () => {
            console.log(`🎮 Demo: Getting document ${id} from ${name}`);
            
            if (name === 'users') {
              return {
                exists: true,
                data: () => ({
                  uid: id,
                  email: 'demo@trove.app',
                  displayName: 'Demo Collector',
                  photoURL: 'https://via.placeholder.com/40x40/00FF7F/121212?text=D',
                  tier: 'free',
                  subscription: {
                    status: 'active',
                    currentPeriodEnd: null,
                    stripeCustomerId: null
                  },
                  usage: {
                    collections: 2,
                    totalItems: 45,
                    storageUsed: 12,
                    lastUpdated: new Date()
                  },
                  preferences: {
                    theme: 'neon-arcade',
                    notifications: true,
                    privacy: 'private'
                  },
                  createdAt: new Date(),
                  lastLogin: new Date()
                })
              };
            }
            
            if (name === 'collections') {
              return {
                exists: true,
                data: () => ({
                  id: id,
                  name: 'Demo Collection',
                  description: 'A sample collection for testing',
                  userId: 'demo-user-123',
                  itemCount: 15,
                  estimatedValue: 450,
                  tags: ['demo', 'test'],
                  createdAt: new Date(),
                  updatedAt: new Date()
                })
              };
            }
            
            return { exists: false };
          },
          set: async (data) => {
            console.log(`🎮 Demo: Setting document in ${name}`, data);
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
            return true;
          },
          update: async (data) => {
            console.log(`🎮 Demo: Updating document in ${name}`, data);
            await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
            return true;
          }
        }),
        add: async (data) => {
          console.log(`🎮 Demo: Adding document to ${name}`, data);
          await new Promise(resolve => setTimeout(resolve, 400)); // Simulate network delay
          return { id: 'demo-doc-' + Date.now() };
        },
        where: (field, op, value) => ({
          get: async () => {
            console.log(`🎮 Demo: Querying ${name} where ${field} ${op} ${value}`);
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
            
            return {
              forEach: (callback) => {
                // Return some demo collections
                if (name === 'collections') {
                  const demoCollections = [
                    {
                      id: 'demo-collection-1',
                      name: 'Nintendo 64 Games',
                      description: 'Classic N64 cartridges from the golden era of gaming',
                      userId: 'demo-user-123',
                      itemCount: 23,
                      estimatedValue: 890,
                      tags: ['gaming', 'vintage', 'nintendo'],
                      coverImage: null,
                      createdAt: new Date('2024-01-15'),
                      updatedAt: new Date('2024-07-01')
                    },
                    {
                      id: 'demo-collection-2',
                      name: 'Marvel Action Figures',
                      description: 'Vintage and modern Marvel superhero action figures',
                      userId: 'demo-user-123',
                      itemCount: 22,
                      estimatedValue: 1200,
                      tags: ['marvel', 'action-figures', 'superhero'],
                      coverImage: null,
                      createdAt: new Date('2024-02-20'),
                      updatedAt: new Date('2024-06-15')
                    }
                  ];
                  
                  demoCollections.forEach(collection => {
                    callback({
                      id: collection.id,
                      data: () => collection
                    });
                  });
                }
              }
            };
          }
        })
      }),
      FieldValue: {
        serverTimestamp: () => {
          console.log('🎮 Demo: Server timestamp requested');
          return new Date();
        }
      }
    }),
    storage: () => ({
      ref: (path) => ({
        put: async (file) => {
          console.log(`🎮 Demo: Uploading file ${file.name} to ${path}`);
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload time
          return {
            ref: {
              getDownloadURL: async () => {
                console.log('🎮 Demo: Getting download URL');
                return `https://demo-storage.trove.app/${path}/${file.name}`;
              }
            }
          };
        }
      })
    })
  };
  
  // Mock AuthUtils
  window.AuthUtils = {
    signInWithGoogle: async () => {
      console.log('🎮 Demo: Google sign-in via AuthUtils');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      return {
        success: true,
        user: {
          uid: 'demo-user-google',
          email: 'demo.google@trove.app',
          displayName: 'Demo Google User',
          photoURL: 'https://via.placeholder.com/40x40/00FF7F/121212?text=G'
        }
      };
    },
    
    signInWithEmail: async (email, password) => {
      console.log('🎮 Demo: Email sign-in via AuthUtils');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      if (email === 'demo@trove.app' && password === 'demo123') {
        return {
          success: true,
          user: {
            uid: 'demo-user-123',
            email: 'demo@trove.app',
            displayName: 'Demo Collector'
          }
        };
      }
      return {
        success: false,
        error: 'Incorrect email or password. Try demo@trove.app with password: demo123'
      };
    },
    
    createAccount: async (email, password, displayName) => {
      console.log('🎮 Demo: Account creation via AuthUtils');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      return {
        success: true,
        user: {
          uid: 'demo-user-new-' + Date.now(),
          email: email,
          displayName: displayName || 'New Demo User'
        }
      };
    },
    
    resetPassword: async (email) => {
      console.log('🎮 Demo: Password reset via AuthUtils for', email);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      return { success: true };
    },
    
    signOut: async () => {
      console.log('🎮 Demo: Sign out via AuthUtils');
      return { success: true };
    },
    
    getErrorMessage: (errorCode) => {
      console.log('🎮 Demo: Getting error message for', errorCode);
      return 'Demo mode error: ' + errorCode;
    },
    
    isAuthenticated: () => {
      console.log('🎮 Demo: Checking authentication status');
      return true; // Always authenticated in demo mode
    },
    
    getCurrentUser: () => {
      console.log('🎮 Demo: Getting current user');
      return {
        uid: 'demo-user-123',
        email: 'demo@trove.app',
        displayName: 'Demo Collector',
        photoURL: 'https://via.placeholder.com/40x40/00FF7F/121212?text=D'
      };
    }
  };
  
  // Mock additional functions that might be called
  window.checkUserLimits = async (operation, data) => {
    console.log(`🎮 Demo: Checking user limits for ${operation}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate check
    return true; // Always allow in demo mode
  };
  
  window.updateUserUsage = async (updates) => {
    console.log('🎮 Demo: Updating user usage', updates);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate update
    return true;
  };
  
  window.getUserTierInfo = async () => {
    console.log('🎮 Demo: Getting user tier info');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate lookup
    return {
      tier: 'free',
      limits: {
        maxCollections: 3,
        maxItemsPerCollection: 50,
        maxTotalItems: 150,
        maxPhotosPerItem: 5,
        maxStorageMB: 100
      },
      usage: {
        collections: 2,
        totalItems: 45,
        storageUsed: 12,
        lastUpdated: new Date()
      }
    };
  };
  
  // Show demo mode indicator
  document.addEventListener('DOMContentLoaded', () => {
    const demoIndicator = document.createElement('div');
    demoIndicator.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        left: 10px;
        background: linear-gradient(45deg, #FF00FF, #00FFFF);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        font-weight: bold;
        z-index: 9999;
        box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
      ">
        🎮 DEMO MODE
      </div>
    `;
    document.body.appendChild(demoIndicator);
  });
  
} else {
  console.log('🏺 PRODUCTION MODE: Using real Firebase');
  console.log('🔥 Firebase configuration loaded from firebase-config.js');
} 