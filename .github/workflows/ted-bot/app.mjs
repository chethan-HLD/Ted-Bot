import { searchTEDTalks, searchTEDTalksByVector, searchTEDTalksByAuthor, searchTEDTalksByCategory, getRandomTEDTalks, getTEDTalkStats } from './elasticsearch.mjs';
import { gpt_embeding, generateTEDResponse, generateTEDRecommendations } from './gpt.mjs';

export const lambdaHandler = async (event) => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    let body;
    if (event.body) {
      body = JSON.parse(event.body);
    } else {
      body = event;
    }
    
    const { message, type = 'search' } = body;
    
    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Message is required'
        })
      };
    }
    
    let response;
    
    switch (type) {
      case 'search':
        response = await handleSearch(message);
        break;
      case 'author':
        response = await handleAuthorSearch(message);
        break;
      case 'category':
        response = await handleCategorySearch(message);
        break;
      case 'recommendations':
        response = await handleRecommendations(message);
        break;
      case 'random':
        response = await handleRandomTalks(message);
        break;
      case 'stats':
        response = await handleStats();
        break;
      default:
        response = await handleSearch(message);
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

async function handleSearch(query) {
  try {
    // First, try semantic search with embeddings
    const embedding = await gpt_embeding(query);
    let searchResults = [];
    
    if (embedding) {
      searchResults = await searchTEDTalksByVector(embedding, 3);
    }
    
    // If vector search didn't return good results, fall back to text search
    if (searchResults.length === 0) {
      searchResults = await searchTEDTalks(query, 5);
    }
    
    if (searchResults.length === 0) {
      return {
        response: "I couldn't find any TED/TEDx talks related to your query. Try searching for a different topic or ask me for some random inspiring talks!",
        talks: [],
        type: 'search'
      };
    }
    
    // Generate AI response based on the search results
    const aiResponse = await generateTEDResponse(query, searchResults);
    
    return {
      response: aiResponse,
      talks: searchResults.map(talk => ({
        title: talk.title,
        author: talk.author,
        url: talk.url,
        duration: talk.duration,
        view_count: talk.view_count,
        tags: talk.tags,
        category: talk.category,
        source: talk.index === 'ted_talks' ? 'TED' : 'TEDx',
        score: talk.score
      })),
      type: 'search',
      query: query
    };
    
  } catch (error) {
    console.error('Error in handleSearch:', error);
    return {
      response: "I'm having trouble searching for TED talks right now. Please try again later.",
      talks: [],
      type: 'search',
      error: error.message
    };
  }
}

async function handleAuthorSearch(authorName) {
  try {
    const searchResults = await searchTEDTalksByAuthor(authorName, 10);
    
    if (searchResults.length === 0) {
      return {
        response: `I couldn't find any TED/TEDx talks by "${authorName}". Try searching for a different speaker or ask me for some random inspiring talks!`,
        talks: [],
        type: 'author'
      };
    }
    
    const aiResponse = await generateTEDResponse(`Find talks by ${authorName}`, searchResults);
    
    return {
      response: aiResponse,
      talks: searchResults.map(talk => ({
        title: talk.title,
        author: talk.author,
        url: talk.url,
        duration: talk.duration,
        view_count: talk.view_count,
        tags: talk.tags,
        category: talk.category,
        source: talk.index === 'ted_talks' ? 'TED' : 'TEDx',
        score: talk.score
      })),
      type: 'author',
      author: authorName
    };
    
  } catch (error) {
    console.error('Error in handleAuthorSearch:', error);
    return {
      response: "I'm having trouble searching for talks by this author. Please try again later.",
      talks: [],
      type: 'author',
      error: error.message
    };
  }
}

async function handleCategorySearch(category) {
  try {
    const searchResults = await searchTEDTalksByCategory(category, 10);
    
    if (searchResults.length === 0) {
      return {
        response: `I couldn't find any TED/TEDx talks in the "${category}" category. Try searching for a different category or ask me for some random inspiring talks!`,
        talks: [],
        type: 'category'
      };
    }
    
    const aiResponse = await generateTEDResponse(`Find talks in the ${category} category`, searchResults);
    
    return {
      response: aiResponse,
      talks: searchResults.map(talk => ({
        title: talk.title,
        author: talk.author,
        url: talk.url,
        duration: talk.duration,
        view_count: talk.view_count,
        tags: talk.tags,
        category: talk.category,
        source: talk.index === 'ted_talks' ? 'TED' : 'TEDx',
        score: talk.score
      })),
      type: 'category',
      category: category
    };
    
  } catch (error) {
    console.error('Error in handleCategorySearch:', error);
    return {
      response: "I'm having trouble searching for talks in this category. Please try again later.",
      talks: [],
      type: 'category',
      error: error.message
    };
  }
}

async function handleRecommendations(interests) {
  try {
    // Get random talks to choose from for recommendations
    const availableTalks = await getRandomTEDTalks(20);
    
    if (availableTalks.length === 0) {
      return {
        response: "I'm having trouble generating recommendations right now. Please try again later.",
        talks: [],
        type: 'recommendations'
      };
    }
    
    const aiResponse = await generateTEDRecommendations(interests, availableTalks);
    
    return {
      response: aiResponse,
      talks: availableTalks.slice(0, 5).map(talk => ({
        title: talk.title,
        author: talk.author,
        url: talk.url,
        duration: talk.duration,
        view_count: talk.view_count,
        tags: talk.tags,
        category: talk.category,
        source: talk.index === 'ted_talks' ? 'TED' : 'TEDx',
        score: talk.score
      })),
      type: 'recommendations',
      interests: interests
    };
    
  } catch (error) {
    console.error('Error in handleRecommendations:', error);
    return {
      response: "I'm having trouble generating recommendations. Please try again later.",
      talks: [],
      type: 'recommendations',
      error: error.message
    };
  }
}

async function handleRandomTalks(message) {
  try {
    const searchResults = await getRandomTEDTalks(5);
    
    if (searchResults.length === 0) {
      return {
        response: "I'm having trouble finding random talks right now. Please try again later.",
        talks: [],
        type: 'random'
      };
    }
    
    const aiResponse = await generateTEDResponse("Show me some random inspiring TED talks", searchResults);
    
    return {
      response: aiResponse,
      talks: searchResults.map(talk => ({
        title: talk.title,
        author: talk.author,
        url: talk.url,
        duration: talk.duration,
        view_count: talk.view_count,
        tags: talk.tags,
        category: talk.category,
        source: talk.index === 'ted_talks' ? 'TED' : 'TEDx',
        score: talk.score
      })),
      type: 'random'
    };
    
  } catch (error) {
    console.error('Error in handleRandomTalks:', error);
    return {
      response: "I'm having trouble finding random talks. Please try again later.",
      talks: [],
      type: 'random',
      error: error.message
    };
  }
}

async function handleStats() {
  try {
    const stats = await getTEDTalkStats();
    
    const response = `Here are some interesting statistics about our TED/TEDx collection:
    
📊 **Collection Overview:**
• Total talks: ${stats.total_talks?.value || 'Unknown'}
• Unique speakers: ${stats.unique_authors?.value || 'Unknown'}
• Average duration: ${stats.avg_duration?.value ? `${Math.round(stats.avg_duration.value / 60)} minutes` : 'Unknown'}
• Average views: ${stats.avg_views?.value ? stats.avg_views.value.toLocaleString() : 'Unknown'}

${stats.index_breakdown?.buckets ? `
📚 **Index Breakdown:**
${stats.index_breakdown.buckets.map(bucket => `• ${bucket.key === 'ted_talks' ? 'TED Talks' : 'TEDx Talks'}: ${bucket.doc_count} talks`).join('\n')}
` : ''}

${stats.categories?.buckets ? `
📂 **Top Categories:**
${stats.categories.buckets.slice(0, 5).map(bucket => `• ${bucket.key}: ${bucket.doc_count} talks`).join('\n')}
` : ''}

This is a comprehensive collection of inspiring talks from both the main TED platform and TEDx events worldwide! 🌍`;
    
    return {
      response: response,
      stats: stats,
      type: 'stats'
    };
    
  } catch (error) {
    console.error('Error in handleStats:', error);
    return {
      response: "I'm having trouble retrieving statistics right now. Please try again later.",
      stats: {},
      type: 'stats',
      error: error.message
    };
  }
}
