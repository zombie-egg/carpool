// Fuzzy, bilingual location matching for the trip filters.
//
// A query matches a stored location when the text matches directly, OR when
// both sides fall into the same synonym group — so searching "高铁站" also
// finds trips published with "动车站", and "railway station" finds trips
// published in Chinese.
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
    "railway",
    "train",
  ],
  ["机场", "航站楼", "airport", "terminal"],
  ["汽车站", "客运站", "大巴", "bus station", "coach station", "bus"],
  ["生活一区", "一区", "living area 1", "area 1"],
  ["生活二区", "二区", "living area 2", "area 2"],
  ["生活三区", "三区", "living area 3", "area 3"],
  ["大学城", "校区", "campus", "university town"],
  ["医院", "hospital"],
  ["商场", "购物中心", "mall", "shopping center", "shopping centre"],
];

export function locationMatches(location: string, query: string): boolean {
  const loc = location.trim().toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (loc.includes(q)) return true;

  for (const group of SYNONYM_GROUPS) {
    const queryInGroup = group.some(
      (term) => q.includes(term) || term.includes(q)
    );
    if (!queryInGroup) continue;
    const locationInGroup = group.some((term) => loc.includes(term));
    if (locationInGroup) return true;
  }
  return false;
}
