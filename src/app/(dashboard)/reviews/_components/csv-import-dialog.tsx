"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { parseCsv, truncate } from "../_lib/helpers";
import { csvReviewRowSchema } from "@/lib/validation/schemas";
import { importReviewsCsv } from "@/lib/actions/review-actions";
import type { CsvImportResult } from "@/lib/actions/review-actions";

// Required headers for a valid CSV
const REQUIRED_HEADERS = [
  "reviewer_name",
  "rating",
  "review_text",
  "platform",
  "review_date",
];

type Step = "upload" | "preview" | "result";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: { id: string; name: string }[];
  onSuccess: () => void;
}

export function CsvImportDialog({
  open,
  onOpenChange,
  locations,
  onSuccess,
}: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [isPending, startTransition] = useTransition();
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [rowValidation, setRowValidation] = useState<
    { valid: boolean; error?: string }[]
  >([]);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(
    null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setHeaders([]);
    setRows([]);
    setRowValidation([]);
    setImportResult(null);
    setUploadError(null);
    setLocationId(locations[0]?.id ?? "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [locations]);

  // ---- File selection & parsing ----
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadError(null);

      if (!file.name.endsWith(".csv")) {
        setUploadError("Please select a .csv file");
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const { headers: h, rows: r } = parseCsv(text);

        // Validate headers
        const missing = REQUIRED_HEADERS.filter(
          (rh) => !h.includes(rh)
        );
        if (missing.length > 0) {
          setUploadError(
            `Missing required columns: ${missing.join(", ")}. Required: ${REQUIRED_HEADERS.join(", ")}`
          );
          return;
        }

        if (r.length === 0) {
          setUploadError("CSV file has no data rows");
          return;
        }

        // Validate each row
        const validation = r.map((row) => {
          const result = csvReviewRowSchema.safeParse(row);
          if (result.success) return { valid: true };
          const msg =
            Object.values(result.error.flatten().fieldErrors).flat()[0] ??
            "Invalid";
          return { valid: false, error: msg };
        });

        setHeaders(h);
        setRows(r);
        setRowValidation(validation);
        setStep("preview");
      };
      reader.readAsText(file);
    },
    []
  );

  // ---- Import ----
  const validCount = rowValidation.filter((r) => r.valid).length;
  const invalidCount = rowValidation.filter((r) => !r.valid).length;

  const handleImport = useCallback(() => {
    startTransition(async () => {
      // Only send valid rows
      const validRows = rows.filter((_, i) => rowValidation[i]?.valid);
      const result = await importReviewsCsv(validRows, locationId);
      setImportResult(result);
      setStep("result");
      if (!result.error && result.imported > 0) {
        onSuccess();
      }
    });
  }, [rows, rowValidation, locationId, onSuccess]);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) reset();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import Reviews from CSV"}
            {step === "preview" && "Preview Import"}
            {step === "result" && "Import Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload a CSV file with columns: reviewer_name, rating, review_text, platform, review_date"}
            {step === "preview" &&
              `${validCount} valid rows, ${invalidCount} invalid — only valid rows will be imported.`}
            {step === "result" && "Here's a summary of your import."}
          </DialogDescription>
        </DialogHeader>

        {/* ---- Step: Upload ---- */}
        {step === "upload" && (
          <div className="space-y-4">
            {/* Location select */}
            <div className="space-y-1.5">
              <Label>
                Target Location <span className="text-destructive">*</span>
              </Label>
              <Select
                value={locationId}
                onValueChange={(val) => setLocationId(val ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dropzone */}
            <div
              className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 transition-colors hover:border-muted-foreground/40 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileChange}
              />
              <Upload className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Click to upload or drag a CSV file
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max 1000 rows per import
              </p>
            </div>

            {/* Upload error */}
            {uploadError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{uploadError}</p>
              </div>
            )}

            {/* Format hint */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium mb-1">Expected CSV format:</p>
              <code className="text-[11px] text-muted-foreground block">
                reviewer_name,rating,review_text,platform,review_date
                <br />
                &quot;John Smith&quot;,5,&quot;Great service!&quot;,Google,2025-01-15
              </code>
            </div>
          </div>
        )}

        {/* ---- Step: Preview ---- */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{fileName}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {rows.length} rows
              </span>
              <button
                onClick={() => {
                  reset();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Summary chips */}
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> {validCount} valid
              </span>
              {invalidCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="h-3 w-3" /> {invalidCount} invalid
                </span>
              )}
            </div>

            {/* Preview table */}
            <div className="max-h-[320px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10 text-xs">#</TableHead>
                    <TableHead className="text-xs">Reviewer</TableHead>
                    <TableHead className="text-xs w-14">Rating</TableHead>
                    <TableHead className="text-xs">Review</TableHead>
                    <TableHead className="text-xs">Platform</TableHead>
                    <TableHead className="text-xs w-16">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((row, i) => {
                    const v = rowValidation[i];
                    return (
                      <TableRow
                        key={i}
                        className={!v?.valid ? "bg-red-50/50 dark:bg-red-950/10" : ""}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell className="text-xs">
                          {truncate(row.reviewer_name || "—", 20)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.rating || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {truncate(row.review_text || "—", 40)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.platform || "—"}
                        </TableCell>
                        <TableCell>
                          {v?.valid ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <span
                              className="text-[10px] text-red-600"
                              title={v?.error}
                            >
                              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {rows.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Showing first 50 of {rows.length} rows
                </p>
              )}
            </div>
          </div>
        )}

        {/* ---- Step: Result ---- */}
        {step === "result" && importResult && (
          <div className="space-y-4">
            {importResult.error ? (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Import failed
                  </p>
                  <p className="text-sm text-destructive/80">
                    {importResult.error}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Successfully imported {importResult.imported} reviews
                  </p>
                  {importResult.skipped > 0 && (
                    <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">
                      {importResult.skipped} rows were skipped due to
                      validation errors
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Row-level errors */}
            {importResult.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Row errors:
                </p>
                <div className="max-h-[140px] overflow-auto rounded-lg border p-2 space-y-0.5">
                  {importResult.errors.map((e, i) => (
                    <p key={i} className="text-xs text-red-600">
                      Row {e.row}: {e.message}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={reset}
                disabled={isPending}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={isPending || validCount === 0}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  `Import ${validCount} Reviews`
                )}
              </Button>
            </>
          )}
          {step === "result" && (
            <Button
              size="sm"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
