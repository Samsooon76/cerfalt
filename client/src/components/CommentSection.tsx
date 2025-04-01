import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Comment } from "@/lib/types";

interface CommentSectionProps {
  fileId: number;
  comments?: (Comment & { user: { id: number; fullName: string; avatarUrl?: string } })[];
}

const commentSchema = z.object({
  text: z.string().min(1, "Le commentaire ne peut pas être vide")
});

type CommentFormData = z.infer<typeof commentSchema>;

export default function CommentSection({ fileId, comments }: CommentSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      text: "",
    },
  });

  const addComment = useMutation({
    mutationFn: async (data: CommentFormData) => {
      const response = await apiRequest("POST", "/api/comments", {
        fileId,
        userId: 1, // Default to admin for now
        text: data.text,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été ajouté avec succès.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/files/${fileId}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter votre commentaire.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommentFormData) => {
    setIsSubmitting(true);
    addComment.mutate(data, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  // Format comment date
  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Aujourd'hui, ${date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      })}`;
    }
    if (diffDays === 1) return "Hier";
    return new Intl.DateTimeFormat("fr-FR").format(date);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="mb-3">
        <h4 className="font-medium text-gray-800">Commentaires</h4>
      </div>

      <div className="space-y-4 mb-4">
        {!comments || comments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Aucun commentaire</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div className="flex" key={comment.id}>
              <img
                src={comment.user.avatarUrl || "https://randomuser.me/api/portraits/women/44.jpg"}
                alt="Photo de profil"
                className="w-8 h-8 rounded-full mr-3"
              />
              <div className="flex-1">
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">{comment.user.fullName}</p>
                    <p className="text-xs text-gray-500">{formatCommentDate(comment.createdAt)}</p>
                  </div>
                  <p className="text-sm text-gray-600">{comment.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex">
          <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="Photo de profil"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex justify-end mt-2">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Envoi..." : "Commenter"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
