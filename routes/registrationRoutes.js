const express = require("express");
const router = express.Router();

const {
  createRegistration,
  getAllRegistrations,
  sendBulkEmail, // ✅ IMPORT THIS
} = require("../controllers/registrationController");

// POST – save registration
router.post("/", createRegistration);

// GET – fetch all registrations (admin)
router.get("/", getAllRegistrations);

// ✅ POST – send bulk emails (admin)
router.post("/send-bulk-email", sendBulkEmail);

module.exports = router;




// const express = require("express");
// const router = express.Router();
// const {
//   createRegistration,
//   getAllRegistrations,
// } = require("../controllers/registrationController");

// // POST – save registration
// router.post("/", createRegistration);

// // GET – fetch all registrations (admin)
// router.get("/", getAllRegistrations);

// module.exports = router;



// const express = require("express");
// const router = express.Router();
// const {
//   createRegistration,
//   getAllRegistrations,
// } = require("../controllers/registrationController");

// // POST – save registration
// router.post("/", createRegistration);

// // GET – fetch all registrations
// router.get("/", getAllRegistrations);

// module.exports = router;
