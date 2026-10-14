import { FormFieldConfig, FormFieldType } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

export const ALLOWED_FIELD_TYPES: FormFieldType[] = [
  'text',
  'textarea',
  'email',
  'phone',
  'number',
  'select',
  'dropdown',
  'radio',
  'checkbox',
  'date',
  'url',
  'yes_no',
];

export interface FormValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedSchema?: FormFieldConfig[];
}

export interface AnswerValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedAnswers?: Record<string, any>;
  studentId?: string;
  email?: string;
}

/**
 * Validates and normalizes an admin form schema configuration.
 */
export const validateFormSchemaDefinition = (schemaInput: any): FormValidationResult => {
  if (!Array.isArray(schemaInput)) {
    return { isValid: false, error: 'Form schema must be an array of field definitions.' };
  }

  const sanitizedSchema: FormFieldConfig[] = [];
  const seenIds = new Set<string>();

  for (let index = 0; index < schemaInput.length; index++) {
    const field = schemaInput[index];

    if (!field || typeof field !== 'object') {
      return { isValid: false, error: `Field definition at position ${index + 1} is invalid.` };
    }

    const type = field.type as FormFieldType;
    if (!ALLOWED_FIELD_TYPES.includes(type)) {
      return {
        isValid: false,
        error: `Field "${field.label || index + 1}" has unsupported type "${field.type}".`,
      };
    }

    const label = typeof field.label === 'string' ? field.label.trim() : '';
    if (!label) {
      return {
        isValid: false,
        error: `Field at position ${index + 1} must have a non-empty label.`,
      };
    }

    // Ensure stable unique ID
    let fieldId = typeof field.id === 'string' && field.id.trim() ? field.id.trim() : `field_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
    if (seenIds.has(fieldId)) {
      fieldId = `field_${uuidv4().replace(/-/g, '').slice(0, 10)}`;
    }
    seenIds.add(fieldId);

    // Options validation for dropdown, select, radio, checkbox
    let choices: string[] | undefined = undefined;
    if (type === 'dropdown' || type === 'select' || type === 'radio') {
      if (!Array.isArray(field.choices) || field.choices.length === 0) {
        return {
          isValid: false,
          error: `Field "${label}" of type "${type}" must define at least one option.`,
        };
      }
      const filtered = field.choices
        .map((c: any) => (typeof c === 'string' ? c.trim() : ''))
        .filter((c: string) => c.length > 0);

      if (filtered.length === 0) {
        return {
          isValid: false,
          error: `Field "${label}" must contain valid non-empty options.`,
        };
      }
      choices = filtered;
    } else if (type === 'checkbox' && Array.isArray(field.choices)) {
      choices = field.choices
        .map((c: any) => (typeof c === 'string' ? c.trim() : ''))
        .filter((c: string) => c.length > 0);
    }

    sanitizedSchema.push({
      id: fieldId,
      type,
      label,
      placeholder: typeof field.placeholder === 'string' ? field.placeholder.trim() : undefined,
      helpText: typeof field.helpText === 'string' ? field.helpText.trim() : undefined,
      required: Boolean(field.required),
      enabled: field.enabled !== undefined ? Boolean(field.enabled) : true,
      order: typeof field.order === 'number' ? field.order : index,
      choices,
      validation: field.validation && typeof field.validation === 'object' ? field.validation : undefined,
    });
  }

  return { isValid: true, sanitizedSchema };
};

/**
 * Validates incoming registration answers against the event's active published form schema.
 */
export const validateRegistrationAnswers = (
  schema: FormFieldConfig[],
  answers: any
): AnswerValidationResult => {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return { isValid: false, error: 'Registration answers must be a valid key-value object.' };
  }

  const enabledFields = schema.filter((f) => f.enabled);
  const allowedFieldIds = new Set(enabledFields.map((f) => f.id));

  // Reject unknown fields to prevent arbitrary payload injection
  for (const submittedKey of Object.keys(answers)) {
    if (!allowedFieldIds.has(submittedKey)) {
      return {
        isValid: false,
        error: `Submission contains unknown or unapproved form field: "${submittedKey}".`,
      };
    }
  }

  const sanitizedAnswers: Record<string, any> = {};
  let detectedStudentId: string | undefined = undefined;
  let detectedEmail: string | undefined = undefined;

  for (const field of enabledFields) {
    const rawVal = answers[field.id];
    const isMissing =
      rawVal === undefined ||
      rawVal === null ||
      (typeof rawVal === 'string' && rawVal.trim() === '') ||
      (Array.isArray(rawVal) && rawVal.length === 0);

    // Check required constraint
    if (field.required && isMissing) {
      return {
        isValid: false,
        error: `Required field "${field.label}" is missing or empty.`,
      };
    }

    if (isMissing) {
      continue;
    }

    // Type-specific validation and sanitization
    switch (field.type) {
      case 'text':
      case 'textarea': {
        if (typeof rawVal !== 'string') {
          return { isValid: false, error: `Field "${field.label}" must be a text string.` };
        }
        const strVal = rawVal.trim();
        if (field.validation?.minLength && strVal.length < field.validation.minLength) {
          return {
            isValid: false,
            error: `Field "${field.label}" must be at least ${field.validation.minLength} characters.`,
          };
        }
        if (field.validation?.maxLength && strVal.length > field.validation.maxLength) {
          return {
            isValid: false,
            error: `Field "${field.label}" cannot exceed ${field.validation.maxLength} characters.`,
          };
        }
        if (field.validation?.pattern) {
          try {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(strVal)) {
              return { isValid: false, error: `Field "${field.label}" does not match required format.` };
            }
          } catch {
            // Safe fallback if regex in db was invalid
          }
        }
        sanitizedAnswers[field.id] = strVal;

        // Auto-detect student ID
        if (!detectedStudentId && /student.*id|roll.*no|reg(istration)?.*no/i.test(field.label)) {
          detectedStudentId = strVal.toUpperCase();
        }
        break;
      }

      case 'number': {
        const numVal = typeof rawVal === 'number' ? rawVal : Number(rawVal);
        if (isNaN(numVal)) {
          return { isValid: false, error: `Field "${field.label}" must be a valid number.` };
        }
        if (field.validation?.min !== undefined && numVal < field.validation.min) {
          return {
            isValid: false,
            error: `Field "${field.label}" must be at least ${field.validation.min}.`,
          };
        }
        if (field.validation?.max !== undefined && numVal > field.validation.max) {
          return {
            isValid: false,
            error: `Field "${field.label}" cannot exceed ${field.validation.max}.`,
          };
        }
        sanitizedAnswers[field.id] = numVal;

        if (!detectedStudentId && /student.*id|roll.*no|reg(istration)?.*no/i.test(field.label)) {
          detectedStudentId = String(numVal);
        }
        break;
      }

      case 'email': {
        if (typeof rawVal !== 'string') {
          return { isValid: false, error: `Field "${field.label}" must be an email string.` };
        }
        const emailStr = rawVal.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailStr)) {
          return { isValid: false, error: `Field "${field.label}" must be a valid email address.` };
        }
        sanitizedAnswers[field.id] = emailStr;
        if (!detectedEmail) {
          detectedEmail = emailStr;
        }
        break;
      }

      case 'dropdown':
      case 'select':
      case 'radio': {
        if (typeof rawVal !== 'string') {
          return { isValid: false, error: `Field "${field.label}" must be a selected option string.` };
        }
        const selectedVal = rawVal.trim();
        const permitted = field.choices || [];
        if (!permitted.includes(selectedVal)) {
          return {
            isValid: false,
            error: `Invalid choice selected for "${field.label}". Permitted choices are: ${permitted.join(', ')}.`,
          };
        }
        sanitizedAnswers[field.id] = selectedVal;
        break;
      }

      case 'checkbox': {
        if (Array.isArray(rawVal)) {
          const permitted = field.choices || [];
          for (const item of rawVal) {
            if (typeof item !== 'string' || !permitted.includes(item.trim())) {
              return {
                isValid: false,
                error: `Invalid checkbox choice "${item}" for "${field.label}".`,
              };
            }
          }
          sanitizedAnswers[field.id] = rawVal.map((i: string) => i.trim());
        } else if (typeof rawVal === 'boolean' || rawVal === 'true' || rawVal === 'false') {
          const boolVal = rawVal === true || rawVal === 'true';
          if (field.required && !boolVal) {
            return {
              isValid: false,
              error: `You must agree to / check "${field.label}" to proceed.`,
            };
          }
          sanitizedAnswers[field.id] = boolVal;
        } else {
          return {
            isValid: false,
            error: `Field "${field.label}" must be a boolean or selected options list.`,
          };
        }
        break;
      }

      case 'yes_no': {
        if (
          typeof rawVal === 'boolean' ||
          rawVal === 'true' ||
          rawVal === 'false' ||
          rawVal === 'yes' ||
          rawVal === 'no' ||
          rawVal === 'Yes' ||
          rawVal === 'No'
        ) {
          const boolVal = rawVal === true || rawVal === 'true' || String(rawVal).toLowerCase() === 'yes';
          sanitizedAnswers[field.id] = boolVal ? 'Yes' : 'No';
        } else {
          return {
            isValid: false,
            error: `Field "${field.label}" must be answered with Yes or No.`,
          };
        }
        break;
      }

      case 'date': {
        if (typeof rawVal !== 'string') {
          return { isValid: false, error: `Field "${field.label}" must be a valid date string.` };
        }
        const dateParsed = new Date(rawVal);
        if (isNaN(dateParsed.getTime())) {
          return { isValid: false, error: `Field "${field.label}" contains an invalid date format.` };
        }
        sanitizedAnswers[field.id] = rawVal.trim();
        break;
      }

      case 'url': {
        if (typeof rawVal !== 'string') {
          return { isValid: false, error: `Field "${field.label}" must be a URL string.` };
        }
        const urlStr = rawVal.trim();
        const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
        if (!urlRegex.test(urlStr)) {
          return { isValid: false, error: `Field "${field.label}" must be a valid HTTP/HTTPS URL.` };
        }
        sanitizedAnswers[field.id] = urlStr;
        break;
      }

      case 'phone': {
        if (typeof rawVal !== 'string') {
          return { isValid: false, error: `Field "${field.label}" must be a phone string.` };
        }
        const phoneStr = rawVal.trim();
        sanitizedAnswers[field.id] = phoneStr;
        break;
      }

      default:
        sanitizedAnswers[field.id] = rawVal;
    }
  }

  return {
    isValid: true,
    sanitizedAnswers,
    studentId: detectedStudentId,
    email: detectedEmail,
  };
};
