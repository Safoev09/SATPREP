// Fetch a definition from the free dictionaryapi.dev service.
// Returns the first meaning + example, or null on failure.
// This is called from the browser (client component), so no API key needed.

export type DictionaryEntry = {
  definition: string;
  partOfSpeech: string;
  example: string | null;
};

export async function lookupWord(rawWord: string): Promise<DictionaryEntry | null> {
  const word = rawWord.trim().toLowerCase();
  if (!word) return null;
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Find the first meaning that has a definition
    const first = data[0];
    if (!first?.meanings || first.meanings.length === 0) return null;

    const meaning = first.meanings[0];
    const def = meaning?.definitions?.[0];
    if (!def?.definition) return null;

    return {
      definition: def.definition,
      partOfSpeech: meaning.partOfSpeech ?? "",
      example: def.example ?? null,
    };
  } catch {
    return null;
  }
}
