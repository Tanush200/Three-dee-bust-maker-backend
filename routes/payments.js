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

const router = express.Router();

// Public routes
router.get("/plans", getPricingPlans);
router.post("/webhook", handleWebhook); // No auth for webhooks

// Protected routes
router.use(auth); // Apply auth middleware to all routes below

router.post("/create-intent", createPaymentIntent);
router.post("/buy-credits", buyCredits);
router.get("/history", getUserPayments);
router.get("/billing", getUserBilling);

module.exports = router;
