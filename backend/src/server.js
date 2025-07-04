const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8000', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Enhanced in-memory storage with sub-collections support
const collections = [
  {
    id: "1",
    name: "Video Games",
    description: "Complete collection of video games across all platforms",
    subCollections: [
      {
        id: "1-1",
        name: "Nintendo Entertainment System",
        description: "Classic NES games from the 80s and 90s",
        itemCount: 25,
        estimatedValue: 1500,
        coverImage: null,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: "1-2", 
        name: "Sega Genesis",
        description: "Sega's 16-bit console games",
        itemCount: 18,
        estimatedValue: 800,
        coverImage: null,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-19')
      },
      {
        id: "1-3",
        name: "PlayStation",
        description: "Original PlayStation games",
        itemCount: 32,
        estimatedValue: 2200,
        coverImage: null,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-21')
      }
    ],
    itemCount: 75,
    estimatedValue: 4500,
    coverImage: null,
    tags: ["gaming", "retro", "consoles"],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: "2",
    name: "Comic Books",
    description: "Marvel and DC comic collection",
    subCollections: [
      {
        id: "2-1",
        name: "Marvel Comics",
        description: "Spider-Man, X-Men, and Avengers",
        itemCount: 45,
        estimatedValue: 3200,
        coverImage: null,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-15')
      },
      {
        id: "2-2",
        name: "DC Comics", 
        description: "Batman, Superman, and Justice League",
        itemCount: 38,
        estimatedValue: 2800,
        coverImage: null,
        createdAt: new Date('2024-02-02'),
        updatedAt: new Date('2024-02-14')
      }
    ],
    itemCount: 83,
    estimatedValue: 6000,
    coverImage: null,
    tags: ["comics", "superheroes"],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: "3",
    name: "80s Action Figures",
    description: "Vintage action figures from the 1980s",
    subCollections: [],
    itemCount: 12,
    estimatedValue: 1800,
    coverImage: null,
    tags: ["toys", "vintage", "80s"],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-10')
  }
];

// User subscriptions storage
const userSubscriptions = new Map();

// Stripe subscription plans
const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    collections: 3,
    templates: 0,
    items: 100
  },
  pro: {
    name: 'Pro',
    price: 999, // $9.99 in cents
    collections: 1000,
    templates: -1, // unlimited
    items: 100000
  }
};

// Collections endpoints
app.get('/collections', (req, res) => {
  res.json(collections);
});

app.post('/collections', (req, res) => {
  const newCollection = {
    id: Date.now().toString(),
    ...req.body,
    subCollections: req.body.subCollections || [],
    itemCount: 0,
    estimatedValue: 0,
    coverImage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  collections.push(newCollection);
  res.status(201).json(newCollection);
});

app.get('/collections/:id', (req, res) => {
  const collection = collections.find(c => c.id === req.params.id);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  res.json(collection);
});

// New sub-collection endpoints
app.post('/collections/:id/subcollections', (req, res) => {
  const collection = collections.find(c => c.id === req.params.id);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  
  const newSubCollection = {
    id: `${req.params.id}-${Date.now()}`,
    ...req.body,
    itemCount: 0,
    estimatedValue: 0,
    coverImage: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  collection.subCollections.push(newSubCollection);
  collection.updatedAt = new Date();
  
  res.status(201).json(newSubCollection);
});

app.get('/collections/:id/subcollections', (req, res) => {
  const collection = collections.find(c => c.id === req.params.id);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  res.json(collection.subCollections);
});

app.get('/collections/:id/subcollections/:subId', (req, res) => {
  const collection = collections.find(c => c.id === req.params.id);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  
  const subCollection = collection.subCollections.find(sc => sc.id === req.params.subId);
  if (!subCollection) {
    return res.status(404).json({ error: 'Sub-collection not found' });
  }
  
  res.json(subCollection);
});

// Items endpoints for sub-collections
app.post('/collections/:id/subcollections/:subId/items', (req, res) => {
  const collection = collections.find(c => c.id === req.params.id);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  
  const subCollection = collection.subCollections.find(sc => sc.id === req.params.subId);
  if (!subCollection) {
    return res.status(404).json({ error: 'Sub-collection not found' });
  }
  
  const newItem = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  if (!subCollection.items) {
    subCollection.items = [];
  }
  
  subCollection.items.push(newItem);
  subCollection.itemCount = subCollection.items.length;
  subCollection.updatedAt = new Date();
  
  res.status(201).json(newItem);
});

app.get('/collections/:id/subcollections/:subId/items', (req, res) => {
  const collection = collections.find(c => c.id === req.params.id);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  
  const subCollection = collection.subCollections.find(sc => sc.id === req.params.subId);
  if (!subCollection) {
    return res.status(404).json({ error: 'Sub-collection not found' });
  }
  
  res.json(subCollection.items || []);
});

// Search endpoint
app.get('/collections/:id/search', (req, res) => {
  const { q } = req.query;
  const collection = collections.find(c => c.id === req.params.id);
  
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  
  if (!q) {
    return res.json({ results: [] });
  }
  
  const searchTerm = q.toLowerCase();
  const results = [];
  
  // Search in collection name and description
  if (collection.name.toLowerCase().includes(searchTerm) || 
      collection.description.toLowerCase().includes(searchTerm)) {
    results.push({
      type: 'collection',
      id: collection.id,
      name: collection.name,
      description: collection.description
    });
  }
  
  // Search in sub-collections
  collection.subCollections.forEach(sub => {
    if (sub.name.toLowerCase().includes(searchTerm) || 
        sub.description.toLowerCase().includes(searchTerm)) {
      results.push({
        type: 'sub-collection',
        id: sub.id,
        name: sub.name,
        description: sub.description,
        parentId: collection.id
      });
    }
  });
  
  res.json({ results });
});

// Subscription management endpoints
app.post('/subscriptions/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing.html`,
      client_reference_id: userId,
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/subscriptions/create-portal-session', async (req, res) => {
  try {
    const { customerId } = req.body;
    
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/settings.html`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      const subscriptionCreated = event.data.object;
      console.log('Subscription created:', subscriptionCreated.id);
      break;
    case 'customer.subscription.updated':
      const subscriptionUpdated = event.data.object;
      console.log('Subscription updated:', subscriptionUpdated.id);
      break;
    case 'customer.subscription.deleted':
      const subscriptionDeleted = event.data.object;
      console.log('Subscription deleted:', subscriptionDeleted.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  
  res.json({ received: true });
});

// User subscription status endpoint
app.get('/user/:userId/subscription', (req, res) => {
  const userId = req.params.userId;
  const subscription = userSubscriptions.get(userId) || SUBSCRIPTION_PLANS.free;
  res.json(subscription);
});

// Template verification endpoints
app.get('/admin/templates/pending', (req, res) => {
  // Mock data for pending templates
  const pendingTemplates = [
    {
      id: '1',
      name: 'Vintage Vinyl Records',
      creator: 'vinyl_lover_42',
      description: 'Template for organizing vinyl record collections',
      status: 'pending',
      createdAt: new Date('2024-01-15'),
      attributes: [
        { name: 'Artist', type: 'text', required: true },
        { name: 'Album', type: 'text', required: true },
        { name: 'Year', type: 'number', required: false },
        { name: 'Condition', type: 'select', options: ['Mint', 'Near Mint', 'Very Good', 'Good', 'Fair'] }
      ]
    },
    {
      id: '2',
      name: 'Comic Book Collection',
      creator: 'comic_collector_99',
      description: 'Template for comic book enthusiasts',
      status: 'pending',
      createdAt: new Date('2024-01-16'),
      attributes: [
        { name: 'Title', type: 'text', required: true },
        { name: 'Issue Number', type: 'number', required: true },
        { name: 'Publisher', type: 'text', required: true },
        { name: 'Grade', type: 'select', options: ['10.0', '9.8', '9.6', '9.4', '9.2', '9.0', '8.5', '8.0'] }
      ]
    }
  ];
  
  res.json(pendingTemplates);
});

app.post('/admin/templates/:id/verify', (req, res) => {
  const { id } = req.params;
  const { status, feedback } = req.body;
  
  // Mock verification response
  res.json({
    success: true,
    message: `Template ${id} ${status === 'approved' ? 'approved' : 'rejected'}`,
    status,
    feedback
  });
});

// Analytics endpoints
app.get('/admin/analytics', (req, res) => {
  const analytics = {
    users: {
      total: 1247,
      active: 892,
      newThisMonth: 156,
      growth: 12.5
    },
    collections: {
      total: 3421,
      averagePerUser: 2.7,
      mostPopular: 'Video Games'
    },
    templates: {
      total: 89,
      approved: 67,
      pending: 12,
      rejected: 10
    },
    revenue: {
      monthly: 15420,
      growth: 8.3,
      subscriptions: {
        pro: 234,
        patron: 89
      }
    }
  };
  
  res.json(analytics);
});

// Start server
app.listen(PORT, () => {
  console.log(`🏺 Starting Trove API server...`);
  console.log(`==============================`);
  console.log(`🚀 Trove API server is running on http://localhost:${PORT}`);
  console.log(`📊 Database: In-memory (for now)`);
  console.log(`Available endpoints:`);
  console.log(`  GET    /health`);
  console.log(`  GET    /collections`);
  console.log(`  POST   /collections`);
  console.log(`  GET    /collections/:id`);
  console.log(`==============================`);
}); 