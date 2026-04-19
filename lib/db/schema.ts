import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["parent", "child"]);
export const eventSourceEnum = pgEnum("event_source", [
  "local",
  "google",
  "outlook",
]);
export const attendeeStatusEnum = pgEnum("attendee_status", [
  "yes",
  "no",
  "maybe",
]);
export const reminderChannelEnum = pgEnum("reminder_channel", [
  "push",
  "email",
]);
export const calendarProviderEnum = pgEnum("calendar_provider", [
  "google",
  "microsoft",
]);
export const syncDirectionEnum = pgEnum("sync_direction", [
  "read",
  "write",
  "both",
]);
export const tripStatusEnum = pgEnum("trip_status", [
  "idea",
  "planned",
  "done",
]);
export const vacationStatusEnum = pgEnum("vacation_status", [
  "idea",
  "booked",
  "done",
]);
export const mealSlotEnum = pgEnum("meal_slot", [
  "breakfast",
  "lunch",
  "dinner",
]);
export const wishStatusEnum = pgEnum("wish_status", [
  "open",
  "reserved",
  "gifted",
]);
export const notificationChannelEnum = pgEnum("notification_channel", [
  "push",
  "email",
  "in_app",
]);

// ─── Core: Family & Users ─────────────────────────────────────────────────────

export const families = pgTable("families", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id").references(() => families.id, {
    onDelete: "cascade",
  }),
  name: varchar("name", { length: 100 }).notNull(),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  role: userRoleEnum("role").notNull().default("parent"),
  color: varchar("color", { length: 7 }).notNull().default("#6366f1"),
  birthdate: timestamp("birthdate", { withTimezone: true }),
  avatar: text("avatar"),
  image: text("image"),
  pushSubscription: jsonb("push_subscription"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Auth.js v5 Tables ────────────────────────────────────────────────────────

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
);

// ─── Events ───────────────────────────────────────────────────────────────────

export const events = pgTable("events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  location: text("location"),
  geo: jsonb("geo").$type<{ lat: number; lon: number }>(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  allDay: boolean("all_day").notNull().default(false),
  rrule: text("rrule"),
  tzid: varchar("tzid", { length: 100 }).notNull().default("Europe/Berlin"),
  exdates: jsonb("exdates").$type<string[]>().default([]),
  colorOverride: varchar("color_override", { length: 7 }),
  source: eventSourceEnum("source").notNull().default("local"),
  externalId: text("external_id"),
  externalEtag: text("external_etag"),
  calendarLinkId: text("calendar_link_id"),
  createdBy: text("created_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const eventAttendees = pgTable(
  "event_attendees",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: attendeeStatusEnum("status").notNull().default("yes"),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.userId] })]
);

export const eventReminders = pgTable("event_reminders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  offsetMinutes: integer("offset_minutes").notNull().default(30),
  channel: reminderChannelEnum("channel").notNull().default("push"),
});

// ─── Calendar Links (externe Kalender) ───────────────────────────────────────

export const calendarLinks = pgTable(
  "calendar_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: calendarProviderEnum("provider").notNull(),
    accessTokenEnc: text("access_token_enc"),
    refreshTokenEnc: text("refresh_token_enc"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    calendarId: text("calendar_id"),
    syncToken: text("sync_token"),
    channelId: text("channel_id"),
    channelExpiry: timestamp("channel_expiry", { withTimezone: true }),
    syncDirection: syncDirectionEnum("sync_direction")
      .notNull()
      .default("read"),
    writeBackCalendarId: text("write_back_calendar_id"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  },
  (t) => [unique().on(t.userId, t.provider, t.calendarId)]
);

// ─── Trips / Ausflüge ─────────────────────────────────────────────────────────

export const trips = pgTable("trips", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  status: tripStatusEnum("status").notNull().default("idea"),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  location: text("location"),
  geo: jsonb("geo").$type<{ lat: number; lon: number }>(),
  plannedDate: timestamp("planned_date", { withTimezone: true }),
  estCost: real("est_cost"),
  tags: text("tags").array().default([]),
  season: text("season"),
  indoorOutdoor: text("indoor_outdoor"),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tripVotes = pgTable(
  "trip_votes",
  {
    tripId: text("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weight: integer("weight").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.tripId, t.userId] })]
);

export const tripEntries = pgTable("trip_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tripId: text("trip_id")
    .notNull()
    .references(() => trips.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  text: text("text"),
  cost: real("cost"),
  ratingByUser: jsonb("rating_by_user").$type<Record<string, number>>(),
  repeat: boolean("repeat").default(false),
  photos: text("photos").array().default([]),
});

// ─── Vacations / Urlaub ───────────────────────────────────────────────────────

export const vacations = pgTable("vacations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  from: timestamp("from", { withTimezone: true }).notNull(),
  to: timestamp("to", { withTimezone: true }).notNull(),
  destination: varchar("destination", { length: 200 }),
  geo: jsonb("geo").$type<{ lat: number; lon: number }>(),
  budget: real("budget"),
  status: vacationStatusEnum("status").notNull().default("idea"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const vacationDocs = pgTable("vacation_docs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  vacationId: text("vacation_id")
    .notNull()
    .references(() => vacations.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  type: text("type"),
});

export const vacationDays = pgTable("vacation_days", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  vacationId: text("vacation_id")
    .notNull()
    .references(() => vacations.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  plan: text("plan"),
  tripEntryId: text("trip_entry_id").references(() => tripEntries.id),
});

// ─── Meals / Rezepte ──────────────────────────────────────────────────────────

export const recipes = pgTable("recipes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  url: text("url"),
  imageUrl: text("image_url"),
  timeMinutes: integer("time_minutes"),
  category: text("category"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const recipeItems = pgTable("recipe_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  recipeId: text("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  qty: real("qty"),
  unit: varchar("unit", { length: 30 }),
});

export const meals = pgTable("meals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  slot: mealSlotEnum("slot").notNull(),
  recipeId: text("recipe_id").references(() => recipes.id),
  note: text("note"),
});

export const shoppingItems = pgTable("shopping_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  qty: real("qty"),
  unit: varchar("unit", { length: 30 }),
  done: boolean("done").notNull().default(false),
  fromMealId: text("from_meal_id").references(() => meals.id),
  fromRecipeItemId: text("from_recipe_item_id").references(
    () => recipeItems.id
  ),
});

// ─── Wishes / Wunschzettel ────────────────────────────────────────────────────

export const wishes = pgTable("wishes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  childId: text("child_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  url: text("url"),
  imageUrl: text("image_url"),
  price: real("price"),
  priority: integer("priority").default(0),
  category: text("category"),
  status: wishStatusEnum("status").notNull().default("open"),
  reservedBy: text("reserved_by"),
  visibleToChild: boolean("visible_to_child").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const wishShareLinks = pgTable("wish_share_links", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  childId: text("child_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

// ─── Weather Cache ────────────────────────────────────────────────────────────

export const weatherCache = pgTable(
  "weather_cache",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    geohash: varchar("geohash", { length: 10 }).notNull(),
    date: text("date").notNull(),
    provider: varchar("provider", { length: 20 }).notNull(),
    payload: jsonb("payload").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.geohash, t.date, t.provider)]
);

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  dataJson: jsonb("data_json"),
  channel: notificationChannelEnum("channel").notNull().default("in_app"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp("read_at", { withTimezone: true }),
});

// ─── Audit Log ────────────────────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  familyId: text("family_id")
    .notNull()
    .references(() => families.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id),
  entity: varchar("entity", { length: 50 }).notNull(),
  entityId: text("entity_id").notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  diff: jsonb("diff"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Feature Flags ────────────────────────────────────────────────────────────

export const featureFlags = pgTable(
  "feature_flags",
  {
    familyId: text("family_id")
      .notNull()
      .references(() => families.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 50 }).notNull(),
    enabled: boolean("enabled").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.familyId, t.key] })]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const familiesRelations = relations(families, ({ many }) => ({
  users: many(users),
  events: many(events),
  trips: many(trips),
  vacations: many(vacations),
  meals: many(meals),
  recipes: many(recipes),
  auditLog: many(auditLog),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  family: one(families, { fields: [users.familyId], references: [families.id] }),
  accounts: many(accounts),
  sessions: many(sessions),
  eventAttendees: many(eventAttendees),
  calendarLinks: many(calendarLinks),
  wishes: many(wishes),
  notifications: many(notifications),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  family: one(families, { fields: [events.familyId], references: [families.id] }),
  creator: one(users, { fields: [events.createdBy], references: [users.id] }),
  attendees: many(eventAttendees),
  reminders: many(eventReminders),
}));
