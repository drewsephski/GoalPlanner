import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

// Initialize provider once (singleton pattern)
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const runtime = 'edge';

// System prompt extracted for reusability and clarity
const SYSTEM_PROMPT = `You are a helpful planning assistant. Given a user's goal, generate a comprehensive, actionable, and inspiring plan to help them accomplish it.

Please structure your response in Markdown format with the following sections:

## Overview
Provide a brief, encouraging overview of the goal and what achieving it will mean.

## Action Steps
Create a numbered list of 5-8 clear, actionable steps. For each step:
- Use bold for the step title
- Add a brief explanation of what to do
- Include specific, actionable details
- Add tips or resources when relevant

## Timeline
Provide an estimated timeline for completing these steps (e.g., "2-3 weeks", "1-2 months").

## Tips for Success
Add 3-5 bullet points with helpful tips, common pitfalls to avoid, and motivational advice.

Make the response engaging, practical, and formatted beautifully with proper Markdown syntax.`;

// Validate request body type safely
interface GoalRequest {
  goal: string;
}

export async function POST(req: Request): Promise<Response> {
  try {
    // Validate content-type and parse JSON
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body: GoalRequest = await req.json();

    // Comprehensive input validation
    if (!body?.goal) {
      return new Response(
        JSON.stringify({ error: 'Goal is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (typeof body.goal !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Goal must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Trim and validate goal length
    const goal = body.goal.trim();
    if (goal.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Goal cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (goal.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Goal must be 500 characters or less' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream the response with proper error handling
    const result = streamText({
      model: openrouter('google/gemini-2.5-flash-lite-preview-09-2025'),
      system: SYSTEM_PROMPT,
      prompt: `User's goal: "${goal}"`,
      // Best practice: handle errors during streaming
      onError({ error }) {
        console.error('Stream error:', error);
      },
    });

    // Return optimized streaming response
    return result.toTextStreamResponse({
      headers: {
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    // Distinguish between different error types
    if (error instanceof SyntaxError) {
      console.error('Invalid JSON in request:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generic error handling with safe error messages
    console.error('Unexpected error generating steps:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({ error: 'Failed to generate steps' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}