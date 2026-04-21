export function formatMoney(currency: string | undefined, amount: number): string {
  const c = (currency || 'INR').toUpperCase()
  if (c === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
  }
  if (c === 'USD') return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (c === 'EUR') return `€${amount.toLocaleString('de-DE', { maximumFractionDigits: 0 })}`
  return `${c} ${amount.toLocaleString()}`
}
