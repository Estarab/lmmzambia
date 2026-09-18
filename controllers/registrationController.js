// controllers/registrationController.js

const Registration = require("../models/Registration");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : true,

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // Prevent email connection problems from hanging requests
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Check SMTP in the background.
// This DOES NOT block server startup.
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP server ready");
  }
});

// =====================================================
// EMAIL VALIDATION
// =====================================================

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// =====================================================
// CREATE REGISTRATION
// =====================================================

exports.createRegistration = async (req, res) => {
  try {
    console.log("======================================");
    console.log("🚀 NEW REGISTRATION REQUEST");
    console.log("======================================");

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

    // -------------------------------------------------
    // Validate required fields
    // -------------------------------------------------

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
      console.log("❌ Missing required registration fields");

      return res.status(400).json({
        success: false,
        message: "Please complete all required fields.",
      });
    }

    // -------------------------------------------------
    // Normalize email
    // -------------------------------------------------

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // -------------------------------------------------
    // Check duplicate email
    // -------------------------------------------------

    const existing = await Registration.findOne({
      email: normalizedEmail,
    });

    if (existing) {
      console.log(
        `⚠️ Duplicate registration attempt: ${normalizedEmail}`
      );

      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    // -------------------------------------------------
    // Create unique registration ID
    // -------------------------------------------------

    const registrationId = uuidv4();

    // -------------------------------------------------
    // SAVE TO MONGODB
    // -------------------------------------------------

    const registration = await Registration.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      country: country.trim(),
      city: city.trim(),
      residence: residence.trim(),
      phone: phone.trim(),
      gender,
      program,
      registrationId,
    });

    console.log(
      `✅ Registration saved successfully: ${registrationId}`
    );

    // =================================================
    // IMPORTANT:
    // SEND RESPONSE IMMEDIATELY
    // =================================================

    res.status(201).json({
      success: true,

      message:
        "Registration successful. Your registration has been received.",

      emailSent: false,

      data: registration,
    });

    // =================================================
    // BACKGROUND QR + EMAIL
    // =================================================
    //
    // This runs AFTER the HTTP response has been sent.
    // Therefore a slow SMTP server cannot cause the
    // frontend registration request to timeout.
    //
    // =================================================

    setImmediate(async () => {
      try {
        console.log(
          `📧 Starting background confirmation for ${normalizedEmail}`
        );

        // -------------------------------------------------
        // QR CODE DATA
        // -------------------------------------------------

        const qrPayload = JSON.stringify({
          registrationId,
          firstName,
          lastName,
          email: normalizedEmail,
          program,
          event: "Study in Mauritius Higher Education Fair",
        });

        // -------------------------------------------------
        // Generate QR code
        // -------------------------------------------------

        const qrBuffer = await QRCode.toBuffer(qrPayload, {
          type: "png",
          width: 500,
          margin: 2,
        });

        console.log("✅ QR code generated");

        // -------------------------------------------------
        // Confirmation email
        // -------------------------------------------------

        const fromEmail =
          process.env.SMTP_FROM ||
          process.env.SMTP_USER;

        const mailOptions = {
          from: `"Study in Mauritius" <${fromEmail}>`,
          to: normalizedEmail,

          subject:
            "Registration Confirmation - Study in Mauritius Higher Education Fair",

          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Registration Confirmation</title>
            </head>

            <body style="
              margin:0;
              padding:0;
              background:#f4f7fb;
              font-family:Arial,Helvetica,sans-serif;
            ">

              <div style="
                max-width:650px;
                margin:30px auto;
                background:#ffffff;
                border-radius:12px;
                overflow:hidden;
                box-shadow:0 4px 20px rgba(0,0,0,0.08);
              ">

                <div style="
                  background:#0f3d91;
                  padding:30px;
                  text-align:center;
                  color:white;
                ">

                  <h1 style="
                    margin:0;
                    font-size:28px;
                  ">
                    Registration Successful
                  </h1>

                  <p style="
                    margin:10px 0 0;
                    font-size:16px;
                  ">
                    Study in Mauritius Higher Education Fair
                  </p>

                </div>

                <div style="padding:30px;">

                  <p style="font-size:17px;">
                    Dear <strong>${firstName} ${lastName}</strong>,
                  </p>

                  <p style="
                    font-size:16px;
                    line-height:1.6;
                    color:#444;
                  ">
                    Thank you for registering for the
                    <strong>
                      Study in Mauritius Higher Education Fair
                    </strong>.
                  </p>

                  <div style="
                    background:#f5f7fa;
                    border-radius:10px;
                    padding:20px;
                    margin:25px 0;
                  ">

                    <h3 style="
                      margin-top:0;
                      color:#0f3d91;
                    ">
                      Registration Details
                    </h3>

                    <p>
                      <strong>Registration ID:</strong>
                      ${registrationId}
                    </p>

                    <p>
                      <strong>Program / Location:</strong>
                      ${program}
                    </p>

                    <p>
                      <strong>Name:</strong>
                      ${firstName} ${lastName}
                    </p>

                    <p>
                      <strong>Email:</strong>
                      ${normalizedEmail}
                    </p>

                    <p>
                      <strong>Phone:</strong>
                      ${phone}
                    </p>

                  </div>

                  <p style="
                    font-size:16px;
                    line-height:1.6;
                    color:#444;
                  ">
                    Your registration has been successfully received.
                    Please keep this email for your records.
                  </p>

                  <p style="
                    font-size:16px;
                    line-height:1.6;
                    color:#444;
                  ">
                    Your registration QR code is attached to this email.
                  </p>

                  <div style="
                    text-align:center;
                    margin-top:30px;
                  ">

                    <p style="
                      color:#777;
                      font-size:14px;
                    ">
                      We look forward to seeing you at the event.
                    </p>

                  </div>

                </div>

                <div style="
                  background:#f5f5f5;
                  padding:20px;
                  text-align:center;
                  color:#777;
                  font-size:13px;
                ">

                  Study in Mauritius Higher Education Fair

                </div>

              </div>

            </body>
            </html>
          `,

          attachments: [
            {
              filename: `registration-${registrationId}.png`,
              content: qrBuffer,
              contentType: "image/png",
              cid: `registrationqr-${registrationId}`,
            },
          ],
        };

        await transporter.sendMail(mailOptions);

        console.log(
          `✅ Confirmation email sent to ${normalizedEmail}`
        );

      } catch (emailError) {
        // IMPORTANT:
        // Registration has already succeeded.
        // Email failure must NOT affect the registration.

        console.error(
          `❌ Background email/QR error for ${normalizedEmail}:`,
          emailError.message
        );
      }
    });

  } catch (error) {
    console.error("❌ Registration error:", error);

    // Handle duplicate key errors from MongoDB
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Registration could not be completed. Please try again.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
};

// =====================================================
// GET ALL REGISTRATIONS
// =====================================================
// Used by the admin dashboard
// GET /api/registrations
// =====================================================

exports.getAllRegistrations = async (req, res) => {
  try {
    console.log("📋 Fetching all registrations...");

    const registrations = await Registration.find({})
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });

  } catch (error) {
    console.error(
      "❌ Error fetching registrations:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch registrations.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
};

// =====================================================
// SEND BULK EMAIL
// =====================================================
// POST /api/registrations/send-bulk-email
//
// Expected body can contain:
//
// {
//   "subject": "Important Update",
//   "message": "Hello everyone..."
// }
//
// By default, this sends to ALL registered email addresses.
//
// You can also optionally provide:
//
// {
//   "subject": "...",
//   "message": "...",
//   "emails": ["one@email.com", "two@email.com"]
// }
//
// =====================================================

exports.sendBulkEmail = async (req, res) => {
  try {
    const {
      subject,
      message,
      emails,
    } = req.body;

    // -------------------------------------------------
    // Validate subject/message
    // -------------------------------------------------

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Email subject and message are required.",
      });
    }

    // -------------------------------------------------
    // Determine recipients
    // -------------------------------------------------

    let recipients = [];

    // If specific emails were supplied
    if (Array.isArray(emails) && emails.length > 0) {
      recipients = emails
        .filter((email) => isValidEmail(email))
        .map((email) => email.trim().toLowerCase());
    }

    // Otherwise get all registered users
    if (recipients.length === 0) {
      const registrations = await Registration.find(
        {},
        { email: 1 }
      );

      recipients = registrations
        .map((registration) => registration.email)
        .filter((email) => email && isValidEmail(email))
        .map((email) => email.trim().toLowerCase());
    }

    // Remove duplicates
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No valid email recipients found.",
      });
    }

    console.log(
      `📧 Preparing bulk email for ${recipients.length} recipients`
    );

    // -------------------------------------------------
    // Respond immediately
    // -------------------------------------------------

    res.status(202).json({
      success: true,
      message:
        "Bulk email sending has started in the background.",
      recipientCount: recipients.length,
    });

    // -------------------------------------------------
    // Send emails in background
    // -------------------------------------------------

    setImmediate(async () => {
      let sent = 0;
      let failed = 0;

      console.log(
        `📨 Starting bulk email process for ${recipients.length} recipients`
      );

      for (const recipient of recipients) {
        try {
          await transporter.sendMail({
            from: `"Study in Mauritius" <${
              process.env.SMTP_FROM || process.env.SMTP_USER
            }>`,
            to: recipient,
            subject: subject,

            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <title>${subject}</title>
              </head>

              <body style="
                margin:0;
                padding:0;
                background:#f4f7fb;
                font-family:Arial,Helvetica,sans-serif;
              ">

                <div style="
                  max-width:650px;
                  margin:30px auto;
                  background:white;
                  padding:30px;
                  border-radius:10px;
                ">

                  <h2 style="color:#0f3d91;">
                    ${subject}
                  </h2>

                  <div style="
                    font-size:16px;
                    line-height:1.7;
                    color:#444;
                  ">
                    ${message}
                  </div>

                  <hr style="
                    margin:30px 0;
                    border:none;
                    border-top:1px solid #eee;
                  ">

                  <p style="
                    color:#777;
                    font-size:13px;
                  ">
                    Study in Mauritius Higher Education Fair
                  </p>

                </div>

              </body>
              </html>
            `,
          });

          sent++;

          console.log(
            `✅ Bulk email sent: ${recipient}`
          );

        } catch (error) {
          failed++;

          console.error(
            `❌ Failed to send bulk email to ${recipient}:`,
            error.message
          );
        }
      }

      console.log(
        `📊 Bulk email completed. Sent: ${sent}, Failed: ${failed}`
      );
    });

  } catch (error) {
    console.error(
      "❌ Bulk email error:",
      error
    );

    // Only send a response if we haven't already sent one
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Unable to start bulk email process.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
};