import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/lib/types";
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

// Zod schema for form validation
const companyFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  siret: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompaniesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Setup form with react-hook-form
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      siret: "",
      address: "",
      email: "",
      phone: "",
    },
  });

  // Fetch companies data
  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Create company mutation
  const createCompany = useMutation({
    mutationFn: async (data: CompanyFormValues) => {
      const response = await apiRequest("/api/companies", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entreprise créée",
        description: "L'entreprise a été créée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'entreprise.",
        variant: "destructive",
      });
    },
  });

  // Update company mutation
  const updateCompany = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CompanyFormValues }) => {
      const response = await apiRequest(`/api/companies/${id}`, "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entreprise mise à jour",
        description: "L'entreprise a été mise à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      form.reset();
      setIsDialogOpen(false);
      setCurrentCompany(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'entreprise.",
        variant: "destructive",
      });
    },
  });

  // Delete company mutation
  const deleteCompany = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/companies/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Entreprise supprimée",
        description: "L'entreprise a été supprimée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'entreprise.",
        variant: "destructive",
      });
    },
  });

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setCurrentCompany(company);
      form.reset({
        name: company.name,
        siret: company.siret || "",
        address: company.address || "",
        email: company.email || "",
        phone: company.phone || "",
      });
    } else {
      setCurrentCompany(null);
      form.reset({
        name: "",
        siret: "",
        address: "",
        email: "",
        phone: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentCompany(null);
    form.reset();
  };

  const onSubmit = (data: CompanyFormValues) => {
    if (currentCompany) {
      updateCompany.mutate({ id: currentCompany.id, data });
    } else {
      createCompany.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) {
      deleteCompany.mutate(id);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Entreprises"
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">Gestion des entreprises</h1>
            <Button onClick={() => handleOpenDialog()}>
              <i className="ri-add-line mr-2"></i>
              Nouvelle entreprise
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des entreprises</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center">
                  <p className="text-gray-500">Chargement des entreprises...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>SIRET</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies && companies.length > 0 ? (
                      companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.siret || "-"}</TableCell>
                          <TableCell>{company.address || "-"}</TableCell>
                          <TableCell>{company.email || "-"}</TableCell>
                          <TableCell>{company.phone || "-"}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(company)}
                              >
                                <i className="ri-edit-line"></i>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(company.id)}
                              >
                                <i className="ri-delete-bin-line"></i>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          Aucune entreprise disponible
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog for creating/editing companies */}
          <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {currentCompany ? "Modifier une entreprise" : "Nouvelle entreprise"}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Nom de l'entreprise" {...field} />
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
                      disabled={createCompany.isPending || updateCompany.isPending}
                    >
                      {createCompany.isPending || updateCompany.isPending
                        ? "Enregistrement..."
                        : currentCompany
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
