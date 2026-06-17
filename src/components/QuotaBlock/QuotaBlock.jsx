import React from 'react';
import './index.scss';

export default function QuotaBlock({ currentQuotaBytes, maxQuotaBytes }) {
  // custom layout values formatter
  const formatMB = (bytes, forceDecimal = false) => {
    const mb = bytes / (1024 * 1024);
    const formatted = forceDecimal ? mb.toFixed(1) : mb.toFixed(1).replace('.0', '');
    return formatted.replace('.', ',');
  };

  const currentQuotaFormatted = formatMB(currentQuotaBytes, true);
  const maxQuotaFormatted = (maxQuotaBytes / (1024 * 1024)).toFixed(0);

  const percentage = Math.min((currentQuotaBytes / maxQuotaBytes) * 100, 100);
  const isOverfilled = currentQuotaBytes > maxQuotaBytes;
  const diffFormatted = formatMB(Math.abs(maxQuotaBytes - currentQuotaBytes));

  // status boundary indicators
  let barColorClass = 'green';
  if (percentage >= 100) {
    barColorClass = 'red';
  } else if (percentage >= 80) {
    barColorClass = 'orange';
  }

  return (
    <div className="quota-block">
      <div className="quota-info">
        <span className="quota-label">Общий объем вложений</span>
        <span className={`quota-value ${isOverfilled ? 'text-danger' : ''}`}>
          {currentQuotaFormatted} МБ из {maxQuotaFormatted} МБ
        </span>
      </div>

      <div className="quota-progress-bg">
        <div
          className={`quota-progress-bar ${barColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="quota-status-bottom">
        {isOverfilled ? (
          <span className="text-danger">Превышен на {diffFormatted} МБ</span>
        ) : (
          <span className="text-muted">Осталось: {diffFormatted} МБ</span>
        )}
      </div>
    </div>
  );
}
