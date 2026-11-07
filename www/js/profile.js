function logout() {
    const confirmLogout = confirm("Are you sure you want to logout?");

    if (confirmLogout) {
        // Clear login-related session data
        sessionStorage.clear();

        // Remove saved authentication information
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_email");
        localStorage.removeItem("user_role");

        // Return to login page
        window.location.href = "index.html";
    }
}