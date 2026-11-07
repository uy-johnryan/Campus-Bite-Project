const CART_KEY = "campusBiteCart";
const SERVICE_FEE = 5;

const API_BASE_URL = "http://127.0.0.1:5000";
const TEMP_CUSTOMER_ID = 1;

let selectedPayment = "cash";

// Get cart items
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

// Display checkout information
function displayCheckout() {
    const cart = getCart();

    const itemsContainer = document.getElementById("checkout-items");
    const totalsContainer = document.getElementById("checkout-totals");

    const productsCount = document.getElementById("products-count");
    const footerTotal = document.getElementById("footer-total");
    const sendOrderButton = document.getElementById("send-order-btn");

    itemsContainer.innerHTML = "";
    totalsContainer.innerHTML = "";

    if (cart.length === 0) {
        itemsContainer.innerHTML =
            "<p class='empty-cart'>Your cart is empty.</p>";

        productsCount.textContent = "0 Products";
        footerTotal.textContent = "Total: P 0.00";
        sendOrderButton.disabled = true;

        return;
    }

    sendOrderButton.disabled = false;

    let subtotal = 0;
    let totalQuantity = 0;

    // Display cart items
    cart.forEach(item => {
        const itemRow = document.createElement("div");
        itemRow.className = "summary-item-row";

        const quantity = document.createElement("span");
        quantity.className = "item-qty";
        quantity.textContent = item.quantity;

        const name = document.createElement("span");
        name.className = "item-name";
        name.textContent = item.item_name;

        const price = document.createElement("span");
        price.className = "item-price";
        price.textContent =
            `P ${(Number(item.price) * item.quantity).toFixed(2)}`;

        itemRow.appendChild(quantity);
        itemRow.appendChild(name);
        itemRow.appendChild(price);

        itemsContainer.appendChild(itemRow);

        subtotal += Number(item.price) * item.quantity;
        totalQuantity += item.quantity;
    });

    // Service fee: P5 per stall
    const uniqueStalls = new Set(
        cart.map(item => String(item.stall_id))
    );

    const serviceFee = uniqueStalls.size * SERVICE_FEE;
    const total = subtotal + serviceFee;

    // Display totals
    totalsContainer.innerHTML = `
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

    productsCount.textContent =
        `${totalQuantity} ${totalQuantity === 1 ? "Product" : "Products"}`;

    footerTotal.textContent = `Total: P ${total.toFixed(2)}`;
}

// Select payment method
document.querySelectorAll(".payment-option").forEach(option => {
    option.addEventListener("click", () => {

        document.querySelectorAll(".payment-option").forEach(payment => {
            payment.classList.remove("selected");
        });

        option.classList.add("selected");

        selectedPayment = option.dataset.payment;

    });
});


// Send order to Flask API
document.getElementById("send-order-btn").addEventListener("click", async () => {

    const cart = getCart();
    const sendOrderButton = document.getElementById("send-order-btn");

    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    // Prevent multiple submissions
    sendOrderButton.disabled = true;
    sendOrderButton.textContent = "Sending Order...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                customer_id: TEMP_CUSTOMER_ID,
                payment_method: selectedPayment,
                items: cart.map(item => ({
                    item_id: Number(item.item_id),
                    stall_id: Number(item.stall_id),
                    quantity: Number(item.quantity)
                }))
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to submit order.");
        }

        // Get generated order IDs
        const orderIds = data.orders
            .map(order => order.order_id)
            .join(", ");

        // Save submitted order information
        localStorage.setItem(
            "campusBiteLastOrder",
            JSON.stringify(data.orders)
        );

        // Clear cart after successful submission
        localStorage.removeItem(CART_KEY);
        localStorage.removeItem("campusBitePendingOrder");

        alert(
            "Order submitted successfully!\n\n" +
            "Order ID(s): " + orderIds + "\n" +
            "Payment Method: " + selectedPayment.toUpperCase()
        );

        // Return to home page
        window.location.href = "home.html";

    } catch (error) {
        console.error("Order submission error:", error);

        alert(
            "Unable to submit your order.\n" +
            error.message
        );

        sendOrderButton.disabled = false;
        sendOrderButton.textContent = "Send Order";
    }

});


// Load checkout page
document.addEventListener("DOMContentLoaded", displayCheckout);
