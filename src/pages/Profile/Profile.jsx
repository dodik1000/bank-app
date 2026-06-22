import React from "react";
import { supabase } from "../../supabaseClient";
import successIcon from "../../assets/imgs/icon-success.png";
import errorIcon from "../../assets/imgs/icon-error.png";
import "./sass/index.scss";

export default function Profile({ profile, onBack, onNavigate }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Determine user identity confirmation level by checking database fields
  const isVerified = !!profile?.passport_number;

  return (
    <div className="profile-page-wrapper">
      <div className="profile-page-container">
        {/* Breadcrumbs indicator navigation */}
        <div
          style={{
            paddingBottom: "16px",
            color: "#7d8591",
            fontSize: "13px",
            fontWeight: "500",
          }}
        >
          <span
            style={{ cursor: "pointer", color: "#a30146" }}
            onClick={onBack}
          >
            Главная
          </span>
          <span> &gt; </span>
          <span style={{ color: "#070c14" }}>Личный кабинет</span>
        </div>

        <header className="profile-page-header">
          <h2>Личный кабинет</h2>
        </header>

        <main className="profile-page-info">
          <div className="profile-info-group">
            <span className="info-group-title">1. Личные данные</span>
            <div className="info-item-row">
              <span className="item-label">ФИО полностью</span>
              <span className="item-value">
                {profile?.full_name || "Не заполнено"}
              </span>
            </div>
            <div className="info-item-row">
              <span className="item-label">Номер телефона</span>
              <span className="item-value">
                {profile?.phone || "Не заполнено"}
              </span>
            </div>
            <div className="info-item-row">
              <span className="item-label">Адрес регистрации</span>
              <span className="item-value">
                {profile?.address || "Не заполнено"}
              </span>
            </div>
          </div>

          <div className="profile-info-group">
            <span className="info-group-title">2. Статус аккаунта</span>

            {isVerified ? (
              <div className="verification-status-badge verified">
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
            ) : (
              <div
                className="verification-status-badge unverified"
                onClick={() => onNavigate("/verification-form")}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={errorIcon}
                  alt="Attention Required"
                  className="badge-status-img"
                />
                <div className="badge-status-text">
                  <span className="status-title" style={{ color: "#9b1c1c" }}>
                    Личность не верифицирована
                  </span>
                  <span
                    className="status-subtitle"
                    style={{ color: "#e02424", textDecoration: "underline" }}
                  >
                    Нажмите здесь, чтобы загрузить документы и пройти проверку
                  </span>
                </div>
              </div>
            )}
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
