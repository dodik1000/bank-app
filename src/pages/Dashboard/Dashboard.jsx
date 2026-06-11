// src/pages/Dashboard/index.jsx
import React, { useState } from "react";
import Modal from "../../components/Modal/Modal";
import "./sass/index.scss";

const INITIAL_ACCOUNTS = [
  {
    id: 1,
    number: "numb-erof-card-xxxx",
    name: "Основной счет",
    balance: 10.0,
  },
];

export default function Dashboard() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);

  // account states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [createError, setCreateError] = useState("");

  // transfer states
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferError, setTransferError] = useState("");

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // create handler
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!accountName.trim()) return setCreateError("Название пустое");
    if (accountName.length > 20) return setCreateError("Максимум 20 символов");

    const newAccount = {
      id: Date.now(),
      number: "numb-erof-card-xxxx",
      name: accountName,
      balance: 0,
    };

    setAccounts([...accounts, newAccount]);
    setAccountName("");
    setCreateError("");
    setIsCreateOpen(false);
  };

  // transfer handler
  const handleTransferSubmit = (e) => {
    e.preventDefault();

    if (!fromAccountId || !toAccountId || !transferAmount) {
      return setTransferError("Заполните все поля");
    }
    if (fromAccountId === toAccountId) {
      return setTransferError("Выберите разные счета");
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      return setTransferError("Некорректная сумма");
    }

    const sourceAcc = accounts.find((a) => a.id === parseInt(fromAccountId));
    if (sourceAcc.balance < amount) {
      return setTransferError("Недостаточно средств");
    }

    // update balances
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id === parseInt(fromAccountId)) {
        return { ...acc, balance: acc.balance - amount };
      }
      if (acc.id === parseInt(toAccountId)) {
        return { ...acc, balance: acc.balance + amount };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    setTransferAmount("");
    setTransferError("");
    setIsTransferOpen(false);
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <section className="balance-section">
          <div className="balance-label">Общий баланс</div>
          <div className="balance-amount">
            ${" "}
            {totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>

          <div className="action-buttons">
            <button
              onClick={() => setIsTransferOpen(true)}
              className="btn-pill btn-primary"
            >
              Перевести
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="btn-pill btn-secondary"
            >
              Новый счет
            </button>
          </div>
        </section>

        <section className="accounts-section">
          <h3>Мои карты</h3>
          {accounts.map((acc) => (
            <div key={acc.id} className="account-card">
              <div className="card-header">
                <h4>{acc.name}</h4>
                <span className="card-number">{acc.number}</span>
              </div>
              <div className="card-footer">
                <div className="card-balance">
                  ${" "}
                  {acc.balance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <button className="btn-deposit">Пополнить</button>
              </div>
            </div>
          ))}
        </section>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateError("");
        }}
        title="Создать новый счет"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label htmlFor="acc-name">Название счета</label>
            <input
              id="acc-name"
              type="text"
              className={`input-default ${createError ? "input-error" : ""}`}
              placeholder="Например, На отпуск"
              value={accountName}
              onChange={(e) => {
                setAccountName(e.target.value);
                setCreateError("");
              }}
            />
            {createError && <div className="error-message">{createError}</div>}
          </div>
          <button
            type="submit"
            className="btn-pill btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Создать
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setTransferError("");
        }}
        title="Перевод между счетами"
      >
        <form onSubmit={handleTransferSubmit}>
          <div className="form-group">
            <label>Списать со счета</label>
            <select
              className={`select-default ${transferError ? "input-error" : ""}`}
              value={fromAccountId}
              onChange={(e) => {
                setFromAccountId(e.target.value);
                setTransferError("");
              }}
            >
              <option value="">Выберите счет</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} (${a.balance})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Зачислить на счет</label>
            <select
              className={`select-default ${transferError ? "input-error" : ""}`}
              value={toAccountId}
              onChange={(e) => {
                setToAccountId(e.target.value);
                setTransferError("");
              }}
            >
              <option value="">Выберите счет</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Сумма перевода ($)</label>
            <input
              type="number"
              step="0.01"
              className={`input-default ${transferError ? "input-error" : ""}`}
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => {
                setTransferAmount(e.target.value);
                setTransferError("");
              }}
            />
            {transferError && (
              <div className="error-message">{transferError}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn-pill btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Подтвердить перевод
          </button>
        </form>
      </Modal>
    </div>
  );
}
