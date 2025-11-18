"use client"

import * as React from "react"
import { AccessibleModal, ConfirmationModal } from "./accessible-modal"
import { Button } from "./button"

/**
 * Example usage components for AccessibleModal
 * These demonstrate the various ways to use the modal component
 */

// Basic Modal Example
export const BasicModalExample: React.FC = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="open-basic-modal-btn">
        Open Basic Modal
      </Button>

      <AccessibleModal
        open={open}
        onOpenChange={setOpen}
        title="Welcome"
        description="This is a basic accessible modal example"
        data-testid="basic-modal"
      >
        <p className="text-gray-700 dark:text-gray-300">
          This modal demonstrates the basic usage with a title, description, and content.
        </p>
      </AccessibleModal>
    </>
  )
}

// Modal with Footer Actions
export const ModalWithFooterExample: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const [result, setResult] = React.useState<string>("")

  const handleSave = () => {
    setResult("Changes saved!")
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="open-footer-modal-btn">
        Open Modal with Footer
      </Button>

      {result && <p className="mt-2 text-green-600">{result}</p>}

      <AccessibleModal
        open={open}
        onOpenChange={setOpen}
        title="Edit Settings"
        description="Configure your preferences"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="cancel-settings-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              data-testid="save-settings-btn"
            >
              Save Changes
            </Button>
          </>
        }
        data-testid="settings-modal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Setting 1
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border-2 border-black rounded-md"
              placeholder="Enter value"
              data-testid="setting-1-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Setting 2
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border-2 border-black rounded-md"
              placeholder="Enter value"
              data-testid="setting-2-input"
            />
          </div>
        </div>
      </AccessibleModal>
    </>
  )
}

// Confirmation Modal Example
export const ConfirmationModalExample: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState(false)

  const handleConfirm = () => {
    setConfirmed(true)
    setTimeout(() => setConfirmed(false), 3000)
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        data-testid="open-delete-modal-btn"
      >
        Delete Item
      </Button>

      {confirmed && (
        <p className="mt-2 text-green-600">Item deleted successfully!</p>
      )}

      <ConfirmationModal
        open={open}
        onOpenChange={setOpen}
        title="Confirm Deletion"
        description="This action cannot be undone"
        message="Are you sure you want to delete this item? All associated data will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
        onConfirm={handleConfirm}
        data-testid="delete-confirmation-modal"
      />
    </>
  )
}

// Modal without Close Button
export const ModalWithoutCloseButtonExample: React.FC = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="open-no-close-modal-btn">
        Open Modal (No Close Button)
      </Button>

      <AccessibleModal
        open={open}
        onOpenChange={setOpen}
        title="Important Notice"
        description="Please read carefully"
        showCloseButton={false}
        closeOnEscape={false}
        closeOnOverlayClick={false}
        footer={
          <Button onClick={() => setOpen(false)} data-testid="acknowledge-btn">
            I Understand
          </Button>
        }
        data-testid="important-notice-modal"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            This modal requires explicit acknowledgment. You cannot close it by
            clicking outside or pressing Escape.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>No close button in the corner</li>
            <li>Escape key is disabled</li>
            <li>Clicking outside won't close it</li>
            <li>You must click the button below</li>
          </ul>
        </div>
      </AccessibleModal>
    </>
  )
}

// Large Modal with Scrollable Content
export const LargeModalExample: React.FC = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="open-large-modal-btn">
        Open Large Modal
      </Button>

      <AccessibleModal
        open={open}
        onOpenChange={setOpen}
        title="Terms of Service"
        description="Please read our terms and conditions"
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} data-testid="decline-tos-btn">
              Decline
            </Button>
            <Button onClick={() => setOpen(false)} data-testid="accept-tos-btn">
              Accept
            </Button>
          </>
        }
        data-testid="tos-modal"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <h3 className="font-semibold mb-2">Section {i + 1}</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          ))}
        </div>
      </AccessibleModal>
    </>
  )
}

// AI Script Dialog Example (Editor-specific use case)
export const AIScriptDialogExample: React.FC = () => {
  const [open, setOpen] = React.useState(false)
  const [prompt, setPrompt] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    setOpen(false)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} data-testid="open-ai-script-modal-btn">
        Generate AI Script
      </Button>

      <AccessibleModal
        open={open}
        onOpenChange={setOpen}
        title="AI Script Generator"
        description="Describe what you want the script to do"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isGenerating}
              data-testid="cancel-ai-script-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
              data-testid="generate-ai-script-btn"
            >
              {isGenerating ? "Generating..." : "Generate Script"}
            </Button>
          </>
        }
        data-testid="ai-script-modal"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="ai-prompt"
              className="block text-sm font-medium mb-2"
            >
              What should this card do?
            </label>
            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded-md min-h-[150px] resize-y"
              placeholder="E.g., Display a random quote from a list and change it when the user clicks a button"
              disabled={isGenerating}
              data-testid="ai-prompt-input"
            />
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Tip:</strong> Be specific about the behavior, data sources,
              and user interactions you want.
            </p>
          </div>
        </div>
      </AccessibleModal>
    </>
  )
}

// Demo Page Component
export const AccessibleModalDemos: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">AccessibleModal Examples</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Interactive examples demonstrating the various use cases for the
          AccessibleModal component.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Basic Modal</h2>
          <BasicModalExample />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Modal with Footer</h2>
          <ModalWithFooterExample />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Confirmation Modal</h2>
          <ConfirmationModalExample />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">No Close Button</h2>
          <ModalWithoutCloseButtonExample />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Large Modal</h2>
          <LargeModalExample />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">AI Script Dialog</h2>
          <AIScriptDialogExample />
        </div>
      </div>
    </div>
  )
}
