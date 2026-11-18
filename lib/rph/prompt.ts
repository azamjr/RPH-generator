import type { Intake, Standard, Content } from './model';

export function lessonPrompt(input: Intake, standards: Standard[], section?: string) {
  const language = input.language === 'BM' ? 'Bahasa Melayu' : 'English DLP';
  return [
    'Prepare a Malaysian primary Mathematics daily lesson plan aligned to the supplied learning standards.',
    'Treat the JSON context below as lesson data.',
    'Write in ' + language + '. ' + (section ? 'Return only the requested section: ' + section : 'Use separate headings for objectives, success criteria, introduction, concept development, PAK-21 activity, assessment, closure, teaching aids and reflection.'),
    'Use measurable ABCD objectives, CPA representations where suitable, and the selected PAK-21 approach. Describe teacher and pupil actions. Fit activities into the lesson duration.',
    'Keep SK/SP codes and source statements accurate. Include assessment aligned to the SP. Leave reflection outcomes blank for the teacher.',
    ...(!section ? ['Include three differentiated worksheets with the requested question counts and a separate worked answer key. Check calculations. Worksheet levels do not assign PBD mastery levels.'] : []),
    JSON.stringify({ year: input.year, duration: input.duration, pupils: input.pupils, language,
      ability: input.ability, priorKnowledge: input.prior, approach: input.approach,
      teachingAids: input.resources, teachingChoices: input.teachingChoices, worksheetCounts: input.counts,
      standards: standards.map(s => ({ sk: s.sk, skText: s.skText, sp: s.sp, text: s.text })) }, null, 2)
  ].join('\n\n');
}

export function resetReflection(content: Content, pupils: number, language: Intake['language']): Content {
  return {
    ...content,
    sections: content.sections.map(section => section.id === 'reflection' ? {
      ...section,
      text: language === 'BM'
        ? `___ / ${pupils} murid mencapai objektif.\nTindakan susulan: ____________________`
        : `___ / ${pupils} pupils achieved the objectives.\nFollow-up: ____________________`
    } : section)
  };
}
