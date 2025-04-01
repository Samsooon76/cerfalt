import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mentor, Company } from "@/lib/types";
import axios from "axios";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Zod schema for form validation
const mentorFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  position: z.string().optional(),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  experience: z.string().optional(),
  companyId: z.string().optional(),
});

type MentorFormValues = z.infer<typeof mentorFormSchema>;

export default function MentorsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMentor, setCurrentMentor] = useState<Mentor | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Setup form with react-hook-form
  const form = useForm<MentorFormValues>({
    resolver: zodResolver(mentorFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      position: "",
      email: "",
      phone: "",
      experience: "",
      companyId: "",
    },
  });

  // Fetch mentors data
  const { data: mentors, isLoading } = useQuery<Mentor[]>({
    queryKey: ["/api/mentors"],
  });

  // Fetch companies for the select dropdown
  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Create mentor mutation
  const createMentor = useMutation({
    mutationFn: async (data: MentorFormValues) => {
      const formattedData = {
        ...data,
        companyId: data.companyId ? parseInt(data.companyId) : undefined,
      };
      const response = await apiRequest("/api/mentors", "POST", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Maître d'alternance créé",
        description: "Le maître d'alternance a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mentors"] });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le maître d'alternance.",
        variant: "destructive",
      });
    },
  });

  // Update mentor mutation
  const updateMentor = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MentorFormValues }) => {
      const formattedData = {
        ...data,
        companyId: data.companyId ? parseInt(data.companyId) : undefined,
      };
      const response = await apiRequest(`/api/mentors/${id}`, "PUT", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Maître d'alternance mis à jour",
        description: "Le maître d'alternance a été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mentors"] });
      form.reset();
      setIsDialogOpen(false);
      setCurrentMentor(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le maître d'alternance.",
        variant: "destructive",
      });
    },
  });

  // Delete mentor mutation
  const deleteMentor = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/mentors/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Maître d'alternance supprimé",
        description: "Le maître d'alternance a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mentors"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le maître d'alternance.",
        variant: "destructive",
      });
    },
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleOpenDialog = (mentor?: Mentor) => {
    if (mentor) {
      setCurrentMentor(mentor);
      form.reset({
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        position: mentor.position || "",
        email: mentor.email,
        phone: mentor.phone || "",
        experience: mentor.experience || "",
        companyId: mentor.companyId ? mentor.companyId.toString() : "",
      });
    } else {
      setCurrentMentor(null);
      form.reset({
        firstName: "",
        lastName: "",
        position: "",
        email: "",
        phone: "",
        experience: "",
        companyId: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentMentor(null);
    form.reset();
  };

  const onSubmit = (data: MentorFormValues) => {
    if (currentMentor) {
      updateMentor.mutate({ id: currentMentor.id, data });
    } else {
      createMentor.mutate(data);
    }
  };
  
  // Fonction pour déclencher l'input de fichier
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Fonction pour gérer l'extraction OCR de la carte d'identité
  const handleIdCardExtraction = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      
      // Si nous avons un tuteur, inclure son ID pour mise à jour automatique
      if (currentMentor) {
        formData.append("mentorId", currentMentor.id.toString());
        formData.append("personType", "mentor");
      }
      
      try {
        setIsOcrLoading(true);
        
        const response = await axios.post("/api/extract-id-card", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        if (response.data) {
          // Mettre à jour le formulaire avec les données extraites
          form.setValue("firstName", response.data.firstName || form.getValues("firstName"));
          form.setValue("lastName", response.data.lastName || form.getValues("lastName"));
          
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
        setIsOcrLoading(false);
        // Réinitialiser l'input de fichier pour permettre la même sélection consécutive
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce maître d'alternance ?")) {
      deleteMentor.mutate(id);
    }
  };

  // Find company name by ID
  const getCompanyName = (companyId?: number) => {
    if (!companyId || !companies) return "-";
    const company = companies.find((c) => c.id === companyId);
    return company ? company.name : "-";
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Maîtres d'alternance"
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Gestion des maîtres d'alternance</h1>
            <Button onClick={() => handleOpenDialog()}>
              <i className="ri-add-line mr-2"></i>
              Nouveau maître d'alternance
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des maîtres d'alternance</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500">Chargement des maîtres d'alternance...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Fonction</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mentors && mentors.length > 0 ? (
                      mentors.map((mentor) => (
                        <TableRow key={mentor.id}>
                          <TableCell className="font-medium">{mentor.lastName}</TableCell>
                          <TableCell>{mentor.firstName}</TableCell>
                          <TableCell>{mentor.position || "-"}</TableCell>
                          <TableCell>{mentor.email}</TableCell>
                          <TableCell>{mentor.phone || "-"}</TableCell>
                          <TableCell>{getCompanyName(mentor.companyId)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(mentor)}
                              >
                                <i className="ri-edit-line"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(mentor.id)}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          Aucun maître d'alternance disponible
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog for creating/editing mentors */}
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {currentMentor ? "Modifier un maître d'alternance" : "Nouveau maître d'alternance"}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                  </div>
                  
                  {/* Bouton et input pour l'extraction OCR */}
                  <div className="mb-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={triggerFileInput}
                      disabled={isOcrLoading}
                    >
                      {isOcrLoading ? (
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
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleIdCardExtraction}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      Extraire automatiquement les informations d'une pièce d'identité
                    </p>
                  </div>

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

                  <FormField
                    control={form.control}
                    name="companyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entreprise</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une entreprise" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies?.map((company) => (
                              <SelectItem key={company.id} value={company.id.toString()}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMentor.isPending || updateMentor.isPending}
                    >
                      {createMentor.isPending || updateMentor.isPending
                        ? "Enregistrement..."
                        : currentMentor
                        ? "Mettre à jour"
                        : "Créer"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
