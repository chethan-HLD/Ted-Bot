import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function gpt_embeding(text, model = "text-embedding-3-small") {
  try {
    const response = await openai.embeddings.create({
      model: model,
      input: text,
      encoding_format: "float",
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    return null;
  }
}

export async function gpt_completion(messages, model = "gpt-4o-mini", temperature = 0.7) {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: 2000,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error getting GPT completion:', error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
  }
}

export async function generateTEDResponse(userQuery, contextTalks) {
  const systemPrompt = `You are a knowledgeable TED/TEDx expert assistant. You have access to information about thousands of TED and TEDx talks from both the main TED platform and TEDx events worldwide. Your role is to help users discover, understand, and learn from these talks.

Key guidelines:
1. Be enthusiastic and engaging about TED/TEDx content
2. Provide accurate information about talks, speakers, and topics
3. When referencing talks, always mention the speaker name and title
4. Include relevant URLs when available (TED.com for main TED talks, YouTube for TEDx talks)
5. Suggest related talks when appropriate
6. Be conversational and helpful
7. If you don't have specific information about a talk, be honest about it
8. Focus on the ideas, insights, and inspiration from the talks
9. Distinguish between TED (main platform) and TEDx (community events) when relevant
10. Highlight the diversity of speakers and topics from both platforms

Context talks available: ${contextTalks.length} talks from both TED and TEDx platforms

Format your responses to be helpful and engaging. If you reference specific talks, include the speaker name, title, and URL if available.`;

  const userPrompt = `User query: "${userQuery}"

Available context from TED/TEDx talks:
${contextTalks.map((talk, index) => `
${index + 1}. Title: ${talk.title}
   Speaker: ${talk.author}
   Source: ${talk.index === 'ted_talks' ? 'TED' : 'TEDx'}
   URL: ${talk.url || 'Not available'}
   Content preview: ${talk.content.substring(0, 200)}...
   Tags: ${talk.tags ? talk.tags.join(', ') : 'None'}
   Category: ${talk.category || 'General'}
   Duration: ${talk.duration ? `${Math.round(talk.duration / 60)} minutes` : 'Unknown'}
   Views: ${talk.view_count ? talk.view_count.toLocaleString() : 'Unknown'}
`).join('\n')}

Please provide a helpful response based on this context.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  return await gpt_completion(messages, "gpt-4o-mini", 0.7);
}

export async function generateTEDRecommendations(userInterests, availableTalks) {
  const systemPrompt = `You are a TED/TEDx recommendation expert. Based on user interests and available talks, suggest the most relevant and inspiring talks.

Guidelines:
1. Consider the user's interests carefully
2. Suggest talks that align with their interests
3. Include a mix of well-known and lesser-known talks
4. Explain why each talk is recommended
5. Be enthusiastic about the recommendations
6. Include speaker names and titles
7. Mention duration and view count when relevant`;

  const userPrompt = `User interests: "${userInterests}"

Available talks to choose from:
${availableTalks.map((talk, index) => `
${index + 1}. ${talk.title} by ${talk.author}
   Tags: ${talk.tags ? talk.tags.join(', ') : 'None'}
   Duration: ${talk.duration ? `${Math.round(talk.duration / 60)} minutes` : 'Unknown'}
   URL: ${talk.url || 'Not available'}
`).join('\n')}

Please recommend 3-5 talks that would be most relevant to the user's interests. For each recommendation, explain why it's a good fit.`;

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  return await gpt_completion(messages, "gpt-4o-mini", 0.8);
}
