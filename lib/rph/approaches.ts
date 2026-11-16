type Standard = {sp: string; text: string; skText: string; topic: string};

export function suggestedApproaches(standards: Standard[]) {
  const suggestions = new Map<string, {description: string; codes: string[]}>();
  for (const standard of standards) {
    const text = [standard.text, standard.skText, standard.topic].join(' ');
    const activities: [string, string][] = [
      ['Think–Pair–Share', 'Think individually, discuss with a partner, then explain to the class.']
    ];
    if (/data|chart|graph|pictograph|table/i.test(text)) {
      activities.push(['Gallery Walk', 'Groups display and compare their graphs or interpretations.']);
    } else if (/problem|solve|reason|justify/i.test(text)) {
      activities.push(['Rally Robin', 'Partners take turns suggesting steps and explaining their reasoning.']);
    } else if (/shape|angle|length|mass|volume|measurement|time/i.test(text)) {
      activities.push(['Station Rotation', 'Small groups investigate and compare measurements or models at stations.']);
    } else {
      activities.push(['Round Table', 'Group members take turns recording a representation or solution.']);
    }
    for (const [name, description] of activities) {
      const existing = suggestions.get(name) ?? {description, codes: []};
      existing.codes.push(standard.sp);
      suggestions.set(name, existing);
    }
  }
  return [...suggestions].map(([name, value]) => ({name, ...value}));
}
