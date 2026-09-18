"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X } from "lucide-react";
import {
  validateProfileFiles,
  formatFileSize,
} from "@/utils/Common/fileUploadValidation";
import CircleLoader from "@/components/UI/loaders/CircleLoader";

export default function ProfileUploader({ onUpload, isUploading, uploadError }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  const onDrop = useCallback((droppedFiles) => {
    const { accepted, errors } = validateProfileFiles(droppedFiles);
    setValidationErrors(errors);
    setSelectedFiles((current) => {
      const names = new Set(current.map((file) => file.name));
      return [...current, ...accepted.filter((file) => !names.has(file.name))];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        [".pptx"],
    },
  });

  const removeFile = (name) => {
    setSelectedFiles((current) => current.filter((file) => file.name !== name));
  };

  const submit = async () => {
    const uploaded = await onUpload(selectedFiles);
    if (uploaded) {
      setSelectedFiles([]);
      setValidationErrors([]);
    }
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-3 text-lg font-semibold text-foreground">
        Upload candidate profiles
      </h2>

      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-ring bg-accent"
            : "border-border hover:border-ring"
        }`}
      >
        <input {...getInputProps()} aria-label="Upload candidate profiles" />
        <UploadCloud className="mb-3 h-8 w-8 text-secondary" />
        <p className="text-sm text-foreground">
          Drag and drop profiles here, or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          PDF and PPTX only, up to 10 files and 10 MB each
        </p>
      </div>

      {validationErrors.length > 0 && (
        <ul className="mt-3 space-y-1">
          {validationErrors.map((message) => (
            <li key={message} className="text-xs cancel-red">
              {message}
            </li>
          ))}
        </ul>
      )}

      {uploadError && <p className="mt-3 text-xs cancel-red">{uploadError}</p>}

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${file.name}`}
                onClick={() => removeFile(file.name)}
                className="rounded p-1 text-secondary hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={isUploading}
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
          >
            {isUploading && (
              <CircleLoader classNameOne="h-4 w-4" classNameTwo="h-4 w-4" />
            )}
            {isUploading
              ? "Submitting"
              : `Submit ${selectedFiles.length} profile${
                  selectedFiles.length > 1 ? "s" : ""
                }`}
          </button>
        </div>
      )}
    </div>
  );
}
