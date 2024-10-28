const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database/db.sqlite");

// Создание таблиц
db.serialize(() => {
    // Таблица пользователей
    db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

    // Вставка администратора, если его нет
    db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
        if (!row) {
            const bcrypt = require("bcrypt");
            const adminPassword = bcrypt.hashSync("admin", 10);
            db.run(
                `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
                ["admin", adminPassword, "admin"]
            );
        }
    });
});

module.exports = db;
