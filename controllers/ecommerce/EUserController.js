const EUser = require("../../models/ecommerce/EUser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerEUser = async (req, res) => {
  try {
    let { name, email, password, phone, address } = req.body;
    email = email.trim().toLowerCase(); // ✅ normalize email
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new EUser({ name, email, password: hashedPassword, phone, address });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.loginEUser = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim().toLowerCase(); // ✅ normalize email

    const user = await EUser.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// const EUser = require("../../models/ecommerce/EUser");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// exports.registerEUser = async (req, res) => {
//   try {
//     const { name, email, password, phone, address } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new EUser({ name, email, password: hashedPassword, phone, address });
//     await user.save();
//     res.status(201).json({ message: "User registered successfully" });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// exports.loginEUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await EUser.findOne({ email });
//     if (!user) return res.status(404).json({ error: "User not found" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

//     const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
//     res.json({ token, user });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
