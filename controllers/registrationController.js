const Registration = require("../models/Registration");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

// =======================================================
// EMAIL TRANSPORTER (HOSTINGER SMTP – SSL)
// =======================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // REQUIRED for port 465
  auth: {
    user: process.env.SMTP_USER, // no-reply@yourdomain.com
    pass: process.env.SMTP_PASS, // email password
  },
});

// Optional but recommended: verify SMTP on startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error);
  } else {
    console.log("✅ Hostinger SMTP ready to send emails");
  }
});

// =======================================================
// UTIL: GENERIC EMAIL VALIDATION
// =======================================================
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// =======================================================
// CREATE REGISTRATION
// =======================================================
exports.createRegistration = async (req, res) => {
  try {
    const { email, program } = req.body;

    // 1️⃣ Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // 2️⃣ Prevent duplicate registration
    const existing = await Registration.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This email has already been used to register.",
      });
    }

    // 3️⃣ Generate registration ID
    const registrationId = uuidv4();

    // 4️⃣ Save registration
    const registration = await Registration.create({
      ...req.body,
      registrationId,
    });

    // 5️⃣ QR payload
    const qrPayload = JSON.stringify({
      registrationId,
      event: "Study in Mauritius Higher Education Fair 2026",
      program: registration.program,
      venue:
        registration.program === "Lusaka"
          ? "Radisson Blu Hotel, Lusaka"
          : "Hyatt Regency Harare The Meikles",
      date:
        registration.program === "Lusaka"
          ? "20 February 2026 | 10:00–16:00"
          : "24 February 2026 | 10:00–16:00",
    });

    // 6️⃣ Generate QR code
    const qrBuffer = await QRCode.toBuffer(qrPayload);

    // 7️⃣ Send confirmation email
    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || "Study in Mauritius"}" <${process.env.SMTP_USER}>`,
      to: registration.email,
      subject: "Registration Confirmed – Study in Mauritius Fair",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
          <h2 style="text-align:center;">Registration Confirmed 🎓</h2>

          <p>Dear <strong>${registration.firstName}</strong>,</p>

          <p>
            Thank you for registering for the
            <strong>Study in Mauritius Higher Education Fair (${program})</strong>.
          </p>

          <p><strong>Event Details:</strong><br/>
          ${
            program === "Lusaka"
              ? "📍 Radisson Blu Hotel, Lusaka<br/>📅 20 February 2026<br/>🕙 10:00 – 16:00"
              : "📍 Hyatt Regency Harare The Meikles<br/>📅 24 February 2026<br/>🕙 10:00 – 16:00"
          }</p>

          <p><strong>Your Registration QR Code:</strong></p>

          <div style="text-align:center;">
            <img src="cid:registrationqr" width="220" />
          </div>

          <p>
            Please present this QR code at the entrance for verification.
          </p>

          <p>
            Kind regards,<br/>
            <strong>Study in Mauritius Team</strong>
          </p>
        </div>
      `,
      attachments: [
        {
          filename: "registration-qr.png",
          content: qrBuffer,
          cid: "registrationqr",
        },
      ],
    });

    // 8️⃣ Respond to frontend
    res.status(201).json({
      success: true,
      message: "Registration successful. Confirmation email sent.",
      data: registration,
    });
  } catch (error) {
    console.error("Registration Error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// =======================================================
// GET ALL REGISTRATIONS (ADMIN)
// =======================================================
exports.getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: registrations.length,
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
};

// =======================================================
// BULK EMAIL (ADMIN DASHBOARD)
// =======================================================

exports.sendBulkEmail = async (req, res) => {
  try {
    const { program, subject, message } = req.body;

    const filter = program === "All" ? {} : { program };
    const recipients = await Registration.find(filter).select("email");

    if (!recipients.length) {
      return res.status(404).json({
        success: false,
        message: "No recipients found.",
      });
    }

    const emails = recipients.map(r => r.email);

    const chunkSize = 100;
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    let sentCount = 0;

    for (let i = 0; i < emails.length; i += chunkSize) {
      const batch = emails.slice(i, i + chunkSize);

      try {
        await transporter.sendMail({
          from: `"Study in Mauritius" <${process.env.SMTP_USER}>`,
          bcc: batch,
          subject,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
              ${message}
              <p><br/>— Study in Mauritius Team</p>
            </div>
          `,
        });

        sentCount += batch.length;
        console.log(`✅ Sent ${sentCount} of ${emails.length}`);

      } catch (err) {
        console.error("Batch failed:", err.message);
      }

      await delay(15000);
    }

    res.json({
      success: true,
      message: `Bulk email process completed. Sent to ${sentCount} recipients.`,
    });

  } catch (error) {
    console.error("Bulk Email Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// exports.sendBulkEmail = async (req, res) => {
//   try {
//     const { program, subject, message } = req.body;

//     const filter = program === "All" ? {} : { program };
//     const recipients = await Registration.find(filter).select("email");

//     if (!recipients.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No recipients found.",
//       });
//     }

//     const emails = recipients.map((r) => r.email);

//     await transporter.sendMail({
//       from: `"${process.env.MAIL_FROM_NAME || "Study in Mauritius"}" <${process.env.SMTP_USER}>`,
//       bcc: emails,
//       subject,
//       html: `
//         <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
//           ${message}
//           <p><br/>— Study in Mauritius Team</p>
//         </div>
//       `,
//     });

//     res.json({
//       success: true,
//       message: `Bulk email sent to ${emails.length} recipients.`,
//     });
//   } catch (error) {
//     console.error("Bulk Email Error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to send bulk email",
//     });
//   }
// };




// const Registration = require("../models/Registration");
// const QRCode = require("qrcode");
// const { v4: uuidv4 } = require("uuid");
// const nodemailer = require("nodemailer");

// // =======================================================
// // EMAIL TRANSPORTER (UNIVERSAL – SENDS TO ALL EMAIL TYPES)
// // =======================================================
// await transporter.sendMail({
//   from: `"Study in Mauritius" <${process.env.SMTP_USER}>`,
//   to: registration.email,
//   subject: "Registration Confirmed",
//   html: "<h2>You’re registered 🎉</h2>",
// });


// // =======================================================
// // UTIL: GENERIC EMAIL VALIDATION
// // =======================================================
// const isValidEmail = (email) => {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// };

// // =======================================================
// // CREATE REGISTRATION
// // =======================================================
// exports.createRegistration = async (req, res) => {
//   try {
//     const { email, program } = req.body;

//     // 1️⃣ Validate ANY valid email (Gmail, Yahoo, Webmail, etc.)
//     if (!isValidEmail(email)) {
//       return res.status(400).json({
//         success: false,
//         message: "Please enter a valid email address.",
//       });
//     }

//     // 2️⃣ Prevent duplicate email
//     const existing = await Registration.findOne({ email });
//     if (existing) {
//       return res.status(409).json({
//         success: false,
//         message: "This email has already been used to register.",
//       });
//     }

//     // 3️⃣ Generate registration ID
//     const registrationId = uuidv4();

//     // 4️⃣ Save registration
//     const registration = await Registration.create({
//       ...req.body,
//       registrationId,
//     });

//     // 5️⃣ QR PAYLOAD
//     const qrPayload = JSON.stringify({
//       registrationId,
//       event: "Study in Mauritius Higher Education Fair 2026",
//       program: registration.program,
//       venue:
//         registration.program === "Lusaka"
//           ? "Radisson Blu Hotel, Lusaka"
//           : "Hyatt Regency Harare The Meikles",
//       date:
//         registration.program === "Lusaka"
//           ? "20 February 2026 | 10:00–16:00"
//           : "24 February 2026 | 10:00–16:00",
//     });

//     // 6️⃣ Generate QR code
//     const qrBuffer = await QRCode.toBuffer(qrPayload);

//     // 7️⃣ Send confirmation email (ANY EMAIL PROVIDER)
//     await transporter.sendMail({
//       from: `"Study in Mauritius" <${process.env.MAIL_USER || "abrahamisraelnasilele@gmail.com"}>`,
//       to: registration.email,
//       subject: "Registration Confirmed – Study in Mauritius Fair",
//       html: `
//         <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
//           <h2 style="text-align:center;">Registration Confirmed 🎓</h2>

//           <p>Dear <strong>${registration.firstName}</strong>,</p>

//           <p>
//             Thank you for registering for the
//             <strong>Study in Mauritius Higher Education Fair (${program})</strong>.
//           </p>

//           <p><strong>Event Details:</strong><br/>
//           ${
//             program === "Lusaka"
//               ? "📍 Radisson Blu Hotel, Lusaka<br/>📅 20 February 2026<br/>🕙 10:00 – 16:00"
//               : "📍 Hyatt Regency Harare The Meikles<br/>📅 24 February 2026<br/>🕙 10:00 – 16:00"
//           }</p>

//           <p><strong>Your Registration QR Code:</strong></p>

//           <div style="text-align:center;">
//             <img src="cid:registrationqr" width="220" />
//           </div>

//           <p>
//             Please present this QR code at the entrance for verification.
//           </p>

//           <p>
//             Kind regards,<br/>
//             <strong>Study in Mauritius Team</strong>
//           </p>
//         </div>
//       `,
//       attachments: [
//         {
//           filename: "registration-qr.png",
//           content: qrBuffer,
//           cid: "registrationqr",
//         },
//       ],
//     });

//     // 8️⃣ Respond to frontend
//     res.status(201).json({
//       success: true,
//       message: "Registration successful. Confirmation email sent.",
//       data: registration,
//     });
//   } catch (error) {
//     console.error("Registration Error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Registration failed",
//       error: error.message,
//     });
//   }
// };

// // =======================================================
// // GET ALL REGISTRATIONS (ADMIN)
// // =======================================================
// exports.getAllRegistrations = async (req, res) => {
//   try {
//     const registrations = await Registration.find().sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       count: registrations.length,
//       data: registrations,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch registrations",
//     });
//   }
// };

// // =======================================================
// // BULK EMAIL (ADMIN DASHBOARD – ALL EMAIL TYPES)
// // =======================================================
// exports.sendBulkEmail = async (req, res) => {
//   try {
//     const { program, subject, message } = req.body;

//     // program = "Lusaka" | "Harare" | "All"
//     const filter = program === "All" ? {} : { program };

//     const recipients = await Registration.find(filter).select("email");

//     if (!recipients.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No recipients found.",
//       });
//     }

//     const emails = recipients.map((r) => r.email);

//     await transporter.sendMail({
//       from: `"Study in Mauritius" <${process.env.MAIL_USER || "abrahamisraelnasilele@gmail.com"}>`,
//       bcc: emails, // privacy-safe bulk send
//       subject,
//       html: `
//         <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
//           ${message}
//           <p><br/>— Study in Mauritius Team</p>
//         </div>
//       `,
//     });

//     res.json({
//       success: true,
//       message: `Bulk email sent to ${emails.length} recipients.`,
//     });
//   } catch (error) {
//     console.error("Bulk Email Error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to send bulk email",
//     });
//   }
// };



// const Registration = require("../models/Registration");
// const QRCode = require("qrcode");
// const { v4: uuidv4 } = require("uuid");
// const nodemailer = require("nodemailer");

// // ================= EMAIL TRANSPORTER =================
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "abrahamisraelnasilele@gmail.com",         // ← replace with your Gmail
//     pass: "krde pobh lfzz hccn",        // ← replace with Gmail app password
//   },
// });

// // ================= UTIL: VALIDATE GMAIL =================
// const isValidGmail = (email) => {
//   return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
// };

// // =======================================================
// // CREATE REGISTRATION
// // =======================================================
// exports.createRegistration = async (req, res) => {
//   try {
//     const { email, program } = req.body;

//     // 1️⃣ Validate Gmail only
//     if (!isValidGmail(email)) {
//       return res.status(400).json({
//         success: false,
//         message: "Only valid Gmail addresses are allowed.",
//       });
//     }

//     // 2️⃣ Prevent duplicate email
//     const existing = await Registration.findOne({ email });
//     if (existing) {
//       return res.status(409).json({
//         success: false,
//         message: "This email has already been used to register.",
//       });
//     }

//     // 3️⃣ Generate registration ID
//     const registrationId = uuidv4();

//     // 4️⃣ Save registration
//     const registration = await Registration.create({
//       ...req.body,
//       registrationId,
//     });

//     // 5️⃣ QR PAYLOAD (PURE JSON – SAFE)
//     const qrPayload = JSON.stringify({
//       registrationId,
//       event: "Study in Mauritius Higher Education Fair 2026",
//       program: registration.program,
//       venue:
//         registration.program === "Lusaka"
//           ? "Radisson Blu Hotel, Lusaka"
//           : "Hyatt Regency Harare The Meikles",
//       date:
//         registration.program === "Lusaka"
//           ? "20 February 2026 | 10:00–16:00"
//           : "24 February 2026 | 10:00–16:00",
//     });

//     // 6️⃣ Generate QR code
//     const qrBuffer = await QRCode.toBuffer(qrPayload);

//     // 7️⃣ Send confirmation email
//     await transporter.sendMail({
//       from: `"Study in Mauritius" <yourgmail@gmail.com>`,
//       to: registration.email,
//       subject: "Registration Confirmed – Study in Mauritius Fair",
//       html: `
//         <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
//           <h2 style="text-align:center;">Registration Confirmed 🎓</h2>

//           <p>Dear <strong>${registration.firstName}</strong>,</p>

//           <p>
//             Thank you for registering for the
//             <strong>Study in Mauritius Higher Education Fair (${program})</strong>.
//           </p>

//           <p><strong>Event Details:</strong><br/>
//           ${
//             program === "Lusaka"
//               ? "📍 Radisson Blu Hotel, Lusaka<br/>📅 20 February 2026<br/>🕙 10:00 – 16:00"
//               : "📍 Hyatt Regency Harare The Meikles<br/>📅 24 February 2026<br/>🕙 10:00 – 16:00"
//           }</p>

//           <p><strong>Your Registration QR Code:</strong></p>

//           <div style="text-align:center;">
//             <img src="cid:registrationqr" width="220" />
//           </div>

//           <p>
//             Please present this QR code at the entrance for verification.
//           </p>

//           <p>
//             Kind regards,<br/>
//             <strong>Study in Mauritius Team</strong>
//           </p>
//         </div>
//       `,
//       attachments: [
//         {
//           filename: "registration-qr.png",
//           content: qrBuffer,
//           cid: "registrationqr",
//         },
//       ],
//     });

//     // 8️⃣ Respond to frontend
//     res.status(201).json({
//       success: true,
//       message: "Registration successful. Confirmation email sent.",
//       data: registration,
//     });
//   } catch (error) {
//     console.error("Registration Error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Registration failed",
//       error: error.message,
//     });
//   }
// };

// // =======================================================
// // GET ALL REGISTRATIONS (ADMIN)
// // =======================================================
// exports.getAllRegistrations = async (req, res) => {
//   try {
//     const registrations = await Registration.find().sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       count: registrations.length,
//       data: registrations,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch registrations",
//     });
//   }
// };

// // =======================================================
// // BULK EMAIL (ADMIN DASHBOARD)
// // =======================================================
// exports.sendBulkEmail = async (req, res) => {
//   try {
//     const { program, subject, message } = req.body;

//     // program = "Lusaka" | "Harare" | "All"
//     const filter = program === "All" ? {} : { program };

//     const recipients = await Registration.find(filter).select("email");

//     if (!recipients.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No recipients found.",
//       });
//     }

//     const emails = recipients.map((r) => r.email);

//     await transporter.sendMail({
//       from: `"Study in Mauritius" <yourgmail@gmail.com>`,
//       bcc: emails, // privacy-safe bulk send
//       subject,
//       html: `
//         <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
//           ${message}
//           <p><br/>— Study in Mauritius Team</p>
//         </div>
//       `,
//     });

//     res.json({
//       success: true,
//       message: `Bulk email sent to ${emails.length} recipients.`,
//     });
//   } catch (error) {
//     console.error("Bulk Email Error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to send bulk email",
//     });
//   }
// };



// const Registration = require("../models/Registration");
// const QRCode = require("qrcode");
// const { v4: uuidv4 } = require("uuid");
// const nodemailer = require("nodemailer");

// // 🔹 Email transporter – hardcoded credentials
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "abrahamisraelnasilele@gmail.com",         // ← replace with your Gmail
//     pass: "krde pobh lfzz hccn",        // ← replace with Gmail app password
//   },
// });

// // Create new registration
// exports.createRegistration = async (req, res) => {
//   try {
//     // ✅ Generate unique registration ID
//     const registrationId = uuidv4();

//     const registration = await Registration.create({
//       ...req.body,
//       registrationId,
//     });

//     // ✅ Generate QR code (Data contains registration info)
//     const qrData = JSON.stringify({
//   registrationId,
//   firstName: registration.firstName,
//   lastName: registration.lastName,
//   email: registration.email,
//   program: registration.program,
// });

// // Generate QR code as base64
// const qrBuffer = await QRCode.toBuffer(qrData);

// await transporter.sendMail({
//   from: `"Study in Mauritius" <yourgmail@gmail.com>`,
//   to: registration.email,
//   subject: "Registration Confirmed – Study in Mauritius Fair",
//   html: `
//     <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;text-align:center;">
//       <h2>Thank you for registering!</h2>

//             <p>You have successfully registered for the <strong>Study in Mauritius Higher Education Fair (${registration.program})</strong>.</p>

//           <p><strong>Your Details:</strong><br/>
//           Email: ${registration.email}<br/>
//           Phone: ${registration.phone}<br/>
//           Gender: ${registration.gender}<br/>
//           Country: ${registration.country}<br/>
//           City: ${registration.city}<br/>
//           Residence: ${registration.residence}</p>
    

//       <p><strong>Please present this QR code at the entrance:</strong></p>

//       <img src="cid:registrationqr"
//            style="width:220px;height:220px;margin:20px auto;display:block;"
//            alt="Registration QR Code" />

//       <p>
//         Venue staff will scan this QR code to confirm your registration.
//       </p>

//        //       <p><strong>Event Details:</strong><br/>
//     //       ${registration.program === "Lusaka"
//             ? "📍 Radisson Blu Hotel, Lusaka<br/>📅 20 February 2026<br/>🕙 10:00 – 16:00"
//             : "📍 Hyatt Regency Harare The Meikles<br/>📅 24 February 2026<br/>🕙 10:00 – 16:00"}</p>

//           <p>We look forward to welcoming you!</p>
//           <p>Kind regards,<br/><strong>Study in Mauritius Team</strong></p>

      
//     </div>
//   `,
//   attachments: [
//     {
//       filename: "registration-qr.png",
//       content: qrBuffer,
//       cid: "registrationqr", // MUST MATCH img src
//     },
//   ],
// });


    // const qrData = JSON.stringify({
    //   registrationId,
    //   firstName: registration.firstName,
    //   lastName: registration.lastName,
    //   email: registration.email,
    //   program: registration.program,
    // });

    // const qrCodeImage = await QRCode.toDataURL(qrData);

    // // ✅ Send email confirmation
    // await transporter.sendMail({
    //   from: `"Study in Mauritius" <youremail@gmail.com>`, // same Gmail as above
    //   to: registration.email,
    //   subject: "Registration Confirmed – Study in Mauritius Fair",
    //   html: `
    //     <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
    //       <h2>Thank you for registering!</h2>
    //       <p>Dear <strong>${registration.firstName} ${registration.lastName}</strong>,</p>
    //       <p>Thank you for registering for the <strong>Study in Mauritius Higher Education Fair (${registration.program})</strong>.</p>

    //       <p><strong>Your Details:</strong><br/>
    //       Email: ${registration.email}<br/>
    //       Phone: ${registration.phone}<br/>
    //       Gender: ${registration.gender}<br/>
    //       Country: ${registration.country}<br/>
    //       City: ${registration.city}<br/>
    //       Residence: ${registration.residence}</p>

    //       <p>Please present the QR code below at the registration desk. This QR code acts as your proof of registration.</p>

    //       <div style="text-align:center;margin:20px 0;">
    //         <img src="${qrCodeImage}" alt="QR Code" />
    //       </div>

    //       <p><strong>Event Details:</strong><br/>
    //       ${registration.program === "Lusaka"
    //         ? "📍 Radisson Blu Hotel, Lusaka<br/>📅 20 February 2026<br/>🕙 10:00 – 16:00"
    //         : "📍 Hyatt Regency Harare The Meikles<br/>📅 24 February 2026<br/>🕙 10:00 – 16:00"}</p>

    //       <p>We look forward to welcoming you!</p>
    //       <p>Kind regards,<br/><strong>Study in Mauritius Team</strong></p>
    //     </div>
    //   `,
    // });

//     res.status(201).json({
//       success: true,
//       message: "Registration successful. Confirmation email sent.",
//       data: registration,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to save registration",
//       error: error.message,
//     });
//   }
// };

// // Get all registrations (admin)
// exports.getAllRegistrations = async (req, res) => {
//   try {
//     const registrations = await Registration.find().sort({ createdAt: -1 });
//     res.status(200).json({
//       success: true,
//       count: registrations.length,
//       data: registrations,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch registrations",
//       error: error.message,
//     });
//   }
// };





// const Registration = require("../models/Registration");

// // Create new registration
// exports.createRegistration = async (req, res) => {
//   try {
//     const registration = await Registration.create(req.body);

//     res.status(201).json({
//       success: true,
//       message: "Registration saved successfully",
//       data: registration,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to save registration",
//       error: error.message,
//     });
//   }
// };

// // Get all registrations (admin use)
// exports.getAllRegistrations = async (req, res) => {
//   try {
//     const registrations = await Registration.find().sort({
//       createdAt: -1,
//     });

//     res.status(200).json({
//       success: true,
//       count: registrations.length,
//       data: registrations,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch registrations",
//       error: error.message,
//     });
//   }
// };
