export interface OrganizationConfig {
  legalName: string;
  brandName: string;
  gstin: string;
  sacCode: string;
  sacDescription: string;
  city: string;
  state: string;
  country: string;
  address: string;
  pincode: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string;
}

export const DEFAULT_ORGANIZATION_CONFIG: OrganizationConfig = {
  legalName: "EON8 TECHNOLOGIES PVT LTD",
  brandName: "EON8 CRM & LABS",
  gstin: "33AABCE1234F1Z5",
  sacCode: "998314",
  sacDescription: "IT Design & Software Engineering",
  city: "Chennai",
  state: "Tamil Nadu",
  country: "India",
  address: "Plot No. 42, Guindy Industrial Estate, Guindy",
  pincode: "600032",
  email: "billing@eon8.io",
  phone: "+91 44 2250 1000",
  bankName: "HDFC Bank Ltd",
  accountNumber: "50200088991122",
  ifsc: "HDFC0001234",
  upiId: "eon8crm@hdfcbank",
};
