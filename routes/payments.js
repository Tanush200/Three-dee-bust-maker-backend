// const express = require("express");
// const {
//   getPricingPlans,
//   createPaymentIntent,
//   getUserPayments,
//   getUserBilling,
//   handleWebhook,
//   buyCredits,
// } = require("../controllers/paymentController");
// const { auth } = require("../middleware/auth");

// const router = express.Router();

// // Public routes
// router.get("/plans", getPricingPlans);
// router.post("/webhook", handleWebhook); // No auth for webhooks

// // Protected routes
// router.use(auth); // Apply auth middleware to all routes below

// router.post("/create-intent", createPaymentIntent);
// router.post("/buy-credits", buyCredits);
// router.get("/history", getUserPayments);
// router.get("/billing", getUserBilling);

// router.post("/verify-session", async (req, res) => {
//   try {
//     const { sessionId } = req.body;

//     console.log("🔍 Verifying payment session:", sessionId);

//     // Use PaymentService to handle the verification (includes mock mode)
//     const result = await paymentService.handleSuccessfulPayment(sessionId);

//     res.status(200).json({
//       success: true,
//       message: "Payment verified and processed",
//       data: result,
//     });
//   } catch (error) {
//     console.error("❌ Payment verification failed:", error);
//     res.status(400).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });


// module.exports = router;



const express = require("express");
const {
  getPricingPlans,
  createPaymentIntent,
  getUserPayments,
  getUserBilling,
  handleWebhook,
  buyCredits,
} = require("../controllers/paymentController");
const { auth } = require("../middleware/auth");

// ✅ FIX: Import PaymentService
const paymentService = require("../services/paymentService");

const router = express.Router();

// Public routes
router.get("/plans", getPricingPlans);
router.post("/webhook", handleWebhook);

// Protected routes
router.use(auth);

router.post("/create-intent", createPaymentIntent);
router.post("/buy-credits", buyCredits);
router.get("/history", getUserPayments);
router.get("/billing", getUserBilling);

// ✅ FIX: Add the missing verify-session route
router.post("/verify-session", async (req, res) => {
  try {
    const { sessionId } = req.body;

    console.log("🔍 Verifying payment session:", sessionId);

    const result = await paymentService.handleSuccessfulPayment(sessionId);

    res.status(200).json({
      success: true,
      message: "Payment verified and processed",
      data: result,
    });
  } catch (error) {
    console.error("❌ Payment verification failed:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
