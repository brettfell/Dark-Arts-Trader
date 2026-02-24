// Game State
let state = {
    day: 1,
    maxDays: 30,
    wallet: 100,
    bank: 0,
    debt: 5000,
    // Inventory now tracks quantity (qty) and average cost (avgCost)
    inventory: {
        'Polyjuice Potion': { qty: 0, avgCost: 0 },
        'Doxy Eggs': { qty: 0, avgCost: 0 },
        'Venomous Tentacula Seeds': { qty: 0, avgCost: 0 },
        'Veritaserum': { qty: 0, avgCost: 0 },
        'Acromantula Venom': { qty: 0, avgCost: 0 },
        'Dragon Eggs': { qty: 0, avgCost: 0 }
    },
    maxSpace: 50,
    currentLocation: 'Knockturn Alley' // Updated starting location
};

const items = {
    'Polyjuice Potion': { min: 10, max: 30 },
    'Doxy Eggs': { min: 50, max: 120 },
    'Venomous Tentacula Seeds': { min: 150, max: 300 },
    'Veritaserum': { min: 500, max: 1000 },
    'Acromantula Venom': { min: 1500, max: 2500 },
    'Dragon Eggs': { min: 3000, max: 6000 }
};

let currentPrices = {};
const locations = ['Diagon Alley', 'Knockturn Alley', 'Hogsmeade', 'Forbidden Forest', 'Godric\'s Hollow'];

const titleScreen = document.getElementById('title-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const themeMusic = document.getElementById('theme-music');

startBtn.addEventListener('click', () => {
    titleScreen.classList.remove('active');
    gameScreen.classList.add('active'); 
    gameScreen.style.display = 'block'; 
    themeMusic.play().catch(e => console.log("Audio playback prevented"));
    generatePrices();
    updateUI();
});

function generatePrices() {
    for (let item in items) {
        const min = items[item].min;
        const max = items[item].max;
        currentPrices[item] = Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

function travel(newLocation) {
    if (state.day >= state.maxDays) {
        alert("Time is up! Let's see if you survived Borgin & Burkes...");
        return; 
    }
    state.currentLocation = newLocation;
    state.day++;
    state.debt = Math.floor(state.debt * 1.05); 
    generatePrices();
    updateUI();
}

function buyItem(item) {
    const inputId = `buy-qty-${item.replace(/\s+/g, '-')}`;
    const qty = parseInt(document.getElementById(inputId).value) || 1;
    
    if (qty <= 0) return;

    const price = currentPrices[item];
    const totalCost = price * qty;
    
    let currentSpace = 0;
    for (let i in state.inventory) currentSpace += state.inventory[i].qty;
    
    if (currentSpace + qty > state.maxSpace) {
        alert("Not enough pockets in your cloak!");
        return;
    }
    
    if (state.wallet >= totalCost) {
        state.wallet -= totalCost;
        
        // Calculate new average cost
        const oldQty = state.inventory[item].qty;
        const oldAvg = state.inventory[item].avgCost;
        const newTotalQty = oldQty + qty;
        const newAvg = ((oldQty * oldAvg) + totalCost) / newTotalQty;
        
        state.inventory[item].qty = newTotalQty;
        state.inventory[item].avgCost = newAvg;
        
        updateUI();
    } else {
        alert("Not enough Galleons!");
    }
}

function sellItem(item) {
    const inputId = `sell-qty-${item.replace(/\s+/g, '-')}`;
    const qty = parseInt(document.getElementById(inputId).value) || 1;
    
    if (qty <= 0) return;

    if (state.inventory[item].qty >= qty) {
        const price = currentPrices[item];
        state.wallet += price * qty;
        state.inventory[item].qty -= qty;
        
        // Reset average cost if you sell out completely
        if (state.inventory[item].qty === 0) {
            state.inventory[item].avgCost = 0;
        }
        
        updateUI();
    } else {
        alert("You don't have that many to sell!");
    }
}

function bankTransaction(type) {
    const amount = parseInt(document.getElementById('bank-amount').value) || 0;
    if (amount <= 0) return;

    if (type === 'deposit' && state.wallet >= amount) {
        state.wallet -= amount;
        state.bank += amount;
    } else if (type === 'withdraw' && state.bank >= amount) {
        state.bank -= amount;
        state.wallet += amount;
    } else {
        alert("Invalid funds!");
    }
    updateUI();
}

function payDebt() {
    const amount = parseInt(document.getElementById('debt-amount').value) || 0;
    if (amount <= 0) return;

    if (state.wallet >= amount) {
        state.wallet -= amount;
        state.debt -= amount;
        if (state.debt < 0) state.debt = 0;
    } else {
        alert("You don't have enough Galleons on you!");
    }
    updateUI();
}

function updateUI() {
    document.getElementById('current-location').innerText = state.currentLocation;
    document.getElementById('day').innerText = state.day;
    document.getElementById('wallet').innerText = state.wallet;
    document.getElementById('bank').innerText = state.bank;
    document.getElementById('debt').innerText = state.debt;
    
    let currentSpace = 0;
    for (let i in state.inventory) currentSpace += state.inventory[i].qty;
    document.getElementById('inventory-count').innerText = currentSpace;
    document.getElementById('max-space').innerText = state.maxSpace;

    // Location Specific Panels
    const locPanel = document.getElementById('location-actions-panel');
    const locTitle = document.getElementById('location-action-title');
    const locContent = document.getElementById('location-action-content');
    
    if (state.currentLocation === 'Diagon Alley') {
        locPanel.style.display = 'block';
        locTitle.innerText = "Gringotts Wizarding Bank";
        locContent.innerHTML = `
            <input type="number" id="bank-amount" min="1" placeholder="Amount">
            <button onclick="bankTransaction('deposit')">Deposit</button>
            <button onclick="bankTransaction('withdraw')">Withdraw</button>
        `;
    } else if (state.currentLocation === 'Knockturn Alley') {
        locPanel.style.display = 'block';
        locTitle.innerText = "Borgin & Burkes";
        locContent.innerHTML = `
            <input type="number" id="debt-amount" min="1" placeholder="Amount">
            <button onclick="payDebt()">Pay Down Debt</button>
        `;
    } else {
        locPanel.style.display = 'none';
    }

    // Render Market (With Affordability)
    const marketList = document.getElementById('market-list');
    marketList.innerHTML = '';
    for (let item in currentPrices) {
        const price = currentPrices[item];
        
        // Calculate max afford based on wallet and available pockets
        const maxAffordByWallet = Math.floor(state.wallet / price);
        const availablePockets = state.maxSpace - currentSpace;
        const canAfford = Math.min(maxAffordByWallet, availablePockets);
        
        const inputId = `buy-qty-${item.replace(/\s+/g, '-')}`;
        marketList.innerHTML += `
            <div class="market-item">
                <span>${item} <br><strong>${price}G</strong> <small>(Max: ${canAfford})</small></span>
                <div>
                    <input type="number" id="${inputId}" value="${canAfford > 0 ? 1 : 0}" min="1" max="${canAfford > 0 ? canAfford : 1}" style="width: 40px;">
                    <button onclick="buyItem('${item}')">Buy</button>
                </div>
            </div>
        `;
    }

    // Render Inventory (With Average Cost)
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '';
    for (let item in state.inventory) {
        const invItem = state.inventory[item];
        if (invItem.qty > 0) {
            const avgCost = Math.round(invItem.avgCost);
            const inputId = `sell-qty-${item.replace(/\s+/g, '-')}`;
            inventoryList.innerHTML += `
                <div class="inventory-item">
                    <span>${item} <br>(Qty: ${invItem.qty} @ ${avgCost}G avg)</span>
                    <div>
                        <input type="number" id="${inputId}" value="${invItem.qty}" min="1" max="${invItem.qty}" style="width: 40px;">
                        <button onclick="sellItem('${item}')">Sell</button>
                    </div>
                </div>
            `;
        }
    }

    const locationsList = document.getElementById('locations-list');
    locationsList.innerHTML = '';
    locations.forEach(loc => {
        if (loc !== state.currentLocation) {
            locationsList.innerHTML += `<button onclick="travel(\`${loc}\`)">${loc}</button>`;
        }
    });
}
