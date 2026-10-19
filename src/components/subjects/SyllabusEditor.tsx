import React, { useState } from 'react';
import { Unit, Topic } from '@/types/database';
import { useData } from '@/context/DataContext';
import { Plus, Trash2, CheckCircle2, Clock, Edit2, Check, FileUp, Sparkles, X } from 'lucide-react';

interface SyllabusEditorProps {
  subjectId: string;
  onOpenPdfImport: () => void;
}

export const SyllabusEditor: React.FC<SyllabusEditorProps> = ({
  subjectId,
  onOpenPdfImport,
}) => {
  const { getUnitsWithTopics, addUnit, deleteUnit, addTopic, deleteTopic, toggleTopicCompleted, updateTopic } =
    useData();

  const unitsWithTopics = getUnitsWithTopics(subjectId);

  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [topicInputs, setTopicInputs] = useState<{ [unitId: string]: { title: string; periods: number } }>({});
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPeriods, setEditPeriods] = useState(1);

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitTitle.trim()) return;
    addUnit(subjectId, newUnitTitle.trim());
    setNewUnitTitle('');
  };

  const handleAddTopic = (unitId: string) => {
    const input = topicInputs[unitId];
    if (!input || !input.title.trim()) return;
    addTopic(unitId, subjectId, input.title.trim(), input.periods || 1);
    setTopicInputs((prev) => ({
      ...prev,
      [unitId]: { title: '', periods: 1 },
    }));
  };

  const handleStartEdit = (topic: Topic) => {
    setEditingTopicId(topic.id);
    setEditTitle(topic.title);
    setEditPeriods(topic.estimated_periods);
  };

  const handleSaveEdit = (topic: Topic) => {
    if (!editTitle.trim()) return;
    updateTopic({
      ...topic,
      title: editTitle.trim(),
      estimated_periods: Math.max(1, editPeriods),
    });
    setEditingTopicId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar: Manual add unit & PDF import trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--subtle-surface)] p-4 rounded-xl border border-[var(--border-color)]">
        <form onSubmit={handleAddUnit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={newUnitTitle}
            onChange={(e) => setNewUnitTitle(e.target.value)}
            placeholder="Add Unit / Module title (e.g. Unit 3: Dynamic Analysis)..."
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)]"
          />
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Unit
          </button>
        </form>

        <button
          onClick={onOpenPdfImport}
          className="px-3.5 py-2 text-xs font-medium text-[var(--primary-text)] bg-[var(--main-bg)] hover:bg-[var(--hover-bg)] rounded-lg border border-[var(--border-color)] transition-colors shrink-0 flex items-center justify-center gap-1.5"
        >
          <FileUp className="w-3.5 h-3.5 text-[var(--secondary-text)]" />
          Import from Syllabus PDF
        </button>
      </div>

      {/* Units List */}
      <div className="space-y-4">
        {unitsWithTopics.length === 0 ? (
          <div className="p-8 text-center bg-[var(--main-bg)] rounded-xl border border-dashed border-[var(--border-color)]">
            <Sparkles className="w-8 h-8 text-[var(--secondary-text)] opacity-40 mx-auto mb-2" />
            <h4 className="text-xs font-medium text-[var(--primary-text)]">No syllabus units created yet</h4>
            <p className="text-[11px] text-[var(--secondary-text)] mt-1 max-w-sm mx-auto">
              Add your first unit above, or upload your college syllabus PDF to extract units and topics automatically.
            </p>
          </div>
        ) : (
          unitsWithTopics.map((unit) => {
            const curInput = topicInputs[unit.id] || { title: '', periods: 1 };
            const topics = unit.topics || [];

            return (
              <div
                key={unit.id}
                className="bg-[var(--main-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden"
              >
                {/* Unit Header */}
                <div className="p-3.5 bg-[var(--subtle-surface)] border-b border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--primary-text)]">
                      {unit.title}
                    </span>
                    <span className="text-[10px] font-medium text-[var(--secondary-text)] bg-[var(--hover-bg)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                      {topics.length} topics
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`Delete ${unit.title} and its topics?`)) {
                        deleteUnit(unit.id);
                      }
                    }}
                    className="p-1 text-[var(--secondary-text)] hover:text-rose-600 rounded transition-colors"
                    title="Delete Unit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Topics in this unit */}
                <div className="divide-y divide-[var(--border-color)]">
                  {topics.map((topic) => {
                    const isEditing = editingTopicId === topic.id;

                    return (
                      <div
                        key={topic.id}
                        className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                          topic.is_completed
                            ? 'bg-[var(--subtle-surface)]/50'
                            : 'hover:bg-[var(--hover-bg)]'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] focus:outline-none"
                            />
                            <div className="flex items-center gap-1 bg-[var(--subtle-surface)] px-2 py-1 rounded-lg border border-[var(--border-color)]">
                              <span className="text-[10px] text-[var(--secondary-text)]">Periods:</span>
                              <input
                                type="number"
                                min={1}
                                max={10}
                                value={editPeriods}
                                onChange={(e) => setEditPeriods(parseInt(e.target.value) || 1)}
                                className="w-8 text-xs font-mono text-center bg-transparent text-[var(--primary-text)] focus:outline-none"
                              />
                            </div>
                            <button
                              onClick={() => handleSaveEdit(topic)}
                              className="p-1 text-emerald-600 hover:bg-emerald-500/10 rounded-lg"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTopicId(null)}
                              className="p-1 text-[var(--secondary-text)] hover:bg-[var(--hover-bg)] rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <button
                                onClick={() => toggleTopicCompleted(topic.id, !topic.is_completed)}
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  topic.is_completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-[var(--border-color)] hover:border-[var(--secondary-text)]'
                                }`}
                              >
                                {topic.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>
                              <span
                                className={`truncate font-medium ${
                                  topic.is_completed
                                    ? 'line-through text-[var(--secondary-text)] opacity-75'
                                    : 'text-[var(--primary-text)]'
                                }`}
                              >
                                {topic.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-[11px] text-[var(--secondary-text)] font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 opacity-60" />
                                {topic.estimated_periods} {topic.estimated_periods === 1 ? 'period' : 'periods'}
                              </span>

                              <button
                                onClick={() => handleStartEdit(topic)}
                                className="p-1 text-[var(--secondary-text)] hover:text-[var(--primary-text)]"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => deleteTopic(topic.id)}
                                className="p-1 text-[var(--secondary-text)] hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Inline Topic Addition Input */}
                <div className="p-3 bg-[var(--subtle-surface)] border-t border-[var(--border-color)] flex items-center gap-2">
                  <input
                    type="text"
                    value={curInput.title}
                    onChange={(e) =>
                      setTopicInputs((prev) => ({
                        ...prev,
                        [unit.id]: { ...curInput, title: e.target.value },
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic(unit.id);
                      }
                    }}
                    placeholder="Add topic name (e.g. Intermediate Representation)..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--primary-text)] placeholder-[var(--secondary-text)] opacity-90 focus:outline-none focus:border-[var(--secondary-text)]"
                  />
                  <div className="flex items-center gap-1 bg-[var(--main-bg)] px-2 py-1 rounded-lg border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--secondary-text)]">Periods:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={curInput.periods}
                      onChange={(e) =>
                        setTopicInputs((prev) => ({
                          ...prev,
                          [unit.id]: { ...curInput, periods: parseInt(e.target.value) || 1 },
                        }))
                      }
                      className="w-8 text-xs font-mono text-center bg-transparent text-[var(--primary-text)] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTopic(unit.id)}
                    className="px-3 py-1.5 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:opacity-90 rounded-lg transition-opacity shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
