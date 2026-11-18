import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessonPrompt, resetReflection } from '../lib/rph/prompt.ts';
import { lessonSchema } from '../lib/rph/model.ts';
import { sampleContent } from '../lib/rph/sample.ts';
const intake={year:4,className:'4 Test',date:'2026-11-18',duration:60,pupils:30,language:'EN' as const,ability:'Mixed',resources:'Graph paper',prior:'Counting',approach:'Gallery Walk',counts:[3,3,2],standardIds:['test']};
const standard={id:'test',year:4,topic:'Data',sk:'8.1',skText:'Graphs',sp:'8.1.1',text:'Construct bar charts.',source:'source.pdf',page:1,status:'extracted' as const};
test('prompt carries selected standards and teaching choices without class identifiers',()=>{
 const prompt=lessonPrompt(intake,[standard]);
 assert.ok(prompt.includes('Construct bar charts.'));
 assert.ok(prompt.includes('Gallery Walk'));
 assert.ok(prompt.includes('Graph paper'));
 assert.ok(!prompt.includes('4 Test'));
});
test('reusing clears old outcomes and preserves the original content',()=>{
 const original=sampleContent(intake,[standard]);
 original.sections.find(s=>s.id==='reflection')!.text='30 pupils achieved the objectives';
 const copy=resetReflection(original,25,'EN');
 assert.ok(copy.sections.find(s=>s.id==='reflection')!.text.includes('___ / 25'));
 assert.equal(original.sections.find(s=>s.id==='reflection')!.text,'30 pupils achieved the objectives');
});
test('manual drafts and older sample lessons remain valid for storage',()=>{
 const content=sampleContent(intake,[standard]);
 const old={id:'c3d79991-57b8-4b42-b15d-485cf4f623dd',intake,standards:[standard],content,mode:'sample',updatedAt:'2026-11-18',revision:0};
 assert.ok(lessonSchema.safeParse(old).success);
 assert.ok(lessonSchema.safeParse({...old,mode:'manual',content:{...content,worksheets:content.worksheets.map(w=>({...w,questions:[]}))}}).success);
});
