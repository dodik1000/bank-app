import React, { useState, useRef } from 'react';
import './index.scss';

export default function DropZone({ onFilesAdded, isQuotaOverfilled }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // drag animation triggers
  const handleDragOver = (e) => {
    e.preventDefault();
    if (isQuotaOverfilled) return;
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);

    if (isQuotaOverfilled) {
      alert('Невозможно добавить файл. Превышен допустимый объем вложений.');
      return;
    }

    if (e.dataTransfer.files?.length > 0) {
      onFilesAdded(e.dataTransfer.files);
    }
  };

  // native dialog triggers
  const handleClick = () => {
    if (isQuotaOverfilled) return;
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      onFilesAdded(e.target.files);
    }
  };

  return (
    <div
      className={`dropzone ${isDragActive ? 'drag-active' : ''} ${
        isQuotaOverfilled ? 'disabled' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf"
        className="hidden-file-input"
        onChange={handleFileChange}
        disabled={isQuotaOverfilled}
      />

      {isQuotaOverfilled ? (
        <div className="dropzone-text disabled-state">
          <p className="main-text">Превышен допустимый объем вложений</p>
          <span className="sub-text">Удалите файлы, чтобы продолжить загрузку</span>
        </div>
      ) : isDragActive ? (
        <div className="dropzone-text active-state">
          <p className="main-text">Отпустите файлы для загрузки</p>
          <span className="sub-text">Допускается загрузка PDF файлов. До 25 МБ суммарно</span>
        </div>
      ) : (
        <div className="dropzone-text default-state">
          <p className="main-text">
            Перетащите файлы или <span className="highlight-link">нажмите</span>, чтобы загрузить с
            устройства
          </p>
          <span className="sub-text">Допускается загрузка PDF файлов. До 25 МБ суммарно</span>
        </div>
      )}
    </div>
  );
}
