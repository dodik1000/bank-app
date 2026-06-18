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

  // global utility payments states
  const [isServicePaymentOpen, setIsServicePaymentOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceSourceAccountId, setServiceSourceAccountId] = useState("");
  const [serviceAmount, setServiceAmount] = useState("");
  const [serviceError, setServiceError] = useState("");

  // dynamic inputs fields states
  const [targetCardNumber, setTargetCardNumber] = useState("");
  const [targetPhoneNumber, setTargetPhoneNumber] = useState("");
  const [targetContractNumber, setTargetContractNumber] = useState("");
  const [targetEripCode, setTargetEripCode] = useState("");
  const [targetRequisites, setTargetRequisites] = useState({
    bankCode: "",
    account: "",
  });

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

  const handleOperationClick = (op) => {
    if (op.label !== "Избранное") {
      setSelectedService(op.label);
      setIsServicePaymentOpen(true);
    }
  };

  const resetServiceForm = () => {
    setIsServicePaymentOpen(false);
    setServiceError("");
    setServiceAmount("");
    setServiceSourceAccountId("");
    setTargetCardNumber("");
    setTargetPhoneNumber("");
    setTargetContractNumber("");
    setTargetEripCode("");
    setTargetRequisites({ bankCode: "", account: "" });
  };

  const handleServicePaymentSubmit = (e) => {
    e.preventDefault();

    if (!serviceSourceAccountId || !serviceAmount) {
      return setServiceError("Заполните все поля");
    }

    const amount = parseFloat(serviceAmount);
    if (isNaN(amount) || amount <= 0) {
      return setServiceError("Некорректная сумма");
    }

    const sourceAcc = accounts.find(
      (a) => a.id === parseInt(serviceSourceAccountId),
    );
    if (sourceAcc.balance < amount) {
      return setServiceError("Недостаточно средств");
    }

    let targetDetails = "";

    if (
      selectedService === "МТС" ||
      selectedService === "А1" ||
      selectedService === "По номеру телефона"
    ) {
      const cleanPhone = targetPhoneNumber.replace(/\s+/g, "");
      if (!/^\+375\d{9}$/.test(cleanPhone)) {
        return setServiceError("Формат телефона должен быть +375XXXXXXXXX");
      }
      targetDetails = `на номер ${targetPhoneNumber}`;
    } else if (selectedService === "На карту") {
      const cleanCard = targetCardNumber.replace(/\s+/g, "");
      if (!/^\d{16}$/.test(cleanCard)) {
        return setServiceError("Номер карты должен состоять из 16 цифр");
      }
      targetDetails = `на карту •••• ${cleanCard.slice(-4)}`;
    } else if (selectedService === "Кредиты") {
      if (!targetContractNumber.trim()) {
        return setServiceError("Введите номер договора");
      }
      targetDetails = `по договору кредита №${targetContractNumber}`;
    } else if (selectedService === "ЕРИП") {
      if (!targetEripCode.trim()) {
        return setServiceError("Введите код услуги ЕРИП");
      }
      targetDetails = `в систему ЕРИП по коду ${targetEripCode}`;
    } else if (selectedService === "По реквизитам") {
      if (
        !targetRequisites.bankCode.trim() ||
        !targetRequisites.account.trim()
      ) {
        return setServiceError("Заполните БИК и счет получателя");
      }
      targetDetails = `на р/с ${targetRequisites.account}`;
    }

    setConfirmData({
      type: "service_payment",
      message: `Вы уверены, что хотите оплатить услугу "${selectedService}" ${targetDetails} на сумму $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}?`,
      payload: {
        accountId: serviceSourceAccountId,
        currentBalance: sourceAcc.balance,
        amount,
      },
    });

    setIsServicePaymentOpen(false);
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
    } else if (type === "service_payment") {
      const { error } = await supabase
        .from("accounts")
        .update({ balance: payload.currentBalance - payload.amount })
        .eq("id", payload.accountId);

      if (error) {
        setServiceError(error.message);
        setIsServicePaymentOpen(true);
      } else {
        resetServiceForm();
      }
    }

    await fetchAccounts();
    setConfirmData(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    if (confirmData?.type === "transfer") setIsTransferOpen(true);
    if (confirmData?.type === "deposit") setIsDepositOpen(true);
    if (confirmData?.type === "service_payment") setIsServicePaymentOpen(true);
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
              <button
                key={op.id}
                className="operation-item"
                onClick={() => handleOperationClick(op)}
              >
                <span className="operation-icon">{op.icon}</span>
                <span className="operation-label">{op.label}</span>
              </button>
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

      {/* Unified Service and Utility Payments Wizard Modal */}
      <Modal
        isOpen={isServicePaymentOpen}
        onClose={resetServiceForm}
        title={`Оплата услуги: ${selectedService || ""}`}
      >
        <form onSubmit={handleServicePaymentSubmit}>
          <div className="form-group">
            <label>Списать со счета</label>
            <select
              className={`select-default ${serviceError ? "input-error" : ""}`}
              value={serviceSourceAccountId}
              onChange={(e) => {
                setServiceSourceAccountId(e.target.value);
                setServiceError("");
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

          {/* Condition-based context fields switching pipelines */}
          {(selectedService === "МТС" ||
            selectedService === "А1" ||
            selectedService === "По номеру телефона") && (
            <div className="form-group">
              <label>Номер телефона</label>
              <input
                type="tel"
                className={`input-default ${serviceError ? "input-error" : ""}`}
                placeholder="+375XXXXXXXXX"
                value={targetPhoneNumber}
                onChange={(e) => {
                  setTargetPhoneNumber(e.target.value);
                  setServiceError("");
                }}
              />
            </div>
          )}

          {selectedService === "На карту" && (
            <div className="form-group">
              <label>Номер карты получателя</label>
              <input
                type="text"
                maxLength="16"
                className={`input-default ${serviceError ? "input-error" : ""}`}
                placeholder="16 знаков без пробелов"
                value={targetCardNumber}
                onChange={(e) => {
                  setTargetCardNumber(e.target.value);
                  setServiceError("");
                }}
              />
            </div>
          )}

          {selectedService === "Кредиты" && (
            <div className="form-group">
              <label>Номер кредитного договора</label>
              <input
                type="text"
                className={`input-default ${serviceError ? "input-error" : ""}`}
                placeholder="Например, КР-2026-09"
                value={targetContractNumber}
                onChange={(e) => {
                  setTargetContractNumber(e.target.value);
                  setServiceError("");
                }}
              />
            </div>
          )}

          {selectedService === "ЕРИП" && (
            <div className="form-group">
              <label>Код услуги или номер плательщика</label>
              <input
                type="text"
                className={`input-default ${serviceError ? "input-error" : ""}`}
                placeholder="Например, 443211"
                value={targetEripCode}
                onChange={(e) => {
                  setTargetEripCode(e.target.value);
                  setServiceError("");
                }}
              />
            </div>
          )}

          {selectedService === "По реквизитам" && (
            <>
              <div className="form-group">
                <label>БИК Банка (BIC)</label>
                <input
                  type="text"
                  maxLength="9"
                  className={`input-default ${serviceError ? "input-error" : ""}`}
                  placeholder="9 символов"
                  value={targetRequisites.bankCode}
                  onChange={(e) => {
                    setTargetRequisites({
                      ...targetRequisites,
                      bankCode: e.target.value,
                    });
                    setServiceError("");
                  }}
                />
              </div>
              <div className="form-group">
                <label>Номер расчетного счета (IBAN)</label>
                <input
                  type="text"
                  className={`input-default ${serviceError ? "input-error" : ""}`}
                  placeholder="BY..XXXX............"
                  value={targetRequisites.account}
                  onChange={(e) => {
                    setTargetRequisites({
                      ...targetRequisites,
                      account: e.target.value,
                    });
                    setServiceError("");
                  }}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Сумма платежа ($)</label>
            <input
              type="number"
              step="0.01"
              className={`input-default ${serviceError ? "input-error" : ""}`}
              placeholder="0.00"
              value={serviceAmount}
              onChange={(e) => {
                setServiceAmount(e.target.value);
                setServiceError("");
              }}
            />
            {serviceError && (
              <div className="error-message">{serviceError}</div>
            )}
          </div>

          <button type="submit" className="btn-pill btn-primary btn-full">
            Продолжить
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
