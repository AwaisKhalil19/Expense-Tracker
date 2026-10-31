import { formatMoney } from "../../utils/data";

export default function ChartTooltip({ active, payload, currency = "USD", t = (value) => value }) {
  if (!active || !payload?.length) return null;

  return <div className="chart-tooltip">
    <div className="chart-tooltip-rows">
      {payload.map((item, index) => <div className="chart-tooltip-row" key={`${item.name || item.dataKey}-${index}`}>
        <span className="chart-tooltip-name"><i style={{ backgroundColor: item.color || item.payload?.color || item.fill || "#7187e8" }}/>{t(item.name || item.dataKey)}</span>
        <strong>{formatMoney(item.value, currency)}</strong>
      </div>)}
    </div>
  </div>;
}
