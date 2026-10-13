import React, { useState, useEffect } from 'react';
import type { FormFieldConfig, FormFieldType } from '../../types/event';
import { eventService } from '../../services/eventService';
import { Button } from '../common/Button';

interface FormBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  initialSchema?: FormFieldConfig[];
  initialVersion?: number;
  onSaved?: (updatedVersion: number) => void;
}

const PRESET_FIELDS: Array<{ label: string; type: FormFieldType; required: boolean; choices?: string[] }> = [
  { label: 'Full Name', type: 'text', required: true },
  { label: 'Student ID / Roll No', type: 'text', required: true },
  { label: 'College Email', type: 'email', required: true },
  {
    label: 'Department',
    type: 'dropdown',
    required: true,
    choices: ['Computer Science & Engineering', 'Data Science', 'AI & ML', 'Cyber Security', 'Electronics (ECE)', 'Mechanical', 'Civil'],
  },
  {
    label: 'Year of Study',
    type: 'dropdown',
    required: true,
    choices: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
  },
  { label: 'Phone Number', type: 'phone', required: false },
  { label: 'GitHub / Portfolio URL', type: 'url', required: false },
  { label: 'I agree to event rules & code of conduct', type: 'checkbox', required: true },
];

export const FormBuilderModal: React.FC<FormBuilderModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  initialSchema = [],
  initialVersion = 1,
  onSaved,
}) => {
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(initialVersion);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Field editor state
  const [editLabel, setEditLabel] = useState('');
  const [editType, setEditType] = useState<FormFieldType>('text');
  const [editRequired, setEditRequired] = useState(false);
  const [editPlaceholder, setEditPlaceholder] = useState('');
  const [editHelpText, setEditHelpText] = useState('');
  const [editChoices, setEditChoices] = useState<string[]>([]);
  const [newChoiceInput, setNewChoiceInput] = useState('');
  const [editMin, setEditMin] = useState<number | ''>('');
  const [editMax, setEditMax] = useState<number | ''>('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFields(initialSchema.length > 0 ? JSON.parse(JSON.stringify(initialSchema)) : []);
      setCurrentVersion(initialVersion || 1);
      setEditingFieldId(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setActiveTab('builder');
    }
  }, [isOpen, initialSchema, initialVersion]);

  if (!isOpen) return null;

  const generateStableId = () => `field_${Math.random().toString(36).substring(2, 9)}`;

  const handleStartAddField = () => {
    const newId = generateStableId();
    setEditingFieldId(newId);
    setEditLabel('New Question');
    setEditType('text');
    setEditRequired(false);
    setEditPlaceholder('');
    setEditHelpText('');
    setEditChoices([]);
    setEditMin('');
    setEditMax('');
  };

  const handleApplyPreset = (preset: typeof PRESET_FIELDS[0]) => {
    const newField: FormFieldConfig = {
      id: generateStableId(),
      label: preset.label,
      type: preset.type,
      required: preset.required,
      order: fields.length,
      choices: preset.choices ? [...preset.choices] : undefined,
      enabled: true,
    };
    setFields((prev) => [...prev, newField]);
  };

  const handleEditField = (field: FormFieldConfig) => {
    setEditingFieldId(field.id);
    setEditLabel(field.label);
    setEditType(field.type);
    setEditRequired(field.required);
    setEditPlaceholder(field.placeholder || '');
    setEditHelpText(field.helpText || '');
    setEditChoices(field.choices ? [...field.choices] : []);
    setEditMin(field.validation?.min !== undefined ? field.validation.min : '');
    setEditMax(field.validation?.max !== undefined ? field.validation.max : '');
  };

  const handleSaveFieldConfig = () => {
    if (!editLabel.trim()) {
      setErrorMessage('Field label cannot be empty.');
      return;
    }

    if ((editType === 'dropdown' || editType === 'radio' || editType === 'select') && editChoices.length === 0) {
      setErrorMessage(`Options are required for ${editType} fields.`);
      return;
    }

    setErrorMessage(null);

    const updatedField: FormFieldConfig = {
      id: editingFieldId!,
      label: editLabel.trim(),
      type: editType,
      required: editRequired,
      placeholder: editPlaceholder.trim() || undefined,
      helpText: editHelpText.trim() || undefined,
      order: fields.findIndex((f) => f.id === editingFieldId) !== -1
        ? fields.find((f) => f.id === editingFieldId)!.order
        : fields.length,
      choices: editChoices.length > 0 ? editChoices : undefined,
      enabled: true,
      validation: {
        min: typeof editMin === 'number' ? editMin : undefined,
        max: typeof editMax === 'number' ? editMax : undefined,
      },
    };

    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === editingFieldId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = updatedField;
        return next;
      }
      return [...prev, updatedField];
    });

    setEditingFieldId(null);
  };

  const handleDeleteField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id).map((f, i) => ({ ...f, order: i })));
    if (editingFieldId === id) {
      setEditingFieldId(null);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFields((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy.map((f, i) => ({ ...f, order: i }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === fields.length - 1) return;
    setFields((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy.map((f, i) => ({ ...f, order: i }));
    });
  };

  const handleAddChoice = () => {
    if (newChoiceInput.trim()) {
      setEditChoices((prev) => [...prev, newChoiceInput.trim()]);
      setNewChoiceInput('');
    }
  };

  const handleRemoveChoice = (idx: number) => {
    setEditChoices((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAndPublish = async () => {
    if (fields.length === 0) {
      setErrorMessage('The registration form must contain at least one field before publishing.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await eventService.updateEventFormSchema(eventId, fields);
      if (res.success) {
        const newVer = res.data?.formVersion || currentVersion + 1;
        setCurrentVersion(newVer);
        setSuccessMessage(`Form published successfully as Version ${newVer}! Past registrations preserved.`);
        if (onSaved) {
          onSaved(newVer);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to publish form schema.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Server error updating registration form.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
        {/* Header Strip */}
        <div className="bg-[#0B132B] px-6 py-4.5 text-white flex items-center justify-between border-b border-[#1C2541]">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl font-bold text-white">
                Registration Form Builder
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#F5A623] text-[#0B132B]">
                Version {currentVersion}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">
              Configuring form for: <span className="text-[#F5A623] font-medium">{eventTitle}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switch */}
            <div className="bg-[#1C2541] p-1 rounded-lg flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('builder')}
                className={`px-3 py-1 rounded-md transition-colors font-medium ${
                  activeTab === 'builder' ? 'bg-[#F5A623] text-[#0B132B]' : 'text-gray-300 hover:text-white'
                }`}
              >
                Builder
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors font-medium ${
                  activeTab === 'preview' ? 'bg-[#F5A623] text-[#0B132B]' : 'text-gray-300 hover:text-white'
                }`}
              >
                Live Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Info Banner on Immutability & Versioning */}
        <div className="bg-[#0B132B]/5 border-b border-gray-200 px-6 py-2.5 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-[#F5A623] font-bold">ⓘ</span>
            <span>
              <strong>Immutable Versioning:</strong> Saving schema changes increments the version to protect past participant responses.
            </span>
          </div>
          <span className="font-semibold text-gray-500">
            {fields.length} {fields.length === 1 ? 'Field' : 'Fields'} Total
          </span>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            {successMessage}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'preview' ? (
            /* Live Form Preview Mode */
            <div className="max-w-xl mx-auto bg-gray-50/60 p-6 rounded-xl border border-gray-200 space-y-4">
              <div className="border-b border-gray-200 pb-3">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Public Preview
                </span>
                <h3 className="font-serif text-lg font-bold text-[#0B132B]">
                  {eventTitle} — Registration Form
                </h3>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No fields configured yet. Switch to the Builder tab to add questions.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-xs font-semibold text-[#0B132B]">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <div className="text-xs text-gray-400 italic">
                        [{field.type.toUpperCase()}] {field.placeholder ? `Placeholder: "${field.placeholder}"` : ''}
                      </div>
                      {field.choices && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {field.choices.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white border text-[11px] text-gray-600">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Builder Mode */
            <div className="space-y-6">
              {/* Presets Strip */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Quick Add Standard Campus Fields:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_FIELDS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white hover:border-[#F5A623] hover:text-[#0B132B] transition-colors cursor-pointer text-gray-600 font-medium"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Editing Drawer / Box if open */}
              {editingFieldId && (
                <div className="bg-amber-50/40 rounded-xl border-2 border-[#F5A623]/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B132B]">
                      Field Editor
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingFieldId(null)}
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Question Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="e.g., Year of Study"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#F5A623]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Field Type
                      </label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as FormFieldType)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#F5A623] bg-white"
                      >
                        <option value="text">Text (Single line)</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="dropdown">Dropdown (Select list)</option>
                        <option value="radio">Radio Buttons (Single choice)</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="date">Date Picker</option>
                        <option value="url">Website / URL</option>
                        <option value="textarea">Textarea (Multi line)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Placeholder Text
                      </label>
                      <input
                        type="text"
                        value={editPlaceholder}
                        onChange={(e) => setEditPlaceholder(e.target.value)}
                        placeholder="e.g., 23MBU0123"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#F5A623]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Help / Hint Text
                      </label>
                      <input
                        type="text"
                        value={editHelpText}
                        onChange={(e) => setEditHelpText(e.target.value)}
                        placeholder="e.g., As printed on your MBU ID card"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#F5A623]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="editReq"
                      checked={editRequired}
                      onChange={(e) => setEditRequired(e.target.checked)}
                      className="rounded text-[#F5A623] focus:ring-[#F5A623]"
                    />
                    <label htmlFor="editReq" className="text-xs font-semibold text-gray-700">
                      Required Field (Mandatory for registration submission)
                    </label>
                  </div>

                  {/* Dropdown / Radio / Checkbox Choices Manager */}
                  {(editType === 'dropdown' || editType === 'radio' || editType === 'select') && (
                    <div className="border-t border-amber-200/80 pt-3 space-y-2">
                      <label className="block text-xs font-semibold text-gray-700">
                        Configured Options ({editChoices.length})
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newChoiceInput}
                          onChange={(e) => setNewChoiceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddChoice();
                            }
                          }}
                          placeholder="Type option and press Add (e.g. 1st Year)"
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-[#F5A623]"
                        />
                        <button
                          type="button"
                          onClick={handleAddChoice}
                          className="px-3 py-1.5 text-xs bg-[#0B132B] text-white rounded-lg hover:bg-[#1C2541]"
                        >
                          Add Option
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {editChoices.map((choice, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-gray-200 text-xs text-gray-800 shadow-2xs"
                          >
                            {choice}
                            <button
                              type="button"
                              onClick={() => handleRemoveChoice(i)}
                              className="text-red-500 hover:text-red-700 font-bold ml-1"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingFieldId(null)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleSaveFieldConfig}>
                      Save Field
                    </Button>
                  </div>
                </div>
              )}

              {/* Field List Table / Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B132B]">
                    Active Form Questions ({fields.length})
                  </h4>
                  <Button variant="primary" size="sm" onClick={handleStartAddField}>
                    + Add Custom Field
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-500">
                      No questions configured yet. Use the quick presets above or click "+ Add Custom Field".
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-gray-400 w-6">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#0B132B]">
                                {field.label}
                              </span>
                              {field.required && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                                {field.type}
                              </span>
                              {field.choices && (
                                <span className="text-[10px] text-gray-400">
                                  · {field.choices.length} options
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            title="Move Up"
                            className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === fields.length - 1}
                            title="Move Down"
                            className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditField(field)}
                            className="px-2.5 py-1 rounded text-xs font-medium text-[#0B132B] hover:bg-gray-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id)}
                            className="px-2.5 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <Button variant="secondary" size="md" onClick={onClose} disabled={isSaving}>
            Close
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveAndPublish}
            disabled={isSaving || fields.length === 0}
          >
            {isSaving ? 'Publishing Version...' : `Save & Publish Form (v${currentVersion + 1})`}
          </Button>
        </div>
      </div>
    </div>
  );
};
