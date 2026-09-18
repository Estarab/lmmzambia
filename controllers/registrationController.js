const Registration = require("../models/Registration");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const { Resend } = require("resend");

// =====================================================
// RESEND EMAIL CONFIGURATION
// =====================================================

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.MAIL_FROM_EMAIL || "onboarding@resend.dev";

const FROM_NAME =
  process.env.MAIL_FROM_NAME || "Study in Mauritius";

// =====================================================
// EMAIL VALIDATION
// =====================================================

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// =====================================================
// SEND EMAIL USING RESEND
// =====================================================

const sendEmail = async ({
  to,
  subject,
  html,
  attachments = [],
}) => {
  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
      attachments,
    });

    if (result.error) {
      console.error("❌ Resend email error:", result.error);
      return {
        success: false,
        error: result.error,
      };
    }

    console.log("✅ Email sent successfully:", result.data);

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("❌ Resend exception:", error);

    return {
      success: false,
      error,
    };
  }
};

// =====================================================
// CREATE REGISTRATION
// =====================================================

const createRegistration = async (req, res) => {
  console.log("\n======================================");
  console.log("REGISTRATION REQUEST");
  console.log("======================================");

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

    // -------------------------------------------------
    // VALIDATION
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
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // -------------------------------------------------
    // CHECK DUPLICATE EMAIL
    // -------------------------------------------------

    const existing = await Registration.findOne({
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    // -------------------------------------------------
    // CREATE UNIQUE REGISTRATION ID
    // -------------------------------------------------

    const registrationId = uuidv4();

    // -------------------------------------------------
    // SAVE TO MONGODB
    // -------------------------------------------------

    const registration = await Registration.create({
      registrationId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      country: country.trim(),
      city: city.trim(),
      residence: residence.trim(),
      phone: phone.trim(),
      gender,
      program,
    });

    console.log(
      "✅ Registration saved successfully:",
      registrationId
    );

    // -------------------------------------------------
    // RESPOND IMMEDIATELY
    // -------------------------------------------------

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Your confirmation email will be sent shortly.",
      emailSent: false,
      data: registration,
    });

    // =================================================
    // BACKGROUND QR + EMAIL
    // =================================================

    setImmediate(async () => {
      try {
        console.log(
          "📧 Starting background confirmation for:",
          normalizedEmail
        );

        // ---------------------------------------------
        // GENERATE QR CODE
        // ---------------------------------------------

        const qrData = JSON.stringify({
          registrationId,
          name: `${firstName} ${lastName}`,
          email: normalizedEmail,
          program,
        });

        const qrBuffer = await QRCode.toBuffer(qrData, {
          type: "png",
          width: 500,
          margin: 2,
          errorCorrectionLevel: "H",
        });

        console.log("✅ QR code generated");

        // ---------------------------------------------
        // EMAIL HTML
        // ---------------------------------------------

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #333333;
    }

    .container {
      max-width: 650px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 3px 15px rgba(0,0,0,0.08);
    }

    .header {
      background: #0b4f71;
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-size: 26px;
    }

    .header p {
      margin: 8px 0 0;
      font-size: 15px;
    }

    .content {
      padding: 30px;
    }

    .success {
      background: #eaf7ee;
      border: 1px solid #b9e2c5;
      color: #216b35;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 25px;
    }

    .details {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .details td {
      padding: 12px 8px;
      border-bottom: 1px solid #eeeeee;
    }

    .label {
      font-weight: bold;
      width: 40%;
    }

    .qr {
      text-align: center;
      margin-top: 30px;
      padding-top: 25px;
      border-top: 1px solid #eeeeee;
    }

    .footer {
      background: #f7f7f7;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #777777;
    }
  </style>
</head>

<body>

  <div class="container">

    <div class="header">
      <h1>Study in Mauritius</h1>
      <p>Higher Education Fair</p>
    </div>

    <div class="content">

      <div class="success">
        <strong>Registration Successful!</strong><br />
        Your registration for the Study in Mauritius Higher Education Fair
        has been successfully received.
      </div>

      <p>
        Dear <strong>${firstName} ${lastName}</strong>,
      </p>

      <p>
        Thank you for registering for the Study in Mauritius Higher Education Fair.
        Please keep this email for your records.
      </p>

      <table class="details">

        <tr>
          <td class="label">Registration ID</td>
          <td>${registrationId}</td>
        </tr>

        <tr>
          <td class="label">Name</td>
          <td>${firstName} ${lastName}</td>
        </tr>

        <tr>
          <td class="label">Email</td>
          <td>${normalizedEmail}</td>
        </tr>

        <tr>
          <td class="label">Phone</td>
          <td>${phone}</td>
        </tr>

        <tr>
          <td class="label">Country</td>
          <td>${country}</td>
        </tr>

        <tr>
          <td class="label">City</td>
          <td>${city}</td>
        </tr>

        <tr>
          <td class="label">Residence</td>
          <td>${residence}</td>
        </tr>

        <tr>
          <td class="label">Gender</td>
          <td>${gender}</td>
        </tr>

        <tr>
          <td class="label">Program</td>
          <td>${program}</td>
        </tr>

      </table>

      <div class="qr">

        <h3>Your Registration QR Code</h3>

        <p>
          Please keep the attached QR code. It may be used
          for registration verification at the event.
        </p>

        <p>
          <strong>Your QR code is attached to this email.</strong>
        </p>

      </div>

      <p>
        We look forward to seeing you at the Study in Mauritius
        Higher Education Fair.
      </p>

      <p>
        Regards,<br />
        <strong>Study in Mauritius Team</strong>
      </p>

    </div>

    <div class="footer">
      Study in Mauritius Higher Education Fair
    </div>

  </div>

</body>
</html>
`;

        // ---------------------------------------------
        // SEND EMAIL THROUGH RESEND
        // ---------------------------------------------

        const emailResult = await sendEmail({
          to: normalizedEmail,
          subject:
            "Registration Confirmation - Study in Mauritius Higher Education Fair",
          html,
          attachments: [
            {
              filename: `registration-${registrationId}.png`,
              content: qrBuffer.toString("base64"),
            },
          ],
        });

        if (emailResult.success) {
          console.log(
            "✅ Confirmation email sent to:",
            normalizedEmail
          );

          console.log(
            "📨 Resend email ID:",
            emailResult.data?.id
          );
        } else {
          console.error(
            "❌ Confirmation email failed for:",
            normalizedEmail
          );

          console.error(emailResult.error);
        }

      } catch (error) {
        console.error(
          "❌ Background QR/email error for",
          normalizedEmail,
          ":",
          error.message
        );
      }
    });

  } catch (error) {
    console.error("❌ Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration could not be completed.",
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

const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: registrations,
    });

  } catch (error) {
    console.error(
      "❌ Error fetching registrations:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch registrations.",
    });
  }
};

// =====================================================
// SEND BULK EMAIL
// =====================================================

const sendBulkEmail = async (req, res) => {
  try {
    const {
      subject,
      message,
      emails,
    } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
      });
    }

    // -------------------------------------------------
    // USE PROVIDED EMAILS OR ALL REGISTERED USERS
    // -------------------------------------------------

    let recipients = [];

    if (Array.isArray(emails) && emails.length > 0) {
      recipients = emails
        .filter(Boolean)
        .map((email) => email.trim().toLowerCase());
    } else {
      const registrations = await Registration.find(
        {},
        { email: 1 }
      );

      recipients = registrations
        .map((registration) => registration.email)
        .filter(Boolean)
        .map((email) => email.trim().toLowerCase());
    }

    // Remove duplicate emails
    recipients = [...new Set(recipients)];

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid recipients found.",
      });
    }

    console.log(
      `📧 Preparing bulk email for ${recipients.length} recipients`
    );

    // -------------------------------------------------
    // RESPOND IMMEDIATELY
    // -------------------------------------------------

    res.status(202).json({
      success: true,
      message: `Bulk email started for ${recipients.length} recipients.`,
      recipients: recipients.length,
    });

    // -------------------------------------------------
    // SEND IN BACKGROUND
    // -------------------------------------------------

    setImmediate(async () => {
      let successful = 0;
      let failed = 0;

      for (const recipient of recipients) {
        try {
          const result = await sendEmail({
            to: recipient,
            subject,
            html: `
              <div style="
                font-family: Arial, Helvetica, sans-serif;
                max-width: 650px;
                margin: 0 auto;
                padding: 30px;
              ">

                <h2>Study in Mauritius</h2>

                <div>
                  ${message}
                </div>

                <br />

                <p>
                  Regards,<br />
                  <strong>Study in Mauritius Team</strong>
                </p>

              </div>
            `,
          });

          if (result.success) {
            successful++;

            console.log(
              `✅ Bulk email sent to ${recipient}`
            );
          } else {
            failed++;

            console.error(
              `❌ Bulk email failed for ${recipient}`
            );
          }

        } catch (error) {
          failed++;

          console.error(
            `❌ Bulk email exception for ${recipient}:`,
            error.message
          );
        }
      }

      console.log("\n======================================");
      console.log("BULK EMAIL COMPLETED");
      console.log("======================================");
      console.log("Total:", recipients.length);
      console.log("Successful:", successful);
      console.log("Failed:", failed);
      console.log("======================================\n");
    });

  } catch (error) {
    console.error(
      "❌ Bulk email error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to start bulk email.",
    });
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
  createRegistration,
  getAllRegistrations,
  sendBulkEmail,
};