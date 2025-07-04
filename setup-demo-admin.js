// Demo Setup Script for Template Builder
// Run this script to create demo admin user and sample templates

// Demo admin user setup
async function setupDemoAdmin() {
    try {
        // This would typically be done through Firebase Admin SDK
        // For demo purposes, we'll create a sample user document
        const demoAdminData = {
            email: 'admin@trove.demo',
            displayName: 'Demo Administrator',
            role: 'admin',
            createdAt: new Date(),
            permissions: ['template_builder', 'user_management', 'analytics']
        };
        
        console.log('Demo admin user data:', demoAdminData);
        console.log('Note: In production, this would be created through Firebase Admin SDK');
        
    } catch (error) {
        console.error('Error setting up demo admin:', error);
    }
}

// Sample custom template for Comic Books
const comicBookTemplate = {
    name: 'Comic Books',
    description: 'Comprehensive template for comic book collections',
    icon: '📚',
    attributes: [
        {
            name: 'Publisher',
            type: 'dropdown',
            required: true,
            options: ['Marvel', 'DC Comics', 'Image', 'Dark Horse', 'IDW', 'Vertigo', 'Other']
        },
        {
            name: 'Series Title',
            type: 'text',
            required: true,
            options: []
        },
        {
            name: 'Issue Number',
            type: 'number',
            required: true,
            options: []
        },
        {
            name: 'Publication Year',
            type: 'number',
            required: false,
            options: []
        },
        {
            name: 'Condition',
            type: 'dropdown',
            required: false,
            options: ['Mint', 'Near Mint', 'Very Fine', 'Fine', 'Very Good', 'Good', 'Fair', 'Poor']
        },
        {
            name: 'Key Issue?',
            type: 'boolean',
            required: false,
            options: []
        },
        {
            name: 'Cover Price',
            type: 'text',
            required: false,
            options: []
        },
        {
            name: 'Current Value',
            type: 'number',
            required: false,
            options: []
        },
        {
            name: 'Story Arc',
            type: 'text',
            required: false,
            options: []
        },
        {
            name: 'Writer(s)',
            type: 'text',
            required: false,
            options: []
        },
        {
            name: 'Artist(s)',
            type: 'text',
            required: false,
            options: []
        },
        {
            name: 'Signed?',
            type: 'boolean',
            required: false,
            options: []
        },
        {
            name: 'Notes',
            type: 'paragraph',
            required: false,
            options: []
        }
    ],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
};

// Sample custom template for Action Figures
const actionFigureTemplate = {
    name: 'Action Figures',
    description: 'Template for action figure and toy collections',
    icon: '🧸',
    attributes: [
        {
            name: 'Manufacturer',
            type: 'dropdown',
            required: true,
            options: ['Hasbro', 'Mattel', 'NECA', 'McFarlane', 'Funko', 'Hot Toys', 'Sideshow', 'Other']
        },
        {
            name: 'Product Line',
            type: 'text',
            required: true,
            options: []
        },
        {
            name: 'Character Name',
            type: 'text',
            required: true,
            options: []
        },
        {
            name: 'Scale',
            type: 'dropdown',
            required: false,
            options: ['1:6', '1:12', '3.75"', '6"', '7"', '12"', 'Other']
        },
        {
            name: 'Release Year',
            type: 'number',
            required: false,
            options: []
        },
        {
            name: 'Condition',
            type: 'dropdown',
            required: false,
            options: ['Mint on Card', 'Near Mint', 'Loose Complete', 'Loose Incomplete', 'Poor']
        },
        {
            name: 'Packaging',
            type: 'dropdown',
            required: false,
            options: ['Sealed', 'Opened', 'Loose', 'Custom Package']
        },
        {
            name: 'Accessories Included?',
            type: 'boolean',
            required: false,
            options: []
        },
        {
            name: 'Retail Price',
            type: 'number',
            required: false,
            options: []
        },
        {
            name: 'Current Value',
            type: 'number',
            required: false,
            options: []
        },
        {
            name: 'Special Features',
            type: 'paragraph',
            required: false,
            options: []
        }
    ],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
};

// Sample custom template for Video Games
const videoGameTemplate = {
    name: 'Video Games',
    description: 'Template for video game collections',
    icon: '🎮',
    attributes: [
        {
            name: 'Platform',
            type: 'dropdown',
            required: true,
            options: ['PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'PC', 'Retro Console', 'Other']
        },
        {
            name: 'Game Title',
            type: 'text',
            required: true,
            options: []
        },
        {
            name: 'Genre',
            type: 'dropdown',
            required: false,
            options: ['Action', 'Adventure', 'RPG', 'Strategy', 'Sports', 'Racing', 'Puzzle', 'Horror', 'Simulation', 'Other']
        },
        {
            name: 'Release Date',
            type: 'date',
            required: false,
            options: []
        },
        {
            name: 'Publisher',
            type: 'text',
            required: false,
            options: []
        },
        {
            name: 'Developer',
            type: 'text',
            required: false,
            options: []
        },
        {
            name: 'Condition',
            type: 'dropdown',
            required: false,
            options: ['Mint', 'Very Good', 'Good', 'Fair', 'Poor', 'Digital Only']
        },
        {
            name: 'Complete in Box?',
            type: 'boolean',
            required: false,
            options: []
        },
        {
            name: 'Manual Included?',
            type: 'boolean',
            required: false,
            options: []
        },
        {
            name: 'Purchase Price',
            type: 'number',
            required: false,
            options: []
        },
        {
            name: 'Current Value',
            type: 'number',
            required: false,
            options: []
        },
        {
            name: 'Completion Status',
            type: 'dropdown',
            required: false,
            options: ['Not Started', 'In Progress', 'Completed', 'Platinum/100%']
        },
        {
            name: 'Personal Rating',
            type: 'dropdown',
            required: false,
            options: ['★★★★★', '★★★★☆', '★★★☆☆', '★★☆☆☆', '★☆☆☆☆']
        }
    ],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
};

// Function to add sample templates to Firestore
async function addSampleTemplates() {
    try {
        // Add Comic Books template
        await firebase.firestore().collection('customTemplates').add({
            ...comicBookTemplate,
            createdBy: 'demo-admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add Action Figures template
        await firebase.firestore().collection('customTemplates').add({
            ...actionFigureTemplate,
            createdBy: 'demo-admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add Video Games template
        await firebase.firestore().collection('customTemplates').add({
            ...videoGameTemplate,
            createdBy: 'demo-admin',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Sample templates added successfully!');
        
    } catch (error) {
        console.error('Error adding sample templates:', error);
    }
}

// Function to set up demo admin role for current user
async function setCurrentUserAsAdmin() {
    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.log('No user logged in. Please log in first.');
            return;
        }
        
        await firebase.firestore().collection('users').doc(currentUser.uid).set({
            email: currentUser.email,
            displayName: currentUser.displayName || 'Administrator',
            role: 'admin',
            permissions: ['template_builder', 'user_management', 'analytics'],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('Current user set as admin successfully!');
        
    } catch (error) {
        console.error('Error setting user as admin:', error);
    }
}

// Export functions for manual execution
window.DemoSetup = {
    setupDemoAdmin,
    addSampleTemplates,
    setCurrentUserAsAdmin,
    sampleTemplates: {
        comicBookTemplate,
        actionFigureTemplate,
        videoGameTemplate
    }
};

console.log('Demo setup functions available:');
console.log('- DemoSetup.setCurrentUserAsAdmin() - Make current user an admin');
console.log('- DemoSetup.addSampleTemplates() - Add sample custom templates');
console.log('- DemoSetup.sampleTemplates - View sample template data'); 