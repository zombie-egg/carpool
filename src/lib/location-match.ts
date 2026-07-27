// Fuzzy, bilingual location matching for the trip filters.
//
// A query matches a stored location when the text matches directly, OR when
// both sides fall into the same bilingual location group. This keeps custom
// addresses discoverable regardless of whether they were entered in Chinese
// or English.
const SYNONYM_GROUPS: ReadonlyArray<ReadonlyArray<string>> = [
  [
    "高铁站",
    "动车站",
    "火车站",
    "高铁",
    "动车",
    "火车",
    "railway station",
    "train station",
    "high-speed rail",
    "rail",
    "railway",
    "train",
    "station",
    "站",
  ],
  ["机场", "航站楼", "airport", "terminal"],
  ["汽车站", "客运站", "大巴", "bus station", "coach station", "bus"],
  ["生活一区", "一区", "living area 1", "area 1"],
  ["生活二区", "二区", "living area 2", "area 2"],
  ["生活三区", "三区", "living area 3", "area 3"],
  ["大学城", "校区", "campus", "university town"],
  ["黎安", "lian", "li'an", "li an"],
  ["东门", "东站", "东区", "east gate", "east station", "east"],
  ["西门", "西站", "西区", "west gate", "west station", "west"],
  ["南门", "南站", "南区", "south gate", "south station", "south"],
  ["北门", "北站", "北区", "north gate", "north station", "north"],
  ["医院", "hospital"],
  ["商场", "购物中心", "mall", "shopping center", "shopping centre"],
];

function normalizeLocation(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s'’`\-_,.，。·]/g, "");
}

export function locationMatches(location: string, query: string): boolean {
  const loc = normalizeLocation(location);
  const q = normalizeLocation(query);
  if (!q) return true;
  if (loc.includes(q)) return true;

  const queryGroups = SYNONYM_GROUPS.filter((group) =>
    group.some((term) => q.includes(normalizeLocation(term)))
  );
  if (queryGroups.length === 0) return false;

  return queryGroups.every((group) =>
    group.some((term) => loc.includes(normalizeLocation(term)))
  );
}
