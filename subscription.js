// Trove Subscription Management System
// Handles user tiers, permissions, and Template Builder access

class SubscriptionManager {
    constructor() {
        this.tiers = {
            free: {
                name: 'Free',
                maxItems: 25,
                maxCollections: 3,
                canCreateTemplates: false,
                canUseCustomTemplates: false,
                price: 0
            },
            pro: {
                name: 'Pro',
                maxItems: 5000,
                maxCollections: 100,
                canCreateTemplates: true,
                canUseCustomTemplates: true,
                price: 9.99
            },
            patron: {
                name: 'Patron',
                maxItems: 100000,
                maxCollections: 1000,
                canCreateTemplates: true,
                canUseCustomTemplates: true,
                prioritySupport: true,
                price: 29.99
            }
        };
    }

    // Get user's current subscription tier
    async getUserTier(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return userData.subscriptionTier || 'free';
            }
            return 'free';
        } catch (error) {
            console.error('Error getting user tier:', error);
            return 'free';
        }
    }

    // Check if user can create templates
    async canCreateTemplates(userId) {
        const tier = await this.getUserTier(userId);
        return this.tiers[tier].canCreateTemplates;
    }

    // Check if user can use custom templates
    async canUseCustomTemplates(userId) {
        const tier = await this.getUserTier(userId);
        return this.tiers[tier].canUseCustomTemplates;
    }

    // Check if user has reached item limit
    async hasReachedItemLimit(userId, currentItemCount) {
        const tier = await this.getUserTier(userId);
        return currentItemCount >= this.tiers[tier].maxItems;
    }

    // Check if user has reached collection limit
    async hasReachedCollectionLimit(userId, currentCollectionCount) {
        const tier = await this.getUserTier(userId);
        return currentCollectionCount >= this.tiers[tier].maxCollections;
    }

    // Get tier limits for display
    getTierLimits(tierName) {
        return this.tiers[tierName] || this.tiers.free;
    }

    // Upgrade user to new tier
    async upgradeUser(userId, newTier, subscriptionId = null) {
        try {
            const updateData = {
                subscriptionTier: newTier,
                subscriptionDate: new Date(),
                subscriptionActive: true
            };

            if (subscriptionId) {
                updateData.subscriptionId = subscriptionId;
            }

            await db.collection('users').doc(userId).update(updateData);
            
            // Log the upgrade
            await db.collection('subscriptionEvents').add({
                userId: userId,
                event: 'tier_upgrade',
                fromTier: await this.getUserTier(userId),
                toTier: newTier,
                timestamp: new Date()
            });

            return true;
        } catch (error) {
            console.error('Error upgrading user:', error);
            return false;
        }
    }

    // Show upgrade prompt for template creation
    showTemplateBuilderUpgradePrompt() {
        const modal = document.createElement('div');
        modal.className = 'subscription-upgrade-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🚀 Unlock Template Builder</h2>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Create custom collection templates for any hobby or collectible with <strong>Trove Pro</strong>!</p>
                    
                    <div class="tier-comparison">
                        <div class="tier current-tier">
                            <h3>Free</h3>
                            <ul>
                                <li>✓ Up to 25 items</li>
                                <li>✓ 3 collections</li>
                                <li>✓ Use built-in templates</li>
                                <li>✗ Create custom templates</li>
                            </ul>
                        </div>
                        <div class="tier recommended-tier">
                            <h3>Pro <span class="price">$9.99/mo</span></h3>
                            <ul>
                                <li>✓ Up to 5,000 items</li>
                                <li>✓ 100 collections</li>
                                <li>✓ Use built-in templates</li>
                                <li>✓ <strong>Create unlimited custom templates</strong></li>
                                <li>✓ Share templates with community</li>
                            </ul>
                            <button class="upgrade-btn" onclick="subscriptionManager.startUpgrade('pro')">
                                Upgrade to Pro
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Show upgrade prompt for item limits
    showItemLimitUpgradePrompt(currentCount, limit) {
        const modal = document.createElement('div');
        modal.className = 'subscription-upgrade-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📦 Collection Limit Reached</h2>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <p>You've reached your limit of <strong>${limit} items</strong>. Upgrade to continue growing your collection!</p>
                    
                    <div class="tier-comparison">
                        <div class="tier recommended-tier">
                            <h3>Pro <span class="price">$9.99/mo</span></h3>
                            <ul>
                                <li>✓ Up to 5,000 items</li>
                                <li>✓ Template Builder</li>
                                <li>✓ Priority support</li>
                            </ul>
                            <button class="upgrade-btn" onclick="subscriptionManager.startUpgrade('pro')">
                                Upgrade to Pro
                            </button>
                        </div>
                        <div class="tier">
                            <h3>Patron <span class="price">$29.99/mo</span></h3>
                            <ul>
                                <li>✓ Up to 100,000 items</li>
                                <li>✓ 1,000 collections</li>
                                <li>✓ Template Builder</li>
                                <li>✓ Priority support</li>
                            </ul>
                            <button class="upgrade-btn" onclick="subscriptionManager.startUpgrade('patron')">
                                Upgrade to Patron
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Start upgrade process (integrate with Stripe later)
    async startUpgrade(tier) {
        // For now, show success message - later integrate with payment processor
        console.log(`Starting upgrade to ${tier}`);
        
        // Simulate successful upgrade for demo
        if (confirm(`Upgrade to ${tier.toUpperCase()} tier? (Demo mode - no payment required)`)) {
            const userId = auth.currentUser?.uid;
            if (userId) {
                await this.upgradeUser(userId, tier);
                location.reload(); // Refresh to show new permissions
            }
        }
    }

    // Get user's current usage stats
    async getUserUsageStats(userId) {
        try {
            const collections = await db.collection('collections')
                .where('userId', '==', userId)
                .get();
            
            let totalItems = 0;
            collections.forEach(doc => {
                const collection = doc.data();
                totalItems += collection.items ? collection.items.length : 0;
            });

            return {
                collections: collections.size,
                items: totalItems
            };
        } catch (error) {
            console.error('Error getting usage stats:', error);
            return { collections: 0, items: 0 };
        }
    }

    // Show usage stats in UI
    async displayUsageStats(userId) {
        const tier = await this.getUserTier(userId);
        const usage = await this.getUserUsageStats(userId);
        const limits = this.getTierLimits(tier);

        const statsContainer = document.getElementById('usage-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="usage-stats">
                    <h3>Your ${limits.name} Plan</h3>
                    <div class="stat">
                        <span>Collections:</span>
                        <span>${usage.collections} / ${limits.maxCollections === 1000 ? '∞' : limits.maxCollections}</span>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(100, (usage.collections / limits.maxCollections) * 100)}%"></div>
                        </div>
                    </div>
                    <div class="stat">
                        <span>Items:</span>
                        <span>${usage.items} / ${limits.maxItems === 100000 ? '∞' : limits.maxItems}</span>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${Math.min(100, (usage.items / limits.maxItems) * 100)}%"></div>
                        </div>
                    </div>
                    ${tier === 'free' ? `
                        <button class="upgrade-prompt-btn" onclick="subscriptionManager.showTemplateBuilderUpgradePrompt()">
                            🚀 Upgrade for Template Builder
                        </button>
                    ` : ''}
                </div>
            `;
        }
    }
}

// Global instance
const subscriptionManager = new SubscriptionManager();

// CSS for subscription modals and components
const subscriptionStyles = `
    .subscription-upgrade-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    }

    .subscription-upgrade-modal .modal-content {
        background: var(--dark-slate);
        border: 2px solid var(--electric-magenta);
        border-radius: 12px;
        padding: 2rem;
        max-width: 600px;
        width: 90vw;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 0 30px rgba(255, 0, 255, 0.3);
    }

    .subscription-upgrade-modal .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--electric-magenta);
    }

    .subscription-upgrade-modal .modal-header h2 {
        color: var(--laser-green);
        font-family: 'Orbitron', monospace;
        margin: 0;
    }

    .subscription-upgrade-modal .close-btn {
        background: none;
        border: none;
        color: var(--off-white);
        font-size: 2rem;
        cursor: pointer;
        transition: color 0.3s ease;
    }

    .subscription-upgrade-modal .close-btn:hover {
        color: var(--laser-green);
    }

    .tier-comparison {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-top: 1.5rem;
    }

    .tier {
        background: var(--deep-charcoal);
        border: 1px solid var(--vibrant-cyan);
        border-radius: 8px;
        padding: 1.5rem;
        transition: all 0.3s ease;
    }

    .tier.current-tier {
        border-color: #666;
        opacity: 0.7;
    }

    .tier.recommended-tier {
        border-color: var(--laser-green);
        box-shadow: 0 0 20px rgba(0, 255, 127, 0.2);
        transform: scale(1.05);
    }

    .tier h3 {
        color: var(--laser-green);
        font-family: 'Orbitron', monospace;
        margin: 0 0 1rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .tier .price {
        font-size: 0.9rem;
        color: var(--electric-magenta);
    }

    .tier ul {
        list-style: none;
        padding: 0;
        margin: 0 0 1.5rem 0;
    }

    .tier li {
        padding: 0.5rem 0;
        color: var(--off-white);
    }

    .tier li strong {
        color: var(--laser-green);
    }

    .upgrade-btn {
        width: 100%;
        background: linear-gradient(45deg, var(--laser-green), var(--vibrant-cyan));
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 6px;
        color: var(--deep-charcoal);
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1rem;
    }

    .upgrade-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 255, 127, 0.4);
    }

    .usage-stats {
        background: var(--dark-slate);
        border: 1px solid var(--vibrant-cyan);
        border-radius: 8px;
        padding: 1.5rem;
        margin: 1rem 0;
    }

    .usage-stats h3 {
        color: var(--laser-green);
        font-family: 'Orbitron', monospace;
        margin: 0 0 1rem 0;
    }

    .usage-stats .stat {
        margin: 1rem 0;
    }

    .usage-stats .stat span:first-child {
        color: var(--off-white);
        margin-right: 1rem;
    }

    .usage-stats .stat span:last-child {
        color: var(--electric-magenta);
        font-weight: bold;
    }

    .progress-bar {
        background: var(--deep-charcoal);
        height: 8px;
        border-radius: 4px;
        margin: 0.5rem 0;
        overflow: hidden;
    }

    .progress-bar .progress {
        background: linear-gradient(90deg, var(--laser-green), var(--vibrant-cyan));
        height: 100%;
        transition: width 0.3s ease;
    }

    .upgrade-prompt-btn {
        width: 100%;
        background: linear-gradient(45deg, var(--electric-magenta), var(--laser-green));
        border: none;
        padding: 0.8rem;
        border-radius: 6px;
        color: var(--deep-charcoal);
        font-weight: bold;
        cursor: pointer;
        margin-top: 1rem;
        transition: all 0.3s ease;
    }

    .upgrade-prompt-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 0, 255, 0.4);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = subscriptionStyles;
document.head.appendChild(styleSheet); 