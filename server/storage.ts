import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, sql } from "drizzle-orm";
import { 
  users, moodEntries, dailyActions, reflections, resources, resourceRatings,
  careTeamMembers, messages, appointments, voiceInteractions, pulseQuestions, pulseAnswers,
  coreDiscoverySessions, domainCheckins, familyMembers, sharedWellnessInsights,
  familyCommunication, collaborativeCareGoals, careEvents, voiceConversations,
  type User, type InsertUser, type MoodEntry, type InsertMoodEntry,
  type DailyAction, type InsertDailyAction, type Reflection, type InsertReflection,
  type Resource, type InsertResource, type ResourceRating, type InsertResourceRating,
  type CareTeamMember, type InsertCareTeamMember, type Message, type InsertMessage,
  type Appointment, type InsertAppointment, type VoiceInteraction, type InsertVoiceInteraction,
  type PulseQuestion, type InsertPulseQuestion, type PulseAnswer, type InsertPulseAnswer,
  type CoreDiscoverySession, type InsertCoreDiscoverySession, type DomainCheckin, type InsertDomainCheckin,
  type FamilyMember, type InsertFamilyMember, type SharedWellnessInsight, type InsertSharedWellnessInsight,
  type FamilyCommunication, type InsertFamilyCommunication, type CollaborativeCareGoal, type InsertCollaborativeCareGoal,
  type CareEvent, type InsertCareEvent, type VoiceConversation, type InsertVoiceConversation
} from "@shared/schema";

// Construct proper PostgreSQL connection string from environment variables
let DATABASE_URL = process.env.DATABASE_URL;

// If DATABASE_URL is not in PostgreSQL format, construct it from individual vars
if (!DATABASE_URL || !DATABASE_URL.startsWith('postgresql://')) {
  const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;
  
  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE && PGPORT) {
    DATABASE_URL = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
  } else {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection string or individual PG environment variables must be provided");
  }
}

const sql_client = neon(DATABASE_URL);
const db = drizzle(sql_client);

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create tables if they don't exist
    await sql_client`
      CREATE TABLE IF NOT EXISTS users (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        username text NOT NULL UNIQUE,
        password text NOT NULL,
        created_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS mood_entries (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        mood text NOT NULL,
        timestamp timestamp DEFAULT NOW(),
        notes text
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS daily_actions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        date text NOT NULL,
        step_text text NOT NULL,
        completed boolean DEFAULT false,
        points integer DEFAULT 5,
        created_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS reflections (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        date text NOT NULL,
        gratitude text,
        success text,
        improvement text,
        created_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS resources (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text NOT NULL,
        category text NOT NULL,
        organization text NOT NULL,
        provider text NOT NULL,
        image_url text,
        average_rating decimal(3,2) DEFAULT 0,
        rating_count integer DEFAULT 0,
        created_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS resource_ratings (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        resource_id varchar NOT NULL,
        rating integer NOT NULL,
        review text,
        created_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS care_team_members (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        name text NOT NULL,
        role text NOT NULL,
        organization text NOT NULL,
        image_url text,
        date_added timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS messages (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        sender_id varchar NOT NULL,
        sender_type text NOT NULL,
        content text NOT NULL,
        timestamp timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS appointments (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        title text NOT NULL,
        provider text NOT NULL,
        datetime timestamp NOT NULL,
        notes text,
        created_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS voice_interactions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        transcript text NOT NULL,
        response text NOT NULL,
        session_type varchar DEFAULT 'general',
        discovery_phase varchar,
        timestamp timestamp DEFAULT NOW()
      )
    `;

    // Add missing columns if they don't exist
    try {
      await sql_client`ALTER TABLE voice_interactions ADD COLUMN IF NOT EXISTS session_type varchar DEFAULT 'general'`;
      await sql_client`ALTER TABLE voice_interactions ADD COLUMN IF NOT EXISTS discovery_phase varchar`;
    } catch (e) {
      // Columns already exist, ignore error
    }

    await sql_client`
      CREATE TABLE IF NOT EXISTS core_discovery_sessions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        phase varchar NOT NULL,
        current_step integer DEFAULT 0,
        collected_data jsonb DEFAULT '{}',
        completed boolean DEFAULT false,
        started_at timestamp DEFAULT NOW(),
        completed_at timestamp
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS domain_checkins (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        domain varchar NOT NULL,
        scheduled_day integer NOT NULL,
        completed boolean DEFAULT false,
        trigger_type varchar DEFAULT 'scheduled',
        created_at timestamp DEFAULT NOW(),
        completed_at timestamp
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS pulse_questions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        question_text text NOT NULL,
        question_type varchar NOT NULL,
        options text[],
        topic varchar NOT NULL,
        tags text[],
        start_date timestamp,
        end_date timestamp,
        show_in_popup boolean DEFAULT true,
        show_in_homebase boolean DEFAULT true,
        allow_comparison boolean DEFAULT true,
        created_by_user_id varchar,
        featured boolean DEFAULT false,
        created_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS pulse_answers (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        question_id varchar NOT NULL,
        selected_option text,
        explanation_text text,
        answered_at timestamp DEFAULT NOW(),
        user_snapshot text
      )
    `;

    // Family/Social Features Tables
    await sql_client`
      CREATE TABLE IF NOT EXISTS family_members (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        name text NOT NULL,
        relationship text NOT NULL,
        email text,
        phone text,
        is_emergency_contact boolean DEFAULT false,
        permission_level text DEFAULT 'basic',
        invite_status text DEFAULT 'pending',
        invite_code varchar UNIQUE,
        profile_image_url text,
        created_at timestamp DEFAULT NOW(),
        last_active_at timestamp
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS shared_wellness_insights (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        family_member_id varchar NOT NULL,
        insight_type text NOT NULL,
        title text NOT NULL,
        content jsonb NOT NULL,
        share_level text DEFAULT 'summary',
        is_auto_shared boolean DEFAULT true,
        viewed_at timestamp,
        created_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS family_communication (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        family_member_id varchar,
        sender_id varchar NOT NULL,
        sender_type text NOT NULL,
        message_type text DEFAULT 'text',
        content text NOT NULL,
        attachments jsonb,
        is_private boolean DEFAULT false,
        read_at timestamp,
        created_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS collaborative_care_goals (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        created_by varchar NOT NULL,
        creator_type text NOT NULL,
        title text NOT NULL,
        description text,
        category text NOT NULL,
        target_date timestamp,
        progress integer DEFAULT 0,
        status text DEFAULT 'active',
        family_support jsonb,
        milestones jsonb,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      )
    `;

    await sql_client`
      CREATE TABLE IF NOT EXISTS care_events (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        event_type text NOT NULL,
        title text NOT NULL,
        description text,
        severity text DEFAULT 'low',
        family_notified boolean DEFAULT false,
        follow_up_required boolean DEFAULT false,
        related_goal_id varchar,
        metadata jsonb,
        created_at timestamp DEFAULT NOW(),
        resolved_at timestamp
      )
    `;

    // Voice conversation context memory table
    await sql_client`
      CREATE TABLE IF NOT EXISTS voice_conversations (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL DEFAULT 'demo-user-123',
        session_id varchar NOT NULL,
        user_message varchar(1000) NOT NULL,
        ai_response varchar(2000) NOT NULL,
        mood varchar(50),
        emotional_tone varchar(50),
        conversation_context jsonb,
        timestamp timestamp DEFAULT NOW()
      )
    `;

    console.log("Database tables initialized successfully");
    
    // Seed sample pulse questions
    await seedPulseQuestions();
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

async function seedPulseQuestions() {
  try {
    // Check if questions already exist
    const existingQuestions = await db.select().from(pulseQuestions).limit(1);
    if (existingQuestions.length > 0) {
      console.log("Pulse questions already seeded");
      return;
    }

    const sampleQuestions = [
      {
        questionText: "How safe do you feel in your current living situation?",
        questionType: "multiple_choice",
        options: ["Very safe", "Mostly safe", "Sometimes unsafe", "Often unsafe", "Never safe"],
        topic: "housing",
        tags: ["safety", "real-talk"],
        featured: true
      },
      {
        questionText: "What helps you feel most at home?",
        questionType: "multiple_choice", 
        options: ["Clean space", "Personal items", "Good neighbors", "Quiet environment", "Affordable rent"],
        topic: "housing",
        tags: ["comfort", "introspective"]
      },
      {
        questionText: "When you think about healthcare, what comes to mind first?",
        questionType: "multiple_choice",
        options: ["Hope for healing", "Stress about costs", "Trust in providers", "Fear of judgment", "Gratitude for access"],
        topic: "health",
        tags: ["real-talk", "reflection"]
      },
      {
        questionText: "How do you usually take care of your mental health?",
        questionType: "multiple_choice",
        options: ["Talk to friends", "Exercise or walk", "Listen to music", "Pray or meditate", "Journal or reflect"],
        topic: "health",
        tags: ["self-care", "introspective"]
      },
      {
        questionText: "What does dignity mean to you in daily life?",
        questionType: "multiple_choice",
        options: ["Being heard", "Having choices", "Respect from others", "Personal privacy", "Fair treatment"],
        topic: "dignity",
        tags: ["values", "introspective"]
      },
      {
        questionText: "When facing financial stress, what helps you most?",
        questionType: "multiple_choice",
        options: ["Family support", "Community resources", "Planning ahead", "Taking it one day at a time", "Faith or hope"],
        topic: "economic",
        tags: ["coping", "real-talk"]
      },
      {
        questionText: "How do you prefer to receive support during tough times?",
        questionType: "multiple_choice",
        options: ["Someone to listen", "Practical help", "Being left alone", "Group activities", "Professional guidance"],
        topic: "support",
        tags: ["connection", "introspective"]
      },
      {
        questionText: "What makes you feel most connected to your community?",
        questionType: "multiple_choice",
        options: ["Shared experiences", "Helping others", "Cultural events", "Neighborhood activities", "Online groups"],
        topic: "community",
        tags: ["connection", "belonging"]
      },
      {
        questionText: "How do you handle judgment from others?",
        questionType: "multiple_choice",
        options: ["Ignore it completely", "Talk to trusted friends", "Reflect on their perspective", "Stand up for myself", "Focus on my own growth"],
        topic: "dignity",
        tags: ["resilience", "real-talk"]
      },
      {
        questionText: "What gives you strength when everything feels overwhelming?",
        questionType: "multiple_choice",
        options: ["My values", "Past victories", "Loved ones", "Faith or spirituality", "Inner wisdom"],
        topic: "resilience",
        tags: ["strength", "introspective"]
      },
      {
        questionText: "How do you define success in your own life?",
        questionType: "multiple_choice",
        options: ["Peace of mind", "Family happiness", "Financial stability", "Personal growth", "Helping others"],
        topic: "values",
        tags: ["introspective", "personal"]
      },
      {
        questionText: "What does home mean to you?",
        questionType: "multiple_choice",
        options: ["A safe place", "Where loved ones are", "Personal space", "Community connection", "Emotional comfort"],
        topic: "housing",
        tags: ["meaning", "introspective"]
      },
      {
        questionText: "When you need healthcare, what matters most?",
        questionType: "multiple_choice",
        options: ["Being treated with respect", "Affordable costs", "Quick access", "Quality care", "Cultural understanding"],
        topic: "health",
        tags: ["priorities", "real-talk"]
      },
      {
        questionText: "How do you stay hopeful during difficult times?",
        questionType: "multiple_choice",
        options: ["Focus on small wins", "Connect with others", "Remember past strength", "Practice gratitude", "Keep moving forward"],
        topic: "resilience",
        tags: ["hope", "coping"]
      },
      {
        questionText: "What would make your neighborhood feel safer?",
        questionType: "multiple_choice",
        options: ["Better lighting", "More community events", "Stronger relationships", "Economic opportunities", "Less judgment"],
        topic: "safety",
        tags: ["community", "real-talk"]
      },
      {
        questionText: "How do you want to be remembered?",
        questionType: "multiple_choice",
        options: ["As someone who cared", "As resilient and strong", "As a good friend/family member", "As someone who helped others", "As authentically myself"],
        topic: "values",
        tags: ["legacy", "introspective"]
      },
      {
        questionText: "What helps you sleep better at night?",
        questionType: "multiple_choice",
        options: ["Feeling safe", "Having enough money", "Good relationships", "Accomplishing goals", "Peace of mind"],
        topic: "wellbeing",
        tags: ["peace", "introspective"]
      },
      {
        questionText: "How do you handle when others don't understand your situation?",
        questionType: "multiple_choice",
        options: ["Educate them gently", "Find people who do understand", "Focus on my own path", "Use it as motivation", "Accept that not everyone will"],
        topic: "dignity",
        tags: ["understanding", "real-talk"]
      },
      {
        questionText: "What gives your life meaning?",
        questionType: "multiple_choice",
        options: ["Relationships with others", "Personal growth", "Making a difference", "Spiritual connection", "Creating something lasting"],
        topic: "values",
        tags: ["purpose", "introspective"]
      },
      {
        questionText: "How do you celebrate small victories?",
        questionType: "multiple_choice",
        options: ["Share with loved ones", "Take time to reflect", "Treat myself kindly", "Keep it private", "Use it as motivation"],
        topic: "celebration",
        tags: ["joy", "personal"]
      }
    ];

    await db.insert(pulseQuestions).values(sampleQuestions);
    console.log("Pulse questions seeded successfully");
    
    // Add sample answers to create realistic community responses
    await seedSampleAnswers();
  } catch (error) {
    console.error("Error seeding pulse questions:", error);
  }
}

async function seedSampleAnswers() {
  try {
    // Check if sample answers already exist
    const existingAnswers = await db.select().from(pulseAnswers).limit(1);
    if (existingAnswers.length > 0) {
      console.log("Sample answers already seeded");
      return;
    }

    // Get the actual question IDs from the database
    const questions = await db.select().from(pulseQuestions).limit(2);
    if (questions.length < 2) return;

    const sampleAnswers = [
      // Safety question responses
      { userId: "sample-1", questionId: questions[0].id, selectedOption: "Mostly safe", answeredAt: new Date("2025-01-15") },
      { userId: "sample-2", questionId: questions[0].id, selectedOption: "Very safe", answeredAt: new Date("2025-01-16") },
      { userId: "sample-3", questionId: questions[0].id, selectedOption: "Sometimes unsafe", answeredAt: new Date("2025-01-17") },
      { userId: "sample-4", questionId: questions[0].id, selectedOption: "Mostly safe", answeredAt: new Date("2025-01-18") },
      { userId: "sample-5", questionId: questions[0].id, selectedOption: "Very safe", answeredAt: new Date("2025-01-19") },
      { userId: "sample-6", questionId: questions[0].id, selectedOption: "Mostly safe", answeredAt: new Date("2025-01-20") },
      { userId: "sample-7", questionId: questions[0].id, selectedOption: "Sometimes unsafe", answeredAt: new Date("2025-01-21") },
      { userId: "sample-8", questionId: questions[0].id, selectedOption: "Often unsafe", answeredAt: new Date("2025-01-22") },
      
      // Home comfort responses
      { userId: "sample-1", questionId: questions[1].id, selectedOption: "Clean space", answeredAt: new Date("2025-01-15") },
      { userId: "sample-2", questionId: questions[1].id, selectedOption: "Personal items", answeredAt: new Date("2025-01-16") },
      { userId: "sample-3", questionId: questions[1].id, selectedOption: "Good neighbors", answeredAt: new Date("2025-01-17") },
      { userId: "sample-4", questionId: questions[1].id, selectedOption: "Clean space", answeredAt: new Date("2025-01-18") },
      { userId: "sample-5", questionId: questions[1].id, selectedOption: "Personal items", answeredAt: new Date("2025-01-19") },
      { userId: "sample-6", questionId: questions[1].id, selectedOption: "Affordable rent", answeredAt: new Date("2025-01-20") }
    ];

    await db.insert(pulseAnswers).values(sampleAnswers);
    console.log("Sample answers seeded successfully");
  } catch (error) {
    console.error("Error seeding sample answers:", error);
  }
}

// Initialize database on startup
initializeDatabase();

export { sql_client };

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Mood Entries
  createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry>;
  getMoodEntries(userId: string, startDate?: Date, endDate?: Date): Promise<MoodEntry[]>;

  // Daily Actions
  createDailyAction(action: InsertDailyAction): Promise<DailyAction>;
  getDailyActions(userId: string, date: string): Promise<DailyAction[]>;
  updateDailyAction(id: string, completed: boolean): Promise<DailyAction>;

  // Reflections
  createReflection(reflection: InsertReflection): Promise<Reflection>;
  getReflection(userId: string, date: string): Promise<Reflection | undefined>;

  // Resources
  getResources(category?: string): Promise<Resource[]>;
  createResourceRating(rating: InsertResourceRating): Promise<ResourceRating>;
  getResourceRatings(resourceId: string): Promise<ResourceRating[]>;
  updateResourceRating(resourceId: string): Promise<void>;

  // Care Team
  getCareTeam(userId: string): Promise<CareTeamMember[]>;
  addCareTeamMember(member: InsertCareTeamMember): Promise<CareTeamMember>;

  // Messages
  getMessages(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Appointments
  getAppointments(userId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;

  // Voice Interactions
  createVoiceInteraction(interaction: InsertVoiceInteraction): Promise<VoiceInteraction>;
  getRecentVoiceInteractions(userId: string, limit: number): Promise<VoiceInteraction[]>;
  storeVoiceInteraction(userId: string, transcript: string, response: string): Promise<VoiceInteraction>;
  getVoiceInteractions(userId: string): Promise<VoiceInteraction[]>;
  getUserMoods(userId: string): Promise<MoodEntry[]>;
  getUserActions(userId: string, date: string): Promise<DailyAction[]>;

  // Core Discovery Sessions
  getCoreDiscoverySessions(userId: string): Promise<CoreDiscoverySession[]>;
  createCoreDiscoverySession(session: InsertCoreDiscoverySession): Promise<CoreDiscoverySession>;
  getCoreDiscoverySession(sessionId: string): Promise<CoreDiscoverySession | undefined>;
  updateCoreDiscoverySession(sessionId: string, updates: Partial<InsertCoreDiscoverySession>): Promise<CoreDiscoverySession>;

  // Domain Check-ins
  createDomainCheckin(checkin: InsertDomainCheckin): Promise<DomainCheckin>;
  getDomainCheckins(userId: string): Promise<DomainCheckin[]>;

  // Community Pulse Questions
  getFeaturedQuestion(): Promise<PulseQuestion | null>;
  getActiveQuestions(): Promise<PulseQuestion[]>;
  createPulseAnswer(answer: InsertPulseAnswer): Promise<PulseAnswer>;
  getUserAnswers(userId: string): Promise<PulseAnswer[]>;
  getQuestionStats(questionId: string): Promise<{ answerCount: number; answerDistribution: { [key: string]: number } }>;
  hasUserAnsweredQuestion(userId: string, questionId: string): Promise<boolean>;
  
  // Intake and referral management
  createIntakeResponse(response: any): Promise<any>;
  getUserIntakeResponses(userId: string): Promise<any[]>;
  createReferral(referral: any): Promise<any>;
  getUserReferrals(userId: string): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async createMoodEntry(entry: InsertMoodEntry): Promise<MoodEntry> {
    const result = await db.insert(moodEntries).values(entry).returning();
    return result[0];
  }

  async getMoodEntries(userId: string, startDate?: Date, endDate?: Date): Promise<MoodEntry[]> {
    if (startDate && endDate) {
      return db.select().from(moodEntries)
        .where(
          and(
            eq(moodEntries.userId, userId),
            sql`${moodEntries.timestamp} >= ${startDate}`,
            sql`${moodEntries.timestamp} <= ${endDate}`
          )
        )
        .orderBy(desc(moodEntries.timestamp));
    }
    
    return db.select().from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.timestamp));
  }

  async createDailyAction(action: InsertDailyAction): Promise<DailyAction> {
    const result = await db.insert(dailyActions).values(action).returning();
    return result[0];
  }

  async getDailyActions(userId: string, date: string): Promise<DailyAction[]> {
    return db.select().from(dailyActions)
      .where(and(eq(dailyActions.userId, userId), eq(dailyActions.date, date)))
      .orderBy(dailyActions.createdAt);
  }

  async updateDailyAction(id: string, completed: boolean): Promise<DailyAction> {
    const result = await db.update(dailyActions)
      .set({ completed })
      .where(eq(dailyActions.id, id))
      .returning();
    return result[0];
  }

  async createReflection(reflection: InsertReflection): Promise<Reflection> {
    const result = await db.insert(reflections).values(reflection).returning();
    return result[0];
  }

  async getReflection(userId: string, date: string): Promise<Reflection | undefined> {
    const result = await db.select().from(reflections)
      .where(and(eq(reflections.userId, userId), eq(reflections.date, date)))
      .limit(1);
    return result[0];
  }

  async getResources(category?: string): Promise<Resource[]> {
    if (category) {
      return db.select().from(resources)
        .where(eq(resources.category, category))
        .orderBy(desc(resources.averageRating));
    }
    return db.select().from(resources)
      .orderBy(desc(resources.averageRating));
  }

  async createResourceRating(rating: InsertResourceRating): Promise<ResourceRating> {
    const result = await db.insert(resourceRatings).values(rating).returning();
    await this.updateResourceRating(rating.resourceId);
    return result[0];
  }

  async getResourceRatings(resourceId: string): Promise<ResourceRating[]> {
    return db.select().from(resourceRatings)
      .where(eq(resourceRatings.resourceId, resourceId))
      .orderBy(desc(resourceRatings.createdAt));
  }

  async updateResourceRating(resourceId: string): Promise<void> {
    const ratings = await db.select().from(resourceRatings)
      .where(eq(resourceRatings.resourceId, resourceId));
    
    if (ratings.length > 0) {
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      await db.update(resources)
        .set({ 
          averageRating: averageRating.toFixed(2),
          ratingCount: ratings.length 
        })
        .where(eq(resources.id, resourceId));
    }
  }

  async getCareTeam(userId: string): Promise<CareTeamMember[]> {
    return db.select().from(careTeamMembers)
      .where(eq(careTeamMembers.userId, userId))
      .orderBy(desc(careTeamMembers.dateAdded));
  }

  async addCareTeamMember(member: InsertCareTeamMember): Promise<CareTeamMember> {
    // Check if member already exists
    const existing = await db.select().from(careTeamMembers)
      .where(and(
        eq(careTeamMembers.userId, member.userId),
        eq(careTeamMembers.name, member.name),
        eq(careTeamMembers.organization, member.organization)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const result = await db.insert(careTeamMembers).values(member).returning();
    return result[0];
  }

  async getMessages(userId: string): Promise<Message[]> {
    return db.select().from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.timestamp);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getAppointments(userId: string): Promise<Appointment[]> {
    return db.select().from(appointments)
      .where(eq(appointments.userId, userId))
      .orderBy(appointments.datetime);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(appointment).returning();
    return result[0];
  }

  async updateAppointment(id: string, appointment: Partial<InsertAppointment>): Promise<Appointment> {
    const result = await db.update(appointments)
      .set(appointment)
      .where(eq(appointments.id, id))
      .returning();
    return result[0];
  }

  async deleteAppointment(id: string): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async createVoiceInteraction(interaction: Omit<InsertVoiceInteraction, 'sessionType' | 'discoveryPhase'>): Promise<VoiceInteraction> {
    // Insert without new columns for now
    await sql_client`
      INSERT INTO voice_interactions (user_id, transcript, response)
      VALUES (${interaction.userId}, ${interaction.transcript}, ${interaction.response})
    `;
    
    return {
      id: 'temp',
      userId: interaction.userId,
      transcript: interaction.transcript,
      response: interaction.response,
      timestamp: new Date()
    } as VoiceInteraction;
  }

  async getRecentVoiceInteractions(userId: string, limit: number): Promise<VoiceInteraction[]> {
    try {
      return await db.select().from(voiceInteractions)
        .where(eq(voiceInteractions.userId, userId))
        .orderBy(desc(voiceInteractions.timestamp))
        .limit(limit);
    } catch (error) {
      console.error('Database query error:', error);
      // Return empty array for graceful degradation
      return [];
    }
  }

  async storeVoiceInteraction(userId: string, transcript: string, response: string): Promise<VoiceInteraction> {
    // Insert without new columns for now
    await sql_client`
      INSERT INTO voice_interactions (user_id, transcript, response)
      VALUES (${userId}, ${transcript}, ${response})
    `;
    
    return {
      id: 'temp',
      userId,
      transcript,
      response,
      timestamp: new Date()
    } as VoiceInteraction;
  }

  async getVoiceInteractions(userId: string): Promise<VoiceInteraction[]> {
    return db.select().from(voiceInteractions)
      .where(eq(voiceInteractions.userId, userId))
      .orderBy(desc(voiceInteractions.timestamp));
  }

  async getUserMoods(userId: string): Promise<MoodEntry[]> {
    return db.select().from(moodEntries)
      .where(eq(moodEntries.userId, userId))
      .orderBy(desc(moodEntries.timestamp));
  }

  async getUserActions(userId: string, date: string): Promise<DailyAction[]> {
    return db.select().from(dailyActions)
      .where(and(
        eq(dailyActions.userId, userId),
        eq(dailyActions.date, date)
      ))
      .orderBy(desc(dailyActions.createdAt));
  }

  // Community Pulse Questions
  async getFeaturedQuestion(): Promise<PulseQuestion | null> {
    const questions = await db.select().from(pulseQuestions)
      .where(and(
        eq(pulseQuestions.featured, true),
        eq(pulseQuestions.showInHomebase, true)
      ))
      .limit(1);
    return questions[0] || null;
  }

  async getActiveQuestions(): Promise<PulseQuestion[]> {
    return db.select().from(pulseQuestions)
      .where(eq(pulseQuestions.showInHomebase, true))
      .orderBy(desc(pulseQuestions.createdAt));
  }

  async createPulseAnswer(answer: InsertPulseAnswer): Promise<PulseAnswer> {
    const result = await db.insert(pulseAnswers).values(answer).returning();
    return result[0];
  }

  async getUserAnswers(userId: string): Promise<PulseAnswer[]> {
    return db.select().from(pulseAnswers)
      .where(eq(pulseAnswers.userId, userId))
      .orderBy(desc(pulseAnswers.answeredAt));
  }

  async getQuestionStats(questionId: string): Promise<{ answerCount: number; answerDistribution: { [key: string]: number } }> {
    const answers = await db.select().from(pulseAnswers)
      .where(eq(pulseAnswers.questionId, questionId));
    
    const answerCount = answers.length;
    const answerDistribution: { [key: string]: number } = {};
    
    answers.forEach(answer => {
      if (answer.selectedOption) {
        answerDistribution[answer.selectedOption] = (answerDistribution[answer.selectedOption] || 0) + 1;
      }
    });

    return { answerCount, answerDistribution };
  }

  async hasUserAnsweredQuestion(userId: string, questionId: string): Promise<boolean> {
    const existing = await db.select().from(pulseAnswers)
      .where(and(
        eq(pulseAnswers.userId, userId),
        eq(pulseAnswers.questionId, questionId)
      ))
      .limit(1);
    return existing.length > 0;
  }

  // Core Discovery Sessions
  async getCoreDiscoverySessions(userId: string): Promise<CoreDiscoverySession[]> {
    return db.select().from(coreDiscoverySessions)
      .where(eq(coreDiscoverySessions.userId, userId))
      .orderBy(desc(coreDiscoverySessions.startedAt));
  }

  async createCoreDiscoverySession(session: InsertCoreDiscoverySession): Promise<CoreDiscoverySession> {
    const result = await db.insert(coreDiscoverySessions).values(session).returning();
    return result[0];
  }

  async getCoreDiscoverySession(sessionId: string): Promise<CoreDiscoverySession | undefined> {
    const sessions = await db.select().from(coreDiscoverySessions)
      .where(eq(coreDiscoverySessions.id, sessionId))
      .limit(1);
    return sessions[0];
  }

  async updateCoreDiscoverySession(sessionId: string, updates: Partial<InsertCoreDiscoverySession>): Promise<CoreDiscoverySession> {
    const result = await db.update(coreDiscoverySessions)
      .set(updates)
      .where(eq(coreDiscoverySessions.id, sessionId))
      .returning();
    return result[0];
  }

  // Domain Check-ins
  async createDomainCheckin(checkin: InsertDomainCheckin): Promise<DomainCheckin> {
    const result = await db.insert(domainCheckins).values(checkin).returning();
    return result[0];
  }

  async getDomainCheckins(userId: string): Promise<DomainCheckin[]> {
    return db.select().from(domainCheckins)
      .where(eq(domainCheckins.userId, userId))
      .orderBy(domainCheckins.scheduledDay);
  }

  // Intake and referral methods (placeholder implementation)
  async createIntakeResponse(response: any): Promise<any> {
    // Note: Using manual table creation since schema is not fully integrated yet
    try {
      await sql_client`
        INSERT INTO intake_responses (user_id, domain, field, response, referral_tags, severity)
        VALUES (${response.userId}, ${response.domain}, ${response.field}, ${response.response}, 
                ${JSON.stringify(response.referralTags)}, ${response.severity})
      `;
      return response;
    } catch (error) {
      console.error('Error creating intake response:', error);
      return response; // Return for now to continue flow
    }
  }

  async getUserIntakeResponses(userId: string): Promise<any[]> {
    try {
      const result = await sql_client`
        SELECT * FROM intake_responses WHERE user_id = ${userId} ORDER BY timestamp DESC
      `;
      return result;
    } catch (error) {
      console.error('Error getting intake responses:', error);
      return [];
    }
  }

  async createReferral(referral: any): Promise<any> {
    try {
      await sql_client`
        INSERT INTO referrals (user_id, referral_type, partner_organization, status, description, urgency)
        VALUES (${referral.userId}, ${referral.referralType}, ${referral.partnerOrganization}, 
                ${referral.status}, ${referral.description}, ${referral.urgency})
      `;
      return referral;
    } catch (error) {
      console.error('Error creating referral:', error);
      return referral;
    }
  }

  async getUserReferrals(userId: string): Promise<any[]> {
    try {
      const result = await sql_client`
        SELECT * FROM referrals WHERE user_id = ${userId} ORDER BY date_sent DESC
      `;
      return result;
    } catch (error) {
      console.error('Error getting referrals:', error);
      return [];
    }
  }

  // Family/Social Features Methods
  async getFamilyMembers(userId: string): Promise<FamilyMember[]> {
    return db.select().from(familyMembers)
      .where(eq(familyMembers.userId, userId))
      .orderBy(desc(familyMembers.createdAt));
  }

  async addFamilyMember(member: InsertFamilyMember): Promise<FamilyMember> {
    // Generate unique invite code
    const inviteCode = `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await db.insert(familyMembers).values({
      ...member,
      inviteCode
    }).returning();
    return result[0];
  }

  async updateFamilyMemberStatus(inviteCode: string, status: string): Promise<FamilyMember | undefined> {
    const result = await db.update(familyMembers)
      .set({ 
        inviteStatus: status, 
        lastActiveAt: new Date() 
      })
      .where(eq(familyMembers.inviteCode, inviteCode))
      .returning();
    return result[0];
  }

  async getFamilyCommunications(userId: string): Promise<FamilyCommunication[]> {
    return db.select().from(familyCommunication)
      .where(eq(familyCommunication.userId, userId))
      .orderBy(desc(familyCommunication.createdAt));
  }

  async createFamilyMessage(message: InsertFamilyCommunication): Promise<FamilyCommunication> {
    const result = await db.insert(familyCommunication).values(message).returning();
    return result[0];
  }

  async getSharedWellnessInsights(userId: string, familyMemberId?: string): Promise<SharedWellnessInsight[]> {
    const query = db.select().from(sharedWellnessInsights)
      .where(eq(sharedWellnessInsights.userId, userId));
    
    if (familyMemberId) {
      query.where(eq(sharedWellnessInsights.familyMemberId, familyMemberId));
    }
    
    return query.orderBy(desc(sharedWellnessInsights.createdAt));
  }

  async shareWellnessInsight(insight: InsertSharedWellnessInsight): Promise<SharedWellnessInsight> {
    const result = await db.insert(sharedWellnessInsights).values(insight).returning();
    return result[0];
  }

  async getCollaborativeCareGoals(userId: string): Promise<CollaborativeCareGoal[]> {
    return db.select().from(collaborativeCareGoals)
      .where(eq(collaborativeCareGoals.userId, userId))
      .orderBy(desc(collaborativeCareGoals.createdAt));
  }

  async createCollaborativeCareGoal(goal: InsertCollaborativeCareGoal): Promise<CollaborativeCareGoal> {
    const result = await db.insert(collaborativeCareGoals).values(goal).returning();
    return result[0];
  }

  async updateGoalProgress(goalId: string, progress: number): Promise<CollaborativeCareGoal | undefined> {
    const result = await db.update(collaborativeCareGoals)
      .set({ 
        progress, 
        updatedAt: new Date() 
      })
      .where(eq(collaborativeCareGoals.id, goalId))
      .returning();
    return result[0];
  }

  async getCareEvents(userId: string, severity?: string): Promise<CareEvent[]> {
    const query = db.select().from(careEvents)
      .where(eq(careEvents.userId, userId));
    
    if (severity) {
      query.where(eq(careEvents.severity, severity));
    }
    
    return query.orderBy(desc(careEvents.createdAt));
  }

  async createCareEvent(event: InsertCareEvent): Promise<CareEvent> {
    const result = await db.insert(careEvents).values(event).returning();
    
    // Auto-notify family for high/urgent events
    if (event.severity === 'high' || event.severity === 'urgent') {
      await db.update(careEvents)
        .set({ familyNotified: true })
        .where(eq(careEvents.id, result[0].id));
    }
    
    return result[0];
  }

  async markInsightAsViewed(insightId: string): Promise<void> {
    await db.update(sharedWellnessInsights)
      .set({ viewedAt: new Date() })
      .where(eq(sharedWellnessInsights.id, insightId));
  }

  // Voice conversation context memory methods
  async createVoiceConversation(data: InsertVoiceConversation): Promise<VoiceConversation> {
    const [conversation] = await db.insert(voiceConversations).values(data).returning();
    return conversation;
  }

  async getConversationHistory(userId: string, sessionId: string, limit: number = 10): Promise<VoiceConversation[]> {
    return await db
      .select()
      .from(voiceConversations)
      .where(and(eq(voiceConversations.userId, userId), eq(voiceConversations.sessionId, sessionId)))
      .orderBy(desc(voiceConversations.timestamp))
      .limit(limit);
  }

  async getRecentConversations(userId: string, limit: number = 5): Promise<VoiceConversation[]> {
    return await db
      .select()
      .from(voiceConversations)
      .where(eq(voiceConversations.userId, userId))
      .orderBy(desc(voiceConversations.timestamp))
      .limit(limit);
  }

  async getCurrentSessionId(userId: string): Promise<string> {
    // Get the most recent conversation to continue the session or create new one
    const recent = await db
      .select()
      .from(voiceConversations)
      .where(eq(voiceConversations.userId, userId))
      .orderBy(desc(voiceConversations.timestamp))
      .limit(1);

    if (recent.length > 0) {
      const lastConversation = recent[0];
      const timeDiff = Date.now() - new Date(lastConversation.timestamp!).getTime();
      
      // If last conversation was within 30 minutes, continue the session
      if (timeDiff < 30 * 60 * 1000) {
        return lastConversation.sessionId;
      }
    }

    // Create new session ID
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

}

export const storage = new DatabaseStorage();
