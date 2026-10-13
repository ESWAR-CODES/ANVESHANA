import React, { useState } from 'react';
import type { FormFieldConfig, RegistrationSuccessData } from '../../types/event';
import { eventService } from '../../services/eventService';
import { Button } from '../common/Button';

interface DynamicFormRendererProps {
  identifier: string; // Event slug or id
  eventTitle: string;
  formSchema: FormFieldConfig[];
  formVersion?: number;
  onSuccess?: (data: RegistrationSuccessData) => void;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  identifier,
  eventTitle,
  formSchema,
  formVersion = 1,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmationData, setConfirmationData] = useState<RegistrationSuccessData | null>(null);
  const [copied, setCopied] = useState(false);

  // Filter only enabled fields and sort by order
  const activeFields = [...formSchema]
    .filter((f) => f.enabled !== false)
    .sort((a, b) => a.order - b.order);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error on edit
    if (fieldErrors[fieldId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validateClientSide = (): boolean => {
    const errors: Record<string, string> = {};

    for (const field of activeFields) {
      const val = formData[field.id];
      const isMissing =
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '') ||
        (Array.isArray(val) && val.length === 0);

      if (field.required && isMissing) {
        errors[field.id] = `"${field.label}" is required.`;
        continue;
      }

      if (isMissing) continue;

      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val).trim())) {
          errors[field.id] = 'Please enter a valid email address.';
        }
      } else if (field.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errors[field.id] = 'Please enter a valid number.';
        } else {
          if (field.validation?.min !== undefined && num < field.validation.min) {
            errors[field.id] = `Must be at least ${field.validation.min}.`;
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            errors[field.id] = `Cannot exceed ${field.validation.max}.`;
          }
        }
      } else if (field.type === 'url') {
        const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
        if (!urlRegex.test(String(val).trim())) {
          errors[field.id] = 'Please enter a valid URL starting with http:// or https://';
        }
      } else if (field.type === 'checkbox') {
        if (field.required && val !== true && (!Array.isArray(val) || val.length === 0)) {
          errors[field.id] = 'You must accept / check this option.';
        }
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateClientSide()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await eventService.registerForEvent(identifier, {
        answers: formData,
      });

      if (res.success && res.data) {
        setConfirmationData(res.data);
        if (onSuccess) {
          onSuccess(res.data);
        }
      } else {
        setServerError(res.error || 'Failed to submit registration. Please check the form.');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'An error occurred while submitting your registration. Please try again.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReference = () => {
    if (confirmationData?.referenceNumber) {
      navigator.clipboard.writeText(confirmationData.referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Confirmation Success View
  if (confirmationData) {
    return (
      <div className="bg-white rounded-2xl border-2 border-[#10B981]/30 p-8 shadow-sm text-center animate-fade-in">
        <div className="w-16 h-16 bg-[#10B981]/10 text-[#10B981] rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="inline-block px-3 py-1 bg-[#10B981]/15 text-[#047857] text-xs font-bold uppercase tracking-wider rounded-full mb-3">
          Registration Confirmed
        </span>

        <h3 className="font-serif text-2xl font-bold text-[#0B132B] mb-2">
          You are Registered!
        </h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
          Your seat has been reserved for <span className="font-semibold text-[#0B132B]">{confirmationData.eventTitle || eventTitle}</span>.
        </p>

        {/* Unique Reference Number Badge */}
        <div className="bg-[#0B132B] text-white p-6 rounded-xl max-w-sm mx-auto mb-6 border border-[#F5A623]/30 shadow-inner">
          <p className="text-xs uppercase tracking-widest text-[#F5A623] font-semibold mb-1">
            Official Reference ID
          </p>
          <div className="font-mono text-3xl font-extrabold tracking-widest text-white select-all my-2">
            {confirmationData.referenceNumber}
          </div>
          <button
            type="button"
            onClick={handleCopyReference}
            className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer mt-1"
          >
            {copied ? (
              <span className="text-[#10B981] font-semibold">✓ Copied to clipboard</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Reference Code
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-gray-500 max-w-md mx-auto space-y-1">
          <p>Please take a screenshot or note this reference number.</p>
          <p>It will be verified during on-desk check-in at the venue.</p>
        </div>
      </div>
    );
  }

  // Active Dynamic Registration Form View
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 lg:p-8 shadow-xs">
      <div className="border-b border-gray-100 pb-4 mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold text-[#0B132B]">
            Event Registration
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Complete the required details below to confirm your participation.
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
          v{formVersion}
        </span>
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1 font-medium">{serverError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {activeFields.map((field) => {
          const errorMsg = fieldErrors[field.id];

          return (
            <div key={field.id} className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#0B132B]">
                {field.label}
                {field.required && <span className="text-[#EF4444] ml-1">*</span>}
              </label>

              {/* Text, Textarea, Email, Number, Date, URL Inputs */}
              {(field.type === 'text' ||
                field.type === 'email' ||
                field.type === 'number' ||
                field.type === 'phone' ||
                field.type === 'date' ||
                field.type === 'url') && (
                <input
                  type={
                    field.type === 'number'
                      ? 'number'
                      : field.type === 'email'
                      ? 'email'
                      : field.type === 'date'
                      ? 'date'
                      : field.type === 'url'
                      ? 'url'
                      : 'text'
                  }
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}`}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#0B132B] placeholder-gray-400 focus:outline-none transition-colors ${
                    errorMsg
                      ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                      : 'border-[#CBD5E1] bg-white focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]'
                  }`}
                />
              )}

              {/* Textarea */}
              {field.type === 'textarea' && (
                <textarea
                  rows={3}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#0B132B] placeholder-gray-400 focus:outline-none transition-colors resize-y ${
                    errorMsg
                      ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                      : 'border-[#CBD5E1] bg-white focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]'
                  }`}
                />
              )}

              {/* Dropdown / Select */}
              {(field.type === 'dropdown' || field.type === 'select') && (
                <select
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#0B132B] focus:outline-none transition-colors ${
                    errorMsg
                      ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                      : 'border-[#CBD5E1] bg-white focus:border-[#F5A623] focus:ring-1 focus:ring-[#F5A623]'
                  }`}
                >
                  <option value="">-- Select an option --</option>
                  {(field.choices || []).map((choice, idx) => (
                    <option key={idx} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              )}

              {/* Radio Group */}
              {field.type === 'radio' && (
                <div className="space-y-2 pt-1">
                  {(field.choices || []).map((choice, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50/70 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name={field.id}
                        value={choice}
                        checked={formData[field.id] === choice}
                        onChange={() => handleInputChange(field.id, choice)}
                        className="w-4 h-4 text-[#F5A623] focus:ring-[#F5A623] border-gray-300"
                      />
                      <span className="text-xs text-gray-700 font-medium">{choice}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Checkbox Single or Multi */}
              {field.type === 'checkbox' && (
                <div>
                  {field.choices && field.choices.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {field.choices.map((choice, idx) => {
                        const currentArr = Array.isArray(formData[field.id]) ? formData[field.id] : [];
                        const isChecked = currentArr.includes(choice);

                        return (
                          <label
                            key={idx}
                            className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50/70 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const nextArr = e.target.checked
                                  ? [...currentArr, choice]
                                  : currentArr.filter((item: string) => item !== choice);
                                handleInputChange(field.id, nextArr);
                              }}
                              className="w-4 h-4 rounded text-[#F5A623] focus:ring-[#F5A623] border-gray-300"
                            />
                            <span className="text-xs text-gray-700 font-medium">{choice}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <label className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50/70 cursor-pointer transition-colors mt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(formData[field.id])}
                        onChange={(e) => handleInputChange(field.id, e.target.checked)}
                        className="w-4 h-4 rounded text-[#F5A623] focus:ring-[#F5A623] border-gray-300 mt-0.5"
                      />
                      <span className="text-xs text-gray-700 leading-snug">
                        {field.placeholder || 'I confirm and agree to this requirement'}
                      </span>
                    </label>
                  )}
                </div>
              )}

              {field.helpText && (
                <p className="text-[11px] text-gray-400">{field.helpText}</p>
              )}

              {errorMsg && (
                <p className="text-[11px] text-[#EF4444] font-medium">{errorMsg}</p>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t border-gray-100">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-[#0B132B]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Confirming Registration...
              </span>
            ) : (
              'Submit Registration'
            )}
          </Button>
          <p className="text-center text-[11px] text-gray-400 mt-2.5">
            By registering, your seat is reserved under Mohan Babu University Club standards.
          </p>
        </div>
      </form>
    </div>
  );
};
