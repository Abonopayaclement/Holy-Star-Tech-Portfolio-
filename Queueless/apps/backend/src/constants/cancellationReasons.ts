export interface CancellationReasonOption {
  id: string;
  label: string;
  description: string;
  allowCustomNote?: boolean;
}

export const PREDEFINED_CANCELLATION_REASONS: CancellationReasonOption[] = [
  {
    id: 'BRANCH_CLOSING_SOON',
    label: 'Branch closing soon',
    description: 'Branch operating hours are ending before this ticket can be served.',
  },
  {
    id: 'SERVICE_CLOSING_SOON',
    label: 'Service closing soon',
    description: 'Specific service desk is closing for the day.',
  },
  {
    id: 'SERVICE_UNAVAILABLE',
    label: 'Service unavailable',
    description: 'The requested service is temporarily unavailable or out of order.',
  },
  {
    id: 'STAFF_UNAVAILABLE',
    label: 'Staff unavailable',
    description: 'No staff members currently available to handle this service queue.',
  },
  {
    id: 'TECHNICAL_ISSUE',
    label: 'Technical issue',
    description: 'Network or system malfunction preventing customer processing.',
  },
  {
    id: 'CUSTOMER_UNABLE_TODAY',
    label: 'Customer issue cannot be handled today',
    description: 'Required documentation or prerequisites are incomplete for today.',
  },
  {
    id: 'SCHEDULE_CHANGED',
    label: 'Service schedule changed',
    description: 'Branch operational schedule or desk assignments have changed.',
  },
  {
    id: 'CAPACITY_EXCEEDED',
    label: 'Queue cannot be completed today',
    description: 'Queue length exceeds the number of customers that can be served today.',
  },
  {
    id: 'CUSTOMER_RETURN_ANOTHER_DAY',
    label: 'Customer must return another day',
    description: 'Customer advised to return on a future date for this service.',
  },
  {
    id: 'OTHER',
    label: 'Other operational reason',
    description: 'Other verified operational or administrative reason.',
    allowCustomNote: true,
  },
];

export const CANCELLATION_REASONS = PREDEFINED_CANCELLATION_REASONS;

export const VALID_CANCELLATION_LABELS = new Set(
  PREDEFINED_CANCELLATION_REASONS.map((r) => r.label)
);

export const VALID_CANCELLATION_IDS = new Set(
  PREDEFINED_CANCELLATION_REASONS.map((r) => r.id)
);

/**
 * Validates a reason provided by staff and returns the standardized display label.
 */
export const validateCancellationReason = (
  reason: string,
  note?: string
): { isValid: boolean; formattedReason?: string; error?: string } => {
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return {
      isValid: false,
      error: 'A valid cancellation reason is required when staff cancels a customer ticket.',
    };
  }

  const clean = reason.trim();
  const matchedById = PREDEFINED_CANCELLATION_REASONS.find((r) => r.id === clean);
  const matchedByLabel = PREDEFINED_CANCELLATION_REASONS.find(
    (r) => r.label.toLowerCase() === clean.toLowerCase()
  );

  const matched = matchedById || matchedByLabel;
  if (!matched) {
    return {
      isValid: false,
      error: `Invalid cancellation reason. Must be one of the predefined operational reasons.`,
    };
  }

  if (matched.id === 'OTHER') {
    if (!note || !note.trim()) {
      return {
        isValid: false,
        error: 'Please provide a specific explanation when selecting "Other operational reason".',
      };
    }
    return {
      isValid: true,
      formattedReason: `Other: ${note.trim()}`,
    };
  }

  let formatted = matched.label;
  if (note && note.trim()) {
    formatted = `${matched.label} (${note.trim()})`;
  }

  return { isValid: true, formattedReason: formatted };
};
