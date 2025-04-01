import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Schémas de validation pour les différentes étapes
const apprenticeFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").or(z.string().length(0)),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  education: z.string().optional(),
});

const companyFormSchema = z.object({
  name: z.string().min(1, "Le nom de l'entreprise est requis"),
  siret: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
});

const mentorFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  position: z.string().optional(),
  email: z.string().email("Email invalide").or(z.string().length(0)),
  phone: z.string().optional(),
  experience: z.string().optional(),
});

const fileFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  stage: z.string().default("REQUEST"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ApprenticeFormValues = z.infer<typeof apprenticeFormSchema>;
type CompanyFormValues = z.infer<typeof companyFormSchema>;
type MentorFormValues = z.infer<typeof mentorFormSchema>;
type FileFormValues = z.infer<typeof fileFormSchema>;

interface CreateFileWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateFileWizard({ isOpen, onClose }: CreateFileWizardProps) {
  // États pour suivre la progression
  const [step, setStep] = useState<"apprentice" | "company" | "mentor" | "file">("apprentice");
  const [progress, setProgress] = useState(25);
  const [apprenticeId, setApprenticeId] = useState<number | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [mentorId, setMentorId] = useState<number | null>(null);
  
  // États pour la fonctionnalité OCR
  const [isApprenticeOcrLoading, setIsApprenticeOcrLoading] = useState(false);
  const [isMentorOcrLoading, setIsMentorOcrLoading] = useState(false);
  const apprenticeFileInputRef = useRef<HTMLInputElement>(null);
  const mentorFileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Formulaires pour chaque étape
  const apprenticeForm = useForm<ApprenticeFormValues>({
    resolver: zodResolver(apprenticeFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthDate: "",
      address: "",
      education: "",
    },
  });

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      siret: "",
      address: "",
      phone: "",
      industry: "",
      size: "",
    },
  });

  const mentorForm = useForm<MentorFormValues>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      position: "",
      email: "",
      phone: "",
      experience: "",
    },
  });

  const fileForm = useForm<FileFormValues>({
    resolver: zodResolver(fileFormSchema),
    defaultValues: {
      title: "",
      description: "",
      stage: "REQUEST",
      startDate: "",
      endDate: "",
    },
  });

  // Récupère tous les apprentices, entreprises et mentors existants
  const { data: apprentices = [] } = useQuery<any[]>({
    queryKey: ["/api/apprentices"],
  });
  
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });
  
  const { data: mentors = [] } = useQuery<any[]>({
    queryKey: ["/api/mentors"],
  });

  // Mutations pour créer de nouveaux éléments
  const createApprentice = useMutation({
    mutationFn: async (data: ApprenticeFormValues) => {
      const response = await apiRequest("/api/apprentices", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      setApprenticeId(data.id);
      toast({
        title: "Alternant créé",
        description: "L'alternant a été créé avec succès.",
      });
      setStep("company");
      setProgress(50);
      queryClient.invalidateQueries({ queryKey: ["/api/apprentices"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'alternant.",
        variant: "destructive",
      });
    },
  });

  const createCompany = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      const response = await apiRequest("/api/companies", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCompanyId(data.id);
      toast({
        title: "Entreprise créée",
        description: "L'entreprise a été créée avec succès.",
      });
      setStep("mentor");
      setProgress(75);
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'entreprise.",
        variant: "destructive",
      });
    },
  });

  const createMentor = useMutation({
    mutationFn: async (data: MentorFormValues) => {
      const formattedData = {
        ...data,
        companyId,
      };
      const response = await apiRequest("/api/mentors", "POST", formattedData);
      return response.json();
    },
    onSuccess: (data) => {
      setMentorId(data.id);
      toast({
        title: "Tuteur créé",
        description: "Le tuteur a été créé avec succès.",
      });
      setStep("file");
      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ["/api/mentors"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le tuteur.",
        variant: "destructive",
      });
    },
  });

  const createFile = useMutation({
    mutationFn: async (data: FileFormValues) => {
      const formattedData = {
        ...data,
        apprenticeId,
        companyId,
        mentorId,
      };
      const response = await apiRequest("/api/files", "POST", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dossier créé",
        description: "Le dossier a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      resetAndClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le dossier.",
        variant: "destructive",
      });
    },
  });

  // Gestion de la soumission des formulaires
  const onSubmitApprentice = (data: ApprenticeFormValues) => {
    createApprentice.mutate(data);
  };

  const onSubmitCompany = (data: CompanyFormValues) => {
    createCompany.mutate(data);
  };

  const onSubmitMentor = (data: MentorFormValues) => {
    createMentor.mutate(data);
  };

  const onSubmitFile = (data: FileFormValues) => {
    createFile.mutate(data);
  };

  // Méthodes de navigation entre les étapes
  const goToNext = () => {
    switch (step) {
      case "apprentice":
        setStep("company");
        setProgress(50);
        break;
      case "company":
        setStep("mentor");
        setProgress(75);
        break;
      case "mentor":
        setStep("file");
        setProgress(100);
        break;
      default:
        break;
    }
  };

  const goToPrevious = () => {
    switch (step) {
      case "company":
        setStep("apprentice");
        setProgress(25);
        break;
      case "mentor":
        setStep("company");
        setProgress(50);
        break;
      case "file":
        setStep("mentor");
        setProgress(75);
        break;
      default:
        break;
    }
  };

  const resetAndClose = () => {
    setStep("apprentice");
    setProgress(25);
    setApprenticeId(null);
    setCompanyId(null);
    setMentorId(null);
    apprenticeForm.reset();
    companyForm.reset();
    mentorForm.reset();
    fileForm.reset();
    onClose();
  };

  // Sélection d'un apprenti existant
  const handleSelectApprentice = (id: string) => {
    const selectedId = parseInt(id);
    setApprenticeId(selectedId);
    
    // Recherche de l'apprenti correspondant et mise à jour du formulaire
    const apprentice = apprentices.find(a => a.id === selectedId);
    if (apprentice) {
      apprenticeForm.reset({
        firstName: apprentice.firstName,
        lastName: apprentice.lastName,
        email: apprentice.email || "",
        phone: apprentice.phone || "",
        birthDate: apprentice.birthDate || "",
        address: apprentice.address || "",
        education: apprentice.education || "",
      });
    }
    
    goToNext();
  };

  // Sélection d'une entreprise existante
  const handleSelectCompany = (id: string) => {
    const selectedId = parseInt(id);
    setCompanyId(selectedId);
    
    // Recherche de l'entreprise correspondante et mise à jour du formulaire
    const company = companies.find(c => c.id === selectedId);
    if (company) {
      companyForm.reset({
        name: company.name,
        siret: company.siret || "",
        address: company.address || "",
        phone: company.phone || "",
        industry: company.industry || "",
        size: company.size || "",
      });
    }
    
    goToNext();
  };

  // Sélection d'un tuteur existant
  const handleSelectMentor = (id: string) => {
    const selectedId = parseInt(id);
    setMentorId(selectedId);
    
    // Recherche du tuteur correspondant et mise à jour du formulaire
    const mentor = mentors.find(m => m.id === selectedId);
    if (mentor) {
      mentorForm.reset({
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        position: mentor.position || "",
        email: mentor.email || "",
        phone: mentor.phone || "",
        experience: mentor.experience || "",
      });
    }
    
    goToNext();
  };

  // Fonctions pour l'OCR
  const triggerApprenticeFileInput = () => {
    if (apprenticeFileInputRef.current) {
      apprenticeFileInputRef.current.click();
    }
  };

  const triggerMentorFileInput = () => {
    if (mentorFileInputRef.current) {
      mentorFileInputRef.current.click();
    }
  };

  const handleApprenticeIdCardExtraction = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        setIsApprenticeOcrLoading(true);
        
        const response = await axios.post("/api/extract-id-card", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        if (response.data) {
          // Mettre à jour le formulaire avec les données extraites
          apprenticeForm.setValue("firstName", response.data.firstName || apprenticeForm.getValues("firstName"));
          apprenticeForm.setValue("lastName", response.data.lastName || apprenticeForm.getValues("lastName"));
          apprenticeForm.setValue("birthDate", response.data.birthDate || apprenticeForm.getValues("birthDate"));
          apprenticeForm.setValue("address", response.data.address || apprenticeForm.getValues("address"));
          
          toast({
            title: "Extraction réussie",
            description: "Les informations ont été extraites avec succès de la carte d'identité",
          });
        }
      } catch (error) {
        console.error("Erreur lors de l'extraction OCR :", error);
        toast({
          title: "Erreur d'extraction",
          description: "Impossible d'extraire les informations de la carte d'identité",
          variant: "destructive",
        });
      } finally {
        setIsApprenticeOcrLoading(false);
        // Réinitialiser l'input de fichier pour permettre la même sélection consécutive
        if (apprenticeFileInputRef.current) {
          apprenticeFileInputRef.current.value = "";
        }
      }
    }
  };

  const handleMentorIdCardExtraction = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        setIsMentorOcrLoading(true);
        
        const response = await axios.post("/api/extract-id-card", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        if (response.data) {
          // Mettre à jour le formulaire avec les données extraites
          mentorForm.setValue("firstName", response.data.firstName || mentorForm.getValues("firstName"));
          mentorForm.setValue("lastName", response.data.lastName || mentorForm.getValues("lastName"));
          
          toast({
            title: "Extraction réussie",
            description: "Les informations ont été extraites avec succès de la carte d'identité",
          });
        }
      } catch (error) {
        console.error("Erreur lors de l'extraction OCR :", error);
        toast({
          title: "Erreur d'extraction",
          description: "Impossible d'extraire les informations de la carte d'identité",
          variant: "destructive",
        });
      } finally {
        setIsMentorOcrLoading(false);
        // Réinitialiser l'input de fichier pour permettre la même sélection consécutive
        if (mentorFileInputRef.current) {
          mentorFileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="mb-2">Création d'un nouveau dossier</DialogTitle>
          <Progress value={progress} className="h-2 w-full" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span className={step === "apprentice" ? "font-bold" : ""}>Alternant</span>
            <span className={step === "company" ? "font-bold" : ""}>Entreprise</span>
            <span className={step === "mentor" ? "font-bold" : ""}>Tuteur</span>
            <span className={step === "file" ? "font-bold" : ""}>Dossier</span>
          </div>
        </DialogHeader>

        {/* Étape 1: Alternant */}
        {step === "apprentice" && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sélectionner un alternant existant
              </label>
              <Select onValueChange={handleSelectApprentice}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un alternant..." />
                </SelectTrigger>
                <SelectContent>
                  {apprentices.map((apprentice) => (
                    <SelectItem key={apprentice.id} value={apprentice.id.toString()}>
                      {apprentice.firstName} {apprentice.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-center my-2 text-sm text-gray-500">- ou -</div>
            </div>

            <Form {...apprenticeForm}>
              <form onSubmit={apprenticeForm.handleSubmit(onSubmitApprentice)} className="space-y-4">
                {/* Bouton OCR */}
                <div className="mb-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={triggerApprenticeFileInput}
                    disabled={isApprenticeOcrLoading}
                  >
                    {isApprenticeOcrLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                        Extraction en cours...
                      </>
                    ) : (
                      <>
                        <i className="ri-camera-line mr-2"></i>
                        Scanner une carte d'identité
                      </>
                    )}
                  </Button>
                  <input 
                    type="file"
                    ref={apprenticeFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleApprenticeIdCardExtraction}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Extraire automatiquement les informations d'une pièce d'identité
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={apprenticeForm.control}
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
                    control={apprenticeForm.control}
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
                </div>

                <FormField
                  control={apprenticeForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={apprenticeForm.control}
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
                  control={apprenticeForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input placeholder="Date de naissance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={apprenticeForm.control}
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
                  control={apprenticeForm.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formation</FormLabel>
                      <FormControl>
                        <Input placeholder="Formation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetAndClose}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    Suivant
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {/* Étape 2: Entreprise */}
        {step === "company" && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sélectionner une entreprise existante
              </label>
              <Select onValueChange={handleSelectCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une entreprise..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-center my-2 text-sm text-gray-500">- ou -</div>
            </div>

            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-4">
                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de l'entreprise" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
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
                  control={companyForm.control}
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
                  control={companyForm.control}
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
                  control={companyForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secteur d'activité</FormLabel>
                      <FormControl>
                        <Input placeholder="Secteur d'activité" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyForm.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taille</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre d'employés" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={goToPrevious}>
                    Précédent
                  </Button>
                  <Button type="submit">
                    Suivant
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {/* Étape 3: Tuteur */}
        {step === "mentor" && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sélectionner un tuteur existant
              </label>
              <Select onValueChange={handleSelectMentor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un tuteur..." />
                </SelectTrigger>
                <SelectContent>
                  {mentors
                    .filter(mentor => !companyId || mentor.companyId === companyId)
                    .map((mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id.toString()}>
                        {mentor.firstName} {mentor.lastName} {mentor.companyId === companyId ? "(de cette entreprise)" : ""}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <div className="text-center my-2 text-sm text-gray-500">- ou -</div>
            </div>

            <Form {...mentorForm}>
              <form onSubmit={mentorForm.handleSubmit(onSubmitMentor)} className="space-y-4">
                {/* Bouton OCR */}
                <div className="mb-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={triggerMentorFileInput}
                    disabled={isMentorOcrLoading}
                  >
                    {isMentorOcrLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                        Extraction en cours...
                      </>
                    ) : (
                      <>
                        <i className="ri-camera-line mr-2"></i>
                        Scanner une carte d'identité
                      </>
                    )}
                  </Button>
                  <input 
                    type="file"
                    ref={mentorFileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleMentorIdCardExtraction}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Extraire automatiquement les informations d'une pièce d'identité
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={mentorForm.control}
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
                    control={mentorForm.control}
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
                </div>

                <FormField
                  control={mentorForm.control}
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
                  control={mentorForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={mentorForm.control}
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
                  control={mentorForm.control}
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

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={goToPrevious}>
                    Précédent
                  </Button>
                  <Button type="submit">
                    Suivant
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}

        {/* Étape 4: Dossier */}
        {step === "file" && (
          <Form {...fileForm}>
            <form onSubmit={fileForm.handleSubmit(onSubmitFile)} className="space-y-4">
              <FormField
                control={fileForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre du dossier</FormLabel>
                    <FormControl>
                      <Input placeholder="Titre du dossier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={fileForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Description du dossier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={fileForm.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Étape du dossier</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une étape" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="REQUEST">Demande de dossier</SelectItem>
                        <SelectItem value="CREATED">Dossier créé</SelectItem>
                        <SelectItem value="VERIFICATION">En cours de vérification</SelectItem>
                        <SelectItem value="PROCESSING">En traitement</SelectItem>
                        <SelectItem value="VALIDATED">Validé</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={fileForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={fileForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={goToPrevious}>
                  Précédent
                </Button>
                <Button type="submit" disabled={createFile.isPending}>
                  {createFile.isPending ? "Création..." : "Créer le dossier"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}