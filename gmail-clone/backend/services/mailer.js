import nodemailer from "nodemailer";

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 0),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM,
});

const createTransporter = () => {
  const cfg = getSmtpConfig();
  const configured = Boolean(cfg.host) && Boolean(cfg.port) && Boolean(cfg.user) && Boolean(cfg.pass);

  if (!configured) {
    return { transporter: null, cfg };
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });

  return { transporter, cfg };
};

export const sendEmailViaSmtp = async ({ from, to, subject, message }) => {
  const { transporter, cfg } = createTransporter();

  if (!transporter) {
    return { delivered: false, reason: "SMTP is not configured." };
  }

  const fromAddress = cfg.from || cfg.user;

  await transporter.sendMail({
    from: fromAddress,
    replyTo: from,
    to,
    subject,
    text: message,
  });

  return { delivered: true };
};