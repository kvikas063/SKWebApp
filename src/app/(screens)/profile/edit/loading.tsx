import { Loader2 } from "lucide-react";

export default function EditProfileLoading() {
  return (
    <div
      className="flex min-h-[400px] items-center justify-center"
      aria-busy="true"
      aria-label="Loading edit profile"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
