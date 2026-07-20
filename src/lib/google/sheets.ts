import { google } from "googleapis";

export interface SheetSnapshotData {
  active_leads: number;
  follow_up: number;
  intro_call: number;
  trying_to_call: number;
  won_mtd: number;
  status_breakdown: Record<string, number>;
  total_rows: number;
}

const STATUS_MAP: Record<string, keyof SheetSnapshotData> = {
  "active lead": "active_leads",
  "active": "active_leads",
  "pipeline": "active_leads",
  "new lead": "active_leads",
  "follow-up": "follow_up",
  "follow up": "follow_up",
  "followup": "follow_up",
  "follow up ": "follow_up",
  "intro call": "intro_call",
  "intro": "intro_call",
  "discovery": "intro_call",
  "discovery call": "intro_call",
  "trying to call": "trying_to_call",
  "attempting": "trying_to_call",
  "outreach": "trying_to_call",
  "attempting contact": "trying_to_call",
  "won": "won_mtd",
  "closed": "won_mtd",
  "closed won": "won_mtd",
  "won mtd": "won_mtd",
  "closed deal": "won_mtd",
  "deal closed": "won_mtd",
};

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error(
      "Google service account credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY in .env.local"
    );
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: email,
      private_key: key.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

export async function fetchSheetData(
  spreadsheetId: string,
  tabName: string
): Promise<SheetSnapshotData> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const range = tabName ? `${tabName}!A:Z` : "A:Z";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    return {
      active_leads: 0,
      follow_up: 0,
      intro_call: 0,
      trying_to_call: 0,
      won_mtd: 0,
      status_breakdown: {},
      total_rows: 0,
    };
  }

  const headers = rows[0].map((h: string) => String(h).toLowerCase().trim());
  const statusColIdx = headers.findIndex(
    (h: string) =>
      h === "status" ||
      h === "stage" ||
      h === "pipeline stage" ||
      h === "lead status" ||
      h === "deal stage"
  );

  const result: SheetSnapshotData = {
    active_leads: 0,
    follow_up: 0,
    intro_call: 0,
    trying_to_call: 0,
    won_mtd: 0,
    status_breakdown: {},
    total_rows: rows.length - 1,
  };

  if (statusColIdx === -1) {
    return result;
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[statusColIdx]) continue;

    const rawStatus = String(row[statusColIdx]).toLowerCase().trim();
    const normalizedStatus = rawStatus.replace(/[\s_-]+/g, " ").trim();

    result.status_breakdown[rawStatus] =
      (result.status_breakdown[rawStatus] || 0) + 1;

    const mappedField = STATUS_MAP[normalizedStatus];
    if (mappedField && mappedField !== "status_breakdown") {
      result[mappedField] = (result[mappedField] || 0) + 1;
    }
  }

  return result;
}

export async function testSheetAccess(
  spreadsheetId: string,
  tabName?: string
): Promise<{ success: boolean; error?: string; preview?: string[][] }> {
  try {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const range = tabName ? `${tabName}!A1:Z5` : "A1:Z5";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { success: false, error: "Sheet is empty or tab name not found" };
    }

    return {
      success: true,
      preview: rows.slice(0, 5) as string[][],
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    if (message.includes("Unable to parse range")) {
      return { success: false, error: `Tab "${tabName}" not found in sheet` };
    }
    if (message.includes("The caller does not have permission")) {
      return {
        success: false,
        error:
          "Service account does not have access. Share the Google Sheet with the service account email.",
      };
    }
    return { success: false, error: message };
  }
}
