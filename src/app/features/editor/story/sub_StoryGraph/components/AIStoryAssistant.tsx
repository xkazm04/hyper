'use client'

import React, { useState } from 'react'
import { Wand2, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEditor } from '@/contexts/EditorContext'
import { generateStoryStructure } from '../actions'
import { useToast } from '@/lib/context/ToastContext'

export function AIStoryAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [description, setDescription] = useState('')
    const [cardCount, setCardCount] = useState(5)
    const [isGenerating, setIsGenerating] = useState(false)

    const { storyCards, addCard, addChoice } = useEditor()
    const { success, error: showError } = useToast()

    const handleGenerate = async () => {
        if (!description.trim()) return

        setIsGenerating(true)
        try {
            const result = await generateStoryStructure({
                description,
                cardCount,
                currentCards: storyCards.map(c => ({ id: c.id, title: c.title }))
            })

            if (result.success && result.cards && result.choices) {
                // Add new cards
                result.cards.forEach((card: any, index: number) => {
                    addCard({
                        id: card.id,
                        storyStackId: card.storyStackId || '',
                        title: card.title || 'Untitled',
                        content: card.content || '',
                        script: card.script || '',
                        imageUrl: card.imageUrl || null,
                        imagePrompt: card.imagePrompt || null,
                        orderIndex: card.orderIndex ?? index,
                        createdAt: card.createdAt || new Date().toISOString(),
                        updatedAt: card.updatedAt || new Date().toISOString()
                    })
                })

                // Add new choices
                result.choices.forEach((choice: any, index: number) => {
                    addChoice({
                        id: choice.id,
                        storyCardId: choice.storyCardId,
                        targetCardId: choice.targetCardId,
                        label: choice.label,
                        orderIndex: choice.orderIndex ?? index,
                        createdAt: choice.createdAt || new Date().toISOString(),
                        updatedAt: choice.updatedAt || new Date().toISOString()
                    })
                })

                success(`Successfully created ${result.cards.length} cards and ${result.choices.length} connections.`)

                setIsOpen(false)
                setDescription('')
            } else {
                throw new Error(result.error || 'Generation failed')
            }
        } catch (error) {
            console.error('Generation error:', error)
            showError('Could not generate story structure. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="bg-card/95 border-2 border-border rounded-lg shadow-lg backdrop-blur-sm w-[260px] transition-all duration-300 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">AI Story Architect</h3>
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            {isOpen && (
                <div className="p-3 pt-0 space-y-3 border-t border-border">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">
                            Story Idea / Direction
                        </Label>
                        <Textarea
                            placeholder="Describe the plot twist, new location, or character arc..."
                            className="h-20 text-xs bg-background border-input placeholder:text-muted-foreground/50 focus-visible:ring-primary resize-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground">
                            Scenes to Generate
                        </Label>
                        <Input
                            type="number"
                            min={1}
                            max={20}
                            value={cardCount}
                            onChange={(e) => setCardCount(parseInt(e.target.value) || 5)}
                            className="h-8 text-xs bg-background border-input focus-visible:ring-primary"
                        />
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !description.trim()}
                        className="w-full"
                        size="sm"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-3.5 h-3.5 mr-2" />
                                Generate Scenes
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
