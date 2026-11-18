import { z } from 'zod';
export const standardSchema = z.object({ id:z.string().max(80), year:z.number().int().min(1).max(6), topic:z.string().min(1).max(160), sk:z.string().max(20), skText:z.string().max(2000), sp:z.string().max(20), text:z.string().min(1).max(3000), source:z.string().max(180), page:z.number().int().positive(), status:z.enum(['extracted','reviewed']) });
export type Standard=z.infer<typeof standardSchema>;
export const primarySubjects = [
  'Mathematics', 'Bahasa Melayu', 'English', 'Science', 'History',
  'Islamic Education', 'Moral Education', 'Physical and Health Education',
  'Visual Arts Education', 'Music Education', 'Design and Technology',
  'Chinese', 'Tamil', 'Arabic', 'Kadazandusun', 'Iban', 'Semai'
] as const;
export const intakeSchema=z.object({year:z.number().int().min(1).max(6),subject:z.enum(primarySubjects).optional(),customStandards:z.string().max(3000).optional(),className:z.string().max(80),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),startTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),teachingChoices:z.array(z.string().max(80)).max(30).optional(),duration:z.number().int().min(20).max(180),pupils:z.number().int().min(1).max(60).optional(),language:z.enum(['BM','EN']),ability:z.string().max(800).optional(),resources:z.string().max(800),prior:z.string().max(800),approach:z.string().max(180),counts:z.array(z.number().int().min(1).max(10)).length(3),standardIds:z.array(z.string().max(80)).max(12)}).refine(input=>input.subject&&input.subject!=='Mathematics'?input.standardIds.length===0:input.standardIds.length>0,{path:['standardIds'],message:'Select at least one Mathematics standard or enter standards for another subject.'});
export type Intake=z.infer<typeof intakeSchema>;
export const sectionSchema=z.object({id:z.string().min(1).max(60),title:z.string().min(1).max(160),text:z.string().max(12000),minutes:z.number().int().min(0).max(180).optional()});
export const questionSchema=z.object({question:z.string().min(1).max(2000),answer:z.string().min(1).max(2000),expression:z.string().max(160).optional(),result:z.number().finite().optional()});
export const contentSchema=z.object({title:z.string().min(1).max(180),sections:z.array(sectionSchema).min(1).max(20),worksheets:z.array(z.object({level:z.string().max(80),instructions:z.string().max(600),questions:z.array(questionSchema).min(0).max(10)})).length(3)});
export type Content=z.infer<typeof contentSchema>;
export type Lesson={id:string;intake:Intake;standards:Standard[];content:Content;mode:'sample'|'ai'|'manual';updatedAt:string;revision:number};
export const lessonSchema=z.object({id:z.string().uuid(),intake:intakeSchema,standards:z.array(standardSchema).max(12),content:contentSchema,mode:z.enum(['sample','ai','manual']),updatedAt:z.string().max(60),revision:z.number().int().nonnegative()});
export const profileSchema=z.object({id:z.string().uuid(),name:z.string().min(1).max(80),year:z.number().int().min(1).max(6),pupils:z.number().int().min(1).max(60),ability:z.string().max(800),resources:z.string().max(800)});
export type Profile=z.infer<typeof profileSchema>;
export type Template={headings:Record<string,string>;hidden:string[]};
export const templateSchema=z.object({headings:z.record(z.string().max(160)),hidden:z.array(z.string().max(60)).max(20)});
