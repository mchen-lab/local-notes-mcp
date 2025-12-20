import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConfirmDialog({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  onConfirm, 
  confirmText = "Confirm",
  cancelText = "Cancel",
  isAlert = false
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!isAlert && <AlertDialogCancel>{cancelText}</AlertDialogCancel>}
          <AlertDialogAction onClick={(e) => {
             // e.preventDefault();
             if (onConfirm) onConfirm();
          }}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
