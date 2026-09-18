const EAdmin = require("../../models/ecommerce/EAdmin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerEAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new EAdmin({ username, password: hashedPassword });
    await admin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.loginEAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await EAdmin.findOne({ username });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET);
    res.json({ token, admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
