document.addEventListener("DOMContentLoaded", function () {

    // CampusBite API URL
    window.API_BASE_URL = window.API_BASE_URL || "http://127.0.0.1:5000";

    // Form elements
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const showRegister = document.getElementById("show-register");
    const showLogin = document.getElementById("show-login");

    // Message elements
    const loginMessage = document.getElementById("login-message");
    const registerMessage = document.getElementById("register-message");

    // Switch to Registration Form
    showRegister.addEventListener("click", function (event) {
        event.preventDefault();

        loginForm.classList.remove("active");
        registerForm.classList.add("active");

        loginMessage.textContent = "";
        registerMessage.textContent = "";
    });

    // Switch to Login Form
    showLogin.addEventListener("click", function (event) {
        event.preventDefault();

        registerForm.classList.remove("active");
        loginForm.classList.add("active");

        loginMessage.textContent = "";
        registerMessage.textContent = "";
    });

    // Student and Vendor Login
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        loginMessage.style.color = "#d32f2f";
        loginMessage.textContent = "Logging in...";

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                loginMessage.textContent = result.message || "Login failed.";
                return;
            }

            localStorage.setItem("campusBiteUser", JSON.stringify(result.user));

            window.location.href = result.destination;

        } catch (error) {
            console.error("Login error:", error);
            loginMessage.textContent = "Unable to connect to the server.";
        }
    });

    // Student Registration
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("register-username").value.trim();
        const email = document.getElementById("register-email").value.trim();
        const password = document.getElementById("register-password").value;

        registerMessage.style.color = "#d32f2f";
        registerMessage.textContent = "Creating account...";

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                registerMessage.textContent = result.message || "Registration failed.";
                return;
            }

            registerMessage.style.color = "green";
            registerMessage.textContent = "Registration successful! You can now log in.";

            registerForm.reset();

            setTimeout(() => {
                registerForm.classList.remove("active");
                loginForm.classList.add("active");

                document.getElementById("login-email").value = email;

                registerMessage.textContent = "";
            }, 1500);

        } catch (error) {
            console.error("Registration error:", error);
            registerMessage.textContent = "Unable to connect to the server.";
        }
    });

});