document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();

            // Проверяем роль пользователя
            if (data.role === "admin") {
                window.location.href = "/admin.html";
            } else {
                window.location.href = "/main.html";
            }
        } else {
            alert("Invalid login credentials"); // Если ошибка, показываем сообщение
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("An error occurred during login");
    }
});

// Регистрация
document
    .getElementById("registerForm")
    ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const response = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            window.location.href = "/login.html";
        } else {
            alert("Error during registration");
        }
    });

// Выход
document.getElementById("logout")?.addEventListener("click", async () => {
    const response = await fetch("/logout", {
        method: "POST",
    });

    if (response.ok) {
        window.location.href = "/login.html";
    }
});

// Получение информации о пользователе
async function fetchUserInfo() {
    const response = await fetch("/user");
    if (response.ok) {
        const data = await response.json();
        document.getElementById("username").innerText = data.username;
        document.getElementById("role").innerText = data.role;
    }
}

if (window.location.pathname === "/index.html") {
    fetchUserInfo();
}
