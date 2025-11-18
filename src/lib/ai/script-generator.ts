const SCRIPT_GENERATION_SYSTEM_PROMPT = `You are an expert HyperCard script generator. Generate JavaScript code for HyperCard-style interactive elements.

Available API functions:
- goToNextCard() - Navigate to next card
- goToPrevCard() - Navigate to previous card
- goToCard(cardId) - Navigate to specific card
- updateElement(elementId, updates) - Update element properties
- showMessage(message) - Show alert dialog
- setVariable(key, value) - Store a variable
- getVariable(key) - Retrieve a variable
- hideElement(elementId) - Hide an element
- showElement(elementId) - Show an element
- playSound(url) - Play audio file

Generate clean, working JavaScript code without explanations unless requested.
Do not include markdown code blocks or formatting - just raw JavaScript code.`

export async function generateScript(description: string): Promise<string> {
  const response = await fetch('/api/ai/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Generate a HyperCard script for the following description:\n\n${description}`,
      systemPrompt: SCRIPT_GENERATION_SYSTEM_PROMPT,
      maxTokens: 512,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate script')
  }

  const data = await response.json()
  // Clean up potential markdown formatting
  let code = data.completion.trim()
  code = code.replace(/```javascript\n?/g, '').replace(/```js\n?/g, '').replace(/```\n?/g, '')
  return code
}

export async function explainScript(script: string): Promise<string> {
  const response = await fetch('/api/ai/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Explain what this HyperCard script does in simple terms:\n\n${script}`,
      systemPrompt: 'You are a helpful programming tutor. Explain code clearly and concisely.',
      maxTokens: 256,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to explain script')
  }

  const data = await response.json()
  return data.completion
}

export async function improveScript(script: string, goal: string): Promise<string> {
  const response = await fetch('/api/ai/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Improve this HyperCard script to ${goal}:\n\n${script}\n\nProvide only the improved code without explanations.`,
      systemPrompt: SCRIPT_GENERATION_SYSTEM_PROMPT,
      maxTokens: 512,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to improve script')
  }

  const data = await response.json()
  // Clean up potential markdown formatting
  let code = data.completion.trim()
  code = code.replace(/```javascript\n?/g, '').replace(/```js\n?/g, '').replace(/```\n?/g, '')
  return code
}
