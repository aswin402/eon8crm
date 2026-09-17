export interface OrganizationConfig {
  legalName: string;
  brandName: string;
  shortName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gstin: string;
  stateCode: string;
  pan: string;
  sacCode: string;
  sacDescription: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
  complianceDeclaration: string;
}

export const DEFAULT_ORGANIZATION_CONFIG: OrganizationConfig = {
  legalName: "EON8 TECHNOLOGIES PVT LTD",
  brandName: "EON8 CRM & LABS",
  shortName: "EON8",
  address: "Plot No. 42, Guindy Industrial Estate, Guindy",
  city: "Chennai",
  state: "Tamil Nadu",
  country: "India",
  pincode: "600032",
  gstin: "33AABCE1234F1Z5",
  stateCode: "33",
  pan: "AABCE1234F",
  sacCode: "998314",
  sacDescription: "IT Design & Software Engineering",
  email: "billing@eon8.io",
  phone: "+91 44 2250 1000",
  bankName: "HDFC Bank Ltd",
  accountNumber: "50200088991122",
  ifsc: "HDFC0001234",
  branch: "Guindy, Chennai",
  upiId: "eon8crm@hdfcbank",
  complianceDeclaration:
    "Certified that particulars given above are true and correct. Invoice generated electronically in compliance with Section 31 of CGST Act 2017.",
};
