import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/rbac";
import { redisConnection } from "../../jobs/redis";

export interface OrganizationSettings {
  legalName: string;
  shortName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  stateCode: string;
  pan: string;
  email: string;
  phone: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
  complianceDeclaration: string;
}

// Configurable Organization Profile with Indian Statutory Defaults
let organizationSettings: OrganizationSettings = {
  legalName: process.env.ORG_LEGAL_NAME || "EON8 TECHNOLOGIES PVT LTD",
  shortName: process.env.ORG_SHORT_NAME || "EON8",
  address: process.env.ORG_ADDRESS || "Plot No. 42, Guindy Industrial Estate, Guindy",
  city: process.env.ORG_CITY || "Chennai",
  state: process.env.ORG_STATE || "Tamil Nadu",
  pincode: process.env.ORG_PINCODE || "600032",
  gstin: process.env.ORG_GSTIN || "33AABCE1234F1Z5",
  stateCode: process.env.ORG_STATE_CODE || "33",
  pan: process.env.ORG_PAN || "AABCE1234F",
  email: process.env.ORG_EMAIL || "billing@eon8.io",
  phone: process.env.ORG_PHONE || "+91 44 2250 1000",
  bankName: process.env.ORG_BANK_NAME || "HDFC Bank Ltd",
  accountNumber: process.env.ORG_BANK_ACC || "50200088991122",
  ifsc: process.env.ORG_BANK_IFSC || "HDFC0001234",
  branch: process.env.ORG_BANK_BRANCH || "Guindy, Chennai",
  upiId: process.env.ORG_UPI_ID || "eon8crm@hdfcbank",
  complianceDeclaration:
    "Certified that particulars given above are true and correct. Invoice generated electronically in compliance with Section 31 of CGST Act 2017.",
};

export const STATUTORY_CONSTANTS = {
  DEFAULT_GST_RATE: 18,
  DEFAULT_SAC_CODE: "998314",
  SAC_DESCRIPTION: "Information Technology Design and Development Services",
  DEFAULT_PAYMENT_TERMS: "Net 30",
  DEFAULT_STATE_CODE: "33",
  DEFAULT_STATE_NAME: "Tamil Nadu",
  MSME_INTEREST_RATE_PER_ANNUM: 18,
};

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  try {
    const cached = await redisConnection.get("eon8:organization_settings");
    if (cached) {
      organizationSettings = {
        ...organizationSettings,
        ...JSON.parse(cached),
      };
    }
  } catch (err: any) {
    // Fall back gracefully to in-memory settings if Redis is unavailable
  }
  return organizationSettings;
}

const updateOrganizationSchema = z.object({
  legalName: z.string().min(1).optional(),
  shortName: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  pincode: z.string().min(1).optional(),
  gstin: z.string().length(15).optional(),
  stateCode: z.string().length(2).optional(),
  pan: z.string().length(10).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifsc: z.string().optional(),
  branch: z.string().optional(),
  upiId: z.string().optional(),
  complianceDeclaration: z.string().optional(),
});

const settingsRouter = new Hono();

// All settings routes require authentication
settingsRouter.use("*", requireAuth);

/**
 * GET /api/v1/settings/organization
 * Returns organization profile, GSTIN, and banking remittance details
 */
settingsRouter.get("/organization", async (c) => {
  const settings = await getOrganizationSettings();
  return c.json({ organization: settings, statutory: STATUTORY_CONSTANTS });
});

/**
 * PUT /api/v1/settings/organization
 * Allows ADMIN / SUPER_ADMIN to update company details
 */
settingsRouter.put("/organization", requireRole(["ADMIN"]), async (c) => {
  const body = await c.req.json();
  const parsed = updateOrganizationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
  }

  organizationSettings = {
    ...organizationSettings,
    ...parsed.data,
  };

  try {
    await redisConnection.set("eon8:organization_settings", JSON.stringify(organizationSettings));
  } catch (err: any) {
    // Non-fatal if Redis write fails; in-memory state remains updated
  }

  return c.json({
    message: "Organization settings updated successfully",
    organization: organizationSettings,
  });
});

export { settingsRouter };
