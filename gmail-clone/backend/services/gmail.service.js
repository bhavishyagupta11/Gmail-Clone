import { google } from "googleapis";

const REQUIRED_ENV_VARS = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"];

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
];

const ensureConfigured = () => {
  const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing Google OAuth env: ${missing.join(", ")}`);
  }
};

const getOAuthClient = () => {
  ensureConfigured();
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const getHeaderValue = (headers, name) => {
  const match = headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return match?.value || "";
};

const buildRawEmail = ({ from, to, subject, message }) => {
  const normalized = String(message || "").replace(/\r?\n/g, "\r\n");
  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    normalized,
  ].join("\r\n");

  return base64UrlEncode(raw);
};

const getCredentialSnapshot = (oauth2Client) => {
  const credentials = oauth2Client.credentials || {};
  return {
    accessToken: credentials.access_token || null,
    refreshToken: credentials.refresh_token || null,
    tokenExpiryDate: credentials.expiry_date || null,
    scope: credentials.scope || null,
  };
};

const persistCredentialChanges = async ({ oauth2Client, user, persistTokens }) => {
  if (!persistTokens) {
    return;
  }

  const previous = user.gmail || {};
  const next = getCredentialSnapshot(oauth2Client);

  const hasUpdates =
    (next.accessToken && next.accessToken !== previous.accessToken) ||
    (next.refreshToken && next.refreshToken !== previous.refreshToken) ||
    (next.tokenExpiryDate && next.tokenExpiryDate !== previous.tokenExpiryDate) ||
    (next.scope && next.scope !== previous.scope);

  if (!hasUpdates) {
    return;
  }

  await persistTokens({
    accessToken: next.accessToken || previous.accessToken || null,
    refreshToken: next.refreshToken || previous.refreshToken || null,
    tokenExpiryDate: next.tokenExpiryDate || previous.tokenExpiryDate || null,
    scope: next.scope || previous.scope || null,
  });
};

const getAuthorizedClients = async ({ user, persistTokens }) => {
  const refreshToken = user?.gmail?.refreshToken;
  if (!refreshToken) {
    throw new Error("Gmail account is not connected.");
  }

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    access_token: user?.gmail?.accessToken || undefined,
    expiry_date: user?.gmail?.tokenExpiryDate || undefined,
  });

  await oauth2Client.getAccessToken();
  await persistCredentialChanges({ oauth2Client, user, persistTokens });

  return {
    oauth2Client,
    gmail: google.gmail({ version: "v1", auth: oauth2Client }),
  };
};

export const isGmailConfigured = () => REQUIRED_ENV_VARS.every((name) => Boolean(process.env[name]));

export const buildGoogleConnectUrl = ({ state }) => {
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GMAIL_SCOPES,
    state,
  });
};

export const exchangeCodeForTokens = async ({ code }) => {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const profile = await oauth2.userinfo.get();

  return {
    connectedEmail: profile?.data?.email || null,
    accessToken: tokens.access_token || null,
    refreshToken: tokens.refresh_token || null,
    tokenExpiryDate: tokens.expiry_date || null,
    scope: tokens.scope || null,
  };
};

export const syncInboxFromGmail = async ({ user, persistTokens, limit = 50 }) => {
  const { gmail, oauth2Client } = await getAuthorizedClients({ user, persistTokens });
  const listRes = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults: limit,
  });

  const items = listRes.data.messages || [];
  const messages = [];

  for (const item of items) {
    const msgRes = await gmail.users.messages.get({
      userId: "me",
      id: item.id,
      format: "metadata",
      metadataHeaders: ["From", "To", "Subject", "Date"],
    });

    const payload = msgRes.data.payload || {};
    const headers = payload.headers || [];
    const labels = msgRes.data.labelIds || [];

    messages.push({
      externalMessageId: msgRes.data.id,
      from: getHeaderValue(headers, "From") || "unknown@unknown",
      to: getHeaderValue(headers, "To") || user.email,
      subject: getHeaderValue(headers, "Subject") || "(no subject)",
      message: msgRes.data.snippet || "(no content)",
      isRead: !labels.includes("UNREAD"),
      isSpam: labels.includes("SPAM"),
      isStarred: labels.includes("STARRED"),
      category: "primary",
      createdAt: msgRes.data.internalDate ? new Date(Number(msgRes.data.internalDate)) : new Date(),
    });
  }

  await persistCredentialChanges({ oauth2Client, user, persistTokens });

  return messages;
};

export const sendViaGmail = async ({ user, to, subject, message, persistTokens }) => {
  const { gmail, oauth2Client } = await getAuthorizedClients({ user, persistTokens });
  const from = user?.gmail?.connectedEmail || user.email;

  const raw = buildRawEmail({ from, to, subject, message });

  const sendRes = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  await persistCredentialChanges({ oauth2Client, user, persistTokens });

  return {
    delivered: true,
    externalMessageId: sendRes.data.id || null,
    from,
  };
};

export const applyGmailMessageUpdates = async ({ user, messageId, updates, persistTokens }) => {
  const { gmail, oauth2Client } = await getAuthorizedClients({ user, persistTokens });

  const addLabelIds = [];
  const removeLabelIds = [];

  if (typeof updates.isRead === "boolean") {
    if (updates.isRead) {
      removeLabelIds.push("UNREAD");
    } else {
      addLabelIds.push("UNREAD");
    }
  }

  if (typeof updates.isSpam === "boolean") {
    if (updates.isSpam) {
      addLabelIds.push("SPAM");
      removeLabelIds.push("INBOX");
    } else {
      removeLabelIds.push("SPAM");
      addLabelIds.push("INBOX");
    }
  }

  if (typeof updates.isStarred === "boolean") {
    if (updates.isStarred) {
      addLabelIds.push("STARRED");
    } else {
      removeLabelIds.push("STARRED");
    }
  }

  if (addLabelIds.length > 0 || removeLabelIds.length > 0) {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: [...new Set(addLabelIds)],
        removeLabelIds: [...new Set(removeLabelIds)],
      },
    });
  }

  await persistCredentialChanges({ oauth2Client, user, persistTokens });
};

export const trashGmailMessage = async ({ user, messageId, persistTokens }) => {
  const { gmail, oauth2Client } = await getAuthorizedClients({ user, persistTokens });
  await gmail.users.messages.trash({ userId: "me", id: messageId });
  await persistCredentialChanges({ oauth2Client, user, persistTokens });
};
