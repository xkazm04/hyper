# AccessibleModal Component

A fully accessible, WCAG-compliant modal/overlay component with focus management, keyboard navigation, ARIA support, and smooth Framer Motion animations.

## Features

### Accessibility (WCAG 2.1 Compliant)

- **Focus Trap**: Automatically traps focus within the modal when open
- **Keyboard Navigation**:
  - `ESC` key to close (configurable)
  - `Tab` / `Shift+Tab` to navigate between focusable elements
  - Focus returns to trigger element on close
- **ARIA Labels**:
  - `aria-labelledby` for title
  - `aria-describedby` for description
  - `aria-modal="true"` for screen readers
- **Screen Reader Support**: Proper semantic HTML and ARIA attributes
- **Focus Indicators**: Visible focus rings for keyboard navigation

### Visual Features

- **Dark Mode Support**: Automatic dark mode styling with proper contrast
- **Framer Motion Animations**: Smooth entrance/exit transitions
- **Backdrop Blur**: Modern glassmorphic backdrop effect
- **Bold Design**: Consistent with app's design language (black borders, hard shadows)
- **Size Variants**: `sm`, `md`, `lg`, `xl`, `full`
- **Responsive**: Mobile-friendly with proper spacing

### Developer Experience

- **TypeScript**: Fully typed with comprehensive type definitions
- **Test IDs**: All interactive elements have `data-testid` attributes
- **Composable**: Modular header, body, footer components
- **Flexible API**: Support for custom content, callbacks, and styling
- **Variants**: Pre-built confirmation modal variant

## Installation

The component is already installed at `src/components/ui/accessible-modal.tsx`.

## Basic Usage

```tsx
import { AccessibleModal } from "@/components/ui/accessible-modal"
import { Button } from "@/components/ui/button"

function MyComponent() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>

      <AccessibleModal
        open={open}
        onOpenChange={setOpen}
        title="Modal Title"
        description="Optional description"
      >
        <p>Modal content goes here</p>
      </AccessibleModal>
    </>
  )
}
```

## API Reference

### AccessibleModal Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | Required | Controls modal visibility |
| `onOpenChange` | `(open: boolean) => void` | Required | Callback when modal should open/close |
| `title` | `string` | Required | Modal title (used for aria-labelledby) |
| `description` | `string` | `undefined` | Optional description (used for aria-describedby) |
| `children` | `ReactNode` | Required | Modal body content |
| `footer` | `ReactNode` | `undefined` | Footer content (typically buttons) |
| `className` | `string` | `undefined` | Custom class for modal content |
| `overlayClassName` | `string` | `undefined` | Custom class for backdrop |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"` | Modal width |
| `showCloseButton` | `boolean` | `true` | Show X button in corner |
| `closeOnEscape` | `boolean` | `true` | Allow ESC key to close |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking backdrop |
| `data-testid` | `string` | `undefined` | Test ID for all child elements |

### Size Variants

- `sm`: `max-w-sm` (~384px)
- `md`: `max-w-md` (~448px)
- `lg`: `max-w-lg` (~512px)
- `xl`: `max-w-xl` (~576px)
- `full`: `max-w-full` with 1rem margin

## Examples

### Modal with Footer Actions

```tsx
<AccessibleModal
  open={open}
  onOpenChange={setOpen}
  title="Edit Settings"
  description="Configure your preferences"
  footer={
    <>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSave}>
        Save Changes
      </Button>
    </>
  }
  data-testid="settings-modal"
>
  <div>
    {/* Form content */}
  </div>
</AccessibleModal>
```

### Confirmation Modal

```tsx
import { ConfirmationModal } from "@/components/ui/accessible-modal"

<ConfirmationModal
  open={open}
  onOpenChange={setOpen}
  title="Confirm Deletion"
  description="This action cannot be undone"
  message="Are you sure you want to delete this item?"
  confirmText="Delete"
  cancelText="Cancel"
  confirmVariant="destructive"
  onConfirm={handleDelete}
  data-testid="delete-modal"
/>
```

### Modal Without Close Options (Force Acknowledgment)

```tsx
<AccessibleModal
  open={open}
  onOpenChange={setOpen}
  title="Important Notice"
  showCloseButton={false}
  closeOnEscape={false}
  closeOnOverlayClick={false}
  footer={
    <Button onClick={() => setOpen(false)}>
      I Understand
    </Button>
  }
>
  <p>Please read this important message...</p>
</AccessibleModal>
```

### AI Script Generator Modal (Editor Use Case)

```tsx
<AccessibleModal
  open={open}
  onOpenChange={setOpen}
  title="AI Script Generator"
  description="Describe what you want the script to do"
  size="lg"
  footer={
    <>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleGenerate} disabled={!prompt}>
        Generate Script
      </Button>
    </>
  }
  data-testid="ai-script-modal"
>
  <textarea
    className="w-full px-3 py-2 border-2 border-black rounded-md"
    placeholder="Describe your script..."
    data-testid="ai-prompt-input"
  />
</AccessibleModal>
```

## Testing

All interactive elements have `data-testid` attributes for automated testing:

```tsx
// Main modal
data-testid="accessible-modal" // or custom testid
data-testid="modal-overlay"
data-testid="modal-title"
data-testid="modal-description"
data-testid="modal-body"
data-testid="modal-footer"
data-testid="modal-close-btn"

// With custom testid
data-testid="my-modal"
data-testid="my-modal-overlay"
data-testid="my-modal-title"
data-testid="my-modal-description"
data-testid="my-modal-body"
data-testid="my-modal-footer"
data-testid="my-modal-close-btn"
```

## Migration from Old Dialog

The old `Dialog` component (Radix primitives) is still available. To migrate:

### Before (Radix Dialog)

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div>Content</div>
  </DialogContent>
</Dialog>
```

### After (AccessibleModal)

```tsx
import { AccessibleModal } from "@/components/ui/dialog"
// or
import { AccessibleModal } from "@/components/ui/accessible-modal"

<AccessibleModal
  open={open}
  onOpenChange={setOpen}
  title="Title"
  description="Description"
>
  <div>Content</div>
</AccessibleModal>
```

## Accessibility Checklist

When using the modal, ensure:

- [ ] Modal has a descriptive `title`
- [ ] Add `description` if the title alone isn't clear
- [ ] Footer buttons are in logical order (Cancel, then Confirm)
- [ ] Destructive actions use `confirmVariant="destructive"`
- [ ] Test with keyboard only (Tab, Shift+Tab, ESC)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify focus returns to trigger element on close
- [ ] Check color contrast in both light and dark modes

## Performance Considerations

- Uses `AnimatePresence` with `mode="wait"` to prevent layout shift
- Animations are GPU-accelerated via Framer Motion
- Focus trap only activates when modal is open
- Radix UI handles portal rendering efficiently

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14.1+
- All modern mobile browsers

## Related Components

- `Dialog` - Original Radix UI primitives (still available)
- `Button` - Used in footer actions
- `Input`, `Textarea` - Common form elements in modals

## Troubleshooting

### Modal doesn't close on ESC
Ensure `closeOnEscape={true}` (default) and that no child element is preventing the event.

### Focus not trapped
Radix UI handles this automatically. Check that you're not using `asChild` incorrectly or interfering with focus events.

### Animations not working
Verify `framer-motion` is installed: `npm install framer-motion`

### Dark mode styles not applying
Check that your Tailwind config has `darkMode: 'class'` enabled.

## License

Part of the Hyper project.
