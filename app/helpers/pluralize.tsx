const PLURALS = new Map<string, string>([
  [ 'person', 'people' ],
  [ 'country', 'countries' ],
  [ 'legal-entity', 'legal-entities' ],
]);

export default (word: string, count = 0, plural = `${word}s`) => {
  const pluralize = (val: number, word: string, plural = `${word}s`) =>
    [1, -1].includes(Number(val)) ? word : plural;

  const found = PLURALS.get(word);

  if (found) return pluralize(count, word, found);

  return pluralize(count, word, plural);
};