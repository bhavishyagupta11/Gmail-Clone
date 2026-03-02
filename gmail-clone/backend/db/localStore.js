import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "localdb.json");

const DEFAULT_DB = {
  users: [],
  emails: [],
};

let writeQueue = Promise.resolve();

const ensureDbFile = async () => {
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
  }
};

const readDb = async () => {
  await ensureDbFile();
  const raw = await fs.readFile(DB_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      emails: Array.isArray(parsed.emails) ? parsed.emails : [],
    };
  } catch {
    return { ...DEFAULT_DB };
  }
};

const writeDb = async (data) => {
  writeQueue = writeQueue.then(() => fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8"));
  await writeQueue;
};

const nowIso = () => new Date().toISOString();

export const findUserByEmail = async (email) => {
  const db = await readDb();
  return db.users.find((user) => user.email === email) || null;
};

export const findUserById = async (id) => {
  const db = await readDb();
  return db.users.find((user) => user._id === id) || null;
};

export const createUser = async ({ fullname, email, password, profilePhoto }) => {
  const db = await readDb();
  const timestamp = nowIso();

  const user = {
    _id: randomUUID(),
    fullname,
    email,
    password,
    profilePhoto,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.users.push(user);
  await writeDb(db);
  return user;
};

export const updateUserById = async ({ userId, updates }) => {
  const db = await readDb();
  const index = db.users.findIndex((user) => user._id === userId);

  if (index === -1) {
    return null;
  }

  const updated = {
    ...db.users[index],
    ...updates,
    updatedAt: nowIso(),
  };

  db.users[index] = updated;
  await writeDb(db);
  return updated;
};

export const createEmail = async ({
  from,
  to,
  subject,
  message,
  userId,
  box = "inbox",
  category = "primary",
  isRead,
  externalMessageId = null,
}) => {
  const db = await readDb();
  const timestamp = nowIso();

  const email = {
    _id: randomUUID(),
    from,
    to,
    subject,
    message,
    userId,
    box,
    isRead: typeof isRead === "boolean" ? isRead : box === "sent",
    isStarred: false,
    isSpam: false,
    category,
    externalMessageId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.emails.push(email);
  await writeDb(db);
  return email;
};

export const getEmailsByUserId = async (userId) => {
  const db = await readDb();
  return db.emails
    .filter((email) => email.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getEmailByIdForUser = async ({ emailId, userId }) => {
  const db = await readDb();
  return db.emails.find((email) => email._id === emailId && email.userId === userId) || null;
};

export const updateEmailByIdForUser = async ({ emailId, userId, updates }) => {
  const db = await readDb();
  const index = db.emails.findIndex((email) => email._id === emailId && email.userId === userId);

  if (index === -1) {
    return null;
  }

  const existing = db.emails[index];
  const updated = {
    ...existing,
    ...updates,
    updatedAt: nowIso(),
  };

  db.emails[index] = updated;
  await writeDb(db);
  return updated;
};

export const deleteEmailByIdForUser = async ({ emailId, userId }) => {
  const db = await readDb();
  const index = db.emails.findIndex((email) => email._id === emailId && email.userId === userId);

  if (index === -1) {
    return null;
  }

  const [deleted] = db.emails.splice(index, 1);
  await writeDb(db);
  return deleted;
};