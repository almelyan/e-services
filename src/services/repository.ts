import seed from '../data/seed.json';
import type { Database, DemoUser, ServiceRequest, Card, CompanyEmployee, RequestStatus, Permission, RequestAttachment } from '../models';
export const users:DemoUser[] = [
 {id:'entry',name:'أحمد محمد',role:'موظف استقبال الطلبات',permissions:['create']},
 {id:'operations',name:'محمد سالم',role:'موظف تشغيل البطاقات',permissions:['operate']},
 {id:'supervisor',name:'فاطمة علي',role:'مشرف النظام',permissions:['create','operate','reset']}
];
export const statusLabels:Record<RequestStatus,string>={Pending:'قيد الانتظار',InProgress:'قيد التنفيذ',Completed:'مكتمل',Rejected:'مرفوض',Cancelled:'ملغي'};
export const cardLabels={Active:'نشطة',Suspended:'موقوفة',Cancelled:'ملغاة',Replaced:'مستبدلة'};
export const today=()=>new Date().toISOString().slice(0,10);
export const mask=(last4:string)=>`**** **** **** ${last4}`;
const key='madar-bank-demo-v1';
export class LocalRepository {
 private db:Database;
 constructor(private storage:Pick<Storage,'getItem'|'setItem'>){
  const saved=storage.getItem(key);
  try {const parsed=saved?JSON.parse(saved):null;this.db=parsed?.version===1?parsed:structuredClone(seed) as Database;}catch{this.db=structuredClone(seed) as Database;}
 }
 snapshot(){return structuredClone(this.db);}
 user(){return users.find(u=>u.id===this.storage.getItem('madar-user'))||users[0];}
 setUser(id:string){if(!users.some(u=>u.id===id))throw Error('المستخدم غير موجود');this.storage.setItem('madar-user',id);}
 private require(user:DemoUser,p:Permission){if(!users.find(u=>u.id===user.id)?.permissions.includes(p))throw Error('لا تملك صلاحية تنفيذ هذا الإجراء');}
 private commit(action:(db:Database)=>void){const next=this.snapshot();action(next);try{this.storage.setItem(key,JSON.stringify(next));}catch{throw Error('تعذر الحفظ المحلي. جرّب ملفاً أصغر أو حرّر مساحة المتصفح.');}this.db=next;}
 private history(r:ServiceRequest,user:DemoUser,text:string){r.updatedAt=new Date().toISOString();r.history.push({id:crypto.randomUUID(),at:r.updatedAt,actor:user.name,text});}
 reset(user:DemoUser){this.require(user,'reset');this.commit(db=>Object.assign(db,structuredClone(seed)));}
 addEmployee(employee:Omit<CompanyEmployee,'id'>,user:DemoUser){this.require(user,'create');const id=`EMP-${crypto.randomUUID().slice(0,6)}`;if(!employee.name.trim()||!employee.nationalId.trim()||!employee.englishName.trim())throw Error('أكمل بيانات الموظف');this.commit(db=>{if(!db.companies.some(c=>c.id===employee.companyId))throw Error('الشركة غير موجودة');db.employees.push({...employee,id});});return id;}
 create(input:Pick<ServiceRequest,'companyId'|'accountId'|'serviceId'|'details'|'notes'>,user:DemoUser){
  this.require(user,'create');let id='';this.commit(db=>{
   if(!db.companies.some(c=>c.id===input.companyId)||!db.accounts.some(a=>a.id===input.accountId&&a.companyId===input.companyId))throw Error('اختر الشركة والحساب الصحيح');
   if(!db.services.some(s=>s.id===input.serviceId))throw Error('اختر الخدمة');
   const d=input.details,c=db.cards.find(c=>c.id===d.cardId&&c.companyId===input.companyId);
   if(input.serviceId!=='issue'&&!c)throw Error('اختر بطاقة تابعة للشركة');
   if(d.employeeId&&!db.employees.some(e=>e.id===d.employeeId&&e.companyId===input.companyId))throw Error('الموظف غير تابع للشركة');
   if(input.serviceId==='issue'&&!d.printedName?.trim())throw Error('أدخل الاسم المطبوع');
   if(['replace','status'].includes(input.serviceId)&&!d.reason?.trim())throw Error('أدخل سبب الطلب');
   if(input.serviceId==='replace'&&c?.status==='Replaced')throw Error('سبق استبدال هذه البطاقة');
   if(input.serviceId==='status'&&!['Active','Suspended','Cancelled'].includes(d.requestedStatus||''))throw Error('اختر الحالة المطلوبة');
   if(input.serviceId==='topup'&&(!Number.isFinite(d.amount)||d.amount!<=0))throw Error('أدخل مبلغاً أكبر من صفر');
   if(input.serviceId==='deliver'&&c?.delivered)throw Error('تم تسليم البطاقة مسبقاً');
   if(input.serviceId==='statement'&&(!d.from||!d.to||d.from>d.to))throw Error('حدد فترة صحيحة لكشف الحساب');
   const sequence=Math.max(0,...db.requests.map(r=>Number(r.id.split('-').at(-1))))+1;
   id=`SR-${new Date().getFullYear()}-${String(sequence).padStart(6,'0')}`;
   const at=new Date().toISOString();const r:ServiceRequest={...input,id,status:'Pending',createdAt:at,updatedAt:at,createdBy:user.name,history:[],attachments:[]};this.history(r,user,'تم إنشاء الطلب وإرساله للتنفيذ');db.requests.unshift(r);
  });return id;
 }
 addCard(input:Omit<Card,'id'|'source'>,user:DemoUser,requestId?:string){
  this.require(user,'operate');let id='';this.commit(db=>{
   if(!/^\d{4}$/.test(input.last4)||!input.reference.trim()||!input.holder.trim()||!input.printedName.trim()||!input.issuedAt||input.expiresAt<=input.issuedAt)throw Error('تحقق من بيانات البطاقة وتواريخها');
   if(db.cards.some(c=>c.reference===input.reference))throw Error('الرقم المرجعي مسجل مسبقاً');
   if(!db.companies.some(c=>c.id===input.companyId)||input.employeeId&&!db.employees.some(e=>e.id===input.employeeId&&e.companyId===input.companyId))throw Error('تحقق من الشركة والموظف');
   const r=requestId?db.requests.find(r=>r.id===requestId):undefined;
   if(requestId&&(!r||r.status!=='InProgress'||!['issue','replace'].includes(r.serviceId)||r.issuedCardId||r.companyId!==input.companyId))throw Error('لا يمكن إدخال بطاقة لهذا الطلب');
   const old=r?.serviceId==='replace'?db.cards.find(c=>c.id===r.details.cardId):undefined;
   id=crypto.randomUUID();db.cards.push({...input,id,source:r?'Request':'Manual',requestId:r?.id,employeeId:r?(old?.employeeId||r.details.employeeId):input.employeeId,replacementForCardId:old?.id});
   if(r){r.issuedCardId=id;this.history(r,user,'تم إدخال بيانات البطاقة الصادرة');}
  });return id;
 }
 saveOperation(id:string,details:ServiceRequest['details'],notes:string,user:DemoUser){this.require(user,'operate');this.commit(db=>{const r=db.requests.find(r=>r.id===id);if(!r||r.status!=='InProgress')throw Error('ابدأ التنفيذ أولاً');const allowed:ServiceRequest['details']={};if(r.serviceId==='topup')Object.assign(allowed,{result:details.result,transactionReference:details.transactionReference,executionDate:details.executionDate});if(r.serviceId==='pin')allowed.externalConfirmed=details.externalConfirmed;if(r.serviceId==='deliver')Object.assign(allowed,{recipient:details.recipient,identity:details.identity,deliveryDate:details.deliveryDate});Object.assign(r.details,allowed);if(notes.trim())r.notes+=`\n${notes.trim()}`;this.history(r,user,'تم حفظ نتيجة العملية الخارجية');});}
 attach(id:string,attachment:RequestAttachment,user:DemoUser){this.require(user,'operate');this.commit(db=>{const r=db.requests.find(r=>r.id===id);if(!r||r.status!=='InProgress'||r.serviceId!=='statement')throw Error('لا يمكن إرفاق الكشف في هذه الحالة');r.attachments.push(attachment);this.history(r,user,'تم رفع كشف الحساب');});}
 transition(id:string,next:RequestStatus,user:DemoUser,reason=''){
  this.require(user,next==='Cancelled'?'create':'operate');this.commit(db=>{const r=db.requests.find(r=>r.id===id);if(!r)throw Error('الطلب غير موجود');
   if(next==='Cancelled'&&r.status!=='Pending'||next==='InProgress'&&r.status!=='Pending'||next==='Rejected'&&!['Pending','InProgress'].includes(r.status)||next==='Completed'&&r.status!=='InProgress'||next==='Pending')throw Error('انتقال الحالة غير مسموح');
   if(['Rejected','Cancelled'].includes(next)&&!reason.trim())throw Error('أدخل السبب');
   if(['Rejected','Cancelled'].includes(next)&&r.issuedCardId)throw Error('تم تسجيل البطاقة الصادرة؛ أكمل الطلب للحفاظ على اتساق السجل');
   const d=r.details,c=db.cards.find(c=>c.id===d.cardId);
   if(next==='Completed'){
    if(['issue','replace'].includes(r.serviceId)&&!r.issuedCardId)throw Error('أدخل بيانات البطاقة الصادرة أولاً');
    if(r.serviceId==='replace'){if(!c||c.status==='Replaced')throw Error('البطاقة الأصلية مستبدلة بالفعل');c.status='Replaced';}
    if(r.serviceId==='status'){if(!c||!d.requestedStatus)throw Error('بيانات الحالة غير مكتملة');c.status=d.requestedStatus;}
    if(r.serviceId==='pin'&&!d.externalConfirmed)throw Error('أكد تنفيذ عملية الرمز السري خارجياً');
    if(r.serviceId==='topup'&&(d.result!=='success'||!d.transactionReference?.trim()||!d.executionDate))throw Error('سجل نجاح العملية والمرجع وتاريخ التنفيذ');
    if(r.serviceId==='deliver'){if(!c||c.delivered||!d.recipient?.trim()||!d.identity?.trim()||!d.deliveryDate)throw Error('تحقق من بيانات التسليم وأن البطاقة لم تسلم مسبقاً');c.delivered=true;}
    if(r.serviceId==='statement'&&!r.attachments.length)throw Error('ارفع كشف الحساب أولاً');
   }
   r.status=next;if(next==='Rejected')r.rejectionReason=reason;this.history(r,user,`${statusLabels[next]}${reason?` — ${reason}`:''}`);
  });
 }
}
export const repository = new LocalRepository(typeof localStorage==='undefined'?{getItem:()=>null,setItem:()=>{}}:localStorage);
