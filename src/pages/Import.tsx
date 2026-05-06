import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  getSampleSchedule,
  ImportScheduleSchema,
  type ImportScheduleInput,
} from "@/domain/schedule";
import { importSchedule } from "@/repo";

type UploadState =
  | "idle"
  | "dragging"
  | "file-selected"
  | "uploading"
  | "success"
  | "error";

interface FileInfo {
  name: string;
  size: number;
  lastModified: Date;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatTimeAgo(date: Date, now: number = Date.now()): string {
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [file, setFile] = useState<FileInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Array<{ path: string; message: string }>
  >([]);
  const [taskCount, setTaskCount] = useState<number | null>(null);

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

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (uploadState !== "uploading") setUploadState("dragging");
    },
    [uploadState],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (uploadState === "dragging") setUploadState("idle");
    },
    [uploadState],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (uploadState === "uploading") return;
      const files = e.dataTransfer.files;
      if (files.length > 0) processFile(files[0]);
    },
    [uploadState, processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) processFile(files[0]);
    },
    [processFile],
  );

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
      let jsonData: unknown;
      try {
        jsonData = JSON.parse(fileContent);
      } catch {
        setErrorMessage("File is not valid JSON. Please check the syntax.");
        setUploadState("error");
        return;
      }
      const validation = ImportScheduleSchema.safeParse(jsonData);
      if (!validation.success) {
        setValidationErrors(
          validation.error.issues.map((iss) => ({
            path: iss.path.join("."),
            message: iss.message,
          })),
        );
        setErrorMessage("Validation failed. See details below.");
        setUploadState("error");
        return;
      }
      const result = await importSchedule(validation.data as ImportScheduleInput);
      setTaskCount(result.taskCount);
      setUploadState("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Import failed. Please try again.",
      );
      setUploadState("error");
    }
  }, [selectedFile]);

  const downloadSample = useCallback(() => {
    downloadJson("lakshya-sample-schedule.json", getSampleSchedule());
  }, []);

  const downloadSchema = useCallback(() => {
    // The actual schema is a Zod object — we ship a JSON-Schema-ish summary
    // that documents the shape for users without pulling in zod-to-json-schema.
    const schemaDoc = {
      title: "ImportSchedule",
      description: "Schema for a Lakshya study schedule import.",
      fields: {
        title: "string (1–255 chars, required)",
        description: "string (optional)",
        targetDate: "string in YYYY-MM-DD format (required)",
        cycleLengthDays: "integer 1–366 (required)",
        hoursPerDay: "number 0.5–24 (optional, defaults to 6)",
        timetable:
          "array of { dayNumber: integer ≥ 1, slots: array of { subject: string, topic?: string } }",
      },
      sample: getSampleSchedule(),
    };
    downloadJson("lakshya-schema.json", schemaDoc);
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
      <div className="max-w-lg mx-auto py-6">
        <header className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Import Your Study Schedule
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Upload a JSON file to set up your personalized study plan. Data is
            stored on this device only.
          </p>
        </header>

        <div className="space-y-4">
          <div
            role={uploadState === "uploading" ? undefined : "button"}
            tabIndex={uploadState === "uploading" ? -1 : 0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() =>
              uploadState === "uploading" || uploadState === "success"
                ? null
                : document.getElementById("file-input")?.click()
            }
            onKeyDown={(e) => {
              if (
                (e.key === "Enter" || e.key === " ") &&
                uploadState !== "uploading" &&
                uploadState !== "success"
              ) {
                document.getElementById("file-input")?.click();
              }
            }}
            aria-label={
              uploadState === "uploading"
                ? "Uploading file"
                : "Drop zone for JSON file upload"
            }
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 cursor-pointer ${
              uploadState === "uploading" ? "cursor-not-allowed" : ""
            } ${
              uploadState === "idle"
                ? "border-border bg-bg-secondary hover:border-accent"
                : uploadState === "dragging"
                  ? "border-accent bg-accent-soft"
                  : uploadState === "file-selected"
                    ? "border-success bg-success-soft/30"
                    : uploadState === "error"
                      ? "border-danger bg-danger-soft/30"
                      : "bg-bg-secondary"
            }`}
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
                <p className="text-base font-medium text-text-primary">
                  Drop your JSON file here
                </p>
                <p className="text-sm text-text-secondary mt-1">or tap to browse</p>
                <p className="text-xs text-text-muted mt-2">
                  Max size: 5MB · JSON only
                </p>
              </div>
            )}

            {uploadState === "dragging" && (
              <p className="pointer-events-none text-base font-medium text-accent">
                Release to upload file
              </p>
            )}

            {uploadState === "file-selected" && file && (
              <div className="pointer-events-none">
                <p className="text-base font-semibold text-text-primary">
                  {file.name}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  {formatFileSize(file.size)} · {formatTimeAgo(file.lastModified)}
                </p>
                <div className="mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
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
                <p className="text-base font-medium text-accent">
                  Importing schedule...
                </p>
              </div>
            )}
          </div>

          {uploadState === "error" &&
            errorMessage &&
            !validationErrors.length && (
              <div className="bg-danger-soft/50 border border-danger/30 rounded-xl p-4">
                <p className="text-sm font-semibold text-danger">Import failed</p>
                <p className="text-sm text-text-secondary mt-1">{errorMessage}</p>
                {file && (
                  <button
                    onClick={removeFile}
                    className="text-sm text-danger font-medium mt-2 hover:underline"
                  >
                    Try a different file
                  </button>
                )}
              </div>
            )}

          {validationErrors.length > 0 && (
            <div className="bg-warning-soft/50 border border-warning/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-warning mb-2">
                {validationErrors.length} error
                {validationErrors.length !== 1 ? "s" : ""} found
              </p>
              <ul className="space-y-2">
                {validationErrors.slice(0, 5).map((err, i) => (
                  <li key={i} className="text-sm text-text-primary">
                    <span className="text-xs text-text-muted font-mono bg-bg-tertiary px-1.5 py-0.5 rounded mr-2">
                      {err.path || "root"}
                    </span>
                    {err.message}
                  </li>
                ))}
                {validationErrors.length > 5 && (
                  <li className="text-sm text-text-muted">
                    ...and {validationErrors.length - 5} more errors
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={downloadSchema}
              className="h-12 rounded-md bg-bg-secondary border border-border text-sm font-medium text-text-primary active:scale-[0.98] transition-all"
            >
              Download schema
            </button>
            <button
              onClick={downloadSample}
              className="h-12 rounded-md bg-bg-secondary border border-border text-sm font-medium text-text-primary active:scale-[0.98] transition-all"
            >
              Download sample
            </button>
          </div>

          <button
            onClick={handleImport}
            disabled={uploadState !== "file-selected"}
            className={`w-full h-12 rounded-xl font-semibold text-base transition-all duration-150 ${
              uploadState === "file-selected"
                ? "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-md"
                : "bg-bg-tertiary text-text-muted cursor-not-allowed"
            }`}
          >
            {uploadState === "uploading" ? "Importing..." : "Import Schedule"}
          </button>

          {uploadState === "success" && (
            <div className="rounded-2xl p-6 text-center bg-success-soft/50 border border-success/30 animate-fade-in">
              <h2 className="text-lg font-semibold text-text-primary mb-1">
                Schedule imported successfully!
              </h2>
              {taskCount !== null && (
                <p className="text-sm text-text-secondary mb-6">
                  {taskCount} task{taskCount !== 1 ? "s" : ""} loaded
                </p>
              )}
              <div className="space-y-2">
                <Link
                  to="/"
                  className="block w-full h-12 rounded-xl bg-success text-white font-semibold text-base flex items-center justify-center hover:bg-success/90 active:scale-[0.98] transition-all"
                >
                  View Dashboard
                </Link>
                <button
                  onClick={resetAndImportAnother}
                  className="w-full h-12 rounded-xl bg-bg-secondary text-text-primary font-semibold text-base border border-border hover:bg-bg-tertiary active:scale-[0.98] transition-all"
                >
                  Import Another
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            How it works
          </h3>
          <ol className="space-y-2">
            {[
              "Download the sample schedule to see the expected JSON format",
              "Customize it with your subjects, topics, and target dates",
              "Set your exam date and cycle length (e.g., 7-day week)",
              "Upload your file to generate all your study tasks",
            ].map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-text-secondary"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-soft text-accent text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
