// Game State v1.9.3
let state = {
    day: 1,
    maxDays: 30,
    health: 100,
    wallet: 100,
    bank: 0,
    debt: 5000,
    wandLevel: 0, 
    potionsAvailable: 0,
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

const wands = [
    { name: 'None', cost: 0, power: 0 },
    { name: 'Splintered Wand', cost: 500, power: 1 },
    { name: 'Stolen Ministry Wand', cost: 2500, power: 2 },
    { name: 'Unregistered Dueling Wand', cost: 8000, power: 3 }
];

let currentPrices = {};
const locations = ['Diagon Alley', 'Knockturn Alley', 'Hogsmeade', 'Forbidden Forest', 'Godric\'s Hollow'];

const titleScreen = document.getElementById('title-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const themeMusic = document.getElementById('theme-music');
const modal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalButtons = document.getElementById('modal-buttons');

document.body.classList.add('bg-title');

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
    titleScreen.style.display = 'none'; 
    gameScreen.classList.add('active'); 
    gameScreen.style.display = 'block'; 
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

function triggerCombat() {
    showModal("Ministry Ambush!", "Aurors have tracked your movements! What do you do?", [
        { text: "Fight", action: () => resolveCombat(true) },
        { text: "Flee", action: () => resolveCombat(false) }
    ]);
}

function resolveCombat(isFighting) {
    const wandPower = wands[state.wandLevel].power;
    const aurorStrength = Math.floor(Math.random() * 3) + 1; 
    let damage = 0;

    if (isFighting) {
        if (wandPower >= aurorStrength) {
            showModal("Victory!", "Your wandwork was too quick for them. They retreated, and you found some dropped Galleons!", [{text: "Loot & Run", action: () => {
                state.wallet += Math.floor(Math.random() * 200) + 50;
                updateUI();
            }}]);
            return;
        } else {
            damage = Math.floor(Math.random() * 30) + 20; 
            state.health -= damage;
            if (state.health > 0) {
                showModal("Outdueled!", `The Aurors overpowered you! You took ${damage} damage and barely managed to apparate away. Your health is now ${state.health}.`);
                updateUI();
                return;
            }
        }
    } else {
        const fleeRoll = Math.random();
        if (fleeRoll < 0.40) { 
            showModal("Escaped!", "You quickly apparated away before they could cast a hex.");
            return;
        } else if (fleeRoll < 0.80) { 
            damage = Math.floor(Math.random() * 20) + 10; 
            state.health -= damage;
            if (state.health > 0) {
                showModal("Hit!", `You escaped, but took ${damage} damage from a stray hex. Your health is now ${state.health}.`);
                updateUI();
                return;
            }
        } else { 
            showModal("Caught!", "An Auror's anti-disapparation jinx caught you off guard. You couldn't escape!");
            bustPlayer();
            return;
        }
    }

    if (state.health <= 0) {
        bustPlayer();
    }
}

function bustPlayer() {
    state.day += 2;
    state.health = 100;
    
    const lostCash = Math.floor(state.wallet / 2);
    state.wallet -= lostCash;
    
    for (let item in state.inventory) {
        state.inventory[item].qty = 0;
        state.inventory[item].avgCost = 0;
    }

    let stashMessage = "";
    if (state.wallet < 50 && state.bank === 0) {
        state.wallet = 50;
        stashMessage = " Thankfully, they didn't check your left boot where you had a 50g emergency stash.";
    }

    if (state.day >= state.maxDays) {
        endGame();
    } else {
        showModal("Busted!", `An Auror's stunning spell hit you directly. You spent 2 days in holding. They confiscated your illicit goods and fined you ${lostCash}g.${stashMessage}`);
        updateUI();
    }
}

function triggerRandomEvents() {
    const eventPool = ['A', 'B', 'C', 'D', 'E', 'F', 'F', 'F', 'G', 'H', 'I'];
    const chosenEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
    const ownedItems = Object.keys(state.inventory).filter(item => state.inventory[item].qty > 0);

    switch(chosenEvent) {
        case 'A':
            currentPrices['Dragon Eggs'] = Math.floor(currentPrices['Dragon Eggs'] * 0.25);
            showModal("Lucky Find!", "You must be on some Felix Felicis! A squib in the alley is selling Dragon Eggs for Sickles on the Galleon!");
            updateUI(); 
            break;
        case 'B':
            const pockets = Math.floor(Math.random() * 11) + 5; 
            const cost = Math.floor(Math.random() * 251) + 150; 
            showModal("Shady Deal", `Cloak peddler Reginald whispers: "Pst... want to buy a cloak with ${pockets} extra pockets for ${cost}g?"`, [
                { text: "Yes", action: () => {
                    if (state.wallet >= cost) {
                        state.wallet -= cost; state.maxSpace += pockets;
                        showModal("Success!", "You bought the cloak! Extra pockets added."); updateUI();
                    } else { showModal("Broke!", "You don't have enough Galleons! Reginald scoffs and vanishes."); }
                }}, { text: "No", action: null }
            ]);
            break;
        case 'C':
            const multiItems = ownedItems.filter(item => state.inventory[item].qty > 1);
            if (multiItems.length > 0) {
                const lostItem = multiItems[Math.floor(Math.random() * multiItems.length)];
                const lostAmount = Math.ceil(state.inventory[lostItem].qty / 2); 
                state.inventory[lostItem].qty -= lostAmount;
                showModal("Tricked!", `An unknown witch at the pub slipped Amortentia in your mead! Before it wore off, you gave her ${lostAmount} of your ${lostItem}.`);
                updateUI();
            }
            break;
        case 'D':
            const midTier = ['Venomous Tentacula Seeds', 'Veritaserum'];
            const foundItem = midTier[Math.floor(Math.random() * midTier.length)];
            const foundQty = Math.floor(Math.random() * 5) + 2; 
            const oldQty = state.inventory[foundItem].qty;
            const oldAvg = state.inventory[foundItem].avgCost;
            state.inventory[foundItem].qty = oldQty + foundQty;
            state.inventory[foundItem].avgCost = (oldQty * oldAvg) / (oldQty + foundQty); 
            showModal("Score!", `A curious old Warlock on the Knight Bus left his trunk unlocked! You swiped ${foundQty} ${foundItem} and got off at the next stop.`);
            updateUI();
            break;
        case 'E':
            if (state.wallet > 0) {
                const lostCash = Math.floor(state.wallet * ((Math.floor(Math.random() * 11) + 10) / 100));
                state.wallet -= lostCash;
                showModal("Niffler!", `A stray Niffler scurried up your leg! It made off with ${lostCash}g of your shiny Galleons!`);
                updateUI();
            }
            break;
        case 'F':
            const spikeItem = (Math.random() < 0.7) ? ['Acromantula Venom', 'Dragon Eggs', 'Veritaserum'][Math.floor(Math.random() * 3)] : ['Polyjuice Potion', 'Doxy Eggs', 'Venomous Tentacula Seeds'][Math.floor(Math.random() * 3)];
            currentPrices[spikeItem] *= (Math.floor(Math.random() * 3) + 3);
            showModal("Ministry Raid!", `Aurors just raided a massive smuggling ring! The black market is dry and prices for ${spikeItem} have skyrocketed!`);
            updateUI();
            break;
        case 'G':
            const foundCash = Math.floor(Math.random() * 151) + 50; 
            state.wallet += foundCash;
            showModal("Found Galleons", `A wealthy wizard dropped their coin purse outside the Leaky Cauldron. Finders keepers! You gained ${foundCash}g.`);
            updateUI();
            break;
        case 'H':
            // v1.9.3 Fix: Ensure it rounds down and always leaves at least 1 item
            const spoilableItems = ownedItems.filter(item => state.inventory[item].qty > 1);
            if (spoilableItems.length > 0) {
                const spoiledItem = spoilableItems[Math.floor(Math.random() * spoilableItems.length)];
                const lostQty = Math.max(1, Math.floor(state.inventory[spoiledItem].qty * 0.75));
                state.inventory[spoiledItem].qty -= lostQty;
                showModal("Fakes!", `You discover that ${lostQty} of the ${spoiledItem} you bought were fakes and have to toss them. You'd be angry if it wasn't the exact thing you'd do too.`);
                updateUI();
            }
            break;
        case 'I':
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
    state.debt = Math.floor(state.debt * 1.05); 
    
    state.potionsAvailable = Math.floor(Math.random() * 5); 
    generatePrices();
    
    let heat = 0.05; 
    if (state.debt === 0) heat += 0.10; 
    if (state.wallet + state.bank > 20000) heat += 0.10; 

    if (Math.random() < heat) {
        triggerCombat();
    } else if (Math.random() < 0.30) {
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

    document.body.className = ''; 

    if (state.debt === 0) {
        document.body.classList.add('bg-win'); 
        const totalWealth = state.wallet + state.bank;
        endTitle.innerText = "You Survived!";
        endMessage.innerText = "You successfully paid off Borgin and kept yourself out of Azkaban. Time to lay low in the Hog's Head for a while.";
        finalScore.innerText = `Final Score: ${totalWealth}g`;
    } else {
        document.body.classList.add('bg-azkaban'); 
        endTitle.innerText = "Busted!";
        endMessage.innerText = `You failed to pay off your debt. Borgin tipped off the Ministry Aurors, handing them the fake fang. You were dragged to Azkaban owing ${state.debt}g.`;
        finalScore.innerText = "Final Score: Dementor's Kiss";
    }
}

function buyItem(item) {
    const qty = parseInt(document.getElementById(`buy-qty-${item.replace(/\s+/g, '-')}`).value) || 1;
    if (qty <= 0) return;
    const price = currentPrices[item];
    const totalCost = price * qty;
    let currentSpace = 0;
    for (let i in state.inventory) currentSpace += state.inventory[i].qty;
    
    if (currentSpace + qty > state.maxSpace) {
        showModal("Inventory Full", "Not enough pockets in your cloak!"); return;
    }
    if (state.wallet >= totalCost) {
        state.wallet -= totalCost;
        const oldQty = state.inventory[item].qty;
        const oldAvg = state.inventory[item].avgCost;
        state.inventory[item].qty = oldQty + qty;
        state.inventory[item].avgCost = ((oldQty * oldAvg) + totalCost) / (oldQty + qty);
        updateUI();
    } else {
        showModal("Not enough funds", "You don't have enough Galleons!");
    }
}

function sellItem(item) {
    const qty = parseInt(document.getElementById(`sell-qty-${item.replace(/\s+/g, '-')}`).value) || 1;
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
        state.wallet -= amount; state.bank += amount;
    } else if (type === 'withdraw' && state.bank >= amount) {
        state.bank -= amount; state.wallet += amount;
    } else { showModal("Error", "Invalid funds!"); }
    updateUI();
}

function payDebt() {
    const amount = parseInt(document.getElementById('debt-amount').value) || 0;
    if (amount <= 0) return;
    if (state.wallet >= amount) {
        state.wallet -= amount; state.debt -= amount;
        if (state.debt < 0) state.debt = 0;
    } else { showModal("Error", "You don't have enough Galleons on you!"); }
    updateUI();
}

function healPlayer(amount, cost) {
    if (state.health >= 100) { 
        showModal("Healthy", "You are already at full health."); 
        return; 
    }
    if (state.potionsAvailable <= 0) {
        showModal("Out of Stock", "The healer has no more potions available today.");
        return;
    }
    if (state.wallet >= cost) {
        state.wallet -= cost;
        state.potionsAvailable--;
        state.health = Math.min(100, state.health + amount);
        showModal("Healed", `You drank a Wiggenweld Potion. Health restored to ${state.health}.`);
        updateUI();
    } else { 
        showModal("Broke", "Not enough Galleons for treatment. Time to sell some stash."); 
    }
}

function upgradeWand() {
    const nextWandLevel = state.wandLevel + 1;
    if (nextWandLevel >= wands.length) {
        showModal("Max Level", "You already have the most powerful wand available."); return;
    }
    const nextWand = wands[nextWandLevel];
    if (state.wallet >= nextWand.cost) {
        state.wallet -= nextWand.cost;
        state.wandLevel = nextWandLevel;
        showModal("Wand Upgraded", `You purchased the ${nextWand.name}! Your combat power has increased.`);
        updateUI();
    } else {
        showModal("Broke", `You need ${nextWand.cost}g to buy the ${nextWand.name}.`);
    }
}

function updateUI() {
    document.body.className = ''; 
    if (state.currentLocation === 'Diagon Alley') document.body.classList.add('bg-diagon');
    else if (state.currentLocation === 'Knockturn Alley') document.body.classList.add('bg-knockturn');
    else if (state.currentLocation === 'Hogsmeade') document.body.classList.add('bg-hogsmeade');
    else if (state.currentLocation === 'Forbidden Forest') document.body.classList.add('bg-forest');
    else if (state.currentLocation === 'Godric\'s Hollow') document.body.classList.add('bg-godrics');

    document.getElementById('current-location').innerText = state.currentLocation;
    document.getElementById('day').innerText = state.day;
    document.getElementById('health').innerText = state.health;
    document.getElementById('wand-name').innerText = wands[state.wandLevel].name;
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
    
    locPanel.style.display = 'block';
    if (state.currentLocation === 'Diagon Alley') {
        locTitle.innerText = "Gringotts Vault";
        locContent.innerHTML = `<input type="number" id="bank-amount" min="1" placeholder="Amount"> <button onclick="bankTransaction('deposit')">Deposit</button> <button onclick="bankTransaction('withdraw')">Withdraw</button>`;
    } else if (state.currentLocation === 'Knockturn Alley') {
        locTitle.innerText = "Borgin & Burkes";
        locContent.innerHTML = `<input type="number" id="debt-amount" min="1" placeholder="Amount"> <button onclick="payDebt()">Pay Down Debt</button>`;
    } else if (state.currentLocation === 'Godric\'s Hollow') {
        locTitle.innerText = "St. Mungo's Covert Ward";
        if (state.potionsAvailable > 0) {
            locContent.innerHTML = `<p>The healer has <strong>${state.potionsAvailable}</strong> Wiggenweld Potion(s) left.</p><button onclick="healPlayer(10, 200)">Drink Potion (+10 HP / 200g)</button>`;
        } else {
            locContent.innerHTML = `<p>The healer is completely out of Wiggenweld Potions today. You'll have to apparate out and come back later.</p>`;
        }
    } else if (state.currentLocation === 'Forbidden Forest') {
        locTitle.innerText = "Shady Wandcrafter";
        const nextWand = wands[state.wandLevel + 1];
        if (nextWand) {
            locContent.innerHTML = `<button onclick="upgradeWand()">Buy ${nextWand.name} (${nextWand.cost}g)</button>`;
        } else {
            locContent.innerHTML = `<p>You have the best wand on the black market.</p>`;
        }
    } else {
        locPanel.style.display = 'none';
    }

    const marketList = document.getElementById('market-list');
    marketList.innerHTML = '';
    for (let item in currentPrices) {
        const price = currentPrices[item];
        const canAfford = Math.max(0, Math.min(Math.floor(state.wallet / price), state.maxSpace - currentSpace));
        const inputId = `buy-qty-${item.replace(/\s+/g, '-')}`;
        marketList.innerHTML += `<div class="market-item"><span>${item} <br><strong>${price}g</strong> <small>(Max: ${canAfford})</small></span><div><input type="number" id="${inputId}" value="${canAfford > 0 ? 1 : 0}" min="1" max="${canAfford > 0 ? canAfford : 1}" style="width: 40px;"> <button onclick="buyItem('${item}')">Buy</button></div></div>`;
    }

    const inventoryList = document.getElementById('inventory-list');
    inventoryList.innerHTML = '';
    for (let item in state.inventory) {
        const invItem = state.inventory[item];
        if (invItem.qty > 0) {
            const inputId = `sell-qty-${item.replace(/\s+/g, '-')}`;
            inventoryList.innerHTML += `<div class="inventory-item"><span>${item} <br>(Qty: ${invItem.qty} @ ${Math.round(invItem.avgCost)}g avg)</span><div><input type="number" id="${inputId}" value="${invItem.qty}" min="1" max="${invItem.qty}" style="width: 40px;"> <button onclick="sellItem('${item}')">Sell</button></div></div>`;
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

