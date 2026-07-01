import React, { useMemo } from 'react'
import { lonevaxlingComparison, formatKr, LONEVAXLING_LONEGRANS } from '../calculations.js'
import InfoTip from './InfoTip.jsx'

function Stat({ label, value, accent, big }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div
        className={big ? 'text-2xl font-bold' : 'text-lg font-semibold'}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  )
}

export default function LonevaxlingPanel({ inputs }) {
  const c = useMemo(() => lonevaxlingComparison(inputs), [inputs])
  const amt = inputs.lonevaxlingMonthly ?? 0

  if (amt <= 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-gray-200">
          Löneväxling — lönar det sig?
          <InfoTip text="Jämför att löneväxla en del av bruttolönen till tjänstepension mot att i stället ta pengarna som lön (efter skatt) och spara i ISK." />
        </h3>
        <p className="mt-3 text-xs text-gray-500">
          Ingen löneväxling konfigurerad. Sätt ett belopp under <b>Löneväxling</b>{' '}
          i panelen till vänster för att se jämförelsen.
        </p>
      </div>
    )
  }

  const winner = c.diff >= 0
  const pct = (v) => `${(v * 100).toFixed(1)} %`

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-200">
          Löneväxling — lönar det sig?
          <InfoTip text="Du växlar bruttolön till tjänstepension (arbetsgivaren lägger på ca 5,8 %). Alternativet är att ta samma utrymme som lön, betala marginalskatt nu och spara nettot i ISK. Jämförs som nettokapital i dagens kronor vid uttagsstart." />
        </h3>
        <span className="text-xs text-gray-500">
          {formatKr(amt, { suffix: ' kr/mån' })} · {c.from}–{c.to} år · uttag{' '}
          {c.payoutStart}–{c.payoutStart + c.payoutYears - 1}
        </span>
      </div>

      {/* Lönegräns-varning */}
      {c.salaryAfter > 0 && (
        c.underLonegrans ? (
          <div className="mb-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
            ⚠ Lön efter växling {formatKr(c.salaryAfter, { suffix: ' kr/mån' })} ligger
            under gränsen ~{formatKr(LONEVAXLING_LONEGRANS, { suffix: ' kr/mån' })}{' '}
            (8,07 inkomstbasbelopp). Du riskerar att tappa allmän pension och
            sjukpenninggrundande inkomst — växla mindre.
          </div>
        ) : (
          <div className="mb-4 rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
            ✓ Lön efter växling {formatKr(c.salaryAfter, { suffix: ' kr/mån' })} ligger
            över gränsen ~{formatKr(LONEVAXLING_LONEGRANS, { suffix: ' kr/mån' })} — full
            allmän pension behålls.
          </div>
        )
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Löneväxling */}
        <div className={`rounded-lg border p-4 ${winner ? 'border-fire-orange/40 bg-fire-orange/5' : 'border-border bg-bg/40'}`}>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-fire-orange">
            Löneväxling till pension
          </div>
          <div className="space-y-3">
            <Stat label="Pott vid uttagsstart" value={formatKr(c.potAtPayout)} />
            <Stat
              label={`Extra pension ${c.payoutStart}–${c.payoutStart + c.payoutYears - 1}`}
              value={`${formatKr(c.annuityMonthly)}/mån`}
            />
            <Stat
              label="Netto efter skatt vid uttag"
              value={formatKr(c.pensionNet)}
              accent="#f97316"
            />
          </div>
        </div>

        {/* ISK-alternativet */}
        <div className={`rounded-lg border p-4 ${!winner ? 'border-fire-blue/40 bg-fire-blue/5' : 'border-border bg-bg/40'}`}>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-fire-blue">
            Spara i ISK i stället
          </div>
          <div className="space-y-3">
            <Stat
              label="Nettolön sparad (efter marginalskatt nu)"
              value={`${formatKr(amt * (1 - c.margNow), { suffix: ' kr/mån' })}`}
            />
            <Stat label="ISK-värde vid uttagsstart" value={formatKr(c.iskNet)} />
            <Stat
              label="Netto (ISK-uttag obeskattat)"
              value={formatKr(c.iskNet)}
              accent="#3b82f6"
            />
          </div>
        </div>
      </div>

      {/* Slutsats */}
      <div className="mt-4 rounded-lg border border-border bg-bg/40 p-4">
        <Stat
          label={winner ? 'Löneväxling vinner med' : 'ISK vinner med'}
          value={`${winner ? '+' : '−'}${formatKr(Math.abs(c.diff))}`}
          accent={winner ? '#f97316' : '#3b82f6'}
          big
        />
        <p className="mt-2 text-[11px] leading-snug text-gray-500">
          Marginalskatt nu: {pct(c.margNow)} {c.overStatlig ? '(inkl. statlig skatt)' : '(endast kommunal)'} ·
          marginalskatt vid uttag: {pct(c.margPension)}. Pensionspotten får
          arbetsgivarpåslag {pct(inputs.lonevaxlingPaslag ?? 0.058)} och lägre
          avkastningsskatt än ISK, men beskattas vid uttag. Jämförelsen är i dagens
          köpkraft och bortser från framtida regeländringar.
        </p>
      </div>
    </div>
  )
}
