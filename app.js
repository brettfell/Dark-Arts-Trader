// Game State v1.6
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

// DOM Elements
const titleScreen = document.getElementById('title-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const themeMusic = document.getElementById('theme-music');
const modal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalButtons = document.getElementById('modal-buttons');

// Custom Modal System
function showModal(title, message, buttons = [{text: 'OK', action: null}]) {
    modalTitle.innerText = title;
    modalMessage.innerText = message;
    modalButtons.innerHTML = ''; 

    buttons.forEach(btn => {
        const buttonEl = document.createElement('button');
        buttonEl.innerText = btn.text;
        buttonEl.onclick = () => {
            modal.style.display = 'none'; 
            if (btn.action) btn.action(); 
        };
        modalButtons.appendChild(buttonEl);
    });

    modal.style.display = 'block';
}

startBtn.addEventListener('click', () => {
    titleScreen.classList.remove('active');
    gameScreen.classList.add('active'); 
    themeMusic.play().catch(e => console.log("Audio playback prevented"));
    generatePrices();
    
    if (Math.random() < 0.30) {
        triggerRandomEvents();
    }
    
    updateUI();
});

function generatePrices() {
    for (let item in items) {
        const min = items[item].min;
        const max = items[item].max;
        currentPrices[item] = Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Random Events Logic
function triggerRandomEvents() {
    const eventPool = ['A', 'B', 'C', 'D', 'E', 'F', 'F', 'F', 'G', 'H', 'I'];
    const chosenEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
    
    const ownedItems = Object.keys(state.inventory).filter(item => state.inventory[item].qty > 0);

    switch(chosenEvent) {
        case 'A': // Squib Discount
            currentPrices['Dragon Eggs'] = Math.floor(currentPrices['Dragon Eggs'] * 0.25);
            showModal("Lucky Find!", "You must be on some Felix Felicis! A squib in the alley is selling Dragon Eggs for Sickles on the Galleon!");
            updateUI(); 
            break;

        case 'B': // Reginald the Peddler
            const pockets = Math.floor(Math.random() * 11) + 5; 
            const cost = Math.floor(Math.random() * 251) + 150; 
            
            showModal("Shady Deal", `Cloak peddler Reginald whispers: "Pst... want to buy a cloak with ${pockets} extra pockets for ${cost}g?"`, [
                { 
                    text: "Yes", 
                    action: () => {
                        if (state.wallet >= cost) {
                            state.wallet -= cost;
                            state.maxSpace += pockets;
                            showModal("Success!", "You bought the cloak! Extra pockets added.");
                            updateUI();
                        } else {
                            showModal("Broke!", "You don't have enough Galleons! Reginald scoffs and vanishes.");
                        }
                    } 
                },
                { text: "No", action: null }
            ]);
            break;

        case 'C': // Amortentia Trap
            const multiItems = ownedItems.filter(item => state.inventory[item].qty > 1);
            if (multiItems.length > 0) {
                const lostItem = multiItems[Math.floor(Math.random() * multiItems.length)];
                const lostAmount = Math.ceil(state.inventory[lostItem].qty / 2); 
                state.inventory[lostItem].qty -= lostAmount;
                showModal("Tricked!", `An unknown witch at the pub slipped Amortentia in your mead! Before it wore off, you gave her ${lostAmount} of your ${lostItem}.`);
                updateUI();
            }
            break;

        case 'D': // Knight Bus Trunk
            const midTier = ['Venomous Tentacula Seeds', 'Veritaserum'];
            const foundItem = midTier[Math.floor(Math.random() * midTier.length)];
            const foundQty = Math.floor(Math.random() * 5) + 2; 
            
            const oldQty = state.inventory[foundItem].qty;
            const oldAvg = state.inventory[foundItem].avgCost;
            const newTotalQty = oldQty + foundQty;
            const newAvg = (oldQty * oldAvg) / newTotalQty; 
            
            state.inventory[foundItem].qty = newTotalQty;
            state.inventory[foundItem].avgCost = newAvg;
            
            showModal("Score!", `A curious old Warlock on the Knight Bus left his trunk unlocked! You swiped ${foundQty} ${foundItem} and got off at the next stop.`);
            updateUI();
            break;

        case 'E': // Niffler Pickpocket
            if (state.wallet > 0) {
                const lossPercent = (Math.floor(Math.random() * 11) + 10) / 100; 
                const lostCash = Math.floor(state.wallet * lossPercent);
                state.wallet -= lostCash;
                showModal("Niffler!", `A stray Niffler scurried up your leg! It made off with ${lostCash}g of your shiny Galleons!`);
                updateUI();
            }
            break;

        case 'F': // Ministry Crackdown
            const highTier = ['Acromantula Venom', 'Dragon Eggs', 'Veritaserum'];
            const lowTier = ['Polyjuice Potion', 'Doxy Eggs', 'Venomous Tentacula Seeds'];
            let spikeItem = (Math.random() < 0.7) ? highTier[Math.floor(Math.random() * highTier.length)] : lowTier[Math.floor(Math.random() * lowTier.length)];
            
            currentPrices[spikeItem] *= (Math.floor(Math.random() * 3) + 3);
            showModal("Ministry Raid!", `Aurors just raided a massive smuggling ring! The black market is dry and prices for ${spikeItem} have skyrocketed!`);
            updateUI();
            break;

        case 'G': // Careless Tourist
            const foundCash = Math.floor(Math.random() * 151) + 50; 
            state.wallet += foundCash;
            showModal("Found Galleons", `A wealthy wizard dropped their coin purse outside the Leaky Cauldron. Finders keepers! You gained ${foundCash}g.`);
            updateUI();
            break;

        case 'H': // Spoiled Batch (Ruins 75%)
            const spoilableItems = ownedItems.filter(item => state.inventory[item].qty > 1);
            if (spoilableItems.length > 0) {
                const spoiledItem = spoilableItems[Math.floor(Math.random() * spoilableItems.length)];
                const lostQty = Math.ceil(state.inventory[spoiledItem].qty * 0.75);
                state.inventory[spoiledItem].qty -= lostQty;
                showModal("Spoiled!", `Your stash of ${spoiledItem} wasn't sealed properly and went bad! You had to vanish ${lostQty} of them, but managed to save the rest.`);
                updateUI();
            }
            break;

        case 'I': // Cheap Polyjuice
            currentPrices['Polyjuice Potion'] = 5;
            showModal("Street Deal", `"Hey buddy, need someone to test this cheap homemade Polyjuice? 5g a vial!"`);
            updateUI();
            break;
    }
}

function travel(newLocation) {
    if (state.day >= state.maxDays) {
        endGame();
        return; 
    }
    state.currentLocation = newLocation;
    state.day++;
    
    // Kept 5% daily interest
    state.debt = Math.floor(state.debt * 1.05); 
    generatePrices();
    
    if (Math.random() < 0.30) {
        triggerRandomEvents();
    }
    
    updateUI();
}

function endGame() {
    const gameScreen = document.getElementById('game-screen');
    gameScreen.classList.remove('active');
    gameScreen.style.display = 'none';
    
    const endScreen = document.getElementById('end-screen');
    const endTitle = document.getElementById('end-title');
    const endMessage = document.getElementById('end-message');
    const finalScore = document.getElementById('final-score');
    
    endScreen.classList.add('active');
    endScreen.style.display = 'block';

    if (state.debt === 0) {
        const totalWealth = state.wallet + state.bank;
        endTitle.innerText = "You Survived!";
        endMessage.innerText = "You successfully paid off Borgin and kept yourself out of Azkaban. Time to lay low in the Hog's Head for a while.";
        finalScore.innerText = `Final Score: ${totalWealth}g`;
    } else {
        endTitle.innerText = "Busted!";
        endMessage.innerText = `You failed to pay off your debt. Borgin tipped off the Ministry Aurors, handing them the fake fang. You were dragged to Azkaban owing ${state.debt}g.`;
        finalScore.innerText = "Final Score: Dementor's Kiss";
    }
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
        showModal("Inventory Full", "Not enough pockets in your cloak!");
        return;
    }
    
    if (state.wallet >= totalCost) {
        state.wallet -= totalCost;
        const oldQty = state.inventory[item].qty;
        const oldAvg = state.inventory[item].avgCost;
        const newTotalQty = oldQty + qty;
        state.inventory[item].qty = newTotalQty;
        state.inventory[item].avgCost = ((oldQty * oldAvg) + totalCost) / newTotalQty;
        updateUI();
    } else {
        showModal("Not enough funds", "You don't have enough Galleons!");
    }
}

function sellItem(item) {
    const inputId = `sell-qty-${item.replace(/\s+/g, '-')}`;
    const qty = parseInt(document.getElementById(inputId).value) || 1;
    if (qty <= 0) return;

    if (state.inventory[item].qty >= qty) {
        state.wallet += currentPrices[item] * qty;
        state.inventory[item].qty -= qty;
        if (state.inventory[item].qty === 0) state.inventory[item].avgCost = 0;
        updateUI();
    } else {
        showModal("Error", "You don't have that many to sell!");
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
        showModal("Error", "Invalid funds!");
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
        showModal("Error", "You don't have enough Galleons on you!");
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
    
    const invCountEl = document.getElementById('inventory-count');
    invCountEl.innerText = currentSpace;
    invCountEl.style.color = (currentSpace > state.maxSpace) ? "var(--accent-color)" : "inherit";
    
    document.getElementById('max-space').innerText = state.maxSpace;

    const locPanel = document.getElementById('location-actions-panel');
    const locTitle = document.getElementById('location-action-title');
    const locContent = document.getElementById('location-action-content');
    
    if (state.currentLocation === 'Diagon Alley') {
        locPanel.style.display = 'block';
        locTitle.innerText = "Gringotts Vault";
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
        const canAfford = Math.max(0, Math.min(maxAffordByWallet, availablePockets));
        
        const inputId = `buy-qty-${item.replace(/\s+/g, '-')}`;
        marketList.innerHTML += `
            <div class="market-item">
                <span>${item} <br><strong>${price}g</strong> <small>(Max: ${canAfford})</small></span>
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
                    <span>${item} <br>(Qty: ${invItem.qty} @ ${avgCost}g avg)</span>
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
