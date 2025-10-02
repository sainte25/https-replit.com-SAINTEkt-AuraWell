import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, jsonb, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const moodEntries = pgTable("mood_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  mood: text("mood").notNull(), // happy, calm, energetic, sad, anxious, grateful
  timestamp: timestamp("timestamp").defaultNow(),
  notes: text("notes"),
});

export const dailyActions = pgTable("daily_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  stepText: text("step_text").notNull(),
  completed: boolean("completed").default(false),
  points: integer("points").default(5),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reflections = pgTable("reflections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  gratitude: text("gratitude"),
  success: text("success"),
  improvement: text("improvement"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resources = pgTable("resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // meditation, exercise, nutrition, sleep
  organization: text("organization").notNull(),
  provider: text("provider").notNull(),
  imageUrl: text("image_url"),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  ratingCount: integer("rating_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resourceRatings = pgTable("resource_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  resourceId: varchar("resource_id").notNull().references(() => resources.id),
  rating: integer("rating").notNull(), // 1-5 stars
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const careTeamMembers = pgTable("care_team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  role: text("role").notNull(),
  organization: text("organization").notNull(),
  imageUrl: text("image_url"),
  dateAdded: timestamp("date_added").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  senderId: varchar("sender_id").notNull(), // userId or CHW id
  senderType: text("sender_type").notNull(), // 'user' or 'chw'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  provider: text("provider").notNull(),
  datetime: timestamp("datetime").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const voiceInteractions = pgTable("voice_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  transcript: text("transcript").notNull(),
  response: text("response").notNull(),
  sessionType: varchar("session_type").default("general"), // 'core_discovery', 'domain_checkin', 'general'
  discoveryPhase: varchar("discovery_phase"), // 'welcome', 'identity', 'context', 'goals', 'wrap'
  timestamp: timestamp("timestamp").defaultNow(),
});

// Core Discovery Sessions
export const coreDiscoverySessions = pgTable("core_discovery_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  phase: varchar("phase").notNull(), // 'welcome', 'identity', 'context', 'goals', 'wrap'
  currentStep: integer("current_step").default(0),
  collectedData: jsonb("collected_data").default({}),
  completed: boolean("completed").default(false),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// Domain Check-ins  
export const domainCheckins = pgTable("domain_checkins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  domain: varchar("domain").notNull(), // 'housing', 'work', 'mental_health', etc.
  scheduledDay: integer("scheduled_day").notNull(),
  completed: boolean("completed").default(false),
  triggerType: varchar("trigger_type").default("scheduled"), // 'scheduled', 'behavioral', 'life_event', 'emotional'
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// Enhanced Family/Caregiver Social Features
export const familyMembers = pgTable("family_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(), // parent, sibling, spouse, friend, caregiver, case_worker
  email: text("email"),
  phone: text("phone"),
  isEmergencyContact: boolean("is_emergency_contact").default(false),
  permissionLevel: text("permission_level").default("view_only"), // view_only, limited, full, emergency_only
  inviteStatus: text("invite_status").default("pending"), // pending, accepted, declined
  inviteCode: varchar("invite_code").unique(),
  profileImageUrl: text("profile_image_url"),
  notificationPreferences: jsonb("notification_preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at")
});

export const sharedWellnessInsights = pgTable("shared_wellness_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  familyMemberId: varchar("family_member_id").references(() => familyMembers.id),
  insightType: text("insight_type").notNull(), // mood_trend, goal_progress, milestone, reflection, emergency_alert
  title: text("title").notNull(),
  content: text("content").notNull(),
  shareLevel: text("share_level").default("selected_family"), // selected_family, all_family, emergency_only
  sharedWith: jsonb("shared_with").default([]), // array of family member IDs
  viewedBy: jsonb("viewed_by").default({}), // object with member ID -> timestamp
  autoShared: boolean("auto_shared").default(false),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const familyGoals = pgTable("family_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdByMemberId: varchar("created_by_member_id").references(() => familyMembers.id),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  progress: integer("progress").default(0), // 0-100
  status: text("status").default("active"), // active, completed, paused, cancelled
  collaborators: jsonb("collaborators").default([]), // array of family member IDs
  milestones: jsonb("milestones").default([]), // array of milestone objects
  celebrationMessage: text("celebration_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const familyNotifications = pgTable("family_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  familyMemberId: varchar("family_member_id").notNull().references(() => familyMembers.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  notificationType: text("notification_type").notNull(), // wellness_update, goal_progress, emergency_alert, check_in
  priority: text("priority").default("normal"), // low, normal, high, urgent
  deliveryMethod: text("delivery_method").default("in_app"), // in_app, email, sms, push
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  actionRequired: boolean("action_required").default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const familyCommunication = pgTable("family_communication", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  familyMemberId: varchar("family_member_id").references(() => familyMembers.id),
  senderId: varchar("sender_id").notNull(), // userId or familyMemberId
  senderType: text("sender_type").notNull(), // 'user' or 'family'
  messageType: text("message_type").default("text"), // 'text', 'encouragement', 'check_in', 'milestone_celebration'
  content: text("content").notNull(),
  attachments: jsonb("attachments"), // for voice notes, images, etc.
  isPrivate: boolean("is_private").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export const collaborativeCareGoals = pgTable("collaborative_care_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdBy: varchar("created_by").notNull(), // userId or familyMemberId
  creatorType: text("creator_type").notNull(), // 'user' or 'family'
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'mental_health', 'physical_health', 'social', 'life_skills'
  targetDate: timestamp("target_date"),
  progress: integer("progress").default(0), // 0-100
  status: text("status").default("active"), // 'active', 'completed', 'paused', 'archived'
  familySupport: jsonb("family_support"), // who's helping, how
  milestones: jsonb("milestones"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const careEvents = pgTable("care_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(), // 'crisis', 'achievement', 'setback', 'milestone', 'appointment'
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").default("low"), // 'low', 'medium', 'high', 'urgent'
  familyNotified: boolean("family_notified").default(false),
  followUpRequired: boolean("follow_up_required").default(false),
  relatedGoalId: varchar("related_goal_id").references(() => collaborativeCareGoals.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at")
});



// Advanced Analytics Tables
export const analyticsInsights = pgTable("analytics_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // mood_pattern, goal_progress, wellness_trend, risk_alert
  title: text("title").notNull(),
  description: text("description").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(), // 0.0 to 1.0
  data: jsonb("data"), // JSON data for visualization
  recommendations: text("recommendations").array(),
  created_at: timestamp("created_at").defaultNow(),
});

export const mlPredictions = pgTable("ml_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  prediction_type: text("prediction_type").notNull(), // mood_forecast, goal_success, wellness_score
  target_date: timestamp("target_date").notNull(),
  predicted_value: decimal("predicted_value", { precision: 5, scale: 2 }).notNull(),
  confidence_interval: decimal("confidence_interval", { precision: 3, scale: 2 }).notNull(),
  factors: text("factors").array(), // contributing factors
  created_at: timestamp("created_at").defaultNow(),
});

export const userBehaviorPatterns = pgTable("user_behavior_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pattern_type: text("pattern_type").notNull(), // interaction_frequency, mood_cycles, goal_completion
  pattern_data: jsonb("pattern_data").notNull(), // JSON data
  strength: decimal("strength", { precision: 3, scale: 2 }).notNull(), // pattern strength 0.0 to 1.0
  frequency: text("frequency").notNull(), // daily, weekly, monthly
  last_detected: timestamp("last_detected").defaultNow(),
});

// Comprehensive intake system tables
export const intakeResponses = pgTable("intake_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  domain: text("domain").notNull(), // e.g., 'employment', 'housing', 'personal_info'
  field: text("field").notNull(), // e.g., 'goal_30_days', 'current_housing'
  response: text("response").notNull(),
  referralTags: text("referral_tags").array(), // tags like ['needs_id', 'employment_referral']
  severity: text("severity"), // low, medium, high
  timestamp: timestamp("timestamp").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  referralType: text("referral_type").notNull(),
  partnerOrganization: text("partner_organization"),
  status: text("status").notNull().default("pending"), // sent, pending, accepted, declined
  dateSent: timestamp("date_sent").defaultNow(),
  description: text("description"),
  urgency: text("urgency").default("medium"), // low, medium, high
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({
  id: true,
  timestamp: true,
});

export const insertDailyActionSchema = createInsertSchema(dailyActions).omit({
  id: true,
  createdAt: true,
});

export const insertReflectionSchema = createInsertSchema(reflections).omit({
  id: true,
  createdAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  averageRating: true,
  ratingCount: true,
  createdAt: true,
});

export const insertResourceRatingSchema = createInsertSchema(resourceRatings).omit({
  id: true,
  createdAt: true,
});

export const insertCareTeamMemberSchema = createInsertSchema(careTeamMembers).omit({
  id: true,
  dateAdded: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceInteractionSchema = createInsertSchema(voiceInteractions).omit({
  id: true,
  timestamp: true,
});

// Family/Social Features Insert Schemas
export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
  inviteToken: true,
});

export const insertSharedWellnessInsightSchema = createInsertSchema(sharedWellnessInsights).omit({
  id: true,
  createdAt: true,
});

export const insertFamilyCommunicationSchema = createInsertSchema(familyCommunication).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertFamilyGoalSchema = createInsertSchema(familyGoals).omit({
  id: true,
  createdAt: true,
});

export const insertFamilyNotificationSchema = createInsertSchema(familyNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  readAt: true,
});

export const insertCollaborativeCareGoalSchema = createInsertSchema(collaborativeCareGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCareEventSchema = createInsertSchema(careEvents).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Types
export type User = typeof users.$inferSelect;

// Voice conversation context memory
export const voiceConversations = pgTable("voice_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default("demo-user-123"),
  sessionId: varchar("session_id").notNull(), // Groups related conversation turns
  userMessage: varchar("user_message", { length: 1000 }).notNull(),
  aiResponse: varchar("ai_response", { length: 2000 }).notNull(),
  mood: varchar("mood", { length: 50 }),
  emotionalTone: varchar("emotional_tone", { length: 50 }),
  conversationContext: jsonb("conversation_context"), // Previous context, topics discussed
  timestamp: timestamp("timestamp").defaultNow(),
});

export type VoiceConversation = typeof voiceConversations.$inferSelect;
export type InsertVoiceConversation = typeof voiceConversations.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;
export type DailyAction = typeof dailyActions.$inferSelect;
export type InsertDailyAction = z.infer<typeof insertDailyActionSchema>;
export type Reflection = typeof reflections.$inferSelect;
export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type ResourceRating = typeof resourceRatings.$inferSelect;
export type InsertResourceRating = z.infer<typeof insertResourceRatingSchema>;
export type CareTeamMember = typeof careTeamMembers.$inferSelect;
export type InsertCareTeamMember = z.infer<typeof insertCareTeamMemberSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type VoiceInteraction = typeof voiceInteractions.$inferSelect;
export type InsertVoiceInteraction = z.infer<typeof insertVoiceInteractionSchema>;

// Family/Social Features Types
export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type SharedWellnessInsight = typeof sharedWellnessInsights.$inferSelect;
export type InsertSharedWellnessInsight = z.infer<typeof insertSharedWellnessInsightSchema>;
export type FamilyCommunication = typeof familyCommunications.$inferSelect;
export type InsertFamilyCommunication = z.infer<typeof insertFamilyCommunicationSchema>;
export type FamilyGoal = typeof familyGoals.$inferSelect;
export type InsertFamilyGoal = z.infer<typeof insertFamilyGoalSchema>;
export type FamilyNotification = typeof familyNotifications.$inferSelect;
export type InsertFamilyNotification = z.infer<typeof insertFamilyNotificationSchema>;
export type CollaborativeCareGoal = typeof collaborativeCareGoals.$inferSelect;
export type InsertCollaborativeCareGoal = z.infer<typeof insertCollaborativeCareGoalSchema>;
export type CareEvent = typeof careEvents.$inferSelect;
export type InsertCareEvent = z.infer<typeof insertCareEventSchema>;

// Core Discovery types
export const insertCoreDiscoverySessionSchema = createInsertSchema(coreDiscoverySessions).omit({
  id: true,
  startedAt: true,
});

export const insertDomainCheckinSchema = createInsertSchema(domainCheckins).omit({
  id: true,
  createdAt: true,
});

export type CoreDiscoverySession = typeof coreDiscoverySessions.$inferSelect;
export type InsertCoreDiscoverySession = z.infer<typeof insertCoreDiscoverySessionSchema>;
export type DomainCheckin = typeof domainCheckins.$inferSelect;
export type InsertDomainCheckin = z.infer<typeof insertDomainCheckinSchema>;

// Community Pulse Questions
export const pulseQuestions = pgTable("pulse_questions", {
  id: varchar("id").primaryKey().$defaultFn(() => `pulse-q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type").notNull(), // 'multiple_choice', 'emoji_scale', 'open_text'
  options: text("options").array(),
  topic: varchar("topic").notNull(), // 'housing', 'health', 'parenting', 'dignity', etc.
  tags: text("tags").array(), // 'humor', 'real-talk', 'introspective', etc.
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  showInPopup: boolean("show_in_popup").default(true),
  showInHomebase: boolean("show_in_homebase").default(true),
  allowComparison: boolean("allow_comparison").default(true),
  createdByUserId: varchar("created_by_user_id"),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const pulseAnswers = pgTable("pulse_answers", {
  id: varchar("id").primaryKey().$defaultFn(() => `pulse-a-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`),
  userId: varchar("user_id").notNull(),
  questionId: varchar("question_id").notNull(),
  selectedOption: text("selected_option"),
  explanationText: text("explanation_text"),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
  userSnapshot: text("user_snapshot") // JSON string for emotional state, etc.
});

export const insertPulseQuestionSchema = createInsertSchema(pulseQuestions).omit({
  id: true,
  createdAt: true,
});

export const insertPulseAnswerSchema = createInsertSchema(pulseAnswers).omit({
  id: true,
  answeredAt: true,
});

export const insertIntakeResponseSchema = createInsertSchema(intakeResponses).omit({
  id: true,
  timestamp: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  dateSent: true,
});

export type PulseQuestion = typeof pulseQuestions.$inferSelect;
export type InsertPulseQuestion = z.infer<typeof insertPulseQuestionSchema>;
export type PulseAnswer = typeof pulseAnswers.$inferSelect;
export type InsertPulseAnswer = z.infer<typeof insertPulseAnswerSchema>;

// Biometric and Health Tables
export const biometricData = pgTable("biometric_data", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  heartRate: integer("heart_rate"),
  heartRateVariability: integer("heart_rate_variability"),
  sleepDuration: real("sleep_duration"), // hours
  sleepQuality: text("sleep_quality", { enum: ["poor", "fair", "good", "excellent"] }),
  stepCount: integer("step_count"),
  activeMinutes: integer("active_minutes"),
  stressLevel: integer("stress_level"), // 1-10 scale
  bloodOxygen: integer("blood_oxygen"), // percentage
  bodyTemperature: real("body_temperature"), // fahrenheit
  source: text("source", { enum: ["manual", "fitbit", "apple_health", "garmin", "samsung_health", "google_fit"] }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healthInsights = pgTable("health_insights", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type", { enum: ["sleep", "activity", "stress", "heart_health", "overall_wellness"] }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high"] }).notNull(),
  recommendations: text("recommendations").array().notNull(),
  trendDirection: text("trend_direction", { enum: ["improving", "stable", "declining"] }).notNull(),
  correlatedMoods: text("correlated_moods").array().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const moodBiometricCorrelations = pgTable("mood_biometric_correlations", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  moodId: text("mood_id").references(() => moodEntries.id),
  biometricDataId: text("biometric_data_id").references(() => biometricData.id),
  correlationStrength: real("correlation_strength").notNull(), // 0-1
  insights: text("insights").array().notNull(),
  recommendations: text("recommendations").array().notNull(),
  biometricFactors: json("biometric_factors").notNull(), // JSON object with detailed correlations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for biometric data
export const insertBiometricDataSchema = createInsertSchema(biometricData).omit({
  id: true,
  createdAt: true,
  timestamp: true,
});

export const insertHealthInsightSchema = createInsertSchema(healthInsights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMoodBiometricCorrelationSchema = createInsertSchema(moodBiometricCorrelations).omit({
  id: true,
  createdAt: true,
});

// Biometric types
export type BiometricData = typeof biometricData.$inferSelect;
export type InsertBiometricData = z.infer<typeof insertBiometricDataSchema>;
export type HealthInsight = typeof healthInsights.$inferSelect;
export type InsertHealthInsight = z.infer<typeof insertHealthInsightSchema>;
export type MoodBiometricCorrelation = typeof moodBiometricCorrelations.$inferSelect;
export type InsertMoodBiometricCorrelation = z.infer<typeof insertMoodBiometricCorrelationSchema>;
export type IntakeResponse = typeof intakeResponses.$inferSelect;
export type InsertIntakeResponse = z.infer<typeof insertIntakeResponseSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
