import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { BedDouble, Plus, RefreshCw, Search, Pencil, Archive, X, Save, CalendarCheck2, Wallet, LayoutGrid, FileBarChart2, ReceiptText, ContactRound, CalendarDays, CalendarPlus, FilePlus2, Trash2, Banknote, Droplets, Zap, UserRoundPlus, UserRoundCheck, SlidersHorizontal, Home, Map as MapIcon } from "lucide-react";

const COMPANY_ID = "61bed49c-bc21-476a-865b-1d28db791ad2";
type Room = { id:string; room_number:string; apartment_number:string|null; building_name:string|null; room_type:string|null; beds_count:number; rent_amount:number; rent_period:string; area_sqm:number|null; room_status:string; rental_mode:"full"|"bed"; region:string|null; city:string|null; district_street:string|null; nearest_landmark:string|null; owner_id:string|null; notes:string|null; archived_at:string|null };
type Bed = { id:string; room_id:string; bed_number:string; status:string; notes:string|null };
type Lease = { id:string; room_id:string; bed_id:string|null; tenant_id:string; start_date:string; end_date:string; status:string; rent_amount:number; contract_number?:string|null; contract_type?:string|null; owner_id?:string|null; rent_period?:string|null; contract_duration?:string|null; notes?:string|null; archived_at?:string|null };
type Booking = { id:string; room_id:string; bed_id:string|null; tenant_id:string; start_date:string; end_date:string; booking_status:string };
type Tenant = {id:string; full_name:string; phone?:string|null; identity_number?:string|null; nationality?:string|null; email?:string|null; notes?:string|null};
type Owner = {id:string; full_name:string; mobile?:string|null; phone?:string|null; identity_number?:string|null; nationality?:string|null; email?:string|null};
type RoomForm = Omit<Room,"id"|"archived_at">;
const blank:RoomForm = {room_number:"",apartment_number:"",building_name:"",room_type:"",beds_count:1,rent_amount:0,rent_period:"شهري",area_sqm:null,room_status:"متاحة",rental_mode:"full",region:"",city:"",district_street:"",nearest_landmark:"",owner_id:null,notes:""};
type LocationOption = {id:number;kind:string;name:string;region_name:string|null};
const SA_REGIONS = ["الرياض","مكة المكرمة","المدينة المنورة","القصيم","الشرقية","عسير","تبوك","حائل","الحدود الشمالية","جازان","نجران","الباحة","الجوف"];
const DEFAULT_ROOM_OPTIONS:Record<string,string[]> = {room_type:["مفردة","مزدوجة"],rental_mode:["الغرفة بالكامل","بالسرير"],rent_period:["يومي","أسبوعي","شهري","سنوي"],room_status:["متاحة","مؤجرة","محجوزة","صيانة"]};
const money=(v:number)=>new Intl.NumberFormat("ar-SA",{maximumFractionDigits:2}).format(v);
const today=()=>new Date().toLocaleDateString("en-CA");
const field="w-full rounded-xl border border-amber-300/25 bg-[#062c24] px-3 py-2 text-white outline-none focus:border-amber-300";
const label="mb-1 block text-xs font-bold text-emerald-100/80";

export default function Rooms(){
 const navigate=useNavigate();
 const [rooms,setRooms]=useState<Room[]>([]),[beds,setBeds]=useState<Bed[]>([]),[leases,setLeases]=useState<Lease[]>([]),[bookings,setBookings]=useState<Booking[]>([]),[tenants,setTenants]=useState<Tenant[]>([]),[owners,setOwners]=useState<Owner[]>([]);
 const [refreshing,setRefreshing]=useState(false),[refreshToast,setRefreshToast]=useState("");
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[canWrite,setCanWrite]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [search,setSearch]=useState(""),[filter,setFilter]=useState("الكل"),[showArchived,setShowArchived]=useState(false);
 const [archivePicker,setArchivePicker]=useState(false);
 const [archiveView,setArchiveView]=useState<"active"|"archived">("active");
 const [archiveSearch,setArchiveSearch]=useState("");
 const [archiveSelection,setArchiveSelection]=useState<string[]>([]);
 const [archiveConfirm,setArchiveConfirm]=useState(false);
 const [archiveBusy,setArchiveBusy]=useState(false);
 const [editing,setEditing]=useState<string|null>(null),[modal,setModal]=useState(false),[form,setForm]=useState<RoomForm>(blank);
 const [roomTab,setRoomTab]=useState<"room"|"owner">("room");
 const [ownerMode,setOwnerMode]=useState<"existing"|"new">("existing");
 const [newOwner,setNewOwner]=useState({full_name:"",mobile:"",phone:"",email:"",nationality:"",identity_number:""});
 const [bedRoom,setBedRoom]=useState<Room|null>(null),[newBed,setNewBed]=useState(""),[bedBusy,setBedBusy]=useState(false);
 const [report,setReport]=useState<string|null>(null);
  const [reportPerson,setReportPerson]=useState<{kind:"tenant"|"owner";id:string;mode:"view"|"edit"|"delete"}|null>(null);
  const [personForm,setPersonForm]=useState({full_name:"",phone:"",mobile:"",identity_number:"",nationality:"",email:"",notes:""});
  const [personBusy,setPersonBusy]=useState(false);
  const [personError,setPersonError]=useState("");
  const openReportPerson=(kind:"tenant"|"owner",id:string,mode:"view"|"edit"|"delete")=>{
   const person=kind==="tenant"?tenants.find(t=>t.id===id):owners.find(o=>o.id===id);
   if(!person)return;
   setPersonForm({full_name:person.full_name||"",phone:person.phone||"",mobile:("mobile" in person?person.mobile:"")||"",identity_number:person.identity_number||"",nationality:person.nationality||"",email:person.email||"",notes:("notes" in person?person.notes:"")||""});
   setPersonError("");setReportPerson({kind,id,mode});
  };
  const saveReportPerson=async()=>{
   if(!reportPerson||!canWrite||personBusy)return;
   const {kind,id,mode}=reportPerson;
   const isTenant=kind==="tenant";
   const table=isTenant?"residential_tenants":"property_owners";
   if(mode==="view")return;
   if(mode==="edit"&&!personForm.full_name.trim()){setPersonError("الاسم مطلوب.");return;}
   if(mode==="edit"&&personForm.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personForm.email.trim())){setPersonError("البريد الإلكتروني غير صحيح.");return;}
   if(mode==="delete"){
    const [linkedContracts,linkedBookings,linkedRooms,linkedApartments,linkedApartmentContracts]=await Promise.all([
     supabase.from("residential_room_contracts").select("id").eq("company_id",COMPANY_ID).eq(isTenant?"tenant_id":"owner_id",id).limit(1),
     isTenant?supabase.from("residential_room_bookings").select("id").eq("company_id",COMPANY_ID).eq("tenant_id",id).limit(1):Promise.resolve({data:[],error:null}),
     isTenant?Promise.resolve({data:[],error:null}):supabase.from("residential_rooms").select("id").eq("company_id",COMPANY_ID).eq("owner_id",id).limit(1),
     isTenant?Promise.resolve({data:[],error:null}):supabase.from("residential_apartments").select("id").eq("company_id",COMPANY_ID).eq("owner_id",id).limit(1),
     supabase.from("residential_contracts").select("id").eq("company_id",COMPANY_ID).eq(isTenant?"tenant_id":"owner_id",id).limit(1)
    ]);
    const checks=[linkedContracts,linkedBookings,linkedRooms,linkedApartments,linkedApartmentContracts];
    if(checks.some(x=>x.error)){setPersonError("تعذر التحقق من ارتباطات السجل. لم يتم الحذف.");return;}
    if(checks.some(x=>(x.data||[]).length)){setPersonError("لا يمكن حذف السجل لأنه مرتبط بعقد أو حجز أو وحدة عقارية. احتفظ به لحماية البيانات.");return;}
   }
   setPersonBusy(true);setPersonError("");
   const payload=isTenant?{full_name:personForm.full_name.trim(),phone:personForm.phone.trim()||null,identity_number:personForm.identity_number.trim()||null,nationality:personForm.nationality.trim()||null,email:personForm.email.trim()||null,notes:personForm.notes.trim()||null}:{full_name:personForm.full_name.trim(),mobile:personForm.mobile.trim()||null,phone:personForm.phone.trim()||null,identity_number:personForm.identity_number.trim()||null,nationality:personForm.nationality.trim()||null,email:personForm.email.trim()||null};
   const result=mode==="delete"?await supabase.from(table).delete().eq("company_id",COMPANY_ID).eq("id",id).select("id"):await supabase.from(table).update(payload).eq("company_id",COMPANY_ID).eq("id",id).select("id");
   setPersonBusy(false);
   if(result.error){setPersonError("تعذرت العملية: "+result.error.message);return;}
   if(!result.data?.length){setPersonError("لم يتم تعديل أي سجل. تحقق من الصلاحيات.");return;}
   setReportPerson(null);setNotice(mode==="delete"?"تم حذف السجل بنجاح.":"تم تحديث البيانات بنجاح.");await load();
  };

 const [contractArchiveTab,setContractArchiveTab]=useState<"current"|"archive">("current");
  const [reportContractDetails,setReportContractDetails]=useState<Lease|null>(null);
 const [editingReportContract,setEditingReportContract]=useState<Lease|null>(null);
  type ContractEditForm = {contract_number:string;contract_type:string;room_id:string;bed_id:string;tenant_id:string;owner_id:string;start_date:string;end_date:string;status:string;rent_amount:string;rent_period:string;contract_duration:string;notes:string};
  type ContractEditInstallment = {id:string|null;installment_no:number;due_date:string;amount:string;paid:number};
  const [reportContractForm,setReportContractForm]=useState<ContractEditForm>({contract_number:"",contract_type:"إيجار",room_id:"",bed_id:"",tenant_id:"",owner_id:"",start_date:"",end_date:"",status:"نشط",rent_amount:"0",rent_period:"شهري",contract_duration:"شهري",notes:""});
  const [reportContractInstallments,setReportContractInstallments]=useState<ContractEditInstallment[]>([]);
  const [reportContractLoading,setReportContractLoading]=useState(false);
  const [reportContractBusy,setReportContractBusy]=useState(false);
  const [reportContractError,setReportContractError]=useState("");
  const openReportContractEdit=async(contract:Lease)=>{
   setReportContractError("");setEditingReportContract(contract);setReportContractLoading(true);
   setReportContractForm({contract_number:contract.contract_number||"",contract_type:contract.contract_type||"إيجار",room_id:contract.room_id,bed_id:contract.bed_id||"",tenant_id:contract.tenant_id,owner_id:contract.owner_id||"",start_date:contract.start_date,end_date:contract.end_date,status:contract.status,rent_amount:String(contract.rent_amount),rent_period:contract.rent_period||"شهري",contract_duration:contract.contract_duration||"شهري",notes:contract.notes||""});
   setReportContractInstallments([]);
   const [inst,alloc]=await Promise.all([
    supabase.from("residential_room_installments").select("id,installment_no,due_date,amount").eq("company_id",COMPANY_ID).eq("contract_id",contract.id).order("installment_no"),
    supabase.from("residential_room_allocations").select("installment_id,amount").eq("company_id",COMPANY_ID)
   ]);
   if(inst.error||alloc.error)setReportContractError("تعذر تحميل الاستحقاقات والتحصيلات: "+(inst.error?.message||alloc.error?.message));
   else setReportContractInstallments((inst.data||[]).map(x=>({id:x.id,installment_no:x.installment_no,due_date:x.due_date,amount:String(x.amount),paid:(alloc.data||[]).filter(a=>a.installment_id===x.id).reduce((sum,a)=>sum+Number(a.amount||0),0)})));
   setReportContractLoading(false);
  };
  const saveReportContractEdit=async()=>{
   if(!editingReportContract||!canWrite||reportContractBusy)return;
   const f=reportContractForm;
   const amount=Number(f.rent_amount);
   if(!f.contract_number.trim()||!f.room_id||!f.tenant_id||!f.start_date||!f.end_date||f.end_date<=f.start_date){setReportContractError("راجع رقم العقد والغرفة والمستأجر وتواريخ البداية والنهاية.");return;}
   if(!Number.isFinite(amount)||amount<0||Math.round(amount*100)!==amount*100){setReportContractError("قيمة العقد يجب أن تكون مبلغًا صحيحًا حتى خانتين عشريتين.");return;}
   if(!reportContractInstallments.length){setReportContractError("يجب وجود قسط واحد على الأقل.");return;}
   const sorted=[...reportContractInstallments].sort((a,b)=>a.due_date.localeCompare(b.due_date));
   if(sorted.some((x,i)=>!/^\d{4}-\d{2}-\d{2}$/.test(x.due_date)||x.due_date<f.start_date||x.due_date>=f.end_date||(i>0&&x.due_date<=sorted[i-1].due_date)||!Number.isFinite(Number(x.amount))||Number(x.amount)<0||Math.round(Number(x.amount)*100)!==Number(x.amount)*100||Number(x.amount)+0.00001<x.paid)){
    setReportContractError("راجع تواريخ الأقساط وترتيبها ومبالغها؛ لا يمكن أن يقل أي قسط عن المبلغ المحصل منه.");return;
   }
   const totalCents=sorted.reduce((sum,x)=>sum+Math.round(Number(x.amount)*100),0);
   if(totalCents!==Math.round(amount*100)){setReportContractError("مجموع الأقساط يجب أن يساوي قيمة العقد.");return;}
   const selectedRoom=rooms.find(r=>r.id===f.room_id);
   if(selectedRoom?.rental_mode==="bed"&&!f.bed_id){setReportContractError("اختر السرير الخاص بالعقد.");return;}
   setReportContractBusy(true);setReportContractError("");
   const {error:dbError}=await supabase.rpc("update_room_contract_with_installments",{
    p_company_id:COMPANY_ID,p_contract_id:editingReportContract.id,
    p_contract_number:f.contract_number.trim(),p_contract_type:f.contract_type.trim()||"إيجار",
    p_room_id:f.room_id,p_bed_id:f.bed_id||null,p_tenant_id:f.tenant_id,p_owner_id:f.owner_id||null,
    p_start_date:f.start_date,p_end_date:f.end_date,p_status:f.status,p_rent_amount:amount,
    p_rent_period:f.rent_period,p_contract_duration:f.contract_duration,p_notes:f.notes.trim()||null,
    p_installments:sorted.map((x,i)=>({id:x.id,installment_no:i+1,due_date:x.due_date,amount:Number(x.amount)}))
   });
   setReportContractBusy(false);
   if(dbError){setReportContractError("تعذر حفظ التعديل: "+dbError.message+". تأكد من تشغيل ملف SQL المرفق.");return;}
   setEditingReportContract(null);setNotice("تم تحديث العقد وجدول الاستحقاقات في عملية واحدة.");await load();
  };
 const deletableContractStatuses=["متوقف","موقوف","منتهي","منتهٍ","منتهية","ملغي","ملغى","ملغاة"];
 const canDeleteReportContract=(contract:Lease)=>deletableContractStatuses.includes(contract.status.trim());
  const deleteReportContract=async(contract:Lease)=>{
   if(!canWrite){setNotice("ليس لديك صلاحية أرشفة العقود.");return;}
   if(!canDeleteReportContract(contract)){setNotice("لا يمكن أرشفة العقد النشط؛ يجب أن يكون متوقفًا أو منتهيًا أو ملغيًا.");return;}
   if(reportContractBusy)return;
   if(!window.confirm(`نقل العقد رقم ${contract.contract_number||"—"} إلى الأرشيف؟ ستظل الأقساط والتحصيلات محفوظة ويمكن استعادته.`))return;
   setReportContractBusy(true);
   try{
    const result=await supabase.from("residential_room_contracts").update({archived_at:new Date().toISOString()}).eq("company_id",COMPANY_ID).eq("id",contract.id).is("archived_at",null).in("status",deletableContractStatuses).select("id");
    if(result.error){setNotice("تعذرت الأرشفة: "+result.error.message);return;}
    if(!result.data?.length){setNotice("لم تتم الأرشفة؛ ربما تغيرت حالة العقد أو تمت أرشفته بالفعل.");return;}
    setNotice("تم نقل العقد إلى الأرشيف مع الاحتفاظ بجميع بياناته المالية.");await load();
   }catch(e){setNotice("حدث خطأ أثناء الأرشفة: "+String(e));}
   finally{setReportContractBusy(false);}
  };
  const restoreReportContract=async(contract:Lease)=>{
   if(!canWrite||reportContractBusy)return;
   if(!window.confirm(`استعادة العقد رقم ${contract.contract_number||"—"} إلى العقود الحالية؟`))return;
   setReportContractBusy(true);
   try{
    const result=await supabase.from("residential_room_contracts").update({archived_at:null}).eq("company_id",COMPANY_ID).eq("id",contract.id).not("archived_at","is",null).select("id");
    if(result.error){setNotice("تعذرت الاستعادة: "+result.error.message);return;}
    if(!result.data?.length){setNotice("لم تتم الاستعادة؛ تأكد من صلاحياتك وحالة العقد.");return;}
    setNotice("تمت استعادة العقد بجميع بياناته وأقساطه وتحصيلاته.");await load();
   }catch(e){setNotice("حدث خطأ أثناء الاستعادة: "+String(e));}
   finally{setReportContractBusy(false);}
  };

 const [reportSearch,setReportSearch]=useState("");
 const [roomReportStatuses,setRoomReportStatuses]=useState<string[]>(["متاحة","مؤجرة","محجوزة","صيانة"]);
 const [reportRoomDetails,setReportRoomDetails]=useState<Room|null>(null);
 const [financial,setFinancial]=useState<{installments:any[];allocations:any[];charges:any[];payments:any[];error:string;loading:boolean}>({installments:[],allocations:[],charges:[],payments:[],error:"",loading:true});
 const [operation,setOperation]=useState<"contract"|"booking"|null>(null),[operationRoom,setOperationRoom]=useState<Room|null>(null);
 const [contractRoomSelection,setContractRoomSelection]=useState("");
 const [bookingRoomSelection,setBookingRoomSelection]=useState("");
 const [contractDuration,setContractDuration]=useState("شهري");
 const [contractNotes,setContractNotes]=useState("");
 const [contractType,setContractType]=useState("إيجار");
 const [contractTypes,setContractTypes]=useState<string[]>(["إيجار"]);
 const [contractTypeModal,setContractTypeModal]=useState(false);
 const [newContractType,setNewContractType]=useState("");
 const [contractTypeBusy,setContractTypeBusy]=useState(false);
 const [bookingStatus,setBookingStatus]=useState("confirmed");
 const [bookingStatuses,setBookingStatuses]=useState<{code:string;name:string}[]>([{code:"confirmed",name:"حجز مؤكد"},{code:"pending",name:"قيد التأكيد"}]);
 const [bookingStatusModal,setBookingStatusModal]=useState(false);
 const [newBookingStatus,setNewBookingStatus]=useState("");
 const [bookingStatusBusy,setBookingStatusBusy]=useState(false);
 const [bookingStatusError,setBookingStatusError]=useState("");
 const [standaloneOwnerModal,setStandaloneOwnerModal]=useState(false);
 const [savingStandaloneOwner,setSavingStandaloneOwner]=useState(false);
 const [standaloneOwnerError,setStandaloneOwnerError]=useState("");
 const [standaloneOwnerForm,setStandaloneOwnerForm]=useState({full_name:"",mobile:"",phone:"",email:"",nationality:"",identity_number:""});
 const openStandaloneOwner=()=>{setStandaloneOwnerError("");setStandaloneOwnerForm({full_name:"",mobile:"",phone:"",email:"",nationality:"",identity_number:""});setStandaloneOwnerModal(true);};
 const saveStandaloneOwner=async()=>{
  if(!canWrite){setStandaloneOwnerError("ليس لديك صلاحية إضافة مالك.");return;}
  const f=standaloneOwnerForm;
  if(!f.full_name.trim()){setStandaloneOwnerError("اسم المالك مطلوب.");return;}
  if(f.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())){setStandaloneOwnerError("البريد الإلكتروني غير صحيح.");return;}
  setSavingStandaloneOwner(true);setStandaloneOwnerError("");
  const {data,error:dbError}=await supabase.from("property_owners").insert({company_id:COMPANY_ID,full_name:f.full_name.trim(),mobile:f.mobile.trim()||null,phone:f.phone.trim()||null,email:f.email.trim()||null,nationality:f.nationality.trim()||null,identity_number:f.identity_number.trim()||null}).select("id,full_name").single();
  setSavingStandaloneOwner(false);
  if(dbError){setStandaloneOwnerError("تعذر حفظ المالك: "+dbError.message);return;}
  setOwners(prev=>[...prev,data as Owner]);setStandaloneOwnerModal(false);setNotice("تم حفظ المالك بنجاح.");
 };
 const [tenantModal,setTenantModal]=useState(false);
 const [tenantBusy,setTenantBusy]=useState(false);
 const [nationalities,setNationalities]=useState<string[]>(["سعودي", "مصري", "يمني", "سوداني", "سوري", "أردني", "باكستاني", "هندي", "فلبيني"]);
 const [nationalityEditor,setNationalityEditor]=useState(false);
 const [nationalityTarget,setNationalityTarget]=useState<"tenant"|"owner">("tenant");
 const [newNationality,setNewNationality]=useState("");
 const [nationalityError,setNationalityError]=useState("");
 const [savingNationality,setSavingNationality]=useState(false);
 const saveNationality=async()=>{
  const name=newNationality.trim();
  if(!name||!canWrite)return;
  if(nationalities.includes(name)){setNationalityError("الجنسية موجودة بالفعل.");return;}
  setSavingNationality(true);setNationalityError("");
  const {error:dbError}=await supabase.from("residential_nationalities").insert({company_id:COMPANY_ID,name});
  setSavingNationality(false);
  if(dbError){setNationalityError("تعذر حفظ الجنسية: "+dbError.message);return;}
  setNationalities(prev=>[...prev,name].sort((a,b)=>a.localeCompare(b,"ar")));
  if(nationalityTarget==="owner")setStandaloneOwnerForm(prev=>({...prev,nationality:name}));
  else setNewTenant(prev=>({...prev,nationality:name}));
  setNewNationality("");setNationalityEditor(false);
 };

 const [newTenant,setNewTenant]=useState({full_name:"",phone:"",identity_number:"",nationality:"",email:"",notes:""});
 const [firstDueDate,setFirstDueDate]=useState(today());
 const [contractNumberError,setContractNumberError]=useState("");
 const [scheduleError,setScheduleError]=useState("");
 const [editedDueDates,setEditedDueDates]=useState<Record<number,string>>({});

 const [durationOptions,setDurationOptions]=useState<string[]>(["يومي","شهري","سنوي"]);
 const [durationAddOpen,setDurationAddOpen]=useState(false);
 const [newDuration,setNewDuration]=useState("");
 const [durationSaving,setDurationSaving]=useState(false);
 const [durationError,setDurationError]=useState("");
 const addDurationOption=async()=>{
  const name=newDuration.trim();
  if(!name||!canWrite)return;
  if(durationOptions.includes(name)){setDurationError("مدة العقد موجودة بالفعل.");return;}
  setDurationSaving(true);setDurationError("");
  const {error:insertError}=await supabase.from("residential_room_contract_duration_options").insert({company_id:COMPANY_ID,name});
  setDurationSaving(false);
  if(insertError){setDurationError(insertError.message);return;}
  setDurationOptions(prev=>[...prev,name]);setContractDuration(name);setNewDuration("");setDurationAddOpen(false);
 };

 const saveBookingStatus=async()=>{
  const name=newBookingStatus.trim();
  if(!name||!canWrite)return;
  if(bookingStatuses.some(x=>x.name===name)){setBookingStatusError("حالة الحجز موجودة بالفعل.");return;}
  setBookingStatusBusy(true);setBookingStatusError("");
  const {data,error:dbError}=await supabase.from("residential_room_booking_status_options").insert({company_id:COMPANY_ID,name}).select("code,name").single();
  setBookingStatusBusy(false);
  if(dbError){setBookingStatusError("تعذر حفظ حالة الحجز: "+dbError.message);return;}
  setBookingStatuses(prev=>[...prev,data]);setBookingStatus(data.code);setNewBookingStatus("");setBookingStatusModal(false);
 };
 const saveNewTenant=async()=>{
  if(!canWrite||!newTenant.full_name.trim()){setError("اسم المستأجر مطلوب.");return;}
  setTenantBusy(true);setError("");
  const {data,error:dbError}=await supabase.from("residential_tenants").insert({company_id:COMPANY_ID,full_name:newTenant.full_name.trim(),phone:newTenant.phone.trim()||null,identity_number:newTenant.identity_number.trim()||null,nationality:newTenant.nationality.trim()||null,email:newTenant.email.trim()||null,notes:newTenant.notes.trim()||null}).select("id,full_name").single();
  setTenantBusy(false);
  if(dbError){setError("تعذر إضافة المستأجر: "+dbError.message);return;}
  setTenants(prev=>[...prev,data as Tenant]);setOpForm(prev=>({...prev,tenant_id:data.id}));setTenantModal(false);
  setNewTenant({full_name:"",phone:"",identity_number:"",nationality:"",email:"",notes:""});
 };
 const saveContractType=async()=>{
  const name=newContractType.trim();if(!canWrite||!name)return;
  if(contractTypes.includes(name)){setError("نوع العقد موجود بالفعل.");return;}
  setContractTypeBusy(true);setError("");
  const {error:dbError}=await supabase.from("residential_room_contract_types").insert({company_id:COMPANY_ID,name});
  setContractTypeBusy(false);
  if(dbError){setError("تعذر حفظ نوع العقد: "+dbError.message);return;}
  setContractTypes(prev=>[...prev,name]);setContractType(name);setNewContractType("");setContractTypeModal(false);
 };
 const addInterval=(date:Date,period:string)=>{
  const d=new Date(date.getTime());
  if(period==="يومي")d.setUTCDate(d.getUTCDate()+1);
  else if(period==="أسبوعي")d.setUTCDate(d.getUTCDate()+7);
  else {
   const months=period==="شهري"?1:period==="ربع سنوي"?3:period==="نصف سنوي"?6:period==="سنوي"?12:0;
   if(!months)return null;
   const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);
   const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));
  }
  return d;
 };
 const [locationOptions,setLocationOptions]=useState<LocationOption[]>([]);
 const [optionModal,setOptionModal]=useState<{kind:string;title:string}|null>(null);
 const [optionName,setOptionName]=useState("");
 const [optionSaving,setOptionSaving]=useState(false);
 const optionsFor=(kind:string,region?:string)=>Array.from(new Set([
   ...(DEFAULT_ROOM_OPTIONS[kind]??[]),
   ...locationOptions.filter(x=>{
     const kinds=kind==="district"?["district","district_street","neighborhood","حي"]:kind==="landmark"?["landmark","nearest_landmark","معلم"]:kind==="city"?["city","مدينة"]:[kind];
     return kinds.includes(x.kind)&&(!region||x.region_name===region);
   }).map(x=>x.name)
 ])).filter(Boolean);
 const addOption=async()=>{
   const name=optionName.trim();if(!optionModal||!name||!canWrite)return;
   if(optionModal.kind==="rental_mode"&&!(["الغرفة بالكامل","بالسرير"].includes(name))){setError("طريقة التأجير الجديدة تحتاج تحديث القيم المسموحة في قاعدة البيانات أولًا؛ حاليًا النظام يدعم بالكامل أو بالسرير.");return;}
   if(optionsFor(optionModal.kind,["city","district","landmark"].includes(optionModal.kind)?form.region||"":undefined).includes(name)){
     setError("هذه القيمة مسجلة بالفعل.");return;
   }
   if(["city","district","landmark"].includes(optionModal.kind)&&!form.region){setError("اختر المنطقة أولًا.");return;}
   setOptionSaving(true);setError("");
   const result=await supabase.from("residential_location_options").insert({company_id:COMPANY_ID,kind:optionModal.kind,name,region_name:["city","district","landmark"].includes(optionModal.kind)?form.region:null}).select("id,kind,name,region_name").single();
   setOptionSaving(false);
   if(result.error){setError("تعذر حفظ الخيار: "+result.error.message);return;}
   setLocationOptions(prev=>[...prev,result.data as LocationOption]);
   if(optionModal.kind==="room_type")setForm(prev=>({...prev,room_type:name}));
   if(optionModal.kind==="rent_period")setForm(prev=>({...prev,rent_period:name}));
   if(optionModal.kind==="room_status")setForm(prev=>({...prev,room_status:name}));
   if(optionModal.kind==="city")setForm(prev=>({...prev,city:name,district_street:"",nearest_landmark:""}));
   if(optionModal.kind==="district")setForm(prev=>({...prev,district_street:name}));
   if(optionModal.kind==="landmark")setForm(prev=>({...prev,nearest_landmark:name}));
   if(optionModal.kind==="rental_mode")setForm(prev=>({...prev,rental_mode:name==="بالسرير"?"bed":"full"}));
   setOptionModal(null);setOptionName("");setNotice("تم حفظ الخيار الجديد ويمكن اختياره لاحقًا.");
 };
 const optionSelect=(title:string,kind:string,value:string,onChange:(value:string)=>void,disabled=false)=>
  <div className="min-w-0"><span className={label}>{title}</span><div className="flex items-center gap-1.5"><select disabled={disabled} className={`${field} min-h-[47px] min-w-0 flex-1 py-2.5 text-sm sm:text-base disabled:opacity-50`} value={value} onChange={e=>onChange(e.target.value)}><option value="">اختر {title}</option>{optionsFor(kind,["city","district","landmark"].includes(kind)?form.region||"":undefined).concat(value&&!optionsFor(kind,["city","district","landmark"].includes(kind)?form.region||"":undefined).includes(value)?[value]:[]).map(x=><option key={x} value={x}>{x}</option>)}</select><button type="button" disabled={disabled||!canWrite} title={`إضافة ${title}`} onClick={()=>{setOptionModal({kind,title});setOptionName("");setError("");}} className="grid h-[47px] w-[47px] shrink-0 place-items-center rounded-xl border border-amber-300/50 bg-amber-300/15 text-amber-200 disabled:opacity-40"><Plus size={21}/></button></div></div>;
 const [opForm,setOpForm]=useState({tenant_id:"",bed_id:"",start_date:today(),end_date:"",amount:"",paid:"0",period:"شهري",number:"",payment:"نقدي"});
 const schedule=useMemo(()=>{
  const start=firstDueDate,end=opForm.end_date,contractStart=opForm.start_date;
  if(!start||!end||!contractStart||end<=contractStart||start<contractStart||start>=end)return [];
  const total=Number(opForm.amount);if(!Number.isFinite(total)||total<0)return [];
  const result:string[]=[];let current=new Date(start+"T00:00:00Z");
  const last=new Date(end+"T00:00:00Z");
  for(let i=0;i<500&&current<last;i++){
   result.push(current.toISOString().slice(0,10));
   const next=addInterval(current,opForm.period);if(!next||next<=current)return [];
   current=next;
  }
  return result;
 },[firstDueDate,opForm.end_date,opForm.start_date,opForm.amount,opForm.period]);

 useEffect(()=>{setEditedDueDates({});setScheduleError("");},[schedule]);
 const installmentsPreview=useMemo(()=>{
  const cents=Math.round(Number(opForm.amount)*100);
  if(!Number.isFinite(cents)||cents<0||!schedule.length)return [];
  const each=Math.floor(cents/schedule.length);
  return schedule.map((autoDate,index)=>({
   installment_no:index+1,
   due_date:editedDueDates[index]??autoDate,
   amount:(each+(index===schedule.length-1?cents-each*schedule.length:0))/100
  }));
 },[schedule,editedDueDates,opForm.amount]);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  const {data:auth,error:authError}=await supabase.auth.getUser();
  if(authError||!auth.user){setError("يجب تسجيل الدخول بحساب مصرح له.");setLoading(false);return false;}
  const member=await supabase.from("residential_company_users").select("role").eq("company_id",COMPANY_ID).eq("user_id",auth.user.id).maybeSingle();
  if(member.error||!member.data){setError(member.error?.message||"الحساب غير مرتبط بالشركة.");setLoading(false);return false;}
  setCanWrite(member.data.role==="owner");
  const statusResult=await supabase.from("residential_room_booking_status_options").select("code,name").eq("company_id",COMPANY_ID).order("name");
  if(!statusResult.error)setBookingStatuses([{code:"confirmed",name:"حجز مؤكد"},{code:"pending",name:"قيد التأكيد"},...(statusResult.data??[])]);
  const nationalityResult=await supabase.from("residential_nationalities").select("name").eq("company_id",COMPANY_ID).order("name");
  if(!nationalityResult.error)setNationalities(prev=>Array.from(new Set([...prev,...(nationalityResult.data??[]).map(x=>x.name as string)])));
  const typeResult=await supabase.from("residential_room_contract_types").select("name").eq("company_id",COMPANY_ID).order("name");
  if(!typeResult.error)setContractTypes(Array.from(new Set(["إيجار",...(typeResult.data??[]).map(x=>x.name)])));

  const [r,b,l,k,t,o,ins,alloc,charges,payments,loc]=await Promise.all([
   supabase.from("residential_rooms").select("*").eq("company_id",COMPANY_ID).order("created_at",{ascending:false}),
   supabase.from("residential_room_beds").select("id,room_id,bed_number,status,notes").eq("company_id",COMPANY_ID),
   supabase.from("residential_room_contracts").select("id,room_id,bed_id,tenant_id,start_date,end_date,status,rent_amount,contract_number,contract_type,owner_id,rent_period,contract_duration,notes,archived_at").eq("company_id",COMPANY_ID),
   supabase.from("residential_room_bookings").select("id,room_id,bed_id,tenant_id,start_date,end_date,booking_status").eq("company_id",COMPANY_ID),
   supabase.from("residential_tenants").select("id,full_name,phone,identity_number,nationality,email,notes").eq("company_id",COMPANY_ID),
   supabase.from("property_owners").select("id,full_name,mobile,phone,identity_number,nationality,email").eq("company_id",COMPANY_ID),
   supabase.from("residential_room_installments").select("id,contract_id,amount,due_date").eq("company_id",COMPANY_ID),
   supabase.from("residential_room_allocations").select("installment_id,amount").eq("company_id",COMPANY_ID),
   supabase.from("residential_room_charges").select("id,room_id,charge_type,title,amount,due_date").eq("company_id",COMPANY_ID),
   supabase.from("residential_room_charge_payments").select("charge_id,amount").eq("company_id",COMPANY_ID),
    supabase.from("residential_location_options").select("id,kind,name,region_name").eq("company_id",COMPANY_ID)
  ]);
  const issue=[r.error,b.error,l.error,k.error,t.error,o.error].find(Boolean);
  if(issue)setError(`تعذر تحميل بعض البيانات: ${issue.message}`);
  if(loc.error)setError(prev=>prev||`تعذر تحميل قوائم المواقع: ${loc.error.message}`);setLocationOptions((loc.data??[]) as LocationOption[]);
   setRooms((r.data??[]) as Room[]);setBeds((b.data??[]) as Bed[]);setLeases((l.data??[]) as Lease[]);setBookings((k.data??[]) as Booking[]);setTenants((t.data??[]) as Tenant[]);setOwners((o.data??[]) as Owner[]);setLoading(false);return !issue&&!loc.error;
 },[]);
 useEffect(()=>{void load();},[load]);
 const refreshRooms=async()=>{
  if(refreshing||loading)return;
  setRefreshing(true);setRefreshToast("");
  try{const ok=await load();if(ok)setRefreshToast("تم تحديث بيانات الغرف بنجاح");}
  catch{setError("حدث خطأ أثناء تحديث بيانات الغرف.");}
  finally{setRefreshing(false);}
 };
 useEffect(()=>{if(!refreshToast)return;const timer=window.setTimeout(()=>setRefreshToast(""),5000);return()=>window.clearTimeout(timer);},[refreshToast]);
  useEffect(()=>{
   let cancelled=false;
   void supabase.from("residential_room_contract_duration_options").select("name").eq("company_id",COMPANY_ID).then(({data,error:durationLoadError})=>{
    if(!cancelled&&!durationLoadError)setDurationOptions(Array.from(new Set(["يومي","شهري","سنوي",...(data??[]).map(x=>x.name)])));
   });
   return()=>{cancelled=true;};
  },[]);

 const activeLeases=leases.filter(l=>!l.archived_at);
 const active=(r:Room,bedId?:string)=>{
  const date=today();const contract=activeLeases.some(c=>c.room_id===r.id&&c.status==="نشط"&&c.start_date<=date&&c.end_date>date&&(!bedId||c.bed_id===bedId||!c.bed_id));
  const booked=bookings.some(b=>b.room_id===r.id&&b.booking_status!=="cancelled"&&b.start_date<=date&&b.end_date>date&&(!bedId||b.bed_id===bedId||!b.bed_id));
  return contract?"مؤجرة":booked?"محجوزة":"متاحة";
 };
 const status=(r:Room)=>r.rental_mode==="full"?active(r):beds.filter(b=>b.room_id===r.id).length===0?"بدون أسرّة":beds.filter(b=>b.room_id===r.id).every(b=>active(r,b.id)!=="متاحة")?"مكتملة الإشغال":beds.some(b=>b.room_id===r.id&&active(r,b.id)!=="متاحة")?"إشغال جزئي":"متاحة";
 const visible=useMemo(()=>rooms.filter(r=>(showArchived?!!r.archived_at:!r.archived_at)&&[r.room_number,r.building_name,r.room_type,r.city,r.region].some(v=>(v??"").toLowerCase().includes(search.toLowerCase()))&&(filter==="الكل"||(filter==="كاملة"?r.rental_mode==="full":filter==="بالسرير"?r.rental_mode==="bed":filter==="مؤجرة"?["مؤجرة","مكتملة الإشغال","إشغال جزئي"].includes(status(r)):status(r)===filter))),[rooms,search,filter,showArchived,beds,leases,bookings]);
 const current=rooms.filter(r=>!r.archived_at);
 const openNew=()=>{setEditing(null);setForm({...blank});setRoomTab("room");setOwnerMode("existing");setNewOwner({full_name:"",mobile:"",phone:"",email:"",nationality:"",identity_number:""});setModal(true);setError("");};
 const openEdit=(r:Room)=>{setEditing(r.id);setForm({room_number:r.room_number,apartment_number:r.apartment_number,building_name:r.building_name,room_type:r.room_type,beds_count:r.beds_count,rent_amount:Number(r.rent_amount),rent_period:r.rent_period,area_sqm:r.area_sqm,room_status:r.room_status,rental_mode:r.rental_mode,region:r.region,city:r.city,district_street:r.district_street,nearest_landmark:r.nearest_landmark,owner_id:r.owner_id,notes:r.notes});setModal(true);setError("");};
 const saveRoom=async()=>{
  if(!canWrite)return setError("لا تملك صلاحية التعديل.");
  if(!form.room_number.trim())return setError("رقم الغرفة مطلوب.");
  if(form.rental_mode==="bed"&&(!Number.isInteger(form.beds_count)||form.beds_count<1))return setError("عدد الأسرّة يجب أن يكون واحدًا على الأقل.");
  if(!Number.isFinite(form.rent_amount)||form.rent_amount<0)return setError("قيمة الإيجار غير صحيحة.");
  setBusy(true);setError("");
  const payload={...form,room_number:form.room_number.trim(),apartment_number:form.apartment_number?.trim()||null,beds_count:form.rental_mode==="full"?Math.max(1,form.beds_count):form.beds_count,company_id:COMPANY_ID,updated_at:new Date().toISOString()};
  const result=editing?await supabase.from("residential_rooms").update(payload).eq("id",editing).eq("company_id",COMPANY_ID):await supabase.from("residential_rooms").insert(payload);
  setBusy(false);if(result.error)return setError(result.error.message);
  setModal(false);setNotice("تم حفظ بيانات الغرفة بنجاح.");await load();
 };
 const openArchivePicker=()=>{setArchiveView("active");setArchiveSearch("");setArchiveSelection([]);setArchiveConfirm(false);setArchivePicker(true);};
 const archiveCandidates=rooms.filter(r=>(archiveView==="archived"?!!r.archived_at:!r.archived_at)&&[r.room_number,r.apartment_number,r.building_name,r.room_type,r.city].some(value=>(value??"").toLowerCase().includes(archiveSearch.trim().toLowerCase())));
 const switchArchiveView=(view:"active"|"archived")=>{setArchiveView(view);setArchiveSelection([]);setArchiveConfirm(false);};
 const applyRoomArchiveSelection=async()=>{
  if(!canWrite||archiveBusy||!archiveSelection.length)return;
  if(archiveView==="active"&&!archiveConfirm){setArchiveConfirm(true);return;}
  setArchiveBusy(true);setError("");
  const targetArchived=archiveView==="active";
  let changed=0;
  let failed="";
  for(const id of archiveSelection){
   const result=await supabase.from("residential_rooms").update({archived_at:targetArchived?new Date().toISOString():null}).eq("company_id",COMPANY_ID).eq("id",id);
   if(result.error){failed=result.error.message;break;}
   changed++;
  }
  setArchiveBusy(false);
  setArchiveSelection([]);setArchiveConfirm(false);
  if(failed)setError(`تم تحديث ${changed} غرفة، ثم تعذرت العملية: ${failed}`);
  else setNotice(targetArchived?`تمت أرشفة ${changed} غرفة دون حذف عقودها أو بياناتها المالية.`:`تمت استعادة ${changed} غرفة من الأرشيف.`);
  if(!failed)setArchivePicker(false);
  await load();
 };
 const archive=async(r:Room)=>{if(!canWrite)return;if(!window.confirm(r.archived_at?"استعادة الغرفة من الأرشيف؟":"أرشفة الغرفة؟ لن تُحذف البيانات المالية."))return;setBusy(true);const result=await supabase.from("residential_rooms").update({archived_at:r.archived_at?null:new Date().toISOString()}).eq("company_id",COMPANY_ID).eq("id",r.id);setBusy(false);if(result.error)setError(result.error.message);else{setNotice(r.archived_at?"تمت استعادة الغرفة.":"تمت أرشفة الغرفة.");await load();}};
 const addBed=async()=>{if(!bedRoom||!newBed.trim()||!canWrite)return;setBedBusy(true);const result=await supabase.from("residential_room_beds").insert({company_id:COMPANY_ID,room_id:bedRoom.id,bed_number:newBed.trim()});setBedBusy(false);if(result.error)setError(result.error.message);else{setNewBed("");setNotice("تمت إضافة السرير.");await load();}};
 const removeBed=async(b:Bed)=>{if(!canWrite||!window.confirm("حذف هذا السرير؟ لن يتم الحذف إذا كان مرتبطًا بعقد أو حجز."))return;const result=await supabase.from("residential_room_beds").delete().eq("company_id",COMPANY_ID).eq("id",b.id);if(result.error)setError(result.error.message);else await load();};
 const startOperation=(kind:"contract"|"booking",r:Room)=>{setOperation(kind);setOperationRoom(r);if(kind==="booking"){setBookingRoomSelection("");setBookingStatus("confirmed");}if(kind==="contract"){setContractRoomSelection(r.id);setContractDuration("شهري");setContractNotes("");setContractType("إيجار");setFirstDueDate(today());setContractNumberError("");setEditedDueDates({});setScheduleError("");}setOpForm({tenant_id:"",bed_id:"",start_date:today(),end_date:"",amount:"0",paid:"0",period:r.rent_period,number:"",payment:"نقدي"});setError("");};
 const saveOperation=async()=>{
  if(!operationRoom||!operation||!canWrite)return;
  const f=opForm;const amount=Number(f.amount),paid=Number(f.paid);
  if(!f.tenant_id||!f.start_date||!f.end_date||f.end_date<=f.start_date)return setError("اختر العميل وتواريخ صحيحة.");
  if(operation==="booking"&&!bookingRoomSelection)return setError("اختر الغرفة أولًا.");
  if(operationRoom.rental_mode==="bed"&&!f.bed_id)return setError("يجب اختيار السرير.");
  if(!Number.isFinite(amount)||amount<0||!Number.isFinite(paid)||paid<0||paid>amount)return setError("راجع المبالغ المدخلة.");
  if(operation==="contract"&&!contractRoomSelection)return setError("اختر الغرفة أولًا.");
  if(operation==="contract"&&!f.number.trim())return setError("رقم العقد مطلوب.");
  if(operation==="contract"&&(!firstDueDate||firstDueDate<f.start_date||firstDueDate>=f.end_date))return setError("تاريخ أول استحقاق يجب أن يكون ضمن فترة العقد.");
  if(operation==="contract"&&!installmentsPreview.length)return setError("تعذر حساب الأقساط. راجع دورية السداد والتواريخ.");
  if(operation==="contract"){
   const due=installmentsPreview.map(x=>x.due_date);
   if(due.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d)||Number.isNaN(Date.parse(d+"T00:00:00Z"))||d<f.start_date||d>=f.end_date))return setScheduleError("كل تاريخ استحقاق لازم يكون داخل فترة العقد.");
   if(due.some((d,i)=>i>0&&d<=due[i-1]))return setScheduleError("تواريخ الأقساط لازم تكون متزايدة ومن غير تكرار.");
  }
  if(operation==="contract"){
   const duplicate=await supabase.from("residential_room_contracts").select("id").eq("company_id",COMPANY_ID).eq("contract_number",f.number.trim()).limit(1);
   if(duplicate.error)return setError("تعذر التحقق من رقم العقد: "+duplicate.error.message);
   if(duplicate.data?.length){setContractNumberError("رقم العقد مستخدم بالفعل في عقود الغرف.");return setError("رقم العقد مستخدم بالفعل في عقود الغرف.");}
  }

  if(operation==="booking"){
   // Client-side check for immediate feedback. Database triggers remain the final protection.
   const conflict=activeLeases.some(c=>c.room_id===operationRoom.id&&c.status==="نشط"&&c.start_date<f.end_date&&f.start_date<c.end_date&&(operationRoom.rental_mode==="full"||!c.bed_id||c.bed_id===f.bed_id))
    ||bookings.some(b=>b.room_id===operationRoom.id&&b.booking_status!=="cancelled"&&b.start_date<f.end_date&&f.start_date<b.end_date&&(operationRoom.rental_mode==="full"||!b.bed_id||b.bed_id===f.bed_id));
   if(conflict)return setError("هذه الغرفة أو السرير محجوز أو مؤجر بالفعل خلال الفترة المحددة. اختر فترة أو وحدة أخرى.");
  }
  setBusy(true);setError("");
  const common={company_id:COMPANY_ID,room_id:operationRoom.id,bed_id:operationRoom.rental_mode==="bed"?f.bed_id:null,tenant_id:f.tenant_id,start_date:f.start_date,end_date:f.end_date};
  const result=operation==="contract"
   ?await supabase.rpc("create_room_contract_with_installments",{
      p_company_id:COMPANY_ID,
      p_room_id:operationRoom.id,
      p_bed_id:operationRoom.rental_mode==="bed"?f.bed_id:null,
      p_tenant_id:f.tenant_id,
      p_owner_id:operationRoom.owner_id,
      p_contract_number:f.number.trim(),
      p_start_date:f.start_date,
      p_end_date:f.end_date,
      p_rent_amount:amount,
      p_rent_period:f.period,
      p_contract_duration:contractDuration,
      p_contract_type:contractType,
      p_notes:contractNotes.trim()||null,
      p_installments:installmentsPreview
    })
   :await supabase.from("residential_room_bookings").insert({...common,total_amount:amount,paid_amount:paid,payment_method:f.payment,booking_status:bookingStatus});
  setBusy(false);if(result.error)return setError(result.error.code==="23505"?"رقم العقد مستخدم بالفعل في عقود الغرف.":/overlap|overlapping|occupied|محجوز|مؤجر/i.test(result.error.message)?"لا يمكن الحفظ: الغرفة أو السرير مرتبط بحجز أو عقد آخر خلال نفس الفترة.":result.error.message);
  setOperation(null);setOperationRoom(null);setNotice(operation==="contract"?"تم تسجيل عقد الغرفة وحفظ جميع الأقساط بمواعيدها في قاعدة البيانات.":"تم تسجيل الحجز. تنبيه: المدفوع المسجل بالحجز ليس إيصال تحصيل منفصلًا.");await load();
 };
  const totalRooms=current.length;
  const occupiedRooms=current.filter(r=>["مؤجرة","مكتملة الإشغال","إشغال جزئي"].includes(status(r))).length;
  const bookedRooms=current.filter(r=>status(r)==="محجوزة").length;
  const freeRooms=current.filter(r=>status(r)==="متاحة").length;
  const expiring=activeLeases.filter(l=>l.status==="نشط"&&l.end_date>=today()&&l.end_date<=new Date(Date.now()+30*86400000).toLocaleDateString("en-CA")).sort((a,b)=>a.end_date.localeCompare(b.end_date));
  const rentDue=financial.installments.filter(i=>i.due_date<=today());
  const rentPaid=(id:string)=>financial.allocations.filter(a=>a.installment_id===id).reduce((v,a)=>v+Number(a.amount||0),0);
  const chargePaid=(id:string)=>financial.payments.filter(p=>p.charge_id===id).reduce((v,p)=>v+Number(p.amount||0),0);
  const financialSummary=(kind:string)=>{
   if(kind==="rent")return {total:rentDue.reduce((v,i)=>v+Number(i.amount||0),0),collected:rentDue.reduce((v,i)=>v+rentPaid(i.id),0)};
   const rows=financial.charges.filter(c=>kind==="dues"?!["water","electricity"].includes(c.charge_type):c.charge_type===kind);
   return {total:rows.reduce((v,c)=>v+Number(c.amount||0),0),collected:rows.reduce((v,c)=>v+chargePaid(c.id),0)};
  };
  const openReport=(name:string)=>{setReport(name);setReportSearch("");if(name==="تقارير العقود")setContractArchiveTab("current");};
  const reportRows=():string[][]=>{
   if(report==="تقارير الغرف")return rooms.map(r=>[r.room_number,r.building_name||"—",r.room_type||"—",status(r),r.rental_mode==="bed"?"بالسرير":"بالكامل",String(r.rent_amount)]);
   if(report==="تقارير العقود"||report==="العقود القريبة من الانتهاء")return (report==="العقود القريبة من الانتهاء"?expiring:activeLeases).map(l=>[rooms.find(r=>r.id===l.room_id)?.room_number||"—",tenants.find(t=>t.id===l.tenant_id)?.full_name||"—",l.start_date,l.end_date,l.status,String(l.rent_amount)]);
   if(report==="تقارير الحجوزات")return bookings.map(b=>[rooms.find(r=>r.id===b.room_id)?.room_number||"—",tenants.find(t=>t.id===b.tenant_id)?.full_name||"—",b.start_date,b.end_date,b.booking_status,"—"]);
   if(report==="تقارير العملاء")return tenants.map(t=>[t.full_name,String(activeLeases.filter(l=>l.tenant_id===t.id).length),String(bookings.filter(b=>b.tenant_id===t.id).length)]);
   if(report==="تقارير الملاك")return owners.map(o=>[o.full_name,String(rooms.filter(r=>r.owner_id===o.id).length)]);
   if(report==="تقارير الشهر")return [...activeLeases.filter(l=>l.start_date.slice(0,7)===today().slice(0,7)).map(l=>["عقد",rooms.find(r=>r.id===l.room_id)?.room_number||"—",l.start_date,String(l.rent_amount)]),...bookings.filter(b=>b.start_date.slice(0,7)===today().slice(0,7)).map(b=>["حجز",rooms.find(r=>r.id===b.room_id)?.room_number||"—",b.start_date,"—"])];
   if(report?.startsWith("إجمالي")){
    if(report==="إجمالي الإيجارات")return rentDue.map(i=>[rooms.find(r=>leases.some(l=>l.id===i.contract_id&&l.room_id===r.id))?.room_number||"—",i.due_date,String(i.amount),String(rentPaid(i.id)),String(Math.max(0,Number(i.amount)-rentPaid(i.id)))]);
    const kind=report==="إجمالي فواتير المياه"?"water":report==="إجمالي فواتير الكهرباء"?"electricity":"dues";
    return financial.charges.filter(c=>kind==="dues"?!["water","electricity"].includes(c.charge_type):c.charge_type===kind).map(c=>[rooms.find(r=>r.id===c.room_id)?.room_number||"—",c.title||c.charge_type,c.due_date||"—",String(c.amount),String(chargePaid(c.id)),String(Math.max(0,Number(c.amount)-chargePaid(c.id)))]);
   }
   return [];
  };
   const roomReportRows=rooms.filter(r=>!r.archived_at&&roomReportStatuses.includes(status(r))).filter(r=>[r.room_number,r.building_name,r.room_type,status(r),r.rent_amount?.toString(),owners.find(o=>o.id===r.owner_id)?.full_name].some(value=>String(value??"").toLowerCase().includes(reportSearch.trim().toLowerCase())));
   const roomReportHeaders=["رقم الغرفة","المبنى","النوع","الحالة","الإيجار","المالك"];
   const roomReportData=roomReportRows.map(r=>[r.room_number,r.building_name||"—",r.room_type||"—",status(r),`${money(Number(r.rent_amount))} ر.س`,owners.find(o=>o.id===r.owner_id)?.full_name||"—"]);
   const exportRoomReport=()=>{
    const csv="\uFEFF"+[roomReportHeaders,...roomReportData].map(row=>row.map(value=>`"${String(value).replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
    const link=document.createElement("a");link.href=url;link.download="rooms-report.csv";document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
   };
   const printRoomReport=()=>{
    const safe=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const logoUrl=new URL("/aqary-smart-logo.png",window.location.origin).href;
    const reportDate=new Date().toLocaleString("ar-SA");
    const selectedStatuses=roomReportStatuses.join("، ")||"لا توجد حالات محددة";
    const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>تقرير الغرف - عقاري سمارت</title><style>*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;padding:16px;color:#064332}.report-header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:2px solid #12533e;padding:12px 0 18px}.report-heading{text-align:right}.report-heading h1{font-size:26px;margin:0 0 12px;font-weight:800;color:#064332}.report-heading p{margin:0;font-size:14px;font-weight:700}.identity{display:flex;flex-direction:column;align-items:center;text-align:center;min-width:145px;gap:3px}.identity img{width:112px;height:112px;object-fit:contain}.identity strong{display:block;font-size:15px;color:#064332}.identity span{display:block;font-size:15px;font-weight:700;color:#064332;direction:ltr}.meta{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;margin:18px 0;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #aab8b2;padding:10px;text-align:right;font-size:12px}th{background:#145440;color:white;font-weight:700}tbody tr:nth-child(even){background:#eaf4ee}@page{size:A4 landscape;margin:12mm}@media print{body{padding:0}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><header class="report-header"><div class="report-heading"><h1>عقاري سمارت | تقرير الغرف</h1><p>تاريخ التقرير: ${safe(reportDate)} | عدد النتائج: ${roomReportRows.length}</p></div><div class="identity"><img src="${logoUrl}" alt="شعار عقاري سمارت"/><strong>م/ علي نصر</strong><span>0570026229</span></div></header><div class="meta"><span>الحالات المختارة: ${safe(selectedStatuses)}</span><span>إجمالي النتائج: ${roomReportRows.length}</span></div><table><thead><tr>${roomReportHeaders.map(h=>`<th>${safe(h)}</th>`).join("")}</tr></thead><tbody>${roomReportData.map(row=>`<tr>${row.map(value=>`<td>${safe(value)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
    const popup=window.open("","_blank","width=1100,height=750");if(!popup){setNotice("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");return;}
    popup.document.open();popup.document.write(html);popup.document.close();popup.focus();popup.addEventListener("load",()=>popup.print(),{once:true});
   };
   const contractReportRows=leases.filter(l=>(contractArchiveTab==="archive"?!!l.archived_at:!l.archived_at)).filter(l=>[l.contract_number,l.contract_type,rooms.find(r=>r.id===l.room_id)?.room_number,tenants.find(t=>t.id===l.tenant_id)?.full_name,owners.find(o=>o.id===(l.owner_id||rooms.find(r=>r.id===l.room_id)?.owner_id))?.full_name,l.status,l.start_date,l.end_date].some(v=>String(v??"").toLowerCase().includes(reportSearch.trim().toLowerCase())));
   const contractReportStatus=(l:Lease)=>l.status==="نشط"&&l.end_date<today()?"منتهي":l.status;
   const contractReportHeaders=["رقم العقد","نوع العقد","الغرفة","المستأجر","المالك","البداية","النهاية","قيمة الإيجار","الحالة"];
   const contractReportData=contractReportRows.map(l=>[l.contract_number||"—",l.contract_type||"إيجار",rooms.find(r=>r.id===l.room_id)?.room_number||"—",tenants.find(t=>t.id===l.tenant_id)?.full_name||"—",owners.find(o=>o.id===(l.owner_id||rooms.find(r=>r.id===l.room_id)?.owner_id))?.full_name||"—",l.start_date,l.end_date,`${money(Number(l.rent_amount))} ر.س`,contractReportStatus(l)]);
   const contractReportCounts={total:activeLeases.length,active:activeLeases.filter(l=>contractReportStatus(l)==="نشط").length,expired:activeLeases.filter(l=>["منتهي","منتهٍ","منتهية"].includes(contractReportStatus(l))).length,upcoming:activeLeases.filter(l=>l.start_date>today()&&contractReportStatus(l)==="نشط").length};
   const exportContractReport=()=>{
    const csv="\uFEFF"+[contractReportHeaders,...contractReportData].map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=contractArchiveTab==="archive"?"room-contracts-archive.csv":"room-contracts-report.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
   };
   const printContractReport=()=>{
    const safe=(v:string)=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const logo=new URL("/aqary-smart-logo.png",window.location.origin).href;
    const date=new Date().toLocaleDateString("ar-SA");
    const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير عقود الغرف - عقاري سمارت</title><style>*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#064332;padding:16px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #12533e;padding-bottom:16px;gap:20px}.heading{text-align:right}.heading h1{font-size:25px;margin:0 0 10px}.identity{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:145px}.identity img{width:112px;height:112px;object-fit:contain}.identity strong,.identity span{font-size:15px;font-weight:bold}.identity span{direction:ltr}.meta{margin:18px 0;font-size:13px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #aab8b2;padding:8px 6px;text-align:right;font-size:11px}th{background:#145440;color:white}tbody tr:nth-child(even){background:#eaf4ee}@page{size:A4 landscape;margin:12mm}@media print{body{padding:0}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><header class="head"><div class="heading"><h1>عقاري سمارت | ${contractArchiveTab==="archive"?"أرشيف عقود الغرف":"تقرير عقود الغرف"}</h1><p>تاريخ التقرير: ${safe(date)} | عدد النتائج: ${contractReportRows.length}</p></div><div class="identity"><img src="${logo}" alt="شعار عقاري سمارت"><strong>م/ علي نصر</strong><span>0570026229</span></div></header><p class="meta">إجمالي العقود: ${contractReportRows.length}</p><table><thead><tr>${contractReportHeaders.map(h=>`<th>${safe(h)}</th>`).join("")}</tr></thead><tbody>${contractReportData.map(row=>`<tr>${row.map(v=>`<td>${safe(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
    const popup=window.open("","_blank","width=1100,height=750");if(!popup){setNotice("يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.");return;}popup.document.open();popup.document.write(html);popup.document.close();popup.focus();popup.addEventListener("load",()=>popup.print(),{once:true});
   };
   const peopleReportRows=(report==="تقارير العملاء"?tenants.map(t=>({kind:"tenant" as const,id:t.id,row:[t.full_name,t.phone||"—",t.identity_number||"—",t.nationality||"—",t.email||"—",String(activeLeases.filter(l=>l.tenant_id===t.id).length)]})):owners.map(o=>({kind:"owner" as const,id:o.id,row:[o.full_name,o.mobile||o.phone||"—",o.identity_number||"—",o.nationality||"—",String(current.filter(r=>r.owner_id===o.id).length),String(activeLeases.filter(l=>(l.owner_id||rooms.find(r=>r.id===l.room_id)?.owner_id)===o.id).length)]}))).filter(item=>item.row.some(v=>v.toLocaleLowerCase().includes(reportSearch.trim().toLocaleLowerCase())));
   const peopleReportHeaders=report==="تقارير العملاء"?["العميل","الجوال","الهوية","الجنسية","البريد","عدد العقود"]:["المالك","الجوال","الهوية","الجنسية","الغرف","العقود"];
   const peopleReportStats=report==="تقارير العملاء"?[["إجمالي العملاء",tenants.length],["مرتبطون بعقود",new Set(activeLeases.map(l=>l.tenant_id)).size],["بدون عقود",tenants.filter(t=>!activeLeases.some(l=>l.tenant_id===t.id)).length],["إجمالي العقود",activeLeases.length]]:[["إجمالي الملاك",owners.length],["ملاك لديهم غرف",new Set(current.map(r=>r.owner_id).filter(Boolean)).size],["ملاك لديهم عقود",new Set(activeLeases.map(l=>l.owner_id||rooms.find(r=>r.id===l.room_id)?.owner_id).filter(Boolean)).size],["إجمالي الغرف",current.length]];
   const peopleReportExport=()=>{
    const rows=[peopleReportHeaders,...peopleReportRows.map(x=>x.row)];
    const csv="\uFEFF"+rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=report==="تقارير العملاء"?"room-customers-report.csv":"room-owners-report.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
   };
   const peopleReportPrint=()=>{
    const safe=(v:string)=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const win=window.open("","_blank","width=1100,height=750");if(!win){setNotice("اسمح بالنوافذ المنبثقة للطباعة.");return;}
    const html=`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${safe(report||"")} - عقاري سمارت</title><style>body{font-family:Tahoma,Arial,sans-serif;color:#064332;padding:18px}header{display:flex;justify-content:space-between;border-bottom:2px solid #12533e;padding-bottom:14px}img{width:100px;height:100px;object-fit:contain}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #aab8b2;padding:9px;text-align:right;font-size:12px}th{background:#145440;color:white}tr:nth-child(even){background:#eaf4ee}@page{size:A4 landscape;margin:12mm}@media print{thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><header><div><h1>عقاري سمارت | ${safe(report||"")}</h1><p>تاريخ التقرير: ${safe(new Date().toLocaleString("ar-SA"))} | عدد النتائج: ${peopleReportRows.length}</p></div><img src="${new URL("/aqary-smart-logo.png",window.location.origin).href}" alt="شعار عقاري سمارت"></header><table><thead><tr>${peopleReportHeaders.map(h=>`<th>${safe(h)}</th>`).join("")}</tr></thead><tbody>${peopleReportRows.map(x=>`<tr>${x.row.map(v=>`<td>${safe(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
    win.document.open();win.document.write(html);win.document.close();win.focus();win.addEventListener("load",()=>win.print(),{once:true});
   };
  const reportHeaders=report==="تقارير الغرف"?["الغرفة","المبنى","النوع","الحالة","التأجير","الإيجار"]:report==="تقارير العقود"||report==="العقود القريبة من الانتهاء"?["الغرفة","العميل","البداية","النهاية","الحالة","القيمة"]:report==="تقارير الحجوزات"?["الغرفة","العميل","البداية","النهاية","الحالة","القيمة"]:report==="تقارير العملاء"?["العميل","العقود","الحجوزات"]:report==="تقارير الملاك"?["المالك","عدد الغرف"]:report==="تقارير الشهر"?["العملية","الغرفة","التاريخ","القيمة"]:report==="إجمالي الإيجارات"?["الغرفة","الاستحقاق","المبلغ","المحصل","المتبقي"]:["الغرفة","البيان","الاستحقاق","المبلغ","المحصل","المتبقي"];
  const panel="rounded-[23px] border border-amber-300/40 bg-gradient-to-br from-[#144d40]/90 via-[#0b382f] to-[#041f1c] shadow-[0_14px_30px_rgba(0,0,0,.24)]";
  const action=(name:string,Icon:any,click:()=>void,color:string,disabled=false)=><button key={name} type="button" disabled={disabled} onClick={click} className={`group flex min-h-[108px] min-w-0 flex-col items-center justify-center gap-3 rounded-[20px] border p-3 text-center font-black transition hover:-translate-y-1 hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-40 ${panel}`} style={{borderColor:color}}><Icon size={31} className={name==="تحديث البيانات"&&refreshing?"animate-spin":""} style={{color}}/><span className="text-xs sm:text-sm">{name==="تحديث البيانات"&&refreshing?"جارٍ التحديث...":name}</span></button>;
  return <main dir="rtl" className="relative min-h-full w-full min-w-0 overflow-x-hidden bg-[#05291F] px-2 py-4 text-white sm:px-4 lg:px-6">
   <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,.08),transparent_60%)]"/><img src="/aqary-smart-logo.png" alt="" className="pointer-events-none fixed left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 opacity-[.035]"/>
   {refreshToast&&<div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-[100] w-[min(92vw,470px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-emerald-300/65 bg-[#064a39] shadow-[0_14px_45px_rgba(0,0,0,.45)]">
    <div className="flex min-h-[74px] items-center justify-center gap-3 px-6 py-4 text-center text-base font-extrabold text-white sm:text-lg"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-xl text-[#064a39]">✓</span><span>{refreshToast}</span></div>
    <div className="h-[6px] w-full bg-emerald-950/80"><div className="h-full w-full origin-right bg-gradient-to-l from-amber-300 via-yellow-400 to-amber-500" style={{animation:"rooms-refresh-toast-countdown 5s linear forwards"}}/></div>
   </div>}
   <style>{`@keyframes rooms-refresh-toast-countdown { from { transform: scaleX(1); } to { transform: scaleX(0); } }`}</style>
   <div className="relative w-full min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><button onClick={()=>navigate("/apartments-hub")} className="rounded-xl border border-amber-300/50 bg-[#0b4939] px-4 py-2 text-sm font-bold text-amber-200">← العودة لأقسام العقارات</button><button onClick={()=>void refreshRooms()} disabled={loading||refreshing} className="flex items-center gap-2 rounded-xl border border-emerald-300/30 px-4 py-2 text-sm disabled:opacity-60"><RefreshCw size={17} className={refreshing?"animate-spin":""}/>{refreshing?"جارٍ التحديث...":"تحديث"}</button></div>
    <header className="relative flex w-full flex-col items-center overflow-hidden rounded-[28px] border border-amber-300/40 bg-[radial-gradient(ellipse_at_top,rgba(17,93,70,.35),transparent_70%)] bg-[#05291F] px-3 pb-3 pt-5 text-center sm:px-5">
      <div className="pointer-events-none absolute -left-16 top-5 h-44 w-44 rounded-full border border-amber-300/15"/><div className="pointer-events-none absolute -right-16 top-5 h-44 w-44 rounded-full border border-amber-300/15"/>
      <div className="relative z-10 mb-3 flex h-[72px] w-[72px] shrink-0 self-center items-center justify-center rounded-2xl border border-amber-300/70 bg-emerald-900/80 shadow-[0_0_22px_rgba(251,191,36,.15)]"><BedDouble size={40} className="text-amber-300"/></div>
      <h1 className="relative mx-auto block w-full text-center text-3xl font-black leading-tight sm:text-4xl"><span className="text-amber-300">إدارة</span> الغرف والعقود</h1>
      <p className="relative mt-1 text-xs font-bold text-emerald-100/65">الغرف المتاحة والمؤجرة والحجوزات والتحصيلات</p>
      <div className="relative mt-4 grid w-full grid-cols-2 gap-2 lg:grid-cols-[minmax(210px,1fr)_repeat(2,minmax(105px,125px))_repeat(2,minmax(105px,125px))]">
        <div className="relative col-span-2 flex min-h-[120px] items-center lg:col-span-1"><Search size={20} className="absolute right-4 text-emerald-300"/><input className={`${field} h-full min-h-[68px] pr-12`} value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث برقم الغرفة أو المبنى أو الموقع..."/></div>
        <div className="grid grid-rows-2 gap-2"><button type="button" onClick={()=>openReport("تقارير الغرف")} className="flex min-h-[55px] items-center justify-center gap-2 rounded-xl border border-emerald-300/55 bg-emerald-400/10 px-2 text-xs font-black"><FileBarChart2 size={20} className="text-emerald-300"/>تقارير الغرف</button><button type="button" onClick={()=>openReport("تقارير العقود")} className="flex min-h-[55px] items-center justify-center gap-2 rounded-xl border border-emerald-300/55 bg-emerald-400/10 px-2 text-xs font-black"><ReceiptText size={20} className="text-emerald-300"/>تقارير العقود</button></div>
        <div className="grid grid-rows-2 gap-2"><button type="button" onClick={()=>openReport("تقارير العملاء")} className="flex min-h-[55px] items-center justify-center gap-2 rounded-xl border border-amber-300/55 bg-amber-300/10 px-2 text-xs font-black"><ContactRound size={20} className="text-amber-300"/>تقارير العملاء</button><button type="button" onClick={()=>openReport("تقارير الملاك")} className="flex min-h-[55px] items-center justify-center gap-2 rounded-xl border border-amber-300/55 bg-amber-300/10 px-2 text-xs font-black"><UserRoundCheck size={20} className="text-amber-300"/>تقارير الملاك</button></div>
        <button type="button" onClick={()=>openReport("تقارير الشهر")} className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl border border-sky-300/55 bg-sky-400/10 px-2 text-sm font-black"><CalendarDays size={30} className="text-sky-300"/>تقارير الشهر</button>
        <button type="button" onClick={()=>openReport("خريطة الغرف")} className="flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-xl border border-amber-300/55 bg-amber-300/10 px-2 text-sm font-black"><MapIcon size={30} className="text-amber-300"/>خريطة الغرف</button>
      </div>
    </header>
    {notice&&<div className="rounded-xl border border-emerald-300/30 bg-emerald-900/40 p-3">{notice}<button className="mr-3 underline" onClick={()=>setNotice("")}>إغلاق</button></div>}
    {error&&<div className="rounded-xl border border-red-400/50 bg-red-950/50 p-3 text-red-100">{error}<button className="mr-3 underline" onClick={()=>setError("")}>إغلاق</button></div>}
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">{action("إضافة غرفة",Plus,openNew,"#10b981",!canWrite)}{action("عقد جديد",FilePlus2,()=>{const r=current.find(r=>status(r)==="متاحة");if(r){startOperation("contract",r);setContractRoomSelection("");}else setNotice("أضف غرفة متاحة أولًا، أو اختر غرفة من القائمة لإنشاء العقد.");},"#f5c96b",!canWrite)}{action("حذف / أرشفة",Trash2,openArchivePicker,"#fb7185")}{action("تحديث البيانات",RefreshCw,()=>void refreshRooms(),"#38bdf8",loading||refreshing)}{action("حجز جديد",CalendarPlus,()=>{const r=current.find(r=>status(r)==="متاحة");if(r)startOperation("booking",r);else setNotice("أضف غرفة أولًا لإنشاء الحجز.");},"#fbbf24",!canWrite)}{action("إضافة عميل",UserRoundPlus,()=>{setError("");setNewTenant({full_name:"",phone:"",identity_number:"",nationality:"",email:"",notes:""});setTenantModal(true);},"#c4b5fd",!canWrite)}{action("إضافة مالك",UserRoundCheck,openStandaloneOwner,"#22d3ee",!canWrite)}</div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{action("إضافة / تحصيل مستحقات",ReceiptText,()=>setNotice("هذه العملية تحتاج ربط نموذج المستحقات والتحصيلات بقاعدة بيانات الغرف، ولم يتم تفعيل الحفظ بعد."),"#34d399")}{action("تحصيل إيجار",Wallet,()=>setNotice("يلزم تفعيل إيصالات الإيجار وتوزيعها على الأقساط قبل تسجيل التحصيلات."),"#a78bfa")}{action("إدارة الأسرّة",BedDouble,()=>{const r=current.find(r=>r.rental_mode==="bed");if(r)setBedRoom(r);else setNotice("أضف غرفة بنظام التأجير بالسرير أولًا.");},"#fbbf24")}{action("أنواع الغرف",Home,()=>openReport("تقارير الغرف"),"#22d3ee")}</div>
    <button type="button" onClick={()=>openReport("العقود القريبة من الانتهاء")} className={`${panel} flex w-full flex-col items-center justify-center gap-3 p-6 text-center transition hover:border-amber-200`}><CalendarDays size={64} className="text-amber-300"/><span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-1 text-xs font-bold text-amber-200">تنبيه العقود</span><h2 className="text-xl font-black text-amber-100 sm:text-2xl">العقود القريبة من الانتهاء</h2><p className="text-xs text-emerald-100/70">متابعة العقود التي تنتهي خلال 30 يومًا</p><div className="grid w-full max-w-lg grid-cols-2 gap-3"><div className="rounded-xl bg-black/20 p-3">إجمالي العقود<strong className="block text-2xl">{leases.length}</strong></div><div className="rounded-xl bg-black/20 p-3">أقرب انتهاء<strong className="block text-xl">{expiring[0]?.end_date||"لا توجد عقود قريبة"}</strong></div></div></button>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[{name:"إجمالي الغرف",value:totalRooms,Icon:LayoutGrid,color:"#7dd3fc"},{name:"إجمالي المؤجرة",value:occupiedRooms,Icon:BedDouble,color:"#fcd34d"},{name:"إجمالي المتاحة",value:freeRooms,Icon:Home,color:"#6ee7b7"},{name:"إجمالي المحجوزة",value:bookedRooms,Icon:CalendarCheck2,color:"#c4b5fd"}].map(x=><button key={x.name} onClick={()=>{setFilter(x.name==="إجمالي المؤجرة"?"مؤجرة":x.name==="إجمالي المتاحة"?"متاحة":x.name==="إجمالي المحجوزة"?"محجوزة":"الكل");document.getElementById("rooms-list")?.scrollIntoView({behavior:"smooth"});}} className={`${panel} flex min-h-[205px] flex-col items-center justify-center gap-2 p-4 text-center transition hover:-translate-y-1`} style={{borderColor:x.color}}><x.Icon size={68} style={{color:x.color}}/><span className="text-sm font-bold">{x.name}</span><strong className="text-3xl">{x.value}</strong><span className="text-xs text-emerald-100/60">عرض التفاصيل</span></button>)}</div>
    <section><h2 className="mb-2 text-center text-2xl font-black text-amber-300">✦ الملخص المالي ✦</h2><p className="mb-4 text-center text-xs text-emerald-100/65">الإيجارات المستحقة حتى اليوم والتحصيلات المسجلة فقط</p>{financial.error&&<p className="mb-3 rounded-xl border border-rose-400/40 p-3 text-sm text-rose-200">تعذر تحميل بعض السجلات المالية: {financial.error} — الأرقام غير متاحة حتى مراجعة الجداول</p>}<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{name:"إجمالي الإيجارات",kind:"rent",Icon:Banknote,color:"#fcd34d"},{name:"إجمالي المستحقات",kind:"dues",Icon:ReceiptText,color:"#fbbf24"},{name:"إجمالي فواتير المياه",kind:"water",Icon:Droplets,color:"#67e8f9"},{name:"إجمالي فواتير الكهرباء",kind:"electricity",Icon:Zap,color:"#fcd34d"}].map(x=>{const v=financialSummary(x.kind),ok=!financial.loading&&!financial.error;return <button key={x.name} onClick={()=>openReport(x.name)} className={`${panel} flex min-h-[260px] flex-col items-center p-4 text-center transition hover:brightness-125`} style={{borderColor:x.color}}><x.Icon size={83} style={{color:x.color}}/><h3 className="mt-3 text-sm font-black">{x.name}</h3><strong className="mt-2 text-2xl">{ok?money(v.total):"—"} <small className="text-xs font-normal">ريال</small></strong><div className="mt-auto grid w-full grid-cols-2 gap-2 pt-4"><div className="rounded-xl border border-emerald-300/40 bg-emerald-400/10 p-2 text-xs">التحصيل<strong className="mt-1 block text-lg">{ok?money(v.collected):"—"}</strong></div><div className="rounded-xl border border-amber-300/40 bg-amber-400/10 p-2 text-xs">المتبقي<strong className="mt-1 block text-lg">{ok?money(Math.max(0,v.total-v.collected)):"—"}</strong></div></div></button>})}</div></section>
    <section id="rooms-list" className={`${panel} p-3 sm:p-4`}><div className="mb-3 flex items-center gap-2 text-sm font-bold"><SlidersHorizontal size={19} className="text-amber-300"/>تصفية وبحث الغرف</div><div className="flex flex-wrap items-center gap-3"><div className="min-w-[150px] flex-1"><input className={field} value={search} onChange={e=>setSearch(e.target.value)} placeholder="رقم الغرفة أو المبنى أو الموقع"/></div><select className={`${field} max-w-52`} value={filter} onChange={e=>setFilter(e.target.value)}>{["الكل","كاملة","بالسرير","متاحة","مؤجرة","محجوزة","إشغال جزئي","مكتملة الإشغال"].map(x=><option key={x}>{x}</option>)}</select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/>الأرشيف</label><button onClick={openNew} disabled={!canWrite} className="rounded-xl bg-amber-300 px-4 py-3 font-bold text-[#073329] disabled:opacity-40">+ إضافة غرفة</button></div></section>
    {loading?<p className="py-16 text-center">جارٍ تحميل الغرف...</p>:visible.length===0?<div className={`${panel} p-12 text-center text-emerald-100/75`}>لا توجد غرف مطابقة للبحث.</div>:<div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">{visible.map(r=><article key={r.id} className={`${panel} p-5`}><div className="flex items-start justify-between gap-2"><div><h2 className="text-xl font-extrabold text-amber-200">غرفة {r.room_number}</h2><p className="mt-1 text-sm text-emerald-100/70">{r.building_name||"بدون اسم مبنى"} {r.city?`• ${r.city}`:""}</p></div><span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">{status(r)}</span></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-lg bg-white/10 px-3 py-2">{r.rental_mode==="full"?"تأجير كامل":"تأجير بالسرير"}</span><span className="rounded-lg bg-white/10 px-3 py-2">{r.room_type||"غير محدد"}</span>{r.rental_mode==="bed"&&<span className="rounded-lg bg-white/10 px-3 py-2">{beds.filter(b=>b.room_id===r.id).length} سرير</span>}</div><div className="mt-4 flex items-center gap-2 border-t border-amber-300/20 pt-3 text-amber-200"><Wallet size={18}/><strong>{money(Number(r.rent_amount))} ر.س</strong><span className="text-xs text-emerald-100/60">/ {r.rent_period}</span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>openEdit(r)} disabled={!canWrite} className="rounded-lg border border-amber-300/35 px-3 py-2 text-sm disabled:opacity-40"><Pencil size={15} className="inline"/> تعديل</button>{r.rental_mode==="bed"&&<button onClick={()=>{setBedRoom(r);setNewBed("");}} className="rounded-lg border border-amber-300/35 px-3 py-2 text-sm">الأسرّة</button>}{!r.archived_at&&<><button onClick={()=>startOperation("contract",r)} disabled={!canWrite} className="rounded-lg border border-emerald-300/35 px-3 py-2 text-sm disabled:opacity-40">عقد</button><button onClick={()=>startOperation("booking",r)} disabled={!canWrite} className="rounded-lg border border-emerald-300/35 px-3 py-2 text-sm disabled:opacity-40">حجز</button></>}<button onClick={()=>void archive(r)} disabled={!canWrite||busy} className="rounded-lg border border-amber-300/35 px-3 py-2 text-sm disabled:opacity-40"><Archive size={15} className="inline"/> {r.archived_at?"استعادة":"أرشفة"}</button></div></article>)}</div>}
   </div>

   {archivePicker&&<div dir="rtl" className="fixed inset-0 z-[140] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget&&!archiveBusy)setArchivePicker(false)}}>
    <section role="dialog" aria-modal="true" aria-label="إدارة أرشيف الغرف" className="relative mx-auto flex w-full min-w-0 flex-col overflow-hidden rounded-[20px] border border-sky-300/40 bg-[#06152c] text-white shadow-[0_25px_80px_rgba(0,0,0,.6)]" style={{width:"min(800px, calc(100vw - 32px))",maxWidth:"800px",height:"min(610px,88dvh)"}}>
     <div className="pointer-events-none absolute inset-0" style={{backgroundImage:"url('/delete.png')",backgroundSize:"contain",backgroundPosition:"center",backgroundRepeat:"no-repeat",backgroundColor:"#06152c"}}/>
     <div className="pointer-events-none absolute inset-0 bg-[#06152c]/45"/>
     <header className="relative z-10 shrink-0 border-b border-sky-300/25 bg-[#081a34]/75 px-4 py-3 backdrop-blur-sm sm:px-5">
      <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-3 text-lg font-black sm:text-xl"><Archive size={23} className="text-rose-300"/> إدارة أرشيف الغرف</h2><p className="mt-1 text-xs text-slate-300">أرشفة الغرف دون حذف العقود أو الأقساط أو التحصيلات المرتبطة بها</p></div><button type="button" disabled={archiveBusy} onClick={()=>setArchivePicker(false)} aria-label="إغلاق" className="rounded-xl border border-white/20 bg-white/5 p-2 hover:bg-white/15"><X size={22}/></button></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={()=>switchArchiveView("active")} className={`min-h-9 rounded-lg border px-3 text-xs font-black ${archiveView==="active"?"border-sky-300/70 bg-[#213b58] text-sky-100":"border-white/20 bg-[#101e33]/70 text-slate-300"}`}>الغرف الحالية ({rooms.filter(r=>!r.archived_at).length})</button><button type="button" onClick={()=>switchArchiveView("archived")} className={`min-h-9 rounded-lg border px-3 text-xs font-black ${archiveView==="archived"?"border-sky-300/70 bg-[#213b58] text-sky-100":"border-white/20 bg-[#101e33]/70 text-slate-300"}`}>الأرشيف ({rooms.filter(r=>!!r.archived_at).length})</button></div>
      <div className="relative mt-2"><Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="search" value={archiveSearch} onChange={e=>{setArchiveSearch(e.target.value);setArchiveConfirm(false)}} placeholder="ابحث برقم الغرفة أو الشقة أو المبنى..." className="h-10 w-full rounded-lg border border-sky-300/20 bg-[#09192c]/90 pr-10 pl-3 text-sm outline-none focus:border-sky-300/70"/></div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs"><span className="text-slate-300">المحدد: <strong className="text-rose-300">{archiveSelection.length}</strong> من {archiveCandidates.length} المعروضة</span><div className="flex gap-2"><button type="button" onClick={()=>{setArchiveSelection([...new Set([...archiveSelection,...archiveCandidates.map(r=>r.id)])]);setArchiveConfirm(false)}} className="underline decoration-slate-400 underline-offset-4">تحديد الكل</button><button type="button" onClick={()=>{setArchiveSelection([]);setArchiveConfirm(false)}} className="underline decoration-slate-400 underline-offset-4">إلغاء التحديد</button></div></div>
     </header>
     <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">{archiveCandidates.length===0?<p className="py-10 text-center text-slate-300">{archiveView==="archived"?"لا توجد غرف مؤرشفة مطابقة.":"لا توجد غرف مطابقة."}</p>:<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{archiveCandidates.map(r=><button key={r.id} type="button" aria-pressed={archiveSelection.includes(r.id)} disabled={archiveBusy} onClick={()=>{setArchiveSelection(prev=>prev.includes(r.id)?prev.filter(id=>id!==r.id):[...prev,r.id]);setArchiveConfirm(false)}} className={`flex min-h-[126px] min-w-0 flex-col items-stretch gap-2 rounded-xl border bg-[#101e33]/80 px-3 py-3 text-right transition hover:border-sky-300/60 disabled:opacity-60 ${archiveSelection.includes(r.id)?"border-rose-300/80 ring-1 ring-rose-300/40":"border-white/15"}`}><span className="flex w-full items-center justify-between gap-2"><strong className="min-w-0 break-words text-sm font-black leading-5 text-white">غرفة {r.room_number}</strong><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${archiveSelection.includes(r.id)?"border-rose-300 bg-rose-300 text-[#162034]":"border-white/30"}`}>{archiveSelection.includes(r.id)?"✓":""}</span></span><span className="block break-words text-xs leading-5 text-slate-300">{r.building_name||"بدون مبنى"}</span><span className="mt-auto block break-words text-[11px] leading-4 text-sky-100/85">{r.apartment_number?`شقة ${r.apartment_number} • `:""}{r.room_type||"نوع غير محدد"}</span></button>)}</div>}</div>
     <footer className="relative z-10 shrink-0 border-t border-sky-300/25 bg-[#081a34]/75 p-3 backdrop-blur-sm">{archiveConfirm&&archiveView==="active"&&<p className="mb-3 rounded-xl border border-rose-300/40 bg-rose-900/25 p-3 text-center text-sm font-bold text-rose-100">تأكيد أرشفة {archiveSelection.length} غرفة؟ لن تُحذف بيانات العقود أو الأقساط.</p>}<div className="flex gap-3"><button type="button" disabled={archiveBusy} onClick={()=>setArchivePicker(false)} className="min-h-10 flex-1 rounded-lg border border-white/20 bg-[#14243b] px-4 text-sm font-bold">إلغاء</button><button type="button" disabled={!canWrite||archiveBusy||archiveSelection.length===0} onClick={()=>void applyRoomArchiveSelection()} className={`min-h-10 flex-[2] rounded-lg px-4 text-sm font-black disabled:cursor-not-allowed disabled:opacity-45 ${archiveView==="active"?"bg-rose-400 text-[#25152a]":"bg-emerald-400 text-[#062c24]"}`}>{archiveBusy?"جارٍ التنفيذ...":archiveView==="archived"?`استعادة ${archiveSelection.length} غرفة`:archiveConfirm?"تأكيد الأرشفة":`أرشفة ${archiveSelection.length} غرفة`}</button></div></footer>
    </section>
   </div>}
    {report==="تقارير الغرف"&&<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm sm:p-4" onMouseDown={e=>{if(e.target===e.currentTarget){setReport(null);setReportRoomDetails(null);}}}>
    <section dir="rtl" role="dialog" aria-modal="true" aria-label="تقرير الغرف" className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-[20px] border border-amber-300/65 bg-[#06382f] text-white shadow-[0_25px_80px_rgba(0,0,0,.6)]">
     <header className="flex shrink-0 items-start justify-between gap-3 border-b border-amber-300/35 bg-[#0b4638] px-4 py-3"><div><h2 className="text-xl font-black text-amber-300">تقرير الغرف</h2><p className="text-xs text-emerald-100/70">تقرير حركة الغرف والبيانات المسجلة للشركة</p></div><button type="button" onClick={()=>setReport(null)} aria-label="إغلاق"><X size={21}/></button></header>
     <div className="grid shrink-0 grid-cols-2 gap-2 p-3 sm:grid-cols-4">{[{title:"إجمالي الغرف",value:totalRooms},{title:"المؤجرة",value:occupiedRooms},{title:"المتاحة",value:freeRooms},{title:"المحجوزة",value:bookedRooms}].map(item=><div key={item.title} className="rounded-xl border border-amber-300/40 bg-[#052d25] p-2 text-center"><span className="block text-xs text-emerald-100/85">{item.title}</span><strong className="text-lg font-black text-amber-300">{item.value}</strong></div>)}</div>
     <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 border-b border-amber-300/20 px-4 py-3 text-xs sm:text-sm"><span className="font-black text-amber-200">اختر حالات الغرف التي تظهر في التقرير:</span>{["متاحة","مؤجرة","محجوزة","صيانة"].map(state=><label key={state} className="flex cursor-pointer items-center gap-2 rounded-lg border border-amber-300/25 bg-[#052d25] px-3 py-2"><input type="checkbox" className="h-4 w-4 accent-amber-400" checked={roomReportStatuses.includes(state)} onChange={e=>setRoomReportStatuses(prev=>e.target.checked?[...prev,state]:prev.filter(value=>value!==state))}/><span>{state==="متاحة"?"متاحة / فارغة":state}</span></label>)}<span className="mr-auto text-emerald-100/75">المحدد: {roomReportRows.length} غرفة</span></div>
     <div className="relative shrink-0 px-3 pb-2"><Search size={17} className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-200"/><input type="search" value={reportSearch} onChange={e=>setReportSearch(e.target.value)} placeholder="بحث داخل التقرير برقم الغرفة أو المبنى أو المالك..." className={`${field} h-10 pr-10`}/></div>
     <div className="min-h-0 flex-1 overflow-auto px-3"><table className="w-full min-w-[780px] text-right text-xs sm:text-sm"><thead className="sticky top-0 z-10 bg-[#245b44] text-amber-100"><tr>{roomReportHeaders.map(h=><th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>)}<th className="px-3 py-2">الإجراءات</th></tr></thead><tbody>{roomReportRows.map(r=><tr key={r.id} className="border-b border-emerald-300/15 bg-[#06382f] hover:bg-[#115340]"><td className="px-3 py-2">{r.room_number}</td><td className="px-3 py-2">{r.building_name||"—"}</td><td className="px-3 py-2">{r.room_type||"—"}</td><td className="px-3 py-2">{status(r)}</td><td className="whitespace-nowrap px-3 py-2">{money(Number(r.rent_amount))} ر.س</td><td className="px-3 py-2">{owners.find(o=>o.id===r.owner_id)?.full_name||"—"}</td><td className="whitespace-nowrap px-3 py-2"><div className="flex gap-2"><button type="button" onClick={()=>setReportRoomDetails(r)} className="rounded-md border border-sky-300/60 px-2 py-1 text-sky-200">عرض</button><button type="button" disabled={!canWrite} onClick={()=>{setReport(null);openEdit(r);}} className="rounded-md border border-amber-300/60 px-2 py-1 text-amber-200 disabled:opacity-40">تعديل</button><button type="button" disabled={!canWrite} onClick={()=>void archive(r)} className="rounded-md border border-rose-300/60 px-2 py-1 text-rose-200 disabled:opacity-40">أرشفة</button></div></td></tr>)}</tbody></table>{roomReportRows.length===0&&<p className="py-8 text-center text-emerald-100/70">لا توجد غرف مطابقة للبحث</p>}</div>
     <footer className="grid shrink-0 grid-cols-3 gap-2 border-t border-amber-300/30 bg-[#07392f] p-3 text-xs font-black sm:text-sm"><button type="button" onClick={exportRoomReport} className="rounded-xl border border-emerald-300/60 bg-emerald-800/60 px-3 py-3">تصدير Excel</button><button type="button" onClick={printRoomReport} className="rounded-xl border border-rose-300/60 bg-rose-900/30 px-3 py-3">حفظ PDF</button><button type="button" onClick={printRoomReport} className="rounded-xl border border-sky-300/60 bg-sky-900/30 px-3 py-3">طباعة</button></footer>
    </section>
    {reportRoomDetails&&<div dir="rtl" className="fixed inset-0 z-[112] flex items-center justify-center bg-black/80 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setReportRoomDetails(null)}}><section role="dialog" aria-modal="true" aria-label="تفاصيل الغرفة" className="w-full max-w-lg rounded-2xl border border-amber-300/60 bg-[#06382f] p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black text-amber-300">تفاصيل غرفة {reportRoomDetails.room_number}</h3><button onClick={()=>setReportRoomDetails(null)} aria-label="إغلاق"><X/></button></div><div className="grid grid-cols-2 gap-3 text-sm">{[["المبنى",reportRoomDetails.building_name],["نوع الغرفة",reportRoomDetails.room_type],["الحالة",status(reportRoomDetails)],["الإيجار",`${money(Number(reportRoomDetails.rent_amount))} ر.س`],["المالك",owners.find(o=>o.id===reportRoomDetails.owner_id)?.full_name],["طريقة التأجير",reportRoomDetails.rental_mode==="bed"?"بالسرير":"بالكامل"],["المدينة",reportRoomDetails.city],["الملاحظات",reportRoomDetails.notes]].map(([key,value])=><div key={key} className="rounded-lg border border-white/15 p-2"><span className="block text-xs text-emerald-100/70">{key}</span><strong>{value||"—"}</strong></div>)}</div></section></div>}
   </div>}
  {report==="تقارير العقود"&&<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)setReport(null)}}><section dir="rtl" role="dialog" aria-modal="true" aria-label="تقرير عقود الغرف" className="flex h-auto max-h-[88dvh] w-full flex-col overflow-hidden rounded-2xl border border-amber-300/60 bg-[#07392f] shadow-2xl"><header className="flex shrink-0 items-center justify-between border-b border-amber-300/35 bg-[#0b4638] px-4 py-3"><div><h2 className="text-xl font-black text-amber-300">تقرير العقود</h2><p className="text-xs text-emerald-100/70">عقود الغرف المسجلة للشركة</p></div><button type="button" aria-label="إغلاق" onClick={()=>setReport(null)}><X size={21}/></button></header><nav aria-label="أقسام تقارير العقود" className="grid shrink-0 grid-cols-2 gap-3 border-b border-amber-300/25 px-4 py-3"><button type="button" onClick={()=>{setContractArchiveTab("current");setReportSearch("");}} className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-4 py-2 font-black transition ${contractArchiveTab==="current"?"border-amber-300 bg-amber-300/20 text-amber-200":"border-emerald-300/30 bg-[#052d25] text-emerald-100/70 hover:bg-emerald-900/50"}`}>العقود الحالية</button><button type="button" onClick={()=>{setContractArchiveTab("archive");setReportSearch("");}} className={`flex min-h-[46px] items-center justify-center gap-2 rounded-xl border px-4 py-2 font-black transition ${contractArchiveTab==="archive"?"border-amber-300 bg-amber-300/20 text-amber-200":"border-emerald-300/30 bg-[#052d25] text-emerald-100/70 hover:bg-emerald-900/50"}`}><Archive size={18}/> أرشيف العقود ({leases.filter(l=>!!l.archived_at).length})</button></nav>{contractArchiveTab==="current"&&<div className="grid shrink-0 grid-cols-2 gap-2 p-3 sm:grid-cols-4">{[{title:"إجمالي العقود",value:contractReportCounts.total},{title:"السارية",value:contractReportCounts.active},{title:"المنتهية",value:contractReportCounts.expired},{title:"القادمة",value:contractReportCounts.upcoming}].map(x=><div key={x.title} className="rounded-xl border border-amber-300/40 bg-[#052d25] p-2 text-center"><span className="block text-xs text-emerald-100/85">{x.title}</span><strong className="text-lg font-black text-amber-300">{x.value}</strong></div>)}</div>}<div className="relative shrink-0 px-3 pb-2"><Search size={17} className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-200"/><input type="search" className={`${field} h-10 pr-10`} value={reportSearch} onChange={e=>setReportSearch(e.target.value)} placeholder="بحث برقم العقد أو الغرفة أو المستأجر أو المالك..."/></div><div className="min-h-0 flex-1 overflow-auto px-3"><table className="w-full min-w-[1100px] text-right text-xs sm:text-sm"><thead className="sticky top-0 z-10 bg-[#245b44] text-amber-100"><tr>{contractReportHeaders.map(h=><th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>)}{contractArchiveTab==="archive"&&<th className="px-3 py-2">تاريخ الأرشفة</th>}<th className="px-3 py-2">الإجراءات</th></tr></thead><tbody>{contractReportRows.map(l=><tr key={l.id} className="border-b border-emerald-300/15 bg-[#06382f] hover:bg-[#115340]">{[l.contract_number||"—",l.contract_type||"إيجار",rooms.find(r=>r.id===l.room_id)?.room_number||"—",tenants.find(t=>t.id===l.tenant_id)?.full_name||"—",owners.find(o=>o.id===(l.owner_id||rooms.find(r=>r.id===l.room_id)?.owner_id))?.full_name||"—",l.start_date,l.end_date,`${money(Number(l.rent_amount))} ر.س`,contractReportStatus(l)].map((v,i)=><td key={i} className="whitespace-nowrap px-3 py-2">{v}</td>)}{contractArchiveTab==="archive"&&<td className="whitespace-nowrap px-3 py-2">{l.archived_at?new Date(l.archived_at).toLocaleString("ar-SA"):"—"}</td>}<td className="px-3 py-3"><div className="flex min-w-[230px]  items-center justify-center gap-2"><button type="button" onClick={()=>setReportContractDetails(l)} className="min-w-[68px] rounded-lg border border-sky-300/70 bg-sky-900/35 px-3 py-2.5 text-sm font-bold text-sky-100 hover:bg-sky-800/50">عرض</button>{contractArchiveTab==="current"&&<button type="button" disabled={!canWrite||reportContractBusy} onClick={()=>openReportContractEdit(l)} className="min-w-[68px] rounded-lg border border-amber-300/70 bg-amber-900/25 px-3 py-2.5 text-sm font-bold text-amber-100 hover:bg-amber-800/40 disabled:cursor-not-allowed disabled:opacity-40">تعديل</button>}{contractArchiveTab==="current"&&<button type="button" disabled={!canWrite||reportContractBusy||!canDeleteReportContract(l)} title={canDeleteReportContract(l)?"نقل العقد إلى الأرشيف":"الأرشفة متاحة للعقود المتوقفة أو المنتهية أو الملغاة فقط"} onClick={()=>void deleteReportContract(l)} className="min-w-[68px] rounded-lg border border-rose-300/70 bg-rose-900/30 px-3 py-2.5 text-sm font-bold text-rose-100 hover:bg-rose-800/50 disabled:cursor-not-allowed disabled:opacity-40">حذف</button>}{contractArchiveTab==="archive"&&<button type="button" disabled={!canWrite||reportContractBusy} onClick={()=>void restoreReportContract(l)} className="min-w-[90px] rounded-lg border border-emerald-300/70 bg-emerald-800/45 px-3 py-2.5 text-sm font-bold text-emerald-100 hover:bg-emerald-700/50 disabled:opacity-40">استعادة</button>}</div></td></tr>)}</tbody></table>{contractReportRows.length===0&&<p className="py-8 text-center text-emerald-100/70">{contractArchiveTab==="archive"?"لا توجد عقود مؤرشفة مطابقة للبحث":"لا توجد عقود مطابقة للبحث"}</p>}</div><footer className="grid shrink-0 grid-cols-3 gap-3 border-t border-amber-300/30 bg-[#07392f] p-4 text-sm font-black sm:text-base"><button type="button" onClick={exportContractReport} className="rounded-xl border border-emerald-300/60 bg-emerald-800/60 px-5 py-4">تصدير Excel</button><button type="button" onClick={printContractReport} className="rounded-xl border border-rose-300/60 bg-rose-900/30 px-5 py-4">حفظ PDF</button><button type="button" onClick={printContractReport} className="rounded-xl border border-sky-300/60 bg-sky-900/30 px-5 py-4">طباعة</button></footer></section>{editingReportContract&&<div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 p-2 backdrop-blur-sm sm:p-4" onMouseDown={e=>{if(e.target===e.currentTarget&&!reportContractBusy)setEditingReportContract(null)}}>
<section dir="rtl" role="dialog" aria-modal="true" aria-label="تعديل العقد والاستحقاقات" className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[22px] border border-amber-300/65 bg-[#06382f] text-white shadow-2xl">
<header className="flex shrink-0 items-start justify-between border-b border-amber-300/35 bg-[#0b493b] px-5 py-4"><div><h3 className="text-xl font-black text-amber-300">تعديل العقد وجميع الاستحقاقات</h3><p className="mt-1 text-xs text-emerald-100/75">تعديل البيانات والعقود والأقساط في عملية واحدة، مع حماية التحصيلات المسجلة</p></div><button type="button" aria-label="إغلاق" disabled={reportContractBusy} onClick={()=>setEditingReportContract(null)}><X/></button></header>
<div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
{reportContractLoading?<p className="py-8 text-center">جارٍ تحميل بيانات العقد والاستحقاقات...</p>:<>
{reportContractError&&<p role="alert" className="rounded-xl border border-rose-400/50 bg-rose-900/30 p-3 text-sm text-rose-100">{reportContractError}</p>}
<div><h4 className="mb-3 border-b border-amber-300/30 pb-2 text-base font-black text-amber-200">بيانات العقد الأساسية</h4><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
{([ ["رقم العقد *","contract_number"],["قيمة العقد (ر.س) *","rent_amount"] ] as const).map(([name,key])=><label key={key} className="text-sm font-bold">{name}<input type={key==="rent_amount"?"number":"text"} min={key==="rent_amount"?0:undefined} step={key==="rent_amount"?"0.01":undefined} className={`${field} mt-1 h-11`} value={reportContractForm[key]} onChange={e=>setReportContractForm(p=>({...p,[key]:e.target.value}))}/></label>)}
<label className="text-sm font-bold">نوع العقد<select className={`${field} mt-1 h-11`} value={reportContractForm.contract_type} onChange={e=>setReportContractForm(p=>({...p,contract_type:e.target.value}))}>{Array.from(new Set([...contractTypes,reportContractForm.contract_type].filter(Boolean))).map(t=><option key={t} value={t}>{t}</option>)}</select></label>
<label className="text-sm font-bold">الغرفة *<select className={`${field} mt-1 h-11`} value={reportContractForm.room_id} onChange={e=>setReportContractForm(p=>({...p,room_id:e.target.value,bed_id:"",owner_id:rooms.find(r=>r.id===e.target.value)?.owner_id||""}))}>{rooms.map(r=><option key={r.id} value={r.id}>غرفة {r.room_number} — {r.building_name||"بدون مبنى"}</option>)}</select></label>
{rooms.find(r=>r.id===reportContractForm.room_id)?.rental_mode==="bed"&&<label className="text-sm font-bold">السرير *<select className={`${field} mt-1 h-11`} value={reportContractForm.bed_id} onChange={e=>setReportContractForm(p=>({...p,bed_id:e.target.value}))}><option value="">اختر السرير</option>{beds.filter(b=>b.room_id===reportContractForm.room_id).map(b=><option key={b.id} value={b.id}>{b.bed_number}</option>)}</select></label>}
<label className="text-sm font-bold">المستأجر *<select className={`${field} mt-1 h-11`} value={reportContractForm.tenant_id} onChange={e=>setReportContractForm(p=>({...p,tenant_id:e.target.value}))}>{tenants.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></label>
<label className="text-sm font-bold">المالك<select className={`${field} mt-1 h-11`} value={reportContractForm.owner_id} onChange={e=>setReportContractForm(p=>({...p,owner_id:e.target.value}))}><option value="">بدون مالك</option>{owners.map(o=><option key={o.id} value={o.id}>{o.full_name}</option>)}</select></label>
{([ ["تاريخ البداية","start_date"],["تاريخ النهاية","end_date"] ] as const).map(([name,key])=><label key={key} className="text-sm font-bold">{name}<input type="date" className={`${field} mt-1 h-11`} value={reportContractForm[key]} onChange={e=>setReportContractForm(p=>({...p,[key]:e.target.value}))}/></label>)}
<label className="text-sm font-bold">حالة العقد<select className={`${field} mt-1 h-11`} value={reportContractForm.status} onChange={e=>setReportContractForm(p=>({...p,status:e.target.value}))}>{Array.from(new Set(["نشط","منتهي","ملغي",reportContractForm.status])).map(x=><option key={x}>{x}</option>)}</select></label>
<label className="text-sm font-bold">دورية الإيجار<select className={`${field} mt-1 h-11`} value={reportContractForm.rent_period} onChange={e=>setReportContractForm(p=>({...p,rent_period:e.target.value}))}>{Array.from(new Set(["يومي","أسبوعي","شهري","ربع سنوي","نصف سنوي","سنوي",reportContractForm.rent_period])).map(x=><option key={x}>{x}</option>)}</select></label>
<label className="text-sm font-bold">مدة العقد<select className={`${field} mt-1 h-11`} value={reportContractForm.contract_duration} onChange={e=>setReportContractForm(p=>({...p,contract_duration:e.target.value}))}>{Array.from(new Set([...durationOptions,reportContractForm.contract_duration])).map(x=><option key={x}>{x}</option>)}</select></label>
<label className="text-sm font-bold sm:col-span-2 lg:col-span-3">ملاحظات العقد<textarea rows={2} className={`${field} mt-1`} value={reportContractForm.notes} onChange={e=>setReportContractForm(p=>({...p,notes:e.target.value}))}/></label>
</div></div>
<div><div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-amber-300/30 pb-2"><h4 className="text-base font-black text-amber-200">جدول الاستحقاقات والأقساط</h4><button type="button" disabled={reportContractInstallments.some(x=>x.paid>0)} onClick={()=>setReportContractInstallments(p=>[...p,{id:null,installment_no:p.length+1,due_date:"",amount:"0",paid:0}])} className="rounded-lg border border-emerald-300/50 bg-emerald-800/50 px-4 py-2 text-sm font-bold disabled:opacity-40"><Plus size={15} className="inline"/> إضافة قسط</button></div>
<p className="mb-3 text-xs text-emerald-100/70">الأقساط التي لها تحصيلات تُعرض للمراجعة، ولا يمكن تغيير جدولها أو مبالغها إلا من إجراء مالي معتمد يحافظ على التحصيلات.</p>
<div className="overflow-x-auto"><table className="w-full min-w-[690px] text-right text-sm"><thead className="bg-[#245b44] text-amber-100"><tr>{["القسط","تاريخ الاستحقاق","قيمة القسط","المحصل","المتبقي","إجراء"].map(h=><th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody>{reportContractInstallments.map((x,i)=><tr key={x.id||`new-${i}`} className="border-b border-white/10"><td className="px-3 py-2">{i+1}</td><td className="px-3 py-2"><input type="date" disabled={x.paid>0} className={`${field} h-10 disabled:opacity-60`} value={x.due_date} onChange={e=>setReportContractInstallments(p=>p.map((v,j)=>j===i?{...v,due_date:e.target.value}:v))}/></td><td className="px-3 py-2"><input type="number" min={x.paid} step="0.01" disabled={x.paid>0} className={`${field} h-10 disabled:opacity-60`} value={x.amount} onChange={e=>setReportContractInstallments(p=>p.map((v,j)=>j===i?{...v,amount:e.target.value}:v))}/></td><td className="px-3 py-2">{money(x.paid)} ر.س</td><td className="px-3 py-2 text-amber-200">{money(Math.max(0,Number(x.amount||0)-x.paid))} ر.س</td><td className="px-3 py-2"><button type="button" disabled={x.paid>0||reportContractInstallments.length<=1||reportContractInstallments.some(v=>v.paid>0)} onClick={()=>setReportContractInstallments(p=>p.filter((_,j)=>j!==i))} className="rounded-lg border border-rose-300/50 px-3 py-2 text-rose-200 disabled:opacity-35">حذف</button></td></tr>)}</tbody></table></div>
<div className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-amber-300/35 bg-black/20 p-3 text-sm sm:grid-cols-3"><span>إجمالي الأقساط: <b className="text-amber-200">{money(reportContractInstallments.reduce((s,x)=>s+Number(x.amount||0),0))} ر.س</b></span><span>إجمالي المحصل: <b>{money(reportContractInstallments.reduce((s,x)=>s+x.paid,0))} ر.س</b></span><span>المتبقي: <b className="text-amber-200">{money(reportContractInstallments.reduce((s,x)=>s+Math.max(0,Number(x.amount||0)-x.paid),0))} ر.س</b></span></div></div>
</>}
</div><footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-amber-300/30 bg-[#0b493b] p-4"><button type="button" disabled={reportContractBusy} onClick={()=>setEditingReportContract(null)} className="min-h-12 rounded-xl border border-white/40 font-bold">إلغاء</button><button type="button" disabled={reportContractBusy||reportContractLoading||!canWrite} onClick={()=>void saveReportContractEdit()} className="min-h-12 rounded-xl bg-amber-300 font-black text-[#06382f] disabled:opacity-50">{reportContractBusy?"جارٍ الحفظ...":"حفظ جميع التعديلات"}</button></footer>
</section></div>}
{reportContractDetails&&<div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4" onMouseDown={e=>{if(e.target===e.currentTarget)setReportContractDetails(null)}}><section dir="rtl" role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl border border-amber-300/60 bg-[#06382f] p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black text-amber-300">تفاصيل العقد {reportContractDetails.contract_number||""}</h3><button onClick={()=>setReportContractDetails(null)} aria-label="إغلاق"><X/></button></div><div className="grid grid-cols-2 gap-3 text-sm">{[["رقم العقد",reportContractDetails.contract_number],["نوع العقد",reportContractDetails.contract_type],["الغرفة",rooms.find(r=>r.id===reportContractDetails.room_id)?.room_number],["المستأجر",tenants.find(t=>t.id===reportContractDetails.tenant_id)?.full_name],["المالك",owners.find(o=>o.id===(reportContractDetails.owner_id||rooms.find(r=>r.id===reportContractDetails.room_id)?.owner_id))?.full_name],["البداية",reportContractDetails.start_date],["النهاية",reportContractDetails.end_date],["القيمة",`${money(Number(reportContractDetails.rent_amount))} ر.س`],["الحالة",contractReportStatus(reportContractDetails)]].map(([key,value])=><div key={key} className="rounded-lg border border-white/15 p-2"><span className="block text-xs text-emerald-100/70">{key}</span><strong>{value||"—"}</strong></div>)}</div></section></div>}</div>}
  {(report==="تقارير العملاء"||report==="تقارير الملاك")&&<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-2 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget&&!reportPerson)setReport(null)}}><section dir="rtl" role="dialog" aria-modal="true" className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-2xl border border-amber-300/60 bg-[#07392f] shadow-2xl"><header className="flex items-center justify-between border-b border-amber-300/30 bg-[#0b4638] px-4 py-3"><div><h2 className="text-xl font-black text-amber-300">{report}</h2><p className="text-xs text-emerald-100/70">بيانات {report==="تقارير العملاء"?"العملاء":"الملاك"} المسجلة للشركة</p></div><button type="button" onClick={()=>setReport(null)} aria-label="إغلاق"><X size={21}/></button></header><div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">{peopleReportStats.map(([name,value])=><div key={String(name)} className="rounded-xl border border-amber-300/35 bg-[#052d25] p-2 text-center"><span className="block text-xs text-emerald-100/80">{name}</span><strong className="text-lg font-black text-amber-300">{value}</strong></div>)}</div><div className="px-3 pb-2"><input type="search" className={`${field} h-10`} value={reportSearch} onChange={e=>setReportSearch(e.target.value)} placeholder="بحث داخل التقرير..."/></div><div className="min-h-0 flex-1 overflow-auto px-3"><table className="w-full min-w-[1000px] text-right text-xs sm:text-sm"><thead className="sticky top-0 bg-[#245b44] text-amber-100"><tr>{peopleReportHeaders.map(h=><th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>)}<th className="px-3 py-2">الإجراءات</th></tr></thead><tbody>{peopleReportRows.map(item=><tr key={item.id} className="border-b border-emerald-300/15 hover:bg-[#115340]">{item.row.map((v,i)=><td key={i} className="whitespace-nowrap px-3 py-2">{v}</td>)}<td className="px-3 py-2"><div className="flex items-center gap-2">{(["view","edit","delete"] as const).map(mode=><button type="button" key={mode} disabled={mode!=="view"&&!canWrite} onClick={()=>openReportPerson(item.kind,item.id,mode)} className={`rounded-lg border px-3 py-1.5 font-bold disabled:opacity-30 ${mode==="view"?"border-sky-300/60 text-sky-200":mode==="edit"?"border-amber-300/60 text-amber-200":"border-rose-300/60 text-rose-200"}`}>{mode==="view"?"عرض":mode==="edit"?"تعديل":"حذف"}</button>)}</div></td></tr>)}</tbody></table>{!peopleReportRows.length&&<p className="py-8 text-center text-emerald-100/70">لا توجد سجلات مطابقة للبحث</p>}</div><footer className="grid grid-cols-3 gap-2 border-t border-amber-300/30 p-3 font-bold"><button type="button" onClick={peopleReportExport} className="rounded-xl border border-emerald-300/50 bg-emerald-800/60 p-3">تصدير Excel</button><button type="button" onClick={peopleReportPrint} className="rounded-xl border border-rose-300/50 bg-rose-900/30 p-3">حفظ PDF</button><button type="button" onClick={peopleReportPrint} className="rounded-xl border border-sky-300/50 bg-sky-900/30 p-3">طباعة</button></footer></section></div>}
  {reportPerson&&<div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm"><section dir="rtl" role="dialog" aria-modal="true" className="w-full max-w-2xl rounded-2xl border border-amber-300/60 bg-[#07392f] p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black text-amber-300">{reportPerson.mode==="view"?"عرض":reportPerson.mode==="edit"?"تعديل":"حذف"} بيانات {reportPerson.kind==="tenant"?"العميل":"المالك"}</h2><button type="button" onClick={()=>setReportPerson(null)}><X/></button></div>{reportPerson.mode==="delete"?<p className="mb-4 text-sm text-rose-100">هل تريد حذف {personForm.full_name}؟ لا يمكن الحذف عند وجود عقود أو حجوزات أو وحدات مرتبطة بالسجل.</p>:<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{([...[ ["الاسم","full_name"],["الجوال","phone"],...(reportPerson.kind==="owner"?[["الجوال الإضافي","mobile"]]:[]),["رقم الهوية","identity_number"],["الجنسية","nationality"],["البريد الإلكتروني","email"],...(reportPerson.kind==="tenant"?[["ملاحظات","notes"]]:[])] ] as string[][]).map(([title,key])=><label key={key} className="text-sm font-bold">{title}<input disabled={reportPerson.mode==="view"} className={`${field} mt-1 disabled:opacity-75`} value={personForm[key as keyof typeof personForm]} onChange={e=>setPersonForm(p=>({...p,[key]:e.target.value}))}/></label>)}</div>}{personError&&<p role="alert" className="mt-3 rounded-lg border border-rose-400/50 bg-rose-900/30 p-3 text-sm text-rose-100">{personError}</p>}<footer className="mt-5 grid grid-cols-2 gap-3"><button type="button" onClick={()=>setReportPerson(null)} className="rounded-xl border border-emerald-300/50 p-3">إغلاق</button>{reportPerson.mode!=="view"&&<button type="button" disabled={!canWrite||personBusy} onClick={()=>void saveReportPerson()} className={`rounded-xl p-3 font-black disabled:opacity-40 ${reportPerson.mode==="delete"?"bg-rose-700":"bg-amber-300 text-[#07392f]"}`}>{personBusy?"جارٍ التنفيذ...":reportPerson.mode==="delete"?"تأكيد الحذف":"حفظ التعديلات"}</button>}</footer></section></div>}
  {report&&report!=="تقارير الغرف"&&report!=="تقارير العقود"&&report!=="تقارير العملاء"&&report!=="تقارير الملاك"&&<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-3" onClick={()=>setReport(null)}><section dir="rtl" role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-amber-300/55 bg-[#07352d] p-5 shadow-2xl" onClick={e=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-black text-amber-300">{report}</h2><button onClick={()=>setReport(null)} aria-label="إغلاق"><X/></button></div>{report==="خريطة الغرف" ? <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{rooms.filter(r=>!r.archived_at).map(r=><div key={r.id} className="rounded-xl border border-amber-300/35 bg-emerald-950/70 p-4"><div className="flex items-center justify-between gap-2"><strong className="text-amber-200">غرفة {r.room_number}</strong><BedDouble size={22} className="text-amber-300"/></div><p className="mt-2 text-sm">{r.building_name||"بدون مبنى"} — {r.room_type||"نوع غير محدد"}</p><p className="mt-2 text-xs text-emerald-200">{status(r)} • {r.rental_mode==="bed"?"بالسرير":"بالكامل"}</p></div>)}</div> : <><input className={`${field} mb-4`} value={reportSearch} onChange={e=>setReportSearch(e.target.value)} placeholder="بحث داخل التقرير"/>{report?.startsWith("إجمالي")&&financial.error&&<p className="mb-3 text-sm text-rose-200">تعذر تحميل البيانات المالية: {financial.error}</p>}<div className="overflow-x-auto rounded-xl border border-amber-300/20"><table className="w-full min-w-[560px] text-right text-sm"><thead className="bg-amber-300/15 text-amber-200"><tr>{reportHeaders.map(h=><th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-white/10">{reportRows().filter(row=>row.some(cell=>cell.toLowerCase().includes(reportSearch.toLowerCase()))).map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j} className="whitespace-nowrap p-3">{cell}</td>)}</tr>)}</tbody></table></div>{reportRows().length===0&&<p className="p-5 text-center text-emerald-100/70">لا توجد سجلات لعرضها حاليًا</p>}</>}</section></div>}
  {modal&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setModal(false)}}>
    <div dir="rtl" role="dialog" aria-modal="true" aria-label={editing?"تعديل بيانات الغرفة":"إضافة غرفة جديدة"} className="flex h-auto max-h-[90dvh] min-h-[min(620px,90dvh)] flex-col overflow-hidden rounded-[26px] border border-amber-400/50 bg-[#04271f] text-white shadow-[0_25px_85px_rgba(0,0,0,.7)]" style={{width:"min(1060px, calc(100vw - 32px))",maxWidth:"1060px",minWidth:0,marginInline:"auto"}}>
     <header className="relative flex shrink-0 items-center justify-center border-b border-amber-300/30 bg-[#06382e] px-12 py-2.5 text-center"><div className="flex flex-col items-center gap-0.5"><p className="text-[11px] font-extrabold tracking-[.18em] text-amber-300">AQARY SMART</p><h2 className="flex items-center gap-2 text-xl font-black sm:text-2xl"><BedDouble size={27} className="text-amber-300"/>{editing?"تعديل بيانات الغرفة":"إضافة غرفة جديدة"}</h2><p className="text-sm text-emerald-100/75">سجل بيانات الغرفة وموقعها واربطها بالمالك</p></div><button type="button" aria-label="إغلاق" onClick={()=>setModal(false)} className="absolute left-4 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl border border-white/20 bg-white/5"><X size={20}/></button></header>
     <div className="mx-auto flex w-full max-w-[660px] shrink-0 gap-2 bg-[#052f27] px-4 py-2 sm:gap-3"><button type="button" onClick={()=>setRoomTab("room")} className={`flex min-h-[45px] flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-black sm:text-base ${roomTab==="room"?"border-amber-300 bg-amber-300 text-[#082d24]":"border-emerald-300/35 bg-[#073d32] text-emerald-100"}`}><BedDouble size={24}/>بيانات الغرفة</button><button type="button" onClick={()=>setRoomTab("owner")} className={`flex min-h-[45px] flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 text-sm font-black sm:text-base ${roomTab==="owner"?"border-amber-300 bg-amber-300 text-[#082d24]":"border-emerald-300/35 bg-[#073d32] text-emerald-100"}`}><UserRoundCheck size={24}/>بيانات المالك</button></div>
     <div className="min-h-0 flex-1 overflow-y-auto"><div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)]"><div className="min-w-0 p-3 sm:p-4">
      {error&&<p role="alert" className="mb-4 rounded-xl border border-red-400/50 bg-red-950/60 p-3 text-sm text-red-100">{error}</p>}
       {roomTab==="room"?<><h3 className="mb-2 flex items-center gap-2 border-b border-amber-300/25 pb-2 font-black text-amber-200"><BedDouble size={19}/>بيانات الغرفة الأساسية</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {([ ["رقم الغرفة *","room_number","مثال: 101"],["رقم الشقة","apartment_number","مثال: 5"],["اسم المبنى","building_name","مثال: عمارة ستار"]] as const).map(([name,key,hint])=><label key={key} className="min-w-0"><span className={label}>{name}</span><input className={`${field} min-h-[47px] py-2.5 text-sm sm:text-base`} placeholder={hint} value={form[key]??""} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
        {optionSelect("نوع الغرفة","room_type",form.room_type??"",v=>setForm({...form,room_type:v}))}
        {optionSelect("طريقة التأجير","rental_mode",form.rental_mode==="bed"?"بالسرير":"الغرفة بالكامل",v=>setForm({...form,rental_mode:v==="بالسرير"?"bed":"full"}))}
        <label><span className={label}>عدد الأسرّة</span><input type="number" min="1" className={`${field} min-h-[47px] py-2.5 text-sm sm:text-base`} value={form.beds_count} onChange={e=>setForm({...form,beds_count:Number(e.target.value)})}/></label>
        <label><span className={label}>قيمة الإيجار (ريال)</span><input type="number" min="0" step="0.01" className={`${field} min-h-[47px] py-2.5 text-sm sm:text-base`} value={form.rent_amount} onChange={e=>setForm({...form,rent_amount:Number(e.target.value)})}/></label>
        {optionSelect("دورية الإيجار","rent_period",form.rent_period,v=>setForm({...form,rent_period:v}))}
        {optionSelect("حالة الغرفة","room_status",form.room_status,v=>setForm({...form,room_status:v}))}
       </div><h3 className="mb-2 mt-4 flex items-center gap-2 border-b border-amber-300/25 pb-2 font-black text-amber-200"><Home size={19}/>الموقع والعنوان</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label><span className={label}>المنطقة</span><select className={`${field} min-h-[47px] py-2.5 text-sm sm:text-base`} value={form.region??""} onChange={e=>setForm({...form,region:e.target.value,city:"",district_street:"",nearest_landmark:""})}><option value="">اختر المنطقة</option>{SA_REGIONS.map(x=><option key={x}>{x}</option>)}</select></label>
        {optionSelect("المدينة","city",form.city??"",v=>setForm({...form,city:v,district_street:"",nearest_landmark:""}),!form.region)}
        {optionSelect("الحي / الشارع","district",form.district_street??"",v=>setForm({...form,district_street:v}),!form.region)}
        {optionSelect("أقرب معلم","landmark",form.nearest_landmark??"",v=>setForm({...form,nearest_landmark:v}),!form.region)}
       </div><label className="mt-3 block"><span className={label}>ملاحظات إضافية</span><textarea rows={2} className={`${field} min-h-[47px] py-2.5 text-sm sm:text-base`} value={form.notes??""} onChange={e=>setForm({...form,notes:e.target.value})}/></label></>:
      <section className="space-y-5"><h3 className="flex items-center gap-2 border-b border-amber-300/25 pb-3 text-lg font-black text-amber-200"><UserRoundCheck size={23}/>بيانات مالك الغرفة</h3><p className="text-sm leading-7 text-emerald-100/75">اختر مالكًا مسجلًا أو أضف مالكًا جديدًا، وسيتم ربطه بالغرفة عند الحفظ.</p><div className="grid grid-cols-2 gap-3"><button type="button" onClick={()=>setOwnerMode("existing")} className={`rounded-xl border px-3 py-3 text-sm font-black ${ownerMode==="existing"?"border-amber-300 bg-amber-300/20 text-amber-200":"border-white/20"}`}>اختيار مالك مسجل</button><button type="button" onClick={()=>{setOwnerMode("new");setForm({...form,owner_id:null})}} className={`rounded-xl border px-3 py-3 text-sm font-black ${ownerMode==="new"?"border-amber-300 bg-amber-300/20 text-amber-200":"border-white/20"}`}>+ مالك جديد</button></div>
      {ownerMode==="existing"?<label className="block"><span className={label}>المالك</span><select className={`${field} min-h-[43px] py-2.5 text-sm sm:text-base`} value={form.owner_id??""} onChange={e=>setForm({...form,owner_id:e.target.value||null})}><option value="">بدون مالك محدد</option>{owners.map(o=><option key={o.id} value={o.id}>{o.full_name}</option>)}</select></label>:<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{([["full_name","اسم المالك *","text"],["mobile","رقم الجوال","tel"],["phone","رقم الهاتف","tel"],["email","البريد الإلكتروني","email"],["nationality","الجنسية","text"],["identity_number","رقم الهوية / الإقامة","text"]] as const).map(([key,name,type])=><label key={key}><span className={label}>{name}</span><input type={type} className={`${field} min-h-[43px] py-2.5 text-sm sm:text-base`} value={newOwner[key]} onChange={e=>setNewOwner({...newOwner,[key]:e.target.value})}/></label>)}</div>}<p className="rounded-xl border border-amber-300/25 bg-amber-300/5 p-3 text-xs leading-6 text-amber-100/80">يمكن ربط أكثر من غرفة بنفس المالك. بيانات الملاك مشتركة مع قسم الشقق.</p></section>}
     </div><aside className="relative hidden min-h-0 overflow-hidden border-r border-amber-300/25 lg:block" style={{backgroundImage:"linear-gradient(0deg,rgba(2,31,26,.35),rgba(2,31,26,.05)),url('/room.png')",backgroundSize:"cover",backgroundPosition:"center center",backgroundRepeat:"no-repeat",backgroundColor:"#031e2c"}}><div className="absolute inset-0 bg-gradient-to-t from-[#031e19]/75 via-transparent to-transparent"/><div className="relative flex h-full flex-col items-center justify-end px-4 pb-5 text-center"><div className="w-full max-w-[320px] rounded-2xl border border-amber-300/35 bg-[#042a23]/85 px-5 py-4 backdrop-blur-sm"><h3 className="text-xl font-black text-amber-200">أضف غرفتك الجديدة</h3><p className="mt-2 text-sm text-emerald-100/90">إدارة الغرف والأسرّة والملاك داخل عقاري سمارت</p></div></div></aside></div></div>
     <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-amber-300/30 bg-[#06382e] px-4 py-3"><button type="button" onClick={()=>setModal(false)} disabled={busy} className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-2.5 text-base font-black hover:bg-white/15"><X size={18}/>إغلاق</button><button type="button" disabled={busy} onClick={()=>void saveRoom()} className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-300 px-7 py-2.5 text-base font-black text-[#073329] disabled:opacity-50"><Save size={18}/>{busy?"جارٍ الحفظ...":editing?"حفظ التعديلات":"حفظ وإضافة الغرفة"}</button></footer>
    </div></div>}
   {optionModal&&<div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4" onMouseDown={e=>{if(e.target===e.currentTarget&&!optionSaving)setOptionModal(null)}}><div dir="rtl" role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-amber-300/50 bg-[#06382e] p-5 shadow-2xl"><h3 className="mb-4 text-lg font-black text-amber-300">إضافة {optionModal.title}</h3>{error&&<p className="mb-3 rounded-lg border border-rose-400/40 bg-rose-950/40 p-2 text-sm text-rose-200">{error}</p>}<label className={label}>القيمة الجديدة</label><input autoFocus className={`${field} mb-5 min-h-[47px]`} value={optionName} onChange={e=>setOptionName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void addOption()}} placeholder={`اكتب ${optionModal.title}`}/><div className="flex justify-end gap-2"><button type="button" disabled={optionSaving} onClick={()=>{setOptionModal(null);setError("")}} className="rounded-xl border border-white/30 px-5 py-2">إلغاء</button><button type="button" disabled={optionSaving||!optionName.trim()} onClick={()=>void addOption()} className="rounded-xl bg-amber-300 px-5 py-2 font-bold text-[#06382e] disabled:opacity-40">{optionSaving?"جارٍ الحفظ...":"حفظ الخيار"}</button></div></div></div>}
  {bedRoom&&<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3"><div className="w-full max-w-lg rounded-3xl border border-amber-300/50 bg-[#08372D] p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-amber-300">أسرّة الغرفة {bedRoom.room_number}</h2><button onClick={()=>setBedRoom(null)}><X/></button></div><p className="mb-4 text-sm text-emerald-100/75">عدد الأسرّة المسجلة: {beds.filter(b=>b.room_id===bedRoom.id).length} / العدد المتوقع: {bedRoom.beds_count}</p><div className="max-h-64 space-y-2 overflow-auto">{beds.filter(b=>b.room_id===bedRoom.id).map(b=><div key={b.id} className="flex items-center justify-between rounded-xl border border-white/10 p-3"><span>سرير {b.bed_number} — {active(bedRoom,b.id)}</span><button disabled={!canWrite} onClick={()=>void removeBed(b)} className="text-xs text-red-200 disabled:opacity-40">حذف</button></div>)}</div><div className="mt-4 flex gap-2"><input className={field} placeholder="رقم / اسم السرير" value={newBed} onChange={e=>setNewBed(e.target.value)}/><button disabled={bedBusy||!canWrite} onClick={()=>void addBed()} className="rounded-xl bg-amber-300 px-4 font-bold text-[#073329] disabled:opacity-40">إضافة</button></div></div></div>}
     {operation === "contract" && operationRoom && <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md" dir="rtl" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setOperation(null)}}>
     <div role="dialog" aria-modal="true" aria-label="إضافة عقد جديد" className="relative mx-auto flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-amber-300/65 bg-[#052b24] text-white shadow-[0_30px_100px_rgba(0,0,0,.75)]" style={{width:"min(890px, calc(100vw - 32px))",maxWidth:"890px",minWidth:0,maxHeight:"min(800px,94dvh)",marginInline:"auto"}}>
       <div className="pointer-events-none absolute inset-0" style={{backgroundImage:"url('/add-contract.png')",backgroundPosition:"center",backgroundSize:"contain",backgroundRepeat:"no-repeat",backgroundColor:"#052b24",opacity:0.88}}/>
       <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#052b24]/80 via-[#052b24]/62 to-[#052b24]/30"/>
       <div className="relative min-h-0 overflow-y-auto p-5 sm:p-7">
         <button type="button" aria-label="إغلاق" onClick={()=>setOperation(null)} className="absolute left-4 top-4 rounded-full border border-amber-300/50 bg-[#073b31] p-2"><X size={17}/></button>
         <header className="mb-5 text-center"><FilePlus2 size={32} className="mx-auto text-amber-300"/><h2 className="text-2xl font-black text-amber-200">إضافة عقد جديد</h2><p className="text-xs text-emerald-100/75">ربط عقد بغرفة وعميل مسجلين</p></header>
         {error&&<p role="alert" className="mb-3 rounded-xl border border-rose-300/40 bg-rose-900/50 p-3 text-sm">{error}</p>}
         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
           <label className="text-sm font-bold">الغرفة *<select className={`${field} mt-1 h-11`} value={contractRoomSelection} onChange={e=>{const room=rooms.find(r=>r.id===e.target.value);if(room){const previous={...opForm};startOperation("contract",room);setOpForm({...previous,bed_id:"",amount:"0",period:room.rent_period});}}}><option value="">اختر الغرفة</option>{current.map(r=><option key={r.id} value={r.id}>غرفة {r.room_number}{r.building_name?` — ${r.building_name}`:""}</option>)}</select></label>
           <label className="text-sm font-bold">المالك<input className={`${field} mt-1 h-11 opacity-85`} readOnly value={owners.find(o=>o.id===operationRoom.owner_id)?.full_name||"لا يوجد مالك مرتبط بالغرفة"}/></label>
           <div className="text-sm font-bold">المستأجر *<div className="mt-1 flex gap-2"><select className={`${field} h-11 min-w-0 flex-1`} value={opForm.tenant_id} onChange={e=>setOpForm(p=>({...p,tenant_id:e.target.value}))}><option value="">اختر مستأجرًا مسجلًا</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select><button type="button" aria-label="إضافة مستأجر" onClick={()=>{setError("");setTenantModal(true)}} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-300/50 bg-amber-300/15 text-amber-200"><Plus size={20}/></button></div></div>
           <label className="text-sm font-bold">رقم العقد *<input className={`${field} mt-1 h-11`} value={opForm.number} onChange={e=>{setContractNumberError("");setOpForm(p=>({...p,number:e.target.value}))}}/>{contractNumberError&&<span className="block text-xs text-rose-300">{contractNumberError}</span>}</label>
           {operationRoom.rental_mode==="bed"&&<label className="text-sm font-bold">السرير *<select className={`${field} mt-1 h-11`} value={opForm.bed_id} onChange={e=>setOpForm(p=>({...p,bed_id:e.target.value}))}><option value="">اختر السرير</option>{beds.filter(b=>b.room_id===operationRoom.id).map(b=><option key={b.id} value={b.id}>{b.bed_number}</option>)}</select></label>}
           <div className="text-sm font-bold">نوع العقد<div className="mt-1 flex gap-2"><select className={`${field} h-11 min-w-0 flex-1`} value={contractType} onChange={e=>setContractType(e.target.value)}>{contractTypes.map(x=><option key={x}>{x}</option>)}</select><button type="button" aria-label="إضافة نوع عقد" onClick={()=>{setError("");setContractTypeModal(true)}} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-300/50 bg-amber-300/15 text-amber-200"><Plus size={20}/></button></div></div>
           <div className="text-sm font-bold">مدة العقد<div className="mt-1 flex items-center gap-2"><select className={`${field} h-11 min-w-0 flex-1`} value={contractDuration} onChange={e=>setContractDuration(e.target.value)}>{durationOptions.map(x=><option key={x} value={x}>{x}</option>)}</select><button type="button" title="إضافة مدة عقد جديدة" onClick={()=>{setDurationError("");setNewDuration("");setDurationAddOpen(true);}} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-300/50 bg-amber-300/15 text-amber-200"><Plus size={20}/></button></div></div>
           <label className="text-sm font-bold">تاريخ البداية *<input type="date" className={`${field} mt-1 h-11`} value={opForm.start_date} onChange={e=>setOpForm(p=>({...p,start_date:e.target.value}))}/></label>
           <label className="text-sm font-bold">تاريخ النهاية *<input type="date" className={`${field} mt-1 h-11`} value={opForm.end_date} onChange={e=>setOpForm(p=>({...p,end_date:e.target.value}))}/></label>
           <label className="text-sm font-bold sm:col-span-2">إجمالي قيمة العقد (ر.س)<input type="number" min="0" step="0.01" className={`${field} mt-1 h-11`} value={opForm.amount} onChange={e=>setOpForm(p=>({...p,amount:e.target.value}))}/></label>
           <div className="rounded-2xl border border-amber-300/35 bg-[#052c25]/85 p-4 sm:col-span-2"><h3 className="mb-3 text-base font-black text-amber-200">جدول سداد الإيجار</h3><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="text-sm font-bold">دورية السداد *<select className={`${field} mt-1 h-11`} value={opForm.period} onChange={e=>setOpForm(p=>({...p,period:e.target.value}))}>{["يومي","أسبوعي","شهري","ربع سنوي","نصف سنوي","سنوي"].map(x=><option key={x}>{x}</option>)}</select></label><label className="text-sm font-bold">تاريخ أول استحقاق *<input type="date" className={`${field} mt-1 h-11`} value={firstDueDate} onChange={e=>setFirstDueDate(e.target.value)}/></label></div><p className="mt-3 text-xs text-emerald-100/80">يمكنك تعديل تاريخ كل دفعة يدويًا قبل الحفظ. تُوزّع قيمة العقد بالتساوي، ويُحفظ العقد والأقساط معًا.</p>{installmentsPreview.length>0?<div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-amber-300/45 bg-[#05382e]/85"><table className="w-full text-right text-sm sm:text-base"><thead className="sticky top-0 bg-[#125441] text-amber-200"><tr><th className="p-2">القسط</th><th className="p-2">تاريخ الاستحقاق (قابل للتعديل)</th><th className="p-2">القيمة (ر.س)</th></tr></thead><tbody>{installmentsPreview.map((item,i)=><tr key={i} className="border-t border-white/10"><td className="p-2 font-bold text-amber-100">{item.installment_no}</td><td className="p-1.5"><input type="date" aria-label={`تاريخ استحقاق القسط ${i+1}`} className="w-full min-w-[160px] rounded-lg border border-amber-300/70 bg-[#153f32] px-3 py-2 text-sm font-bold text-amber-200 outline-none focus:ring-2 focus:ring-amber-300 [color-scheme:dark]" min={opForm.start_date} max={opForm.end_date} value={item.due_date} onChange={e=>{setScheduleError("");setEditedDueDates(prev=>({...prev,[i]:e.target.value}));}}/></td><td className="p-2 text-base font-black text-amber-300 tabular-nums">{money(item.amount)}</td></tr>)}</tbody></table></div>:<p className="mt-2 text-xs text-amber-200">حدد تاريخ بداية ونهاية صحيحين وأول استحقاق ودورية السداد لعرض الأقساط.</p>}{scheduleError&&<p role="alert" className="mt-2 text-xs font-bold text-rose-300">{scheduleError}</p>}<p className="mt-2 text-xs text-emerald-100/70">عند الحفظ يُسجل العقد وجدول أقساطه في جداول الغرف المستقلة، ولا يمس عقود الشقق.</p></div>
           <label className="text-sm font-bold sm:col-span-2">ملاحظات<textarea rows={3} className={`${field} mt-1 resize-y`} value={contractNotes} onChange={e=>setContractNotes(e.target.value)} placeholder="اكتب ملاحظات العقد إن وجدت..."/></label>
         </div>
         <div className="mt-5 flex gap-3"><button type="button" disabled={busy||!canWrite} onClick={()=>void saveOperation()} className="min-h-11 flex-[2] rounded-xl bg-gradient-to-l from-[#f3d477] to-[#b88828] font-black text-[#09251f] disabled:opacity-50">{busy?"جارٍ الحفظ...":"حفظ العقد"}</button><button type="button" disabled={busy} onClick={()=>setOperation(null)} className="min-h-11 flex-1 rounded-xl border border-amber-300/40 bg-[#073b31]/90 font-bold">إلغاء</button></div>
       </div>
     </div>
   </div>}
   {bookingStatusModal&&<div className="fixed inset-0 z-[165] flex items-center justify-center bg-black/85 p-4"><div dir="rtl" role="dialog" aria-modal="true" aria-label="إضافة حالة حجز" className="w-full max-w-sm rounded-2xl border border-amber-300/60 bg-[#06382e] p-5 text-white shadow-2xl"><h3 className="mb-3 text-lg font-black text-amber-300">إضافة حالة حجز جديدة</h3><p className="mb-3 text-xs text-emerald-100/80">الحالات الجديدة تمنع الحجز المتداخل، مثل الحجز المؤكد.</p>{bookingStatusError&&<p role="alert" className="mb-3 rounded-lg bg-rose-950/60 p-2 text-sm text-rose-200">{bookingStatusError}</p>}<label className="text-sm font-bold">اسم الحالة<input autoFocus maxLength={80} className={`${field} mt-1 h-11`} value={newBookingStatus} onChange={e=>setNewBookingStatus(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void saveBookingStatus()}}} placeholder="مثال: حجز مبدئي"/></label><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={bookingStatusBusy} onClick={()=>setBookingStatusModal(false)} className="rounded-xl border border-white/30 px-5 py-2">إلغاء</button><button type="button" disabled={bookingStatusBusy||!newBookingStatus.trim()} onClick={()=>void saveBookingStatus()} className="rounded-xl bg-amber-300 px-5 py-2 font-black text-[#06382e] disabled:opacity-50">{bookingStatusBusy?"جارٍ الحفظ...":"حفظ الحالة"}</button></div></div></div>}
   {standaloneOwnerModal&&(
    <div className="fixed inset-0 z-[190] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md" dir="rtl" onMouseDown={e=>{if(e.target===e.currentTarget&&!savingStandaloneOwner)setStandaloneOwnerModal(false);}}>
     <div role="dialog" aria-modal="true" aria-label="إضافة مالك جديد" className="relative flex w-full max-w-[720px] flex-col overflow-hidden rounded-[24px] border border-amber-300/65 bg-[#052b24] text-white shadow-[0_30px_100px_rgba(0,0,0,.75)]" style={{width:"min(720px, calc(100vw - 32px))",maxWidth:"720px",maxHeight:"min(760px, 92dvh)",margin:"auto",flex:"0 1 720px"}}>
      <div className="pointer-events-none absolute inset-0 bg-cover bg-left" style={{backgroundImage:"url('/add-client-bg.png')"}}/>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#052b24]/90 via-[#052b24]/78 to-[#052b24]/10"/>
      <button type="button" disabled={savingStandaloneOwner} onClick={()=>setStandaloneOwnerModal(false)} aria-label="إغلاق" className="absolute left-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full border border-amber-200/55 bg-[#073b31]/80 text-white hover:bg-amber-300/20"><X size={17}/></button>
      <div className="relative min-h-0"><div className="relative z-10 min-h-0 max-h-[75dvh] overflow-y-auto px-4 pb-3 pt-4 sm:pl-5 sm:pr-[30%]">
       <header className="mb-3 text-center"><UserRoundCheck size={31} className="mx-auto mb-1 text-amber-300"/><h2 className="text-xl font-black text-amber-200 sm:text-2xl">إضافة مالك جديد</h2><p className="mt-1 text-xs text-emerald-100/75">سجل بيانات المالك الآن واربطه بغرفة أو أكثر لاحقًا</p></header>
       <form id="room-add-owner-form" onSubmit={e=>{e.preventDefault();void saveStandaloneOwner();}}>
        <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
         {([ ["full_name","اسم المالك *","text","الاسم بالكامل"],["mobile","رقم الجوال","tel","05xxxxxxxx"],["phone","رقم هاتف إضافي","tel","رقم إضافي"],["email","البريد الإلكتروني","email","example@email.com"],["identity_number","رقم الهوية / الإقامة","text","رقم الهوية أو الإقامة"] ] as const).map(([key,title,type,placeholder])=><label key={key} className="block min-w-0 text-right text-xs font-bold text-emerald-50">{title}<input type={type} required={key==="full_name"} value={standaloneOwnerForm[key]} onChange={e=>setStandaloneOwnerForm(prev=>({...prev,[key]:e.target.value}))} placeholder={placeholder} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/40 bg-[#062b25]/90 px-3 text-sm text-white outline-none placeholder:text-emerald-100/35 focus:border-amber-300"/></label>)}
         <div className="min-w-0 text-right text-xs font-bold text-emerald-50"><label htmlFor="room-owner-nationality">الجنسية</label><div className="mt-1 flex gap-2"><select id="room-owner-nationality" value={standaloneOwnerForm.nationality} onChange={e=>setStandaloneOwnerForm(prev=>({...prev,nationality:e.target.value}))} className="h-10 min-w-0 flex-1 rounded-xl border border-emerald-300/40 bg-[#062b25] px-2 text-sm text-white outline-none focus:border-amber-300"><option value="">اختر الجنسية</option>{nationalities.map(item=><option key={item} value={item}>{item}</option>)}</select><button type="button" title="إضافة جنسية" aria-label="إضافة جنسية" onClick={()=>{setNationalityTarget("owner");setNewNationality("");setNationalityError("");setNationalityEditor(true);}} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-300/70 bg-amber-300/15 text-amber-200 hover:bg-amber-300/25"><Plus size={19}/></button></div></div>
        </div>
        {standaloneOwnerError&&<p role="alert" className="mt-3 rounded-xl border border-rose-300/40 bg-rose-900/25 p-3 text-xs text-rose-100">{standaloneOwnerError}</p>}
       </form>
      </div></div>
      <footer className="relative z-10 flex shrink-0 gap-3 border-t border-amber-300/30 bg-[#052b24]/75 px-4 py-2 sm:px-6"><button type="submit" form="room-add-owner-form" disabled={savingStandaloneOwner||!canWrite} className="min-h-11 flex-[2] rounded-xl bg-gradient-to-l from-[#f3d477] to-[#b88828] font-black text-[#09251f] disabled:opacity-50">{savingStandaloneOwner?"جارٍ الحفظ...":"حفظ المالك"}</button><button type="button" disabled={savingStandaloneOwner} onClick={()=>setStandaloneOwnerModal(false)} className="min-h-11 flex-1 rounded-xl border border-amber-300/40 bg-white/5 font-bold">إلغاء</button></footer>
     </div>
    </div>
   )}
   {tenantModal&&<div dir="rtl" className="fixed inset-0 z-[185] flex items-center justify-center bg-black/85 p-2 backdrop-blur-lg sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget&&!tenantBusy)setTenantModal(false);}}>
    <div role="dialog" aria-modal="true" aria-label="إضافة عميل جديد" className="relative flex flex-col overflow-hidden rounded-[22px] border border-amber-300/65 bg-[#052d27] text-white shadow-[0_28px_90px_rgba(0,0,0,.65)]" style={{width:"min(710px, calc(100vw - 32px))",maxWidth:"calc(100vw - 32px)",flex:"0 1 710px",maxHeight:"calc(100dvh - 36px)"}}>
     <div className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat" style={{backgroundImage:"url('/add-client-bg.png')",backgroundSize:"100% 100%"}}/>
     <div className="pointer-events-none absolute inset-0 bg-[#04261f]/35"/>
     <button type="button" disabled={tenantBusy} onClick={()=>{setTenantModal(false);setError("");}} aria-label="إغلاق النافذة" className="absolute left-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-amber-200/60 bg-[#032b25]/80 text-white hover:bg-emerald-700"><X size={21}/></button>
     <div className="relative max-h-[calc(100dvh-36px)] overflow-y-auto"><div className="mx-auto w-full p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-3 border-b border-amber-300/25 pb-3"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/60 bg-emerald-950/80 text-amber-300"><UserRoundPlus size={31}/></span><div><h2 className="text-2xl font-black text-white sm:text-3xl">بيانات العميل</h2><p className="mt-1 text-xs text-emerald-100/75 sm:text-sm">الرجاء تعبئة البيانات التالية بدقة</p></div></div>
      <form onSubmit={e=>{e.preventDefault();void saveNewTenant();}}>
       <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
        {([ ["full_name","الاسم الكامل *","text","أدخل الاسم الكامل للعميل"],["phone","رقم الجوال","tel","05xxxxxxxx"],["identity_number","رقم الهوية / الإقامة","text","أدخل رقم الهوية أو الإقامة"],["email","البريد الإلكتروني","email","example@email.com"] ] as const).map(([key,title,type,placeholder])=><label key={key} className="block text-sm font-bold text-emerald-50">{title}<input value={newTenant[key]} onChange={e=>setNewTenant(prev=>({...prev,[key]:e.target.value}))} type={type} placeholder={placeholder} required={key==="full_name"} className="mt-1 h-10 w-full rounded-xl border border-emerald-300/45 bg-[#013d32]/85 px-4 text-right text-sm text-white outline-none placeholder:text-emerald-100/45 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20"/></label>)}
        <div className="sm:col-span-2"><label className="mb-2 block text-sm font-bold text-emerald-50">الجنسية</label><div className="flex gap-2"><select value={newTenant.nationality} onChange={e=>setNewTenant(prev=>({...prev,nationality:e.target.value}))} className="h-10 min-w-0 flex-1 rounded-xl border border-emerald-300/45 bg-[#013d32] px-3 text-white outline-none focus:border-amber-300"><option value="">اختر الجنسية</option>{nationalities.map(item=><option key={item} value={item}>{item}</option>)}</select><button type="button" onClick={()=>{setNationalityTarget("tenant");setNewNationality("");setNationalityError("");setNationalityEditor(true);}} className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-amber-300 bg-amber-300/15 px-4 font-black text-amber-200 transition hover:bg-amber-300/25"><Plus size={20}/> إضافة</button></div></div>
        <label className="block text-sm font-bold text-emerald-50 sm:col-span-2">ملاحظات<textarea value={newTenant.notes} onChange={e=>setNewTenant(prev=>({...prev,notes:e.target.value}))} rows={2} maxLength={500} placeholder="أدخل أي ملاحظات إضافية عن العميل (اختياري)" className="mt-2 w-full resize-y rounded-xl border border-emerald-300/45 bg-[#013d32]/85 p-3 text-sm text-white outline-none placeholder:text-emerald-100/45 focus:border-amber-300"/><span className="mt-1 block text-left text-xs text-emerald-100/55">{newTenant.notes.length}/500</span></label>
       </div>
       {error&&<p role="alert" className="mt-3 rounded-xl border border-rose-300/50 bg-rose-950/70 p-3 text-sm text-rose-100">{error}</p>}
       <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row"><button type="submit" disabled={tenantBusy||!canWrite} className="min-h-12 flex-1 rounded-xl border border-yellow-200/70 bg-gradient-to-b from-[#f8d675] to-[#bf9024] px-5 text-base font-black text-[#05281f] shadow-[0_5px_20px_rgba(245,189,62,.22)] disabled:opacity-50">{tenantBusy?"جارٍ حفظ العميل...":"حفظ العميل"}</button><button type="button" disabled={tenantBusy} onClick={()=>{setTenantModal(false);setError("");}} className="min-h-12 flex-1 rounded-xl border border-emerald-200/70 bg-emerald-950/65 px-5 font-black text-white">إلغاء</button></div>
      </form>
     </div></div>
     {nationalityEditor&&<div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onMouseDown={e=>{if(e.target===e.currentTarget&&!savingNationality)setNationalityEditor(false);}}><form onSubmit={e=>{e.preventDefault();void saveNationality();}} className="w-full max-w-md rounded-[24px] border border-amber-300/65 bg-gradient-to-br from-[#0b493b] to-[#03261f] p-6 shadow-2xl"><h3 className="mb-2 flex items-center gap-2 text-xl font-black text-amber-200"><Plus size={22}/> إضافة جنسية جديدة</h3><p className="mb-4 text-xs leading-6 text-emerald-100/75">سيتم حفظ الجنسية في Supabase لتظهر لاحقًا لجميع المستخدمين المصرح لهم في نفس الشركة.</p><label className="block text-sm font-bold">اسم الجنسية<input autoFocus value={newNationality} maxLength={80} onChange={e=>setNewNationality(e.target.value)} placeholder="مثال: مصري" className="mt-1 h-10 w-full rounded-xl border border-emerald-300/45 bg-[#02382f] px-4 text-white outline-none focus:border-amber-300"/></label>{nationalityError&&<p role="alert" className="mt-3 text-sm text-rose-200">{nationalityError}</p>}<div className="mt-4 flex gap-2"><button type="submit" disabled={savingNationality||!canWrite} className="min-h-12 flex-1 rounded-xl bg-amber-300 font-black text-emerald-950 disabled:opacity-50">{savingNationality?"جارٍ الحفظ...":"حفظ الجنسية"}</button><button type="button" disabled={savingNationality} onClick={()=>setNationalityEditor(false)} className="min-h-12 flex-1 rounded-xl border border-white/25 font-bold">إلغاء</button></div></form></div>}
    </div>
   </div>}
   {contractTypeModal&&<div className="fixed inset-0 z-[155] flex items-center justify-center bg-black/85 p-4"><div dir="rtl" role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl border border-amber-300/50 bg-[#06382e] p-5 text-white"><h3 className="mb-4 text-lg font-black text-amber-300">إضافة نوع عقد</h3>{error&&<p className="mb-3 text-sm text-rose-200">{error}</p>}<label className="text-sm">نوع العقد<input autoFocus className={`${field} mt-1 h-11`} value={newContractType} onChange={e=>setNewContractType(e.target.value)}/></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>{setContractTypeModal(false);setError("")}} className="rounded-xl border border-white/30 px-5 py-2">إلغاء</button><button type="button" disabled={contractTypeBusy||!newContractType.trim()} onClick={()=>void saveContractType()} className="rounded-xl bg-amber-300 px-5 py-2 font-black text-[#06382e] disabled:opacity-50">{contractTypeBusy?"جارٍ الحفظ...":"حفظ النوع"}</button></div></div></div>}
   {durationAddOpen&&<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-4" onMouseDown={e=>{if(e.target===e.currentTarget&&!durationSaving)setDurationAddOpen(false)}}><div dir="rtl" role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl border border-amber-300/50 bg-[#06382e] p-5 text-white shadow-2xl"><h3 className="mb-4 text-lg font-black text-amber-300">إضافة مدة عقد جديدة</h3>{durationError&&<p role="alert" className="mb-3 rounded-lg bg-rose-900/50 p-2 text-sm text-rose-200">{durationError}</p>}<label className={label}>اسم المدة</label><input autoFocus className={`${field} mb-4 h-11`} value={newDuration} onChange={e=>setNewDuration(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void addDurationOption()}} placeholder="مثال: نصف سنوي"/><div className="flex justify-end gap-2"><button type="button" disabled={durationSaving} onClick={()=>setDurationAddOpen(false)} className="rounded-xl border border-white/30 px-4 py-2">إلغاء</button><button type="button" disabled={durationSaving||!newDuration.trim()} onClick={()=>void addDurationOption()} className="rounded-xl bg-amber-300 px-4 py-2 font-black text-[#06382e] disabled:opacity-50">{durationSaving?"جارٍ الحفظ...":"حفظ المدة"}</button></div></div></div>}
{operation==="booking"&&operationRoom&&(
 <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/85 p-3 backdrop-blur-lg sm:p-5" dir="rtl" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setOperation(null);}}>
  <div role="dialog" aria-modal="true" aria-label="إضافة حجز جديد" className="relative flex flex-col overflow-hidden rounded-[22px] border border-amber-300/65 bg-[#052d26] text-white shadow-[0_28px_90px_rgba(0,0,0,.65)]" style={{width:"min(880px, calc(100vw - 32px))",maxWidth:"calc(100vw - 32px)",flex:"0 1 880px",height:"auto",maxHeight:"calc(100dvh - 36px)"}}>
   <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{backgroundImage:'url("/booking%20apartment.png")',backgroundSize:"100% 100%",backgroundPosition:"center",backgroundRepeat:"no-repeat"}}/>
   <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#032820]/52"/>
   <section className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <header className="relative shrink-0 border-b border-amber-300/30 bg-[#073b30]/45 px-5 py-3 text-center"><CalendarPlus className="mx-auto mb-1 text-amber-300" size={25}/><h2 className="text-xl font-black text-amber-200">إضافة حجز جديد</h2><p className="text-[11px] text-emerald-100/70">ربط الغرفة بالمستأجر وتسجيل المبلغ المدفوع</p><button type="button" onClick={()=>setOperation(null)} disabled={busy} className="absolute left-3 top-3 rounded-lg border border-white/25 p-1.5"><X size={18}/></button></header>
    <form onSubmit={e=>{e.preventDefault();void saveOperation();}} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-transparent p-4 sm:p-5">
     <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
      <label className="text-sm font-bold">الغرفة *<select required value={bookingRoomSelection} onChange={e=>{const selected=rooms.find(r=>r.id===e.target.value);setBookingRoomSelection(e.target.value);if(selected){setOperationRoom(selected);setOpForm(p=>({...p,bed_id:"",amount:"0",paid:"0",period:selected.rent_period}));}setError("");}} className={`${field} mt-1 h-10`}><option value="">اختر الغرفة</option>{current.map(r=><option key={r.id} value={r.id}>غرفة {r.room_number} — {r.building_name||"بدون اسم مبنى"}</option>)}</select></label>
      <div className="text-sm font-bold">المستأجر *<div className="mt-1 flex gap-2"><select required className={`${field} h-10 min-w-0 flex-1`} value={opForm.tenant_id} onChange={e=>setOpForm(p=>({...p,tenant_id:e.target.value}))}><option value="">اختر عميل مسجل</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select><button type="button" aria-label="إضافة مستأجر جديد" title="إضافة مستأجر جديد" onClick={()=>{setError("");setTenantModal(true)}} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-300/60 bg-amber-300/15 text-amber-200 hover:bg-amber-300/25"><Plus size={20}/></button></div></div>
      {operationRoom.rental_mode==="bed"&&<label className="text-sm font-bold sm:col-span-2">السرير *<select required className={`${field} mt-1 h-10`} value={opForm.bed_id} onChange={e=>setOpForm(p=>({...p,bed_id:e.target.value}))}><option value="">اختر السرير</option>{beds.filter(b=>b.room_id===operationRoom.id).map(b=><option key={b.id} value={b.id}>{b.bed_number}</option>)}</select></label>}
      <label className="text-sm font-bold">بداية الإيجار *<input required type="date" className={`${field} mt-1 h-10`} value={opForm.start_date} onChange={e=>setOpForm(p=>({...p,start_date:e.target.value}))}/></label>
      <label className="text-sm font-bold">نهاية الإيجار *<input required type="date" min={opForm.start_date||undefined} className={`${field} mt-1 h-10`} value={opForm.end_date} onChange={e=>setOpForm(p=>({...p,end_date:e.target.value}))}/></label>
      <label className="text-sm font-bold">الإيجار المتفق عليه (ر.س) *<input required type="number" min="0" step="0.01" className={`${field} mt-1 h-10`} value={opForm.amount} onChange={e=>setOpForm(p=>({...p,amount:e.target.value}))}/></label>
      <label className="text-sm font-bold">المدفوع الآن (ر.س)<input type="number" min="0" step="0.01" className={`${field} mt-1 h-10`} value={opForm.paid} onChange={e=>setOpForm(p=>({...p,paid:e.target.value}))}/></label>
      <label className="text-sm font-bold">طريقة الدفع<select className={`${field} mt-1 h-10`} value={opForm.payment} onChange={e=>setOpForm(p=>({...p,payment:e.target.value}))}>{["نقدي","تحويل بنكي","شبكة"].map(x=><option key={x}>{x}</option>)}</select></label>
      <div className="text-sm font-bold">حالة الحجز<div className="mt-1 flex gap-2"><select className={`${field} h-10 min-w-0 flex-1`} value={bookingStatus} onChange={e=>setBookingStatus(e.target.value)}>{bookingStatuses.map(x=><option key={x.code} value={x.code}>{x.name}</option>)}</select><button type="button" aria-label="إضافة حالة حجز جديدة" title="إضافة حالة حجز جديدة" onClick={()=>{setBookingStatusError("");setBookingStatusModal(true)}} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-amber-300/60 bg-amber-300/15 text-amber-200 hover:bg-amber-300/25"><Plus size={20}/></button></div></div>
     </div>
     <div className="flex justify-between rounded-xl border border-amber-300/35 bg-black/20 px-3 py-2 text-sm font-bold"><span>المتبقي</span><strong className="text-lg text-amber-200">{money(Math.max(0,Number(opForm.amount||0)-Number(opForm.paid||0)))} ر.س</strong></div>
     {error&&<p role="alert" className="rounded-xl border border-rose-300/50 bg-rose-950/50 p-3 text-sm text-rose-100">{error}</p>}
     <div className="flex gap-3"><button type="submit" disabled={busy||!canWrite} className="min-h-10 flex-1 rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 font-black text-emerald-950 disabled:opacity-50">{busy?"جارٍ حفظ الحجز...":"حفظ الحجز"}</button><button type="button" disabled={busy} onClick={()=>setOperation(null)} className="min-h-10 flex-1 rounded-xl border border-emerald-200/35 font-bold">إلغاء</button></div>
    </form>
   </section>
  </div>
 </div>
)}
 </main>;
}
