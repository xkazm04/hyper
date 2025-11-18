# Phase 3: Visual Card Editor

## Objective
Build the visual card editor interface with drag-and-drop element placement, property panels, and card navigation.

## Tasks

### 3.1 Editor Layout Structure

**Editor Page**: `app/editor/[stackId]/page.tsx`

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useStack } from '@/lib/hooks/useStacks'
import { useCards } from '@/lib/hooks/useCards'
import EditorLayout from '@/components/editor/EditorLayout'
import EditorToolbar from '@/components/editor/EditorToolbar'
import CardCanvas from '@/components/editor/CardCanvas'
import CardNavigator from '@/components/editor/CardNavigator'
import PropertyPanel from '@/components/editor/PropertyPanel'
import { EditorProvider } from '@/lib/context/EditorContext'

export default function EditorPage() {
  const params = useParams()
  const stackId = params.stackId as string
  const { stack, loading: stackLoading } = useStack(stackId)
  const { cards, loading: cardsLoading } = useCards(stackId)

  if (stackLoading || cardsLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading editor...</div>
  }

  if (!stack) {
    return <div className="min-h-screen flex items-center justify-center">Stack not found</div>
  }

  return (
    <EditorProvider stackId={stackId} initialCards={cards}>
      <EditorLayout
        toolbar={<EditorToolbar stack={stack} />}
        canvas={<CardCanvas />}
        navigator={<CardNavigator />}
        properties={<PropertyPanel />}
      />
    </EditorProvider>
  )
}
```

### 3.2 Editor Context

**Editor Context**: `lib/context/EditorContext.tsx`

```typescript
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { Card, Element } from '@/lib/types'

interface EditorContextType {
  // Stack & Cards
  stackId: string
  cards: Card[]
  currentCardId: string | null
  currentCard: Card | null
  
  // Elements
  elements: Element[]
  selectedElementId: string | null
  selectedElement: Element | null
  
  // Actions
  setCurrentCard: (cardId: string) => void
  selectElement: (elementId: string | null) => void
  addElement: (element: Element) => void
  updateElement: (elementId: string, updates: Partial<Element>) => void
  deleteElement: (elementId: string) => void
  
  // Mode
  mode: 'select' | 'draw' | 'preview'
  setMode: (mode: 'select' | 'draw' | 'preview') => void
  
  // Draw mode state
  drawingElementType: Element['type'] | null
  setDrawingElementType: (type: Element['type'] | null) => void
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

interface EditorProviderProps {
  children: React.ReactNode
  stackId: string
  initialCards: Card[]
}

export function EditorProvider({ children, stackId, initialCards }: EditorProviderProps) {
  const [cards, setCards] = useState<Card[]>(initialCards)
  const [currentCardId, setCurrentCardId] = useState<string | null>(
    initialCards.length > 0 ? initialCards[0].id : null
  )
  const [elements, setElements] = useState<Element[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [mode, setMode] = useState<'select' | 'draw' | 'preview'>('select')
  const [drawingElementType, setDrawingElementType] = useState<Element['type'] | null>(null)

  const currentCard = cards.find(c => c.id === currentCardId) || null
  const selectedElement = elements.find(e => e.id === selectedElementId) || null

  const setCurrentCard = useCallback((cardId: string) => {
    setCurrentCardId(cardId)
    setSelectedElementId(null)
    // Load elements for this card
    // TODO: Fetch from ElementService
  }, [])

  const selectElement = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId)
  }, [])

  const addElement = useCallback((element: Element) => {
    setElements(prev => [...prev, element])
  }, [])

  const updateElement = useCallback((elementId: string, updates: Partial<Element>) => {
    setElements(prev =>
      prev.map(el => el.id === elementId ? { ...el, ...updates } : el)
    )
  }, [])

  const deleteElement = useCallback((elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId))
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }, [selectedElementId])

  return (
    <EditorContext.Provider
      value={{
        stackId,
        cards,
        currentCardId,
        currentCard,
        elements,
        selectedElementId,
        selectedElement,
        setCurrentCard,
        selectElement,
        addElement,
        updateElement,
        deleteElement,
        mode,
        setMode,
        drawingElementType,
        setDrawingElementType,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export const useEditor = () => {
  const context = useContext(EditorContext)
  if (!context) throw new Error('useEditor must be used within EditorProvider')
  return context
}
```

### 3.3 Editor Layout Component

**Editor Layout**: `components/editor/EditorLayout.tsx`

```typescript
interface EditorLayoutProps {
  toolbar: React.ReactNode
  canvas: React.ReactNode
  navigator: React.ReactNode
  properties: React.ReactNode
}

export default function EditorLayout({
  toolbar,
  canvas,
  navigator,
  properties,
}: EditorLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="h-16 bg-white border-b-2 border-black">
        {toolbar}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Card Navigator - Left Sidebar */}
        <div className="w-64 bg-white border-r-2 border-black overflow-y-auto">
          {navigator}
        </div>

        {/* Canvas - Center */}
        <div className="flex-1 bg-gray-100 overflow-auto p-8">
          {canvas}
        </div>

        {/* Property Panel - Right Sidebar */}
        <div className="w-80 bg-white border-l-2 border-black overflow-y-auto">
          {properties}
        </div>
      </div>
    </div>
  )
}
```

### 3.4 Toolbar Component

**Editor Toolbar**: `components/editor/EditorToolbar.tsx`

```typescript
'use client'

import { useEditor } from '@/lib/context/EditorContext'
import { Button } from '@/components/ui/button'
import { 
  MousePointer2, 
  Square, 
  Type, 
  Image as ImageIcon, 
  TextCursor,
  Circle,
  Play,
  Save,
  ArrowLeft 
} from 'lucide-react'
import Link from 'next/link'
import { Stack } from '@/lib/types'

interface EditorToolbarProps {
  stack: Stack
}

export default function EditorToolbar({ stack }: EditorToolbarProps) {
  const { mode, setMode, drawingElementType, setDrawingElementType } = useEditor()

  const tools = [
    { type: 'select', icon: MousePointer2, label: 'Select' },
    { type: 'button', icon: Square, label: 'Button' },
    { type: 'text', icon: Type, label: 'Text' },
    { type: 'input', icon: TextCursor, label: 'Input' },
    { type: 'image', icon: ImageIcon, label: 'Image' },
    { type: 'shape', icon: Circle, label: 'Shape' },
  ]

  const handleToolClick = (toolType: string) => {
    if (toolType === 'select') {
      setMode('select')
      setDrawingElementType(null)
    } else {
      setMode('draw')
      setDrawingElementType(toolType as Element['type'])
    }
  }

  return (
    <div className="h-full px-4 flex items-center justify-between">
      {/* Left Section - Back & Stack Name */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="border-l-2 border-gray-300 h-8" />
        <h1 className="text-lg font-semibold">{stack.name}</h1>
      </div>

      {/* Center Section - Tools */}
      <div className="flex items-center gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon
          const isActive = 
            (tool.type === 'select' && mode === 'select') ||
            (tool.type !== 'select' && drawingElementType === tool.type)
          
          return (
            <Button
              key={tool.type}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToolClick(tool.type)}
              title={tool.label}
              className="border-2 border-black"
            >
              <Icon className="w-4 h-4" />
            </Button>
          )
        })}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant={mode === 'preview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode(mode === 'preview' ? 'select' : 'preview')}
          className="border-2 border-black"
        >
          <Play className="w-4 h-4 mr-2" />
          {mode === 'preview' ? 'Edit' : 'Preview'}
        </Button>
        <Button size="sm" variant="outline" className="border-2 border-black">
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  )
}
```

### 3.5 Card Navigator

**Card Navigator**: `components/editor/CardNavigator.tsx`

```typescript
'use client'

import { useEditor } from '@/lib/context/EditorContext'
import { Button } from '@/components/ui/button'
import { Plus, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CardNavigator() {
  const { cards, currentCardId, setCurrentCard } = useEditor()

  const handleAddCard = () => {
    // TODO: Implement add card
    console.log('Add card')
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Cards</h3>
        <Button size="sm" variant="outline" onClick={handleAddCard}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => setCurrentCard(card.id)}
            className={cn(
              'w-full text-left p-3 rounded border-2 transition-colors',
              'hover:bg-gray-50 flex items-center gap-2',
              currentCardId === card.id
                ? 'bg-blue-50 border-blue-500'
                : 'border-gray-300'
            )}
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <div className="font-medium text-sm">{card.name}</div>
              <div className="text-xs text-gray-500">Card {index + 1}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

### 3.6 Card Canvas

**Card Canvas**: `components/editor/CardCanvas.tsx`

```typescript
'use client'

import { useRef, useState, useCallback } from 'react'
import { useEditor } from '@/lib/context/EditorContext'
import { Element, ElementPosition } from '@/lib/types'
import CanvasElement from './CanvasElement'
import { v4 as uuidv4 } from 'uuid'

export default function CardCanvas() {
  const { 
    currentCard, 
    elements, 
    mode, 
    drawingElementType,
    addElement,
    selectElement,
  } = useEditor()
  
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null)
  const [drawRect, setDrawRect] = useState<ElementPosition | null>(null)

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'draw' || !drawingElementType) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setDrawStart({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const x = Math.min(drawStart.x, currentX)
    const y = Math.min(drawStart.y, currentY)
    const width = Math.abs(currentX - drawStart.x)
    const height = Math.abs(currentY - drawStart.y)

    setDrawRect({ x, y, width, height })
  }

  const handleMouseUp = () => {
    if (!isDrawing || !drawRect || !drawingElementType || !currentCard) return

    // Create the new element
    const newElement: Element = {
      id: uuidv4(),
      cardId: currentCard.id,
      type: drawingElementType,
      orderIndex: elements.length,
      position: drawRect,
      properties: getDefaultPropertiesForType(drawingElementType),
      script: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    addElement(newElement)
    
    // Reset drawing state
    setIsDrawing(false)
    setDrawStart(null)
    setDrawRect(null)
  }

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No card selected</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center">
      <div
        ref={canvasRef}
        className="relative bg-white border-4 border-black shadow-2xl"
        style={{
          width: '800px',
          height: '600px',
          backgroundColor: currentCard.backgroundColor,
          cursor: mode === 'draw' ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render existing elements */}
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isPreview={mode === 'preview'}
          />
        ))}

        {/* Render drawing rectangle */}
        {isDrawing && drawRect && (
          <div
            className="absolute border-2 border-dashed border-blue-500 bg-blue-100 bg-opacity-20"
            style={{
              left: drawRect.x,
              top: drawRect.y,
              width: drawRect.width,
              height: drawRect.height,
            }}
          />
        )}
      </div>
    </div>
  )
}

function getDefaultPropertiesForType(type: Element['type']) {
  switch (type) {
    case 'button':
      return {
        label: 'Button',
        fontSize: 14,
        backgroundColor: '#E5E5E5',
        color: '#000000',
        borderWidth: 2,
        borderColor: '#000000',
        borderRadius: 4,
      }
    case 'text':
      return {
        content: 'Text',
        fontSize: 14,
        color: '#000000',
        align: 'left',
      }
    case 'input':
      return {
        placeholder: 'Enter text...',
        fontSize: 14,
        borderWidth: 2,
        borderColor: '#000000',
      }
    case 'image':
      return {
        src: '/placeholder-image.png',
        alt: 'Image',
        objectFit: 'contain',
      }
    case 'shape':
      return {
        shape: 'rectangle',
        backgroundColor: '#E5E5E5',
        borderWidth: 2,
        borderColor: '#000000',
      }
    default:
      return {}
  }
}
```

### 3.7 Canvas Element Component

**Canvas Element**: `components/editor/CanvasElement.tsx`

```typescript
'use client'

import { useEditor } from '@/lib/context/EditorContext'
import { Element } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CanvasElementProps {
  element: Element
  isPreview: boolean
}

export default function CanvasElement({ element, isPreview }: CanvasElementProps) {
  const { selectedElementId, selectElement, updateElement } = useEditor()
  const isSelected = selectedElementId === element.id && !isPreview

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.stopPropagation()
      selectElement(element.id)
    }
  }

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
            className={cn(
              'font-semibold transition-colors',
              isPreview && 'cursor-pointer hover:opacity-80'
            )}
            style={{
              ...commonStyles,
              fontSize: buttonProps.fontSize || 14,
              backgroundColor: buttonProps.backgroundColor || '#E5E5E5',
              color: buttonProps.color || '#000000',
              border: `${buttonProps.borderWidth || 2}px solid ${buttonProps.borderColor || '#000000'}`,
              borderRadius: buttonProps.borderRadius || 4,
            }}
            onClick={handleClick}
            disabled={!isPreview}
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
            }}
            onClick={handleClick}
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
            style={{
              ...commonStyles,
              fontSize: inputProps.fontSize || 14,
              border: `${inputProps.borderWidth || 2}px solid ${inputProps.borderColor || '#000000'}`,
              padding: '8px',
            }}
            onClick={handleClick}
            readOnly={!isPreview}
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
            }}
            onClick={handleClick}
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
            }}
            onClick={handleClick}
          />
        )

      default:
        return null
    }
  }

  return (
    <div
      className={cn(
        'group',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      style={commonStyles}
    >
      {renderElement()}
      
      {/* Selection handles */}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full" />
        </>
      )}
    </div>
  )
}
```

### 3.8 Property Panel

**Property Panel**: `components/editor/PropertyPanel.tsx`

```typescript
'use client'

import { useEditor } from '@/lib/context/EditorContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default function PropertyPanel() {
  const { selectedElement, currentCard, updateElement, deleteElement } = useEditor()

  if (!selectedElement && !currentCard) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Select an element or card to edit properties</p>
      </div>
    )
  }

  if (!selectedElement && currentCard) {
    return (
      <div className="p-4">
        <h3 className="font-semibold mb-4">Card Properties</h3>
        <div className="space-y-4">
          <div>
            <Label>Card Name</Label>
            <Input value={currentCard.name} />
          </div>
          <div>
            <Label>Background Color</Label>
            <Input type="color" value={currentCard.backgroundColor} />
          </div>
        </div>
      </div>
    )
  }

  if (!selectedElement) return null

  const handlePropertyChange = (key: string, value: any) => {
    updateElement(selectedElement.id, {
      properties: {
        ...selectedElement.properties,
        [key]: value,
      },
    })
  }

  const handlePositionChange = (key: keyof typeof selectedElement.position, value: number) => {
    updateElement(selectedElement.id, {
      position: {
        ...selectedElement.position,
        [key]: value,
      },
    })
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Element Properties</h3>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => deleteElement(selectedElement.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Position & Size */}
        <div>
          <Label className="text-xs text-gray-500 mb-2 block">Position & Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">X</Label>
              <Input
                type="number"
                value={selectedElement.position.x}
                onChange={(e) => handlePositionChange('x', Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Y</Label>
              <Input
                type="number"
                value={selectedElement.position.y}
                onChange={(e) => handlePositionChange('y', Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                value={selectedElement.position.width}
                onChange={(e) => handlePositionChange('width', Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Height</Label>
              <Input
                type="number"
                value={selectedElement.position.height}
                onChange={(e) => handlePositionChange('height', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Type-specific properties */}
        {selectedElement.type === 'button' && (
          <>
            <div>
              <Label>Label</Label>
              <Input
                value={(selectedElement.properties as any).label || ''}
                onChange={(e) => handlePropertyChange('label', e.target.value)}
              />
            </div>
            <div>
              <Label>Background Color</Label>
              <Input
                type="color"
                value={(selectedElement.properties as any).backgroundColor || '#E5E5E5'}
                onChange={(e) => handlePropertyChange('backgroundColor', e.target.value)}
              />
            </div>
          </>
        )}

        {selectedElement.type === 'text' && (
          <>
            <div>
              <Label>Content</Label>
              <textarea
                className="w-full p-2 border rounded"
                rows={4}
                value={(selectedElement.properties as any).content || ''}
                onChange={(e) => handlePropertyChange('content', e.target.value)}
              />
            </div>
            <div>
              <Label>Font Size</Label>
              <Input
                type="number"
                value={(selectedElement.properties as any).fontSize || 14}
                onChange={(e) => handlePropertyChange('fontSize', Number(e.target.value))}
              />
            </div>
          </>
        )}

        {/* Add more type-specific properties as needed */}
      </div>
    </div>
  )
}
```

### 3.9 Custom Hooks for Cards

**Card Hooks**: `lib/hooks/useCards.ts`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { CardService } from '@/lib/services/cards'
import { Card, CreateCardInput, UpdateCardInput } from '@/lib/types'

export function useCards(stackId: string) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cardService = new CardService()

  useEffect(() => {
    loadCards()
  }, [stackId])

  const loadCards = async () => {
    try {
      setLoading(true)
      const data = await cardService.getCards(stackId)
      setCards(data)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCard = async (input: Omit<CreateCardInput, 'stackId'>) => {
    try {
      const newCard = await cardService.createCard({ ...input, stackId })
      setCards([...cards, newCard])
      return newCard
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateCard = async (id: string, input: UpdateCardInput) => {
    try {
      const updated = await cardService.updateCard(id, input)
      setCards(cards.map(c => c.id === id ? updated : c))
      return updated
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteCard = async (id: string) => {
    try {
      await cardService.deleteCard(id)
      setCards(cards.filter(c => c.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  return {
    cards,
    loading,
    error,
    createCard,
    updateCard,
    deleteCard,
    refresh: loadCards,
  }
}
```

## Deliverables Checklist

- [ ] Editor layout with toolbar, canvas, navigator, and property panel
- [ ] Editor context for managing state
- [ ] Card navigation with visual card list
- [ ] Canvas with drawing mode for adding elements
- [ ] Element rendering on canvas
- [ ] Element selection and highlighting
- [ ] Property panel for editing element properties
- [ ] Drag-to-draw element creation
- [ ] Preview mode toggle

## Testing Checklist

- [ ] User can select different cards from navigator
- [ ] User can draw elements on canvas
- [ ] Elements display with correct properties
- [ ] User can select and edit element properties
- [ ] Property changes update element immediately
- [ ] User can delete elements
- [ ] Preview mode disables editing
- [ ] Canvas dimensions are fixed (800x600)

## Next Phase
Proceed to `04-PHASE-4-SCRIPTING.md` for implementing the scripting engine and interactivity.