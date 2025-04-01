import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema, insertApprenticeSchema, insertCompanySchema,
  insertMentorSchema, insertFileSchema, insertDocumentSchema,
  insertCommentSchema, insertActivitySchema, pipelineStages
} from "@shared/schema";

// Variable globale pour stocker la configuration personnalisée du pipeline
let customPipeline = [...pipelineStages.map(stage => ({ key: stage, name: stage }))];
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { extractIdCardInfo } from "./services/mistral";

// Multer for file uploads
import multer from "multer";
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${crypto.randomUUID()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes - all routes are prefixed with /api
  
  // User routes
  app.get("/api/users", async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Apprentice routes
  app.get("/api/apprentices", async (req, res) => {
    const apprentices = await storage.getApprentices();
    res.json(apprentices);
  });

  app.get("/api/apprentices/:id", async (req, res) => {
    const apprenticeId = parseInt(req.params.id);
    if (isNaN(apprenticeId)) {
      return res.status(400).json({ message: "Invalid apprentice ID" });
    }

    const apprentice = await storage.getApprentice(apprenticeId);
    if (!apprentice) {
      return res.status(404).json({ message: "Apprentice not found" });
    }

    res.json(apprentice);
  });

  app.post("/api/apprentices", async (req, res) => {
    try {
      const apprenticeData = insertApprenticeSchema.parse(req.body);
      const apprentice = await storage.createApprentice(apprenticeData);
      res.status(201).json(apprentice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid apprentice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create apprentice" });
    }
  });

  app.put("/api/apprentices/:id", async (req, res) => {
    const apprenticeId = parseInt(req.params.id);
    if (isNaN(apprenticeId)) {
      return res.status(400).json({ message: "Invalid apprentice ID" });
    }

    try {
      const apprenticeData = insertApprenticeSchema.partial().parse(req.body);
      const apprentice = await storage.updateApprentice(apprenticeId, apprenticeData);
      
      if (!apprentice) {
        return res.status(404).json({ message: "Apprentice not found" });
      }
      
      res.json(apprentice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid apprentice data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update apprentice" });
    }
  });

  app.delete("/api/apprentices/:id", async (req, res) => {
    const apprenticeId = parseInt(req.params.id);
    if (isNaN(apprenticeId)) {
      return res.status(400).json({ message: "Invalid apprentice ID" });
    }

    const success = await storage.deleteApprentice(apprenticeId);
    if (!success) {
      return res.status(404).json({ message: "Apprentice not found" });
    }

    res.status(204).send();
  });

  // Company routes
  app.get("/api/companies", async (req, res) => {
    const companies = await storage.getCompanies();
    res.json(companies);
  });

  app.get("/api/companies/:id", async (req, res) => {
    const companyId = parseInt(req.params.id);
    if (isNaN(companyId)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    const company = await storage.getCompany(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company);
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    const companyId = parseInt(req.params.id);
    if (isNaN(companyId)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    try {
      const companyData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(companyId, companyData);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid company data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    const companyId = parseInt(req.params.id);
    if (isNaN(companyId)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    const success = await storage.deleteCompany(companyId);
    if (!success) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(204).send();
  });

  // Mentor routes
  app.get("/api/mentors", async (req, res) => {
    const mentors = await storage.getMentors();
    res.json(mentors);
  });

  app.get("/api/mentors/:id", async (req, res) => {
    const mentorId = parseInt(req.params.id);
    if (isNaN(mentorId)) {
      return res.status(400).json({ message: "Invalid mentor ID" });
    }

    const mentor = await storage.getMentor(mentorId);
    if (!mentor) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json(mentor);
  });

  app.get("/api/companies/:companyId/mentors", async (req, res) => {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }

    const mentors = await storage.getMentorsByCompany(companyId);
    res.json(mentors);
  });

  app.post("/api/mentors", async (req, res) => {
    try {
      const mentorData = insertMentorSchema.parse(req.body);
      const mentor = await storage.createMentor(mentorData);
      res.status(201).json(mentor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mentor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mentor" });
    }
  });

  app.put("/api/mentors/:id", async (req, res) => {
    const mentorId = parseInt(req.params.id);
    if (isNaN(mentorId)) {
      return res.status(400).json({ message: "Invalid mentor ID" });
    }

    try {
      const mentorData = insertMentorSchema.partial().parse(req.body);
      const mentor = await storage.updateMentor(mentorId, mentorData);
      
      if (!mentor) {
        return res.status(404).json({ message: "Mentor not found" });
      }
      
      res.json(mentor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mentor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update mentor" });
    }
  });

  app.delete("/api/mentors/:id", async (req, res) => {
    const mentorId = parseInt(req.params.id);
    if (isNaN(mentorId)) {
      return res.status(400).json({ message: "Invalid mentor ID" });
    }

    const success = await storage.deleteMentor(mentorId);
    if (!success) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.status(204).send();
  });

  // File routes
  app.get("/api/files", async (req, res) => {
    const stage = req.query.stage as string;
    
    if (stage && pipelineStages.includes(stage as any)) {
      const files = await storage.getFilesByStage(stage as any);
      return res.json(files);
    }
    
    const files = await storage.getFiles();
    res.json(files);
  });

  app.get("/api/files/:id", async (req, res) => {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const file = await storage.getFile(fileId);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json(file);
  });

  app.get("/api/files/:id/details", async (req, res) => {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const fileDetails = await storage.getFileDetails(fileId);
    if (!fileDetails) {
      return res.status(404).json({ message: "File details not found" });
    }

    res.json(fileDetails);
  });

  app.post("/api/files", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      
      // Create activity for file creation
      await storage.createActivity({
        userId: 1, // Default to admin for now
        fileId: file.id,
        activityType: "CREATE",
        description: `File created for apprentice ${file.apprenticeId}`
      });
      
      res.status(201).json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    try {
      const fileData = insertFileSchema.partial().parse(req.body);
      const file = await storage.updateFile(fileId, fileData);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Create activity for file update
      await storage.createActivity({
        userId: 1, // Default to admin for now
        fileId: file.id,
        activityType: "UPDATE",
        description: `File ${file.id} updated`
      });
      
      res.json(file);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid file data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  app.put("/api/files/:id/stage", async (req, res) => {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    try {
      const { stage } = req.body;
      
      if (!stage || !pipelineStages.includes(stage)) {
        return res.status(400).json({ message: "Invalid stage" });
      }
      
      const file = await storage.updateFileStage(fileId, stage);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Create activity for stage update
      await storage.createActivity({
        userId: 1, // Default to admin for now
        fileId: file.id,
        activityType: "STAGE_CHANGE",
        description: `File stage changed to ${stage}`
      });
      
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file stage" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const success = await storage.deleteFile(fileId);
    if (!success) {
      return res.status(404).json({ message: "File not found" });
    }

    // Create activity for file deletion
    await storage.createActivity({
      userId: 1, // Default to admin for now
      fileId: fileId,
      activityType: "DELETE",
      description: `File ${fileId} deleted`
    });

    res.status(204).send();
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    const fileId = req.query.fileId ? parseInt(req.query.fileId as string) : undefined;
    
    if (fileId && !isNaN(fileId)) {
      const documents = await storage.getDocumentsByFile(fileId);
      return res.json(documents);
    }
    
    const documents = await storage.getDocuments();
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const documentId = parseInt(req.params.id);
    if (isNaN(documentId)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const document = await storage.getDocument(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(document);
  });

  app.post("/api/documents", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const fileId = parseInt(req.body.fileId);
      const documentType = req.body.type;
      const name = req.body.name || req.file.originalname;
      const shouldExtractData = req.body.extractData === "true";
      
      if (isNaN(fileId)) {
        return res.status(400).json({ message: "Invalid file ID" });
      }
      
      // Check if file exists
      const file = await storage.getFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "Associated file not found" });
      }

      let extractedData;
      
      // If this is an ID document and extraction is requested, perform OCR
      if (shouldExtractData && (documentType === "ID_CARD" || documentType === "PASSPORT")) {
        try {
          // Get Mistral API key from environment
          const apiKey = process.env.MISTRAL_API_KEY;
          
          if (apiKey) {
            // Convert file to base64
            const fileBuffer = fs.readFileSync(req.file.path);
            const base64Image = fileBuffer.toString('base64');

            // Call Mistral OCR service
            const ocrResult = await extractIdCardInfo({
              image: base64Image,
              apiKey
            });

            if (ocrResult.success && ocrResult.data) {
              extractedData = JSON.stringify(ocrResult.data);
              
              // If apprentice exists and we have data, update apprentice data
              if (file.apprenticeId) {
                const apprentice = await storage.getApprentice(file.apprenticeId);
                if (apprentice && ocrResult.data) {
                  // Only update fields that are empty or not set
                  const apprenticeUpdate: any = {};
                  
                  if (ocrResult.data.firstName && (!apprentice.firstName || apprentice.firstName === "")) {
                    apprenticeUpdate.firstName = ocrResult.data.firstName;
                  }
                  
                  if (ocrResult.data.lastName && (!apprentice.lastName || apprentice.lastName === "")) {
                    apprenticeUpdate.lastName = ocrResult.data.lastName;
                  }
                  
                  if (ocrResult.data.birthDate && (!apprentice.birthDate || apprentice.birthDate === "")) {
                    apprenticeUpdate.birthDate = ocrResult.data.birthDate;
                  }
                  
                  if (ocrResult.data.address && (!apprentice.address || apprentice.address === "")) {
                    apprenticeUpdate.address = ocrResult.data.address;
                  }
                  
                  if (Object.keys(apprenticeUpdate).length > 0) {
                    await storage.updateApprentice(file.apprenticeId, apprenticeUpdate);
                    
                    // Create activity for apprentice data update
                    await storage.createActivity({
                      userId: 1, // Default to admin for now
                      fileId,
                      activityType: "OCR_UPDATE",
                      description: `Apprentice data updated automatically from ID document`
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("OCR extraction error:", error);
          // Continue with document upload even if OCR fails
        }
      }

      // Create document record
      const documentData = {
        fileId,
        name,
        type: documentType,
        path: req.file.path,
        extractedData: extractedData || (shouldExtractData ? JSON.stringify({ 
          extracted: false,
          timestamp: new Date().toISOString()
        }) : undefined)
      };

      const document = await storage.createDocument(documentData);
      
      // Create activity for document upload
      await storage.createActivity({
        userId: 1, // Default to admin for now
        fileId,
        activityType: "DOCUMENT_UPLOAD",
        description: `Document '${name}' uploaded for file ${fileId}`
      });
      
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    const documentId = parseInt(req.params.id);
    if (isNaN(documentId)) {
      return res.status(400).json({ message: "Invalid document ID" });
    }

    const document = await storage.getDocument(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Delete the file from disk
    try {
      if (fs.existsSync(document.path)) {
        fs.unlinkSync(document.path);
      }
    } catch (error) {
      console.error("Error deleting document file:", error);
    }

    const success = await storage.deleteDocument(documentId);
    if (!success) {
      return res.status(500).json({ message: "Failed to delete document record" });
    }

    // Create activity for document deletion
    await storage.createActivity({
      userId: 1, // Default to admin for now
      fileId: document.fileId,
      activityType: "DOCUMENT_DELETE",
      description: `Document '${document.name}' deleted from file ${document.fileId}`
    });

    res.status(204).send();
  });

  // Comment routes
  app.get("/api/files/:fileId/comments", async (req, res) => {
    const fileId = parseInt(req.params.fileId);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const comments = await storage.getCommentsByFile(fileId);
    res.json(comments);
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      
      // Create activity for comment creation
      await storage.createActivity({
        userId: commentData.userId,
        fileId: commentData.fileId,
        activityType: "COMMENT",
        description: `Comment added to file ${commentData.fileId}`
      });
      
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }

    const comment = await storage.getComment(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const success = await storage.deleteComment(commentId);
    if (!success) {
      return res.status(500).json({ message: "Failed to delete comment" });
    }

    // Create activity for comment deletion
    await storage.createActivity({
      userId: 1, // Default to admin for now
      fileId: comment.fileId,
      activityType: "COMMENT_DELETE",
      description: `Comment deleted from file ${comment.fileId}`
    });

    res.status(204).send();
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const activities = await storage.getActivities(limit);
    res.json(activities);
  });

  app.get("/api/files/:fileId/activities", async (req, res) => {
    const fileId = parseInt(req.params.fileId);
    if (isNaN(fileId)) {
      return res.status(400).json({ message: "Invalid file ID" });
    }

    const activities = await storage.getActivitiesByFile(fileId);
    res.json(activities);
  });

  // Stats routes
  app.get("/api/stats", async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  // OCR routes for ID card extraction
  app.post("/api/extract-id-card", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Get Mistral API key from environment
      const apiKey = process.env.MISTRAL_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ message: "Missing Mistral API key" });
      }

      // Get person ID and type if provided
      const apprenticeId = req.body.apprenticeId ? parseInt(req.body.apprenticeId) : undefined;
      const mentorId = req.body.mentorId ? parseInt(req.body.mentorId) : undefined;
      const personType = req.body.personType || (apprenticeId ? 'apprentice' : (mentorId ? 'mentor' : undefined));
      
      // Convert file to base64
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64Image = fileBuffer.toString('base64');

      // Call Mistral OCR service
      const ocrResult = await extractIdCardInfo({
        image: base64Image,
        apiKey
      });

      if (!ocrResult.success) {
        return res.status(500).json({ 
          message: "OCR extraction failed", 
          error: ocrResult.error 
        });
      }
      
      // Prepare update data from OCR result
      const extractedData: any = {};
      if (ocrResult.data?.firstName) extractedData.firstName = ocrResult.data.firstName;
      if (ocrResult.data?.lastName) extractedData.lastName = ocrResult.data.lastName;
      if (ocrResult.data?.birthDate) extractedData.birthDate = ocrResult.data.birthDate;
      if (ocrResult.data?.address) extractedData.address = ocrResult.data.address;
      
      // Apply extracted data based on person type
      if (apprenticeId && !isNaN(apprenticeId) && ocrResult.data) {
        const apprentice = await storage.getApprentice(apprenticeId);
        if (apprentice) {
          await storage.updateApprentice(apprenticeId, extractedData);
          
          // Create activity log
          await storage.createActivity({
            userId: 1, // Default admin user
            fileId: null,
            activityType: "UPDATE",
            description: `Apprentice data updated via OCR extraction`
          });
        }
      }
      
      // If mentor ID is provided, update mentor data
      if (mentorId && !isNaN(mentorId) && ocrResult.data) {
        const mentor = await storage.getMentor(mentorId);
        if (mentor) {
          await storage.updateMentor(mentorId, extractedData);
          
          // Create activity log
          await storage.createActivity({
            userId: 1, // Default admin user
            fileId: null,
            activityType: "UPDATE",
            description: `Mentor data updated via OCR extraction`
          });
        }
      }

      res.json({ 
        message: "ID card information extracted successfully",
        personType,
        ...ocrResult.data
      });

    } catch (error) {
      console.error("Error in OCR extraction:", error);
      res.status(500).json({ message: "Failed to process ID card" });
    }
  });
  
  app.post("/api/ocr/extract-id", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      // Get Mistral API key from environment or request
      const apiKey = process.env.MISTRAL_API_KEY || req.body.apiKey;
      
      if (!apiKey) {
        return res.status(400).json({ message: "Missing Mistral API key" });
      }

      // Convert file to base64
      const fileBuffer = fs.readFileSync(req.file.path);
      const base64Image = fileBuffer.toString('base64');

      // Call Mistral OCR service
      const ocrResult = await extractIdCardInfo({
        image: base64Image,
        apiKey
      });

      if (!ocrResult.success) {
        return res.status(500).json({ 
          message: "OCR extraction failed", 
          error: ocrResult.error 
        });
      }

      res.json({ 
        message: "ID card information extracted successfully",
        data: ocrResult.data
      });

    } catch (error) {
      console.error("Error in OCR extraction:", error);
      res.status(500).json({ message: "Failed to process ID card" });
    }
  });

  // API routes for settings
  app.get("/api/settings", async (req, res) => {
    // Return general settings and pipeline configuration
    res.json({
      general: {
        institutionName: "Centre de Formation d'Apprentis",
        address: "123 Avenue de la Formation, 75001 Paris",
        contactEmail: "contact@cfa-exemple.fr"
      },
      pipeline: customPipeline
    });
  });

  app.put("/api/settings/pipeline", async (req, res) => {
    try {
      const { stages } = req.body;
      
      if (!stages || !Array.isArray(stages) || stages.length === 0) {
        return res.status(400).json({ message: "Invalid pipeline configuration" });
      }
      
      // Validate that all stages have key and name properties
      for (const stage of stages) {
        if (!stage.key || !stage.name) {
          return res.status(400).json({ message: "Invalid stage format: each stage must have key and name properties" });
        }
      }
      
      // Update the pipeline configuration
      customPipeline = [...stages];
      
      res.json({ 
        message: "Pipeline configuration updated successfully",
        pipeline: customPipeline
      });
    } catch (error) {
      console.error("Error updating pipeline settings:", error);
      res.status(500).json({ message: "Failed to update pipeline settings" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
