import * as React from "react"
import { AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Whether the textarea has an error state */
  error?: boolean
  /** Error message to display (also used for aria-describedby) */
  errorMessage?: string
  /** Whether to show the error icon */
  showErrorIcon?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorMessage, showErrorIcon = true, id, ...props }, ref) => {
    const errorId = errorMessage && id ? `${id}-error` : undefined

    return (
      <div className="relative w-full">
        <textarea
          id={id}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive animate-input-shake pr-10",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          data-testid={id ? `${id}-textarea` : undefined}
          {...props}
        />
        {error && showErrorIcon && (
          <AlertCircle
            className="absolute right-3 top-3 h-5 w-5 text-destructive pointer-events-none"
            aria-hidden="true"
            data-testid={id ? `${id}-error-icon` : "textarea-error-icon"}
          />
        )}
        {error && errorMessage && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-destructive"
            role="alert"
            data-testid={id ? `${id}-error-message` : "textarea-error-message"}
          >
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
