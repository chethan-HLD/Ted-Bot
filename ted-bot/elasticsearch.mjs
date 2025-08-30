import { Client } from '@elastic/elasticsearch';

// Use environment variable for ES_API_KEY
const authHeader = `ApiKey ${process.env.ES_API_KEY}`;

const client = new Client({
  node: process.env.ES_ENDPOINT,
  auth: {
    apiKey: process.env.ES_API_KEY
  },
  tls: {
    rejectUnauthorized: false
  }
});

export async function searchTEDTalks(query, limit = 5) {
  try {
    const response = await client.search({
      index: ['ted_talks', 'tedx'],
      body: {
        size: limit,
        query: {
          multi_match: {
            query: query,
            fields: ['title^2', 'content', 'author', 'tags'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        },
        _source: ['title', 'content', 'author', 'url', 'video_id', 'tags', 'duration', 'view_count', 'category']
      }
    });

    return response.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score,
      index: hit._index // Add index name to identify source
    }));
  } catch (error) {
    console.error('Error searching TED talks:', error);
    return [];
  }
}

export async function searchTEDTalksByVector(vector, limit = 5) {
  try {
    const response = await client.search({
      index: ['ted_talks', 'tedx'],
      body: {
        size: limit,
        query: {
          script_score: {
            query: { match_all: {} },
            script: {
              source: "cosineSimilarity(params.query_vector, 'my_vector') + 1.0",
              params: { query_vector: vector }
            }
          }
        },
        _source: ['title', 'content', 'author', 'url', 'video_id', 'tags', 'duration', 'view_count', 'category']
      }
    });

    return response.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score,
      index: hit._index
    }));
  } catch (error) {
    console.error('Error searching TED talks by vector:', error);
    return [];
  }
}

export async function searchTEDTalksByAuthor(author, limit = 5) {
  try {
    const response = await client.search({
      index: ['ted_talks', 'tedx'],
      body: {
        size: limit,
        query: {
          match: {
            author: author
          }
        },
        _source: ['title', 'content', 'author', 'url', 'video_id', 'tags', 'duration', 'view_count', 'category']
      }
    });

    return response.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score,
      index: hit._index
    }));
  } catch (error) {
    console.error('Error searching TED talks by author:', error);
    return [];
  }
}

export async function searchTEDTalksByCategory(category, limit = 5) {
  try {
    const response = await client.search({
      index: ['ted_talks', 'tedx'],
      body: {
        size: limit,
        query: {
          match: {
            category: category
          }
        },
        _source: ['title', 'content', 'author', 'url', 'video_id', 'tags', 'duration', 'view_count', 'category']
      }
    });

    return response.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score,
      index: hit._index
    }));
  } catch (error) {
    console.error('Error searching TED talks by category:', error);
    return [];
  }
}

export async function getRandomTEDTalks(limit = 5) {
  try {
    const response = await client.search({
      index: ['ted_talks', 'tedx'],
      body: {
        size: limit,
        query: {
          function_score: {
            query: { match_all: {} },
            random_score: {}
          }
        },
        _source: ['title', 'content', 'author', 'url', 'video_id', 'tags', 'duration', 'view_count', 'category']
      }
    });

    return response.hits.hits.map(hit => ({
      ...hit._source,
      score: hit._score,
      index: hit._index
    }));
  } catch (error) {
    console.error('Error getting random TED talks:', error);
    return [];
  }
}

export async function getTEDTalkStats() {
  try {
    const response = await client.search({
      index: ['ted_talks', 'tedx'],
      body: {
        size: 0,
        aggs: {
          total_talks: {
            value_count: {
              field: "video_id"
            }
          },
          unique_authors: {
            cardinality: {
              field: "author"
            }
          },
          categories: {
            terms: {
              field: "category",
              size: 10
            }
          },
          avg_duration: {
            avg: {
              field: "duration"
            }
          },
          avg_views: {
            avg: {
              field: "view_count"
            }
          },
          index_breakdown: {
            terms: {
              field: "_index",
              size: 10
            }
          }
        }
      }
    });

    return response.aggregations;
  } catch (error) {
    console.error('Error getting TED talk stats:', error);
    return {};
  }
}
