import React from 'react';
import './index.scss';

export default function PersonalInfoSection({ formData, onChange }) {
  return (
    <div className="form-card">
      <div className="uploader-header">
        <h2>1. Анкета: Личные данные</h2>
        <h1>Введите контактную информацию заявителя для цифрового счета.</h1>
      </div>

      <div className="inputs-stack">
        <div className="input-block">
          <label htmlFor="fullName">ФИО полностью</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            required
            placeholder="Иванов Иван Иванович"
            value={formData.fullName}
            onChange={onChange}
          />
        </div>

        <div className="input-block">
          <label htmlFor="address">Адрес регистрации</label>
          <input
            type="text"
            id="address"
            name="address"
            required
            placeholder="г. Минск, ул. Ленина, д. 1"
            value={formData.address}
            onChange={onChange}
          />
        </div>

        <div className="input-block">
          <label htmlFor="phone">Номер телефона</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            placeholder="+375 (33) 333-33-33"
            value={formData.phone}
            onChange={onChange}
          />
        </div>
      </div>
    </div>
  );
}
