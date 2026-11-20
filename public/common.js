// دوال مشتركة بين صفحة المتجر ولوحة التحكم
let D=null;
const TH=[
{n:'زمرد ملكي',pr:'#0f6b5c',pr2:'#07423a',ac:'#c9a04a',l:{bg:'#f4efe4',card:'#fffdf8',tx:'#12231f',mu:'#6f7c74',ph:'#ebe5d5',bd:'#e3dbc6'},d:{bg:'#0b1512',card:'#13211d',tx:'#eef2ee',mu:'#93a29a',ph:'#1b2c27',bd:'#243630',pr:'#2fb59b',pr2:'#0f6b5c',ac:'#d8b45f'}},
{n:'عنابي وذهبي',pr:'#8a2346',pr2:'#521128',ac:'#c9a04a',l:{bg:'#f7f0ea',card:'#fffcf9',tx:'#2a1419',mu:'#8a7378',ph:'#f0e4de',bd:'#e8d8d0'},d:{bg:'#160b0f',card:'#21121a',tx:'#f6eef0',mu:'#b39ba3',ph:'#2d1a22',bd:'#3a232d',pr:'#d0587f',pr2:'#8a2346',ac:'#dcb862'}},
{n:'بترولي ونحاسي',pr:'#155b6e',pr2:'#0a3441',ac:'#c9733b',l:{bg:'#f2eee7',card:'#fffefb',tx:'#122229',mu:'#6c7b80',ph:'#e8e4da',bd:'#ded8cb'},d:{bg:'#08151a',card:'#0f232b',tx:'#ecf3f5',mu:'#8fa5ac',ph:'#173039',bd:'#1f3b45',pr:'#3fb0cb',pr2:'#155b6e',ac:'#e08a52'}},
{n:'زيتي وكهرماني',pr:'#5c6b2a',pr2:'#38421a',ac:'#c0761f',l:{bg:'#f4efe0',card:'#fffdf5',tx:'#222616',mu:'#7a7f66',ph:'#ebe5cf',bd:'#e2dbc0'},d:{bg:'#12140a',card:'#1c2011',tx:'#f1f2e6',mu:'#a3a88a',ph:'#262b17',bd:'#30361d',pr:'#a3b94e',pr2:'#5c6b2a',ac:'#dd953f'}},
{n:'بنفسجي ووردي ذهبي',pr:'#52306b',pr2:'#2f1a42',ac:'#d4a088',l:{bg:'#f6f1f3',card:'#fffcfd',tx:'#20142a',mu:'#7b6f85',ph:'#ece4ee',bd:'#e3d8e6'},d:{bg:'#120c18',card:'#1c1326',tx:'#f2eef6',mu:'#a79bb4',ph:'#271b33',bd:'#33243f',pr:'#a97ad0',pr2:'#52306b',ac:'#e2b49c'}},
{n:'ألوان الشعار',pr:'#1d3f9e',pr2:'#0f2a75',ac:'#f5b800',l:{bg:'#f3f5fb',card:'#ffffff',tx:'#0f1a3a',mu:'#66708f',ph:'#e8ecf6',bd:'#dde2f0'},d:{bg:'#0a1020',card:'#111a33',tx:'#eef1fb',mu:'#98a3c4',ph:'#18244a',bd:'#22305c',pr:'#5b86f0',pr2:'#1d3f9e',ac:'#ffc933'}}];
const MQ=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):{matches:false,addEventListener(){}};
function applyTheme(){const t=TH[D.theme]||TH[0],k=MQ.matches?{...t.l,...t.d,on:t.d.bg}:{...t.l,pr:t.pr,pr2:t.pr2,ac:t.ac,on:'#fff'},r=document.documentElement.style;for(const[a,b]of Object.entries(k))r.setProperty('--'+a,b);const m=document.querySelector('meta[name=theme-color]');if(m)m.content=k.bg}
MQ.addEventListener('change',applyTheme);
const IC={menu:'<path d="M4 7h16M4 12h16M4 17h10"/>',
cart:'<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2 3h3l2.7 11.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6"/>',
box:'<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3.3 7.5L12 12.5l8.7-5M12 22V12.5"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
home:'<path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6"/>',
search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
tune:'<path d="M4 6h9m4 0h3M4 12h3m4 0h9M4 18h11m4 0h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
store:'<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 12v8h14v-8"/>',
repeat:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
truck:'<path d="M1 6h13v10H1z"/><path d="M14 9h4l3 3v4h-7"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
img:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/>',
back:'<path d="M9 6l6 6-6 6"/>',
tag:'<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
download:'<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3"/>',
x:'<path d="M6 6l12 12M18 6L6 18"/>',
send:'<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>'};
const svg=(n,s=20,w=1.8)=>'<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round">'+IC[n]+'</svg>';
const ic=(n,s=20)=>{const e=document.createElement('span');e.className='i';e.innerHTML=svg(n,s);return e};
function h(t,a={},...k){const e=document.createElement(t);for(const[x,v]of Object.entries(a)){if(x==='on'){for(const[n,f]of Object.entries(v))e.addEventListener(n,f)}else if(x==='cls')e.className=v;else e[x]=v}k.flat().forEach(c=>e.append(c));return e}
const logo=()=>h('span',{cls:'logo',style:'background:none;overflow:hidden'},h('img',{src:'/icon-192.png',alt:'',style:'width:100%;height:100%;object-fit:cover'}));
function pic(p){const d=h('div',{cls:'im'});const ph=()=>{d.replaceChildren();d.innerHTML=svg('img',48,1.3)};if(p.i){const m=h('img',{src:'/uploads/'+p.i,alt:p.n,loading:'lazy'});m.onerror=ph;d.append(m)}else ph();return d}
function toast(m){const t=h('div',{cls:'toast',textContent:m});document.body.append(t);setTimeout(()=>t.remove(),2200)}
