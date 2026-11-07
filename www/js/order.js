const CART_KEY = "campusBiteCart";
const SERVICE_FEE = 5;

// Get cart items from localStorage
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// Save cart items to localStorage
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Display cart items
function displayCart() {
    const container = document.getElementById("order-container");
    const checkoutButton = document.getElementById("checkout-btn");

    const cart = getCart();

    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = "<p class='empty-cart'>Your cart is empty.</p>";
        checkoutButton.disabled = true;
        return;
    }

    checkoutButton.disabled = false;

    // Group items by stall
    const groupedItems = {};

    cart.forEach(item => {
        if (!groupedItems[item.stall_id]) {
            groupedItems[item.stall_id] = {
                stallName: item.stall_name,
                items: []
            };
        }

        groupedItems[item.stall_id].items.push(item);
    });

    // Display each stall's orders
    Object.entries(groupedItems).forEach(([stallId, stall]) => {
        const orderCard = document.createElement("div");
        orderCard.className = "order-card";

        const stallTitle = document.createElement("h3");
        stallTitle.className = "stall-title";
        stallTitle.textContent = stall.stallName;

        orderCard.appendChild(stallTitle);

        let subtotal = 0;

        stall.items.forEach(item => {
            const orderItem = document.createElement("div");
            orderItem.className = "order-item";

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-btn";
            deleteButton.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
            deleteButton.type = "button";
            deleteButton.addEventListener("click", () => {
                removeItem(item.item_id, stallId);
            });

            const quantityControls = document.createElement("div");
            quantityControls.className = "qty-controls";

            const minusButton = document.createElement("button");
            minusButton.className = "qty-btn minus";
            minusButton.textContent = "-";
            minusButton.type = "button";
            minusButton.addEventListener("click", () => {
                updateQuantity(item.item_id, stallId, -1);
            });

            const plusButton = document.createElement("button");
            plusButton.className = "qty-btn plus";
            plusButton.textContent = "+";
            plusButton.type = "button";
            plusButton.addEventListener("click", () => {
                updateQuantity(item.item_id, stallId, 1);
            });

            quantityControls.appendChild(minusButton);
            quantityControls.appendChild(plusButton);

            const quantity = document.createElement("span");
            quantity.className = "item-qty";
            quantity.textContent = item.quantity;

            const itemName = document.createElement("span");
            itemName.className = "item-name";
            itemName.textContent = item.item_name;

            const itemPrice = document.createElement("span");
            itemPrice.className = "item-price";
            itemPrice.textContent =
                `P ${(Number(item.price) * item.quantity).toFixed(2)}`;

            orderItem.appendChild(deleteButton);
            orderItem.appendChild(quantityControls);
            orderItem.appendChild(quantity);
            orderItem.appendChild(itemName);
            orderItem.appendChild(itemPrice);

            orderCard.appendChild(orderItem);

            subtotal += Number(item.price) * item.quantity;
        });

        // Order summary
        const orderSummary = document.createElement("div");
        orderSummary.className = "order-summary";

        const serviceFee = SERVICE_FEE;
        const total = subtotal + serviceFee;

        orderSummary.innerHTML = `
            <div class="summary-row">
                <span>SubTotal</span>
                <span>P ${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row service-fee">
                <span>Service Fee</span>
                <span>P ${serviceFee.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
                <span>Total</span>
                <span>P ${total.toFixed(2)}</span>
            </div>
        `;

        orderCard.appendChild(orderSummary);
        container.appendChild(orderCard);
    });
}

// Increase or decrease item quantity
function updateQuantity(itemId, stallId, change) {
    let cart = getCart();

    const item = cart.find(item =>
        String(item.item_id) === String(itemId) &&
        String(item.stall_id) === String(stallId)
    );

    if (!item) return;

    item.quantity += change;

    // Remove item if quantity reaches zero
    if (item.quantity <= 0) {
        cart = cart.filter(cartItem =>
            !(String(cartItem.item_id) === String(itemId) &&
              String(cartItem.stall_id) === String(stallId))
        );
    }

    saveCart(cart);
    displayCart();
}

// Remove an item from the cart
function removeItem(itemId, stallId) {
    let cart = getCart();

    cart = cart.filter(item =>
        !(String(item.item_id) === String(itemId) &&
          String(item.stall_id) === String(stallId))
    );

    saveCart(cart);
    displayCart();
}

// Checkout button
document.getElementById("checkout-btn").addEventListener("click", () => {
    const cart = getCart();

    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    window.location.href = "checkout.html";
});

// Load cart when the page opens
document.addEventListener("DOMContentLoaded", displayCart);