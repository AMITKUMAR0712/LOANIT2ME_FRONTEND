import dayjs from 'dayjs'

export function calculateFee(amount, dateBorrowed, paybackDate, lenderTerm){
  // lenderTerm contains feePer10Short and feePer10Long and maxPaybackDays
  const days = dayjs(paybackDate).diff(dayjs(dateBorrowed), 'day')
  const per10 = days <= 7 ? lenderTerm.feePer10Short : lenderTerm.feePer10Long
  const multiplier = Math.ceil(amount / 10)
  const fee = per10 * multiplier
  return { fee, total: amount + fee }
} 