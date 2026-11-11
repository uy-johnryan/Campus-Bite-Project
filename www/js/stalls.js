window.API_BASE_URL = window.API_BASE_URL || "http://127.0.0.1:5000";

async function loadStalls() {
    const container = document.getElementById("stalls-container");

    if (!container) return;

    container.innerHTML = "<p>Loading stalls...</p>";

    try {
        const response = await fetch(`${window.API_BASE_URL}/api/stalls`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to load stalls.");
        }

        container.innerHTML = "";

        if (data.stalls.length === 0) {
            container.innerHTML = "<p>No stalls available.</p>";
            return;
        }

        data.stalls.forEach(stall => {
            // Create the card
            const card = document.createElement("div");

            card.className = stall.status === "open"
                ? "food-card green"
                : "food-card";

            // Image wrapper
            const imageWrapper = document.createElement("div");
            imageWrapper.className = "image-wrapper";

            const image = document.createElement("img");
            image.src = stall.logo || "assets/img/stalls/ChickyFrydayLogo.jpg";
            image.alt = stall.stall_name;

            image.onerror = function () {
                this.src = "assets/img/stalls/ChickyFrydayLogo.jpg";
            };

            imageWrapper.appendChild(image);

            // Card details
            const cardDetails = document.createElement("div");
            cardDetails.className = "card-details";

            const textInfo = document.createElement("div");
            textInfo.className = "text-info";

            const name = document.createElement("h3");
            name.textContent = stall.stall_name;

            textInfo.appendChild(name);

            // Rating
            const rating = document.createElement("div");
            rating.className = "rating";

            const star = document.createElement("i");
            star.className = "fa-solid fa-star";

            const ratingValue = document.createElement("span");
            ratingValue.textContent = stall.rating ?? "N/A";

            rating.appendChild(star);
            rating.appendChild(ratingValue);

            cardDetails.appendChild(textInfo);
            cardDetails.appendChild(rating);

            // Assemble the card
            card.appendChild(imageWrapper);
            card.appendChild(cardDetails);

            // Open the stall menu when clicked
            card.style.cursor = "pointer";

            card.addEventListener("click", () => {
                if (stall.status !== "open") {
                    alert("This stall is currently closed.");
                    return;
                }

                localStorage.setItem("selectedStallId", stall.stall_id);
                localStorage.setItem("selectedStallName", stall.stall_name);

                window.location.href = "stall-menu.html";
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading stalls:", error);
        container.innerHTML =
            "<p class='error-message'>Unable to load stalls. Please try again later.</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadStalls);