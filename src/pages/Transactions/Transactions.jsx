import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import "./sass/index.scss";

export default function Transactions({
  initialFilter = "all",
  onBack,
  onRepeat,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);

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

  const toggleFavorite = async (id, currentStatus) => {
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

  const handleRepeatTransaction = (transaction) => {
    if (!transaction.is_favorite) return;
    if (transaction.type !== "transfer") return;

    onRepeat(transaction);
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

        <main className="transactions-list">
          {filteredTransactions.length === 0 ? (
            <p className="empty-state">Нет доступных операций</p>
          ) : (
            filteredTransactions.map((t) => (
              <div
                key={t.id}
                className={`transaction-item-card ${t.is_favorite ? "repeatable" : ""}`}
                onClick={() => handleRepeatTransaction(t)}
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
                  <button
                    className={`btn-fav-star ${t.is_favorite ? "is-fav" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(t.id, t.is_favorite);
                    }}
                  >
                    {t.is_favorite ? "★" : "☆"}
                  </button>
                </div>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}
