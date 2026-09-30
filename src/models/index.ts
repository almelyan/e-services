export type RequestStatus =
  | "Pending"
  | "InProgress"
  | "Completed"
  | "Rejected"
  | "Cancelled";
export type CardStatus = "Active" | "Suspended" | "Cancelled" | "Replaced";
export type ServiceId =
  | "issue"
  | "replace"
  | "status"
  | "pin"
  | "topup"
  | "deliver"
  | "statement";
export type Permission = "create" | "operate" | "reset";
export interface DemoUser {
  id: string;
  name: string;
  role: string;
  permissions: Permission[];
}
export interface Company {
  id: string;
  name: string;
  customerNumber: string;
  sector: string;
  city: string;
}
export interface CompanyAccount {
  id: string;
  companyId: string;
  number: string;
  iban: string;
  currency: string;
}
export interface CompanyEmployee {
  id: string;
  companyId: string;
  name: string;
  nationalId: string;
  englishName: string;
}
export interface Card {
  id: string;
  companyId: string;
  employeeId?: string;
  last4: string;
  reference: string;
  holder: string;
  printedName: string;
  issuedAt: string;
  expiresAt: string;
  status: CardStatus;
  delivered: boolean;
  source: "Manual" | "Request";
  requestId?: string;
  replacementForCardId?: string;
}
export interface ServiceType {
  id: ServiceId;
  name: string;
  description: string;
}
export interface CardIssuanceDetails {
  employeeId?: string;
  printedName?: string;
}
export interface CardReplacementDetails {
  cardId?: string;
  reason?: string;
}
export interface CardStatusChangeDetails {
  requestedStatus?: CardStatus;
  reason?: string;
}
export interface CardPinRequestDetails {
  externalConfirmed?: boolean;
}
export interface CardTopUpDetails {
  amount?: number;
  transactionReference?: string;
  executionDate?: string;
  result?: "success" | "failed";
}
export interface CardDeliveryDetails {
  recipient?: string;
  identity?: string;
  deliveryDate?: string;
}
export interface CardStatementDetails {
  from?: string;
  to?: string;
}
export interface RequestHistory {
  id: string;
  at: string;
  actor: string;
  text: string;
}
export interface RequestAttachment {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  dataUrl?: string;
  simulated?: boolean;
}
export interface ServiceRequest {
  id: string;
  companyId: string;
  accountId: string;
  serviceId: ServiceId;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes: string;
  rejectionReason?: string;
  details: CardIssuanceDetails &
    CardReplacementDetails &
    CardStatusChangeDetails &
    CardPinRequestDetails &
    CardTopUpDetails &
    CardDeliveryDetails &
    CardStatementDetails;
  issuedCardId?: string;
  history: RequestHistory[];
  attachments: RequestAttachment[];
}
export interface Database {
  version: 1;
  companies: Company[];
  accounts: CompanyAccount[];
  employees: CompanyEmployee[];
  cards: Card[];
  services: ServiceType[];
  requests: ServiceRequest[];
}
