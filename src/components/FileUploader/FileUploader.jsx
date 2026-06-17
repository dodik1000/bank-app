import React from 'react';
import QuotaBlock from '../QuotaBlock/QuotaBlock';
import DropZone from '../DropZone/DropZone';
import FileList from '../FileList/FileList';
import './index.scss';

const MAX_QUOTA_BYTES = 25 * 1024 * 1024;

export default function FileUploader({ files, setFiles }) {
  // quota calculator
  const currentQuotaBytes = files.reduce(
    (acc, file) =>
      ['success', 'loading', 'error_quota'].includes(file.status) ? acc + file.size : acc,
    0
  );

  const isQuotaOverfilled = currentQuotaBytes >= MAX_QUOTA_BYTES;

  const handleFilesAdded = (newFileList) => {
    if (isQuotaOverfilled) {
      alert('Невозможно добавить файл. Превышен допустимый объем вложений.');
      return;
    }

    let runningQuotaAccumulator = currentQuotaBytes;

    const processedFiles = Array.from(newFileList)
      .map((file) => {
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const fileId = `${file.name}-${Date.now()}-${Math.random()}`;

        if (files.some((f) => f.name === file.name && f.status !== 'error_format')) {
          alert(`Файл с именем "${file.name}" уже добавлен`);
          return null;
        }

        if (!isPdf) {
          return {
            id: fileId,
            name: file.name,
            size: file.size,
            status: 'error_format',
            progress: 0,
          };
        }

        runningQuotaAccumulator += file.size;
        const initialStatus = runningQuotaAccumulator > MAX_QUOTA_BYTES ? 'error_quota' : 'loading';

        return {
          id: fileId,
          name: file.name,
          size: file.size,
          status: initialStatus,
          progress: initialStatus === 'loading' ? 10 : 0,
        };
      })
      .filter(Boolean);

    if (processedFiles.length === 0) return;

    setFiles((prev) => {
      const updatedList = [...prev, ...processedFiles];
      processedFiles.forEach((file) => {
        if (file.status === 'loading') simulateServerUpload(file.id);
      });
      return updatedList;
    });
  };

  // upload simulation
  const simulateServerUpload = (id) => {
    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 30;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setFiles((prevFiles) =>
          prevFiles.map((f) => (f.id === id ? { ...f, status: 'success', progress: 100 } : f))
        );
      } else {
        setFiles((prevFiles) =>
          prevFiles.map((f) => (f.id === id ? { ...f, progress: currentProgress } : f))
        );
      }
    }, 400);
  };

  const handleRemoveFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleRetryUpload = (id) => {
    const targetFile = files.find((f) => f.id === id);
    if (!targetFile) return;
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'loading', progress: 10 } : f))
    );
    simulateServerUpload(id);
  };

  const handleDownloadFile = (file) => {
    const blob = new Blob([`Mock data: ${file.name}`], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="form-card">
      <div className="uploader-header">
        <h2>3. Подтверждающие документы</h2>
        <h1>Загрузите документы, подтверждающие факт подписания договора цифрового счета.</h1>
      </div>

      <DropZone onFilesAdded={handleFilesAdded} isQuotaOverfilled={isQuotaOverfilled} />

      {files.length > 0 && (
        <QuotaBlock currentQuotaBytes={currentQuotaBytes} maxQuotaBytes={MAX_QUOTA_BYTES} />
      )}

      <FileList
        files={files}
        onRemoveFile={handleRemoveFile}
        onRetryUpload={handleRetryUpload}
        onDownloadFile={handleDownloadFile}
      />
    </div>
  );
}
