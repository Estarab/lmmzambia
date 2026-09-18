const Registration = require("../models/Registration");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

// =======================================================
// EMAIL TRANSPORTER (GMAIL SMTP – SSL)
// =======================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // REQUIRED for port 465

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// =======================================================
// VERIFY SMTP CONNECTION
// =======================================================

transporter.verify((error) => {
  if (error) {
    console.error("❌ Gmail SMTP connection failed:", error);
  } else {
    console.log("✅ Gmail SMTP ready to send emails");
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

    // ===================================================
    // 1. VALIDATE EMAIL
    // ===================================================

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // ===================================================
    // 2. VALIDATE PROGRAM
    // ===================================================

    if (!program || !["Lusaka", "Harare"].includes(program)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid event location.",
      });
    }

    // ===================================================
    // 3. PREVENT DUPLICATE REGISTRATION
    // ===================================================

    const existing = await Registration.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This email has already been used to register.",
      });
    }

    // ===================================================
    // 4. GENERATE REGISTRATION ID
    // ===================================================

    const registrationId = uuidv4();

    // ===================================================
    // 5. SAVE REGISTRATION TO MONGODB
    // ===================================================

    const registration = await Registration.create({
      ...req.body,
      registrationId,
    });

    console.log(
      `✅ Registration saved to MongoDB: ${registration.email}`
    );

    // ===================================================
    // 6. CREATE QR CODE PAYLOAD
    // ===================================================

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

    // ===================================================
    // 7. GENERATE QR CODE
    // ===================================================

    const qrBuffer = await QRCode.toBuffer(qrPayload);

    console.log(
      `✅ QR code generated for registration: ${registrationId}`
    );

    // ===================================================
    // 8. SEND CONFIRMATION EMAIL
    //
    // IMPORTANT:
    // Email failure is handled separately.
    // Registration remains successful even if email fails.
    // ===================================================

    let emailSent = false;
    let emailErrorMessage = null;

    try {
      await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || "Study in Mauritius"}" <${process.env.SMTP_USER}>`,

        to: registration.email,

        subject:
          "Registration Confirmed – Study in Mauritius Fair",

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              max-width: 600px;
              margin: auto;
              padding: 20px;
              color: #222;
            "
          >

            <h2 style="text-align:center;">
              Registration Confirmed 🎓
            </h2>

            <p>
              Dear <strong>${registration.firstName}</strong>,
            </p>

            <p>
              Thank you for registering for the
              <strong>
                Study in Mauritius Higher Education Fair (${program})
              </strong>.
            </p>

            <p>
              <strong>Event Details:</strong>
              <br />

              ${
                program === "Lusaka"
                  ? "📍 Radisson Blu Hotel, Lusaka<br/>📅 20 February 2026<br/>🕙 10:00 – 16:00"
                  : "📍 Hyatt Regency Harare The Meikles<br/>📅 24 February 2026<br/>🕙 10:00 – 16:00"
              }
            </p>

            <p>
              <strong>Your Registration QR Code:</strong>
            </p>

            <div style="text-align:center;">
              <img
                src="cid:registrationqr"
                width="220"
                alt="Registration QR Code"
              />
            </div>

            <p>
              Please present this QR code at the entrance
              for verification.
            </p>

            <p>
              Your registration has been successfully recorded.
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

      emailSent = true;

      console.log(
        `✅ Confirmation email sent to ${registration.email}`
      );

    } catch (emailError) {
      emailErrorMessage = emailError.message;

      console.error(
        `❌ Registration saved, but confirmation email failed for ${registration.email}:`,
        emailError
      );
    }

    // ===================================================
    // 9. RESPOND TO FRONTEND
    //
    // Registration is successful because MongoDB saved it.
    // Email status is returned separately.
    // ===================================================

    return res.status(201).json({
      success: true,

      message: emailSent
        ? "Registration successful. Confirmation email sent."
        : "Registration successful, but the confirmation email could not be sent.",

      emailSent,

      emailError: emailSent ? null : emailErrorMessage,

      data: registration,
    });

  } catch (error) {
    // ===================================================
    // MAIN REGISTRATION ERROR
    // ===================================================

    console.error("❌ Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
};

// =======================================================
// GET ALL REGISTRATIONS (ADMIN)
// =======================================================

exports.getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find().sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: registrations.length,
      data: registrations,
    });

  } catch (error) {
    console.error("❌ Get Registrations Error:", error);

    return res.status(500).json({
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

    // ===================================================
    // FILTER RECIPIENTS
    // ===================================================

    const filter = program === "All" ? {} : { program };

    const recipients = await Registration.find(filter).select(
      "email"
    );

    // ===================================================
    // NO RECIPIENTS
    // ===================================================

    if (!recipients.length) {
      return res.status(404).json({
        success: false,
        message: "No recipients found.",
      });
    }

    // ===================================================
    // GET EMAIL ADDRESSES
    // ===================================================

    const emails = recipients.map((r) => r.email);

    // ===================================================
    // EMAIL BATCH SETTINGS
    // ===================================================

    const chunkSize = 100;

    const delay = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    let sentCount = 0;
    let failedCount = 0;

    // ===================================================
    // SEND EMAILS IN BATCHES
    // ===================================================

    for (let i = 0; i < emails.length; i += chunkSize) {
      const batch = emails.slice(i, i + chunkSize);

      try {
        await transporter.sendMail({
          from: `"${process.env.MAIL_FROM_NAME || "Study in Mauritius"}" <${process.env.SMTP_USER}>`,

          bcc: batch,

          subject,

          html: `
            <div
              style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 20px;
              "
            >

              ${message}

              <p>
                <br/>
                — Study in Mauritius Team
              </p>

            </div>
          `,
        });

        sentCount += batch.length;

        console.log(
          `✅ Bulk email: Sent ${sentCount} of ${emails.length}`
        );

      } catch (err) {
        failedCount += batch.length;

        console.error(
          `❌ Bulk email batch failed:`,
          err.message
        );
      }

      // =================================================
      // WAIT 15 SECONDS BEFORE NEXT BATCH
      // =================================================

      if (i + chunkSize < emails.length) {
        await delay(15000);
      }
    }

    // ===================================================
    // RETURN BULK EMAIL RESULT
    // ===================================================

    return res.json({
      success: true,

      message: `Bulk email process completed. Sent to ${sentCount} recipients.`,

      sentCount,

      failedCount,

      totalRecipients: emails.length,
    });

  } catch (error) {
    console.error("❌ Bulk Email Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};