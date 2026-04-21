/**
 * Template email + chat when OpenAI response generation is unavailable.
 */
function buildFallbackResponses({ tone, summary }) {
  const r = summary.result
  const type = summary.type || 'salary'
  const rangeText = r
    ? `a package in the ${r.finalRange.min}–${r.finalRange.max} band (same units as your simulation)`
    : 'the compensation band we aligned on'

  const openings = {
    formal: {
      subject: 'Next steps — offer terms',
      body: `Thank you for the productive discussion. I am writing to confirm interest in moving forward, subject to final documentation reflecting ${rangeText} and the review milestones we discussed.\n\nPlease share the revised offer letter at your earliest convenience so we can align on dates.\n\nKind regards`,
      chat: `Thanks again for the conversation. If the updated letter reflects ${rangeText} and the review timing we discussed, I am ready to proceed. Let me know when you can send it.`,
    },
    confident: {
      subject: 'Ready to finalize — offer alignment',
      body: `Thanks for working through the details with me. I am aligned to sign once the offer reflects ${rangeText} with the bonus/review items we captured verbally.\n\nIf you can send the updated terms today, I can return a signed copy quickly.\n\nBest`,
      chat: `This works for me if the letter matches ${rangeText} and what we agreed on reviews/bonus. Send the doc and I will sign today.`,
    },
    assertive: {
      subject: 'Offer — written confirmation needed',
      body: `We are close on terms. I will move forward when the written offer explicitly states ${rangeText} and the review clause we discussed.\n\nPlease confirm timeline to issue the revised letter so I can close other processes.\n\nRegards`,
      chat: `I need the updated offer in writing with ${rangeText} and the review/bonus terms spelled out. Once I have that, I can sign the same day.`,
    },
  }

  const pack = openings[tone] || openings.formal
  return {
    emailSubject: pack.subject,
    emailBody: pack.body,
    chatReply: pack.chat,
    tone,
  }
}

module.exports = { buildFallbackResponses }
