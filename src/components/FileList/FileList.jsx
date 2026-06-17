import React from 'react';
import FileItem from '../FileItem/FileItem';
import './index.scss';

export default function FileList({ files, onRemoveFile, onRetryUpload, onDownloadFile }) {
  if (!files?.length) return null;

  return (
    <div className="file-list-container">
      {files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          onRemove={onRemoveFile}
          onRetry={onRetryUpload}
          onDownload={onDownloadFile}
        />
      ))}
    </div>
  );
}
