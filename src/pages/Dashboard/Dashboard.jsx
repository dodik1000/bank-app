import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Modal from "../../components/Modal/Modal";
import "./sass/index.scss";

const QUICK_OPS = [
  { id: 1, label: "Избранное", icon: "" },
  { id: 2, label: "МТС", icon: "" },
  { id: 3, label: "А1", icon: "" },
  { id: 4, label: "На карту", icon: "" },
  { id: 5, label: "Кредиты", icon: "" },
  { id: 6, label: "ЕРИП", icon: "" },
  { id: 7, label: "По реквизитам", icon: "" },
  { id: 8, label: "По номеру телефона", icon: "" },
];

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // create account states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [createError, setCreateError] = useState("");

  // transfer states
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferError, setTransferError] = useState("");

  // deposit states
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAccount, setDepositAccount] = useState(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositError, setDepositError] = useState("");

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance),
    0,
  );

  // fetch from database
  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setAccounts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // create handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!accountName.trim()) return setCreateError("Название пустое");
    if (accountName.length > 20) return setCreateError("Максимум 20 символов");

    const randomNum = `•••• ${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabase
      .from("accounts")
      .insert([{ name: accountName, number: randomNum }])
      .select();

    if (error) {
      setCreateError(error.message);
    } else {
      if (data) setAccounts([...accounts, data[0]]);
      setAccountName("");
      setCreateError("");
      setIsCreateOpen(false);
    }
  };

  // transfer handler
  const handleTransferSubmit = async (e) => {
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

    // database updates
    const { error: errDeduct } = await supabase
      .from("accounts")
      .update({ balance: sourceAcc.balance - amount })
      .eq("id", fromAccountId);

    const targetAcc = accounts.find((a) => a.id === parseInt(toAccountId));
    const { error: errAdd } = await supabase
      .from("accounts")
      .update({ balance: parseFloat(targetAcc.balance) + amount })
      .eq("id", toAccountId);

    if (errDeduct || errAdd) {
      return setTransferError("Ошибка при переводе");
    }

    // sync state
    await fetchAccounts();
    setTransferAmount("");
    setTransferError("");
    setIsTransferOpen(false);
  };

  // deposit click
  const handleDepositClick = (acc) => {
    setDepositAccount(acc);
    setIsDepositOpen(true);
  };

  // deposit handler
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount) return setDepositError("Введите сумму");

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      return setDepositError("Некорректная сумма");
    }

    const { error } = await supabase
      .from("accounts")
      .update({ balance: parseFloat(depositAccount.balance) + amount })
      .eq("id", depositAccount.id);

    if (error) {
      setDepositError(error.message);
    } else {
      await fetchAccounts();
      setDepositAmount("");
      setDepositError("");
      setIsDepositOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <h3>Загрузка счетов...</h3>
      </div>
    );
  }

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
          {accounts.length === 0 ? (
            <p
              style={{ color: "#7d8591", fontSize: "14px", fontWeight: "600" }}
            >
              У вас пока нет открытых счетов.
            </p>
          ) : (
            accounts.map((acc) => (
              <div key={acc.id} className="account-card">
                <div className="card-header">
                  <h4>{acc.name}</h4>
                  <span className="card-number">{acc.number}</span>
                </div>
                <div className="card-footer">
                  <div className="card-balance">
                    ${" "}
                    {parseFloat(acc.balance).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <button
                    onClick={() => handleDepositClick(acc)}
                    className="btn-deposit"
                  >
                    Пополнить
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

        {/* global operations block */}
        <div className="operations-section">
          <h3>Платежи и услуги</h3>
          <div className="operations-grid">
            {QUICK_OPS.map((op) => (
              <div key={op.id} className="operation-item">
                <span className="operation-icon">{op.icon}</span>
                <span className="operation-label">{op.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleLogout} className="btn-logout">
          Выйти
        </button>
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
                  {a.name} (${parseFloat(a.balance).toFixed(2)})
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

      <Modal
        isOpen={isDepositOpen}
        onClose={() => {
          setIsDepositOpen(false);
          setDepositError("");
          setDepositAmount("");
        }}
        title={`Пополнение: ${depositAccount?.name || ""}`}
      >
        <form onSubmit={handleDepositSubmit}>
          <div className="form-group">
            <label>Сумма пополнения ($)</label>
            <input
              type="number"
              step="0.01"
              className={`input-default ${depositError ? "input-error" : ""}`}
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => {
                setDepositAmount(e.target.value);
                setDepositError("");
              }}
            />
            {depositError && (
              <div className="error-message">{depositError}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn-pill btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Пополнить баланс
          </button>
        </form>
      </Modal>
    </div>
  );
}
