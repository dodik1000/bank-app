import React from "react";
import { supabase } from "../../supabaseClient";
import successIcon from "../../assets/imgs/icon-success.png";
import "./sass/index.scss";

export default function Profile({ profile, onBack }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-page-container">
        <header className="profile-page-header">
          <h2>Личный кабинет</h2>
        </header>

        <main className="profile-page-info">
          <div className="profile-info-group">
            <span className="info-group-title">1. Личные данные</span>
            <div className="info-item-row">
              <span className="item-label">ФИО полностью</span>
              <span className="item-value">{profile?.full_name}</span>
            </div>
            <div className="info-item-row">
              <span className="item-label">Номер телефона</span>
              <span className="item-value">{profile?.phone}</span>
            </div>
            <div className="info-item-row">
              <span className="item-label">Адрес регистрации</span>
              <span className="item-value">{profile?.address}</span>
            </div>
          </div>

          <div className="profile-info-group">
            <span className="info-group-title">2. Статус аккаунта</span>
            <div className="verification-status-badge">
              <img
                src={successIcon}
                alt="Success"
                className="badge-status-img"
              />
              <div className="badge-status-text">
                <span className="status-title">Личность верифицирована</span>
                <span className="status-subtitle">
                  Паспортные данные проверены службой безопасности
                </span>
              </div>
            </div>
          </div>
        </main>

        <footer className="profile-page-footer">
          <button
            onClick={onBack}
            className="btn-pill btn-secondary btn-profile-back"
          >
            Назад на главную
          </button>
          <button onClick={handleLogout} className="btn-logout-danger">
            Выйти из аккаунта
          </button>
        </footer>
      </div>
    </div>
  );
}
