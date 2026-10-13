export interface ParticipantAnswer {
  fieldId: string;
  value: string | number | boolean | string[];
  label?: string;
  type?: string;
  options?: string[];
}

export interface ParticipantSummary {
  _id: string;
  eventId: string;
  fullName: string;
  email: string;
  phone?: string;
  collegeId?: string;
  referenceNumber: string;
  formVersion: number;
  status: 'confirmed' | 'cancelled' | 'attended';
  createdAt: string;
}

export interface ParticipantDetail extends ParticipantSummary {
  answers: ParticipantAnswer[];
  historicalFormVersion: number;
  historicalFieldsCount: number;
}

export interface ParticipantListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParticipantListResult {
  registrations: ParticipantSummary[];
  pagination: ParticipantListPagination;
  formVersions: number[];
  eventTitle: string;
}
