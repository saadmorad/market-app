const app=document.getElementById('app');
let cat='الكل';
const uid=()=>'p'+Date.now().toString(36)+Math.floor(Math.random()*1000);
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
function render(){app.replaceChildren();D&&D.__in?admin():login()}

function login(msg=''){
  app.append(h('div',{style:'max-width:360px;margin:12vh auto 0'},
    h('div',{cls:'brand',style:'justify-content:center;margin-bottom:6px'},h('span',{cls:'logo'},ic('store',22)),h('span',{textContent:D&&D.name||'الماركت'})),
    h('p',{style:'text-align:center;color:var(--mu);margin:0 0 18px',textContent:'تسجيل دخول صاحب الماركت'}),
    h('label',{textContent:'كلمة السر'}),
    h('input',{type:'password',id:'pw',autocomplete:'current-password',on:{keydown(e){if(e.key==='Enter')go()}}}),
    h('div',{id:'err',style:'color:#d44;font-size:14px;min-height:20px;margin-bottom:8px',textContent:msg}),
    h('button',{cls:'btn c',textContent:'دخول',on:{click:go}})));
  async function go(){
    const pw=document.getElementById('pw').value;
    try{
      await api('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
      D=await api('/api/store',{cache:'no-store'});D.__in=true;applyTheme();render();
    }catch(e){
      document.getElementById('err').textContent=e.status===429?'محاولات كتير. استنى شوية وجرّب تاني.':'كلمة السر غلط';
    }
  }
}
async function logout(){try{await api('/api/admin/logout',{method:'POST'})}catch(e){}D.__in=false;render()}

function admin(){
  app.append(h('div',{cls:'top'},h('a',{cls:'ib',href:'/',style:'text-decoration:none;color:var(--tx)'},ic('back')),h('h2',{textContent:'لوحة التحكم'}),h('button',{cls:'chip',textContent:'تسجيل خروج',on:{click:logout}})));
  const fld=(l,k,type='text')=>{app.append(h('label',{textContent:l}));app.append(h('input',{value:D[k],type,inputMode:type==='number'?'numeric':'text',on:{input(e){D[k]=type==='number'?Number(e.target.value):e.target.value}}}))};
  fld('اسم الماركت','name');
  app.append(h('label',{textContent:'ألوان المتجر'}));
  app.append(h('div',{style:'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px'},TH.map((t,i)=>h('button',{cls:'sw'+((D.theme||0)===i?' on':''),on:{click(){D.theme=i;applyTheme();render()}}},h('i',{style:'background:linear-gradient(135deg,'+t.pr+' 0 50%,'+t.pr2+' 50% 70%,'+t.ac+' 70%)'}),t.n))));
  fld('إعلان يظهر للعملاء (اختياري، مثال: الخضار الطازجة وصلت النهارده)','notice');
  fld('مواعيد العمل (مثال: من 8 صباحًا إلى 10 مساءً)','hours');
  fld('رقم واتساب لاستقبال الطلبات (بالصيغة الدولية بدون +، مثال: 201012345678)','wa');
  fld('التوصيل مجاني للطلبات فوق (اكتب 0 لإلغاء الميزة)','free','number');
  app.append(h('label',{textContent:'القرى ومصاريف التوصيل'}));
  D.zones.forEach(z=>app.append(h('div',{style:'display:flex;gap:6px;margin-bottom:6px;align-items:center'},
    h('input',{value:z.n,placeholder:'اسم القرية',style:'margin:0',on:{input(e){z.n=e.target.value}}}),
    h('input',{value:z.f,type:'number',inputMode:'numeric',style:'margin:0;width:90px',on:{input(e){z.f=Number(e.target.value)}}}),
    h('button',{cls:'del',on:{click(){if(D.zones.length>1){D.zones=D.zones.filter(x=>x!==z);render()}}}},ic('trash',18)))));
  app.append(h('button',{cls:'btn sec',style:'margin:8px 0 16px',on:{click(){D.zones.push({n:'',f:20});render()}}},ic('plus',18),'إضافة قرية'));
  app.append(h('label',{textContent:'المنتجات (اضغط على الصورة لتغييرها)'}));
  D.products.forEach(p=>{
    const im=pic(p),box=h('div',{style:'position:relative;flex:none;cursor:pointer'},im,h('span',{cls:'edit'},ic('plus',16)));
    box.addEventListener('click',()=>{
      const fi=h('input',{type:'file',accept:'image/*',style:'display:none'});
      fi.addEventListener('change',async()=>{
        const f=fi.files[0];if(!f)return;
        try{const r=await upload(await shrink(f));p.i=r.id;render()}catch(e){alert('تعذر رفع الصورة')}
      });
      document.body.append(fi);fi.click();setTimeout(()=>fi.remove(),60000);
    });
    app.append(h('div',{cls:'arow'},box,h('div',{cls:'af'},
      h('input',{value:p.n,placeholder:'اسم المنتج',on:{input(e){p.n=e.target.value}}}),
      h('div',{cls:'r'},
        h('input',{value:p.p,type:'number',inputMode:'numeric',placeholder:'السعر',on:{input(e){p.p=Number(e.target.value)}}}),
        h('input',{value:p.c,placeholder:'القسم',on:{input(e){p.c=e.target.value}}})),
      h('select',{on:{change(e){p.u=e.target.value}}},['كيلو','قطعة','لتر','علبة','كيس','زجاجة','رغيف','بيضة','حزمة','دستة'].map(u=>h('option',{value:u,textContent:'الوحدة: '+u,selected:u===p.u}))),
      h('div',{cls:'r'},h('input',{value:p.w||'',type:'number',inputMode:'numeric',placeholder:'سعر الجملة (فاضي = قطاعي فقط)',on:{input(e){p.w=Number(e.target.value)}}}),h('input',{value:p.wm||'',type:'number',inputMode:'numeric',placeholder:'أقل كمية جملة',on:{input(e){p.wm=Number(e.target.value)}}})),
      h('select',{on:{change(e){p.wu=e.target.value}}},['كرتونة','شيكارة','دستة','صندوق','جوال','طبق'].map(u=>h('option',{value:u,textContent:'وحدة الجملة: '+u,selected:u===(p.wu||'كرتونة')}))),
      h('div',{cls:'fl'},
        h('label',{style:'margin:0;display:flex;gap:6px;align-items:center;color:inherit'},h('input',{type:'checkbox',checked:p.a,style:'width:auto;margin:0',on:{change(e){p.a=e.target.checked}}}),'متاح'),
        h('button',{cls:'del',on:{click(){D.products=D.products.filter(x=>x!==p);render()}}},ic('trash',17),'حذف')))));
  });
  app.append(h('button',{cls:'btn sec',on:{click(){D.products.push({id:uid(),n:'',p:0,c:cat==='الكل'?'':cat,u:'كيلو',a:true,i:''});render()}}},ic('plus',18),'إضافة منتج'));
  app.append(h('div',{style:'display:flex;gap:8px;margin-top:14px;flex-wrap:wrap'},h('a',{cls:'chip',href:'/',target:'_blank',style:'text-decoration:none',textContent:'فتح المتجر'}),h('a',{cls:'chip',href:'/api/admin/backup',style:'text-decoration:none',textContent:'تنزيل نسخة احتياطية'})));
  app.append(h('div',{cls:'act'},h('button',{cls:'btn c',textContent:'حفظ التعديلات',on:{click:save}})));
}


async function save(){
  const body=JSON.parse(JSON.stringify(D));delete body.__in;
  try{
    D=await api('/api/admin/store',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    D.__in=true;applyTheme();render();toast('تم الحفظ');
  }catch(e){
    if(e.status===401){alert('انتهت الجلسة. سجّل الدخول من جديد.');D.__in=false;render()}
    else alert('تعذر الحفظ. جرّب تاني.');
  }
}

(async()=>{
  try{D=await api('/api/store',{cache:'no-store'})}catch(e){D={name:'الماركت',zones:[],products:[],theme:0}}
  D.notice=D.notice||'';D.hours=D.hours||'';D.theme=D.theme||0;applyTheme();
  try{await api('/api/admin/me');D.__in=true}catch(e){}
  render();
})();
