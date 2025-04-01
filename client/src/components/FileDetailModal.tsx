import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import CommentSection from "./CommentSection";
import { File, Apprentice, Company, Mentor, Document, Comment } from "@shared/schema";

interface FileDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: number;
}

// Schéma de validation pour les commentaires
const commentSchema = z.object({
  text: z.string().min(1, "Le commentaire ne peut pas être vide")
});

// Schéma de validation pour l'alternant
const apprenticeSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  education: z.string().optional()
});

// Schéma de validation pour l'entreprise
const companySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  siret: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
  phone: z.string().optional()
});

// Schéma de validation pour le tuteur
const mentorSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").min(1, "L'email est requis"),
  phone: z.string().optional(),
  position: z.string().optional(),
  experience: z.string().optional()
});

type CommentFormData = z.infer<typeof commentSchema>;
type ApprenticeFormData = z.infer<typeof apprenticeSchema>;
type CompanyFormData = z.infer<typeof companySchema>;
type MentorFormData = z.infer<typeof mentorSchema>;

function ApprenticeEditDialog({ 
  isOpen, 
  onClose, 
  apprentice, 
  onSubmit, 
  isLoading 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  apprentice: Apprentice, 
  onSubmit: (data: ApprenticeFormData) => void, 
  isLoading: boolean
}) {
  const form = useForm<ApprenticeFormData>({
    resolver: zodResolver(apprenticeSchema),
    defaultValues: {
      firstName: apprentice.firstName,
      lastName: apprentice.lastName,
      email: apprentice.email,
      phone: apprentice.phone || "",
      birthDate: apprentice.birthDate || "",
      address: apprentice.address || "",
      education: apprentice.education || ""
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier l'alternant</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="Téléphone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input placeholder="Date de naissance" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Adresse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="education"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Formation</FormLabel>
                    <FormControl>
                      <Input placeholder="Formation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CompanyEditDialog({ 
  isOpen, 
  onClose, 
  company, 
  onSubmit, 
  isLoading 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  company: Company, 
  onSubmit: (data: CompanyFormData) => void, 
  isLoading: boolean
}) {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name,
      siret: company.siret || "",
      address: company.address || "",
      email: company.email || "",
      phone: company.phone || ""
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier l'entreprise</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="siret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SIRET</FormLabel>
                    <FormControl>
                      <Input placeholder="SIRET" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Adresse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="Téléphone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MentorEditDialog({ 
  isOpen, 
  onClose, 
  mentor, 
  onSubmit, 
  isLoading 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  mentor: Mentor, 
  onSubmit: (data: MentorFormData) => void, 
  isLoading: boolean
}) {
  const form = useForm<MentorFormData>({
    resolver: zodResolver(mentorSchema),
    defaultValues: {
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      email: mentor.email,
      phone: mentor.phone || "",
      position: mentor.position || "",
      experience: mentor.experience || ""
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier le maître d'alternance</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="Téléphone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonction</FormLabel>
                    <FormControl>
                      <Input placeholder="Fonction" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expérience</FormLabel>
                    <FormControl>
                      <Input placeholder="Expérience" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function FileDetailModal({ isOpen, onClose, fileId }: FileDetailModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");
  const [isEditingApprentice, setIsEditingApprentice] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingMentor, setIsEditingMentor] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [fileData, setFileData] = useState<File | null>(null);


  // Define the file details type
  interface FileDetails {
    file: File;
    apprentice: Apprentice;
    company: Company;
    mentor: Mentor;
    documents: Document[];
    comments: Array<Comment & { user: { id: number; fullName: string; avatarUrl?: string } }>;
  }

  // Fetch file details
  const { data: fileDetails, isLoading } = useQuery<FileDetails>({
    queryKey: [`/api/files/${fileId}/details`],
    enabled: isOpen && !!fileId,
  });
  
  // Update file data when details change
  useEffect(() => {
    if (fileDetails) {
      setFileData(fileDetails.file);
    }
  }, [fileDetails]);

  // Fetch file comments
  const { data: comments, isLoading: commentsLoading } = useQuery<Array<Comment & { user: { id: number; fullName: string; avatarUrl?: string } }>>({
    queryKey: [`/api/files/${fileId}/comments`],
    enabled: isOpen && !!fileId && activeTab === "comments",
  });

  // Function to open the edit dialog for apprentice, company, mentor or contract
  const handleEdit = (type: 'apprentice' | 'company' | 'mentor' | 'contract') => {
    switch (type) {
      case 'apprentice':
        if (fileDetails?.apprentice) {
          setIsEditingApprentice(true);
        }
        break;
      case 'company':
        if (fileDetails?.company) {
          setIsEditingCompany(true);
        }
        break;
      case 'mentor':
        if (fileDetails?.mentor) {
          setIsEditingMentor(true);
        }
        break;
      case 'contract':
        // On pourrait implémenter une modal d'édition des détails du contrat ici
        toast({
          title: "Bientôt disponible",
          description: "L'édition des détails du contrat sera disponible prochainement.",
        });
        break;
    }
  };

  // Mutations
  const updateApprentice = useMutation({
    mutationFn: async (data: ApprenticeFormData) => {
      if (!fileDetails?.apprentice.id) throw new Error("ID de l'alternant manquant");
      return await apiRequest(`/api/apprentices/${fileDetails.apprentice.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/apprentices'] });
      setIsEditingApprentice(false);
      toast({
        title: "Alternant mis à jour",
        description: "Les informations de l'alternant ont été mises à jour avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'alternant.",
        variant: "destructive"
      });
    }
  });

  const updateCompany = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      if (!fileDetails?.company.id) throw new Error("ID de l'entreprise manquant");
      return await apiRequest(`/api/companies/${fileDetails.company.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      setIsEditingCompany(false);
      toast({
        title: "Entreprise mise à jour",
        description: "Les informations de l'entreprise ont été mises à jour avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'entreprise.",
        variant: "destructive"
      });
    }
  });

  const updateMentor = useMutation({
    mutationFn: async (data: MentorFormData) => {
      if (!fileDetails?.mentor.id) throw new Error("ID du tuteur manquant");
      return await apiRequest(`/api/mentors/${fileDetails.mentor.id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/mentors'] });
      setIsEditingMentor(false);
      toast({
        title: "Tuteur mis à jour",
        description: "Les informations du tuteur ont été mises à jour avec succès."
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du tuteur.",
        variant: "destructive"
      });
    }
  });

  // Form handlers
  const onApprenticeSubmit = (data: ApprenticeFormData) => {
    updateApprentice.mutate(data);
  };

  const onCompanySubmit = (data: CompanyFormData) => {
    updateCompany.mutate(data);
  };

  const onMentorSubmit = (data: MentorFormData) => {
    updateMentor.mutate(data);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const handleSave = async () => {
    try {
      if (!fileData || !fileData.id) {
        throw new Error("File data or ID missing");
      }
      await apiRequest(`/api/files/${fileData.id}`, "PUT", fileData);
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/details`] });
      toast({
        title: "Modifications sauvegardées",
        description: "Les modifications ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl h-3/4 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-2">
                      {[...Array(6)].map((_, j) => (
                        <div key={j} className="h-3 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!fileDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl">
          <div className="text-center py-8">
            <p className="text-gray-500">Détails du dossier non disponibles</p>
            <Button className="mt-4" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { file, apprentice, company, mentor, documents } = fileDetails;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl h-3/4 flex flex-col">
          <DialogTitle className="sr-only">Détails du dossier</DialogTitle>
          <DialogDescription className="sr-only">Gestion des informations détaillées du dossier d'alternance</DialogDescription>
          <div className="flex justify-between items-center border-b border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-800">
              Dossier de {apprentice.firstName} {apprentice.lastName}
            </h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <i className="ri-close-line text-xl text-gray-500"></i>
            </Button>
          </div>

          <Tabs defaultValue="details" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
            <TabsList className="px-4 pt-4">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="comments">Commentaires</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Informations de l'alternant */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">Alternant</h4>
                    <button 
                      className="text-primary-600 hover:text-primary-700 text-sm"
                      onClick={() => handleEdit('apprentice')}
                    >
                      Modifier
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Nom</p>
                      <p className="text-sm font-medium">{apprentice.lastName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Prénom</p>
                      <p className="text-sm font-medium">{apprentice.firstName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date de naissance</p>
                      <p className="text-sm font-medium">{formatDate(apprentice.birthDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Adresse email</p>
                      <p className="text-sm font-medium">{apprentice.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="text-sm font-medium">{apprentice.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Formation</p>
                      <p className="text-sm font-medium">{apprentice.education || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Informations de l'entreprise */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">Entreprise</h4>
                    <button 
                      className="text-primary-600 hover:text-primary-700 text-sm"
                      onClick={() => handleEdit('company')}
                    >
                      Modifier
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Nom</p>
                      <p className="text-sm font-medium">{company.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">SIRET</p>
                      <p className="text-sm font-medium">{company.siret || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Adresse</p>
                      <p className="text-sm font-medium">{company.address || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email de contact</p>
                      <p className="text-sm font-medium">{company.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="text-sm font-medium">{company.phone || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Informations du maître d'alternance */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">Maître d'alternance</h4>
                    <button 
                      className="text-primary-600 hover:text-primary-700 text-sm"
                      onClick={() => handleEdit('mentor')}
                    >
                      Modifier
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Nom</p>
                      <p className="text-sm font-medium">{mentor.lastName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Prénom</p>
                      <p className="text-sm font-medium">{mentor.firstName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fonction</p>
                      <p className="text-sm font-medium">{mentor.position || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium">{mentor.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="text-sm font-medium">{mentor.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expérience</p>
                      <p className="text-sm font-medium">{mentor.experience || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails du contrat */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">Détails du contrat</h4>
                  <button 
                    className="text-primary-600 hover:text-primary-700 text-sm"
                    onClick={() => handleEdit('contract')}
                  >
                    Modifier
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Date de début</p>
                    <p className="text-sm font-medium">{formatDate(file.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date de fin</p>
                    <p className="text-sm font-medium">{formatDate(file.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Durée</p>
                    <p className="text-sm font-medium">{file.duration || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rémunération</p>
                    <p className="text-sm font-medium">{file.salary || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Temps de travail</p>
                    <p className="text-sm font-medium">{file.workHours || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Statut</p>
                    <p className="text-sm font-medium">{file.stage}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="flex-1 overflow-y-auto p-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800">Documents</h4>
                  <button className="text-primary-600 hover:text-primary-700 text-sm flex items-center">
                    <i className="ri-add-line mr-1"></i> Ajouter
                  </button>
                </div>

                {documents && documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc: Document) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-white rounded-md"
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded flex items-center justify-center ${
                              doc.name.endsWith(".pdf")
                                ? "bg-red-100 text-red-500"
                                : "bg-blue-100 text-blue-500"
                            }`}
                          >
                            <i
                              className={
                                doc.name.endsWith(".pdf")
                                  ? "ri-file-pdf-line"
                                  : "ri-file-text-line"
                              }
                            ></i>
                          </div>
                          <p className="text-sm font-medium ml-3">{doc.name}</p>
                        </div>
                        <div className="flex space-x-1">
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <i className="ri-eye-line"></i>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <i className="ri-download-line"></i>
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Aucun document disponible</p>
                  </div>                )}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 overflow-y-auto p-4">
              <CommentSection fileId={fileId} comments={comments} />
            </TabsContent>
          </Tabs>

          <div className="border-t border-gray-200 p-4 flex justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex items-center">
                <i className="ri-delete-bin-line mr-1.5"></i>
                Supprimer
              </Button>
              
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Les modales d'édition */}
      {fileDetails && (
        <>
          {isEditingApprentice && (
            <ApprenticeEditDialog
              isOpen={isEditingApprentice}
              onClose={() => setIsEditingApprentice(false)}
              apprentice={apprentice}
              onSubmit={onApprenticeSubmit}
              isLoading={updateApprentice.isPending}
            />
          )}

          {isEditingCompany && (
            <CompanyEditDialog
              isOpen={isEditingCompany}
              onClose={() => setIsEditingCompany(false)}
              company={company}
              onSubmit={onCompanySubmit}
              isLoading={updateCompany.isPending}
            />
          )}

          {isEditingMentor && (
            <MentorEditDialog
              isOpen={isEditingMentor}
              onClose={() => setIsEditingMentor(false)}
              mentor={mentor}
              onSubmit={onMentorSubmit}
              isLoading={updateMentor.isPending}
            />
          )}
        </>
      )}
    </>
  );
}