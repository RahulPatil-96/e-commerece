import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Branded confirmation dialog matching the Arihant luxury UI.
 * Replaces native window.confirm() popups.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   title: string,
 *   description?: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   destructive?: boolean,
 *   loading?: boolean,
 *   onConfirm: () => void
 * }} props
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-3xl border-border/80 bg-card shadow-lift">
        <AlertDialogHeader className="text-center sm:text-left">
          <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-1">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="font-serif-display text-xl font-bold text-foreground">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-xs text-muted-foreground font-light leading-relaxed">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={loading}
            className="flex-1 sm:flex-none rounded-full border-border/80 bg-secondary text-foreground hover:bg-secondary/80 hover:text-foreground"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className={`flex-1 sm:flex-none rounded-full ${
              destructive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lift'
                : 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground shadow-lift'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
