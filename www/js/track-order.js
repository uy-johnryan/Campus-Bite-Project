const API_BASE_URL = "http://127.0.0.1:5000";
const CUSTOMER_ID = 1;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

async function loadOrderDetails() {
    const orderId = localStorage.getItem("selectedOrderId");

    const stallHeader = document.getElementById("stall-header-tag");
    const statusMain = document.getElementById("status-main");
    const statusSub = document.getElementById("status-sub");
    const timelineContainer = document.getElementById("timeline-container");
    const detailsContainer = document.getElementById("order-details");

    if (!orderId) {
        statusMain.textContent = "No Order Selected";
        statusSub.textContent = "Please select an order from My Orders.";
        timelineContainer.innerHTML = "";
        detailsContainer.innerHTML =
            "<p>No order was selected.</p>";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/orders/${orderId}?customer_id=${CUSTOMER_ID}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load order.");
        }

        const order = data.order;

        displayOrderStatus(order);
        displayOrderTimeline(order.order_status);
        displayOrderDetails(order);

        stallHeader.textContent = `Stall ${order.stall_id}`;

    } catch (error) {
        console.error("Error loading order:", error);

        statusMain.textContent = "Unable to Load Order";
        statusSub.textContent = "Please try again later.";

        timelineContainer.innerHTML =
            "<p>Unable to load order timeline.</p>";

        detailsContainer.innerHTML =
            "<p>Unable to load order details.</p>";
    }
}


// Display the current order status
function displayOrderStatus(order) {
    const statusMain = document.getElementById("status-main");
    const statusSub = document.getElementById("status-sub");

    const status = order.order_status;

    const statusMessages = {
        pending: {
            title: "Status: Pending",
            description: "Waiting for the vendor to accept your order."
        },
        accepted: {
            title: "Status: Accepted",
            description: "Your order has been accepted by the vendor."
        },
        preparing: {
            title: "Status: Preparing",
            description: "The vendor is preparing your food."
        },
        ready: {
            title: "Ready for Pickup!",
            description: "Your order is ready. Please proceed to the stall."
        },
        completed: {
            title: "Order Completed",
            description: "Your order has been successfully picked up."
        },
        rejected: {
            title: "Order Rejected",
            description: "The vendor was unable to accept your order."
        },
        cancelled: {
            title: "Order Cancelled",
            description: "This order has been cancelled."
        },
        no_show: {
            title: "Marked as No-Show",
            description: "This order was marked as not picked up."
        }
    };

    const currentStatus = statusMessages[status] || {
        title: "Unknown Status",
        description: "Please contact the stall for assistance."
    };

    statusMain.textContent = currentStatus.title;
    statusSub.textContent = currentStatus.description;
}


// Display the order timeline
function displayOrderTimeline(status) {
    const container = document.getElementById("timeline-container");

    const steps = [
        "Order Submitted",
        "Accepted by Vendor",
        "Preparing Food",
        "Ready for Pickup"
    ];

    const progress = {
        pending: { completed: 1, active: 1 },
        accepted: { completed: 2, active: 2 },
        preparing: { completed: 2, active: 2 },
        ready: { completed: 3, active: 3 },
        completed: { completed: 4, active: -1 },
        rejected: { completed: 1, active: -1 },
        cancelled: { completed: 1, active: -1 },
        no_show: { completed: 1, active: -1 }
    };

    const currentProgress = progress[status] || {
        completed: 1,
        active: -1
    };

    container.innerHTML = "";

    steps.forEach((step, index) => {
        let state = "pending";

        if (index < currentProgress.completed) {
            state = "completed";
        } else if (index === currentProgress.active) {
            state = "in-progress";
        }

        const timelineItem = document.createElement("div");
        timelineItem.className = `timeline-item ${state}`;

        const icon = state === "completed"
            ? '<i class="fa-solid fa-check"></i>'
            : state === "in-progress"
                ? '<i class="fa-solid fa-minus"></i>'
                : "";

        const iconClass = state === "completed"
            ? "check"
            : state === "in-progress"
                ? "minus"
                : "square";

        timelineItem.innerHTML = `
            <div class="timeline-icon-col">
                <span class="icon-box ${iconClass}">
                    ${icon}
                </span>

                ${index !== steps.length - 1
                    ? '<span class="timeline-line"></span>'
                    : ''
                }
            </div>

            <div class="timeline-info">
                <span class="timeline-label">${step}</span>
                ${state === "in-progress"
                    ? '<span class="timeline-status">In Progress</span>'
                    : state === "pending"
                        ? '<span class="timeline-status">Pending</span>'
                        : '<span class="timeline-status">Completed</span>'
                }
            </div>
        `;

        container.appendChild(timelineItem);
    });

    if (["rejected", "cancelled", "no_show"].includes(status)) {
        const notice = document.createElement("p");
        notice.className = "orders-message";
        notice.textContent =
            `Order status: ${status.replace("_", " ")}.`;
        container.appendChild(notice);
    }
}


// Display the actual order details
function displayOrderDetails(order) {
    const container = document.getElementById("order-details");

    const itemsHTML = order.items.map(item => `
        <p>
            <strong>${item.quantity}x</strong>
            ${escapeHTML(item.item_name)}
            - P ${(item.price * item.quantity).toFixed(2)}
        </p>
    `).join("");

    container.innerHTML = `
        <p><strong>Stall:</strong> ${escapeHTML(order.stall_name)}</p>

        <p><strong>Customer:</strong> ${escapeHTML(order.username)}</p>

        <p><strong>Items:</strong></p>
        ${itemsHTML}

        <p><strong>Subtotal:</strong> P ${order.subtotal.toFixed(2)}</p>

        <p><strong>Service Fee:</strong> P ${order.service_fee.toFixed(2)}</p>

        <p><strong>Total:</strong> P ${order.total_amount.toFixed(2)}</p>

        <p><strong>Payment Method:</strong>
            ${escapeHTML(order.payment_method.toUpperCase())}
        </p>

        <p><strong>Payment Status:</strong>
            ${escapeHTML(order.payment_status.toUpperCase())}
        </p>

        <br>

        <p><strong>Order ID:</strong> ${order.order_id}</p>
    `;
}

document.addEventListener("DOMContentLoaded", loadOrderDetails);