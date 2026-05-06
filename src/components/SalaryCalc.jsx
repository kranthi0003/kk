import React, { useState, useEffect, useMemo } from 'react'

// FY 2025-26 India Tax Slabs
function calcOldRegimeTax(taxableIncome) {
  // Old regime slabs (with standard deduction of 50k)
  if (taxableIncome <= 250000) return 0
  let tax = 0
  if (taxableIncome > 250000) tax += Math.min(taxableIncome - 250000, 250000) * 0.05
  if (taxableIncome > 500000) tax += Math.min(taxableIncome - 500000, 500000) * 0.20
  if (taxableIncome > 1000000) tax += (taxableIncome - 1000000) * 0.30
  // 87A rebate: if taxable income <= 5L, tax = 0
  if (taxableIncome <= 500000) tax = 0
  return tax
}

function calcNewRegimeTax(taxableIncome) {
  // New regime FY 2025-26 slabs
  if (taxableIncome <= 400000) return 0
  let tax = 0
  if (taxableIncome > 400000) tax += Math.min(taxableIncome - 400000, 400000) * 0.05
  if (taxableIncome > 800000) tax += Math.min(taxableIncome - 800000, 400000) * 0.10
  if (taxableIncome > 1200000) tax += Math.min(taxableIncome - 1200000, 400000) * 0.15
  if (taxableIncome > 1600000) tax += Math.min(taxableIncome - 1600000, 400000) * 0.20
  if (taxableIncome > 2000000) tax += Math.min(taxableIncome - 2000000, 400000) * 0.25
  if (taxableIncome > 2400000) tax += (taxableIncome - 2400000) * 0.30
  // 87A rebate: if taxable income <= 12L, tax = 0 (new regime 2025-26)
  if (taxableIncome <= 1200000) tax = 0
  return tax
}

function addCess(tax) {
  return tax + tax * 0.04 // 4% health & education cess
}

function formatINR(n) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function formatINRFull(n) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export default function SalaryCalc() {
  const [open, setOpen] = useState(false)
  const [ctc, setCtc] = useState('')
  const [includeHRA, setIncludeHRA] = useState(false)
  const [hraExempt, setHraExempt] = useState(200000)
  const [section80C, setSection80C] = useState(150000)
  const [nps80CCD, setNps80CCD] = useState(50000)
  const [otherDeductions, setOtherDeductions] = useState(0)

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-salary-calc', handler)
    return () => window.removeEventListener('toggle-salary-calc', handler)
  }, [])

  const result = useMemo(() => {
    const annual = parseFloat(ctc) * (ctc.includes('.') ? 100000 : 1)
    if (!annual || annual < 0) return null

    const stdDeduction = 75000 // FY 2025-26 standard deduction
    const epfEmployee = Math.min(annual * 0.12, 1800 * 12) // 12% of basic, capped
    const basicPay = annual * 0.40 // typical 40% of CTC
    const epfEmployer = Math.min(basicPay * 0.12, 1800 * 12)
    const gratuity = basicPay * 0.0481
    const professionalTax = 2400 // Karnataka/AP standard

    // Gross salary (CTC - employer EPF - gratuity)
    const grossSalary = annual - epfEmployer - gratuity

    // OLD REGIME
    const oldDeductions = stdDeduction + section80C + nps80CCD + otherDeductions + (includeHRA ? hraExempt : 0)
    const oldTaxableIncome = Math.max(grossSalary - oldDeductions, 0)
    const oldTax = addCess(calcOldRegimeTax(oldTaxableIncome))

    // NEW REGIME
    const newTaxableIncome = Math.max(grossSalary - stdDeduction, 0) // Only std deduction in new regime
    const newTax = addCess(calcNewRegimeTax(newTaxableIncome))

    // Monthly calculations
    const oldMonthlyTax = oldTax / 12
    const newMonthlyTax = newTax / 12
    const monthlyEPF = epfEmployee / 12
    const monthlyPT = professionalTax / 12

    const oldTakeHome = (grossSalary - oldTax - epfEmployee - professionalTax) / 12
    const newTakeHome = (grossSalary - newTax - epfEmployee - professionalTax) / 12

    const betterRegime = oldTax < newTax ? 'old' : 'new'
    const savings = Math.abs(oldTax - newTax)

    return {
      annual,
      basicPay,
      grossSalary,
      epfEmployee,
      epfEmployer,
      gratuity,
      professionalTax,
      oldTaxableIncome,
      oldTax,
      oldTakeHome,
      oldMonthlyTax,
      newTaxableIncome,
      newTax,
      newTakeHome,
      newMonthlyTax,
      monthlyEPF,
      monthlyPT,
      betterRegime,
      savings,
      effectiveOldRate: ((oldTax / annual) * 100).toFixed(1),
      effectiveNewRate: ((newTax / annual) * 100).toFixed(1),
    }
  }, [ctc, includeHRA, hraExempt, section80C, nps80CCD, otherDeductions])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed top-[3%] left-1/2 -translate-x-1/2 z-[151] w-[540px] max-w-[calc(100vw-2rem)] max-h-[94vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        style={{ background: 'rgba(18,18,24,0.95)', animation: 'salary-in 0.25s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white text-base font-semibold">💰 Salary Calculator</h2>
            <p className="text-[11px] text-white/30 mt-0.5">India FY 2025-26 · Old vs New Tax Regime</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-b border-white/5 flex-shrink-0 space-y-3">
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Annual CTC (₹)</label>
            <input
              value={ctc}
              onChange={e => setCtc(e.target.value)}
              placeholder="e.g. 2500000 or 25 (in lakhs with decimal)"
              className="w-full mt-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder:text-white/20 outline-none focus:border-white/20"
            />
            <div className="flex gap-1.5 mt-2">
              {['10', '15', '20', '25', '30', '40', '50', '75'].map(v => (
                <button key={v} onClick={() => setCtc((parseFloat(v) * 100000).toString())}
                  className={`px-2 py-0.5 rounded text-[10px] ${ctc === (parseFloat(v)*100000).toString() ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>
                  {v}L
                </button>
              ))}
            </div>
          </div>

          {/* Old regime deductions */}
          <details className="group">
            <summary className="text-[11px] text-white/40 cursor-pointer hover:text-white/60 flex items-center gap-1">
              <svg className="w-3 h-3 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              Old Regime Deductions (optional)
            </summary>
            <div className="mt-2 space-y-2 pl-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={includeHRA} onChange={e => setIncludeHRA(e.target.checked)} className="rounded" />
                <label className="text-[11px] text-white/40">HRA Exemption</label>
                {includeHRA && <input value={hraExempt} onChange={e => setHraExempt(Number(e.target.value))} className="w-24 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-[11px] font-mono" />}
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-white/40">80C (PF, ELSS, etc.)</label>
                <input value={section80C} onChange={e => setSection80C(Number(e.target.value))} className="w-24 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-[11px] font-mono" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-white/40">80CCD(1B) NPS</label>
                <input value={nps80CCD} onChange={e => setNps80CCD(Number(e.target.value))} className="w-24 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-[11px] font-mono" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-white/40">Other (80D, HRA, etc.)</label>
                <input value={otherDeductions} onChange={e => setOtherDeductions(Number(e.target.value))} className="w-24 px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-[11px] font-mono" />
              </div>
            </div>
          </details>
        </div>

        {/* Results */}
        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {!result ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-4xl">💸</span>
              <p className="text-sm text-white/20">Enter your CTC to see the breakdown</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recommendation banner */}
              <div className={`rounded-xl p-3 text-center border ${result.betterRegime === 'new' ? 'bg-green-500/10 border-green-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                <p className={`text-sm font-semibold ${result.betterRegime === 'new' ? 'text-green-400' : 'text-blue-400'}`}>
                  ✅ {result.betterRegime === 'new' ? 'New' : 'Old'} Regime saves you {formatINR(result.savings)}/year
                </p>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-2 gap-3">
                <RegimeCard
                  title="Old Regime"
                  recommended={result.betterRegime === 'old'}
                  tax={result.oldTax}
                  takeHome={result.oldTakeHome}
                  taxable={result.oldTaxableIncome}
                  effectiveRate={result.effectiveOldRate}
                  monthlyTax={result.oldMonthlyTax}
                />
                <RegimeCard
                  title="New Regime"
                  recommended={result.betterRegime === 'new'}
                  tax={result.newTax}
                  takeHome={result.newTakeHome}
                  taxable={result.newTaxableIncome}
                  effectiveRate={result.effectiveNewRate}
                  monthlyTax={result.newMonthlyTax}
                />
              </div>

              {/* Monthly breakdown */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider mb-3">Monthly Breakdown ({result.betterRegime === 'new' ? 'New' : 'Old'} Regime)</p>
                <div className="space-y-2">
                  <BreakdownRow label="Gross Salary" value={result.grossSalary / 12} />
                  <BreakdownRow label="EPF (Employee)" value={-result.monthlyEPF} negative />
                  <BreakdownRow label="Professional Tax" value={-result.monthlyPT} negative />
                  <BreakdownRow label="Income Tax (TDS)" value={-(result.betterRegime === 'new' ? result.newMonthlyTax : result.oldMonthlyTax)} negative />
                  <div className="border-t border-white/10 pt-2 mt-2">
                    <BreakdownRow label="In-Hand (Monthly)" value={result.betterRegime === 'new' ? result.newTakeHome : result.oldTakeHome} highlight />
                  </div>
                </div>
              </div>

              {/* CTC Breakdown */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider mb-3">CTC Components</p>
                <div className="space-y-2">
                  <BreakdownRow label="Basic Pay (40%)" value={result.basicPay} />
                  <BreakdownRow label="EPF (Employer)" value={result.epfEmployer} />
                  <BreakdownRow label="Gratuity" value={result.gratuity} />
                  <BreakdownRow label="Other Allowances" value={result.annual - result.basicPay - result.epfEmployer - result.gratuity} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-white/5 text-center flex-shrink-0">
          <span className="text-[10px] text-white/20">FY 2025-26 slabs · Standard deduction ₹75,000 · 4% cess · Estimates only</span>
        </div>
      </div>

      <style>{`
        @keyframes salary-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}

function RegimeCard({ title, recommended, tax, takeHome, taxable, effectiveRate, monthlyTax }) {
  return (
    <div className={`rounded-xl p-3 border ${recommended ? 'border-green-500/30 bg-green-500/5' : 'border-white/5 bg-white/[0.02]'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-white/50 font-semibold">{title}</p>
        {recommended && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-semibold">BETTER</span>}
      </div>
      <p className="text-xl font-bold text-white font-mono">{formatINR(takeHome)}</p>
      <p className="text-[10px] text-white/30">per month in-hand</p>
      <div className="mt-2 space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-white/30">Annual Tax</span><span className="text-red-400 font-mono">{formatINRFull(tax)}</span></div>
        <div className="flex justify-between"><span className="text-white/30">Effective Rate</span><span className="text-white/60 font-mono">{effectiveRate}%</span></div>
        <div className="flex justify-between"><span className="text-white/30">Monthly TDS</span><span className="text-white/60 font-mono">{formatINRFull(monthlyTax)}</span></div>
      </div>
    </div>
  )
}

function BreakdownRow({ label, value, negative, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[11px] ${highlight ? 'text-white font-semibold' : 'text-white/40'}`}>{label}</span>
      <span className={`text-[12px] font-mono ${highlight ? 'text-green-400 font-bold' : negative ? 'text-red-400/70' : 'text-white/60'}`}>
        {negative ? '−' : ''}{formatINRFull(Math.abs(value))}
      </span>
    </div>
  )
}
