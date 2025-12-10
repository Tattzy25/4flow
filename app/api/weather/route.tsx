import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { createClient } from 'v0-sdk';

const v0 = createClient({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: 'openai/gpt-4o',
    messages: convertToModelMessages(messages),
    tools: {
      fetch_weather_data: {
        description: 'Fetch weather information for a specific location',
        parameters: z.object({
          location: z
            .string()
            .describe('The city or location to get weather for'),
          units: z
            .enum(['celsius', 'fahrenheit'])
            .default('celsius')
            .describe('Temperature units'),
        }),
        inputSchema: z.object({
          location: z.string().describe('The city or location to get weather for'),
          units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
        }),
        execute: async ({ location, units }) => {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const temp =
            units === 'celsius'
              ? Math.floor(Math.random() * 35) + 5
              : Math.floor(Math.random() * 63) + 41;
          return {
            location,
            temperature: `${temp}°${units === 'celsius' ? 'C' : 'F'}`,
            conditions: 'Sunny',
            humidity: `12%`,
            windSpeed: `35 ${units === 'celsius' ? 'km/h' : 'mph'}`,
            lastUpdated: new Date().toLocaleString(),
          };
        },
      },
      generate_ui: {
        description: 'Generate a UI component based on a prompt',
        parameters: z.object({
          prompt: z.string().describe('The description of the UI to generate'),
        }),
        inputSchema: z.object({
          prompt: z.string().describe('The description of the UI to generate'),
        }),
        execute: async ({ prompt }) => {
          const result = await v0.chats.create({
            system: 'You are an expert coder',
            message: prompt,
            modelConfiguration: {
              modelId: 'v0-1.5-sm',
              imageGenerations: false,
              thinking: false,
            },
          });
          
          // Check if result is ChatDetail (has latestVersion)
          if ('latestVersion' in result) {
            return {
              demo: result.latestVersion?.demoUrl,
              webUrl: result.webUrl,
            };
          }
          
          return {
            demo: null,
            webUrl: null
          };
        },
      },
    },
  });
  return result.toUIMessageStreamResponse();
}