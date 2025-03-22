import { loadQuranData } from './loadQuranData';
import openai from '../config/openai';
import { index } from '../config/pinecone';

const MAX_TOKENS = 8000; // Keep a safe margin below 8192
const BATCH_SIZE = 100; // Adjust based on typical verse length

async function generateEmbeddings(lang: string) {
  // Load Quran data
  const chapters = await loadQuranData(lang);

  // Process only one chapter for now (change later if needed)
  let cnt = 0;

  for (const surah of chapters) {
    console.log(`Processing Chapter ${surah.id}: ${surah.name}`);
    if (cnt > 2) break; // Limit to one chapter for testing
    cnt++;

    let batch: string[] = [];
    let arabicBatch: string[] = [];
    let batchVerseIds: string[] = [];
    let tokenCount = 0;

    for (const [verseId, verse] of Object.entries(surah.verses)) {
      // Skip empty verses
      if (!verse.translation[lang]?.text) continue;

      const verseText = verse.translation[lang].text;
      const arabicText = verse.text;
      const verseTokens = verseText.split(' ').length + arabicText.split(' ').length; // Rough token estimation

      if (tokenCount + verseTokens > MAX_TOKENS) {
        // Process the current batch before adding new verses
        await processBatch(batch, arabicBatch, batchVerseIds, surah.id.toString(), lang, surah.transliteration, surah.name, surah.type);
        
        // Reset batch
        batch = [];
        arabicBatch = [];
        batchVerseIds = [];
        tokenCount = 0;
      }

      // Add verse to batch
      batch.push(verseText);
      arabicBatch.push(arabicText);
      batchVerseIds.push(verseId);
      tokenCount += verseTokens;

      // If batch reaches BATCH_SIZE, process it
      if (batch.length >= BATCH_SIZE) {
        await processBatch(batch, arabicBatch, batchVerseIds, surah.id.toString(), lang, surah.transliteration, surah.name, surah.type);
        batch = [];
        batchVerseIds = [];
        arabicBatch = [];
        tokenCount = 0;
      }
    }

    // Process any remaining verses
    if (batch.length > 0) {
      await processBatch(batch, arabicBatch, batchVerseIds, surah.id.toString(), lang, surah.transliteration, surah.name, surah.type);
    }
  }
}

async function processBatch(batch: string[], arabicBatch: string[], batchVerseIds: string[], chapterId: string, lang: string, chapterName: string, chapterNameArabic: string, chapter_type: string) {
  if (batch.length === 0) return;

  try {
    console.log('-----------------------------------');
    console.log(`Processing Batch - Chapter ${chapterId}, Verses: ${batchVerseIds.join(', ')}`);
    console.log(`Translation: ${batch.join(' ').substring(0, 100)}...`); // Show just a preview
    console.log(`Quranic Text: ${arabicBatch.join(' ').substring(0, 100)}...`); // Show just a preview
    console.log(`Total Tokens: ${batch.reduce((acc, verse) => acc + verse.split(' ').length, 0)}`);
    console.log(`Total Verses: ${batch.length}`);
    console.log('-----------------------------------');

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: batch,
    });

    // Extract embeddings
    const embeddings = response.data.map((res) => res.embedding);

    const vectors = response.data.map((res, i) => ({
      id: `${chapterId}-${batchVerseIds[i]}`,
      values: res.embedding,
      metadata: {
        text: batch[i],
        arabicText: arabicBatch[i],
        chapter: parseInt(chapterId),
        chapterName: chapterName,
        chapterNameArabic: chapterNameArabic,
        chapterType: chapter_type,
        verse: parseInt(batchVerseIds[i]), 
        language: lang,
        verseKey: `${chapterId}:${batchVerseIds[i]}`
      },
    }));

    // Upsert vectors to Pinecone
    await index.upsert(vectors);

    console.log(`✅ Successfully embedded and stored ${vectors.length} verses from Chapter ${chapterId}`);

  } catch (error) {
    console.error(`Error processing batch for Chapter ${chapterId}`);
    console.error(error);
  }

  // Add a small delay to avoid rate limits
  await new Promise((resolve) => setTimeout(resolve, 500));
}

export { generateEmbeddings };