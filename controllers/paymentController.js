const paymentService = require("../services/paymentService");
const { pricingPlans, creditCosts } = require("../config/pricingPlans");
const { catchAsync, AppError } = require("../middleware/errorHandler");
const User = require("../models/User");
const Payment = require("../models/Payment");


// Get pricing plans
const getPricingPlans = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      plans: pricingPlans,
      creditCosts: creditCosts,
    },
  });
});

// Create payment intent
const createPaymentIntent = catchAsync(async (req, res) => {
  const { planType, billingInterval = "monthly" } = req.body;
  const userId = req.user.id;

  if (!planType || !pricingPlans[planType]) {
    return res.status(400).json({
      success: false,
      error: "Invalid plan type",
    });
  }

  if (!["monthly", "yearly"].includes(billingInterval)) {
    return res.status(400).json({
      success: false,
      error: "Invalid billing interval",
    });
  }

  const result = await paymentService.createPaymentIntent(
    userId,
    planType,
    billingInterval
  );

  res.status(201).json({
    success: true,
    message: "Payment intent created successfully",
    data: result,
  });
});

// Get user's payment history
const getUserPayments = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { limit = 10, page = 1 } = req.query;

  const payments = await Payment.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select("-webhookData"); // Don't expose sensitive webhook data

  const total = await Payment.countDocuments({ userId });

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        current: page * 1,
        total: Math.ceil(total / limit),
        count: payments.length,
        totalRecords: total,
      },
    },
  });
});

// Get user's billing info
const getUserBilling = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select(
      "credits totalCreditsEarned totalCreditsSpent subscriptionStatus currentSubscription"
    )
    .populate("currentSubscription");

  // Get current month usage
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyUsage = await Payment.aggregate([
    {
      $match: {
        userId: user._id,
        status: "completed",
        completedAt: { $gte: currentMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalCreditsSpent: { $sum: "$creditsAmount" },
        totalPayments: { $sum: 1 },
        totalSpent: { $sum: "$amount" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      user: {
        credits: user.credits,
        totalCreditsEarned: user.totalCreditsEarned,
        totalCreditsSpent: user.totalCreditsSpent,
        subscriptionStatus: user.subscriptionStatus,
        subscription: user.currentSubscription,
      },
      monthlyUsage: monthlyUsage[0] || {
        totalCreditsSpent: 0,
        totalPayments: 0,
        totalSpent: 0,
      },
    },
  });
});

// Process webhook
const handleWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["dodo-signature"];
  const payload = JSON.stringify(req.body);

  // Verify webhook signature
  if (!paymentService.verifyWebhookSignature(payload, signature)) {
    return res.status(400).json({
      success: false,
      error: "Invalid webhook signature",
    });
  }

  const { type, data } = req.body;

  console.log("📡 Webhook received:", type, data.id);

  try {
    switch (type) {
      case "payment_intent.succeeded":
        await paymentService.handleSuccessfulPayment(data.id);
        break;

      case "payment_intent.payment_failed":
        await paymentService.handleFailedPayment(
          data.id,
          data.last_payment_error?.message
        );
        break;

      default:
        console.log("🤷 Unhandled webhook type:", type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Webhook processing failed:", error);
    res.status(500).json({
      success: false,
      error: "Webhook processing failed",
    });
  }
});

// Buy credits directly (one-time purchase)
// const buyCredits = catchAsync(async (req, res) => {
//   const { amount, credits } = req.body;
//   const userId = req.user.id || req.user._id;
//     console.log("💳 Buy credits request:", {
//       userId: userId,
//       username: req.user.username,
//       amount: amount,
//       credits: credits,
//       hasUser: !!req.user,
//     });
//  if (!userId) {
//    return res.status(401).json({
//      success: false,
//      error: "User ID not found in request",
//    });
//  }

//   // Validate credit packages
//   const validPackages = {
//     25: { amount: 9.99, credits: 25 },
//     50: { amount: 19.99, credits: 50 },
//     100: { amount: 34.99, credits: 100 },
//     250: { amount: 79.99, credits: 250 },
//   };

//   const packageInfo = validPackages[credits];
//   if (!packageInfo || packageInfo.amount !== amount) {
//     return res.status(400).json({
//       success: false,
//       error: "Invalid credit package",
//     });
//   }

//   // Create payment intent for credits
//   const payment = new Payment({
//     userId: userId,
//     dodoPaymentId: "", // Will be updated
//     amount: amount,
//     currency: "USD",
//     creditsAmount: credits,
//     planType: "credits",
//     status: "pending",
//     metadata: {
//       planName: `${credits} Credits`,
//       originalPrice: amount,
//       paymentSource: "credit_purchase",
//     },
//   });

//   await payment.save();

//   // Create Dodo Payment Intent
//   const dodoResponse = await paymentService.createCreditPaymentIntent(
//     payment._id,
//     amount,
//     credits,
//     userId
//   );

//   payment.dodoPaymentId = dodoResponse.id;
//   await payment.save();

//   res.status(201).json({
//     success: true,
//     message: "Credit purchase initiated",
//     data: {
//       paymentId: payment._id,
//       checkoutUrl: dodoResponse.url,
//       sessionId: dodoResponse.id,
//       amount: amount,
//       credits: credits,
//     },
//   });
// });

const buyCredits = catchAsync(async (req, res) => {
  console.log("🎯 BuyCredits function called");
  console.log("📝 Request body:", req.body);
  console.log("👤 Request user:", req.user ? req.user.username : "No user");

  try {
    const { amount, credits } = req.body;
    const userId = req.user.id || req.user._id;

    console.log("💳 Processing buy credits:", {
      userId,
      amount,
      credits,
      userExists: !!req.user,
    });

    // ... rest of your function
  } catch (error) {
    console.error("❌ CRITICAL ERROR in buyCredits:", error);
    console.error("❌ Error stack:", error.stack);
    throw error; // This will be caught by catchAsync
  }
});


module.exports = {
  getPricingPlans,
  createPaymentIntent,
  getUserPayments,
  getUserBilling,
  handleWebhook,
  buyCredits,
};
