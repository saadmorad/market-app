const app=document.getElementById('app');
let atab='r';
const uid=()=>'p'+Date.now().toString(36)+Math.floor(Math.random()*1000);
const newProd=(k,extra={})=>({id:uid(),k,n:'',p:0,c:'',u:'كيلو',a:true,i:'',w:0,wu:'كرتونة',wm:1,...extra});
function shrink(file){return new Promise((res,rej)=>{const im=new Image(),u=URL.createObjectURL(file);im.onload=()=>{const s=Math.min(1,600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);c.toBlob(b=>b?res(b):rej(),'image/jpeg',.82)};im.onerror=rej;im.src=u})}

async function api(path,opt={}){
  const r=await fetch(path,{credentials:'same-origin',...opt});
  if(!r.ok){const e=new Error('http '+r.status);e.status=r.status;throw e}
  return r.json();
}
async function upload(blob){
  const r=await fetch('/api/admin/upload',{method:'POST',headers:{'Content-Type':'image/jpeg'},body:blob,credentials:'same-origin'});
  if(!r.ok)throw new Error('upload');
  return r.json();
}

// ---------- رفع الصور ----------
function pickImages(multi,p){
  const fi=h('input',{type:'file',accept:'image/*',multiple:!!multi,style:'display:none'});
  fi.addEventListener('change',()=>{const fs=[...fi.files];fi.remove();if(fs.length)multi?bulkUpload(fs):oneUpload(p,fs[0])});
  document.body.append(fi);fi.click();setTimeout(()=>fi.remove(),120000);
}
const progress=m=>{const t=h('div',{cls:'toast',textContent:m});document.body.append(t);return t};
// حفظ هادئ في الخلفية بعد رفع الصور (المنتجات اللي ليها اسم بس) عشان الصور ما تضيعش لو نسيت تضغط حفظ
async function persist(){
  const body=JSON.parse(JSON.stringify(D));delete body.__in;body.products=body.products.filter(x=>x.n&&x.n.trim());
  try{await api('/api/admin/store',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return true}catch(e){return false}
}
async function oneUpload(p,f){
  const t=progress('جاري رفع الصورة...');
  try{const r=await upload(await shrink(f));p.i=r.id;await persist();t.remove();render();toast('تم رفع الصورة ✓')}
  catch(e){t.remove();alert('تعذر رفع الصورة. جرّب صورة تانية.')}
}
async function bulkUpload(files){
  const kind=atab;
  const t=progress('');let ok=0,made=0,linked=0,fail=0;
  const junk=/^(img|pxl|dsc|photo|image|screenshot|whatsapp|signal|\d)/i;
  for(let i=0;i<files.length;i++){
    t.textContent='جاري رفع الصورة '+(i+1)+' من '+files.length+'...';
    const f=files[i];
    try{
      const r=await upload(await shrink(f));
      const base=f.name.replace(/\.[^.]+$/,'').replace(/[_\-]+/g,' ').replace(/\s*\(\d+\)\s*$/,'').trim();
      const hit=base&&D.products.find(p=>p.k===kind&&p.n.trim()===base);
      if(hit){hit.i=r.id;linked++}
      else{D.products.unshift(newProd(kind,{n:(base.length>1&&!junk.test(base))?base:'',i:r.id}));made++}
      ok++;
    }catch(e){fail++}
  }
  t.remove();await persist();render();window.scrollTo(0,0);
  let msg='تم رفع '+ok+' صورة';if(linked)msg+=' — '+linked+' اتربطت بمنتجات موجودة';
  if(made)msg+=' — '+made+' منتج جديد في أول القائمة. اكتب لكل واحد الاسم والسعر واضغط "حفظ التعديلات" (المنتج من غير سعر مش بيظهر للعملاء)';
  if(fail)msg+=' — '+fail+' صورة فشلت';
  alert(msg);
}

function render(){app.replaceChildren();D&&D.__in?admin():login()}

// ---------- تسجيل الدخول ----------
function login(msg=''){
  app.append(h('div',{style:'max-width:360px;margin:12vh auto 0'},
    h('div',{cls:'brand',style:'justify-content:center;margin-bottom:6px'},logo(),h('span',{textContent:D&&D.name||'الماركت'})),
    h('p',{style:'text-align:center;color:var(--mu);margin:0 0 18px',textContent:'تسجيل دخول صاحب الماركت'}),
    h('label',{textContent:'كلمة السر'}),
    h('input',{type:'password',id:'pw',autocomplete:'current-password',on:{keydown(e){if(e.key==='Enter')go()}}}),
    h('div',{id:'err',style:'color:#d44;font-size:14px;min-height:20px;margin-bottom:8px',textContent:msg}),
    h('button',{cls:'btn c',textContent:'دخول',on:{click:go}})));
  async function go(){
    const pw=document.getElementById('pw').value;
    try{
      await api('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
      D=await api('/api/store',{cache:'no-store'});D.__in=true;D.cats=D.cats||[];applyTheme();render();
    }catch(e){
      document.getElementById('err').textContent=e.status===429?'محاولات كتير. استنى شوية وجرّب تاني.':'كلمة السر غلط';
    }
  }
}
async function logout(){try{await api('/api/admin/logout',{method:'POST'})}catch(e){}D.__in=false;render()}

// ---------- أقسام المنتجات (مشروبات، عصائر، ...) ----------
function catsCard(){
  const box=h('div',{cls:'sum'});
  if(!D.cats.length)box.append(h('div',{style:'color:var(--mu);font-size:14px;margin-bottom:8px',textContent:'لسه مفيش أقسام. أضف أول قسم من تحت.'}));
  D.cats.forEach((c,i)=>{
    const inp=h('input',{value:c,style:'margin:0;flex:1',on:{change(e){
      const nv=e.target.value.trim(),old=D.cats[i];
      if(!nv||D.cats.includes(nv)){e.target.value=old;return}
      D.cats[i]=nv;D.products.forEach(p=>{if(p.c===old)p.c=nv});render();
    }}});
    box.append(h('div',{style:'display:flex;gap:6px;margin-bottom:6px;align-items:center'},inp,
      h('button',{cls:'del',on:{click(){
        const name=D.cats[i];
        if(!confirm('حذف القسم "'+name+'"؟ المنتجات اللي فيه هتفضل من غير قسم.'))return;
        D.products.forEach(p=>{if(p.c===name)p.c=''});D.cats.splice(i,1);render();
      }}},ic('trash',18))));
  });
  const add=h('input',{placeholder:'اسم قسم جديد (مثلًا: مشروبات)',style:'margin:0;flex:1'});
  const go=()=>{const v=add.value.trim();if(!v)return;if(D.cats.includes(v)){alert('القسم موجود بالفعل');return}D.cats.push(v);render()};
  add.addEventListener('keydown',e=>{if(e.key==='Enter')go()});
  box.append(h('div',{style:'display:flex;gap:6px;margin-top:8px'},add,h('button',{cls:'chip on',textContent:'إضافة',on:{click:go}})));
  return box;
}

// ---------- صف منتج (قطاعي أو جملة) ----------
function prodRow(p){
  const wh=p.k==='w',pick=()=>pickImages(false,p);
  const box=h('div',{style:'flex:none;display:flex;flex-direction:column;align-items:center;gap:6px'},
    h('div',{style:'cursor:pointer',on:{click:pick}},pic(p)),
    h('button',{cls:'chip',style:'font-size:12px;padding:5px 10px;display:inline-flex;gap:4px;align-items:center',on:{click:pick}},ic('img',14),p.i?'تغيير الصورة':'إضافة صورة'));
  const catSel=h('select',{on:{change(e){p.c=e.target.value}}},[h('option',{value:'',textContent:'بدون قسم'}),...D.cats.map(c=>h('option',{value:c,textContent:c,selected:c===p.c}))]);
  const nameIn=h('input',{value:p.n,placeholder:wh?'اسم منتج الجملة':'اسم المنتج',on:{input(e){p.n=e.target.value}}});
  const fields=wh?[
    nameIn,
    h('div',{cls:'r'},
      h('input',{value:p.w||'',type:'number',inputMode:'numeric',placeholder:'سعر الجملة',on:{input(e){p.w=Number(e.target.value)}}}),
      h('input',{value:p.wm>1?p.wm:'',type:'number',inputMode:'numeric',placeholder:'أقل كمية',on:{input(e){p.wm=Math.max(1,Math.round(Number(e.target.value))||1)}}})),
    h('select',{on:{change(e){p.wu=e.target.value}}},['كرتونة','شيكارة','دستة','صندوق','جوال','طبق'].map(u=>h('option',{value:u,textContent:'وحدة الجملة: '+u,selected:u===(p.wu||'كرتونة')}))),
    catSel
  ]:[
    nameIn,
    h('div',{cls:'r'},
      h('input',{value:p.p||'',type:'number',inputMode:'numeric',placeholder:'السعر',on:{input(e){p.p=Number(e.target.value)}}}),
      h('select',{on:{change(e){p.u=e.target.value}}},['كيلو','قطعة','لتر','علبة','كيس','زجاجة','رغيف','بيضة','حزمة','دستة'].map(u=>h('option',{value:u,textContent:'الوحدة: '+u,selected:u===p.u})))),
    catSel
  ];
  return h('div',{cls:'arow'},box,h('div',{cls:'af'},...fields,
    h('div',{cls:'fl'},
      h('label',{style:'margin:0;display:flex;gap:6px;align-items:center;color:inherit'},h('input',{type:'checkbox',checked:p.a,style:'width:auto;margin:0',on:{change(e){p.a=e.target.checked}}}),'متاح'),
      h('button',{cls:'del',on:{click(){D.products=D.products.filter(x=>x!==p);render()}}},ic('trash',17),'حذف'))));
}

// ---------- لوحة التحكم ----------
function admin(){
  app.append(h('div',{cls:'top'},h('a',{cls:'ib',href:'/',style:'text-decoration:none;color:var(--tx)'},ic('back')),h('h2',{textContent:'لوحة التحكم'}),h('button',{cls:'chip',textContent:'تسجيل خروج',on:{click:logout}})));
  const fld=(l,k,type='text')=>{app.append(h('label',{textContent:l}));app.append(h('input',{value:D[k]==null?'':D[k],type,inputMode:type==='number'?'numeric':'text',on:{input(e){D[k]=type==='number'?Number(e.target.value):e.target.value}}}))};
  fld('اسم الماركت','name');
  app.append(h('label',{textContent:'ألوان المتجر'}));
  app.append(h('div',{style:'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px'},TH.map((t,i)=>h('button',{cls:'sw'+((D.theme||0)===i?' on':''),on:{click(){D.theme=i;applyTheme();render()}}},h('i',{style:'background:linear-gradient(135deg,'+t.pr+' 0 50%,'+t.pr2+' 50% 70%,'+t.ac+' 70%)'}),t.n))));
  fld('إعلان يظهر للعملاء (اختياري، مثال: الخضار الطازجة وصلت النهارده)','notice');
  fld('مواعيد العمل (مثال: من 8 صباحًا إلى 10 مساءً)','hours');
  fld('رقم واتساب لاستقبال الطلبات (بالصيغة الدولية بدون +، مثال: 201012345678)','wa');
  fld('رقم التليفون اللي العميل يتصل عليه ويطلب مباشرة (مثال: 01012345678). لو سبته فاضي هنستخدم رقم الواتساب','tel');
  fld('التوصيل مجاني للطلبات فوق (اكتب 0 لإلغاء الميزة)','free','number');
  app.append(h('label',{textContent:'القرى ومصاريف التوصيل'}));
  D.zones.forEach(z=>app.append(h('div',{style:'display:flex;gap:6px;margin-bottom:6px;align-items:center'},
    h('input',{value:z.n,placeholder:'اسم القرية',style:'margin:0',on:{input(e){z.n=e.target.value}}}),
    h('input',{value:z.f,type:'number',inputMode:'numeric',style:'margin:0;width:90px',on:{input(e){z.f=Number(e.target.value)}}}),
    h('button',{cls:'del',on:{click(){if(D.zones.length>1){D.zones=D.zones.filter(x=>x!==z);render()}}}},ic('trash',18)))));
  app.append(h('button',{cls:'btn sec',style:'margin:8px 0 16px',on:{click(){D.zones.push({n:'',f:20});render()}}},ic('plus',18),'إضافة قرية'));

  app.append(h('label',{textContent:'أقسام المنتجات (مثلًا: مشروبات، عصائر، ألبان)'}));
  app.append(catsCard());

  const cnt=k=>D.products.filter(p=>p.k===k).length;
  app.append(h('div',{cls:'seg'},[['منتجات القطاعي','r'],['منتجات الجملة','w']].map(([l,v])=>h('button',{cls:'sg'+(atab===v?' on':''),textContent:l+' ('+cnt(v)+')',on:{click(){atab=v;render()}}}))));
  app.append(h('button',{cls:'btn c',style:'margin-bottom:10px',on:{click(){D.products.unshift(newProd(atab));render()}}},ic('plus',20),atab==='r'?'إضافة منتج قطاعي':'إضافة منتج جملة'));
  app.append(h('div',{cls:'sum',style:'padding:12px'},
    h('button',{cls:'btn c sec',on:{click(){pickImages(true)}}},ic('img',20),'رفع صور كتير مرة واحدة'),
    h('div',{style:'color:var(--mu);font-size:13px;margin-top:8px;line-height:1.7',textContent:'اختار كل الصور مرة واحدة من المعرض أو الكاميرا. لو اسم الصورة زي اسم المنتج (مثلًا طماطم.jpg) هتتربط بيه لوحدها، وغير كده هتتعمل منتجات جديدة في أول القائمة وانت تكتب لها الاسم والسعر.'})));
  const list=D.products.filter(p=>p.k===atab);
  if(!list.length)app.append(h('div',{cls:'empty'},h('div',{cls:'emp'},ic('box',36),atab==='r'?'لسه مفيش منتجات قطاعي':'لسه مفيش منتجات جملة')));
  list.forEach(p=>app.append(prodRow(p)));
  app.append(h('div',{style:'display:flex;gap:8px;margin-top:14px;flex-wrap:wrap'},h('a',{cls:'chip',href:'/',target:'_blank',style:'text-decoration:none',textContent:'فتح المتجر'}),h('a',{cls:'chip',href:'/api/admin/backup',style:'text-decoration:none',textContent:'تنزيل نسخة احتياطية'})));
  app.append(h('div',{cls:'act'},h('button',{cls:'btn c',textContent:'حفظ التعديلات',on:{click:save}})));
}

async function save(){
  const body=JSON.parse(JSON.stringify(D));delete body.__in;
  try{
    D=await api('/api/admin/store',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    D.__in=true;D.cats=D.cats||[];applyTheme();render();toast('تم الحفظ');
  }catch(e){
    if(e.status===401){alert('انتهت الجلسة. سجّل الدخول من جديد.');D.__in=false;render()}
    else alert('تعذر الحفظ. جرّب تاني.');
  }
}

(async()=>{
  try{D=await api('/api/store',{cache:'no-store'})}catch(e){D={name:'الماركت',zones:[],products:[],cats:[],theme:0}}
  D.notice=D.notice||'';D.hours=D.hours||'';D.theme=D.theme||0;D.cats=D.cats||[];applyTheme();
  try{await api('/api/admin/me');D.__in=true}catch(e){}
  render();
})();
