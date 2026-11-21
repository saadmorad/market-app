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
const items=()=>{const r=[];D.products.forEach(p=>{const w=p.k==='w',q=cart[kk(p,w)];if(q>0)r.push({p,w,q,pr:pr(p,w),u:un(p,w)})});return r};
const vis=p=>p.a&&(ws?(p.k==='w'&&p.w>0):(p.k!=='w'&&p.p>0));
const subtotal=()=>Math.round(items().reduce((s,i)=>s+i.pr*i.q,0));
const count=()=>items().length;
let dip=null,instEl=null;
const standalone=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const canInstall=()=>!standalone()&&(dip||isIOS());
async function doInstall(){
  if(dip){dip.prompt();try{await dip.userChoice}catch(e){}dip=null;drawInstall()}
  else if(isIOS())alert('علشان تثبّت التطبيق: اضغط زر المشاركة في سفاري، وبعدين اختار "إضافة إلى الشاشة الرئيسية".');
}
function drawInstall(){
  if(!instEl)return;instEl.replaceChildren();
  if(!canInstall()||LS.g('mk_pwa_x',0))return;
  instEl.append(h('div',{cls:'note',style:'justify-content:space-between;gap:10px'},
    h('span',{style:'display:flex;gap:8px;align-items:center'},ic('download',20),'ثبّت الماركت على موبايلك وافتحه زي أي تطبيق'),
    h('span',{style:'display:flex;gap:6px;flex:none'},
      h('button',{cls:'chip on',textContent:'تثبيت',on:{click:doInstall}}),
      h('button',{cls:'ib',style:'width:34px;height:34px;box-shadow:none',on:{click(){LS.s('mk_pwa_x',1);drawInstall()}}},ic('x',16)))));
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;drawInstall()});
window.addEventListener('appinstalled',()=>{dip=null;drawInstall()});
const LS={g(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},s(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let orders=LS.g('mk_orders',[]),otab='cur',navEl=null;
Object.assign(info,LS.g('mk_info',{}));

function render(keep){navEl=null;app.replaceChildren();({shop,cart:cartView,checkout,orders:ordersView})[mode]();if(!keep)window.scrollTo(0,0)}
function drawNav(){
  const it=(k,i,l,f,b)=>h('button',{cls:'ni'+(mode===k?' on':''),on:{click:f}},h('span',{cls:'nw'},ic(i,23),b?h('span',{cls:'bg',textContent:b}):''),h('span',{textContent:l}));
  const n=h('nav',{cls:'nav'},
    it('shop','home','الرئيسية',()=>{mode='shop';render()}),
    it('cart','cart','السلة',()=>{mode='cart';render()},count()||''),
    it('orders','box','طلباتي',()=>{mode='orders';render()}),
    h('a',{cls:'ni',href:telHref()},h('span',{cls:'nw'},ic('phone',23)),h('span',{textContent:'اتصل بنا'})));
  navEl?navEl.replaceWith(n):app.append(n);navEl=n;
}
const tb=(t,back='shop')=>h('div',{cls:'top'},h('button',{cls:'ib',on:{click(){mode=back;render()}}},ic('back')),h('h2',{textContent:t}),h('button',{cls:'ib',on:{click:menu}},ic('menu')));
function menu(){
  const o=h('div',{style:'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:50'});
  const go=(m,t)=>()=>{o.remove();mode=m;if(t)otab=t;render()};
  const it=(i,l,f,b)=>h('button',{cls:'mi',on:{click:f}},h('span',{},ic(i,22),l),b?h('span',{cls:'bd',textContent:b}):'');
  const p=h('div',{cls:'dr'},h('div',{cls:'brand',style:'margin-bottom:12px'},logo(),h('span',{textContent:D.name})),
    it('home','الرئيسية',go('shop')),it('cart','السلة',go('cart'),count()||''),
    it('box','طلباتي',go('orders')),
    canInstall()?it('download','تثبيت التطبيق',()=>{o.remove();doInstall()}):'',
    h('a',{cls:'mi',href:telHref()},h('span',{},ic('phone',22),'اتصل بنا')),
    D.hours?h('div',{style:'margin-top:14px;color:var(--mu);font-size:14px;display:flex;gap:8px;align-items:center;padding:0 10px'},ic('clock',18),'مواعيد العمل: '+D.hours):'');
  o.addEventListener('click',e=>{if(e.target===o)o.remove()});
  p.append(h('div',{cls:'ft',style:'margin-top:auto',textContent:copyrightText()}));
  o.append(p);document.body.append(o);
}

let listEl,barEl,chipEl;
const callStyle='text-decoration:none;display:inline-flex;gap:6px;align-items:center';
const telNum=()=>D.tel||('+'+D.wa);
const telHref=()=>'tel:'+telNum();
const callCard=()=>h('div',{cls:'sum',style:'display:flex;align-items:center;justify-content:space-between;gap:10px'},
  h('span',{style:'font-size:14px;line-height:1.6'},'بتفضّل تطلب بالتليفون؟',h('br'),h('b',{textContent:telNum(),style:'direction:ltr;display:inline-block'})),
  h('a',{cls:'chip on',href:telHref(),style:callStyle},ic('phone',16),'اتصل واطلب'));

// ---------- البحث: بيتجاهل التشكيل واختلاف الألف والتاء المربوطة والياء، وبيدوّر في الاسم والقسم بأي ترتيب للكلمات ----------
const norm=s=>String(s==null?'':s).toLowerCase()
  .replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
  .replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
function searchIn(list,t){
  const toks=norm(t).split(' ').filter(Boolean);
  if(!toks.length)return list;
  const res=[];
  list.forEach((p,i)=>{
    const name=p._n||(p._n=norm(p.n)),cat=p._c||(p._c=norm(p.c)),hay=name+' '+cat;
    if(!toks.every(k=>hay.includes(k)))return;
    let s=3;
    if(toks.every(k=>name.includes(k))){s=2;const ws2=name.split(' ');if(toks.every(k=>ws2.some(w=>w.startsWith(k))))s=1;if(name.startsWith(toks[0]))s=0}
    res.push([s,i,p]);
  });
  return res.sort((x,y)=>x[0]-y[0]||x[1]-y[1]).map(x=>x[2]);
}
function noResults(t){
  const other=searchIn(D.products.filter(p=>p.a&&(ws?(p.k!=='w'&&p.p>0):(p.k==='w'&&p.w>0))),t);
  const box=h('div',{cls:'empty',style:'padding:24px 0'},h('div',{cls:'emp'},ic('search',36),'ما لقيناش "'+t+'"'));
  if(other.length)box.append(h('div',{style:'margin-top:12px'},h('button',{cls:'chip on',textContent:(ws?'موجود في القطاعي':'موجود في الجملة')+' ('+other.length+') — اعرضه',on:{click(){ws=!ws;cat='الكل';render()}}})));
  else box.append(h('div',{style:'margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap'},
    h('a',{cls:'chip on',href:telHref(),style:callStyle},ic('phone',16),'اتصل واسأل'),
    h('a',{cls:'chip',href:'https://wa.me/'+D.wa+'?text='+encodeURIComponent('عايز أسأل عن: '+t),target:'_blank',rel:'noopener',style:callStyle},'اسأل على واتساب')));
  return box;
}
const BADGES={hot:['الأكثر طلبًا','hot'],new:['جديد','new'],offer:['عرض','offer']};
const disc=p=>{const pc=pr(p,p.k==='w');return p.o>pc?Math.round((1-pc/p.o)*100):0};
const savings=()=>Math.round(items().reduce((s,i)=>s+(i.p.o>i.pr?(i.p.o-i.pr)*i.q:0),0));
const freeHint=()=>{if(!(D.free>0))return null;const s=subtotal();return s>=D.free?{ok:true,pct:100}:{ok:false,left:Math.ceil(D.free-s),pct:Math.round(s/D.free*100)}};
const buzz=()=>{try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}};
const refresh=()=>{if(mode==='shop'){drawList();drawBar()}else render(true)};
function setQty(p,v){
  const before=subtotal();cart[kk(p,p.k==='w')]=v;if(v>0)buzz();
  if(D.free>0&&before<D.free&&subtotal()>=D.free)toast('مبروك! التوصيل بقى مجاني');
  refresh();
}
const emptyBox=()=>h('div',{cls:'empty'},h('div',{cls:'emp'},ic('search',36),'لا توجد منتجات'));
const trust=()=>h('div',{cls:'trust'},[['truck','توصيل لحد البيت'],['check','ادفع عند الاستلام'],['send','تأكيد على واتساب']].map(([i,t])=>h('div',{cls:'tr'},ic(i,18),t)));
function cardEl(p){
  const w=p.k==='w',n=cart[kk(p,w)]||0,s=st(p,w),dc=disc(p),b=BADGES[p.b];
  const ctl=n?h('div',{cls:'stp2'},
      h('button',{cls:'sb1',on:{click(){setQty(p,rq(n+s))}}},ic('plus',18)),
      h('span',{textContent:qt(n,un(p,w))}),
      h('button',{cls:'sb1 m',on:{click(){setQty(p,rq(n-s))}}},ic('minus',18)))
    :h('button',{cls:'addb',on:{click(){setQty(p,s)}}},ic('plus',18),'أضف للسلة');
  return h('div',{cls:'card',on:{click(e){if(e.target.closest('.addrow'))return;openProduct(p)}}},
    h('div',{cls:'imw'},pic(p),b?h('span',{cls:'rib '+b[1],textContent:b[0]}):'',dc?h('span',{cls:'dsc',textContent:'-'+dc+'%'}):''),
    h('div',{cls:'cb'},
      p.c?h('div',{cls:'cat',textContent:p.c}):'',
      h('div',{cls:'nm',textContent:p.n}),
      h('div',{cls:'pc'},h('b',{textContent:pr(p,w)}),h('small',{textContent:' ج / '+un(p,w)}),p.o>pr(p,w)?h('s',{cls:'old',textContent:p.o}):''),
      w&&p.pp>0?h('div',{cls:'mn',textContent:'سعر القطعة: '+p.pp+' ج'}):'',
      h('div',{cls:'addrow'},ctl)));
}
function findLine(l){
  let p=D.products.find(x=>x.id===l.id);if(l.w&&(!p||p.k!=='w'))p=D.products.find(x=>x.id===l.id+'_w')||p;
  return p&&p.a&&(l.w?(p.k==='w'&&p.w>0):(p.k!=='w'&&p.p>0))?p:null;
}
function shelf(title,list){
  if(!list.length)return;
  listEl.append(h('div',{cls:'sec-h',style:'grid-column:1/-1'},h('span',{textContent:title})));
  listEl.append(h('div',{cls:'shelf',style:'grid-column:1/-1'},list.map(cardEl)));
}
const pill=(i,t)=>h('span',{cls:'pill'},ic(i,16),t);
function shop(){
  app.append(h('header',{cls:'ab'},
    h('div',{cls:'abl'},h('button',{cls:'ib',on:{click:menu}},ic('menu')),h('div',{cls:'brand'},logo(),h('span',{textContent:D.name}))),
    h('div',{cls:'abl'},
      h('a',{cls:'ib',href:telHref(),title:'اتصل بنا',style:'text-decoration:none'},ic('phone',20)),
      h('button',{cls:'ib',on:{click(){mode='cart';render()}}},ic('cart'),count()?h('span',{cls:'bg',textContent:count()}):''))));
  app.append(h('div',{cls:'hero'},h('div',{cls:'hi'},h('small',{textContent:'أهلًا بيك في'}),h('h1',{textContent:D.name}),h('p',{textContent:'خيرات الأرض لحد باب بيتك'})),
    h('div',{cls:'pills'},h('a',{cls:'pill',href:telHref(),style:'text-decoration:none;color:#fff'},ic('phone',16),'اطلب بالتليفون'),D.free>0?pill('truck','توصيل مجاني فوق '+D.free+' ج'):'',D.hours?pill('clock',D.hours):'')));
  app.append(trust());
  instEl=h('div');app.append(instEl);drawInstall();
  if(D.notice)app.append(h('div',{cls:'note'},ic('tag',18),D.notice));
  const clr=h('button',{cls:'clr',style:'display:'+(q?'flex':'none'),on:{click(){q='';inp.value='';clr.style.display='none';drawList();inp.focus()}}},ic('x',16));
  const inp=h('input',{placeholder:'ابحث عن منتج أو قسم...',value:q,enterKeyHint:'search',on:{input(e){q=e.target.value;clr.style.display=q?'flex':'none';drawList()},keydown(e){if(e.key==='Enter')e.target.blur()}}});
  app.append(h('div',{cls:'sbx'},ic('search',19),inp,clr));
  app.append(h('div',{cls:'seg'},[['قطاعي',false],['جملة',true]].map(([l,v])=>h('button',{cls:'sg'+(ws===v?' on':''),textContent:l,on:{click(){ws=v;cat='الكل';render()}}}))));
  chipEl=h('div',{cls:'chips'});listEl=h('div',{cls:'g'});barEl=h('div');
  app.append(chipEl,listEl,copyright(),barEl);drawChips();drawList();drawBar();
}
function drawChips(){
  const cats=['الكل',...(D.cats||[]).filter(c=>D.products.some(p=>vis(p)&&p.c===c))];
  chipEl.replaceChildren(...cats.map(c=>h('button',{cls:'chip'+(c===cat?' on':''),textContent:c,on:{click(){cat=c;drawChips();drawList()}}})));
}
function drawList(){
  const t=q.trim(),all=D.products.filter(vis);
  listEl.replaceChildren();
  if(t){
    const list=searchIn(all,t);
    if(!list.length){listEl.append(noResults(t));return}
    listEl.append(h('div',{cls:'mn',style:'grid-column:1/-1;margin-bottom:-4px',textContent:'نتائج البحث عن "'+t+'": '+list.length}));
    list.forEach(p=>listEl.append(cardEl(p)));return;
  }
  if(cat!=='الكل'){
    const list=all.filter(p=>p.c===cat);
    if(!list.length){listEl.append(emptyBox());return}
    list.forEach(p=>listEl.append(cardEl(p)));return;
  }
  if(!all.length){listEl.append(emptyBox());return}
  // الرئيسية: رف "اطلب تاني" + رف "الأكثر طلبًا" + المنتجات مقسمة حسب القسم
  const seen=new Set(),again=[];
  for(const o of orders.slice(0,6))for(const l of o.L){const p=findLine(l);if(p&&all.includes(p)&&!seen.has(p.id)){seen.add(p.id);again.push(p)}}
  shelf('اطلب تاني من طلباتك',again.slice(0,8));
  shelf('الأكثر طلبًا',all.filter(p=>p.b==='hot'));
  const names=[...new Set([...(D.cats||[]),...all.map(p=>p.c||'')])].filter(Boolean);
  if(all.some(p=>!p.c))names.push('');
  names.forEach(c=>{
    const l=all.filter(p=>(p.c||'')===c);if(!l.length)return;
    listEl.append(h('div',{cls:'sec-h',style:'grid-column:1/-1'},h('span',{textContent:c||'منتجات أخرى'}),h('small',{textContent:l.length+' منتج'})));
    l.forEach(p=>listEl.append(cardEl(p)));
  });
}
// ---------- تفاصيل المنتج: صورة كبيرة + الوصف + إضافة للسلة ----------
function openProduct(p){
  const w=p.k==='w',k=kk(p,w),s=st(p,w);
  const o=h('div',{cls:'ov'}),sh=h('div',{cls:'sheet'});
  let closed=false;
  const onpop=()=>close(true);
  function close(fromPop){
    if(closed)return;closed=true;o.remove();document.body.style.overflow='';
    window.removeEventListener('popstate',onpop);
    if(fromPop!==true)history.back();
  }
  const set=v=>{setQty(p,v);draw()};
  function draw(){
    const n=cart[k]||0;
    const acts=n?h('div',{cls:'acts'},
        h('div',{style:'display:flex;align-items:center;gap:12px'},
          h('button',{cls:'sb1',on:{click(){set(rq(n+s))}}},ic('plus',18)),
          h('b',{textContent:qt(n,un(p,w))}),
          h('button',{cls:'sb1 m',on:{click(){set(rq(n-s))}}},ic('minus',18))),
        h('button',{cls:'btn',style:'flex:1',on:{click(){close();mode='cart';render()}}},h('span',{textContent:'عرض السلة'}),h('span',{textContent:money(subtotal())})))
      :h('div',{cls:'acts'},h('button',{cls:'btn c',on:{click(){set(s)}}},ic('plus',20),'أضف للسلة'));
    sh.replaceChildren(
      h('button',{cls:'ib xb',on:{click(){close()}}},ic('x',20)),
      h('div',{cls:'sh-img'},pic(p)),
      h('div',{cls:'in'},
        h('h3',{textContent:p.n}),
        h('div',{cls:'tags'},BADGES[p.b]?h('span',{cls:'tag hot',textContent:BADGES[p.b][0]}):'',p.c?h('span',{cls:'tag',textContent:p.c}):'',h('span',{cls:'tag',textContent:w?'جملة':'قطاعي'})),
        h('div',{cls:'big'},pr(p,w)+' ',h('small',{textContent:'ج / '+un(p,w)}),p.o>pr(p,w)?h('s',{cls:'old',textContent:p.o}):'',disc(p)?h('span',{cls:'dsc2',textContent:'وفّر '+disc(p)+'%'}):''),
        w&&p.pp>0?h('div',{cls:'pp',textContent:'سعر القطعة: '+p.pp+' ج'}):'',
        p.d?h('div',{cls:'desc',textContent:p.d}):''),
      acts);
  }
  o.addEventListener('click',e=>{if(e.target===o)close()});
  o.append(sh);document.body.append(o);document.body.style.overflow='hidden';
  history.pushState({sheet:1},'');window.addEventListener('popstate',onpop);
  draw();
}
function drawBar(){
  barEl.replaceChildren();
  const cb=document.querySelector('.ab .abl:last-child .ib:last-child');if(cb){const o=cb.querySelector('.bg');if(o)o.remove();if(count())cb.append(h('span',{cls:'bg',textContent:count()}))}
  if(count()){
    const fh=freeHint();
    barEl.append(h('button',{cls:'fcb',on:{click(){mode='cart';render()}}},
      h('span',{style:'flex-direction:column;align-items:flex-start;gap:2px'},
        h('span',{},ic('cart',22),'عرض السلة ('+count()+')'),
        fh?h('small',{style:'font-weight:600;opacity:.92;font-size:12px',textContent:fh.ok?'التوصيل مجاني':'باقي '+fh.left+' ج للتوصيل المجاني'}):''),
      h('span',{textContent:money(subtotal())})));
  }
  drawNav();
}

function suggestions(){
  const L=items(),inCart=new Set(L.map(i=>i.p.id)),cats=new Set(L.map(i=>i.p.c).filter(Boolean));
  const w=L.length?L[0].w:false;
  const pool=D.products.filter(p=>p.a&&(w?(p.k==='w'&&p.w>0):(p.k!=='w'&&p.p>0))&&!inCart.has(p.id));
  const score=p=>(cats.has(p.c)?2:0)+(p.b==='hot'?1:0)+(disc(p)?1:0)+(p.b==='new'?.5:0);
  return pool.map((p,i)=>[score(p),i,p]).sort((x,y)=>y[0]-x[0]||x[1]-y[1]).slice(0,6).map(x=>x[2]);
}
function cartView(){
  app.append(tb('السلة'));
  const L=items();
  if(!L.length){app.append(h('div',{cls:'empty'},h('div',{cls:'emp'},ic('cart',40),'السلة فاضية')));app.append(callCard());drawNav();return}
  const fh=freeHint();
  if(fh)app.append(h('div',{cls:'fdc'},h('div',{style:'display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px'},ic('truck',18),fh.ok?'مبروك! توصيلك مجاني':'باقي '+fh.left+' ج وتاخد التوصيل مجانًا'),h('div',{cls:'pgb'},h('i',{style:'width:'+fh.pct+'%'}))));
  L.forEach(i=>{const s=st(i.p,i.w),set=v=>setQty(i.p,v);
    app.append(h('div',{cls:'arow'},pic(i.p),h('div',{cls:'af'},
      h('div',{cls:'nm',style:'min-height:0',textContent:i.p.n+(i.w?' (جملة)':'')}),
      h('div',{cls:'pc'},h('b',{textContent:Math.round(i.pr*i.q)}),h('small',{textContent:' ج'})),
      h('div',{style:'display:flex;align-items:center;gap:10px;margin-top:8px'},
        h('button',{cls:'sb1',on:{click(){set(rq(i.q+s))}}},ic('plus',18)),
        h('b',{textContent:qt(i.q,i.u),style:'font-size:13px;min-width:56px;text-align:center'}),
        h('button',{cls:'sb1 m',on:{click(){set(rq(i.q-s))}}},ic('minus',18))))));
  });
  const sv=savings();if(sv>0)app.append(h('div',{cls:'sav'},ic('tag',18),'وفّرت '+sv+' ج في طلبك'));
  const sg=suggestions();
  if(sg.length){app.append(h('div',{cls:'sec-h',style:'margin-top:8px'},h('span',{textContent:'ممكن تحتاج كمان'})));app.append(h('div',{cls:'shelf'},sg.map(cardEl)))}
  app.append(callCard());
  app.append(h('div',{cls:'act up'},h('button',{cls:'btn',on:{click(){mode='checkout';render()}}},h('span',{textContent:'متابعة الطلب'}),h('span',{textContent:money(subtotal())}))));
  drawNav();
}

function checkout(){
  app.append(tb('إتمام الطلب','cart'));
  const s=h('div',{cls:'sum'});
  items().forEach(i=>s.append(h('div',{cls:'l'},h('span',{textContent:i.p.n+(i.w?' (جملة)':'')+' × '+qt(i.q,i.u)}),h('span',{textContent:money(Math.round(i.pr*i.q))}))));
  const fr=h('span'),tot=h('span');
  const upd=()=>{fr.textContent=fee()?money(fee()):'مجاني';tot.textContent=money(subtotal()+fee())};
  const sv=savings();if(sv>0)s.append(h('div',{cls:'l',style:'color:var(--pr);font-weight:700'},h('span',{textContent:'وفّرت'}),h('span',{textContent:money(sv)})));
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

function reorder(o){let miss=0;o.L.forEach(l=>{const p=findLine(l);if(p)cart[kk(p,l.w)]=l.q;else miss++});mode='cart';render();toast(miss?'بعض المنتجات لم تعد متاحة':'تمت إضافة الطلب للسلة')}
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
  D.notice=D.notice||'';D.hours=D.hours||'';D.theme=D.theme||0;D.cats=D.cats||[];
  document.title=D.name;applyTheme();render();
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
})();
