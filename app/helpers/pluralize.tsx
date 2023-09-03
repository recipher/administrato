const PLURALS = new Map<string, string>([
  [ 'person', 'people' ],
  [ 'country', 'countries' ],
]);

export default (word: string, count = 0, plural = `${word}s`) => {
  const pluralize = (val: number, word: string, plural = `${word}s`) =>
    [1, -1].includes(Number(val)) ? word : plural;

  const found = PLURALS.get(word);

  if (found) return pluralize(count, word, found);

  return pluralize(count, word, plural);
};

// pluralize(0, 'apple'); // 'apples'
// pluralize(1, 'apple'); // 'apple'
// pluralize(2, 'apple'); // 'apples'
// pluralize(2, 'person', 'people'); // 'people'
