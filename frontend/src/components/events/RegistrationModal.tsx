import React, { useEffect } from 'react';
import type { FormFieldConfig, RegistrationSuccessData } from '../../types/event';
import { DynamicFormRenderer } from './DynamicFormRenderer';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventSlug: string;
  eventTitle: string;
  eventDate?: string;
  venue?: string;
  formSchema: FormFieldConfig[];
  formVersion?: number;
  onSuccess?: (data: RegistrationSuccessData) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  eventSlug,
  eventTitle,
  eventDate,
  venue,
  formSchema,
  formVersion = 1,
  onSuccess,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0B132B]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-modal-title"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E2E8F0] animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0B132B] px-6 py-5 text-white flex items-center justify-between border-b border-[#1C2541]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#F5A623] text-[#0B132B]">
                Registration
              </span>
              {eventDate && (
                <span className="text-xs text-gray-300">
                  {new Date(eventDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
            <h2 id="registration-modal-title" className="font-serif text-xl sm:text-2xl font-bold text-white truncate max-w-md">
              {eventTitle}
            </h2>
            {venue && <p className="text-xs text-gray-400 truncate mt-0.5">{venue}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold transition-colors cursor-pointer shrink-0 ml-4"
            aria-label="Close registration dialog"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#FDFBF7]">
          {formSchema && formSchema.length > 0 ? (
            <DynamicFormRenderer
              identifier={eventSlug}
              eventTitle={eventTitle}
              formSchema={formSchema}
              formVersion={formVersion}
              onSuccess={(data) => {
                if (onSuccess) {
                  onSuccess(data);
                }
              }}
            />
          ) : (
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center space-y-2">
              <p className="font-serif text-lg font-bold text-[#0B132B]">
                Form Configuration Pending
              </p>
              <p className="text-xs text-gray-500">
                The registration fields for this event are currently being configured by the club team. Please check back shortly.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#0B132B] text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
