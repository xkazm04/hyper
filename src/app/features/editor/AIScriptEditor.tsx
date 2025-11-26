'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateScript, explainScript, improveScript } from '@/lib/ai/script-generator'
import { Code, Sparkles, MessageSquare, Wand2, Loader2 } from 'lucide-react'

interface AIScriptEditorProps {
  script: string | null
  onSave: (script: string) => void
  onClose: () => void
  elementName?: string
}

export default function AIScriptEditor({ 
  script, 
  onSave, 
  onClose, 
  elementName 
}: AIScriptEditorProps) {
  const [code, setCode] = useState(script || '')
  const [aiPrompt, setAiPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [activeTab, setActiveTab] = useState<'ai' | 'editor' | 'explain'>('ai')

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return

    setLoading(true)
    try {
      const generatedCode = await generateScript(aiPrompt)
      setCode(generatedCode)
      setActiveTab('editor')
    } catch (error) {
      alert('Failed to generate script. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExplain = async () => {
    if (!code.trim()) return

    setLoading(true)
    try {
      const explanationText = await explainScript(code)
      setExplanation(explanationText)
      setActiveTab('explain')
    } catch (error) {
      alert('Failed to explain script. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleImprove = async () => {
    if (!code.trim()) return

    const goal = prompt('What would you like to improve?', 'make it more efficient')
    if (!goal) return

    setLoading(true)
    try {
      const improved = await improveScript(code, goal)
      setCode(improved)
    } catch (error) {
      alert('Failed to improve script. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    onSave(code)
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            AI Script Editor {elementName && `- ${elementName}`}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList>
            <TabsTrigger value="ai">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="editor">
              <Code className="w-4 h-4 mr-2" />
              Code Editor
            </TabsTrigger>
            <TabsTrigger value="explain">
              <MessageSquare className="w-4 h-4 mr-2" />
              Explain
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="flex-1 flex flex-col gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Describe what you want the script to do:
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded resize-none focus:outline-none focus:border-blue-500"
                  rows={4}
                  placeholder="Example: When clicked, show a message asking for the user's name, then navigate to the next card"
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={loading || !aiPrompt.trim()}
                className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>

              {code && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Generated Code Preview:</div>
                  <pre className="text-xs bg-gray-50 p-3 rounded border-2 border-gray-200 overflow-x-auto font-mono max-h-40 overflow-y-auto">
                    {code}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="editor" className="flex-1 flex flex-col gap-2">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 font-mono text-sm p-4 border-2 border-gray-300 rounded resize-none focus:outline-none focus:border-blue-500"
              placeholder="// Write or edit your script here"
              spellCheck={false}
            />

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExplain} disabled={loading || !code.trim()} size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Explain Code
              </Button>
              <Button variant="outline" onClick={handleImprove} disabled={loading || !code.trim()} size="sm">
                <Wand2 className="w-4 h-4 mr-2" />
                Improve
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="explain" className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : explanation ? (
              <div className="prose prose-sm max-w-none p-4 bg-gray-50 rounded border-2 border-gray-200">
                <p>{explanation}</p>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Click "Explain Code" to understand what your script does
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!code.trim()}
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            Save Script
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
