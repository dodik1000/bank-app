import React from "react";
import "./index.scss";

import fileIcon from "../../assets/imgs/icon-file.png";
import successIcon from "../../assets/imgs/icon-success.png";
import errorIcon from "../../assets/imgs/icon-error.png";
import downloadIcon from "../../assets/imgs/icon-download.png";
import trashIcon from "../../assets/imgs/icon-trash.png";
import reloadIcon from "../../assets/imgs/icon-reload.png"; // добавили импорт

export default function FileItem({ file, onRemove, onRetry, onDownload }) {
  const { id, name, size, status, progress } = file;

  const formatValue = (val) => val.toFixed(1).replace(".", ",");
  const totalMB = size / (1024 * 1024);

  const getStatusDetails = () => {
    switch (status) {
      case "loading":
        return {
          class: "loading",
          label: `${formatValue(totalMB * (progress / 100))}/${formatValue(totalMB)} МБ`,
          badge: null,
        };
      case "error_quota":
        return {
          class: "error-quota",
          label: "Превышен лимит вложений",
          badge: errorIcon,
        };
      case "error_upload":
        return {
          class: "error-upload",
          label: "Ошибка при загрузке",
          badge: errorIcon,
        };
      case "error_format":
        return {
          class: "error-format",
          label: "Неверный формат",
          badge: errorIcon,
        };
      case "success":
      default:
        return {
          class: "success",
          label: `${formatValue(totalMB)} МБ`,
          badge: successIcon,
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div className={`file-item ${details.class}`}>
      <div className="file-icon-wrapper">
        <img src={fileIcon} alt="File" className="file-type-img" />
      </div>

      <div className="file-info-body">
        <div className="file-name">{name}</div>
        <div className="file-status-row">
          {status === "loading" ? (
            <div className="file-circle-spinner" />
          ) : (
            details.badge && (
              <img src={details.badge} alt="" className="status-badge-img" />
            )
          )}
          <span className="file-status-label">{details.label}</span>
        </div>
      </div>

      <div className="file-actions">
        {/* Вместо текста теперь выводим технологичную кнопку повтора */}
        {status === "error_upload" && (
          <button
            className="btn-action-icon btn-retry-reload"
            onClick={() => onRetry(id)}
            title="Повторить загрузку"
          >
            <img src={reloadIcon} alt="Retry" />
          </button>
        )}

        {status === "success" && (
          <button
            className="btn-action-icon"
            onClick={() => onDownload(file)}
            title="Скачать"
          >
            <img src={downloadIcon} alt="Download" />
          </button>
        )}

        <button
          className="btn-action-icon"
          onClick={() => onRemove(id)}
          title={status === "loading" ? "Отмена" : "Удалить"}
        >
          <img
            src={status === "loading" ? errorIcon : trashIcon}
            alt="Action"
          />
        </button>
      </div>
    </div>
  );
}
