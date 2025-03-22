import { NextFunction, Request, RequestHandler, Response } from 'express';
import { generateEmbeddings } from '../service/embeddingService';
import openai, { createEmbeddingToQueryPinecone } from '../config/openai';
import { index } from '../config/pinecone';
import { create } from 'domain';

export default class QuranController {
  /**
   * Generate and store embeddings for Quran data
   */
  static generateEmbeddings: RequestHandler = async (req, res) => {
    try {
      const lang = req.query.lang as string || 'en';
      await generateEmbeddings(lang);
      res.status(200).json({
        success: true,
        message: 'Quran data embedded successfully'
      });
    } catch (error) {
      console.error('Error generating embeddings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate embeddings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static testApi: RequestHandler = async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'API is working'
      });
    } catch (error) {
      console.error('Error testing API:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test API',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Query Quran data using semantic search
   */
  static queryQuran: RequestHandler = async (req, res) => {
    try {
      const { query, lang = 'en' } = req.body;
      
      if (!query) {
        res.status(400).json({
          success: false,
          message: 'Query is required'
        });
      }

      console.log(`Processing query: "${query}" in language: ${lang}`);
      
      // Create embedding for the query
      const queryEmbedding = await createEmbeddingToQueryPinecone({ query });
      
      // Query Pinecone for similar verses
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
      });
      
      // Format the matched verses
      const matchedVerses = queryResponse.matches?.map(match => ({
        score: match.score,
        verseKey: match.metadata?.verseKey,
        chapterId: match.metadata?.chapter,
        chapterName: match.metadata?.chapterName,
        verse: match.metadata?.verse,
        text: match.metadata?.text,
        language: match.metadata?.language,
        arabicText: match.metadata?.arabicText,
      })) || [];
      
      // Generate response based on retrieved verses
      let generatedResponse = '';
      if (matchedVerses.length > 0) {
        const versesContext = matchedVerses
          .map(v => `Verse ${v.verseKey}: "${v.text}"`)
          .join('\n');
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a knowledgeable Quran assistant. Answer the question based on the provided Quranic verses. If the verses don\'t directly answer the question, say so respectfully.'
            },
            {
              role: 'user',
              content: `I have a question about the Quran: "${query}"\n\nRelevant verses from the Quran:\n${versesContext}`
            }
          ],
          temperature: 0.7,
          max_tokens: 300,
        });
        
        generatedResponse = completion.choices[0].message.content || '';
      }
      
      res.status(200).json({
        success: true,
        query,
        matchedVerses,
        generatedResponse
      });
    } catch (error) {
      console.error('Error querying Quran:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to query Quran',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}