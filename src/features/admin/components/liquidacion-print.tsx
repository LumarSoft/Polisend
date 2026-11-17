import type { SettlementAmounts, SettlementMonth } from '@/types/api/billing'
import { capitalized, monthLabel, settledTokensOf, shareLabel } from '../lib/settlement-format'
import { int, usd } from './billing-ui'

const COLUMNS: Array<[string, (amounts: SettlementAmounts) => string]> = [
  ['Tokens', a => int(settledTokensOf(a))],
  ['Facturado', a => usd(a.billedUsd)],
  ['Costo', a => usd(a.serviceCostUsd)],
  ['Remanente', a => usd(a.remainderUsd)],
  ['Plataforma', a => usd(a.ownerShareUsd)],
  ['Socio', a => usd(a.partnerShareUsd)],
]

/** The month's settlement on paper: plain tables, no colours, every number listed. */
export function SettlementPrint({ month }: { month: SettlementMonth }) {
  const status = month.live
    ? 'Mes en curso: cifras provisorias.'
    : month.closed
      ? `Mes cerrado el ${new Date(month.closedAt ?? '').toLocaleDateString('es-AR')}${month.backfilled ? ', con los planes de ese día' : ''}.`
      : 'Mes sin cerrar: calculado con el plan actual de cada número.'
  return (
    <div className="mx-auto w-full max-w-[760px] p-6 text-[11px]">
      <h1 className="text-[18px] font-semibold">Liquidación · {capitalized(monthLabel(month.period))}</h1>
      <p className="mt-1">
        {status} Costo de servicio: {usd(month.terms.costPerMessageUsd)} por mensaje consumido. Socio comercial:{' '}
        {shareLabel(month.terms.partnerShare)} del remanente.
      </p>

      <table className="mt-4 w-full border-collapse">
        <tbody>
          {(
            [
              ['Facturado', month.totals.billedUsd],
              ['Costo de servicio', month.totals.serviceCostUsd],
              ['Remanente', month.totals.remainderUsd],
              ['Parte plataforma', month.totals.ownerShareUsd],
              ['Parte socio comercial', month.totals.partnerShareUsd],
              ['Total plataforma', month.totals.ownerTotalUsd],
            ] as const
          ).map(([label, amount]) => (
            <tr key={label} className="border-b">
              <td className="py-1">{label}</td>
              <td className="py-1 text-right font-semibold">{usd(amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mt-5 w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-1">Organización / número</th>
            <th className="py-1">Plan</th>
            {COLUMNS.map(([label]) => (
              <th key={label} className="py-1 text-right">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {month.organizations.map(org => [
            <tr key={`org-${org.id}`} className="border-b font-semibold">
              <td className="py-1" colSpan={2}>
                {org.name}
              </td>
              {COLUMNS.map(([label, render]) => (
                <td key={label} className="py-1 text-right">
                  {render(org.totals)}
                </td>
              ))}
            </tr>,
            ...org.numbers.map(n => (
              <tr key={n.id} className="border-b">
                <td className="py-1 pl-3 font-mono">{n.number}</td>
                <td className="py-1">{n.plan.name}</td>
                {COLUMNS.map(([label, render]) => (
                  <td key={label} className="py-1 text-right">
                    {render(n)}
                  </td>
                ))}
              </tr>
            )),
          ])}
        </tbody>
      </table>
    </div>
  )
}
