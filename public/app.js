const app=document.getElementById('app');
let ws=false,cart={},mode='shop',cat='الكل',q='',info={name:'',phone:'',addr:'',note:'',z:0,t:'أقرب وقت',pay:'كاش عند الاستلام'};
const money=n=>n+' ج';
const step=p=>p.u==='كيلو'?0.5:1;
const rq=x=>Math.round(x*2)/2;
const qt=(n,u)=>(n===0.5?'½':n)+' '+u;
const zone=()=>D.zones[info.z]||D.zones[0]||{n:'',f:D.fee};
const fee=()=>D.free>0&&subtotal()>=D.free?0:Number(zone().f||0);
const kk=(p,w)=>(w?'w':'')+p.id;
const pr=(p,w)=>w?p.w:p.p;
const un=(p,w)=>w?(p.wu||'كرتونة'):(p.u||'قطعة');
const st=(p,w)=>w?1:step(p);
const items=()=>{const r=[];D.products.forEach(p=>[false,true].forEach(w=>{const q=cart[kk(p,w)];if(q>0)r.push({p,w,q,pr:pr(p,w),u:un(p,w)})}));return r};
const subtotal=()=>Math.round(items().reduce((s,i)=>s+i.pr*i.q,0));
const count=()=>items().length;
const LS={g(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},s(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let orders=LS.g('mk_orders',[]),otab='cur',navEl=null;
Object.assign(info,LS.g('mk_info',{}));

function render(){navEl=null;app.replaceChildren();({shop,cart:cartView,checkout,orders:ordersView})[mode]();window.scrollTo(0,0)}
function drawNav(){
  const it=(k,i,l,f,b)=>h('button',{cls:'ni'+(mode===k?' on':''),on:{click:f}},h('span',{cls:'nw'},ic(i,23),b?h('span',{cls:'bg',textContent:b}):''),h('span',{textContent:l}));
  const n=h('nav',{cls:'nav'},
    it('shop','home','الرئيسية',()=>{mode='shop';render()}),
    it('cart','cart','السلة',()=>{mode='cart';render()},count()||''),
    it('orders','box','طلباتي',()=>{mode='orders';render()}),
    h('a',{cls:'ni',href:'tel:+'+D.wa},h('span',{cls:'nw'},ic('phone',23)),h('span',{textContent:'اتصل بنا'})));
  navEl?navEl.replaceWith(n):app.append(n);navEl=n;
}
const tb=(t,back='shop')=>h('div',{cls:'top'},h('button',{cls:'ib',on:{click(){mode=back;render()}}},ic('back')),h('h2',{textContent:t}),h('button',{cls:'ib',on:{click:menu}},ic('menu')));
function menu(){
  const o=h('div',{style:'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:50'});
  const go=(m,t)=>()=>{o.remove();mode=m;if(t)otab=t;render()};
  const it=(i,l,f,b)=>h('button',{cls:'mi',on:{click:f}},h('span',{},ic(i,22),l),b?h('span',{cls:'bd',textContent:b}):'');
  const p=h('div',{cls:'dr'},h('div',{cls:'brand',style:'margin-bottom:12px'},h('span',{cls:'logo'},ic('store',22)),h('span',{textContent:D.name})),
    it('home','الرئيسية',go('shop')),it('cart','السلة',go('cart'),count()||''),
    it('box','طلباتي',go('orders')),
    h('a',{cls:'mi',href:'tel:+'+D.wa},h('span',{},ic('phone',22),'اتصل بنا')),
    D.hours?h('div',{style:'margin-top:14px;color:var(--mu);font-size:14px;display:flex;gap:8px;align-items:center;padding:0 10px'},ic('clock',18),'مواعيد العمل: '+D.hours):'');
  o.addEventListener('click',e=>{if(e.target===o)o.remove()});
  o.append(p);document.body.append(o);
}

let listEl,barEl,chipEl;
const pill=(i,t)=>h('span',{cls:'pill'},ic(i,16),t);
function shop(){
  app.append(h('header',{cls:'ab'},
    h('div',{cls:'abl'},h('button',{cls:'ib',on:{click:menu}},ic('menu')),h('div',{cls:'brand'},h('span',{cls:'logo'},ic('store',22)),h('span',{textContent:D.name}))),
    h('div',{cls:'abl'},
      h('button',{cls:'ib',on:{click(){mode='cart';render()}}},ic('cart'),count()?h('span',{cls:'bg',textContent:count()}):''))));
  app.append(h('div',{cls:'hero'},h('div',{cls:'hi'},h('small',{textContent:'أهلًا بيك في'}),h('h1',{textContent:D.name}),h('p',{textContent:'خيرات الأرض لحد باب بيتك'})),
    h('div',{cls:'pills'},D.free>0?pill('truck','توصيل مجاني فوق '+D.free+' ج'):'',D.hours?pill('clock',D.hours):'')));
  if(D.notice)app.append(h('div',{cls:'note'},ic('tag',18),D.notice));
  app.append(h('div',{cls:'sbx'},ic('search',19),h('input',{placeholder:'ابحث عن منتج...',value:q,on:{input(e){q=e.target.value;drawList()}}})));
  app.append(h('div',{cls:'seg'},[['قطاعي',false],['جملة',true]].map(([l,v])=>h('button',{cls:'sg'+(ws===v?' on':''),textContent:l,on:{click(){ws=v;cat='الكل';render()}}}))));
  chipEl=h('div',{cls:'chips'});listEl=h('div',{cls:'g'});barEl=h('div');
  app.append(chipEl,listEl,barEl);drawChips();drawList();drawBar();
}
function drawChips(){
  const cats=['الكل',...new Set(D.products.filter(p=>p.a&&(!ws||p.w>0)).map(p=>p.c).filter(Boolean))];
  chipEl.replaceChildren(...cats.map(c=>h('button',{cls:'chip'+(c===cat?' on':''),textContent:c,on:{click(){cat=c;drawChips();drawList()}}})));
}
function drawList(){
  const t=q.trim();
  const list=D.products.filter(p=>p.a&&(!ws||p.w>0)&&(cat==='الكل'||p.c===cat)&&(!t||p.n.includes(t)));
  listEl.replaceChildren();
  if(!list.length){listEl.append(h('div',{cls:'empty'},h('div',{cls:'emp'},ic('search',36),'لا توجد منتجات')));return}
  list.forEach(p=>{const k=kk(p,ws),n=cart[k]||0,s=st(p,ws),mn=ws?(p.wm||1):s;
    const set=v=>{cart[k]=v;drawList();drawBar()};
    const ctl=n?h('div',{cls:'stp'},
        h('button',{cls:'sb1',on:{click(){set(rq(n+s))}}},ic('plus',18)),
        h('span',{textContent:qt(n,un(p,ws))}),
        h('button',{cls:'sb1 m',on:{click(){const x=rq(n-s);set(ws&&x<mn?0:x)}}},ic('minus',18)))
      :h('button',{cls:'fab',on:{click(){set(mn)}}},ic('plus',22));
    listEl.append(h('div',{cls:'card'},
      h('div',{cls:'imw'},pic(p),p.c?h('span',{cls:'tg',textContent:p.c}):'',ctl),
      h('div',{cls:'cb'},h('div',{cls:'nm',textContent:p.n}),
        h('div',{cls:'pc'},h('b',{textContent:pr(p,ws)}),h('small',{textContent:' ج / '+un(p,ws)})),
        ws&&mn>1?h('div',{cls:'mn',textContent:'أقل كمية: '+mn}):'')));
  });
}
function drawBar(){
  barEl.replaceChildren();
  const cb=document.querySelector('.ab .abl:last-child .ib:last-child');if(cb){const o=cb.querySelector('.bg');if(o)o.remove();if(count())cb.append(h('span',{cls:'bg',textContent:count()}))}
  if(count())barEl.append(h('button',{cls:'fcb',on:{click(){mode='cart';render()}}},h('span',{},ic('cart',22),'عرض السلة ('+count()+')'),h('span',{textContent:money(subtotal())})));
  drawNav();
}

function cartView(){
  app.append(tb('السلة'));
  const L=items();
  if(!L.length){app.append(h('div',{cls:'empty'},h('div',{cls:'emp'},ic('cart',40),'السلة فاضية')));drawNav();return}
  L.forEach(i=>{const k=kk(i.p,i.w),s=st(i.p,i.w),mn=i.w?(i.p.wm||1):s,set=v=>{cart[k]=v;render()};
    app.append(h('div',{cls:'arow'},pic(i.p),h('div',{cls:'af'},
      h('div',{cls:'nm',style:'min-height:0',textContent:i.p.n+(i.w?' (جملة)':'')}),
      h('div',{cls:'pc'},h('b',{textContent:Math.round(i.pr*i.q)}),h('small',{textContent:' ج'})),
      h('div',{style:'display:flex;align-items:center;gap:10px;margin-top:8px'},
        h('button',{cls:'sb1',on:{click(){set(rq(i.q+s))}}},ic('plus',18)),
        h('b',{textContent:qt(i.q,i.u),style:'font-size:13px;min-width:56px;text-align:center'}),
        h('button',{cls:'sb1 m',on:{click(){const x=rq(i.q-s);set(i.w&&x<mn?0:x)}}},ic('minus',18))))));
  });
  app.append(h('div',{cls:'act up'},h('button',{cls:'btn',on:{click(){mode='checkout';render()}}},h('span',{textContent:'متابعة الطلب'}),h('span',{textContent:money(subtotal())}))));
  drawNav();
}

function checkout(){
  app.append(tb('إتمام الطلب','cart'));
  const s=h('div',{cls:'sum'});
  items().forEach(i=>s.append(h('div',{cls:'l'},h('span',{textContent:i.p.n+(i.w?' (جملة)':'')+' × '+qt(i.q,i.u)}),h('span',{textContent:money(Math.round(i.pr*i.q))}))));
  const fr=h('span'),tot=h('span');
  const upd=()=>{fr.textContent=fee()?money(fee()):'مجاني';tot.textContent=money(subtotal()+fee())};
  s.append(h('div',{cls:'l'},h('span',{textContent:'التوصيل'}),fr));
  s.append(h('div',{cls:'l',style:'font-weight:800;font-size:18px;border-top:1px dashed var(--bd);margin-top:6px;padding-top:10px'},h('span',{textContent:'الإجمالي'}),tot));
  upd();app.append(s);
  const f=(l,k,tag='input')=>{app.append(h('label',{textContent:l}));app.append(h(tag,{value:info[k],on:{input(e){info[k]=e.target.value}}}))};
  f('الاسم','name');f('رقم الموبايل','phone');
  app.append(h('label',{textContent:'القرية / المنطقة'}));
  app.append(h('select',{on:{change(e){info.z=+e.target.value;upd()}}},D.zones.map((z,i)=>h('option',{value:i,textContent:z.n+' — توصيل '+z.f+' ج',selected:i===info.z}))));
  f('أقرب علامة معروفة (مثال: جنب الجامع / بيت الحاج فلان)','addr','textarea');
  app.append(h('label',{textContent:'موعد التوصيل'}));
  app.append(h('select',{on:{change(e){info.t=e.target.value}}},['أقرب وقت','الصبح','بعد الظهر','بعد العصر','بالليل'].map(t=>h('option',{value:t,textContent:t,selected:t===info.t}))));
  app.append(h('label',{textContent:'طريقة الدفع'}));
  app.append(h('select',{on:{change(e){info.pay=e.target.value}}},['كاش عند الاستلام','آجل (على الحساب)'].map(t=>h('option',{value:t,textContent:t,selected:t===info.pay}))));
  f('اكتب هنا أي منتج مش لاقيه، أو أي ملاحظة (اختياري)','note','textarea');
  app.append(h('div',{cls:'act'},h('button',{cls:'btn c',on:{click:send}},ic('send',20),'إرسال الطلب على واتساب')));
}

function send(){
  if(!info.name.trim()||!info.phone.trim()||!info.addr.trim()){alert('من فضلك اكتب الاسم والموبايل والعنوان');return}
  let m='طلب جديد 🛒\n';
  items().forEach(i=>m+='• '+i.p.n+(i.w?' (جملة)':'')+' × '+qt(i.q,i.u)+' = '+Math.round(i.pr*i.q)+' ج\n');
  m+='\nالمنتجات: '+subtotal()+' ج\nالتوصيل: '+(fee()?fee()+' ج':'مجاني')+'\nالإجمالي: '+(subtotal()+fee())+' ج\n\n';
  m+='الاسم: '+info.name+'\nالموبايل: '+info.phone+'\nالقرية: '+zone().n+'\nأقرب علامة: '+info.addr+'\nالموعد: '+info.t+'\nالدفع: '+info.pay;
  if(info.note.trim())m+='\nملاحظات: '+info.note;
  const a=h('a',{href:'https://wa.me/'+D.wa+'?text='+encodeURIComponent(m),target:'_blank',rel:'noopener'});
  document.body.append(a);a.click();a.remove();
  orders.unshift({id:Date.now(),d:new Date().toISOString(),tot:subtotal()+fee(),z:zone().n,pay:info.pay,done:false,L:items().map(i=>({id:i.p.id,w:i.w,q:i.q,n:i.p.n,u:i.u}))});
  orders=orders.slice(0,30);LS.s('mk_orders',orders);
  LS.s('mk_info',{name:info.name,phone:info.phone,addr:info.addr,z:info.z,t:info.t,pay:info.pay});
  cart={};otab='cur';mode='orders';render();
}

function reorder(o){let miss=0;o.L.forEach(l=>{const p=D.products.find(x=>x.id===l.id);if(p&&p.a&&(!l.w||p.w>0))cart[kk(p,l.w)]=l.q;else miss++});mode='cart';render();toast(miss?'بعض المنتجات لم تعد متاحة':'تمت إضافة الطلب للسلة')}
function ordersView(){
  app.append(tb('طلباتي'));
  if(!orders.length)app.append(h('div',{cls:'empty'},h('div',{cls:'emp'},ic('box',40),'مفيش طلبات')));
  orders.forEach(o=>{const sv=()=>{LS.s('mk_orders',orders);render()};
    app.append(h('div',{cls:'sum'},
      h('div',{cls:'l',style:'font-weight:800'},h('span',{textContent:new Date(o.d).toLocaleString('ar-EG',{dateStyle:'medium',timeStyle:'short'})}),h('span',{style:'color:var(--pr)',textContent:money(o.tot)})),
      ...o.L.map(l=>h('div',{cls:'l',style:'font-size:14px;color:var(--mu)'},h('span',{textContent:l.n+(l.w?' (جملة)':'')}),h('span',{textContent:qt(l.q,l.u)}))),
      h('div',{style:'font-size:13px;color:var(--mu);margin-top:4px',textContent:o.z+' — '+o.pay}),
      h('div',{cls:'rowb'},
        h('button',{cls:'sbtn',on:{click(){reorder(o)}}},ic('repeat',18),'اطلب تاني'),
        h('button',{cls:'del',on:{click(){orders=orders.filter(x=>x!==o);sv()}}},ic('trash',18)))));
  });
  drawNav();
}


(async()=>{
  try{
    const r=await fetch('/api/store',{cache:'no-store'});
    if(!r.ok)throw new Error('http '+r.status);
    D=await r.json();
  }catch(e){
    app.append(h('div',{cls:'empty'},h('div',{cls:'emp'},ic('search',36),'تعذر تحميل المتجر. اتأكد من النت وجرّب تاني.'),h('div',{style:'margin-top:14px'},h('button',{cls:'chip',textContent:'إعادة المحاولة',on:{click(){location.reload()}}}))));
    return;
  }
  D.notice=D.notice||'';D.hours=D.hours||'';D.theme=D.theme||0;
  document.title=D.name;applyTheme();render();
})();
