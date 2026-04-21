const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      enum: ['candidate', 'hr'],
    },
    amount: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 8000,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

const resultSchema = new mongoose.Schema(
  {
    bestCase: { type: Number, required: true },
    worstCase: { type: Number, required: true },
    average: { type: Number, required: true },
    finalRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    riskLevel: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high'],
    },
    nextBestAction: {
      type: {
        options: [
          {
            title: { type: String, required: true },
            description: { type: String, required: true },
            riskLevel: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
            potentialGain: { type: String, required: false },
            successProbability: { type: String, required: false, enum: ['Low', 'Medium', 'High'] },
          },
        ],
        recommendedOption: { type: String, required: true },
      },
      required: false,
      _id: false,
    },
  },
  { _id: false },
)

const negotiationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['salary', 'freelance'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    initialOffer: { type: Number, required: true },
    targetValue: { type: Number, required: true },
    minimumAcceptable: { type: Number, required: true },
    strategy: {
      type: String,
      required: true,
      enum: ['aggressive', 'balanced', 'conservative'],
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: ['fresher', 'junior', 'mid'],
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    result: {
      type: resultSchema,
      required: false,
    },
  },
  { timestamps: true },
)

negotiationSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Negotiation', negotiationSchema)
