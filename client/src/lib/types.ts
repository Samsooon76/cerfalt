// Types based on the database schema
export type User = {
  id: number;
  username: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  password?: string; // Only included for forms, not displayed in UI
};

export type Apprentice = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  education?: string;
  createdAt: string;
};

export type Company = {
  id: number;
  name: string;
  siret?: string;
  address?: string;
  email?: string;
  phone?: string;
  createdAt: string;
};

export type Mentor = {
  id: number;
  firstName: string;
  lastName: string;
  position?: string;
  email: string;
  phone?: string;
  experience?: string;
  companyId?: number;
  createdAt: string;
};

export type PipelineStage = "REQUEST" | "CREATED" | "VERIFICATION" | "PROCESSING" | "VALIDATED";

export type File = {
  id: number;
  apprenticeId: number;
  companyId: number;
  mentorId: number;
  stage: PipelineStage;
  startDate?: string;
  endDate?: string;
  duration?: string;
  salary?: string;
  workHours?: string;
  createdAt: string;
  updatedAt: string;
};

export type Document = {
  id: number;
  fileId: number;
  name: string;
  type: string;
  path: string;
  uploadedAt: string;
  extractedData?: string;
};

export type Comment = {
  id: number;
  fileId: number;
  userId: number;
  text: string;
  createdAt: string;
  user?: User;
};

export type Activity = {
  id: number;
  userId: number;
  fileId?: number;
  activityType: string;
  description: string;
  createdAt: string;
  user: User;
};

export type Stats = {
  totalFiles: number;
  filesByStage: Record<PipelineStage, number>;
  validatedFiles: number;
  averageProcessingTime: number;
};

export type FileDetails = {
  file: File;
  apprentice: Apprentice;
  company: Company;
  mentor: Mentor;
  documents: Document[];
  comments: Array<Comment & { user: User }>;
};
