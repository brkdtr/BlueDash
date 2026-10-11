import { Camera, CheckCheck, Clipboard, Download, FileImage, RotateCcw, Shield, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ExtractedEntry } from "../types";
import { QUIZLET_SET_TITLE } from "../types";
import { processPage } from "../lib/imagePipeline";
import { filterNewEntries, parseExistingTerms, quizletImportInstructions, toQuizletTsv } from "../lib/quizlet";
import { clearPrivateData, loadEntries, saveEntries } from "../lib/storage";

export function App() {
  const [entries, setEntries] = useState<ExtractedEntry[]>([]);
  const [existingRaw, setExistingRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Hazir");
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadEntries().then(setEntries).catch(() => setStatus("Kayitli veriler okunamadi."));
  }, []);

  useEffect(() => {
    saveEntries(entries).catch(() => setStatus("Yerel kayit guncellenemedi."));
  }, [entries]);

  const existingTerms = useMemo(() => parseExistingTerms(existingRaw), [existingRaw]);
  const exportable = useMemo(() => filterNewEntries(entries.filter((entry) => !entry.needsReview), existingTerms), [entries, existingTerms]);
  const tsv = useMemo(() => toQuizletTsv(exportable), [exportable]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setStatus(`${files.length} sayfa isleniyor...`);
    try {
      const batches: ExtractedEntry[][] = [];
      for (const file of Array.from(files)) {
        setStatus(`${file.name} icin OCR ve mavi isaret analizi yapiliyor...`);
        batches.push(await processPage(file));
      }
      setEntries((current) => [...current, ...batches.flat()]);
      setStatus("Tarama tamamlandi. Dusuk guvenli satirlari kontrol edin.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Tarama sirasinda hata olustu.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
      if (cameraInput.current) cameraInput.current.value = "";
    }
  }

  function updateEntry(id: string, patch: Partial<ExtractedEntry>) {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function deleteEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  async function copyTsv() {
    await navigator.clipboard.writeText(tsv);
    setStatus(`${exportable.length} yeni kelime panoya kopyalandi.`);
  }

  function downloadTsv() {
    const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "2027-YDS-quizlet.tsv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function wipeData() {
    await clearPrivateData();
    setEntries([]);
    setExistingRaw("");
    setStatus("Fotograflar ve yerel sonuclar silindi.");
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">BlueDash PWA</p>
          <h1>{QUIZLET_SET_TITLE}</h1>
        </div>
        <div className="privacy"><Shield size={18} /> Fotograflar bu cihazda saklanir</div>
      </section>

      <section className="workspace">
        <aside className="panel controls">
          <input ref={fileInput} hidden type="file" accept="image/*,.heic,.heif" multiple onChange={(event) => handleFiles(event.target.files)} />
          <input ref={cameraInput} hidden type="file" accept="image/*,.heic,.heif" capture="environment" onChange={(event) => handleFiles(event.target.files)} />
          <button className="primary" disabled={busy} onClick={() => fileInput.current?.click()}><FileImage /> Fotograf yukle</button>
          <button disabled={busy} onClick={() => cameraInput.current?.click()}><Camera /> Kamera ile tara</button>
          <button disabled={!entries.length} onClick={() => setEntries((rows) => rows.map((row) => ({ ...row, needsReview: false })))}><CheckCheck /> Toplu onayla</button>
          <button disabled={!entries.length} onClick={wipeData}><Trash2 /> Verileri sil</button>
          <div className="status" aria-live="polite">{status}</div>
          <label className="field">
            <span>Mevcut {QUIZLET_SET_TITLE} kelimeleri</span>
            <textarea
              value={existingRaw}
              onChange={(event) => setExistingRaw(event.target.value)}
              placeholder={"Quizlet'teki mevcut terimleri TSV veya virgullu bicimde buraya yapistir. Tekrarlar dislanir."}
            />
          </label>
          <p className="note">{quizletImportInstructions()}</p>
        </aside>

        <section className="panel results">
          <div className="result-header">
            <div>
              <h2>Bulunan kelimeler</h2>
              <p>{entries.length} satir, {exportable.length} yeni/onayli Quizlet satiri</p>
            </div>
            <div className="actions">
              <button disabled={!tsv} onClick={copyTsv}><Clipboard /> Kopyala</button>
              <button disabled={!tsv} onClick={downloadTsv}><Download /> TSV indir</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Onay</th>
                  <th>Kelime</th>
                  <th>Turkce karsilik</th>
                  <th>Guven</th>
                  <th>Isaret</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className={entry.needsReview ? "review" : ""}>
                    <td><input type="checkbox" checked={!entry.needsReview} onChange={(event) => updateEntry(entry.id, { needsReview: !event.target.checked })} /></td>
                    <td><input value={entry.term} onChange={(event) => updateEntry(entry.id, { term: event.target.value })} /></td>
                    <td><input value={entry.definition} onChange={(event) => updateEntry(entry.id, { definition: event.target.value, needsReview: false })} placeholder="Uydurulmaz; gerekirse sen yaz" /></td>
                    <td><span className={`pill ${entry.confidence}`}>{entry.confidence}</span></td>
                    <td>{entry.markKind}{entry.duplicateOf ? " / tekrar" : ""}</td>
                    <td><button className="icon" aria-label="Satiri sil" onClick={() => deleteEntry(entry.id)}><Trash2 size={16} /></button></td>
                  </tr>
                ))}
                {!entries.length && (
                  <tr><td colSpan={6} className="empty">Fotograf yukleyince isaretli kelimeler burada duzenlenebilir tabloya duser.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <details className="export-preview">
            <summary>Quizlet TSV onizleme</summary>
            <pre>{tsv || "Onayli yeni kelime yok."}</pre>
          </details>
          <button className="reset" onClick={() => setEntries((rows) => rows.map((row) => ({ ...row, duplicateOf: undefined })))}><RotateCcw /> Tekrar isaretlerini temizle</button>
        </section>
      </section>
    </main>
  );
}
