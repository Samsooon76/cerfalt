import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Apprentice } from "@/lib/types";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
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

// Zod schema for form validation
const apprenticeFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  address: z.string().optional(),
  education: z.string().optional(),
});

// Zod schema for ID card upload
const idCardUploadSchema = z.object({
  idCardFile: z
    .instanceof(File, { message: "Veuillez sélectionner une pièce d'identité" })
    .refine((file) => file.size <= 5 * 1024 * 1024, "La taille du fichier ne doit pas dépasser 5 MB")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(file.type),
      "Format accepté : JPG, PNG ou PDF"
    ),
});

type ApprenticeFormValues = z.infer<typeof apprenticeFormSchema>;
type IdCardUploadFormValues = z.infer<typeof idCardUploadSchema>;

export default function ApprenticesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentApprentice, setCurrentApprentice] = useState<Apprentice | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Setup form with react-hook-form
  const form = useForm<ApprenticeFormValues>({
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
  
  // Setup form for ID card upload
  const idCardForm = useForm<IdCardUploadFormValues>({
    resolver: zodResolver(idCardUploadSchema),
  });

  // Fetch apprentices data
  const { data: apprentices, isLoading } = useQuery<Apprentice[]>({
    queryKey: ["/api/apprentices"],
  });

  // Create apprentice mutation
  const createApprentice = useMutation({
    mutationFn: async (data: ApprenticeFormValues) => {
      const response = await apiRequest("/api/apprentices", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alternant créé",
        description: "L'alternant a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/apprentices"] });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'alternant.",
        variant: "destructive",
      });
    },
  });

  // Update apprentice mutation
  const updateApprentice = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ApprenticeFormValues }) => {
      const response = await apiRequest(`/api/apprentices/${id}`, "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alternant mis à jour",
        description: "L'alternant a été mis à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/apprentices"] });
      form.reset();
      setIsDialogOpen(false);
      setCurrentApprentice(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'alternant.",
        variant: "destructive",
      });
    },
  });

  // Delete apprentice mutation
  const deleteApprentice = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/apprentices/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Alternant supprimé",
        description: "L'alternant a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/apprentices"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'alternant.",
        variant: "destructive",
      });
    },
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleOpenDialog = (apprentice?: Apprentice) => {
    if (apprentice) {
      setCurrentApprentice(apprentice);
      form.reset({
        firstName: apprentice.firstName,
        lastName: apprentice.lastName,
        email: apprentice.email,
        phone: apprentice.phone || "",
        birthDate: apprentice.birthDate || "",
        address: apprentice.address || "",
        education: apprentice.education || "",
      });
    } else {
      setCurrentApprentice(null);
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        birthDate: "",
        address: "",
        education: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentApprentice(null);
    form.reset();
    idCardForm.reset();
  };

  const onSubmit = (data: ApprenticeFormValues) => {
    if (currentApprentice) {
      updateApprentice.mutate({ id: currentApprentice.id, data });
    } else {
      createApprentice.mutate(data);
    }
  };
  
  // Fonctions pour l'OCR direct
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleIdCardExtraction = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      
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
          form.setValue("birthDate", response.data.birthDate || form.getValues("birthDate"));
          form.setValue("address", response.data.address || form.getValues("address"));
          
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
    if (confirm("Êtes-vous sûr de vouloir supprimer cet alternant ?")) {
      deleteApprentice.mutate(id);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Alternants"
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Gestion des alternants</h1>
            <Button onClick={() => handleOpenDialog()}>
              <i className="ri-add-line mr-2"></i>
              Nouvel alternant
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des alternants</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500">Chargement des alternants...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Formation</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apprentices && apprentices.length > 0 ? (
                      apprentices.map((apprentice) => (
                        <TableRow key={apprentice.id}>
                          <TableCell className="font-medium">{apprentice.lastName}</TableCell>
                          <TableCell>{apprentice.firstName}</TableCell>
                          <TableCell>{apprentice.email}</TableCell>
                          <TableCell>{apprentice.phone || "-"}</TableCell>
                          <TableCell>{apprentice.education || "-"}</TableCell>
                          <TableCell>{formatDate(apprentice.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(apprentice)}
                              >
                                <i className="ri-edit-line"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(apprentice.id)}
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
                          Aucun alternant disponible
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog for creating/editing apprentices */}
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {currentApprentice ? "Modifier un alternant" : "Nouvel alternant"}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de naissance</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={createApprentice.isPending || updateApprentice.isPending}
                    >
                      {createApprentice.isPending || updateApprentice.isPending
                        ? "Enregistrement..."
                        : currentApprentice
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