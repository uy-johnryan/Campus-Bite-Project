const API_BASE_URL = "http://127.0.0.1:5000";

let allMenuItems = [];
let favoriteItemIds = new Set();

async function loadStallMenu() {
    const container = document.getElementById("menu-container");
    const stallName = document.getElementById("stall-name");
    const stallLogo = document.getElementById("stall-logo");

    const stallId = localStorage.getItem("selectedStallId");
    const savedStallName = localStorage.getItem("selectedStallName");

    if (!stallId) {
        alert("Please select a stall first.");
        window.location.href = "stalls.html";
        return;
    }

    stallName.textContent = savedStallName || "Stall Menu";

    container.innerHTML = "<p>Loading menu...</p>";

    try {
        // Retrieve the selected stall's menu
        const response = await fetch(
            `${API_BASE_URL}/api/stalls/${stallId}/menu`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load menu.");
        }

        allMenuItems = data.menu_items;
        // Load the logged-in student's favorites
        await loadFavoriteIds();

        // Retrieve the stall logo and details
        const stallsResponse = await fetch(`${API_BASE_URL}/api/stalls`);
        const stallsData = await stallsResponse.json();

        if (stallsResponse.ok && stallsData.success) {
            const selectedStall = stallsData.stalls.find(
                stall => String(stall.stall_id) === String(stallId)
            );

            if (selectedStall) {
                stallName.textContent = selectedStall.stall_name;

                const placeholder = document.getElementById("banner-placeholder");

                if (selectedStall.logo) {
                    stallLogo.src = selectedStall.logo;
                    stallLogo.alt = selectedStall.stall_name + " Logo";

                    stallLogo.onload = function () {
                        stallLogo.style.display = "block";
                        placeholder.style.display = "none";
                    };

                    stallLogo.onerror = function () {
                        stallLogo.style.display = "none";
                        placeholder.style.display = "block";
                    };
                } else {
                    stallLogo.style.display = "none";
                    placeholder.style.display = "block";
                }
            }
        }

        displayMenuItems(allMenuItems);

    } catch (error) {
        console.error("Error loading menu:", error);
        container.innerHTML =
            "<p>Unable to load menu. Please try again later.</p>";
    }
}



async function loadFavoriteIds() {
    const user = JSON.parse(localStorage.getItem("campusBiteUser"));

    favoriteItemIds.clear();

    if (!user || user.role !== "student") {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/users/${user.user_id}/favorites`
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load favorites.");
        }

        result.favorites.forEach(item => {
            favoriteItemIds.add(Number(item.item_id));
        });

    } catch (error) {
        console.error("Error loading favorites:", error);
    }
}


// Display menu cards
function displayMenuItems(items) {
    const container = document.getElementById("menu-container");

    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = "<p>No menu items available.</p>";
        return;
    }

    items.forEach(item => {
        const card = document.createElement("div");

        card.className = item.availability
            ? "food-card green"
            : "food-card";

        // Image wrapper
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "image-wrapper";

        const image = document.createElement("img");
        image.alt = item.item_name;

        if (item.image) {
            image.src = item.image;

            image.onerror = function () {
                this.style.display = "none";
            };
        } else {
            image.style.display = "none";
        }

        // Favorite button
        const favoriteButton = document.createElement("button");
        favoriteButton.className = "favorite-btn";
        favoriteButton.type = "button";

        const isFavorite = favoriteItemIds.has(Number(item.item_id));

        favoriteButton.innerHTML = isFavorite
            ? '<i class="fa-solid fa-heart"></i>'
            : '<i class="fa-regular fa-heart"></i>';

        // Prevent clicking the heart from adding the item to the cart
        favoriteButton.addEventListener("click", function (event) {
            event.stopPropagation();
            toggleFavorite(item, favoriteButton);
        });

        imageWrapper.appendChild(image);
        imageWrapper.appendChild(favoriteButton);

        // Card details
        const cardDetails = document.createElement("div");
        cardDetails.className = "card-details";

        const textInfo = document.createElement("div");
        textInfo.className = "text-info";

        const itemName = document.createElement("h3");
        itemName.textContent = item.item_name;

        const price = document.createElement("p");
        price.className = "price";
        price.textContent = `P ${Number(item.price).toFixed(2)}`;

        textInfo.appendChild(itemName);
        textInfo.appendChild(price);

        const availability = document.createElement("div");
        availability.className = "rating";

        const availabilityText = document.createElement("span");
        availabilityText.textContent = item.availability
            ? "Available"
            : "Unavailable";

        availability.appendChild(availabilityText);

        cardDetails.appendChild(textInfo);
        cardDetails.appendChild(availability);

        card.appendChild(imageWrapper);
        card.appendChild(cardDetails);

        card.addEventListener("click", () => {
            if (!item.availability) {
                alert("This item is currently unavailable.");
                return;
            }

            addToCart(item);
        });

        container.appendChild(card);
    });
}


async function toggleFavorite(item, button) {
    const user = JSON.parse(localStorage.getItem("campusBiteUser"));

    if (!user || user.role !== "student") {
        alert("Please log in using a student account.");
        return;
    }

    const userId = user.user_id;
    const itemId = Number(item.item_id);

    const isFavorite = favoriteItemIds.has(itemId);

    button.disabled = true;

    try {
        let response;

        if (isFavorite) {
            // Remove favorite
            response = await fetch(
                `${API_BASE_URL}/api/users/${userId}/favorites/${itemId}`,
                {
                    method: "DELETE"
                }
            );
        } else {
            // Add favorite
            response = await fetch(
                `${API_BASE_URL}/api/users/${userId}/favorites`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        item_id: itemId
                    })
                }
            );
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to update favorite.");
        }

        // Update the local favorite list
        if (isFavorite) {
            favoriteItemIds.delete(itemId);
        } else {
            favoriteItemIds.add(itemId);
        }

        // Update the heart icon
        button.innerHTML = favoriteItemIds.has(itemId)
            ? '<i class="fa-solid fa-heart"></i>'
            : '<i class="fa-regular fa-heart"></i>';

    } catch (error) {
        console.error("Favorite error:", error);
        alert(error.message);
    } finally {
        button.disabled = false;
    }
}


function addToCart(item) {
    const CART_KEY = "campusBiteCart";

    // Get existing cart
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    // Get selected stall information
    const stallId = localStorage.getItem("selectedStallId");
    const stallName = document.getElementById("stall-name").textContent;

    // Check if item already exists in cart
    const existingItem = cart.find(cartItem =>
        String(cartItem.item_id) === String(item.item_id) &&
        String(cartItem.stall_id) === String(stallId)
    );

    if (existingItem) {
        // Increase quantity if already added
        existingItem.quantity++;
    } else {
        // Add new item to cart
        cart.push({
            item_id: item.item_id,
            stall_id: Number(stallId),
            stall_name: stallName,
            item_name: item.item_name,
            price: Number(item.price),
            quantity: 1
        });
    }

    // Save updated cart
    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    alert(item.item_name + " added to your order!");
}


// Filter menu items by category
document.querySelectorAll(".sub-pill").forEach(button => {
    button.addEventListener("click", () => {
        document.querySelectorAll(".sub-pill").forEach(pill => {
            pill.classList.remove("active");
        });

        button.classList.add("active");

        const category = button.dataset.category;

        if (category === "all") {
            displayMenuItems(allMenuItems);
        } else {
            const filteredItems = allMenuItems.filter(
                item => item.category.toLowerCase() === category
            );

            displayMenuItems(filteredItems);
        }
    });
});


document.addEventListener("DOMContentLoaded", loadStallMenu);