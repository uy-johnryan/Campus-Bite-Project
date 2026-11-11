const API_BASE_URL = "http://127.0.0.1:5000";

// Temporary development vendor account
const VENDOR_ID = 2;

let vendorOrders = [];
let currentFilter = "all";


// Load vendor orders from Flask
async function loadVendorOrders() {
    const container = document.getElementById("vendor-orders-list");

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/vendor/${VENDOR_ID}/orders`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load orders.");
        }

        vendorOrders = data.orders;

        updateFilterCounts();
        displayVendorOrders();

    } catch (error) {
        console.error("Vendor dashboard error:", error);

        container.innerHTML =
            "<p class='vendor-message'>Unable to load orders. Please try again later.</p>";
    }
}


// Prevent database values from being interpreted as HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// Get the CSS class for each order status
function getStatusClass(status) {
    const statusClasses = {
        pending: "incoming",
        accepted: "in-progress",
        preparing: "in-progress",
        ready: "ready",
        completed: "ready",
        rejected: "incoming",
        cancelled: "incoming",
        no_show: "incoming"
    };

    return statusClasses[status] || "incoming";
}


// Get readable status text
function getStatusLabel(status) {
    const labels = {
        pending: "INCOMING",
        accepted: "ACCEPTED",
        preparing: "IN PROGRESS",
        ready: "READY",
        completed: "COMPLETED",
        rejected: "REJECTED",
        cancelled: "CANCELLED",
        no_show: "NO SHOW"
    };

    return labels[status] || status.toUpperCase();
}


// Generate action buttons depending on the order status
function renderOrderActions(order) {
    const status = order.order_status.toLowerCase();
    const orderId = order.order_id;

    if (status === "pending") {
        return `
            <div class="vendor-order-actions">
                <button type="button" class="vendor-action-btn accept-btn"
                    data-order-id="${orderId}" data-new-status="accepted">
                    Accept
                </button>

                <button type="button" class="vendor-action-btn reject-btn"
                    data-order-id="${orderId}" data-new-status="rejected">
                    Reject
                </button>
            </div>
        `;
    }

    if (status === "accepted") {
        return `
            <div class="vendor-order-actions">
                <button type="button" class="vendor-action-btn accept-btn"
                    data-order-id="${orderId}" data-new-status="preparing">
                    Start Preparing
                </button>
            </div>
        `;
    }

    if (status === "preparing") {
        return `
            <div class="vendor-order-actions">
                <button type="button" class="vendor-action-btn accept-btn"
                    data-order-id="${orderId}" data-new-status="ready">
                    Ready for Pickup
                </button>
            </div>
        `;
    }

    if (status === "ready") {
        return `
            <div class="vendor-order-actions">
                <button type="button" class="vendor-action-btn accept-btn"
                    data-order-id="${orderId}" data-new-status="completed">
                    Complete Order
                </button>

                <button type="button" class="vendor-action-btn reject-btn"
                    data-order-id="${orderId}" data-new-status="no_show">
                    Mark as No Show
                </button>
            </div>
        `;
    }

    return "";
}


// Update an order's status through the Flask API
async function updateOrderStatus(orderId, newStatus, button) {
    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Updating...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/vendor/${VENDOR_ID}/orders/${orderId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: newStatus
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to update order.");
        }

        // Reload orders to display the updated status and buttons
        await loadVendorOrders();

    } catch (error) {
        console.error("Order status update error:", error);

        alert(error.message || "Something went wrong while updating the order.");

        button.disabled = false;
        button.textContent = originalText;
    }
}


// Update the number displayed in each filter
function updateFilterCounts() {
    const counts = {
        all: vendorOrders.length,
        pending: 0,
        ready: 0,
        "in-progress": 0,
        no_show: 0,
        completed: 0
    };

    vendorOrders.forEach(order => {
        const status = order.order_status;

        if (status === "pending") {
            counts.pending++;
        } else if (status === "ready") {
            counts.ready++;
        } else if (["accepted", "preparing"].includes(status)) {
            counts["in-progress"]++;
        } else if (status === "no_show") {
            counts.no_show++;
        } else if (status === "completed") {
            counts.completed++;
        }
    });

    document.querySelectorAll(".filter-pill").forEach(button => {
        const filter = button.dataset.filter;
        const label = button.textContent.replace(/\s*\(\d+\)/, "");

        button.textContent = `${label} (${counts[filter] ?? 0})`;
    });
}


// Display orders based on the selected filter
function displayVendorOrders() {
    const container = document.getElementById("vendor-orders-list");

    let filteredOrders = vendorOrders;

    if (currentFilter === "pending") {
        filteredOrders = vendorOrders.filter(
            order => order.order_status === "pending"
        );
    } else if (currentFilter === "ready") {
        filteredOrders = vendorOrders.filter(
            order => order.order_status === "ready"
        );
    } else if (currentFilter === "in-progress") {
        filteredOrders = vendorOrders.filter(
            order => ["accepted", "preparing"].includes(order.order_status)
        );
    } else if (currentFilter === "no_show") {
        filteredOrders = vendorOrders.filter(
            order => order.order_status === "no_show"
        );
    } else if (currentFilter === "completed") {
        filteredOrders = vendorOrders.filter(
            order => order.order_status === "completed"
        );
    }

    container.innerHTML = "";

    if (filteredOrders.length === 0) {
        container.innerHTML =
            "<p class='vendor-message'>No orders found.</p>";
        return;
    }

    filteredOrders.forEach(order => {
        const card = document.createElement("div");
        card.className = "vendor-order-card";

        const status = order.order_status;
        const statusClass = getStatusClass(status);
        const statusLabel = getStatusLabel(status);

        const itemsHTML = order.items.map(item => `
            <div class="vendor-item-row">
                <span class="item-qty">${item.quantity}</span>
                <span class="item-name">${escapeHTML(item.item_name)}</span>
                <span class="item-price">
                    P ${(item.price * item.quantity).toFixed(2)}
                </span>
            </div>
        `).join("");

        card.innerHTML = `
            <div class="card-top-bar">
                <span class="status-badge ${statusClass}">
                    ${statusLabel}
                </span>
            </div>

            <div class="vendor-order-items">
                ${itemsHTML}
            </div>

            <div class="order-totals">
                <div class="summary-row">
                    <span>SubTotal</span>
                    <span>P ${order.subtotal.toFixed(2)}</span>
                </div>

                <div class="summary-row service-fee">
                    <span>Service Fee</span>
                    <span>P ${order.service_fee.toFixed(2)}</span>
                </div>

                <div class="summary-row total">
                    <span>Total</span>
                    <span>P ${order.total_amount.toFixed(2)}</span>
                </div>
            </div>

            <div class="card-footer-info">
                <span class="customer-name">
                    Name: ${escapeHTML(order.username)}
                </span>

                <span class="vendor-order-id">
                    Order ID: ${order.order_id}
                </span>
            </div>
            
            ${renderOrderActions(order)}
        `;

        container.appendChild(card);
    });
}


// Handle vendor order action button clicks
document.getElementById("vendor-orders-list").addEventListener("click", event => {
    const button = event.target.closest(".vendor-action-btn");

    if (!button) {
        return;
    }

    const orderId = button.dataset.orderId;
    const newStatus = button.dataset.newStatus;

    updateOrderStatus(orderId, newStatus, button);
});


// Filter button events
document.querySelectorAll(".filter-pill").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".filter-pill").forEach(pill => {
            pill.classList.remove("active");
        });

        button.classList.add("active");
        currentFilter = button.dataset.filter;

        displayVendorOrders();
    });
});


// Toggle the options dropdown
const menuButton = document.getElementById("menu-btn");
const dropdown = document.getElementById("vendor-dropdown");

menuButton.addEventListener("click", event => {
    event.stopPropagation();
    dropdown.classList.toggle("show");
});


// Close dropdown when clicking outside
document.addEventListener("click", event => {
    if (
        !dropdown.contains(event.target) &&
        !menuButton.contains(event.target)
    ) {
        dropdown.classList.remove("show");
    }
});


// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    const confirmLogout = confirm("Are you sure you want to log out?");

    if (!confirmLogout) {
        return;
    }

    // Clear temporary login and selected-order information
    localStorage.removeItem("vendorUserId");
    localStorage.removeItem("vendor_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("campusBiteUser");
    localStorage.removeItem("selectedOrderId");

    window.location.href = "index.html";
});


// Load orders when the page opens
document.addEventListener("DOMContentLoaded", loadVendorOrders);