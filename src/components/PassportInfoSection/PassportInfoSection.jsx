import React from 'react';
import './index.scss';

export default function PassportInfoSection({ formData, onChange }) {
  return (
    <div className="form-card">
      <div className="uploader-header">
        <h2>2. Паспортные данные</h2>
        <h1>Заполните паспортные данные гражданина РБ.</h1>
      </div>

      <div className="inputs-stack">
        <div className="inputs-row">
          <div className="input-block w-sm">
            <label htmlFor="passportSeries">Серия</label>
            <input
              type="text"
              id="passportSeries"
              name="passportSeries"
              required
              maxLength="2"
              placeholder="XX"
              value={formData.passportSeries}
              onChange={onChange}
            />
          </div>
          <div className="input-block w-md">
            <label htmlFor="passportNumber">Номер</label>
            <input
              type="text"
              id="passportNumber"
              name="passportNumber"
              required
              maxLength="7"
              placeholder="0000000"
              value={formData.passportNumber}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="input-block">
          <label htmlFor="passportIssuedBy">Кем выдан</label>
          <input
            type="text"
            id="passportIssuedBy"
            name="passportIssuedBy"
            required
            placeholder="Первомайский РОВД г. Витебска"
            value={formData.passportIssuedBy}
            onChange={onChange}
          />
        </div>

        <div className="input-block w-md">
          <label htmlFor="passportIssueDate">Когда выдан</label>
          <input
            type="date"
            id="passportIssueDate"
            name="passportIssueDate"
            required
            value={formData.passportIssueDate}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
}
