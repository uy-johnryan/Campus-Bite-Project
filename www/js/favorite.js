const API_BASE_URL = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", function () {
    loadFavorites();
});

async function loadFavorites() {
    const favoriteContent = document.getElementById("favorite-content");

    // Get the currently logged-in user
    const user = JSON.parse(localStorage.getItem("campusBiteUser"));

    if (!user || user.role !== "student") {
        favoriteContent.textContent = "Please log in using a student account.";
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

        favoriteContent.innerHTML = "";

        // Show empty message if there are no favorites
        if (result.favorites.length === 0) {
            favoriteContent.innerHTML = `
                <div class="empty-favorites">
                    <div class="empty-favorite-icon">
                        <i class="fa-regular fa-heart"></i>
                    </div>

                    <h2>No Favorites Yet</h2>

                    <p>
                        You haven't added any food items to your favorites.
                        Browse the menu and tap the heart icon to save your favorites!
                    </p>

                    <button type="button" class="browse-btn"
                        onclick="location.href='home.html'">
                        Browse Food
                    </button>
                </div>
            `;
            return;
        }

        // Create the favorites list
        const favoritesList = document.createElement("div");
        favoritesList.className = "favorites-list";

        result.favorites.forEach(item => {
            const card = document.createElement("div");
            card.className = "favorite-card";

            const image = document.createElement("img");
            image.className = "favorite-image";
            image.src = item.image || "https://via.placeholder.com/150";
            image.alt = item.item_name;

            const details = document.createElement("div");
            details.className = "favorite-details";

            const name = document.createElement("h3");
            name.textContent = item.item_name;

            const stall = document.createElement("p");
            stall.className = "favorite-stall";
            stall.textContent = item.stall_name;

            const price = document.createElement("p");
            price.className = "favorite-price";
            price.textContent = `₱${Number(item.price).toFixed(2)}`;

            details.appendChild(name);
            details.appendChild(stall);
            details.appendChild(price);

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "remove-favorite-btn";
            removeButton.innerHTML = '<i class="fa-solid fa-heart"></i>';
            removeButton.title = "Remove from favorites";

            removeButton.addEventListener("click", function () {
                removeFavorite(item.item_id, card, removeButton);
            });

            card.appendChild(image);
            card.appendChild(details);
            card.appendChild(removeButton);

            favoritesList.appendChild(card);
        });

        favoriteContent.appendChild(favoritesList);

    } catch (error) {
        console.error("Favorites error:", error);
        favoriteContent.textContent = "Unable to load your favorites. Please try again.";
    }
}

async function removeFavorite(itemId, card, button) {
    const user = JSON.parse(localStorage.getItem("campusBiteUser"));

    button.disabled = true;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/users/${user.user_id}/favorites/${itemId}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to remove favorite.");
        }

        // Remove the item from the displayed list
        card.remove();

        // Show empty message if no favorites remain
        const favoritesList = document.querySelector(".favorites-list");

        if (favoritesList && favoritesList.children.length === 0) {
            loadFavorites();
        }

    } catch (error) {
        console.error("Remove favorite error:", error);
        alert(error.message);
        button.disabled = false;
    }
}