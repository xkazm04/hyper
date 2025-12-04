'use client'

import { MessageCircle, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Character {
  id: string
  name: string
}

interface ContentToolbarProps {
  message: string
  speaker: string
  characters: Character[]
  isSaving: boolean
  isGenerating: boolean
  onMessageChange: (value: string) => void
  onMessageBlur: () => void
  onSpeakerChange: (value: string) => void
  onSpeakerBlur: () => void
}

export function ContentToolbar({
  message,
  speaker,
  characters,
  isSaving,
  isGenerating,
  onMessageChange,
  onMessageBlur,
  onSpeakerChange,
  onSpeakerBlur,
}: ContentToolbarProps) {
  const isCustomSpeaker = speaker && speaker !== 'narrator' && !characters.some(c => c.name === speaker)

  return (
    <div className="space-y-4 p-4 rounded-lg border-2 border-dashed border-border bg-muted/20">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <Label className="text-sm font-semibold">Character Message (Optional)</Label>
      </div>
      
      {/* Speaker Selection */}
      <div className="space-y-2">
        <Label htmlFor="card-speaker" className="text-xs text-muted-foreground flex items-center gap-1.5">
          <User className="w-3 h-3" />
          Speaker
        </Label>
        {isCustomSpeaker ? (
          <div className="flex gap-2">
            <Input
              id="card-speaker"
              value={speaker}
              onChange={(e) => onSpeakerChange(e.target.value)}
              onBlur={onSpeakerBlur}
              placeholder="Character name..."
              className="flex-1 bg-card border-2 border-border focus:border-primary halloween-candle-flicker-focus"
              disabled={isSaving || isGenerating}
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onSpeakerChange('')} 
              className="shrink-0"
            >
              Clear
            </Button>
          </div>
        ) : (
          <Select
            value={speaker || 'none'}
            onValueChange={(value) => {
              if (value === 'custom') {
                onSpeakerChange('')
              } else if (value === 'none') {
                onSpeakerChange('')
              } else {
                onSpeakerChange(value)
              }
            }}
            disabled={isSaving || isGenerating}
          >
            <SelectTrigger className="border-2 border-border">
              <SelectValue placeholder="Select speaker..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select speaker...</SelectItem>
              <SelectItem value="narrator">📖 Narrator</SelectItem>
              {characters.map(c => (
                <SelectItem key={c.id} value={c.name}>👤 {c.name}</SelectItem>
              ))}
              <SelectItem value="custom">✏️ Custom...</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Message Text */}
      <div className="space-y-2">
        <Label htmlFor="card-message" className="text-xs text-muted-foreground">Message</Label>
        <Textarea
          id="card-message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onBlur={onMessageBlur}
          placeholder="Enter dialogue or narration that appears on the card..."
          className="min-h-[100px] resize-y bg-card border-2 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)] placeholder:text-muted-foreground/50 halloween-candle-flicker-focus"
          disabled={isSaving || isGenerating}
        />
        <p className="text-xs text-muted-foreground">This message appears as a dialogue bubble on the card preview</p>
      </div>
    </div>
  )
}
