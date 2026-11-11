document.addEventListener("DOMContentLoaded", function () {

    // Get the logged-in user's information
    const user = JSON.parse(localStorage.getItem("campusBiteUser"));

    // Check if a user is logged in
    if (!user) {
        alert("Please log in first.");
        window.location.href = "index.html";
        return;
    }

    // Display user information
    document.getElementById("profile-name").textContent = user.username;
    document.getElementById("profile-email").textContent = user.email;

    document.getElementById("profile-full-name").textContent = user.username;
    document.getElementById("profile-email-address").textContent = user.email;

    // Format account type
    const accountType = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    document.getElementById("profile-role").textContent = accountType;

});


// Logout Function
function logout() {

    const confirmLogout = confirm("Are you sure you want to logout?");

    if (confirmLogout) {

        // Clear session data
        sessionStorage.clear();

        // Remove saved login information
        localStorage.removeItem("campusBiteUser");

        // Remove older login-related keys, if any
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_role");

        // Return to login page
        window.location.href = "index.html";
    }
}