const mongoose  = require('mongoose')

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Dodo Payments Fields
    dodoPaymentId: {
      type: String,
      required: true,
      unique: true,
    },

    dodoCustomerId: {
      type: String,
      required: false,
    },

    // Payment Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      required: true,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "INR"],
    },

    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "completed", "failed", "refunded"],
      default: "pending",
    },

    // Credits
    creditsAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    planType: {
      type: String,
      required: true,
      enum: ["starter", "pro", "premium", "enterprise",'credits'],
    },

    // Payment Method
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet"],
      required: false,
    },

    // Metadata
    metadata: {
      planName: String,
      originalPrice: Number,
      discount: Number,
      paymentSource: String,
    },

    // Timestamps for payment lifecycle
    initiatedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    // Error tracking
    errorMessage: {
      type: String,
      default: null,
    },

    // Webhook data
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ dodoPaymentId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ planType: 1 });


PaymentSchema.virtual("formattedAmount").get(function () {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

module.exports = mongoose.model("Payment", PaymentSchema);