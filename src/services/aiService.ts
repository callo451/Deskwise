import { Ticket, TicketComment } from '../types/database';

// Extended ticket interface to match what's used in TicketDetail
interface TicketWithDetails extends Partial<Ticket> {
  id: string;
  title: string;
  description: string;
  status?: string;
  priority?: string;
  status_id: string;
  priority_id: string;
}

interface CommentWithUser extends TicketComment {
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

// Define the response type from OpenAI
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Interface for knowledge base article generation request
interface GenerateArticleRequest {
  prompt: string;
  options: {
    includeTitle: boolean;
    includeContent: boolean;
    includeCategory: boolean;
    includeTags: boolean;
  };
}

// Interface for generated knowledge base article
interface GeneratedArticle {
  title: string;
  content: string;
  category_id: string;
  tags: string[];
}

/**
 * Generate an AI summary of a ticket using OpenAI
 * @param ticket The ticket to summarize
 * @returns A promise that resolves to the summary text
 */
export const generateTicketSummary = async (ticket: Ticket | TicketWithDetails): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const prompt = `
      Please provide a concise summary of the following support ticket:
      
      Title: ${ticket.title}
      Description: ${ticket.description}
      Status: ${ticket.status || 'Unknown'}
      Priority: ${ticket.priority || 'Unknown'}
      
      Please include:
      1. Key issues or requests
      2. Potential solutions if apparent
      3. Any critical information that needs attention
      
      Keep the summary under 150 words and focus on the most important aspects.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes support tickets concisely and accurately.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json() as OpenAIResponse;
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating ticket summary:', error);
    throw error;
  }
};

/**
 * Generate an AI response to ticket comments using OpenAI
 * @param ticket The ticket details
 * @param comments The existing comments on the ticket
 * @returns A promise that resolves to the AI-generated response
 */
export const generateCommentResponse = async (
  ticket: Ticket | TicketWithDetails,
  comments: CommentWithUser[] = []
): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Format the ticket information and comments for the prompt
    const ticketInfo = `
      Ticket Title: ${ticket.title}
      Description: ${ticket.description}
      Status: ${ticket.status || 'Unknown'}
      Priority: ${ticket.priority || 'Unknown'}
    `;

    const commentHistory = comments.length > 0 
      ? comments.map(comment => {
          const userName = comment.user.first_name && comment.user.last_name
            ? `${comment.user.first_name} ${comment.user.last_name}`
            : comment.user.email;
          return `${userName}: ${comment.content}`;
        }).join('\n\n')
      : 'No previous comments';

    const prompt = `
      You are a helpful IT support agent responding to a ticket. 
      Please generate a professional, helpful response to the ticket and any comments.
      
      TICKET INFORMATION:
      ${ticketInfo}
      
      COMMENT HISTORY:
      ${commentHistory}
      
      ${comments.length === 0 
        ? 'This is the first response to this ticket. Start with a greeting and acknowledge the issue.'
        : 'Please provide a helpful follow-up response based on the conversation history.'}
      
      Keep your response concise, professional, and focused on resolving the issue.
      If you need more information, ask specific questions.
      If you can suggest a solution, provide clear steps.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful IT support agent. Provide professional, concise responses to support tickets.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 350
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json() as OpenAIResponse;
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating comment response:', error);
    throw error;
  }
};

/**
 * Detect the type of content based on the prompt
 * @param prompt The user's prompt for article generation
 * @returns The detected content type
 */
const detectContentType = (prompt: string): string => {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for how-to guides
  if (
    lowerPrompt.includes('how to') ||
    lowerPrompt.includes('step by step') ||
    lowerPrompt.includes('guide') ||
    lowerPrompt.includes('tutorial') ||
    lowerPrompt.includes('instructions')
  ) {
    return 'how-to guide';
  }
  
  // Check for troubleshooting
  if (
    lowerPrompt.includes('troubleshoot') ||
    lowerPrompt.includes('fix') ||
    lowerPrompt.includes('solve') ||
    lowerPrompt.includes('issue') ||
    lowerPrompt.includes('problem') ||
    lowerPrompt.includes('error')
  ) {
    return 'troubleshooting guide';
  }
  
  // Check for reference material
  if (
    lowerPrompt.includes('reference') ||
    lowerPrompt.includes('glossary') ||
    lowerPrompt.includes('definition') ||
    lowerPrompt.includes('comparison') ||
    lowerPrompt.includes('vs') ||
    lowerPrompt.includes('versus')
  ) {
    return 'reference material';
  }
  
  // Default to informational article
  return 'informational article';
};

/**
 * Generate a knowledge base article using AI
 * @param request The article generation request with prompt and options
 * @param categories Available categories for the AI to choose from
 * @returns A promise that resolves to the generated article data
 */
export const generateKnowledgeBaseArticle = async (
  request: GenerateArticleRequest,
  categories: any[]
): Promise<GeneratedArticle> => {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Format the categories for the prompt
    const categoriesFormatted = categories.map(cat => 
      `- ${cat.name} (ID: ${cat.id})${cat.description ? ` - ${cat.description}` : ''}`
    ).join('\n');

    // Create the system prompt based on selected options
    let systemPrompt = 'You are a knowledgeable technical writer who creates clear, informative articles with appropriate formatting based on content type. ';
    
    if (request.options.includeTitle) {
      systemPrompt += 'You create concise, descriptive titles that clearly indicate the article purpose. ';
    }
    
    if (request.options.includeContent) {
      systemPrompt += 'You write well-structured content with proper HTML formatting. For how-to guides, use step-by-step formatting with numbered lists (<ol>, <li>) and clear section headings (<h2>, <h3>). For informational articles, use proper heading hierarchy, paragraphs, and bullet points where appropriate. For troubleshooting guides, clearly separate problems and solutions with headings and organized lists. ';
    }
    
    if (request.options.includeCategory) {
      systemPrompt += 'You select the most appropriate category for articles based on their content. ';
    }
    
    if (request.options.includeTags) {
      systemPrompt += 'You provide relevant tags that help with article discovery. ';
    }

    // Detect content type from the prompt
    const contentType = detectContentType(request.prompt);
    
    // Create the user prompt
    let userPrompt = `Please create a knowledge base article about: ${request.prompt}\n\n`;
    userPrompt += `Content type detected: ${contentType}. Format the content appropriately for this type.\n\n`;
    
    if (request.options.includeCategory) {
      userPrompt += `Choose the most appropriate category from the following list:\n${categoriesFormatted}\n\n`;
    }
    
    userPrompt += 'Respond in JSON format with the following structure:\n';
    userPrompt += '{\n';
    
    if (request.options.includeTitle) {
      userPrompt += '  "title": "The article title",\n';
    }
    
    if (request.options.includeContent) {
      userPrompt += '  "content": "The article content with HTML formatting",\n';
    }
    
    if (request.options.includeCategory) {
      userPrompt += '  "category_id": "The ID of the selected category",\n';
    }
    
    if (request.options.includeTags) {
      userPrompt += '  "tags": ["tag1", "tag2", "tag3"]\n';
    }
    
    userPrompt += '}\n\n';
    
    userPrompt += 'IMPORTANT: DO NOT include the main title (h1) in the content as it will be displayed separately.\n\n';
    userPrompt += 'For the content, use appropriate HTML tags for formatting based on the content type:\n';
    userPrompt += '- For how-to guides: Use <h2> for major sections, <h3> for subsections, <ol> and <li> for numbered steps, <ul> and <li> for bullet points, and <p> for paragraphs. Include clear step numbers and make each step distinct.\n';
    userPrompt += '- For informational articles: Use <h2> for major sections, <h3> for subsections, <p> for paragraphs, and <ul>/<li> for lists of related items.\n';
    userPrompt += '- For troubleshooting guides: Use <h2> for problem categories, <h3> for specific issues, and clearly separate problems from solutions with appropriate formatting.\n';
    userPrompt += '- For reference material: Use tables (<table>, <tr>, <td>) when presenting comparative information, and proper heading hierarchy starting with <h2> for organizing content.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json() as OpenAIResponse;
    const content = data.choices[0].message.content.trim();
    
    try {
      const parsedContent = JSON.parse(content);
      
      // Create a default response with empty values
      const defaultResponse: GeneratedArticle = {
        title: '',
        content: '',
        category_id: '',
        tags: []
      };
      
      // Merge the parsed content with the default response
      return {
        ...defaultResponse,
        ...parsedContent
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI-generated content');
    }
  } catch (error) {
    console.error('Error generating knowledge base article:', error);
    throw error;
  }
};
