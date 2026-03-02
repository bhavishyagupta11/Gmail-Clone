import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { Email } from "../models/email.model.js";

const getImapConfig = () => ({
  host: process.env.IMAP_HOST || "imap.gmail.com",
  port: Number(process.env.IMAP_PORT || 993),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const syncIncomingForUser = async ({ user }) => {
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
      const exists = await Email.findOne({ externalMessageId: uid, userId: user._id });
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
        isSpam: false,
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