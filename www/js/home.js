const API_BASE_URL = "http://127.0.0.1:5000";

let homeMenuItems = [];
let favoriteItemIds = new Set();

document.addEventListener("DOMContentLoaded", function () {
    loadHomeItems();
});


// Load food items from all stalls
async function loadHomeItems() {

    const container = document.getElementById("home-food-grid");

    container.innerHTML = "<p>Loading food items...</p>";

    try {

        // Retrieve all stalls
        const stallsResponse = await fetch(
            `${API_BASE_URL}/api/stalls`
        );

        const stallsResult = await stallsResponse.json();

        if (!stallsResponse.ok || !stallsResult.success) {
            throw new Error(stallsResult.message || "Unable to load stalls.");
        }

        homeMenuItems = [];

        // Retrieve menu items from every stall
        for (const stall of stallsResult.stalls) {

            const response = await fetch(
                `${API_BASE_URL}/api/stalls/${stall.stall_id}/menu`
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Unable to load menu.");
            }

            // Attach stall information to each food item
            result.menu_items.forEach(item => {
                item.stall_name = stall.stall_name;
                item.stall_id = stall.stall_id;

                homeMenuItems.push(item);
            });
        }

        // Load saved favorites
        await loadHomeFavoriteIds();

        // Display food cards
        displayHomeItems();

    } catch (error) {

        console.error("Home loading error:", error);

        container.innerHTML =
            "<p>Unable to load food items. Please try again later.</p>";

    }
}


// Load the student's saved favorites
async function loadHomeFavoriteIds() {

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

        console.error("Favorites loading error:", error);

    }
}


// Display food items
function displayHomeItems() {

    const container = document.getElementById("home-food-grid");

    container.innerHTML = "";

    if (homeMenuItems.length === 0) {
        container.innerHTML = "<p>No food items available.</p>";
        return;
    }

    homeMenuItems.forEach(item => {

        const card = document.createElement("div");

        card.className = item.availability
            ? "food-card green"
            : "food-card pink";

        card.dataset.itemId = item.item_id;

        // Image wrapper
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "image-wrapper";

        const image = document.createElement("img");
        image.alt = item.item_name;

        image.src = item.image && item.image.trim() !== ""
            ? item.image
            : "assets/img/placeholder.jpg";

        image.onerror = function () {
            this.onerror = null;
            this.src = "assets/img/placeholder.jpg";
        };

        // Favorite button
        const favoriteButton = document.createElement("button");    
        favoriteButton.type = "button";
        favoriteButton.className = "favorite-btn";

        updateHomeHeart(    
            favoriteButton,
            favoriteItemIds.has(Number(item.item_id))
        );

        favoriteButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            toggleHomeFavorite(item, favoriteButton);
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

        // Availability
        const availability = document.createElement("div");
        availability.className = "rating";

        const availabilityText = document.createElement("span");

        availabilityText.textContent = item.availability
            ? "Available"
            : "Unavailable";

        availability.appendChild(availabilityText);

        cardDetails.appendChild(textInfo);
        cardDetails.appendChild(availability);

        // Add food item to cart when clicked
        card.addEventListener("click", function () {

            if (!item.availability) {
                alert("This item is currently unavailable.");
                return;
            }

            addHomeItemToCart(item);

        });

        card.appendChild(imageWrapper);
        card.appendChild(cardDetails);
        container.appendChild(card);

    });
}


// Update favorite heart icon
function updateHomeHeart(button, isFavorite) {

    button.innerHTML = isFavorite
        ? '<i class="fa-solid fa-heart"></i>'
        : '<i class="fa-regular fa-heart"></i>';

}


// Add or remove favorites
async function toggleHomeFavorite(item, button) {

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

            response = await fetch(
                `${API_BASE_URL}/api/users/${userId}/favorites/${itemId}`,
                {
                    method: "DELETE"
                }
            );

        } else {

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

        if (isFavorite) {
            favoriteItemIds.delete(itemId);
        } else {
            favoriteItemIds.add(itemId);
        }

        updateHomeHeart(button, favoriteItemIds.has(itemId));

    } catch (error) {

        console.error("Favorite error:", error);
        alert(error.message);

    } finally {

        button.disabled = false;

    }

}


// Add food item to cart
function addHomeItemToCart(item) {
    const CART_KEY = "campusBiteCart";

    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    const stallId = Number(item.stall_id);
    const stallName = item.stall_name;

    // Check if the cart already contains items from another stall
    const hasDifferentStall = cart.some(
        cartItem => Number(cartItem.stall_id) !== stallId
    );

    if (hasDifferentStall) {
        const confirmChange = confirm(
            "Your cart contains items from another stall.\n\n" +
            "Would you like to clear your current cart and order from " +
            stallName + " instead?"
        );

        if (!confirmChange) {
            return;
        }

        cart = [];
    }

    // Check if item already exists in cart
    const existingItem = cart.find(cartItem =>
        String(cartItem.item_id) === String(item.item_id) &&
        Number(cartItem.stall_id) === stallId
    );

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            item_id: item.item_id,
            stall_id: stallId,
            stall_name: stallName,
            item_name: item.item_name,
            price: Number(item.price),
            quantity: 1
        });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    alert(item.item_name + " added to your order!");
}