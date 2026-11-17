import type { ButtonHTMLAttributes, ReactNode } from "react";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/** Shared button primitive. Existing module classes preserve page-specific sizing. */
export function AdminButton({ className = "", type = "button", ...props }: AdminButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={["admin-button", className].filter(Boolean).join(" ")}
    />
  );
}

export function FormField({
  label,
  children,
  full = false,
  className = "",
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
  className?: string;
}) {
  return (
    <label className={[full ? "full" : "", className].filter(Boolean).join(" ")}>
      {label}
      {children}
    </label>
  );
}

/** Shared modal form footer; callers provide their existing module classes and handlers. */
export function AdminFormActions({
  close,
  saving,
  disabled = false,
  submit,
  className = "",
  primaryClassName = "",
  cancelLabel = "취소",
  submitLabel = "저장",
  savingLabel = "저장 중…",
}: {
  close: () => void;
  saving: boolean;
  disabled?: boolean;
  submit: () => void;
  className?: string;
  primaryClassName?: string;
  cancelLabel?: string;
  submitLabel?: string;
  savingLabel?: string;
}) {
  return (
    <div className={["admin-form-actions", className].filter(Boolean).join(" ")}>
      <AdminButton onClick={close}>{cancelLabel}</AdminButton>
      <AdminButton
        className={primaryClassName}
        disabled={saving || disabled}
        onClick={submit}
      >
        {saving ? savingLabel : submitLabel}
      </AdminButton>
    </div>
  );
}
