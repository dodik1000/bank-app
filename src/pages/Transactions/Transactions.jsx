import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "./sass/index.scss";

import sandclockIcon from "../../assets/imgs/icon-sandclock.png";

export default function Transactions({
  initialFilter = "all",
  onBack,
  onRepeat,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [subView, setSubView] = useState("list"); // 'list' or 'analytics'

  const fetchTransactions = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setTransactions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const toggleFavorite = async (id, currentStatus, e) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("transactions")
      .update({ is_favorite: !currentStatus })
      .eq("id", id);

    if (error) {
      console.error(error);
    } else {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_favorite: !currentStatus } : t,
        ),
      );
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "favorites") return t.is_favorite;
    return true;
  });

  const formatType = (type) => {
    switch (type) {
      case "transfer":
        return "Перевод";
      case "deposit":
        return "Пополнение";
      case "service_payment":
        return "Оплата услуги";
      default:
        return "Операция";
    }
  };

  // Expenses analytics computation pipeline
  const getAnalyticsData = () => {
    const categories = {
      mobile: { label: "Мобильная связь", amount: 0, color: "red" },
      erip: { label: "Коммуналка (ЕРИП)", amount: 0, color: "red" },
      loans: { label: "Кредиты", amount: 0, color: "red" },
      other: { label: "Переводы и другое", amount: 0, color: "red" },
    };

    let totalExpenses = 0;

    // Filter and accumulate only debit/expense operations
    filteredTransactions.forEach((t) => {
      if (t.type === "deposit") return;

      const amount = parseFloat(t.amount) || 0;
      totalExpenses += amount;

      if (t.type === "transfer") {
        categories.other.amount += amount;
      } else if (t.type === "service_payment") {
        const meta = t.target_recipient || "";
        if (
          meta.startsWith("МТС") ||
          meta.startsWith("А1") ||
          meta.startsWith("По номеру")
        ) {
          categories.mobile.amount += amount;
        } else if (meta.startsWith("ЕРИП")) {
          categories.erip.amount += amount;
        } else if (meta.startsWith("Кредит")) {
          categories.loans.amount += amount;
        } else {
          categories.other.amount += amount;
        }
      }
    });

    // Map calculated absolute values into percentage distribution rows
    return {
      total: totalExpenses,
      items: Object.values(categories).map((cat) => ({
        ...cat,
        percentage:
          totalExpenses > 0
            ? Math.round((cat.amount / totalExpenses) * 100)
            : 0,
      })),
    };
  };

  const analytics = getAnalyticsData();

  if (loading) {
    return (
      <div className="transactions-page-wrapper">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="transactions-page-wrapper">
      <div className="transactions-page-container">
        <header className="transactions-page-header">
          <h2>История операций</h2>
          <button onClick={onBack} className="btn-tx-back">
            Назад
          </button>
        </header>

        <div className="filter-tabs">
          <button
            className={`tab-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Все операции
          </button>
          <button
            className={`tab-btn ${filter === "favorites" ? "active" : ""}`}
            onClick={() => setFilter("favorites")}
          >
            ★ Избранные
          </button>
        </div>

        {/* Sub-view toggle navigation stack */}
        <div className="view-mode-toggle">
          <button
            className={`mode-btn ${subView === "list" ? "selected" : ""}`}
            onClick={() => setSubView("list")}
          >
            Лента
          </button>
          <button
            className={`mode-btn ${subView === "analytics" ? "selected" : ""}`}
            onClick={() => setSubView("analytics")}
          >
            Аналитика
          </button>
        </div>

        {subView === "list" ? (
          <main className="transactions-list">
            {filteredTransactions.length === 0 ? (
              <p className="empty-state">Нет доступных операций</p>
            ) : (
              filteredTransactions.map((t) => (
                <div
                  key={t.id}
                  className={`transaction-item-card ${t.is_favorite ? "clickable-favorite" : ""}`}
                  onClick={() => t.is_favorite && onRepeat && onRepeat(t)}
                >
                  <div className="tx-main-info">
                    <span className="tx-type">{formatType(t.type)}</span>
                    <span className="tx-recipient">{t.target_recipient}</span>
                    <span className="tx-account-source">
                      Счет: {t.account_name}
                    </span>
                    <span className="tx-date">
                      {new Date(t.created_at).toLocaleString("ru-RU")}
                    </span>
                  </div>
                  <div className="tx-actions-amount">
                    <span
                      className={`tx-amount ${t.type === "deposit" ? "income" : "expense"}`}
                    >
                      {t.type === "deposit" ? "+" : "-"} $
                      {parseFloat(t.amount).toFixed(2)}
                    </span>

                    {t.type !== "deposit" && (
                      <button
                        className="btn-schedule-timer"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Prompt for the preferred day of month to schedule this recurring payment
                          const dayStr = prompt(
                            "Введите день месяца для автоплатежа (1-31):",
                            new Date().getDate(),
                          );
                          const day = parseInt(dayStr);
                          if (isNaN(day) || day < 1 || day > 31) {
                            alert("Некорректный день месяца");
                            return;
                          }

                          // Execute direct database setup inline
                          supabase
                            .from("scheduled_payments")
                            .insert([
                              {
                                user_id: t.user_id,
                                account_name: t.account_name,
                                service_name:
                                  t.type === "transfer"
                                    ? "Перевод"
                                    : t.target_recipient.split(":")[0],
                                target_recipient: t.target_recipient,
                                amount: t.amount,
                                day_of_month: day,
                              },
                            ])
                            .then(({ error }) => {
                              if (error) alert(error.message);
                              else
                                alert(
                                  "Автоплатеж успешно добавлен в расписание!",
                                );
                            });
                        }}
                        title="Поставить на таймер расписания"
                      >
                        <img
                          src={sandclockIcon}
                          alt="Schedule"
                          className="schedule-btn-icon"
                        />
                      </button>
                    )}

                    <button
                      className={`btn-fav-star ${t.is_favorite ? "is-fav" : ""}`}
                      onClick={(e) => toggleFavorite(t.id, t.is_favorite, e)}
                    >
                      {t.is_favorite ? "★" : "☆"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </main>
        ) : (
          <main className="analytics-dashboard">
            <div className="total-expenses-summary">
              <span className="summary-label">Общий расход</span>
              <span className="summary-amount">
                ${" "}
                {analytics.total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="analytics-bars-stack">
              {analytics.items.map((item, idx) => (
                <div key={idx} className="analytics-bar-row">
                  <div className="bar-row-header">
                    <span className="category-label">{item.label}</span>
                    <span className="category-values">
                      ${item.amount.toFixed(2)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="bar-progress-bg">
                    <div
                      className={`bar-progress-fill ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
