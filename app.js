// Game State
let state = {
    day: 1,
    maxDays: 30,
    wallet: 100,
    bank: 0,
    debt: 5000,
    inventory: {
        'Polyjuice Potion': 0,
        'Doxy Eggs': 0,
        'Venomous Tentacula Seeds': 0,
        'Veritaserum': 0,
        'Acromantula Venom': 0,
        'Dragon Eggs': 0
    },
    maxSpace: 20,
    currentLocation: 'Diagon Alley'
};

// Items Base Configuration (Tweaked Price Points)
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

// Initialize Game
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
        return; // We will add an actual endgame screen later
    }
    state.currentLocation = newLocation;
    state.day++;
    state.debt = Math.floor(state.debt * 1.05); // 5% daily interest
    generatePrices();
    updateUI();
}

// Buy Logic (with Multi-buy)
function buyItem(item) {
    // Get the quantity from the input field, default to 1 if empty
    const inputId = `buy-qty-${item.replace(/\s+/g, '-')}`;
    const qty = parseInt(document.getElementById(inputId).value) || 1;
    
    if (qty <= 0) return;

    const price = currentPrices[item];
    const totalCost = price * qty;
    const currentSpace = Object.values(state.inventory).reduce((a, b) => a + b, 0);
    
    if (currentSpace + qty > state.maxSpace) {
        alert("Not enough space in your cloak!");
        return;
    }
    
    if (state.wallet >= totalCost) {
        state.wallet -= totalCost;
        state.inventory[item] += qty;
        updateUI();
    } else {
        alert("Not enough Galleons!");
    }
}

// Sell Logic (with Multi-sell)
function sellItem(item) {
    const inputId = `sell-qty-${item.replace(/\s+/g, '-')}`;
    const qty = parseInt(document.getElementById(inputId).value) || 1;
    
    if (qty <= 0) return;

    if (state.inventory[item] >= qty) {
        const price = currentPrices[item];
        state.wallet += price * qty;
        state.inventory[item] -= qty;
        updateUI();
    } else {
        alert("You don't have that many to sell!");
    }
}

// Bank Logic
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

// Debt Logic
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

// UI Rendering
function updateUI() {
    document.getElementById('current-location').innerText = state.currentLocation;
    document.getElementById('day').innerText = state.day;
    document.getElementById('wallet').innerText = state.wallet;
    document.getElementById('bank').innerText = state.bank;
    document.getElementById('debt').innerText = state.debt;
    
    const currentSpace = Object.values(state.inventory).reduce((a, b) => a + b, 0);
    document.getElementById('inventory-count').innerText = currentSpace;

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

    // Render Market (With Quantity Inputs)
    const marketList = document.getElementById('market-list');
    marketList.innerHTML = '';
    for (let item in currentPrices) {
        const inputId = `buy-qty-${item.replace(/\s+/g, '-')}`;
        marketList.innerHTML += `
            <div class="market-item">
                <span>${item} <br><strong>${currentPrices[item]}G</strong></span>
                <div>
                    <input type="number" id="${inputId}" value="1" min="1" style="width: 40px;">
                    <button onclick="buyItem('${item}')">Buy</button>
                </div>
            </div>
        `;
    }

    // Render Inventory (With Quantity Inputs)
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '';
    for (let item in state.inventory) {
        if (state.inventory[item] > 0) {
            const inputId = `sell-qty-${item.replace(/\s+/g, '-')}`;
            inventoryList.innerHTML += `
                <div class="inventory-item">
                    <span>${item} <br>(x${state.inventory[item]})</span>
                    <div>
                        <input type="number" id="${inputId}" value="1" min="1" style="width: 40px;">
                        <button onclick="sellItem('${item}')">Sell</button>
                    </div>
                </div>
            `;
        }
    }

    // Render Locations (Fixed apostrophe bug with backticks)
    const locationsList = document.getElementById('locations-list');
    locationsList.innerHTML = '';
    locations.forEach(loc => {
        if (loc !== state.currentLocation) {
            locationsList.innerHTML += `<button onclick="travel(\`${loc}\`)">${loc}</button>`;
        }
    });
}
