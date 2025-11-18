# Phase 4: Scripting Engine & Interactivity

## Objective
Implement the scripting engine that allows elements and cards to have interactive behaviors through JavaScript code. Build the script editor and execution runtime.

## Tasks

### 4.1 Script Engine Core

**Script Runtime**: `lib/scripting/runtime.ts`

```typescript
import { Element, Card } from '@/lib/types'

export interface ScriptContext {
  // Navigation
  goToCard: (cardId: string) => void
  goToNextCard: () => void
  goToPrevCard: () => void
  
  // Element manipulation
  getElement: (elementId: string) => Element | null
  updateElement: (elementId: string, updates: Partial<Element>) => void
  hideElement: (elementId: string) => void
  showElement: (elementId: string) => void
  
  // Variables
  setVariable: (key: string, value: any) => void
  getVariable: (key: string) => any
  
  // UI
  showMessage: (message: string) => void
  playSound: (url: string) => void
  
  // Current context
  currentCard: Card | null
  currentElement: Element | null
  
  // Event data
  event?: any
}

export class ScriptEngine {
  private variables: Map<string, any> = new Map()
  private context: ScriptContext

  constructor(context: Partial<ScriptContext>) {
    this.context = {
      goToCard: context.goToCard || (() => {}),
      goToNextCard: context.goToNextCard || (() => {}),
      goToPrevCard: context.goToPrevCard || (() => {}),
      getElement: context.getElement || (() => null),
      updateElement: context.updateElement || (() => {}),
      hideElement: context.hideElement || (() => {}),
      showElement: context.showElement || (() => {}),
      setVariable: this.setVariable.bind(this),
      getVariable: this.getVariable.bind(this),
      showMessage: context.showMessage || ((msg) => alert(msg)),
      playSound: context.playSound || (() => {}),
      currentCard: context.currentCard || null,
      currentElement: context.currentElement || null,
      event: context.event,
    }
  }

  setVariable(key: string, value: any) {
    this.variables.set(key, value)
  }

  getVariable(key: string): any {
    return this.variables.get(key)
  }

  async executeScript(script: string, element?: Element): Promise<void> {
    if (!script || script.trim() === '') return

    try {
      // Create a sandboxed function
      const scriptFunction = new Function(
        'context',
        'element',
        `
        with (context) {
          ${script}
        }
        `
      )

      // Execute the script
      await scriptFunction(this.context, element)
    } catch (error) {
      console.error('Script execution error:', error)
      throw error
    }
  }

  // Helper methods for common script operations
  async onElementClick(element: Element): Promise<void> {
    if (element.script) {
      this.context.currentElement = element
      await this.executeScript(element.script, element)
    }
  }

  async onCardLoad(card: Card): Promise<void> {
    if (card.script) {
      this.context.currentCard = card
      await this.executeScript(card.script)
    }
  }
}

// Built-in script templates
export const SCRIPT_TEMPLATES = {
  goToNextCard: `goToNextCard()`,
  
  goToPreviousCard: `goToPrevCard()`,
  
  goToSpecificCard: `goToCard('CARD_ID')`,
  
  showMessage: `showMessage('Hello from HyperCard!')`,
  
  updateElementText: `updateElement('ELEMENT_ID', {
  properties: {
    ...getElement('ELEMENT_ID').properties,
    content: 'New text'
  }
})`,
  
  toggleVisibility: `const el = getElement('ELEMENT_ID')
if (el) {
  if (el.properties.visible !== false) {
    hideElement('ELEMENT_ID')
  } else {
    showElement('ELEMENT_ID')
  }
}`,
  
  counter: `let count = getVariable('counter') || 0
count++
setVariable('counter', count)
showMessage('Count: ' + count)`,
  
  quiz: `const answer = prompt('What is 2 + 2?')
if (answer === '4') {
  showMessage('Correct!')
  goToNextCard()
} else {
  showMessage('Try again!')
}`,
  
  playAudio: `playSound('/sounds/click.mp3')`,
}

export const SCRIPT_CATEGORIES = {
  'Navigation': [
    { name: 'Go to Next Card', template: SCRIPT_TEMPLATES.goToNextCard },
    { name: 'Go to Previous Card', template: SCRIPT_TEMPLATES.goToPreviousCard },
    { name: 'Go to Specific Card', template: SCRIPT_TEMPLATES.goToSpecificCard },
  ],
  'UI Interactions': [
    { name: 'Show Message', template: SCRIPT_TEMPLATES.showMessage },
    { name: 'Update Element', template: SCRIPT_TEMPLATES.updateElementText },
    { name: 'Toggle Visibility', template: SCRIPT_TEMPLATES.toggleVisibility },
  ],
  'Variables & Logic': [
    { name: 'Counter', template: SCRIPT_TEMPLATES.counter },
    { name: 'Quiz Question', template: SCRIPT_TEMPLATES.quiz },
  ],
  'Media': [
    { name: 'Play Sound', template: SCRIPT_TEMPLATES.playAudio },
  ],
}
```

### 4.2 Script Editor Component

**Script Editor**: `components/editor/ScriptEditor.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SCRIPT_CATEGORIES } from '@/lib/scripting/runtime'
import { Code, Play, Save, X } from 'lucide-react'

interface ScriptEditorProps {
  script: string | null
  onSave: (script: string) => void
  onClose: () => void
  elementName?: string
}

export default function ScriptEditor({ 
  script, 
  onSave, 
  onClose, 
  elementName 
}: ScriptEditorProps) {
  const [code, setCode] = useState(script || '')
  const [activeTab, setActiveTab] = useState<'editor' | 'templates'>('editor')

  const handleSave = () => {
    onSave(code)
    onClose()
  }

  const handleInsertTemplate = (template: string) => {
    setCode(code + '\n' + template)
    setActiveTab('editor')
  }

  const handleTest = () => {
    try {
      new Function(code)
      alert('Script syntax is valid!')
    } catch (error: any) {
      alert('Syntax error: ' + error.message)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Script Editor {elementName && `- ${elementName}`}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="editor">
              <Code className="w-4 h-4 mr-2" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="templates">
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 flex flex-col gap-2">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 font-mono text-sm p-4 border-2 border-gray-300 rounded resize-none focus:outline-none focus:border-blue-500"
              placeholder="// Write your script here
// Available functions:
// - goToCard(cardId)
// - goToNextCard()
// - goToPrevCard()
// - updateElement(elementId, updates)
// - showMessage(message)
// - setVariable(key, value)
// - getVariable(key)"
              spellCheck={false}
            />

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Press Ctrl/Cmd + S to save
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTest} size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Test Syntax
                </Button>
                <Button variant="outline" onClick={onClose} size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save Script
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {Object.entries(SCRIPT_CATEGORIES).map(([category, templates]) => (
                <div key={category}>
                  <h3 className="font-semibold mb-2">{category}</h3>
                  <div className="space-y-2">
                    {templates.map((template, index) => (
                      <div
                        key={index}
                        className="p-3 border-2 border-gray-200 rounded hover:border-blue-500 cursor-pointer transition-colors"
                        onClick={() => handleInsertTemplate(template.template)}
                      >
                        <div className="font-medium text-sm mb-1">{template.name}</div>
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {template.template}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
```

### 4.3 Update Property Panel with Script Button

**Update PropertyPanel.tsx** to include script editing:

```typescript
// Add this to the PropertyPanel component after the element properties

{/* Script Section */}
<div className="border-t-2 pt-4 mt-4">
  <div className="flex items-center justify-between mb-2">
    <Label>Script</Label>
    <Button
      size="sm"
      variant="outline"
      onClick={() => setShowScriptEditor(true)}
    >
      <Code className="w-4 h-4 mr-2" />
      {selectedElement.script ? 'Edit Script' : 'Add Script'}
    </Button>
  </div>
  {selectedElement.script && (
    <div className="text-xs bg-gray-50 p-2 rounded font-mono overflow-x-auto">
      {selectedElement.script.substring(0, 100)}
      {selectedElement.script.length > 100 && '...'}
    </div>
  )}
</div>

{/* Script Editor Dialog */}
{showScriptEditor && (
  <ScriptEditor
    script={selectedElement.script}
    elementName={`${selectedElement.type} element`}
    onSave={(script) => {
      updateElement(selectedElement.id, { script })
      setShowScriptEditor(false)
    }}
    onClose={() => setShowScriptEditor(false)}
  />
)}
```

### 4.4 Runtime Preview Component

**Runtime Canvas**: `components/runtime/RuntimeCanvas.tsx`

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { Card, Element } from '@/lib/types'
import { ScriptEngine } from '@/lib/scripting/runtime'
import RuntimeElement from './RuntimeElement'

interface RuntimeCanvasProps {
  card: Card
  elements: Element[]
  onNavigate: (direction: 'next' | 'prev' | string) => void
  onElementUpdate: (elementId: string, updates: Partial<Element>) => void
}

export default function RuntimeCanvas({ 
  card, 
  elements, 
  onNavigate,
  onElementUpdate 
}: RuntimeCanvasProps) {
  const scriptEngineRef = useRef<ScriptEngine | null>(null)

  useEffect(() => {
    // Initialize script engine
    scriptEngineRef.current = new ScriptEngine({
      currentCard: card,
      goToCard: (cardId) => onNavigate(cardId),
      goToNextCard: () => onNavigate('next'),
      goToPrevCard: () => onNavigate('prev'),
      getElement: (elementId) => elements.find(e => e.id === elementId) || null,
      updateElement: onElementUpdate,
      hideElement: (elementId) => {
        onElementUpdate(elementId, {
          properties: { 
            ...elements.find(e => e.id === elementId)?.properties,
            visible: false 
          }
        })
      },
      showElement: (elementId) => {
        onElementUpdate(elementId, {
          properties: { 
            ...elements.find(e => e.id === elementId)?.properties,
            visible: true 
          }
        })
      },
      showMessage: (message) => alert(message),
      playSound: (url) => {
        const audio = new Audio(url)
        audio.play().catch(console.error)
      },
    })

    // Execute card's onLoad script
    if (card.script && scriptEngineRef.current) {
      scriptEngineRef.current.onCardLoad(card).catch(console.error)
    }
  }, [card.id])

  const handleElementClick = async (element: Element) => {
    if (scriptEngineRef.current && element.script) {
      try {
        await scriptEngineRef.current.onElementClick(element)
      } catch (error) {
        console.error('Script execution error:', error)
      }
    }
  }

  return (
    <div
      className="relative bg-white border-4 border-black shadow-2xl"
      style={{
        width: '800px',
        height: '600px',
        backgroundColor: card.backgroundColor,
      }}
    >
      {elements
        .filter(el => (el.properties as any).visible !== false)
        .map((element) => (
          <RuntimeElement
            key={element.id}
            element={element}
            onClick={() => handleElementClick(element)}
          />
        ))}
    </div>
  )
}
```

**Runtime Element**: `components/runtime/RuntimeElement.tsx`

```typescript
'use client'

import { Element } from '@/lib/types'
import { useState } from 'react'

interface RuntimeElementProps {
  element: Element
  onClick: () => void
}

export default function RuntimeElement({ element, onClick }: RuntimeElementProps) {
  const [inputValue, setInputValue] = useState('')

  const commonStyles = {
    position: 'absolute' as const,
    left: element.position.x,
    top: element.position.y,
    width: element.position.width,
    height: element.position.height,
  }

  const renderElement = () => {
    switch (element.type) {
      case 'button':
        const buttonProps = element.properties as any
        return (
          <button
            className="font-semibold transition-colors cursor-pointer hover:opacity-80"
            style={{
              ...commonStyles,
              fontSize: buttonProps.fontSize || 14,
              backgroundColor: buttonProps.backgroundColor || '#E5E5E5',
              color: buttonProps.color || '#000000',
              border: `${buttonProps.borderWidth || 2}px solid ${buttonProps.borderColor || '#000000'}`,
              borderRadius: buttonProps.borderRadius || 4,
            }}
            onClick={onClick}
          >
            {buttonProps.label || 'Button'}
          </button>
        )

      case 'text':
        const textProps = element.properties as any
        return (
          <div
            style={{
              ...commonStyles,
              fontSize: textProps.fontSize || 14,
              color: textProps.color || '#000000',
              textAlign: textProps.align || 'left',
              fontWeight: textProps.bold ? 'bold' : 'normal',
              fontStyle: textProps.italic ? 'italic' : 'normal',
              whiteSpace: 'pre-wrap',
              pointerEvents: 'none',
            }}
          >
            {textProps.content || 'Text'}
          </div>
        )

      case 'input':
        const inputProps = element.properties as any
        return (
          <input
            type={inputProps.type || 'text'}
            placeholder={inputProps.placeholder || 'Enter text...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{
              ...commonStyles,
              fontSize: inputProps.fontSize || 14,
              border: `${inputProps.borderWidth || 2}px solid ${inputProps.borderColor || '#000000'}`,
              padding: '8px',
            }}
          />
        )

      case 'image':
        const imageProps = element.properties as any
        return (
          <img
            src={imageProps.src || '/placeholder-image.png'}
            alt={imageProps.alt || 'Image'}
            style={{
              ...commonStyles,
              objectFit: imageProps.objectFit || 'contain',
              pointerEvents: 'none',
            }}
          />
        )

      case 'shape':
        const shapeProps = element.properties as any
        const isCircle = shapeProps.shape === 'circle'
        return (
          <div
            style={{
              ...commonStyles,
              backgroundColor: shapeProps.backgroundColor || '#E5E5E5',
              border: `${shapeProps.borderWidth || 2}px solid ${shapeProps.borderColor || '#000000'}`,
              borderRadius: isCircle ? '50%' : shapeProps.borderRadius || 0,
              pointerEvents: 'none',
            }}
          />
        )

      default:
        return null
    }
  }

  return <>{renderElement()}</>
}
```

### 4.5 Update Editor Toolbar for Preview Mode

**Update EditorToolbar.tsx** to properly handle preview mode:

```typescript
// In the preview button section, update to use the runtime canvas
<Button
  variant={mode === 'preview' ? 'default' : 'outline'}
  size="sm"
  onClick={() => setMode(mode === 'preview' ? 'select' : 'preview')}
  className="border-2 border-black"
>
  <Play className="w-4 h-4 mr-2" />
  {mode === 'preview' ? 'Edit Mode' : 'Preview Mode'}
</Button>
```

### 4.6 Update Canvas to Support Preview Mode

**Update CardCanvas.tsx** to show runtime canvas in preview mode:

```typescript
import RuntimeCanvas from '@/components/runtime/RuntimeCanvas'

// Inside the component, add:
if (mode === 'preview' && currentCard) {
  return (
    <div className="flex items-center justify-center">
      <RuntimeCanvas
        card={currentCard}
        elements={elements}
        onNavigate={(direction) => {
          if (direction === 'next') {
            // Navigate to next card
            const currentIndex = cards.findIndex(c => c.id === currentCardId)
            if (currentIndex < cards.length - 1) {
              setCurrentCard(cards[currentIndex + 1].id)
            }
          } else if (direction === 'prev') {
            // Navigate to previous card
            const currentIndex = cards.findIndex(c => c.id === currentCardId)
            if (currentIndex > 0) {
              setCurrentCard(cards[currentIndex - 1].id)
            }
          } else {
            // Navigate to specific card by ID
            setCurrentCard(direction)
          }
        }}
        onElementUpdate={(elementId, updates) => {
          updateElement(elementId, updates)
        }}
      />
    </div>
  )
}
```

### 4.7 Add Script Documentation

**Script Documentation**: `components/editor/ScriptDocumentation.tsx`

```typescript
export default function ScriptDocumentation() {
  return (
    <div className="prose prose-sm max-w-none">
      <h3>Available Functions</h3>
      
      <h4>Navigation</h4>
      <ul>
        <li><code>goToNextCard()</code> - Navigate to the next card</li>
        <li><code>goToPrevCard()</code> - Navigate to the previous card</li>
        <li><code>goToCard(cardId)</code> - Navigate to a specific card by ID</li>
      </ul>

      <h4>Element Manipulation</h4>
      <ul>
        <li><code>getElement(elementId)</code> - Get an element by ID</li>
        <li><code>updateElement(elementId, updates)</code> - Update element properties</li>
        <li><code>hideElement(elementId)</code> - Hide an element</li>
        <li><code>showElement(elementId)</code> - Show a hidden element</li>
      </ul>

      <h4>Variables</h4>
      <ul>
        <li><code>setVariable(key, value)</code> - Store a value</li>
        <li><code>getVariable(key)</code> - Retrieve a stored value</li>
      </ul>

      <h4>User Interface</h4>
      <ul>
        <li><code>showMessage(message)</code> - Display a message to the user</li>
        <li><code>playSound(url)</code> - Play an audio file</li>
      </ul>

      <h3>Examples</h3>
      
      <h4>Simple Navigation</h4>
      <pre><code>{`// Go to next card when clicked
goToNextCard()`}</code></pre>

      <h4>Counter</h4>
      <pre><code>{`// Increment a counter
let count = getVariable('clicks') || 0
count++
setVariable('clicks', count)
showMessage('Clicked ' + count + ' times')`}</code></pre>

      <h4>Conditional Logic</h4>
      <pre><code>{`// Quiz with feedback
const answer = prompt('What is 2 + 2?')
if (answer === '4') {
  showMessage('Correct!')
  goToNextCard()
} else {
  showMessage('Try again!')
}`}</code></pre>
    </div>
  )
}
```

## Deliverables Checklist

- [ ] Script engine with execution context
- [ ] Script editor component with syntax highlighting
- [ ] Template library for common scripts
- [ ] Runtime canvas for executing scripts
- [ ] Element click handlers in preview mode
- [ ] Card onLoad script execution
- [ ] Navigation functions (next, prev, specific card)
- [ ] Variable storage system
- [ ] Element manipulation functions
- [ ] Script documentation

## Testing Checklist

- [ ] Button elements execute onClick scripts
- [ ] Card scripts execute on load
- [ ] Navigation functions work correctly
- [ ] Variables persist across script executions
- [ ] Element updates reflect immediately
- [ ] Error handling shows meaningful messages
- [ ] Template insertion works
- [ ] Preview mode executes all scripts
- [ ] Edit mode disables script execution

## Next Phase
Proceed to `05-PHASE-5-AI-INTEGRATION.md` for integrating Kiro/Claude AI assistance.