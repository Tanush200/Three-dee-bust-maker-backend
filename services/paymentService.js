


const axios = require("axios");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const { pricingPlans } = require("../config/pricingPlans");

class PaymentService {
  constructor() {
    this.dodoApiUrl =
      process.env.DODO_ENVIRONMENT === "production"
        ? "https://api.dodopayments.com/v1"
        : "https://sandbox-api.dodopayments.com/v1";
    this.secretKey = process.env.DODO_SECRET_KEY;
    this.publishableKey = process.env.DODO_PUBLISHABLE_KEY;

    // ✅ FIX: Better mock mode detection
    // this.mockMode =
    //   !this.secretKey ||
    //   this.secretKey === "your_actual_dodo_secret_key_here" ||
    //   this.secretKey === "your_test_secret_key_here" ||
    //   this.secretKey === "mock_secret_key_for_testing" || // ✅ ADD THIS
    //   this.secretKey.includes("mock_") || // ✅ ADD THIS
    //   this.secretKey.includes("test_") || // ✅ ADD THIS
    //   process.env.NODE_ENV === "development"; // ✅ ADD THIS

    this.mockMode = true;

    console.log("🔍 PaymentService Debug:", {
      secretKey: this.secretKey,
      environment: process.env.DODO_ENVIRONMENT,
      nodeEnv: process.env.NODE_ENV,
      mockMode: this.mockMode,
    });

    if (this.mockMode) {
      console.log(
        "⚠️ MOCK MODE: Dodo Payments keys not configured - using fake payments"
      );
    } else {
      console.log("💳 LIVE MODE: Dodo Payments configured");
    }
  }

  // ✅ EXISTING METHOD - Create subscription payment intent
  // ✅ EXISTING METHOD - Create subscription payment intent
  async createPaymentIntent(userId, planType, billingInterval = "monthly") {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const plan = pricingPlans[planType];
      if (!plan) {
        throw new Error("Invalid plan type");
      }

      const amount = plan.price[billingInterval];
      const credits = plan.credits[billingInterval];

      // ✅ FIX: Set dodoPaymentId immediately for mock mode
      const mockPaymentId = this.mockMode
        ? `mock_sub_session_${Date.now()}`
        : "";

      // Create payment record in database
      const payment = new Payment({
        userId: userId,
        dodoPaymentId: mockPaymentId, // ✅ FIX: Set immediately for mock mode
        amount: amount,
        currency: "USD",
        creditsAmount: credits,
        planType: planType,
        status: "pending",
        metadata: {
          planName: plan.name,
          originalPrice: amount,
          billingInterval: billingInterval,
          paymentSource: "web_app",
        },
      });

      await payment.save();

      // ✅ MOCK MODE FOR SUBSCRIPTIONS
      if (this.mockMode) {
        console.log("🎭 MOCK: Creating fake subscription checkout session");

        // ✅ FIX: Don't update dodoPaymentId again, it's already set
        // payment.dodoPaymentId = `mock_sub_session_${payment._id}`;
        // await payment.save();

        const clientUrl =
          process.env.CLIENT_URL ||
          process.env.FRONTEND_URL ||
          "http://localhost:3000";

        return {
          success: true,
          paymentId: payment._id,
          sessionId: payment.dodoPaymentId, // ✅ Use existing dodoPaymentId
          checkoutUrl: `${clientUrl}/payment/success?session_id=${payment.dodoPaymentId}&payment_id=${payment._id}&type=subscription`,
          amount: amount,
          currency: "USD",
          plan: {
            type: planType,
            name: plan.name,
            credits: credits,
          },
        };
      }

      // ✅ REAL DODO API CALL (existing code)
      const dodoResponse = await axios.post(
        `${this.dodoApiUrl}/checkout/sessions`,
        {
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `3D Bust Maker - ${plan.name} Plan`,
                  description: plan.description,
                },
                unit_amount: Math.round(amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&payment_id=${payment._id}`,
          cancel_url: `${process.env.CLIENT_URL}/payment/cancel?payment_id=${payment._id}`,
          metadata: {
            userId: userId.toString(),
            paymentId: payment._id.toString(),
            planType: planType,
            billingInterval: billingInterval,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update payment with real Dodo session ID
      payment.dodoPaymentId = dodoResponse.data.id;
      await payment.save();

      console.log("✅ Payment session created:", {
        paymentId: payment._id,
        sessionId: dodoResponse.data.id,
        amount: amount,
        plan: planType,
      });

      return {
        success: true,
        paymentId: payment._id,
        sessionId: dodoResponse.data.id,
        checkoutUrl: dodoResponse.data.url,
        amount: amount,
        currency: "USD",
        plan: {
          type: planType,
          name: plan.name,
          credits: credits,
        },
      };
    } catch (error) {
      console.error("❌ Payment session creation failed:", error);
      throw new Error(
        `Payment session creation failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // ✅ UPDATED METHOD - Create credit payment intent with mock mode
  async createCreditPaymentIntent(paymentId, amount, credits, userId) {
    // ✅ MOCK MODE FOR CREDITS
    if (this.mockMode) {
      console.log("🎭 MOCK: Creating fake credit checkout session", {
        paymentId,
        amount,
        credits,
        userId,
      });

      const clientUrl =
        process.env.CLIENT_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:3000";

      console.log("🔗 Using client URL:", clientUrl);
      return {
        id: `mock_session_${paymentId}`,
        url: `${clientUrl}/payment/success?session_id=mock_session_${paymentId}&payment_id=${paymentId}&type=credits&credits=${credits}&amount=${amount}`,
        client_secret: "mock_client_secret",
      };
    }

    // ✅ REAL DODO API CALL
    try {
      const dodoResponse = await axios.post(
        `${this.dodoApiUrl}/checkout/sessions`,
        {
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `3D Bust Maker - ${credits} Credits`,
                  description: `Purchase ${credits} credits for 3D model generation`,
                },
                unit_amount: Math.round(amount * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentId}&type=credits`,
          cancel_url: `${process.env.CLIENT_URL}/payment/cancel?payment_id=${paymentId}&type=credits`,
          metadata: {
            userId: userId.toString(),
            paymentId: paymentId.toString(),
            planType: "credits",
            credits: credits.toString(),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Credit payment session created:", {
        paymentId: paymentId,
        sessionId: dodoResponse.data.id,
        amount: amount,
        credits: credits,
      });

      return {
        id: dodoResponse.data.id,
        url: dodoResponse.data.url,
        client_secret: dodoResponse.data.client_secret || null,
      };
    } catch (error) {
      console.error(
        "❌ Dodo API call failed:",
        error.response?.data || error.message
      );
      throw new Error(
        `Payment service error: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  // ✅ UPDATED METHOD - Handle successful payment (with mock mode)
  async handleSuccessfulPayment(dodoSessionId) {
    try {
      // Find payment by Dodo session ID
      const payment = await Payment.findOne({ dodoPaymentId: dodoSessionId });
      if (!payment) {
        throw new Error("Payment not found");
      }

      // ✅ MOCK MODE - Skip Dodo verification
      if (this.mockMode && dodoSessionId.includes("mock_session_")) {
        console.log("🎭 MOCK: Simulating successful payment verification");

        // Update payment status
        payment.status = "completed";
        payment.completedAt = new Date();
        await payment.save();

        // Get user and add credits
        const user = await User.findById(payment.userId);
        if (!user) {
          throw new Error("User not found");
        }

        // Add credits using new method
        await user.addCredits(payment.creditsAmount);

        console.log("✅ MOCK Payment processed successfully:", {
          userId: user._id,
          creditsAdded: payment.creditsAmount,
          totalCredits: user.credits,
          planType: payment.planType,
        });

        return {
          success: true,
          payment: payment,
          creditsAdded: payment.creditsAmount,
          totalCredits: user.credits,
        };
      }

      // ✅ REAL DODO VERIFICATION (your existing code)
      const sessionResponse = await axios.get(
        `${this.dodoApiUrl}/checkout/sessions/${dodoSessionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const session = sessionResponse.data;
      if (session.payment_status !== "paid") {
        throw new Error("Payment not completed");
      }

      // Update payment status
      payment.status = "completed";
      payment.completedAt = new Date();
      payment.webhookData = session;
      await payment.save();

      // Get user
      const user = await User.findById(payment.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Add credits to user using the new method
      await user.addCredits(payment.creditsAmount);

      // If this is a subscription payment, create/update subscription
      if (payment.planType !== "credits") {
        await this.handleSubscriptionActivation(user, payment);
      }

      console.log("✅ Payment processed successfully:", {
        userId: user._id,
        creditsAdded: payment.creditsAmount,
        totalCredits: user.credits,
        planType: payment.planType,
      });

      return {
        success: true,
        payment: payment,
        creditsAdded: payment.creditsAmount,
        totalCredits: user.credits,
      };
    } catch (error) {
      console.error("❌ Payment processing failed:", error);
      throw error;
    }
  }

  // ✅ REST OF YOUR EXISTING METHODS (unchanged)
  async handleSubscriptionActivation(user, payment) {
    try {
      const plan = pricingPlans[payment.planType];
      if (!plan) return;

      const billingInterval = payment.metadata.billingInterval || "monthly";

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date();
      if (billingInterval === "yearly") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Create subscription record
      const subscription = new Subscription({
        userId: user._id,
        dodoSubscriptionId: payment.dodoPaymentId,
        planType: payment.planType,
        status: "active",
        amount: payment.amount,
        currency: payment.currency,
        billingInterval: billingInterval,
        monthlyCredits: plan.credits[billingInterval],
        startDate: startDate,
        endDate: endDate,
        nextBillingDate: endDate,
        features: plan.features,
        metadata: {
          source: "dodo_payments",
          originalAmount: payment.amount,
        },
      });

      await subscription.save();

      // Update user subscription status using new methods
      await user.activateSubscription(subscription._id, payment.planType);

      console.log("✅ Subscription activated:", {
        subscriptionId: subscription._id,
        planType: payment.planType,
        userId: user._id,
      });

      return subscription;
    } catch (error) {
      console.error("❌ Subscription activation failed:", error);
      throw error;
    }
  }

  async handleFailedPayment(dodoSessionId, errorMessage) {
    try {
      const payment = await Payment.findOne({ dodoPaymentId: dodoSessionId });
      if (payment) {
        payment.status = "failed";
        payment.failedAt = new Date();
        payment.errorMessage = errorMessage;
        await payment.save();
      }

      console.log("❌ Payment failed:", {
        dodoSessionId,
        errorMessage,
      });
    } catch (error) {
      console.error("❌ Failed to handle payment failure:", error);
    }
  }

  verifyWebhookSignature(payload, signature) {
    if (!signature || !process.env.DODO_WEBHOOK_SECRET) {
      console.log("❌ Missing signature or webhook secret");
      return false;
    }

    try {
      const cleanSignature = signature
        .replace("sha256=", "")
        .replace("dodo-signature-", "");

      const computedSignature = crypto
        .createHmac("sha256", process.env.DODO_WEBHOOK_SECRET)
        .update(payload, "utf8")
        .digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(cleanSignature, "hex"),
        Buffer.from(computedSignature, "hex")
      );

      console.log(
        "🔐 Webhook signature verification:",
        isValid ? "✅ Valid" : "❌ Invalid"
      );
      return isValid;
    } catch (error) {
      console.error("❌ Webhook signature verification error:", error);
      return false;
    }
  }

  async getUserPayments(userId, limit = 10) {
    try {
      const payments = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "username email");

      return payments;
    } catch (error) {
      console.error("❌ Failed to get user payments:", error);
      throw error;
    }
  }

  async verifyPaymentSession(sessionId) {
    // ✅ MOCK MODE
    if (this.mockMode && sessionId.includes("mock_session_")) {
      console.log("🎭 MOCK: Simulating payment session verification");
      return {
        success: true,
        session: { payment_status: "paid", id: sessionId },
        paid: true,
      };
    }

    try {
      const response = await axios.get(
        `${this.dodoApiUrl}/checkout/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      return {
        success: true,
        session: response.data,
        paid: response.data.payment_status === "paid",
      };
    } catch (error) {
      console.error("❌ Session verification failed:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error("Subscription not found");
      }

      subscription.status = "cancelled";
      subscription.cancelledAt = new Date();
      await subscription.save();

      const user = await User.findById(subscription.userId);
      if (user) {
        await user.cancelSubscription();
      }

      console.log("✅ Subscription cancelled:", {
        subscriptionId: subscriptionId,
        userId: subscription.userId,
      });

      return {
        success: true,
        subscription: subscription,
      };
    } catch (error) {
      console.error("❌ Subscription cancellation failed:", error);
      throw error;
    }
  }

  async getUserSubscription(userId) {
    try {
      const subscription = await Subscription.findOne({
        userId: userId,
        status: { $in: ["active", "trial"] },
      });

      return subscription;
    } catch (error) {
      console.error("❌ Failed to get user subscription:", error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
