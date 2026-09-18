import { toast } from "sonner";

export function useToast() {
  return {
    success: (message: string, description?: string) =>
      toast.success(message, { description }),
    error: (message: string, description?: string) =>
      toast.error(message, { description }),
    message: (message: string, description?: string) =>
      toast.message(message, { description }),
    warning: (message: string, description?: string) =>
      toast.warning(message, { description }),
    info: (message: string, description?: string) =>
      toast.info(message, { description }),
    loading: (message: string) => toast.loading(message),
    dismiss: (toastId?: string | number) => toast.dismiss(toastId),
    promise: toast.promise,
  };
}

export type Toast = ReturnType<typeof useToast>;