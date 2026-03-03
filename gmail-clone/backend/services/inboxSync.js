import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { Email } from "../models/email.model.js";
import { isGmailConfigured, syncInboxFromGmail } from "./gmail.service.js";

const getImapConfig = () => ({
  host: process.env.IMAP_HOST || "imap.gmail.com",
  port: Number(process.env.IMAP_PORT || 993),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const syncViaGmailApi = async ({ user, persistTokens }) => {
  const { messages: gmailMessages, complete } = await syncInboxFromGmail({ user, persistTokens, limit: 100, maxPages: 20 });
  let imported = 0;
  let updated = 0;
  let removed = 0;

  const seenIds = new Set();

  for (const msg of gmailMessages) {
    if (!msg.externalMessageId) {
      continue;
    }

    seenIds.add(msg.externalMessageId);

    const existing = await Email.findOne({
      externalSource: "gmail",
      externalMessageId: msg.externalMessageId,
      userId: user._id,
    });

    if (existing) {
      const needsUpdate =
        existing.from !== msg.from ||
        existing.to !== msg.to ||
        existing.subject !== msg.subject ||
        existing.message !== msg.message ||
        existing.isRead !== msg.isRead ||
        existing.isStarred !== msg.isStarred ||
        existing.isSpam !== msg.isSpam ||
        existing.box !== msg.box ||
        existing.category !== msg.category;

      if (needsUpdate) {
        existing.from = msg.from;
        existing.to = msg.to;
        existing.subject = msg.subject;
        existing.message = msg.message;
        existing.isRead = msg.isRead;
        existing.isStarred = msg.isStarred;
        existing.isSpam = msg.isSpam;
        existing.box = msg.box;
        existing.category = msg.category;
        await existing.save();
        updated += 1;
      }

      continue;
    }

    await Email.create({
      from: msg.from,
      to: msg.to,
      subject: msg.subject,
      message: msg.message,
      box: msg.box,
      category: msg.category,
      isStarred: msg.isStarred,
      isRead: msg.isRead,
      isSpam: msg.isSpam,
      externalSource: "gmail",
      externalMessageId: msg.externalMessageId,
      userId: user._id,
      createdAt: msg.createdAt,
      updatedAt: msg.createdAt,
    });

    imported += 1;
  }

  if (complete) {
    const ids = [...seenIds];
    const deleteQuery = {
      externalSource: "gmail",
      userId: user._id,
    };

    if (ids.length > 0) {
      deleteQuery.externalMessageId = { $nin: ids };
    }

    const deleted = await Email.deleteMany(deleteQuery);
    removed = deleted.deletedCount || 0;
  }

  const details = [];
  if (updated > 0) details.push(`${updated} updated`);
  if (removed > 0) details.push(`${removed} removed`);
  if (!complete) details.push("partial sync");

  return {
    imported,
    reason: null,
    details: details.length > 0 ? details.join(", ") : null,
  };
};

const syncViaImapFallback = async ({ user }) => {
  const smtpUser = (process.env.SMTP_USER || "").toLowerCase();

  if (!smtpUser || !process.env.SMTP_PASS) {
    return { imported: 0, reason: "SMTP/IMAP credentials missing." };
  }

  const client = new ImapFlow(getImapConfig());
  let imported = 0;

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");

  try {
    for await (const msg of client.fetch("1:*", { uid: true, source: true, envelope: true })) {
      const uid = String(msg.uid);
      const exists = await Email.findOne({ externalSource: "imap", externalMessageId: uid, userId: user._id });
      if (exists) continue;

      const parsed = await simpleParser(msg.source);
      const fromEmail = parsed.from?.value?.[0]?.address || msg.envelope?.from?.[0]?.address || "unknown@unknown";
      const toEmail = parsed.to?.value?.[0]?.address || user.email;
      const subject = parsed.subject || "(no subject)";
      const textBody = (parsed.text || "").trim() || "(no content)";

      if ((fromEmail || "").toLowerCase() === smtpUser) continue;

      await Email.create({
        from: fromEmail,
        to: toEmail,
        subject,
        message: textBody,
        box: "inbox",
        category: "primary",
        isStarred: false,
        isRead: false,
        isSpam: false,
        externalSource: "imap",
        externalMessageId: uid,
        userId: user._id,
      });

      imported += 1;
    }
  } finally {
    lock.release();
    await client.logout();
  }

  return { imported, reason: null };
};

export const syncIncomingForUser = async ({ user, persistTokens }) => {
  if (isGmailConfigured() && user?.gmail?.refreshToken) {
    return syncViaGmailApi({ user, persistTokens });
  }

  return syncViaImapFallback({ user });
};






