import type { Content, Intake, Standard } from './model';
// A bounded arithmetic parser: never evaluates arbitrary code or model output.
export function calculate(expression:string):number|null {
 const cleaned=expression.replace(/×/g,'*').replace(/÷/g,'/').replace(/\s/g,'');
 const tokens=cleaned.match(/\d+(?:\.\d+)?|[()+*/-]/g);
 if(!tokens||tokens.join('')!==cleaned||tokens.length>80)return null;
 let at=0;
 function atom():number {if(tokens![at]==='('){at++;const n=sum();if(tokens![at++]!==')')throw Error();return n;}if(tokens![at]==='-'){at++;return -atom();}const v=tokens![at++];if(!/^\d/.test(v||''))throw Error();return Number(v);}
 function product():number {let n=atom();while(tokens![at]==='*'||tokens![at]==='/'){const op=tokens![at++];const v=atom();n=op==='*'?n*v:n/v;}return n;}
 function sum():number {let n=product();while(tokens![at]==='+'||tokens![at]==='-'){const op=tokens![at++];const v=product();n=op==='+'?n+v:n-v;}return n;}
 try{const n=sum();return at===tokens.length&&Number.isFinite(n)?Math.round(n*1e8)/1e8:null;}catch{return null;}
}
export function distributeMinutes(total:number):number[]{const middle=total-10;const a=Math.round(middle*.3),b=Math.round(middle*.3);return [5,a,b,middle-a-b,5];}
export function overloadWarning(intake:Intake):boolean{return intake.standardIds.length>Math.max(1,Math.floor(intake.duration/20));}
export function qualityCheck(content:Content,intake:Intake,standards:Standard[]):string[]{
 const warnings:string[]=[];
 const duration=content.sections.reduce((s,x)=>s+(x.minutes||0),0);
 if(duration!==intake.duration)warnings.push(`Lesson timings total ${duration} minutes; expected ${intake.duration}.`);
 if(standards.some(s=>s.status!=='reviewed'))warnings.push('Curriculum entries were extracted from your PDFs. Teacher review against the source pages is still required.');
 if(overloadWarning(intake))warnings.push('Several SP are selected for this duration. Consider splitting the lesson.');
 for(const w of content.worksheets)for(const q of w.questions){if(!q.expression){warnings.push('Some worksheet solutions require teacher checking; automatic checking supports arithmetic expressions only.');break;}const n=calculate(q.expression);if(n===null||q.result===undefined||Math.abs(n-q.result)>1e-6)warnings.push('A worksheet expression or numeric result needs correction.');}
 warnings.push('Teacher review required: SP alignment, language, suitability and word-problem reasoning are not automatically certified.');
 return [...new Set(warnings)];
}
export function correctArithmetic(content:Content):{content:Content;corrections:string[]}{
 const copy=structuredClone(content);const corrections:string[]=[];
 for(const w of copy.worksheets)for(const q of w.questions){if(!q.expression)continue;const n=calculate(q.expression);if(n!==null&&q.result!==n){q.result=n;q.answer=`Arithmetic check: ${q.expression} = ${n}. Review the word-problem reasoning before classroom use.`;corrections.push(`Numeric result corrected to ${n}; review the written solution.`);}}
 return {content:copy,corrections};
}
