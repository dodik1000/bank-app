import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Modal from "../../components/Modal/Modal";
import "./sass/index.scss";

import profileIcon from "../../assets/imgs/icon-profile.png";

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

export default function Dashboard({ profile, onNavigate }) {
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

  // confirm dialog states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const totalBalance = accounts.reduce(
    (sum, acc) => sum + parseFloat(acc.balance),
    0,
  );

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

    const targetAcc = accounts.find((a) => a.id === parseInt(toAccountId));

    setConfirmData({
      type: "transfer",
      message: `Вы уверены, что хотите перевести $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} со счета "${sourceAcc.name}" на счет "${targetAcc.name}"? Это действие необратимо.`,
      payload: { fromId: fromAccountId, toId: toAccountId, amount },
    });

    setIsTransferOpen(false);
    setIsConfirmOpen(true);
  };

  const handleDepositClick = (acc) => {
    setDepositAccount(acc);
    setIsDepositOpen(true);
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount) return setDepositError("Введите сумму");

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      return setDepositError("Некорректная сумма");
    }

    setConfirmData({
      type: "deposit",
      message: `Вы уверены, что хотите пополнить счет "${depositAccount.name}" на сумму $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}?`,
      payload: {
        accountId: depositAccount.id,
        currentBalance: parseFloat(depositAccount.balance),
        amount,
      },
    });

    setIsDepositOpen(false);
    setIsConfirmOpen(true);
  };

  const handleExecuteConfirm = async () => {
    if (!confirmData) return;
    const { type, payload } = confirmData;
    setLoading(true);
    setIsConfirmOpen(false);

    if (type === "transfer") {
      const sourceAcc = accounts.find((a) => a.id === parseInt(payload.fromId));
      const targetAcc = accounts.find((a) => a.id === parseInt(payload.toId));

      const { error: errDeduct } = await supabase
        .from("accounts")
        .update({ balance: sourceAcc.balance - payload.amount })
        .eq("id", payload.fromId);

      const { error: errAdd } = await supabase
        .from("accounts")
        .update({ balance: parseFloat(targetAcc.balance) + payload.amount })
        .eq("id", payload.toId);

      if (errDeduct || errAdd) {
        setTransferError("Ошибка при переводе");
        setIsTransferOpen(true);
      } else {
        setTransferAmount("");
        setTransferError("");
      }
    } else if (type === "deposit") {
      const { error } = await supabase
        .from("accounts")
        .update({ balance: payload.currentBalance + payload.amount })
        .eq("id", payload.accountId);

      if (error) {
        setDepositError(error.message);
        setIsDepositOpen(true);
      } else {
        setDepositAmount("");
        setDepositError("");
      }
    }

    await fetchAccounts();
    setConfirmData(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    if (confirmData?.type === "transfer") setIsTransferOpen(true);
    if (confirmData?.type === "deposit") setIsDepositOpen(true);
    setConfirmData(null);
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <section className="balance-section">
          <button onClick={onNavigate} className="btn-profile-widget">
            <img src={profileIcon} alt="" className="profile-btn-icon" />
            <span className="profile-text-name">{profile?.full_name}</span>
          </button>

          {/* Возвращено к исходному чистому виду */}
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
            <p className="accounts-empty-state">
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
          <button type="submit" className="btn-pill btn-primary btn-full">
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

          <button type="submit" className="btn-pill btn-primary btn-full">
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

          <button type="submit" className="btn-pill btn-primary btn-full">
            Пополнить баланс
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isConfirmOpen}
        onClose={handleCancelConfirm}
        title="Требуется подтверждение"
      >
        <p className="confirm-modal-text">{confirmData?.message}</p>
        <div className="confirm-buttons">
          <button
            onClick={handleCancelConfirm}
            className="btn-pill btn-secondary"
          >
            Отмена
          </button>
          <button
            onClick={handleExecuteConfirm}
            className="btn-pill btn-primary"
          >
            Да, подтверждаю
          </button>
        </div>
      </Modal>
    </div>
  );
}
