import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const documentUploadSchema = z.object({
  fileId: z.string().min(1, "Veuillez sélectionner un dossier"),
  type: z.string().min(1, "Veuillez sélectionner un type de document"),
  extractData: z.boolean().optional(),
  document: z.instanceof(File, { message: "Veuillez sélectionner un fichier" }),
});

type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

const directUploadSchema = z.object({
  apprenticeId: z.string().min(1, "Veuillez sélectionner un alternant"),
  type: z.string().min(1, "Veuillez sélectionner un type de document"),
  extractData: z.boolean().optional(),
  document: z.instanceof(File, { message: "Veuillez sélectionner un fichier" }),
});

type DirectUploadFormData = z.infer<typeof directUploadSchema>;

export default function DocumentUploadModal({ isOpen, onClose }: DocumentUploadModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("existing");
  
  // Form for uploading to existing file
  const form = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      fileId: "",
      type: "",
      extractData: false,
      document: undefined,
    },
  });
  
  // Form for direct upload to apprentice
  const directForm = useForm<DirectUploadFormData>({
    resolver: zodResolver(directUploadSchema),
    defaultValues: {
      apprenticeId: "",
      type: "ID_CARD", // Default to ID card for direct upload
      extractData: true, // Default to extracting data for direct upload
      document: undefined,
    },
  });
  
  const { data: apprentices = [], isLoading: apprenticesLoading } = useQuery<any[]>({
    queryKey: ["/api/apprentices"],
    enabled: isOpen,
  });

  const { data: files = [], isLoading: filesLoading } = useQuery<any[]>({
    queryKey: ["/api/files"],
    enabled: isOpen,
  });

  // Reset forms when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      form.reset();
      directForm.reset({
        apprenticeId: "",
        type: "ID_CARD",
        extractData: true,
        document: undefined,
      });
    }
  }, [isOpen, form, directForm]);

  // Upload document to existing file
  const uploadDocument = useMutation({
    mutationFn: async (data: DocumentUploadFormData) => {
      const formData = new FormData();
      formData.append("fileId", data.fileId);
      formData.append("type", data.type);
      formData.append("name", data.document.name);
      formData.append("extractData", data.extractData ? "true" : "false");
      formData.append("file", data.document);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to upload document");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document importé",
        description: "Le document a été importé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/apprentices"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'importer le document.",
        variant: "destructive",
      });
    },
  });

  // Direct upload to apprentice with OCR
  const uploadDirectDocument = useMutation({
    mutationFn: async (data: DirectUploadFormData) => {
      const formData = new FormData();
      formData.append("apiKey", process.env.MISTRAL_API_KEY || "");
      formData.append("file", data.document);
      
      // First extract data from ID card
      const response = await fetch("/api/extract-id-card", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to extract data from ID");
      }
      
      const ocrResult = await response.json();
      
      if (!ocrResult.data) {
        throw new Error("Aucune donnée extraite de la pièce d'identité");
      }
      
      // Get the selected apprentice
      const apprenticeId = parseInt(data.apprenticeId);
      const apprentice = apprentices?.find(a => a.id === apprenticeId);
      
      if (!apprentice) {
        throw new Error("Alternant non trouvé");
      }
      
      // Update apprentice data with extracted info
      const updateData: any = {};
      const extractedData = ocrResult.data;
      
      if (extractedData.firstName && (!apprentice.firstName || apprentice.firstName === "")) {
        updateData.firstName = extractedData.firstName;
      }
      
      if (extractedData.lastName && (!apprentice.lastName || apprentice.lastName === "")) {
        updateData.lastName = extractedData.lastName;
      }
      
      if (extractedData.birthDate && (!apprentice.birthDate || apprentice.birthDate === "")) {
        updateData.birthDate = extractedData.birthDate;
      }
      
      if (extractedData.address && (!apprentice.address || apprentice.address === "")) {
        updateData.address = extractedData.address;
      }
      
      // Update apprentice if we have new data
      if (Object.keys(updateData).length > 0) {
        await apiRequest("PUT", `/api/apprentices/${apprenticeId}`, updateData);
      }
      
      // Create file if apprentice doesn't have one
      let fileId: number;
      const existingFile = files?.find(f => f.apprenticeId === apprenticeId);
      
      if (existingFile) {
        fileId = existingFile.id;
      } else {
        // Create a new file for this apprentice
        const fileResponse = await apiRequest("POST", "/api/files", {
          apprenticeId: apprenticeId,
          companyId: 1, // Default company ID - this should be updated later
          mentorId: 1, // Default mentor ID - this should be updated later
          stage: "RECEPTION"
        });
        
        const newFile = await fileResponse.json();
        fileId = newFile.id;
      }
      
      // Finally, upload the document to the file
      const docFormData = new FormData();
      docFormData.append("fileId", fileId.toString());
      docFormData.append("type", data.type);
      docFormData.append("name", data.document.name);
      docFormData.append("extractData", "true");
      docFormData.append("file", data.document);
      
      const docResponse = await fetch("/api/documents", {
        method: "POST",
        body: docFormData,
        credentials: "include",
      });
      
      if (!docResponse.ok) {
        const errorText = await docResponse.text();
        throw new Error(errorText || "Failed to upload document");
      }
      
      return {
        message: "Document uploaded and apprentice data updated",
        updatedFields: Object.keys(updateData)
      };
    },
    onSuccess: (data) => {
      toast({
        title: "Document importé et données extraites",
        description: `Le document a été importé avec succès${data.updatedFields.length > 0 ? ` et les données de l'alternant ont été mises à jour (${data.updatedFields.join(', ')})` : ''}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/apprentices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      directForm.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter le document.",
        variant: "destructive",
      });
    },
  });

  const isLoading = 
    apprenticesLoading || 
    filesLoading || 
    uploadDocument.isPending || 
    uploadDirectDocument.isPending;

  const onSubmit = (data: DocumentUploadFormData) => {
    uploadDocument.mutate(data);
  };

  const onDirectSubmit = (data: DirectUploadFormData) => {
    uploadDirectDocument.mutate(data);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, uploadForm: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadForm.setValue("document", e.dataTransfer.files[0], {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importer un document</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Document pour un dossier</TabsTrigger>
            <TabsTrigger value="direct">Pièce d'identité alternant</TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="fileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dossier</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un dossier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filesLoading ? (
                            <SelectItem value="loading" disabled>
                              Chargement...
                            </SelectItem>
                          ) : files && files.length > 0 ? (
                            files.map((file) => {
                              const apprentice = apprentices?.find(
                                (a) => a.id === file.apprenticeId
                              );
                              return (
                                <SelectItem key={file.id} value={file.id.toString()}>
                                  {apprentice
                                    ? `${apprentice.firstName} ${apprentice.lastName}`
                                    : `Dossier #${file.id}`}
                                </SelectItem>
                              );
                            })
                          ) : (
                            <SelectItem value="no_files" disabled>
                              Aucun dossier disponible
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de document</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type de document" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CERFA">Cerfa 10103*13</SelectItem>
                          <SelectItem value="ID_CARD">Carte d'identité</SelectItem>
                          <SelectItem value="PASSPORT">Passeport</SelectItem>
                          <SelectItem value="CERTIFICATE">Attestation de formation</SelectItem>
                          <SelectItem value="CONTRACT">Contrat</SelectItem>
                          <SelectItem value="OTHER">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-sm text-gray-500 mt-1">
                        L'OCR avec Mistral AI sera utilisé pour analyser automatiquement les documents.
                      </div>
                    
                      <div className="mt-4">
                        <div className="text-sm font-medium text-gray-500 mb-2">
                          Analyse OCR
                        </div>
                        {form.getValues("type") === "ID_CARD" && (
                          <div className="p-4 bg-gray-50 rounded-md">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600">
                                L'analyse OCR sera effectuée après l'upload
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="document"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <div
                        className={`border-2 border-dashed rounded-md p-6 text-center ${
                          dragActive ? "border-primary-500 bg-primary-50" : "border-gray-300"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={(e) => handleDrop(e, form)}
                      >
                        <div className="space-y-2">
                          <i className="ri-upload-cloud-line text-4xl text-gray-400"></i>
                          <p className="text-sm text-gray-600">Glissez et déposez vos fichiers ici</p>
                          <p className="text-xs text-gray-500">ou</p>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  onChange(file);
                                }
                              };
                              input.click();
                            }}
                            disabled={isLoading}
                          >
                            Parcourir les fichiers
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">PDF, JPEG, PNG (Max 10Mo)</p>
                          {value && (
                            <div className="mt-2 text-sm text-primary-600 font-medium">
                              {typeof value === "object" ? value.name : ""}
                            </div>
                          )}
                          {form.formState.errors.document && (
                            <p className="text-sm text-red-500">
                              {form.formState.errors.document.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extractData"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Extraire automatiquement les données (OCR)</FormLabel>
                      </div>
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
                    {isLoading ? "Importation..." : "Importer"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="direct">
            <Form {...directForm}>
              <form onSubmit={directForm.handleSubmit(onDirectSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={directForm.control}
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
                  control={directForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de document</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type de document" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ID_CARD">Carte d'identité</SelectItem>
                          <SelectItem value="PASSPORT">Passeport</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={directForm.control}
                  name="document"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <div
                        className={`border-2 border-dashed rounded-md p-6 text-center ${
                          dragActive ? "border-primary-500 bg-primary-50" : "border-gray-300"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={(e) => handleDrop(e, directForm)}
                      >
                        <div className="space-y-2">
                          <i className="ri-upload-cloud-line text-4xl text-gray-400"></i>
                          <p className="text-sm text-gray-600">Glissez et déposez votre pièce d'identité ici</p>
                          <p className="text-xs text-gray-500">ou</p>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".jpg,.jpeg,.png";
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  onChange(file);
                                }
                              };
                              input.click();
                            }}
                            disabled={isLoading}
                          >
                            Parcourir les fichiers
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">JPEG, PNG (Max 10Mo)</p>
                          {value && (
                            <div className="mt-2 text-sm text-primary-600 font-medium">
                              {typeof value === "object" ? value.name : ""}
                            </div>
                          )}
                          {directForm.formState.errors.document && (
                            <p className="text-sm text-red-500">
                              {directForm.formState.errors.document.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
                  <p className="font-medium mb-1">Extraction automatique des données</p>
                  <p>Les informations de l'alternant (nom, prénom, date de naissance, adresse) seront automatiquement extraites et mises à jour.</p>
                </div>

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
                    {isLoading ? "Traitement..." : "Importer et extraire"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
