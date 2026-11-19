import { useState } from 'react';
import { Fuel, Receipt, X } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import type { FuelOrder } from '../types/dezagamiz';

interface HistoryLedgerProps {
  orders: FuelOrder[];
  onGoToFuel: () => void;
}

export function HistoryLedger({ orders, onGoToFuel }: HistoryLedgerProps) {
  const {
    t,
    lang,
    formatMoney,
    fuelFullLabel,
    fuelUnit,
    localizeCity,
    localizeStationName,
    localizeAttendantName,
    localizeCarModel,
  } = useI18n();
  const [selectedOrder, setSelectedOrder] = useState<FuelOrder | null>(null);

  const completedOrders = orders.filter((o) => o.stage === 'completed');
  const totalSpent = completedOrders.reduce((acc, o) => acc + o.amountUzs, 0);
  const totalGasM3 = completedOrders
    .filter((o) => o.fuelCode === 'metan' || o.unit === 'м³')
    .reduce((acc, o) => acc + o.dispensedVolume, 0);

  const dateLocale =
    lang === 'en'
      ? 'en-GB'
      : lang === 'tr'
        ? 'tr-TR'
        : lang === 'uz'
          ? 'uz-UZ'
          : lang === 'kk'
            ? 'kk-KZ'
            : 'ru-RU';

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--dz-ink)] sm:text-3xl">
            {t.historyTitle}
          </h1>
          <p className="mt-1 text-sm text-[var(--dz-ink-secondary)]">
            {t.historySubtitle}
          </p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="dz-card-enter dz-stagger-1 dz-card-hover rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
          <div className="text-xs font-medium text-[var(--dz-ink-muted)]">
            {t.totalOrders}
          </div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-bold text-[var(--dz-ink)]">
            {completedOrders.length}
          </div>
        </div>
        <div className="dz-card-enter dz-stagger-2 dz-card-hover rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
          <div className="text-xs font-medium text-[var(--dz-ink-muted)]">
            {t.totalMethane}
          </div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-bold text-[var(--dz-primary)]">
            {totalGasM3.toFixed(2)} {t.unitM3}
          </div>
        </div>
        <div className="dz-card-enter dz-stagger-3 dz-card-hover rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5">
          <div className="text-xs font-medium text-[var(--dz-ink-muted)]">
            {t.totalPaid}
          </div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-bold text-[var(--dz-ink)]">
            {formatMoney(totalSpent)}
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]">
            <Receipt className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-[var(--dz-ink)]">
            {t.noOrdersTitle}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--dz-ink-secondary)]">
            {t.noOrdersSubtitle}
          </p>
          <button
            type="button"
            onClick={onGoToFuel}
            className="dz-focus mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--dz-primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--dz-primary-hover)]"
          >
            <Fuel className="h-4 w-4" aria-hidden="true" />
            <span>{t.goToFueling}</span>
          </button>
        </div>
      ) : (
        <div className="dz-section-enter dz-stagger-2 overflow-hidden rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] shadow-[var(--dz-shadow-sm)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] text-xs font-semibold text-[var(--dz-ink-secondary)]">
                  <th className="px-5 py-3.5">{t.historyColReceiptDate}</th>
                  <th className="px-5 py-3.5">{t.historyColStationBay}</th>
                  <th className="px-5 py-3.5">{t.historyColFuel}</th>
                  <th className="px-5 py-3.5 text-right">{t.historyColVolume}</th>
                  <th className="px-5 py-3.5 text-right">{t.historyColAmount}</th>
                  <th className="px-5 py-3.5">{t.historyColAttendant}</th>
                  <th className="px-5 py-3.5 text-right">{t.historyColAction}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--dz-border)]">
                {orders.map((order) => {
                  const dt = new Date(order.createdAt);
                  const dateLabel = dt.toLocaleDateString(dateLocale, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });
                  const unitLabel = fuelUnit(order.fuelCode);
                  return (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-[var(--dz-bg)]"
                    >
                      <td className="px-5 py-4">
                        <div className="font-mono-tabular text-xs font-bold text-[var(--dz-ink)]">
                          {order.receiptCode}
                        </div>
                        <div className="mt-0.5 font-mono-tabular text-xs text-[var(--dz-ink-muted)]">
                          {dateLabel}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[var(--dz-ink)]">
                          {localizeStationName(order.stationId, order.stationName)}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--dz-ink-muted)]">
                          {localizeCity(order.city)} · {t.bayShortLabel}
                          {order.bayNumber}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-[var(--dz-ink)]">
                        {fuelFullLabel(order.fuelCode)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono-tabular font-semibold text-[var(--dz-ink)]">
                        {order.dispensedVolume.toFixed(2)} {unitLabel}
                      </td>
                      <td className="px-5 py-4 text-right font-mono-tabular font-bold text-[var(--dz-primary)]">
                        <div>{formatMoney(order.amountUzs)}</div>
                        {order.cashbackUzs && order.cashbackUzs > 0 ? (
                          <div className="mt-0.5 text-[11px] font-semibold text-[var(--dz-success)]">
                            +{formatMoney(order.cashbackUzs)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--dz-ink-secondary)]">
                        {localizeAttendantName(order.attendant.id, order.attendant.name)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="dz-focus rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]"
                        >
                          {t.receiptBtn}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fiscal receipt modal */}
      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
          className="dz-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#092C63]/45 p-4 backdrop-blur-sm"
        >
          <div className="dz-modal-card w-full max-w-md rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--dz-border)] pb-4">
              <div>
                <div className="text-xs font-semibold text-[var(--dz-primary)]">
                  {t.receiptTitle}
                </div>
                <h2
                  id="receipt-modal-title"
                  className="mt-0.5 font-mono-tabular text-lg font-bold text-[var(--dz-ink)]"
                >
                  {selectedOrder.receiptCode}
                </h2>
              </div>
              <button
                type="button"
                aria-label={t.historyCloseReceiptAria}
                onClick={() => setSelectedOrder(null)}
                className="dz-focus flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--dz-border)] text-[var(--dz-ink-secondary)] hover:bg-[var(--dz-surface-subtle)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--dz-ink-secondary)]">{t.trackerDetailStation}</dt>
                <dd className="text-right font-semibold text-[var(--dz-ink)]">
                  {localizeStationName(selectedOrder.stationId, selectedOrder.stationName)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--dz-ink-secondary)]">{t.historyDetailCar}</dt>
                <dd className="font-mono-tabular font-semibold text-[var(--dz-ink)]">
                  {localizeCarModel(selectedOrder.carModel)} · {selectedOrder.plateNumber}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--dz-ink-secondary)]">{t.historyDetailBayFuel}</dt>
                <dd className="font-semibold text-[var(--dz-ink)]">
                  №{selectedOrder.bayNumber} · {fuelFullLabel(selectedOrder.fuelCode)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--dz-ink-secondary)]">{t.historyColVolume}</dt>
                <dd className="font-mono-tabular font-semibold text-[var(--dz-ink)]">
                  {selectedOrder.dispensedVolume.toFixed(2)} {fuelUnit(selectedOrder.fuelCode)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--dz-ink-secondary)]">{t.historyDetailAttendant}</dt>
                <dd className="font-medium text-[var(--dz-ink)]">
                  {localizeAttendantName(selectedOrder.attendant.id, selectedOrder.attendant.name)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--dz-ink-secondary)]">{t.historyDetailCardPay}</dt>
                <dd className="font-mono-tabular font-medium text-[var(--dz-ink)]">
                  {selectedOrder.cardNetwork} ·••• {selectedOrder.cardMasked.slice(-4)}
                </dd>
              </div>
              {selectedOrder.cashbackUzs && selectedOrder.cashbackUzs > 0 ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--dz-ink-secondary)]">{t.trackerDetailCashback}</dt>
                  <dd className="font-mono-tabular font-semibold text-[var(--dz-success)]">
                    +{formatMoney(selectedOrder.cashbackUzs)}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-t border-[var(--dz-border)] pt-3">
                <dt className="font-bold text-[var(--dz-ink)]">{t.historyDetailTotalCharged}</dt>
                <dd className="font-mono-tabular text-lg font-bold text-[var(--dz-primary)]">
                  {formatMoney(selectedOrder.amountUzs)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}
