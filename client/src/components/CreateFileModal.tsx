import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CreateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createFileSchema = z.object({
  apprenticeId: z.string().min(1, "Veuillez sélectionner un alternant"),
  companyId: z.string().min(1, "Veuillez sélectionner une entreprise"),
  mentorId: z.string().min(1, "Veuillez sélectionner un tuteur"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type CreateFileFormData = z.infer<typeof createFileSchema>;

export default function CreateFileModal({ isOpen, onClose }: CreateFileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  
  const form = useForm<CreateFileFormData>({
    resolver: zodResolver(createFileSchema),
    defaultValues: {
      apprenticeId: "",
      companyId: "",
      mentorId: "",
      startDate: "",
      endDate: "",
      notes: "",
    },
  });
  
  const { data: apprentices = [], isLoading: apprenticesLoading } = useQuery<any[]>({
    queryKey: ["/api/apprentices"],
    enabled: isOpen,
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery<any[]>({
    queryKey: ["/api/companies"],
    enabled: isOpen,
  });

  const { data: mentors = [], isLoading: mentorsLoading } = useQuery<any[]>({
    queryKey: ["/api/mentors"],
    enabled: !!selectedCompanyId && isOpen,
  });

  const createFile = useMutation({
    mutationFn: async (data: CreateFileFormData) => {
      const payload = {
        apprenticeId: parseInt(data.apprenticeId),
        companyId: parseInt(data.companyId),
        mentorId: parseInt(data.mentorId),
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        notes: data.notes || undefined,
        stage: "RECEPTION", // Default stage for new files
      };
      
      const response = await apiRequest("/api/files", "POST", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dossier créé",
        description: "Le dossier a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le dossier.",
        variant: "destructive",
      });
    },
  });

  const isLoading = 
    apprenticesLoading || 
    companiesLoading || 
    mentorsLoading || 
    createFile.isPending;

  const onSubmit = (data: CreateFileFormData) => {
    createFile.mutate(data);
  };

  // Handle company change to filter mentors
  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value);
    form.setValue("companyId", value);
    form.setValue("mentorId", ""); // Reset mentor when company changes
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau dossier</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apprenticeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternant</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un alternant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {apprenticesLoading ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : apprentices && apprentices.length > 0 ? (
                        apprentices.map((apprentice) => (
                          <SelectItem key={apprentice.id} value={apprentice.id.toString()}>
                            {`${apprentice.firstName} ${apprentice.lastName}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_apprentices" disabled>
                          Aucun alternant disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
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
                    onValueChange={handleCompanyChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une entreprise" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companiesLoading ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : companies && companies.length > 0 ? (
                        companies.map((company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_companies" disabled>
                          Aucune entreprise disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mentorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tuteur</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading || !selectedCompanyId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          selectedCompanyId 
                            ? "Sélectionner un tuteur" 
                            : "Veuillez d'abord sélectionner une entreprise"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mentorsLoading ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : selectedCompanyId ? (
                        // Filtrer les mentors par entreprise
                        mentors && mentors.filter(mentor => 
                          mentor.companyId === parseInt(selectedCompanyId)
                        ).length > 0 ? (
                          // Afficher les mentors de l'entreprise sélectionnée
                          mentors.filter(mentor => 
                            mentor.companyId === parseInt(selectedCompanyId)
                          ).map((mentor) => (
                            <SelectItem key={mentor.id} value={mentor.id.toString()}>
                              {`${mentor.firstName} ${mentor.lastName}`}
                            </SelectItem>
                          ))
                        ) : (
                          // Aucun mentor pour cette entreprise
                          <SelectItem value="no_mentors_for_company" disabled>
                            Aucun tuteur pour cette entreprise
                          </SelectItem>
                        )
                      ) : (
                        // Aucune entreprise sélectionnée
                        <SelectItem value="no_company_selected" disabled>
                          Veuillez d'abord sélectionner une entreprise
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de début</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de fin</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Notes supplémentaires" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}