import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Apprentice table
export const apprentices = pgTable("apprentices", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  birthDate: text("birth_date"),
  address: text("address"),
  education: text("education"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertApprenticeSchema = createInsertSchema(apprentices).omit({
  id: true,
  createdAt: true,
});

// Company table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  siret: text("siret"),
  address: text("address"),
  email: text("email"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

// Mentor table
export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  position: text("position"),
  email: text("email").notNull(),
  phone: text("phone"),
  experience: text("experience"),
  companyId: integer("company_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMentorSchema = createInsertSchema(mentors).omit({
  id: true,
  createdAt: true,
});

// Define the pipeline stages as an enum
export const pipelineStages = [
  "REQUEST", // Demande de dossier
  "CREATED", // Dossier créé
  "VERIFICATION", // En cours de vérification
  "PROCESSING", // En traitement
  "VALIDATED", // Validé
] as const;

// File (dossier) table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  apprenticeId: integer("apprentice_id").notNull(),
  companyId: integer("company_id").notNull(),
  mentorId: integer("mentor_id").notNull(),
  stage: text("stage").notNull().default("REQUEST"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  duration: text("duration"),
  salary: text("salary"),
  workHours: text("work_hours"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Document table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  extractedData: text("extracted_data"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

// Comment table
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").notNull(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

// Activity table for logging actions
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileId: integer("file_id"),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Apprentice = typeof apprentices.$inferSelect;
export type InsertApprentice = z.infer<typeof insertApprenticeSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Mentor = typeof mentors.$inferSelect;
export type InsertMentor = z.infer<typeof insertMentorSchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type PipelineStage = typeof pipelineStages[number];
