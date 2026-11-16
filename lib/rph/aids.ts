type AidRule = readonly [RegExp, string];
const rules: AidRule[] = [
  [/bar chart|pictograph|data|pie chart/i, 'Graph paper and tally cards'],
  [/money|currency|financial|price|saving/i, 'Play ringgit and price tags'],
  [/clock|hour|minute|time|duration/i, 'Movable clock face and timeline strip'],
  [/calendar|month|days of/i, 'Calendar sheets'],
  [/fraction|percentage|decimal/i, 'Fraction strips and hundred grids'],
  [/angle|bearing/i, 'Protractor and hinged angle strips'],
  [/mass|weigh/i, 'Balance scale and labelled weights'],
  [/liquid|capacity/i, 'Graduated cups and water'],
  [/length|perimeter|distance/i, 'Ruler and measuring tape'],
  [/area|volume of solid/i, 'Square tiles and unit cubes'],
  [/shape|polygon|solid|space/i, 'Shape cut-outs and geometric solids'],
  [/coordinate|axis|axes/i, 'Coordinate grid and movable markers'],
  [/multipli|divis|divide|ratio/i, 'Counters and grouping trays'],
  [/probability|likelihood/i, 'Coloured counters and an opaque bag'],
  [/place value|digit|round/i, 'Place-value cards and number line'],
  [/number|add|subtract|quantity/i, 'Counters and number cards']
];

export function suggestedAids(standards: {sp:string; text:string; skText:string; topic:string}[]) {
  const groups = new Map<string,string[]>();
  for (const standard of standards) {
    const match = [standard.text, standard.skText, standard.topic]
      .map(description => rules.find(([pattern]) => pattern.test(description)))
      .find(Boolean);
    const aid = match?.[1] ?? 'Mini whiteboards and task cards';
    groups.set(aid, [...(groups.get(aid) ?? []), standard.sp]);
  }
  return [...groups].map(([aid, codes]) => ({aid, codes}));
}
