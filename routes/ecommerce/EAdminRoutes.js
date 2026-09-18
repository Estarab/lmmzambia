const express = require("express");
const router = express.Router();
const { registerEAdmin, loginEAdmin } = require("../../controllers/ecommerce/EAdminController");

router.post("/register", registerEAdmin);
router.post("/login", loginEAdmin);

module.exports = router;
