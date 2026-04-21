const mongoose = require('mongoose')
const { validationResult } = require('express-validator')
const Negotiation = require('../models/Negotiation')
const { runNegotiationSimulation } = require('../services/ai/negotiationEngine')
const { generateNextBestAction } = require('../services/ai/nextBestAction')
const { generateNegotiationResponse } = require('../services/responseGeneratorService')
const { AppError } = require('../utils/AppError')
const { success, fail } = require('../utils/apiResponse')

function buildSummaryFromNegotiation(doc) {
  const lastCand = [...doc.messages].reverse().find((m) => m.sender === 'candidate')
  const lastHr = [...doc.messages].reverse().find((m) => m.sender === 'hr')
  return {
    type: doc.type,
    currency: doc.currency,
    initialOffer: doc.initialOffer,
    targetValue: doc.targetValue,
    minimumAcceptable: doc.minimumAcceptable,
    strategy: doc.strategy,
    experienceLevel: doc.experienceLevel,
    result: doc.result,
    lastCandidateAmount: lastCand?.amount,
    lastHrAmount: lastHr?.amount,
    lastCandidateMessage: lastCand?.message,
    lastHrMessage: lastHr?.message,
  }
}

async function startNegotiation(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return fail(res, 'Validation failed', 422, errors.array())
    }

    const {
      type,
      currency,
      initialOffer,
      targetValue,
      minimumAcceptable,
      strategy,
      experienceLevel,
    } = req.body

    const { messages, result } = await runNegotiationSimulation({
      type,
      currency: currency || 'INR',
      initialOffer: Number(initialOffer),
      targetValue: Number(targetValue),
      minimumAcceptable: Number(minimumAcceptable),
      strategy,
      experienceLevel,
    })

    const candidateMoves = messages.filter((m) => m.sender === 'candidate')
    const hrMoves = messages.filter((m) => m.sender === 'hr')
    const nextBestAction = await generateNextBestAction({
      candidateTarget: Number(targetValue),
      hrInitialOffer: Number(initialOffer),
      candidateOpening: candidateMoves[0]?.amount ?? Number(targetValue),
      finalHROffer: hrMoves[hrMoves.length - 1]?.amount ?? Number(initialOffer),
      finalCandidateCounter: candidateMoves[candidateMoves.length - 1]?.amount ?? Number(targetValue),
      finalRange: result.finalRange,
      roundCount: Math.max(candidateMoves.length, hrMoves.length),
      strategyType: strategy,
      experienceLevel,
      messages,
    })

    const doc = await Negotiation.create({
      userId: req.userId,
      type,
      currency: (currency || 'INR').toUpperCase(),
      initialOffer: Number(initialOffer),
      targetValue: Number(targetValue),
      minimumAcceptable: Number(minimumAcceptable),
      strategy,
      experienceLevel,
      messages,
      result: {
        ...result,
        nextBestAction,
      },
    })

    return success(
      res,
      {
        negotiation: {
          id: doc._id,
          type: doc.type,
          currency: doc.currency,
          initialOffer: doc.initialOffer,
          targetValue: doc.targetValue,
          minimumAcceptable: doc.minimumAcceptable,
          strategy: doc.strategy,
          experienceLevel: doc.experienceLevel,
          messages: doc.messages,
          result: doc.result,
          createdAt: doc.createdAt,
        },
      },
      201,
    )
  } catch (e) {
    next(e)
  }
}

async function getHistory(req, res, next) {
  try {
    const list = await Negotiation.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select(
        'type currency initialOffer targetValue minimumAcceptable strategy experienceLevel result createdAt messages',
      )
      .lean()

    const shaped = list.map((n) => ({
      id: n._id,
      type: n.type,
      currency: n.currency,
      initialOffer: n.initialOffer,
      targetValue: n.targetValue,
      minimumAcceptable: n.minimumAcceptable,
      strategy: n.strategy,
      experienceLevel: n.experienceLevel,
      result: n.result,
      messageCount: n.messages?.length ?? 0,
      createdAt: n.createdAt,
    }))

    return success(res, { negotiations: shaped })
  } catch (e) {
    next(e)
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Invalid negotiation id', 400)
    }
    const doc = await Negotiation.findOne({ _id: id, userId: req.userId }).lean()
    if (!doc) {
      throw new AppError('Negotiation not found', 404)
    }
    return success(res, {
      negotiation: {
        id: doc._id,
        type: doc.type,
        currency: doc.currency,
        initialOffer: doc.initialOffer,
        targetValue: doc.targetValue,
        minimumAcceptable: doc.minimumAcceptable,
        strategy: doc.strategy,
        experienceLevel: doc.experienceLevel,
        messages: doc.messages,
        result: doc.result,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    })
  } catch (e) {
    next(e)
  }
}

async function generateResponse(req, res, next) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return fail(res, 'Validation failed', 422, errors.array())
    }

    const { tone, negotiationId, result: inlineResult } = req.body
    let summary

    if (negotiationId) {
      if (!mongoose.isValidObjectId(negotiationId)) {
        throw new AppError('Invalid negotiationId', 400)
      }
      const doc = await Negotiation.findOne({ _id: negotiationId, userId: req.userId })
      if (!doc) {
        throw new AppError('Negotiation not found', 404)
      }
      if (!doc.result) {
        throw new AppError('Negotiation has no result payload', 400)
      }
      summary = buildSummaryFromNegotiation(doc)
    } else {
      summary = {
        type: req.body.type || 'salary',
        currency: req.body.currency || 'INR',
        initialOffer: req.body.initialOffer,
        targetValue: req.body.targetValue,
        minimumAcceptable: req.body.minimumAcceptable,
        result: inlineResult,
      }
    }

    const out = await generateNegotiationResponse({ tone, summary })
    return success(res, { response: out })
  } catch (e) {
    next(e)
  }
}

module.exports = {
  startNegotiation,
  getHistory,
  getById,
  generateResponse,
}
