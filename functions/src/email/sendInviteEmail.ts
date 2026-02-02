import { getFirestore } from "firebase-admin/firestore";
import { sendEmail } from "./sendEmail";
import { inviteEmailTemplate } from "./emailTemplates";

interface InviteData {
  email: string;
  name: string;
  role: string;
  orgId: string;
  invitedBy: string;
  status: string;
}

/**
 * Sends an invite email when a new invite document is created.
 * Called from the Firestore trigger in index.ts.
 */
export async function handleInviteCreated(
  inviteId: string,
  data: InviteData
): Promise<void> {
  if (data.status !== "pending") return;

  const db = getFirestore();

  // Get org info for branding
  let orgName = "your organization";
  let primaryColor: string | undefined;
  let logoURL: string | undefined;

  if (data.orgId) {
    const orgSnap = await db.collection("organizations").doc(data.orgId).get();
    if (orgSnap.exists) {
      const orgData = orgSnap.data();
      orgName = orgData?.name || orgName;
      primaryColor = orgData?.branding?.primaryColor;
      logoURL = orgData?.branding?.logoURL || orgData?.logoURL;
    }
  }

  // Get inviter name
  let inviterName = "Your team";
  if (data.invitedBy) {
    const inviterSnap = await db.collection("users").doc(data.invitedBy).get();
    if (inviterSnap.exists) {
      inviterName = inviterSnap.data()?.displayName || inviterName;
    }
  }

  const appUrl = process.env.APP_URL || "https://app.contractoros.com";
  const inviteLink = `${appUrl}/invite/${inviteId}`;

  const roleLabel: Record<string, string> = {
    EMPLOYEE: "Employee",
    CONTRACTOR: "Contractor",
    SUB: "Subcontractor",
    CLIENT: "Client",
    PM: "Project Manager",
  };

  const { subject, html } = inviteEmailTemplate({
    inviteeName: data.name,
    inviterName,
    orgName,
    role: roleLabel[data.role] || data.role,
    inviteLink,
    primaryColor,
    logoURL,
  });

  await sendEmail({ to: data.email, subject, html });
}
