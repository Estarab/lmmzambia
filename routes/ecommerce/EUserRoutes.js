const express = require("express");
const router = express.Router();
const { registerEUser, loginEUser } = require("../../controllers/ecommerce/EUserController");

router.post("/register", registerEUser);
router.post("/login", loginEUser);

module.exports = router;
