import {
  users, User, InsertUser,
  apprentices, Apprentice, InsertApprentice,
  companies, Company, InsertCompany,
  mentors, Mentor, InsertMentor,
  files, File, InsertFile, PipelineStage,
  documents, Document, InsertDocument,
  comments, Comment, InsertComment,
  activities, Activity, InsertActivity
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Apprentice operations
  getApprentice(id: number): Promise<Apprentice | undefined>;
  getApprentices(): Promise<Apprentice[]>;
  createApprentice(apprentice: InsertApprentice): Promise<Apprentice>;
  updateApprentice(id: number, apprentice: Partial<InsertApprentice>): Promise<Apprentice | undefined>;
  deleteApprentice(id: number): Promise<boolean>;

  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<boolean>;

  // Mentor operations
  getMentor(id: number): Promise<Mentor | undefined>;
  getMentors(): Promise<Mentor[]>;
  getMentorsByCompany(companyId: number): Promise<Mentor[]>;
  createMentor(mentor: InsertMentor): Promise<Mentor>;
  updateMentor(id: number, mentor: Partial<InsertMentor>): Promise<Mentor | undefined>;
  deleteMentor(id: number): Promise<boolean>;

  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFiles(): Promise<File[]>;
  getFilesByStage(stage: PipelineStage): Promise<File[]>;
  getFileDetails(id: number): Promise<{
    file: File;
    apprentice: Apprentice;
    company: Company;
    mentor: Mentor;
    documents: Document[];
    comments: Array<Comment & { user: User }>;
  } | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined>;
  updateFileStage(id: number, stage: PipelineStage): Promise<File | undefined>;
  deleteFile(id: number): Promise<boolean>;

  // Document operations
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
  getDocumentsByFile(fileId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByFile(fileId: number): Promise<Array<Comment & { user: User }>>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Activity operations
  getActivities(limit?: number): Promise<Array<Activity & { user: User }>>;
  getActivitiesByFile(fileId: number): Promise<Array<Activity & { user: User }>>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Stats operations
  getStats(): Promise<{
    totalFiles: number;
    filesByStage: Record<PipelineStage, number>;
    validatedFiles: number;
    averageProcessingTime: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private apprentices: Map<number, Apprentice>;
  private companies: Map<number, Company>;
  private mentors: Map<number, Mentor>;
  private files: Map<number, File>;
  private documents: Map<number, Document>;
  private comments: Map<number, Comment>;
  private activities: Map<number, Activity>;

  private currentUserId: number;
  private currentApprenticeId: number;
  private currentCompanyId: number;
  private currentMentorId: number;
  private currentFileId: number;
  private currentDocumentId: number;
  private currentCommentId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.apprentices = new Map();
    this.companies = new Map();
    this.mentors = new Map();
    this.files = new Map();
    this.documents = new Map();
    this.comments = new Map();
    this.activities = new Map();

    this.currentUserId = 1;
    this.currentApprenticeId = 1;
    this.currentCompanyId = 1;
    this.currentMentorId = 1;
    this.currentFileId = 1;
    this.currentDocumentId = 1;
    this.currentCommentId = 1;
    this.currentActivityId = 1;

    // Add initial admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      role: "admin",
      avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Apprentice operations
  async getApprentice(id: number): Promise<Apprentice | undefined> {
    return this.apprentices.get(id);
  }

  async getApprentices(): Promise<Apprentice[]> {
    return Array.from(this.apprentices.values());
  }

  async createApprentice(insertApprentice: InsertApprentice): Promise<Apprentice> {
    const id = this.currentApprenticeId++;
    const createdAt = new Date().toISOString();
    const apprentice: Apprentice = { ...insertApprentice, id, createdAt };
    this.apprentices.set(id, apprentice);
    return apprentice;
  }

  async updateApprentice(id: number, apprentice: Partial<InsertApprentice>): Promise<Apprentice | undefined> {
    const existingApprentice = this.apprentices.get(id);
    if (!existingApprentice) return undefined;

    const updatedApprentice: Apprentice = { ...existingApprentice, ...apprentice };
    this.apprentices.set(id, updatedApprentice);
    return updatedApprentice;
  }

  async deleteApprentice(id: number): Promise<boolean> {
    return this.apprentices.delete(id);
  }

  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.currentCompanyId++;
    const createdAt = new Date().toISOString();
    const company: Company = { ...insertCompany, id, createdAt };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const existingCompany = this.companies.get(id);
    if (!existingCompany) return undefined;

    const updatedCompany: Company = { ...existingCompany, ...company };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<boolean> {
    return this.companies.delete(id);
  }

  // Mentor operations
  async getMentor(id: number): Promise<Mentor | undefined> {
    return this.mentors.get(id);
  }

  async getMentors(): Promise<Mentor[]> {
    return Array.from(this.mentors.values());
  }

  async getMentorsByCompany(companyId: number): Promise<Mentor[]> {
    return Array.from(this.mentors.values()).filter(
      (mentor) => mentor.companyId === companyId,
    );
  }

  async createMentor(insertMentor: InsertMentor): Promise<Mentor> {
    const id = this.currentMentorId++;
    const createdAt = new Date().toISOString();
    const mentor: Mentor = { ...insertMentor, id, createdAt };
    this.mentors.set(id, mentor);
    return mentor;
  }

  async updateMentor(id: number, mentor: Partial<InsertMentor>): Promise<Mentor | undefined> {
    const existingMentor = this.mentors.get(id);
    if (!existingMentor) return undefined;

    const updatedMentor: Mentor = { ...existingMentor, ...mentor };
    this.mentors.set(id, updatedMentor);
    return updatedMentor;
  }

  async deleteMentor(id: number): Promise<boolean> {
    return this.mentors.delete(id);
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFiles(): Promise<File[]> {
    return Array.from(this.files.values());
  }

  async getFilesByStage(stage: PipelineStage): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.stage === stage,
    );
  }

  async getFileDetails(id: number): Promise<{
    file: File;
    apprentice: Apprentice;
    company: Company;
    mentor: Mentor;
    documents: Document[];
    comments: Array<Comment & { user: User }>;
  } | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;

    const apprentice = this.apprentices.get(file.apprenticeId);
    const company = this.companies.get(file.companyId);
    const mentor = this.mentors.get(file.mentorId);

    if (!apprentice || !company || !mentor) return undefined;

    const documents = Array.from(this.documents.values()).filter(
      (doc) => doc.fileId === id,
    );

    const fileComments = Array.from(this.comments.values())
      .filter((comment) => comment.fileId === id)
      .map((comment) => {
        const user = this.users.get(comment.userId);
        if (!user) throw new Error(`User not found for comment ${comment.id}`);
        return { ...comment, user };
      });

    return {
      file,
      apprentice,
      company,
      mentor,
      documents,
      comments: fileComments,
    };
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const now = new Date().toISOString();
    const file: File = { 
      ...insertFile, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined> {
    const existingFile = this.files.get(id);
    if (!existingFile) return undefined;

    const updatedFile: File = { 
      ...existingFile, 
      ...file, 
      updatedAt: new Date().toISOString() 
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async updateFileStage(id: number, stage: PipelineStage): Promise<File | undefined> {
    const existingFile = this.files.get(id);
    if (!existingFile) return undefined;

    const updatedFile: File = { 
      ...existingFile, 
      stage, 
      updatedAt: new Date().toISOString() 
    };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFile(id: number): Promise<boolean> {
    return this.files.delete(id);
  }

  // Document operations
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByFile(fileId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.fileId === fileId,
    );
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const uploadedAt = new Date().toISOString();
    const document: Document = { ...insertDocument, id, uploadedAt };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const existingDocument = this.documents.get(id);
    if (!existingDocument) return undefined;

    const updatedDocument: Document = { ...existingDocument, ...document };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async getCommentsByFile(fileId: number): Promise<Array<Comment & { user: User }>> {
    return Array.from(this.comments.values())
      .filter((comment) => comment.fileId === fileId)
      .map((comment) => {
        const user = this.users.get(comment.userId);
        if (!user) throw new Error(`User not found for comment ${comment.id}`);
        return { ...comment, user };
      });
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const createdAt = new Date().toISOString();
    const comment: Comment = { ...insertComment, id, createdAt };
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }

  // Activity operations
  async getActivities(limit = 10): Promise<Array<Activity & { user: User }>> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((activity) => {
        const user = this.users.get(activity.userId);
        if (!user) throw new Error(`User not found for activity ${activity.id}`);
        return { ...activity, user };
      });
  }

  async getActivitiesByFile(fileId: number): Promise<Array<Activity & { user: User }>> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.fileId === fileId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((activity) => {
        const user = this.users.get(activity.userId);
        if (!user) throw new Error(`User not found for activity ${activity.id}`);
        return { ...activity, user };
      });
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const createdAt = new Date().toISOString();
    const activity: Activity = { ...insertActivity, id, createdAt };
    this.activities.set(id, activity);
    return activity;
  }

  // Stats operations
  async getStats(): Promise<{
    totalFiles: number;
    filesByStage: Record<PipelineStage, number>;
    validatedFiles: number;
    averageProcessingTime: number;
  }> {
    const allFiles = Array.from(this.files.values());
    const totalFiles = allFiles.length;
    
    const filesByStage = allFiles.reduce((acc, file) => {
      const stage = file.stage as PipelineStage;
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<PipelineStage, number>);
    
    const validatedFiles = allFiles.filter(file => file.stage === 'VALIDATED').length;
    
    // Calculate average processing time in days (for validated files)
    let totalDays = 0;
    let processedFiles = 0;
    
    for (const file of allFiles) {
      if (file.stage === 'VALIDATED') {
        const creationDate = new Date(file.createdAt);
        const updateDate = new Date(file.updatedAt);
        const diffTime = Math.abs(updateDate.getTime() - creationDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        totalDays += diffDays;
        processedFiles++;
      }
    }
    
    const averageProcessingTime = processedFiles > 0 ? totalDays / processedFiles : 0;
    
    return {
      totalFiles,
      filesByStage,
      validatedFiles,
      averageProcessingTime,
    };
  }
}

export const storage = new MemStorage();
