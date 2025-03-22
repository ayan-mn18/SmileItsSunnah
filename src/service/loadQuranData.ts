import fs from 'fs-extra';
import path from 'path';

interface TranslationText {
  name: string;
  text: string;
}

interface Verse {
  id: number;
  verse_key: string;
  text: string; // Arabic text
  translation: {
    [lang: string]: TranslationText;
  };
}

interface Surah {
  id: number;
  name: string; // Arabic name
  transliteration: string;
  translation: string; // English name/translation
  type: string; // "meccan" or "medinan"
  total_verses: number;
  verses: Record<string, Verse>; // Key is verse number as string
}

export async function loadQuranData(lang: string): Promise<Surah[]> {
  // Load Arabic Quran text
  const quranPath = path.join(__dirname, '../../data/quran.json');
  const quranData: Record<string, any[]> = await fs.readJson(quranPath);

  // Load translations
  const translationPath = path.join(__dirname, `../../data/editions/${lang}.json`);
  const translationData: Record<string, any[]> = await fs.readJson(translationPath);

  // Load chapter metadata
  const chaptersPath = path.join(__dirname, `../../data/chapters/${lang}.json`);
  const chaptersData = await fs.readJson(chaptersPath);

  // Transform into desired format
  const structuredData: Surah[] = [];

  chaptersData.forEach((chapter: any) => {
    const chapterId = chapter.id.toString();
    const arabicVerses = quranData[chapterId] || [];
    const translatedVerses = translationData[chapterId] || [];
    
    const surah: Surah = {
      id: chapter.id,
      name: chapter.name, // Arabic name
      transliteration: chapter.transliteration,
      translation: chapter.translation, // English name
      type: chapter.type || "meccan", // Default to meccan if not found
      total_verses: arabicVerses.length,
      verses: {}
    };

    // Process verses
    arabicVerses.forEach((verse: any, index: number) => {
      const verseNumber = (index + 1).toString();
      const translatedVerse = translatedVerses[index] || { text: "" };
      
      surah.verses[verseNumber] = {
        id: index + 1,
        verse_key: `${chapterId}:${verseNumber}`,
        text: verse.text, // Arabic text
        translation: {
          [lang]: {
            name: "Saheeh International", // Adjust translator name as needed
            text: translatedVerse.text || ""
          }
        }
      };
    });

    structuredData.push(surah);
  });

  console.log(`Loaded Quran data for ${lang}`);
  console.log(`Number of chapters: ${structuredData.length}`);
  console.log(`Total verses: ${structuredData.reduce((acc, surah) => acc + Object.keys(surah.verses).length, 0)}`);

  return structuredData;
}