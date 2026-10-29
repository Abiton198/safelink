import React, { useMemo, useState } from "react";
import { QRCode } from "react-qrcode-logo";

type PaperSize = "A4" | "A5";
type GeneratorMode = "link" | "empty";

type QRLabel = {
    id: number;
    value: string;
};

const MAX_CODES = 500;

const PAPER_DIMENSIONS: Record<
    PaperSize,
    { width: number; height: number }
> = {
    A4: { width: 210, height: 297 },
    A5: { width: 148, height: 210 },
};

export default function QRBatchGenerator() {
    const [count, setCount] = useState<number>(12);
    const [paperSize, setPaperSize] = useState<PaperSize>("A4");
    const [mode, setMode] = useState<GeneratorMode>("link");
    const [url, setUrl] = useState("https://safelink.co.za");
    const [labelPrefix, setLabelPrefix] = useState("SafeLink");
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [message, setMessage] = useState("");

    // Keep the number within the supported browser-rendering range.
    const safeCount = Math.max(
        1,
        Math.min(MAX_CODES, Math.floor(Number(count) || 1))
    );

    // Calculate a grid that uses the selected paper's proportions.
    const columns = useMemo(() => {
        const dimensions = PAPER_DIMENSIONS[paperSize];
        const aspectRatio = dimensions.width / dimensions.height;

        return Math.max(
            1,
            Math.ceil(Math.sqrt(safeCount * aspectRatio))
        );
    }, [safeCount, paperSize]);

    // Empty mode deliberately produces blank QR placeholders, not fake QR data.
    const labels: QRLabel[] = useMemo(
        () =>
            Array.from({ length: safeCount }, (_, index) => ({
                id: index + 1,
                value: mode === "link" ? url.trim() : "",
            })),
        [safeCount, mode, url]
    );

    function validateLink(): boolean {
        if (mode !== "link") return true;

        try {
            const parsed = new URL(url.trim());

            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                throw new Error("Use an HTTP or HTTPS link.");
            }

            return true;
        } catch {
            setMessage("Enter a valid link beginning with https:// or http://.");
            return false;
        }
    }

    function handleGenerate() {
        if (!validateLink()) return;

        setMessage(
            mode === "link"
                ? `${safeCount} QR label${safeCount === 1 ? "" : "s"} ready.`
                : `${safeCount} blank label${safeCount === 1 ? "" : "s"} ready.`
        );
    }

    function downloadQRCode(id: number) {
        if (mode !== "link") {
            setMessage("Blank labels do not contain a QR image to download.");
            return;
        }

        const container = document.querySelector(
            `[data-qr-label="${id}"]`
        );

        const canvas = container?.querySelector("canvas");

        if (!(canvas instanceof HTMLCanvasElement)) {
            setMessage(`Could not find the QR image for label ${id}.`);
            return;
        }

        const downloadLink = document.createElement("a");
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.download = `safelink-qr-${String(id).padStart(3, "0")}.png`;
        downloadLink.click();

        setMessage(`Downloaded QR label ${id}.`);
    }

    function printLabels() {
        if (!validateLink()) return;

        // The print stylesheet selects A4 or A5 and keeps labels together.
        const dimensions = PAPER_DIMENSIONS[paperSize];

        const printStyles = `
      @page {
        size: ${paperSize};
        margin: 8mm;
      }

      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
          color: #000 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        body * {
          visibility: hidden;
        }

        #qr-print-area,
        #qr-print-area * {
          visibility: visible;
        }

        #qr-print-area {
          display: block !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 0 !important;
          margin: 0 !important;
          background: #fff !important;
        }

        #qr-print-grid {
          display: grid !important;
          grid-template-columns: repeat(${columns}, minmax(0, 1fr));
          gap: 3mm;
          width: 100%;
          align-items: stretch;
        }

        .qr-label {
          box-sizing: border-box;
          min-width: 0;
          padding: 2mm;
          border: 0.25mm solid #bbb !important;
          border-radius: 1mm;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
          overflow: hidden;
          background: white !important;
          color: black !important;
        }

        .qr-label canvas {
          display: block;
          width: 85% !important;
          height: auto !important;
          max-width: 100%;
          max-height: ${Math.min(
            32,
            (dimensions.height - 16) / Math.max(
                1,
                Math.ceil(safeCount / columns)
            )
        )}mm !important;
          object-fit: contain;
          margin: 0 auto;
        }

        .qr-empty-box {
          box-sizing: border-box;
          width: 85%;
          aspect-ratio: 1 / 1;
          max-width: 100%;
          border: 0.4mm dashed #777;
          margin: 0 auto;
        }

        .qr-label-title {
          font-size: 9pt;
          font-weight: bold;
          margin-top: 1mm;
          overflow-wrap: anywhere;
        }

        .qr-label-number {
          font-size: 7pt;
          margin-top: 1mm;
        }

        .no-print {
          display: none !important;
        }
      }
    `;

        const existing = document.getElementById("qr-batch-print-styles");
        existing?.remove();

        const style = document.createElement("style");
        style.id = "qr-batch-print-styles";
        style.textContent = printStyles;
        document.head.appendChild(style);

        setTimeout(() => {
            window.print();
        }, 150);
    }

    const paperDimensions = PAPER_DIMENSIONS[paperSize];

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-6 text-slate-800">
            {/* Configuration panel */}
            <section className="no-print mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                <div className="mb-6">
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                        SafeLink tools
                    </p>

                    <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                        QR Batch Generator
                    </h1>

                    <p className="mt-2 text-sm text-slate-600">
                        Create QR labels or blank placeholders, preview the layout,
                        download individual QR images, or print on A4 or A5 paper.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Number of labels */}
                    <label className="block">
                        <span className="mb-1 block text-sm font-semibold">
                            Number of labels
                        </span>

                        <input
                            type="number"
                            min={1}
                            max={MAX_CODES}
                            step={1}
                            value={count}
                            onChange={(event) => {
                                setCount(Number(event.target.value));
                                setMessage("");
                            }}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />

                        <span className="mt-1 block text-xs text-slate-500">
                            Enter 1–{MAX_CODES}. Larger batches may need several print pages.
                        </span>
                    </label>

                    {/* Paper size */}
                    <label className="block">
                        <span className="mb-1 block text-sm font-semibold">
                            Paper size
                        </span>

                        <select
                            value={paperSize}
                            onChange={(event) =>
                                setPaperSize(event.target.value as PaperSize)
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="A4">A4 — 210 × 297 mm</option>
                            <option value="A5">A5 — 148 × 210 mm</option>
                        </select>

                        <span className="mt-1 block text-xs text-slate-500">
                            The printable layout adjusts to the selected paper.
                        </span>
                    </label>

                    {/* Mode */}
                    <fieldset>
                        <legend className="mb-2 text-sm font-semibold">
                            What do you want to generate?
                        </legend>

                        <div className="space-y-2">
                            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                                <input
                                    type="radio"
                                    name="qr-mode"
                                    checked={mode === "link"}
                                    onChange={() => {
                                        setMode("link");
                                        setMessage("");
                                    }}
                                    className="mt-1"
                                />

                                <span>
                                    <span className="block font-medium">
                                        QR codes containing a link
                                    </span>
                                    <span className="block text-xs text-slate-500">
                                        Each QR code will contain the URL entered below.
                                    </span>
                                </span>
                            </label>

                            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                                <input
                                    type="radio"
                                    name="qr-mode"
                                    checked={mode === "empty"}
                                    onChange={() => {
                                        setMode("empty");
                                        setMessage("");
                                    }}
                                    className="mt-1"
                                />

                                <span>
                                    <span className="block font-medium">
                                        Blank QR placeholders
                                    </span>
                                    <span className="block text-xs text-slate-500">
                                        Print empty squares for labels that will receive codes later.
                                    </span>
                                </span>
                            </label>
                        </div>
                    </fieldset>

                    {/* Label settings */}
                    <div className="space-y-4">
                        {mode === "link" && (
                            <label className="block">
                                <span className="mb-1 block text-sm font-semibold">
                                    Link to encode
                                </span>

                                <input
                                    type="url"
                                    value={url}
                                    onChange={(event) => {
                                        setUrl(event.target.value);
                                        setMessage("");
                                    }}
                                    placeholder="https://example.com"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />

                                <span className="mt-1 block text-xs text-slate-500">
                                    Every QR code in this batch will encode this same link.
                                </span>
                            </label>
                        )}

                        <label className="block">
                            <span className="mb-1 block text-sm font-semibold">
                                Label title
                            </span>

                            <input
                                type="text"
                                value={labelPrefix}
                                onChange={(event) => setLabelPrefix(event.target.value)}
                                maxLength={40}
                                placeholder="SafeLink"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            />
                        </label>

                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={includeNumbers}
                                onChange={(event) =>
                                    setIncludeNumbers(event.target.checked)
                                }
                            />
                            Print a number under each label
                        </label>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={handleGenerate}
                        className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
                    >
                        Generate labels
                    </button>

                    <button
                        type="button"
                        onClick={printLabels}
                        className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
                    >
                        Print / Save as PDF
                    </button>
                </div>

                {message && (
                    <p
                        role="status"
                        className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800"
                    >
                        {message}
                    </p>
                )}
            </section>

            {/* Preview and printable area */}
            <section id="qr-print-area">
                <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Label preview</h2>
                        <p className="text-sm text-slate-500">
                            {safeCount} label{safeCount === 1 ? "" : "s"} · {paperSize} paper
                            · {columns} column{columns === 1 ? "" : "s"}
                        </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                        Preview only — check print settings before printing
                    </span>
                </div>

                <div
                    id="qr-print-grid"
                    className="grid gap-3"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    }}
                >
                    {labels.map((label) => (
                        <article
                            key={label.id}
                            data-qr-label={label.id}
                            className="qr-label flex min-w-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm"
                        >
                            <div className="flex w-full flex-col items-center">
                                {mode === "link" && url.trim() ? (
                                    <QRCode
                                        value={url.trim()}
                                        size={220}
                                        ecLevel="H"
                                        quietZone={8}
                                    />
                                ) : (
                                    <div
                                        className="qr-empty-box flex w-full items-center justify-center"
                                        style={{ maxWidth: 220 }}
                                        aria-label="Blank QR placeholder"
                                    >
                                        <span className="no-print text-xs text-slate-400">
                                            Empty
                                        </span>
                                    </div>
                                )}

                                {labelPrefix.trim() && (
                                    <p className="qr-label-title mt-2 break-words text-sm font-semibold">
                                        {labelPrefix.trim()}
                                    </p>
                                )}

                                {includeNumbers && (
                                    <p className="qr-label-number mt-1 text-xs text-slate-500">
                                        {String(label.id).padStart(3, "0")}
                                    </p>
                                )}
                            </div>

                            {mode === "link" && (
                                <button
                                    type="button"
                                    onClick={() => downloadQRCode(label.id)}
                                    className="no-print mt-3 rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                >
                                    Download PNG
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            </section>

            {/* Important usage note */}
            <aside className="no-print mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <strong>SafeLink security note:</strong> This component creates
                client-side QR labels. In link mode, all codes contain the same URL.
                For customer-specific SafeLink tags, use unique tokens generated by
                your authenticated backend inventory process. Never use blank labels
                or repeated generic links as a substitute for unique, claimable tags.
            </aside>
        </main>
    );
}