import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// System prompt for the script quality assistant
const SCRIPT_ASSISTANT_SYSTEM_PROMPT = `You are a helpful code quality assistant specialized in reviewing JavaScript code for interactive story cards. Your role is to:

1. Identify syntax errors and potential runtime issues
2. Suggest concise refactoring improvements
3. Generate explanatory comments for non-technical users
4. Format code properly

When analyzing code, provide your response in the following JSON format:
{
  "hasErrors": boolean,
  "syntaxErrors": [
    {
      "line": number or null,
      "message": "string",
      "severity": "error" | "warning"
    }
  ],
  "runtimeIssues": [
    {
      "description": "string",
      "suggestion": "string",
      "severity": "error" | "warning"
    }
  ],
  "refactoringSuggestions": [
    {
      "description": "string",
      "codeExample": "string" (optional)
    }
  ],
  "formattedCode": "string" (the properly formatted version of the code),
  "commentedCode": "string" (the code with explanatory comments for non-technical users),
  "summary": "string" (a brief, user-friendly summary of the code quality)
}

Be concise but helpful. Focus on the most important issues first. For non-technical users, use simple language in comments and explanations.`

export async function POST(request: NextRequest) {
  try {
    // Check for demo mode cookie
    const demoMode = request.cookies.get('demoMode')?.value === 'true'

    // Verify authentication (skip for demo mode)
    if (!demoMode) {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { script, action = 'analyze' } = body

    if (!script || typeof script !== 'string') {
      return NextResponse.json(
        { error: 'Script content is required' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === '' || apiKey.includes('placeholder')) {
      return NextResponse.json(
        { error: 'OpenAI API is not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 503 }
      )
    }

    const openai = new OpenAI({ apiKey })

    // Build the user prompt based on the action
    let userPrompt = ''
    switch (action) {
      case 'analyze':
        userPrompt = `Please analyze the following JavaScript code for syntax errors, potential runtime issues, and provide refactoring suggestions. Also provide a formatted version and a version with explanatory comments:\n\n\`\`\`javascript\n${script}\n\`\`\``
        break
      case 'format':
        userPrompt = `Please format the following JavaScript code properly. Focus only on formatting - return the result in the JSON format with emphasis on the "formattedCode" field:\n\n\`\`\`javascript\n${script}\n\`\`\``
        break
      case 'comment':
        userPrompt = `Please add explanatory comments to the following JavaScript code for non-technical users. Focus on explaining what each part does in simple language. Return the result in the JSON format with emphasis on the "commentedCode" field:\n\n\`\`\`javascript\n${script}\n\`\`\``
        break
      default:
        userPrompt = `Please analyze the following JavaScript code:\n\n\`\`\`javascript\n${script}\n\`\`\``
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SCRIPT_ASSISTANT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const analysis = JSON.parse(content)

    return NextResponse.json({ analysis })
  } catch (error: unknown) {
    console.error('Script analysis error:', error)

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze script'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
