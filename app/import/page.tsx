"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

type UploadState = "idle" | "dragging" | "file-selected" | "uploading" | "success" | "error";

interface FileInfo {
  name: string;
  size: number;
  lastModified: Date;
}

export default function ImportPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [file, setFile] = useState<FileInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ path: string; message: string }>>([]);
  const [taskCount, setTaskCount] = useState<number | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatTimeAgo = (date: Date, now: number = Date.now()) => {
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState !== "uploading") {
      setUploadState("dragging");
    }
  }, [uploadState]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState === "dragging") {
      setUploadState("idle");
    }
  }, [uploadState]);

  const processFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".json") && f.type !== "application/json") {
      setErrorMessage("Invalid file type. Please upload a .json file.");
      setUploadState("error");
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      setErrorMessage("File too large. Maximum size is 5MB.");
      setUploadState("error");
      return;
    }

    setFile({
      name: f.name,
      size: f.size,
      lastModified: new Date(f.lastModified),
    });
    setSelectedFile(f);
    setErrorMessage(null);
    setValidationErrors([]);
    setUploadState("file-selected");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (uploadState === "uploading") return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [uploadState, processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const removeFile = useCallback(() => {
    setFile(null);
    setSelectedFile(null);
    setErrorMessage(null);
    setValidationErrors([]);
    setUploadState("idle");
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState("uploading");
    setErrorMessage(null);
    setValidationErrors([]);

    try {
      const fileContent = await selectedFile.text();
      let jsonData;
      try {
        jsonData = JSON.parse(fileContent);
      } catch {
        setErrorMessage("File is not valid JSON. Please check the syntax.");
        setUploadState("error");
        return;
      }

      const response = await fetch("/api/schedules/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData),
      });

      const data = await response.json();

      if (response.ok && data.scheduleId) {
        setTaskCount(data.taskCount || 0);
        setUploadState("success");
      } else {
        if (data.details && Array.isArray(data.details)) {
          setValidationErrors(data.details);
        }
        setErrorMessage(data.error || "Import failed. Please check your file and try again.");
        setUploadState("error");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setUploadState("error");
    }
  }, [selectedFile]);

  const downloadSchema = useCallback(() => {
    window.open("/api/schedules/schema", "_blank");
  }, []);

  const downloadSample = useCallback(() => {
    window.open("/api/schedules/sample", "_blank");
  }, []);

  const resetAndImportAnother = useCallback(() => {
    setFile(null);
    setSelectedFile(null);
    setErrorMessage(null);
    setValidationErrors([]);
    setTaskCount(null);
    setUploadState("idle");
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-lg mx-auto px-4 py-6">
        <header className="mb-6">
          <Link href="/settings" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back to Settings</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-text-primary">Import Your Study Schedule</h1>
          <p className="text-sm text-text-secondary mt-1">Upload a JSON file to set up your personalized study plan.</p>
        </header>

        <div className="space-y-4">
          <div
            role={uploadState === "uploading" ? undefined : "button"}
            tabIndex={uploadState === "uploading" ? -1 : 0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => uploadState === "uploading" || uploadState === "success" ? null : document.getElementById("file-input")?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && uploadState !== "uploading" && uploadState !== "success") {
                document.getElementById("file-input")?.click();
              }
            }}
            aria-label={uploadState === "uploading" ? "Uploading file" : "Drop zone for JSON file upload"}
            className={`
              relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer
              ${uploadState === "uploading" ? "cursor-not-allowed" : ""}
              ${uploadState === "idle"
                ? "border-border bg-bg-secondary hover:border-accent"
                : uploadState === "dragging"
                ? "border-accent bg-accent-soft"
                : uploadState === "file-selected"
                ? "border-success bg-success-soft/30"
                : uploadState === "error"
                ? "border-danger bg-danger-soft/30"
                : "bg-bg-secondary"
              }
            `}
          >
            <input
              id="file-input"
              type="file"
              accept=".json,application/json"
              onChange={handleFileInput}
              disabled={uploadState === "uploading" || uploadState === "success"}
              className="sr-only"
            />

            {uploadState === "idle" && (
              <div className="pointer-events-none">
                <svg className="mx-auto h-12 w-12 text-text-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-base font-medium text-text-primary">Drop your JSON file here</p>
                <p className="text-sm text-text-secondary mt-1">or tap to browse</p>
                <p className="text-xs text-text-muted mt-2">Max size: 5MB · JSON only</p>
              </div>
            )}

            {uploadState === "dragging" && (
              <div className="pointer-events-none">
                <svg className="mx-auto h-12 w-12 text-accent mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-base font-medium text-accent">Release to upload file</p>
              </div>
            )}

            {uploadState === "file-selected" && file && (
              <div className="pointer-events-none">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <p className="text-base font-semibold text-text-primary">{file.name}</p>
                <p className="text-sm text-text-secondary mt-1">{formatFileSize(file.size)} · {formatTimeAgo(file.lastModified)}</p>
                <div className="mt-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="text-sm text-danger hover:text-danger/80 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {uploadState === "uploading" && (
              <div className="pointer-events-none">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
                </div>
                <p className="text-base font-medium text-accent">Importing schedule...</p>
              </div>
            )}

            {uploadState === "error" && !file && (
              <div className="pointer-events-none">
                <svg className="mx-auto h-12 w-12 text-danger mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-base font-medium text-danger">Invalid file type</p>
                <p className="text-sm text-text-secondary mt-1">Please upload a .json file</p>
              </div>
            )}
          </div>

          {uploadState === "error" && errorMessage && !validationErrors.length && (
            <div className="bg-danger-soft/50 border border-danger/30 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-danger">Import failed</p>
                  <p className="text-sm text-text-secondary mt-1">{errorMessage}</p>
                  {file && (
                    <button onClick={removeFile} className="text-sm text-danger font-medium mt-2 hover:underline">
                      Try a different file
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="bg-warning-soft/50 border border-warning/30 rounded-xl p-4">
              <div className="flex items-start gap-2 mb-3">
                <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-semibold text-warning">{validationErrors.length} error{validationErrors.length !== 1 ? "s" : ""} found</p>
              </div>
              <ul className="space-y-2">
                {validationErrors.slice(0, 5).map((err, i) => (
                  <li key={i} className="text-sm text-text-primary pl-7">
                    <span className="text-xs text-text-muted font-mono bg-bg-tertiary px-1.5 py-0.5 rounded mr-2">{err.path || "root"}</span>
                    {err.message}
                  </li>
                ))}
                {validationErrors.length > 5 && (
                  <li className="text-sm text-text-muted pl-7">...and {validationErrors.length - 5} more errors</li>
                )}
              </ul>
              <button onClick={removeFile} className="mt-3 text-sm text-warning font-medium hover:underline">
                Download corrected file
              </button>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={downloadSchema}
              className="w-full h-12 flex items-center gap-3 px-4 bg-bg-secondary border border-border rounded-xl text-text-primary hover:bg-bg-tertiary active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium flex-1 text-left">Download Schema</span>
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={downloadSample}
              className="w-full h-12 flex items-center gap-3 px-4 bg-bg-secondary border border-border rounded-xl text-text-primary hover:bg-bg-tertiary active:scale-[0.98] transition-all"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium flex-1 text-left">Download Sample</span>
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleImport}
            disabled={uploadState !== "file-selected"}
            className={`
              w-full h-12 rounded-xl font-semibold text-base transition-all duration-150
              ${uploadState === "file-selected"
                ? "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-md"
                : "bg-bg-tertiary text-text-muted cursor-not-allowed"
              }
            `}
          >
            {uploadState === "uploading" ? "Importing..." : "Import Schedule"}
          </button>

          {uploadState === "success" && (
            <div className="rounded-2xl p-6 text-center bg-success-soft/50 border border-success/30 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">Schedule imported successfully!</h2>
              {taskCount !== null && (
                <p className="text-sm text-text-secondary mb-6">{taskCount} task{taskCount !== 1 ? "s" : ""} loaded</p>
              )}
              <div className="space-y-2">
                <Link href="/" className="block w-full h-12 rounded-xl bg-success text-white font-semibold text-base flex items-center justify-center hover:bg-success/90 active:scale-[0.98] transition-all">
                  View Dashboard
                </Link>
                <button onClick={resetAndImportAnother} className="w-full h-12 rounded-xl bg-bg-secondary text-text-primary font-semibold text-base border border-border hover:bg-bg-tertiary active:scale-[0.98] transition-all">
                  Import Another
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-3">How it works</h3>
          <ol className="space-y-2">
            {[
              "Download the sample schedule to see the expected JSON format",
              "Customize it with your subjects, topics, and target dates",
              "Set your exam date and cycle length (e.g., 7-day week)",
              "Upload your file to generate all your study tasks",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-soft text-accent text-xs font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}