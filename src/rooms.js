/* Gemeinsame Zimmer-Daten für die Seiten Zimmer und Haus: Lampen, Geräte, Heizung, Melder, Fenster, Türen, Möbel.
 * Wird von build.py an der Markierung ROOMS_JS eingesetzt; braucht PLAN/ROOMS aus common.js. */
/* ================= Zimmer-Konfiguration (Werte vom 21.10. als Start) ================= */
const ZC={
 leo:{n:'Leo',h:['Leos','Zimmer.'],eb:'Dachgeschoss · Familie',scenes:1,disco:1,
   lights:[{id:'spots',type:'spots',n:'Spots',dp:'hue.0.Leo',cmd:'hue',dim:1,on:true,bri:8,col:'#ffb45e',sw:'huecol',each:['Vorne Links','Vorne Rechts','Hinten Links','Hinten Rechts'],note:'4 Gledopto-Spots GL-D-004ZS über Hue, einzeln z. B. hue.0.Leo_Vorne_Links'},
     {id:'plane',type:'plane',n:'Flugzeug',dp:'hue.0.Leo_Flugzeug',cmd:'hueLevel',on:true,col:'#ffd59a',sw:'plane'}],
   T:{kind:'fritz',n:'Heizkörper Leo',dp:'fritzdect.0.DECT_881674352572',ist:22.5,soll:23,batt:40,wall:'w',t:.84},
   P:[{n:'Leo 1',dp:'zigbee.0.00158dbfa93d3f2e',at:[.06,.08],last:38},{n:'Leo 2',dp:'zigbee.0.00158d78c41a3948',at:[.94,.92],last:52}],
   devs:[{id:'cube',type:'cube',n:'Würfel Leo',dp:'zigbee.0.00158d4eecb7e3c7',st:'Aqara-Würfel · steuert das Licht (Script Leo_Wuerfel)'}],
   win:{wall:'w',t:.5,door:1},furn:[{type:'bed',u:.6,v:.72,w:2.0,d:.95},{type:'desk',wall:'n',t:.3}],note:'Bewegung schaltet das Licht (Script Leo_Wuerfel).'},
 mia:{n:'Mia',h:['Mias','Zimmer.'],eb:'Dachgeschoss · Familie',scenes:1,
   lights:[{id:'spots',type:'spots',n:'Spots',dp:'hue.0.Mia',cmd:'hue',dim:1,on:false,bri:60,col:'#ffcf8a',sw:'huecol',each:['Vorne Links','Vorne Rechts','Hinten Links','Hinten Rechts'],note:'4 Gledopto-Spots GL-D-004ZS über Hue, einzeln z. B. hue.0.Mia_Vorne_Links'},
     {id:'pend',type:'pendant',n:'Pendelleuchte',dp:'yeelight-2.0.color4-0x2221ea97d40a0bd4',cmd:'yeelight',on:true,col:'#ff9fc0',sw:'pendant'}],
   T:{kind:'fritz',n:'Heizkörper Mia',dp:'fritzdect.0.DECT_876808579017',ist:23,soll:23,batt:40,wall:'w',t:.4},
   P:[{n:'Mia 1',dp:'zigbee.0.00158dfc94f7de82',at:[.06,.08],last:12},{n:'Mia 2',dp:'zigbee.0.00158d3895d4244a',at:[.94,.9],last:95}],
   devs:[{id:'cube',type:'cube',n:'Würfel Mia',dp:'zigbee.0.00158d94986e2a2b',st:'Aqara-Würfel · steuert das Licht (Script Mia_Wuerfel)'}],
   win:{wall:'w',t:.4},furn:[{type:'bed',u:.55,v:.8,w:2.0,d:.95},{type:'desk',wall:'n',t:.25}],note:'Bewegung schaltet das Licht (Script Mia_Wuerfel).'},
 buero:{n:'Büro',h:['Das','Büro.'],eb:'Dachgeschoss · Familie',
   lights:[{id:'ledb',type:'strip',n:'LED Büro',dp:'hue.0.LED_Büro_Color',cmd:'hue',dim:1,sw:'huecol',on:false,bri:60,col:'#ffcf8a',wall:'s',from:.05,to:.95,z:2.35,free:1,u:.5,v:.5,axis:'x',note:'Farbe über LED_Büro_Color, Weiß über LED_Büro_WW (Hue-Gruppe Büro)'},
     {id:'ledc',type:'strip',n:'LED Computertisch',dp:'hue.0.LED_Computertisch_Color',cmd:'hue',dim:1,sw:'huecol',on:true,bri:50,col:'#8fb8ff',wall:'e',from:.3,to:.7,z:.72}],
   T:{kind:'fritz',n:'FRITZ!Smart Büro',dp:'fritzdect.0.DECT_078253581902',ist:23,soll:23,batt:20,wall:'n',t:.55},
   P:[{n:'Büro',dp:'zigbee.0.00158d302f4ed7c0',at:[.92,.9],last:4,off:1}],
   devs:[{id:'dfk',type:'contact',n:'Dachfenster',dp:'zigbee.0.00158db1c0a5ee92.contact',st:'Aqara-Kontakt · zu'}],
   win:{wall:'w',t:.5,door:1},furn:[{type:'desk',wall:'e',t:.5}],note:'Im Büro schaltet der Melder noch nichts.'},
 kochen_h:{n:'Küche',h:['Unsere','Küche.'],eb:'Erdgeschoss · Familie',
   lights:[{id:'decke',type:'ceiling',n:'Küche Licht',dp:'shelly.0.SHSW-25#421DC5EC0DB4#1.Relay0.Switch',cmd:'switch',on:true,col:'#ffe2b8',u:.55,v:.5},
     {id:'wled',type:'strip',n:'Küche WLED',dp:'wled.0.a8c77c901dbd',cmd:'switch',on:false,col:'#ffb45e',wall:'w',from:.08,to:.92,z:1.45,note:'WLED-Controller „WLED-Kueche“; Strom über Shelly Küche Licht Kanal 1 (Relay1), der muss an sein'}],
   devs:[{id:'spuel',type:'dish',n:'Spülmaschine',dp:'homeconnect.0.012009383294292389',st:'Eco 50 · läuft',on:true,wall:'w',t:.68},
     {id:'echo',type:'echo',n:'Echo Küche',dp:'alexa2.0.Echo-Devices.G0RJ59EB7RV83LRC',st:'Lautstärke 40',on:false,wall:'w',t:.3},
     {id:'roll',type:'shutter',n:'Rollladen Küche',dp:'shelly.0.SHSW-25#4EA6A1774B08#1.Shutter.Position',st:'',pos:100},
     {id:'dtk',type:'none',n:'Doppeltaster Küche',dp:'shelly.0.SHSW-25#3455031A6AA4#1',st:'Shelly 2.5 · offline seit ca. 6 Monaten, zuletzt 79 °C',off:true}],
   T:{kind:'alpha2',n:'Fußbodenheizung Küche',dp:'alpha2.0.HEATAREA.2',zone:2,ist:22.2,soll:22.6,actor:true},P:[],
   win:{wall:'s',t:.35},furn:[{type:'counter',wall:'w',from:0,to:1,d:.62,upper:1},{type:'counter',wall:'n',from:0,to:.42,d:.62},{type:'table',u:.64,v:.62,w:1.3,d:.85,chairs:4}]},
 wohnen_h:{n:'Wohnzimmer',h:['Unser','Wohnzimmer.'],eb:'Erdgeschoss · Familie',
   lights:[{id:'tv',type:'strip',n:'TV Licht',dp:'shelly.0.SHSW-25#323E6F5C8B8A#1.Relay0.Switch',cmd:'switch',on:false,col:'#9cc8ff',wall:'e',from:.12,to:.42,z:1.0,note:'Shelly „Wohnzimmer Licht“, Kanal 0'},
     {id:'ess',type:'ceiling',n:'Licht Esstisch',dp:'shelly.0.SHSW-25#9E1080212AE7#1',cmd:'switch',on:false,col:'#ffe2b8',u:.16,v:.76,note:'Shelly „Doppeltaster Licht Esstisch“ · Kanal bitte prüfen'},
     {id:'steh',type:'floorlamp',n:'Stehlampe',dp:'hue.0.Stehlampe',cmd:'hue',dim:1,on:true,bri:70,col:'#ffcf8a',sw:'huecol',u:.32,v:.07,note:'Hue-Farbbirne · Strom über Shelly „Stehlampe Wohnzimmer“ (Kanal 1), der muss an sein'}],
   devs:[{id:'fan',type:'fan',n:'Lüfter Ambientika',dp:'suedwind-ambientika.0.BDB8947CAB05',st:'Stufe 2 · 52 % rF',on:true,wall:'n',t:.88,z:2.0},
     {id:'fk',type:'contact',n:'Fensterkontakte (3)',dp:'zigbee.0.00158d30f1c32d9d / …2768e2f / …c2acb3e / …157b16b',st:'Aqara-Kontakte · alle zu · 3 der 4 Kontakte ohne Namen sitzen hier'},
     {id:'tree',type:'none',n:'Außensteckdose „PlugS Schwarze“',dp:'shelly.1.shellyplugsg3#c65bcd23ff3a#1',st:'Sommer Pumpe, Winter Tannenbaum · offline seit 03.10.',off:true}],
   T:{kind:'alpha2',n:'Fußbodenheizung Wohnzimmer',dp:'alpha2.0.HEATAREA.1',zone:1,ist:22.3,soll:22.6,actor:true},P:[],
   win:{wall:'n',t:.78,door:1},furn:[{type:'sofa',u0:.3,u1:.62,v0:.04,v1:.3},{type:'coffee',u:.47,v:.2,w:1.0,d:.55},{type:'tv',wall:'e',from:.12,to:.42},{type:'table',u:.16,v:.76,w:1.7,d:.9,chairs:6}]},
 kochen_o:{n:'Küche',h:['Opas','Küche.'],eb:'Erdgeschoss · Opa',lights:[],
   devs:[{id:'spuel',type:'dish',n:'Spülmaschine Opa',dp:'homeconnect.0.012036216308552518',st:'nicht mit Home Connect verbunden',off:true,wall:'e',t:.6}],
   T:{kind:'alpha2',n:'Fußbodenheizung Küche',dp:'alpha2.0.HEATAREA.4',zone:4,ist:22.2,soll:22.5,actor:false,bug:'Der Alias für den Sollwert zeigt auf den Istwert (T_ACTUAL statt T_TARGET). Ein neuer Sollwert über den Alias kommt nicht an.'},P:[],
   win:{wall:'e',t:.5},furn:[{type:'counter',wall:'e',from:.0,to:1,d:.62,upper:1},{type:'counter',wall:'n',from:.45,to:1,d:.62},{type:'table',u:.33,v:.55,w:1.0,d:.8,chairs:3}]},
 wohnen_o:{n:'Wohnzimmer',h:['Opas','Wohnzimmer.'],eb:'Erdgeschoss · Opa',lights:[],
   devs:[{id:'echo',type:'echo',n:'Echo Opa',dp:'alexa2.1.Echo-Devices.G0N9KPF7GM177HYX',st:'Lautstärke 40',on:false,wall:'e',t:.5}],
   T:{kind:'alpha2',n:'Fußbodenheizung Wohnzimmer',dp:'alpha2.0.HEATAREA.5',zone:5,ist:22.2,soll:23,actor:true},P:[],
   win:{wall:'n',t:.4,door:1},furn:[{type:'sofa',u0:.06,u1:.5,v0:.05,v1:.32},{type:'coffee',u:.3,v:.35,w:.9,d:.5},{type:'table',u:.55,v:.8,w:1.4,d:.85,chairs:4},{type:'counter',wall:'e',from:.3,to:.7,d:.45}]}};
/* Form des Holzflugzeugs bei Leo (Draufsicht, Meter) */
const RPLANE=[[0,-.86],[.05,-.8],[.06,-.62],[.06,-.18],[.82,.12],[.82,.2],[.06,.02],[.06,.5],[.27,.64],[.27,.7],[.03,.66],[.02,.8],[-.02,.8],[-.03,.66],[-.27,.7],[-.27,.64],[-.06,.5],[-.06,.02],[-.82,.2],[-.82,.12],[-.06,-.18],[-.06,-.62],[-.05,-.8]];

/* ================= Einrichtung: Positionen je Zimmer im Browser speichern ================= */
const LKEY='glashaus.zimmer.layout',LFIELDS=['pos','u','v','rot','wall','from','to','z','free','axis'];
function defaultDoor(id){const r=ROOMS[id];if(!r)return{wall:'s',t:.2,flip:0};
  const bb=p=>{const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);return[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};
  const[x0,y0,x1,y1]=bb(r.p),halls=PLAN[r.f].rooms.filter(h=>/^(flur|diele)/.test(h.id)&&h.id!==id);let best=null,bd=1e9;
  for(const h of halls){const b=bb(h.p),d=Math.hypot(Math.max(0,b[0]-x1,x0-b[2]),Math.max(0,b[1]-y1,y0-b[3]));if(d<bd){bd=d;best=b}}
  if(!best)return{wall:'s',t:.2,flip:0};
  const[a0,b0,a1,b1]=best,hx=(a0+a1)/2,hy=(b0+b1)/2;let wall;
  if(a1<=x0+.05)wall='w';else if(a0>=x1-.05)wall='e';else if(b1<=y0+.05)wall='n';else if(b0>=y1-.05)wall='s';
  else wall=Math.abs(hx-(x0+x1)/2)/(x1-x0)>Math.abs(hy-(y0+y1)/2)/(y1-y0)?(hx<(x0+x1)/2?'w':'e'):(hy<(y0+y1)/2?'n':'s');
  let t;if(wall==='w'||wall==='e'){const lo=Math.max(y0,b0),hi=Math.min(y1,b1);t=((lo<hi?(lo+hi)/2:hy)-y0)/(y1-y0)}else{const lo=Math.max(x0,a0),hi=Math.min(x1,a1);t=((lo<hi?(lo+hi)/2:hx)-x0)/(x1-x0)}
  return{wall,t:Math.max(.15,Math.min(.85,t)),flip:0}}
const FDEF={bed:[.95,2.0],desk:[1.2,.65],table:[1.4,.85],sofa:[2.2,1.8],sessel:[.85,.8],coffee:[1.0,.55],tv:[1.6,.42],counter:[2.4,.62],schrank:[1.5,.6],regal:[1.0,.35],kommode:[1.0,.45]};
const QW={n:0,e:1,s:2,w:3};
function normFurn(id,fu){if(fu.W!=null)return fu;const r=ROOMS[id],xs=r.p.map(q=>q[0]),ys=r.p.map(q=>q[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),Lx=x1-x0,Ly=y1-y0;
  const toUV=(x,y)=>({u:(x-x0)/Lx,v:(y-y0)/Ly}),wp=(w,t)=>w==='w'?[x0,y0+Ly*t]:w==='e'?[x1,y0+Ly*t]:w==='n'?[x0+Lx*t,y0]:[x0+Lx*t,y1];
  const inw={w:[1,0],e:[-1,0],n:[0,1],s:[0,-1]},T=fu.type,o={type:T},dd=FDEF[T]||[1,1];if(fu.upper)o.upper=1;if(fu.chairs)o.chairs=fu.chairs;
  if(T==='bed')Object.assign(o,{u:fu.u,v:fu.v,W:Math.min(fu.w,fu.d),D:Math.max(fu.w,fu.d),q:fu.w>=fu.d?3:0});
  else if(T==='table'||T==='coffee')Object.assign(o,{u:fu.u,v:fu.v,W:fu.w,D:fu.d,q:0});
  else if(T==='sofa'&&fu.u0!=null){const a0=x0+Lx*fu.u0,a1=x0+Lx*fu.u1,b0=y0+Ly*fu.v0,b1=y0+Ly*fu.v1,W=a1-a0,D=b1+.6-b0;Object.assign(o,toUV(a0+W/2,b0+D/2),{W,D,q:0})}
  else if(fu.wall){const[i0,i1]=inw[fu.wall],len=fu.t!=null?dd[0]:(fu.to-fu.from)*(fu.wall==='n'||fu.wall==='s'?Lx:Ly),D=fu.t!=null?dd[1]:(fu.d||dd[1]),t=fu.t!=null?fu.t:(fu.from+fu.to)/2,[px,py]=wp(fu.wall,t);
    Object.assign(o,toUV(px+i0*D/2,py+i1*D/2),{W:len,D,q:QW[fu.wall]})}
  else Object.assign(o,{u:fu.u??.5,v:fu.v??.5,W:dd[0],D:dd[1],q:0});
  return o}
for(const[id,c]of Object.entries(ZC))c.furn=(c.furn||[]).map(f=>normFurn(id,f));
for(const[id,c]of Object.entries(ZC)){if(!c.wins)c.wins=c.win?[c.win]:[];delete c.win;if(!c.doors)c.doors=[defaultDoor(id)]}
const ZDEF=JSON.parse(JSON.stringify(ZC));
const layoutOf=id=>{const c=ZC[id];return{wins:c.wins,doors:c.doors,pir:c.P.map(q=>q.at),rad:c.T.kind==='fritz'?{wall:c.T.wall,t:c.T.t}:undefined,furn:c.furn||[],lights:Object.fromEntries(c.lights.map(l=>[l.id,Object.fromEntries(LFIELDS.filter(k=>l[k]!==undefined).map(k=>[k,l[k]]))]))}};
function readLayouts(){try{return JSON.parse(localStorage.getItem(LKEY)||'{}')}catch(e){return{}}}
function saveLayout(id){try{const all=readLayouts();all[id]=layoutOf(id);localStorage.setItem(LKEY,JSON.stringify(all))}catch(e){}}
function resetLayout(id){const d=ZDEF[id];ZC[id].wins=JSON.parse(JSON.stringify(d.wins));ZC[id].doors=JSON.parse(JSON.stringify(d.doors));ZC[id].furn=JSON.parse(JSON.stringify(d.furn||[]));ZC[id].P.forEach((q,i)=>q.at=d.P[i].at.slice());if(d.T.kind==='fritz'){ZC[id].T.wall=d.T.wall;ZC[id].T.t=d.T.t}
  ZC[id].lights.forEach(l=>{const o=d.lights.find(x=>x.id===l.id);LFIELDS.forEach(k=>{if(o&&o[k]!==undefined)l[k]=JSON.parse(JSON.stringify(o[k]));else delete l[k]})});
  try{const all=readLayouts();delete all[id];localStorage.setItem(LKEY,JSON.stringify(all))}catch(e){}}
(function(){for(const[id,L]of Object.entries(readLayouts())){const c=ZC[id];if(!c)continue;if(Array.isArray(L.wins))c.wins=L.wins;else if(L.win&&L.win.wall&&c.wins[0])c.wins[0]={...c.wins[0],...L.win};if(Array.isArray(L.doors))c.doors=L.doors;if(Array.isArray(L.furn))c.furn=L.furn.map(f=>normFurn(id,f));if(Array.isArray(L.pir)&&L.pir.length===c.P.length)L.pir.forEach((a,i)=>{if(Array.isArray(a))c.P[i].at=a});if(L.rad&&c.T.kind==='fritz'){c.T.wall=L.rad.wall;c.T.t=L.rad.t}
  c.lights.forEach(l=>{const o=L.lights&&L.lights[l.id];if(o)LFIELDS.forEach(k=>{if(o[k]!==undefined)l[k]=o[k]})})}})();

