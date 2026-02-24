// Game State v1.4
let state = {
    day: 1,
    maxDays: 30,
    wallet: 100,
    bank: 0,
    debt: 5000,
    inventory: {
        'Polyjuice Potion': { qty: 0, avgCost: 0 },
        'Doxy Eggs': { qty: 0, avgCost: 0 },
        'Venomous Tentacula Seeds': { qty: 0, avgCost: 0 },
        'Veritaserum': { qty: 0, avgCost: 0 },
        'Acromantula Venom': { qty: 0, avgCost: 0 },
        'Dragon Eggs': { qty: 0, avgCost: 0 }
    },
    maxSpace: 50,
    currentLocation: 'Knockturn Alley' 
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

// v1.4 Random Events Logic
function triggerRandomEvents() {
    // Array of events. Event F (Crackdown) is listed 3 times to make it more frequent.
    const eventPool = ['A', 'B', 'C', 'D', 'E', 'F', 'F', 'F', 'G', 'H', 'I'];
    const chosenEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
    
    // Helper to see what the player actually owns
    const ownedItems = Object.keys(state.inventory).filter(item => state.inventory[item].qty > 0);

    switch(chosenEvent) {
        case 'A': // Squib Discount
            currentPrices['Dragon Eggs'] = Math.floor(currentPrices['Dragon Eggs'] * 0.25);
            alert("You must be on some Felix Felicis! A squib in the alley is selling Dragon Eggs for Sickles on the Galleon!");
            break;

        case 'B': // Reginald the Peddler
            const pockets = Math.floor(Math.random() * 11) + 5; // 5 to 15 pockets
            const cost = Math.floor(Math.random() * 251) + 150; // 150 to 400 Galleons
            // confirm() creates a popup with OK and Cancel buttons
            if (confirm(`Cloak peddler Reginald whispers: "Pst... want to buy a cloak with ${pockets} extra pockets for ${cost} Galleons?"`)) {
                if (state.wallet >= cost) {
                    state.wallet -= cost;
                    state.maxSpace += pockets;
                    alert("You bought the cloak! Extra pockets added.");
                } else {
                    alert("You don't have enough Galleons! Reginald scoffs and vanishes.");
                }
            }
            break;

        case 'C': // Amortentia Trap
            if (ownedItems.length > 0) {
                const lostItem = ownedItems[Math.floor(Math.random() * ownedItems.length)];
                const lostAmount = Math.ceil(state.inventory[lostItem].qty / 2); // Lose half
                state.inventory[lostItem].qty -= lostAmount;
                if(state.inventory[lostItem].qty === 0) state.inventory[lostItem].avgCost = 0;
                alert(`An unknown witch at the pub slipped Amortentia in your mead! Before it wore off, you gave her ${lostAmount} of your ${lostItem}.`);
            }
            break;

        case 'D': // Knight Bus Trunk
            const midTier = ['Venomous Tentacula Seeds', 'Veritaserum'];
            const foundItem = midTier[Math.floor(Math.random() * midTier.length)];
            const foundQty = Math.floor(Math.random() * 5) + 2; // 2 to 6 items
            
            let currentSpace = 0;
            for (let i in state.inventory) currentSpace += state.inventory[i].qty;
            const availableSpace = state.maxSpace - currentSpace;
            const actualGained = Math.min(foundQty, availableSpace);
            
            if (actualGained > 0) {
                const oldQty = state.inventory[foundItem].qty;
                const oldAvg = state.inventory[foundItem].avgCost;
                const newTotalQty = oldQty + actualGained;
                // Finding free items lowers your average cost!
                const newAvg = (oldQty * oldAvg) / newTotalQty; 
                
                state.inventory[foundItem].qty = newTotalQty;
                state.inventory[foundItem].avgCost = newAvg;
                alert(`A curious old Warlock on the Knight Bus left his trunk unlocked! You swiped ${actualGained} ${foundItem} and got off at the next stop.`);
            }
            break;

        case 'E': // Niffler Pickpocket
            if (state.wallet > 0) {
                const lossPercent = (Math.floor(Math.random() * 11) + 10) / 100; // 10% to 20%
                const lostCash = Math.floor(state.wallet * lossPercent);
                state.wallet -= lostCash;
                alert(`A stray Niffler scurried up your leg! It made off with ${lostCash} of your shiny Galleons!`);
            }
            break;

        case 'F': // Ministry Crackdown
            const highTier = ['Acromantula Venom', 'Dragon Eggs', 'Veritaserum'];
            const lowTier = ['Polyjuice Potion', 'Doxy Eggs', 'Venomous Tentacula Seeds'];
            let spikeItem;
            
            // 70% chance to spike a high tier item, 30% chance for a low tier item
            if (Math.random() < 0.7) { 
                spikeItem = highTier[Math.floor(Math.random() * highTier.length)];
            } else {
                spikeItem = lowTier[Math.floor(Math.random() * lowTier.length)];
            }
            
            const multiplier = Math.floor(Math.random() * 3) + 3; // 3x to 5x spike
            currentPrices[spikeItem] *= multiplier;
            alert(`Aurors just raided a massive smuggling ring! The black market is dry and prices for ${spikeItem} have skyrocketed!`);
            break;

        case 'G': // Careless Tourist
            const foundCash = Math.floor(Math.random() * 151) + 50; // 50 to 200
            state.wallet += foundCash;
            alert(`A wealthy wizard dropped their coin purse outside the Leaky Cauldron. Finders keepers! You gained ${foundCash} Galleons.`);
            break;

        case 'H': // Spoiled Batch
            if (ownedItems.length > 0) {
                const spoiledItem = ownedItems[Math.floor(Math.random() * ownedItems.length)];
                const spoiledQty = state.inventory[spoiledItem].qty;
                state.inventory[spoiledItem].qty = 0;
                state.inventory[spoiledItem].avgCost = 0;
                alert(`Your stash of ${spoiledItem} wasn't sealed properly and went bad! You had to vanish all ${spoiledQty} of them.`);
            }
            break;

        case 'I': // Cheap Polyjuice
            currentPrices['Polyjuice Potion'] = 5;
            alert(`"Hey buddy, need someone to test this cheap homemade Polyjuice? 5 Galleons a vial!"`);
            break;
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
    
    // 30% Chance to trigger an event upon travel
    if (Math.random() < 0.30) {
        triggerRandomEvents();
    }
    
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

    const marketList = document.getElementById('market-list');
    marketList.innerHTML = '';
    for (let item in currentPrices) {
        const price = currentPrices[item];
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

