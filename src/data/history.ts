export type NegotiationRecord = {
  id: string
  title: string
  type: 'Salary' | 'Freelance'
  outcome: 'Success' | 'Failed'
  date: string
  range: string
  improvement: string
}

export const MOCK_HISTORY: NegotiationRecord[] = [
  {
    id: '1',
    title: 'Product Designer — Series B startup',
    type: 'Salary',
    outcome: 'Success',
    date: '2026-04-10',
    range: '₹12.4L – ₹13.1L',
    improvement: '+8.2%',
  },
  {
    id: '2',
    title: 'React contract — 3 month engagement',
    type: 'Freelance',
    outcome: 'Success',
    date: '2026-04-06',
    range: '₹1,850/hr – ₹2,000/hr',
    improvement: '+12%',
  },
  {
    id: '3',
    title: 'Junior SDE — campus offer',
    type: 'Salary',
    outcome: 'Failed',
    date: '2026-03-28',
    range: '₹6.0L – ₹6.2L',
    improvement: '+2.1%',
  },
  {
    id: '4',
    title: 'Content retainer — agency',
    type: 'Freelance',
    outcome: 'Success',
    date: '2026-03-15',
    range: '₹45k – ₹52k / mo',
    improvement: '+15%',
  },
]
