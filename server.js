const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./db");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "your_secret_key", // Измените секретный ключ
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Убедитесь, что secure: false для локальной разработки
  })
);

// Проверка, авторизован ли пользователь
function checkAuth(req, res, next) {
  if (req.session.user) {
    next(); // Пользователь авторизован
  } else {
    res.status(401).json({ message: "Not authenticated" }); // Не авторизован
  }
}

// Регистрация
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10); // Хешируем пароль

  db.run(
    `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
    [username, hashedPassword, "user"],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Registration error" });
      }

      req.session.user = { id: this.lastID, username, role: "user" }; // Сохраняем пользователя в сессии
      res.json({ role: "user" }); // После регистрации перенаправляем как обычного пользователя
    }
  );
});

// Авторизация
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (err || !user) {
      // Если пользователь не найден, отправляем 400 ошибку
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const validPassword = bcrypt.compareSync(password, user.password); // Проверяем хешированный пароль
    if (validPassword) {
      // Сохраняем данные о пользователе в сессии
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
      };

      // Если администратор, перенаправляем на admin.html
      if (user.role === "admin") {
        res.json({ role: "admin" });
      } else {
        res.json({ role: user.role }); // Для обычных пользователей возвращаем их роль
      }
    } else {
      return res.status(400).json({ message: "Пароль неправильный" }); // Если пароль не совпадает, возвращаем ошибку
    }
  });
});

// Получение информации о текущем пользователе
app.get("/users", checkAuth, (req, res) => {
  res.json({
    username: req.session.user.username,
    role: req.session.user.role,
  });
});

// Получение списка пользователей (только для администратора)
app.get("/admin/users", checkAuth, (req, res) => {
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.all("SELECT username, role FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: "Error fetching users" });
    } else {
      res.json(rows);
    }
  });
});

// Выход
app.post("/logout", checkAuth, (req, res) => {
  req.session.destroy();
  res.json({ message: "Logged out" });
});

// Изменение роли пользователя (доступно только для администратора)
app.post("/change-role", checkAuth, (req, res) => {
  const { username, role } = req.body;

  if (req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  db.run(
    `UPDATE users SET role = ? WHERE username = ?`,
    [role, username],
    function (err) {
      if (err || this.changes === 0) {
        res.status(500).json({
          message: "Error updating role or user not found",
        });
      } else {
        res.json({ message: "Role updated successfully" });
      }
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
