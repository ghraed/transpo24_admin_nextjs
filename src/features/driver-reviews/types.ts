export type ReviewStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "PENDING_DOCUMENTS"
  | "PENDING_PROFILE";

export type DocumentStatus =
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type DriverReviewDocument = {
  id: string;
  type: string;
  url: string;
  status: DocumentStatus;
  rejectionReason: string | null;
  uploadedAt: string;
};

export type DriverReviewVehicle = {
  id: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  licensePlateNumber: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "INACTIVE";
  rejectionReason: string | null;
  isActive: boolean;
  hasRequiredDocuments: boolean;
  hasLoadCapacityProfile: boolean;
  documents: DriverReviewDocument[];
};

export type DriverReview = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  coverageAreas: string[];
  identityDocumentKind: string | null;
  status: ReviewStatus;
  submittedForReviewAt: string | null;
  onboardingDocuments: DriverReviewDocument[];
  vehicles: DriverReviewVehicle[];
};
