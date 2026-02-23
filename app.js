// Game State
let state = {
    day: 1,
    maxDays: 30,
    wallet: 100,
    debt: 5000,
    inventory: {
        'Polyjuice Potion': 0,
        'Doxy Eggs': 0,
        'Acromantula Venom': 0,
        'Dragon Eggs': 0
    },
    maxSpace: 20,
    currentLocation: 'Diagon Alley'
};

// Items Base Configuration
const items = {
    'Polyjuice Potion': { min: 10, max: 30 },
    'Doxy Eggs': { min: 50, max: 120 },
    'Acromantula Venom': { min: 300, max: 800 },
    'Dragon Eggs': { min: 1000, max: 3000 }
};

// Current Market Prices
let currentPrices = {};

const locations = ['Diagon Alley', 'Knockturn Alley', 'Hogsmeade', 'Forbidden Forest', 'Godric\'s Hollow'];

// DOM Elements
const titleScreen = document.getElementById('title-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const themeMusic = document.getElementById('theme-music');

// Initialize Game
startBtn.addEventListener('click', () => {
    titleScreen.classList.remove('active');
    gameScreen.classList.active = 'active'; // Fix display
    gameScreen.style.display = 'block'; 
    themeMusic.play().catch(e => console.log("Audio playback prevented"));
    
    generatePrices();
    updateUI();
});

// Logic: Generate Random Prices
function generatePrices() {
    for (let item in items) {
        const min = items[item].min;
        const max = items[item].max;
        currentPrices[item] = Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Logic: Travel
function travel(newLocation) {
    if (state.day >= state.maxDays) {
        alert("Game Over! Time to face Borgin & Burkes.");
        return;
    }
    state.currentLocation = newLocation;
    state.day++;
    state.debt = Math.floor(state.debt * 1.05); // 5% daily interest on debt
    
    generatePrices();
    updateUI();
}

// Logic: Buy
function buyItem(item) {
    const price = currentPrices[item];
    const currentSpace = Object.values(state.inventory).reduce((a, b) => a + b, 0);
    
    if (state.wallet >= price && currentSpace < state.maxSpace) {
        state.wallet -= price;
        state.inventory[item]++;
        updateUI();
    } else {
        alert("Not enough Galleons or Cloak Space!");
    }
}

// Logic: Sell
function sellItem(item) {
    if (state.inventory[item] > 0) {
        const price = currentPrices[item];
        state.wallet += price;
        state.inventory[item]--;
        updateUI();
    }
}

// UI Rendering
function updateUI() {
    document.getElementById('current-location').innerText = state.currentLocation;
    document.getElementById('day').innerText = state.day;
    document.getElementById('wallet').innerText = state.wallet;
    document.getElementById('debt').innerText = state.debt;
    
    const currentSpace = Object.values(state.inventory).reduce((a, b) => a + b, 0);
    document.getElementById('inventory-count').innerText = currentSpace;

    // Render Market
    const marketList = document.getElementById('market-list');
    marketList.innerHTML = '';
    for (let item in currentPrices) {
        marketList.innerHTML += `
            <div class="market-item">
                <span>${item} (${currentPrices[item]}G)</span>
                <button onclick="buyItem('${item}')">Buy</button>
            </div>
        `;
    }

    // Render Inventory
    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '';
    for (let item in state.inventory) {
        if (state.inventory[item] > 0) {
            inventoryList.innerHTML += `
                <div class="inventory-item">
                    <span>${item} (x${state.inventory[item]})</span>
                    <button onclick="sellItem('${item}')">Sell</button>
                </div>
            `;
        }
    }

    // Render Locations
    const locationsList = document.getElementById('locations-list');
    locationsList.innerHTML = '';
    locations.forEach(loc => {
        if (loc !== state.currentLocation) {
            locationsList.innerHTML += `<button onclick="travel('${loc}')">${loc}</button>`;
        }
    });
}
