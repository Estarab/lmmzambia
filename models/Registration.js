const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    residence: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    program: {
      type: String,
      enum: ["Lusaka", "Harare"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Registration", RegistrationSchema);




// const mongoose = require("mongoose");

// const RegistrationSchema = new mongoose.Schema(
//   {
//     firstName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     lastName: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: true,
//       lowercase: true,
//       trim: true,
//     },
//     country: {
//       type: String,
//       required: true,
//     },
//     city: {
//       type: String,
//       required: true,
//     },
//     residence: {
//       type: String,
//       required: true,
//     },
//     phone: {
//       type: String,
//       required: true,
//     },
//     program: {
//       type: String,
//       enum: ["Lusaka", "Harare"],
//       required: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// module.exports = mongoose.model("Registration", RegistrationSchema);
