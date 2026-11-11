const API_BASE_URL = window.API_BASE_URL || "http://127.0.0.1:5000";

const loggedInUser = JSON.parse(
    localStorage.getItem("campusBiteUser")
);

const CUSTOMER_ID = loggedInUser ? loggedInUser.user_id : null;

async function loadOrders() {
    const container = document.getElementById("orders-container");
        if (!CUSTOMER_ID) {
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/orders/customer/${CUSTOMER_ID}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load orders.");
        }

        container.innerHTML = "";

        if (data.orders.length === 0) {
            container.innerHTML =
                "<p class='orders-message'>You have no orders yet.</p>";
            return;
        }

        data.orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "my-order-card";

            const status = order.order_status.replace("_", " ");

            const itemNames = order.items.map(item =>
                `${item.quantity}x ${item.item_name}`
            ).join(", ");

            card.innerHTML = `
                <div class="my-order-header">
                    <h3>${order.stall_name}</h3>
                    <span class="order-status-badge">
                        ${status}
                    </span>
                </div>

                <p class="my-order-id">
                    Order #${order.order_id}
                </p>

                <p class="my-order-items">
                    ${itemNames}
                </p>

                <div class="my-order-footer">
                    <strong>P ${order.total_amount.toFixed(2)}</strong>
                    <span>View Order <i class="fa-solid fa-chevron-right"></i></span>
                </div>
            `;

            card.addEventListener("click", () => {
                localStorage.setItem(
                    "selectedOrderId",
                    order.order_id
                );

                window.location.href = "track-order.html";
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading orders:", error);

        container.innerHTML =
            "<p class='orders-message'>Unable to load your orders. Please try again later.</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadOrders);