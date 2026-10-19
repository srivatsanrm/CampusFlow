import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Trash2, Plus, Edit2 } from 'lucide-react';
import { extractTextFromPDF, parseSyllabusText, ExtractedUnit } from '@/engine/pdfImportEngine';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
}

export const PdfImportModal: React.FC<PdfImportModalProps> = ({ isOpen, onClose, subjectId }) => {
  const { batchSaveUnitsAndTopics } = useData();

  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedUnits, setExtractedUnits] = useState<ExtractedUnit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF document.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('PDF file size exceeds 10MB limit.');
      return;
    }

    setError(null);
    setFileName(file.name);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const rawText = await extractTextFromPDF(buffer);

      if (!rawText || rawText.trim().length < 20) {
        setError(
          'Could not extract readable text from this PDF. The document may be an image scan or password-protected, which requires OCR or manual syllabus entry.'
        );
        setIsProcessing(false);
        return;
      }

      const parsed = parseSyllabusText(rawText);
      if (parsed.units.length === 0) {
        setError('No distinct units or topics could be recognized automatically. You can enter them manually.');
      } else {
        setExtractedUnits(parsed.units);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to process PDF document. Please verify the file or use manual entry.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToSubject = () => {
    if (extractedUnits.length === 0) return;
    batchSaveUnitsAndTopics(subjectId, extractedUnits);
    onClose();
  };

  const handleRemoveUnit = (idx: number) => {
    setExtractedUnits((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveTopic = (uIdx: number, tIdx: number) => {
    setExtractedUnits((prev) =>
      prev.map((u, i) => {
        if (i !== uIdx) return u;
        return {
          ...u,
          topics: u.topics.filter((_, j) => j !== tIdx),
        };
      })
    );
  };

  const handleTopicPeriodChange = (uIdx: number, tIdx: number, periods: number) => {
    setExtractedUnits((prev) =>
      prev.map((u, i) => {
        if (i !== uIdx) return u;
        return {
          ...u,
          topics: u.topics.map((t, j) => (j === tIdx ? { ...t, estimated_periods: Math.max(1, periods) } : t)),
        };
      })
    );
  };

  // Sample quick syllabus text paste for testing without needing a local PDF file
  const handleLoadSampleSyllabus = () => {
    const sampleText = `
UNIT I: INTRODUCTION TO SOFTWARE ARCHITECTURE
Software Architecture concepts, Architecture views and models, Quality attributes and non-functional requirements.

UNIT II: ARCHITECTURAL PATTERNS AND STYLES
Layered patterns, Client-server and Pipe-and-Filter architectures, Event-driven architecture and microservices, Service-oriented architecture.

UNIT III: DESIGN PATTERNS IN PRACTICE
Creational patterns (Singleton, Factory Method), Structural patterns (Adapter, Decorator, Facade), Behavioral patterns (Observer, Strategy).
`;
    const parsed = parseSyllabusText(sampleText);
    setExtractedUnits(parsed.units);
    setFileName('Sample-University-Syllabus.pdf');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--subtle-surface)] text-[var(--primary-text)] rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--primary-text)]">
                Import Syllabus from PDF
              </h3>
              <p className="text-xs text-[var(--secondary-text)]">
                Client-side extraction with editable preview before saving
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--secondary-text)] hover:text-[var(--primary-text)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload Dropzone */}
        {extractedUnits.length === 0 ? (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary-text)] rounded-xl cursor-pointer bg-[var(--subtle-surface)] transition-colors">
              <Upload className="w-8 h-8 text-[var(--secondary-text)] mb-2" />
              <span className="text-xs font-semibold text-[var(--primary-text)]">
                {isProcessing ? 'Extracting text and units from PDF...' : 'Click to select or drop syllabus PDF'}
              </span>
              <span className="text-[11px] text-[var(--secondary-text)] mt-0.5">
                PDF up to 10MB • Text is parsed safely in your browser
              </span>
              <input
                type="file"
                accept="application/pdf"
                disabled={isProcessing}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="text-center pt-2">
              <span className="text-xs text-[var(--secondary-text)]">Or test with demo text: </span>
              <button
                type="button"
                onClick={handleLoadSampleSyllabus}
                className="text-xs text-[var(--primary-text)] font-semibold hover:underline"
              >
                Load Sample Syllabus Preview
              </button>
            </div>
          </div>
        ) : (
          /* Editable Preview Area */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--primary-text)] bg-[var(--subtle-surface)] p-2.5 rounded-lg border border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Extracted from {fileName}: {extractedUnits.length} units detected</span>
              </div>
              <button
                type="button"
                onClick={() => setExtractedUnits([])}
                className="text-rose-600 dark:text-rose-400 hover:underline"
              >
                Clear & re-upload
              </button>
            </div>

            {extractedUnits.map((unit, uIdx) => (
              <div
                key={uIdx}
                className="p-3 bg-[var(--main-bg)] rounded-lg border border-[var(--border-color)] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={unit.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExtractedUnits((prev) =>
                        prev.map((u, i) => (i === uIdx ? { ...u, title: val } : u))
                      );
                    }}
                    className="text-xs font-semibold text-[var(--primary-text)] bg-transparent border-b border-transparent hover:border-[var(--border-color)] focus:outline-none focus:border-[var(--primary-text)] w-full mr-2"
                  />
                  <button
                    onClick={() => handleRemoveUnit(uIdx)}
                    className="text-[var(--secondary-text)] hover:text-rose-600 p-1 transition-colors"
                    title="Remove unit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 pl-2 border-l-2 border-[var(--border-color)]">
                  {unit.topics.map((topic, tIdx) => (
                    <div
                      key={tIdx}
                      className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded hover:bg-[var(--hover-bg)] transition-colors"
                    >
                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExtractedUnits((prev) =>
                            prev.map((u, i) => {
                              if (i !== uIdx) return u;
                              return {
                                ...u,
                                topics: u.topics.map((t, j) => (j === tIdx ? { ...t, title: val } : t)),
                              };
                            })
                          );
                        }}
                        className="flex-1 bg-transparent text-[var(--primary-text)] focus:outline-none"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-[var(--secondary-text)]">Periods:</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={topic.estimated_periods}
                          onChange={(e) => handleTopicPeriodChange(uIdx, tIdx, parseInt(e.target.value) || 1)}
                          className="w-8 text-center text-xs font-mono rounded border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)]"
                        />
                        <button
                          onClick={() => handleRemoveTopic(uIdx, tIdx)}
                          className="p-1 text-[var(--secondary-text)] hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[var(--secondary-text)] hover:text-[var(--primary-text)] hover:bg-[var(--hover-bg)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          {extractedUnits.length > 0 && (
            <button
              type="button"
              onClick={handleSaveToSubject}
              className="px-4 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity"
            >
              Approve & Save Syllabus
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
