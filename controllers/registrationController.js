const Registration = require("../models/Registration");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

// =====================================================
// SMTP CONFIGURATION
// =====================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Prevent SMTP from hanging forever
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// =====================================================
// EMAIL VALIDATION
// =====================================================

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// =====================================================
// SMTP TEST
// =====================================================

transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP server ready");
  }
});

// =====================================================
// CREATE REGISTRATION
// =====================================================

exports.createRegistration = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      country,
      city,
      residence,
      phone,
      gender,
      program,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !firstName ||
      !lastName ||
      !email ||
      !country ||
      !city ||
      !residence ||
      !phone ||
      !gender ||
      !program
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields.",
      });
    }

    // =================================================
    // NORMALIZE EMAIL
    // =================================================

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // =================================================
    // CHECK DUPLICATE EMAIL
    // =================================================

    const existing = await Registration.findOne({
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    // =================================================
    // CREATE REGISTRATION
    // =================================================

    const registrationId = uuidv4();

    const registration = await Registration.create({
      ...req.body,
      email: normalizedEmail,
      registrationId,
    });

    console.log(
      `✅ Registration saved: ${registrationId} - ${normalizedEmail}`
    );

    // =================================================
    // SEND SUCCESS RESPONSE IMMEDIATELY
    // =================================================

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      emailSent: false,
      data: registration,
    });

    // =================================================
    // EMAIL + QR CODE RUN IN BACKGROUND
    // =================================================
    //
    // This is deliberately NOT awaited.
    //
    // The browser already received the successful
    // registration response above.
    //
    // =================================================

    setImmediate(async () => {
      try {
        console.log(
          `📧 Starting confirmation email for ${normalizedEmail}`
        );

        // ---------------------------------------------
        // CREATE QR CODE
        // ---------------------------------------------

        const qrPayload = JSON.stringify({
          registrationId,
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          program: registration.program,
        });

        const qrBuffer = await QRCode.toBuffer(qrPayload);

        console.log("✅ QR code generated");

        // ---------------------------------------------
        // SEND EMAIL
        // ---------------------------------------------

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
              "
            >

              <h2 style="color:#0b5ed7;">
                Registration Confirmed
              </h2>

              <p>
                Dear ${registration.firstName} ${registration.lastName},
              </p>

              <p>
                Your registration for the
                <strong>
                  Study in Mauritius Higher Education Fair
                </strong>
                has been successfully received.
              </p>

              <p>
                <strong>Registration ID:</strong><br>
                ${registrationId}
              </p>

              <p>
                <strong>Programme:</strong><br>
                ${registration.program}
              </p>

              <p>
                Please keep this email and your QR code for
                registration/check-in at the event.
              </p>

              <div
                style="
                  text-align:center;
                  margin:30px 0;
                "
              >
                <img
                  src="cid:registrationqr"
                  alt="Registration QR Code"
                  style="
                    width:200px;
                    height:200px;
                  "
                />
              </div>

              <p>
                We look forward to seeing you at the event.
              </p>

              <p>
                Regards,<br>
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

        console.log(
          `📧 Confirmation email sent to ${normalizedEmail}`
        );

      } catch (emailError) {
        console.error(
          `⚠️ Registration saved, but confirmation email failed for ${normalizedEmail}`
        );

        console.error(emailError.message);
      }
    });

  } catch (error) {
    console.error("❌ Registration Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Registration failed.",
        error: error.message,
      });
    }
  }
};