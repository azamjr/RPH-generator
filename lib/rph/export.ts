import type { Lesson,Template } from './model';
export type ExportPart='lesson'|'worksheets'|'answers'|'all';
type Block={heading?:string;text?:string;page?:boolean};
export function exportBlocks(lesson:Lesson,template:Template,part:ExportPart):Block[]{
 const en=lesson.intake.language==='EN';const blocks:Block[]=[];
 if(lesson.mode==='sample')blocks.push({heading:en?'ARITHMETIC SAMPLE — NOT ALIGNED TO SELECTED SP':'CONTOH OPERASI ASAS — BELUM DIJAJARKAN KEPADA SP'});
 if(part==='lesson'||part==='all'){
 blocks.push({heading:en?'DAILY LESSON PLAN · MATHEMATICS':'RANCANGAN PENGAJARAN HARIAN · MATEMATIK'},{heading:lesson.content.title},{text:`${en?'Class':'Kelas'}: ${lesson.intake.className} | ${en?'Year':'Tahun'} ${lesson.intake.year}\n${en?'Date':'Tarikh'}: ${lesson.intake.date}${lesson.intake.startTime?' '+lesson.intake.startTime:''} | ${lesson.intake.duration} ${en?'minutes':'minit'} | ${lesson.intake.pupils} ${en?'pupils':'murid'}`});
 blocks.push({heading:en?'Curriculum references (English source text)':'Rujukan kurikulum (teks sumber Bahasa Inggeris)'});
 lesson.standards.forEach(s=>blocks.push({text:`SK ${s.sk}: ${s.skText}\nSP ${s.sp}: ${s.text}\n${s.source}, PDF p. ${s.page}. Status: extracted; teacher review required.`}));
 lesson.content.sections.filter(s=>!template.hidden.includes(s.id)).forEach(s=>blocks.push({heading:`${template.headings[s.id]||s.title}${s.minutes?` (${s.minutes} ${en?'min':'minit'})`:''}`,text:s.text}));
 }
 if(part==='worksheets'||part==='all')lesson.content.worksheets.forEach(w=>{blocks.push({page:blocks.length>0,heading:`${en?'WORKSHEET':'LEMBARAN KERJA'} · ${w.level}`},{text:`${en?'Name':'Nama'}: ____________________   ${en?'Class':'Kelas'}: __________\n${w.instructions}`});w.questions.forEach((q,i)=>blocks.push({text:`${i+1}. ${q.question}\n\n________________________________________________\n\n________________________________________________\n`}));});
 if(part==='answers'||part==='all'){blocks.push({page:blocks.length>0,heading:en?'ANSWER KEY · TEACHER COPY':'SKEMA JAWAPAN · SALINAN GURU'});lesson.content.worksheets.forEach(w=>{blocks.push({heading:w.level});w.questions.forEach((q,i)=>blocks.push({text:`${i+1}. ${q.question}\n${q.answer}${q.result!==undefined?`\n${en?'Numeric check':'Semakan nombor'}: ${q.result}`:''}`}));});}
 return blocks;
}
export async function downloadDocx(lesson:Lesson,template:Template,part:ExportPart){const {Document,Packer,Paragraph,TextRun,HeadingLevel}=await import('docx');const blocks=exportBlocks(lesson,template,part);const doc=new Document({styles:{default:{document:{run:{font:'Arial',size:22},paragraph:{spacing:{after:120,line:360}}}}},sections:[{properties:{page:{margin:{top:900,bottom:900,left:1000,right:1000}}},children:blocks.flatMap(b=>{const p=[];if(b.heading)p.push(new Paragraph({heading:HeadingLevel.HEADING_2,keepNext:true,keepLines:true,pageBreakBefore:b.page,children:[new TextRun({text:b.heading,bold:true,color:'194D41'})]}));if(b.text)for(const line of b.text.split('\n'))p.push(new Paragraph({children:[new TextRun(line)]}));return p;})}]});save(await Packer.toBlob(doc),`RPH-T${lesson.intake.year}-${part}.docx`);}
export async function downloadPdf(lesson:Lesson,template:Template,part:ExportPart){
 const {jsPDF}=await import('jspdf');const doc=new jsPDF({unit:'mm',format:'a4'});let y=20;
 for(const block of exportBlocks(lesson,template,part)){
  if(block.page){doc.addPage();y=20;}
  for(const item of [{text:block.heading,heading:true},{text:block.text,heading:false}]){
   if(!item.text)continue;
   if(item.heading){if(y>260){doc.addPage();y=20;}doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor('#194d41');}
   else{doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor('#242e2c');}
   const safe=item.text.replace(/[–—−]/g,'-').replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/×/g,'x').replace(/÷/g,'/').replace(/→/g,'>').replace(/≤/g,'<=').replace(/≥/g,'>=').replace(/✓/g,'[x]');
   for(const line of doc.splitTextToSize(safe,170)){if(y>277){doc.addPage();y=20;}doc.text(line,20,y);y+=item.heading?6:5;}y+=4;
  }
 }
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor('#77817d');doc.text(`RPH Studio | ${i} / ${pages}`,20,289);}doc.save(`RPH-T${lesson.intake.year}-${part}.pdf`);
}
function save(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
