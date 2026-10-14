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
  initialTitle?: string | null;
  initialDescription?: string | null;
  initialDraft?: FormFieldConfig[] | null;
  initialDraftTitle?: string | null;
  initialDraftDescription?: string | null;
  registeredCount?: number;
  maxParticipants?: number | null;
  isRegistrationOpen?: boolean;
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
  { label: 'Dietary Preference', type: 'radio', required: false, choices: ['Vegetarian', 'Non-Vegetarian'] },
  { label: 'Need Transportation Support?', type: 'yes_no', required: false },
  { label: 'I agree to event rules & code of conduct', type: 'checkbox', required: true },
];

export const FormBuilderModal: React.FC<FormBuilderModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  initialSchema = [],
  initialVersion = 1,
  initialTitle,
  initialDescription,
  initialDraft = null,
  initialDraftTitle,
  initialDraftDescription,
  registeredCount = 0,
  maxParticipants = null,
  isRegistrationOpen = true,
  onSaved,
}) => {
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [currentVersion, setCurrentVersion] = useState<number>(initialVersion);
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState<boolean>(false);

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

  // Async action states
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isClosingReg, setIsClosingReg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Preview form test input state
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isOpen) {
      // Check if event has a saved uncommitted draft
      if (initialDraft && initialDraft.length > 0) {
        setFields(JSON.parse(JSON.stringify(initialDraft)));
        setFormTitle(initialDraftTitle || initialTitle || `${eventTitle} Registration`);
        setFormDescription(initialDraftDescription || initialDescription || '');
        setIsDraftLoaded(true);
      } else {
        setFields(initialSchema.length > 0 ? JSON.parse(JSON.stringify(initialSchema)) : []);
        setFormTitle(initialTitle || `${eventTitle} Registration`);
        setFormDescription(initialDescription || '');
        setIsDraftLoaded(false);
      }

      setCurrentVersion(initialVersion || 1);
      setEditingFieldId(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setActiveTab('builder');
      setPreviewAnswers({});
    }
  }, [
    isOpen,
    initialSchema,
    initialVersion,
    initialTitle,
    initialDescription,
    initialDraft,
    initialDraftTitle,
    initialDraftDescription,
    eventTitle,
  ]);

  if (!isOpen) return null;

  const generateStableId = () => `field_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

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

  const handleApplyPreset = (preset: (typeof PRESET_FIELDS)[0]) => {
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

    if (
      (editType === 'dropdown' || editType === 'radio' || editType === 'select') &&
      editChoices.length === 0
    ) {
      setErrorMessage(`Options are required for ${editType} questions.`);
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
      order:
        fields.findIndex((f) => f.id === editingFieldId) !== -1
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

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await eventService.saveEventFormDraft(eventId, {
        formTitle: formTitle.trim(),
        formDescription: formDescription.trim(),
        formSchema: fields,
      });

      if (res.success) {
        setIsDraftLoaded(true);
        setSuccessMessage('Draft saved successfully! You can resume editing anytime before publishing.');
      } else {
        setErrorMessage(res.error || 'Failed to save form draft.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Server error while saving form draft.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSaveAndPublish = async () => {
    if (fields.length === 0) {
      setErrorMessage('The registration form must contain at least one question before publishing.');
      return;
    }

    if (!formTitle.trim()) {
      setErrorMessage('Form title is required.');
      return;
    }

    if (
      initialSchema.length > 0 &&
      !window.confirm(
        `Publishing these changes will increment the form to Version ${currentVersion + 1}. All past participant records will remain permanently preserved under previous versions. Proceed?`
      )
    ) {
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await eventService.updateEventFormSchema(eventId, fields, {
        formTitle: formTitle.trim(),
        formDescription: formDescription.trim(),
      });

      if (res.success) {
        const newVer = res.data?.formVersion || currentVersion + 1;
        setCurrentVersion(newVer);
        setIsDraftLoaded(false);
        setSuccessMessage(`Form published successfully as Version ${newVer}! Live student registration is now enabled.`);
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
      setIsPublishing(false);
    }
  };

  const handleCloseRegistration = async () => {
    if (!window.confirm(`Are you sure you want to close registration for "${eventTitle}"? Students will no longer be able to submit responses.`)) {
      return;
    }

    setIsClosingReg(true);
    try {
      const res = await eventService.closeEventRegistration(eventId);
      if (res.success) {
        setSuccessMessage(`Registration has been closed for "${eventTitle}".`);
        if (onSaved) {
          onSaved(currentVersion);
        }
      } else {
        setErrorMessage(res.error || 'Failed to close registration.');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to close registration.');
    } finally {
      setIsClosingReg(false);
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
              {isDraftLoaded && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400 text-amber-950 border border-amber-300">
                  Unpublished Draft
                </span>
              )}
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
                className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  activeTab === 'builder' ? 'bg-[#F5A623] text-[#0B132B]' : 'text-gray-300 hover:text-white'
                }`}
              >
                Question Builder
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  activeTab === 'preview' ? 'bg-[#F5A623] text-[#0B132B]' : 'text-gray-300 hover:text-white'
                }`}
              >
                Live Student Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Info Banner on Immutability & Versioning */}
        <div className="bg-[#0B132B]/5 border-b border-gray-200 px-6 py-2.5 flex items-center justify-between text-xs text-gray-600 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#F5A623] font-bold">ⓘ</span>
            <span>
              <strong>Drafts & Versioning:</strong> Save drafts freely during setup. Publishing creates an immutable version snapshot protecting prior registrations.
            </span>
          </div>
          <span className="font-semibold text-gray-500">
            {fields.length} {fields.length === 1 ? 'Question' : 'Questions'}
          </span>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold text-red-700 cursor-pointer">✕</button>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="font-bold text-emerald-800 cursor-pointer">✕</button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'preview' ? (
            /* Live Student Preview Mode */
            <div className="max-w-2xl mx-auto bg-white p-7 rounded-2xl border border-gray-200 shadow-sm space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <span className="text-[10px] uppercase font-bold text-[#F5A623] tracking-widest block mb-1">
                  Student Registration Form Preview
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#0B132B]">
                  {formTitle || `${eventTitle} Registration`}
                </h3>
                {formDescription && (
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                    {formDescription}
                  </p>
                )}
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs space-y-2">
                  <p className="font-semibold text-gray-600 text-sm">No questions added to this form yet</p>
                  <p>Switch to the Question Builder tab to enter questions or choose quick presets.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#0B132B]">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.helpText && (
                        <p className="text-[11px] text-gray-400">{field.helpText}</p>
                      )}

                      {/* Field Renderers */}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          placeholder={field.placeholder || 'Enter response...'}
                          value={previewAnswers[field.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                        />
                      )}

                      {field.type === 'textarea' && (
                        <textarea
                          rows={3}
                          placeholder={field.placeholder || 'Enter detailed response...'}
                          value={previewAnswers[field.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                        />
                      )}

                      {field.type === 'email' && (
                        <input
                          type="email"
                          placeholder={field.placeholder || 'student@mbu.edu.in'}
                          value={previewAnswers[field.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                        />
                      )}

                      {field.type === 'phone' && (
                        <input
                          type="tel"
                          placeholder={field.placeholder || '+91 9876543210'}
                          value={previewAnswers[field.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                        />
                      )}

                      {field.type === 'number' && (
                        <input
                          type="number"
                          placeholder={field.placeholder || '0'}
                          value={previewAnswers[field.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                        />
                      )}

                      {(field.type === 'dropdown' || field.type === 'select') && (
                        <select
                          value={previewAnswers[field.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                        >
                          <option value="">-- Select an option --</option>
                          {(field.choices || []).map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                          ))}
                        </select>
                      )}

                      {field.type === 'radio' && (
                        <div className="space-y-1.5 pt-1">
                          {(field.choices || []).map((c, i) => (
                            <label key={i} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="radio"
                                name={field.id}
                                value={c}
                                checked={previewAnswers[field.id] === c}
                                onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                                className="text-[#F5A623] focus:ring-[#F5A623]"
                              />
                              <span>{c}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'checkbox' && (
                        <div className="pt-1">
                          {field.choices && field.choices.length > 0 ? (
                            <div className="space-y-1.5">
                              {field.choices.map((c, i) => (
                                <label key={i} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Array.isArray(previewAnswers[field.id]) && previewAnswers[field.id].includes(c)}
                                    onChange={(e) => {
                                      const cur = Array.isArray(previewAnswers[field.id]) ? [...previewAnswers[field.id]] : [];
                                      const updated = e.target.checked ? [...cur, c] : cur.filter((x: string) => x !== c);
                                      setPreviewAnswers({ ...previewAnswers, [field.id]: updated });
                                    }}
                                    className="rounded text-[#F5A623] focus:ring-[#F5A623]"
                                  />
                                  <span>{c}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(previewAnswers[field.id])}
                                onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.checked })}
                                className="rounded text-[#F5A623] focus:ring-[#F5A623]"
                              />
                              <span>{field.placeholder || 'I acknowledge and confirm this item.'}</span>
                            </label>
                          )}
                        </div>
                      )}

                      {field.type === 'date' && (
                        <input
                          type="date"
                          value={previewAnswers[field.id] || ''}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [field.id]: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                        />
                      )}

                      {field.type === 'yes_no' && (
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewAnswers({ ...previewAnswers, [field.id]: 'Yes' })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              previewAnswers[field.id] === 'Yes'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewAnswers({ ...previewAnswers, [field.id]: 'No' })}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              previewAnswers[field.id] === 'No'
                                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pt-4 border-t border-gray-200">
                    <Button variant="primary" size="md" fullWidth disabled>
                      Submit Registration (Preview Only)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Builder Mode */
            <div className="space-y-6">
              {/* Form Metadata Settings Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B132B]">
                    Form Header & Public Instructions
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Displayed above student questions
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Registration Form Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. AI & Robotics Symposium 2026 - Registration"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Instructions & Guidelines (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. Open to all MBU students. Please bring your college ID card on the event day."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Add Presets Bar */}
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
                <div className="bg-amber-50/40 rounded-xl border-2 border-[#F5A623]/60 p-5 space-y-4 shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B132B]">
                      Question Configuration
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingFieldId(null)}
                      className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
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
                        placeholder="e.g. Which track are you competing in?"
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Field Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as FormFieldType)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5A623]"
                      >
                        <option value="text">Short Text</option>
                        <option value="textarea">Long Answer / Textarea</option>
                        <option value="email">Email Address</option>
                        <option value="phone">Phone Number</option>
                        <option value="number">Number</option>
                        <option value="dropdown">Dropdown Select</option>
                        <option value="radio">Radio Buttons (Single Choice)</option>
                        <option value="checkbox">Multiple-choice Checkboxes</option>
                        <option value="date">Date</option>
                        <option value="yes_no">Yes / No Toggle</option>
                        <option value="url">Web Link / URL</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Placeholder / Hint Text
                      </label>
                      <input
                        type="text"
                        value={editPlaceholder}
                        onChange={(e) => setEditPlaceholder(e.target.value)}
                        placeholder="e.g. Enter your team name..."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Help Text / Subtitle
                      </label>
                      <input
                        type="text"
                        value={editHelpText}
                        onChange={(e) => setEditHelpText(e.target.value)}
                        placeholder="e.g. As printed on your university ID card."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                      />
                    </div>
                  </div>

                  {/* Options editor for choice fields */}
                  {(editType === 'dropdown' || editType === 'radio' || editType === 'checkbox' || editType === 'select') && (
                    <div className="pt-2 border-t border-amber-200/60 space-y-2">
                      <label className="block text-xs font-semibold text-gray-700">
                        Answer Options <span className="text-red-500">*</span>
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
                          placeholder="Type option name and press Enter or Add..."
                          className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                        />
                        <Button type="button" variant="secondary" size="sm" onClick={handleAddChoice}>
                          Add Option
                        </Button>
                      </div>

                      {editChoices.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {editChoices.map((c, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-300 text-xs text-gray-800"
                            >
                              <span>{c}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveChoice(i)}
                                className="text-red-500 hover:text-red-700 font-bold ml-1 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Number min/max validation */}
                  {editType === 'number' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-amber-200/60">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Minimum Value
                        </label>
                        <input
                          type="number"
                          value={editMin}
                          onChange={(e) => setEditMin(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="No minimum"
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Maximum Value
                        </label>
                        <input
                          type="number"
                          value={editMax}
                          onChange={(e) => setEditMax(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="No maximum"
                          className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={editRequired}
                        onChange={(e) => setEditRequired(e.target.checked)}
                        className="rounded text-[#F5A623] focus:ring-[#F5A623]"
                      />
                      <span>Mark this question as Required</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={() => setEditingFieldId(null)}>
                        Cancel
                      </Button>
                      <Button type="button" variant="primary" size="sm" onClick={handleSaveFieldConfig}>
                        Done Editing
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm font-bold text-[#0B132B]">
                    Configured Questions ({fields.length})
                  </h3>
                  <Button variant="primary" size="sm" onClick={handleStartAddField}>
                    + Add Question
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 space-y-2">
                    <p className="font-serif text-sm font-bold text-gray-700">No questions configured</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Click "+ Add Question" or pick from the standard campus presets above to build your questionnaire.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center justify-between hover:border-gray-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-semibold text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-xs text-[#0B132B]">{field.label}</p>
                              {field.required && (
                                <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50 px-1.5 py-0.2 rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 capitalize">
                              Type: {field.type.replace('_', '/')}
                              {field.choices && field.choices.length > 0 && ` (${field.choices.length} options)`}
                              {field.placeholder ? ` · Hint: "${field.placeholder}"` : ''}
                            </p>
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
                            className="px-2.5 py-1 rounded text-xs font-medium text-[#0B132B] hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id)}
                            className="px-2.5 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono">
              <strong>{registeredCount}</strong> registrations
              {maxParticipants ? ` / ${maxParticipants} capacity` : ' (Unlimited)'}
            </span>

            {isRegistrationOpen && (
              <button
                type="button"
                onClick={handleCloseRegistration}
                disabled={isClosingReg}
                className="text-xs text-red-600 hover:text-red-800 font-semibold underline cursor-pointer disabled:opacity-50"
              >
                {isClosingReg ? 'Closing...' : 'Close Registration'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <Button variant="secondary" size="md" onClick={onClose} disabled={isPublishing || isSavingDraft}>
              Close
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={handleSaveDraft}
              isLoading={isSavingDraft}
              disabled={isPublishing || isSavingDraft}
            >
              Save as Draft
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleSaveAndPublish}
              isLoading={isPublishing}
              disabled={isPublishing || isSavingDraft || fields.length === 0}
            >
              Publish Form (v{initialSchema.length > 0 ? currentVersion + 1 : currentVersion})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
