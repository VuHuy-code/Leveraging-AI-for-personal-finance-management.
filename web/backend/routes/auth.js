const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Đọc dữ liệu người dùng từ file JSON
const usersFile = path.resolve(__dirname, "../data/users.json");

// Đăng ký tài khoản
router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));

    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ message: "Email đã được sử dụng!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: users.length + 1,
      name: fullName,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    const token = jwt.sign(
      { id: newUser.id },
      "jwt_secret_key",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

// Đăng nhập
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Đọc file người dùng
    const users = JSON.parse(fs.readFileSync(usersFile, "utf8"));

    // Tìm người dùng theo email
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không đúng!" });
    }

    // Tạo JWT token
    const token = jwt.sign({ id: user.id }, "jwt_secret_key", { expiresIn: "1d" });

    // Trả về token và thông tin người dùng
    res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

module.exports = router;