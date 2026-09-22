const $ = (s) => document.querySelector(s);
const app = $('#app');

const defaultState = {
  day: 7, money: 340, rep: 17, intel: 4, ap: 6,
  screen: 'network', clues: [], completed: [], recruited: ['mara','jax'],
  relationships: {mara:2,jax:1,sol:0}, upgrades: [],
  combat: null, log: ['The network is quiet. That usually means something is about to happen.'],
  theory: null
};
let state = load();

const people = {
  mara:{name:'Mara Vale', role:'The Face', initial:'MV', trust:72, charm:86, intel:54, combat:42, text:'Reads rooms before rooms read her. Opens doors that should stay closed.'},
  jax:{name:'Jax Mercer', role:'The Runner', initial:'JM', trust:58, charm:41, intel:63, combat:71, text:'Fast, fearless, and almost impossible to pin down.'},
  sol:{name:'Sol Reyes', role:'The Scholar', initial:'SR', trust:36, charm:62, intel:91, combat:29, text:'Collects patterns, debts, and facts. Knows why things happen.'}
};
const clues = [
  {id:'gate',title:'Gate 3',text:'Every missing crate entered through Gate 3. The other gates are untouched.'},
  {id:'shift',title:'The 11:00 Shift',text:'A guard rotation leaves Gate 3 with only one watcher for roughly eight minutes.'},
  {id:'ledger',title:'The Ledger',text:'A dock ledger has one payment circled in red: 80 crowns to a guard named Venn.'},
  {id:'merchant',title:'The Merchant',text:'Merchant Corvin has filed the missing-shipment reports himself. He is unusually eager to help.'},
  {id:'runner',title:'A Familiar Runner',text:'A runner has been seen leaving the east quay with sealed manifests after midnight.'},
  {id:'warehouse',title:'Warehouse 9',text:'The missing crates are being staged in Warehouse 9 before they leave the district.'}
];
const cards = [
  {id:'strike',name:'STRIKE',cost:1,desc:'Deal 8 damage.',effect:'damage',value:8},
  {id:'feint',name:'FEINT',cost:1,desc:'Deal 4 damage. Gain 1 Flow.',effect:'flow',value:4},
  {id:'vault',name:'VAULT',cost:1,desc:'Deal 5 damage and evade the next hit.',effect:'evade',value:5},
  {id:'counter',name:'COUNTER',cost:2,desc:'Deal 12 damage. Only works if enemy attacks.',effect:'counter',value:12},
  {id:'disarm',name:'DISARM',cost:2,desc:'Deal 7 damage and weaken enemy.',effect:'weaken',value:7},
  {id:'escape',name:'ESCAPE',cost:2,desc:'End combat safely. Gain +2 Rep.',effect:'escape',value:2}
];

function load(){try{return {...defaultState,...JSON.parse(localStorage.getItem('youngLegendSave')||'{}')}}catch{return {...defaultState}}}
function save(){localStorage.setItem('youngLegendSave',JSON.stringify(state))}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function log(msg){state.log.unshift(msg);state.log=state.log.slice(0,8);save()}
function stat(label,value,delta=''){return `<div class="card stat"><div class="label">${label}</div><div class="value">${value}</div><div class="delta">${delta}</div></div>`}
function header(title,sub,actions=''){return `<div class="hero"><div><div class="eyebrow">Young Legend / ${state.day < 10 ? '0'+state.day:state.day}</div><h1 class="title">${title}</h1><p class="subtitle">${sub}</p></div><div class="actions">${actions}</div></div>`}
function btn(label,fn,primary=false){return `<button class="btn ${primary?'primary':''}" onclick="${fn}">${label}</button>`}

function shell(content){
  app.innerHTML=`<div class="shell"><aside class="sidebar"><div class="mark">YL</div><nav class="nav">
    <button class="${state.screen==='network'?'active':''}" onclick="go('network')">◆ &nbsp; Network</button>
    <button class="${state.screen==='investigate'?'active':''}" onclick="go('investigate')">⌕ &nbsp; Investigate</button>
    <button class="${state.screen==='operation'?'active':''}" onclick="go('operation')">◇ &nbsp; Operations</button>
    <button class="${state.screen==='progress'?'active':''}" onclick="go('progress')">↗ &nbsp; Progress</button>
  </nav><div class="sidebar-foot">BUILD THE NETWORK.<br>READ THE ROOM.<br>BE REMEMBERED.</div></aside>
  <header class="top"><div class="brand"><small>SLU / CHARACTER RPG</small>YOUNG LEGEND</div><div class="top-meta"><div class="pill">◈ <b>${state.money}</b> crowns</div><div class="pill">◆ <b>${state.rep}</b> legend</div><div class="pill">⌁ <b>${state.intel}</b> intel</div><div class="pill">AP <b>${state.ap}/6</b></div></div></header>
  <main class="main">${content}</main></div>`;
}

function network(){
  const cardsPeople=Object.values(people).map(p=>{const r=state.relationships[p.id]||0;return `<div class="person" onclick="person('${Object.keys(people).find(k=>people[k]===p)}')"><div class="portrait">${p.initial}</div><div class="person-name">${p.name}</div><div class="person-role">${p.role} · Bond ${r}</div><div class="bars"><div class="barrow"><span>TRUST</span><div class="bar"><i style="width:${p.trust+r*5}%"></i></div><b>${Math.min(99,p.trust+r*5)}</b></div><div class="barrow"><span>SKILL</span><div class="bar"><i style="width:${p.intel}%"></i></div><b>${p.intel}</b></div></div></div>`}).join('');
  const missionDone=state.completed.includes('shipment');
  shell(header('The Network','You are no longer trying to become powerful. You are learning how power actually moves.',btn('NEW DAY','newDay()',true))+`<div class="grid stats">${stat('MONEY',state.money,'+ operational income')}${stat('LEGEND',state.rep,'reputation in the district')}${stat('INTEL',state.intel,'actionable knowledge')}${stat('ACTION',state.ap,'remaining today')}${stat('NETWORK',state.recruited.length,'active connections')}</div>
  <div class="grid cols"><section class="card section"><div class="section-head"><div><div class="section-title">People worth knowing</div><div class="section-note">Relationships unlock methods, cards and information.</div></div>${btn('RECRUIT','recruit()')}</div><div class="people">${cardsPeople}</div></section>
  <section class="card section"><div class="section-head"><div><div class="section-title">Active lead</div><div class="section-note">The city is talking.</div></div></div>${missionDone?`<div class="mission"><div class="mission-icon">✓</div><div><h3>THE SHIPMENT</h3><p>Resolved. The network has a new foothold.</p></div></div>`:`<div class="mission"><div class="mission-icon">?</div><div><h3>THE MISSING SHIPMENT</h3><p>Someone is moving valuable cargo through Gate 3. Find out who is behind it.</p></div><div class="go">${btn('INVESTIGATE','go(\'investigate\')',true)}</div></div>`}<div style="height:15px"></div><div class="section-title">Recent word</div><div class="log">${state.log.map((x,i)=>`<div class="logline"><span>${i?'NOTE':'NOW'}</span>${esc(x)}</div>`).join('')}</div></section></div>`);
}

function investigate(){
  shell(header('Read the Room','Build the truth from fragments. You do not need every clue — you need the right ones.',btn('BACK','go(\'network\')'))+`<div class="grid cols"><section class="card section"><div class="section-head"><div><div class="section-title">Evidence board</div><div class="section-note">Found ${state.clues.length}/6 clues.</div></div>${state.clues.length>=3?btn('FORM THEORY','formTheory()',true):''}</div><div class="clues">${clues.map(c=>`<div class="clue ${state.clues.includes(c.id)?'found':''}" onclick="findClue('${c.id}')"><b>${state.clues.includes(c.id)?'✓ ':''}${c.title}</b><p>${state.clues.includes(c.id)?c.text:'Search this lead to uncover what it knows.'}</p></div>`).join('')}</div></section>
  <section class="card section"><div class="section-title">Suspects & pressure</div><div class="section-note" style="margin:6px 0 15px">Use your network to change the quality of the investigation.</div><div class="suspects"><div class="suspect"><div><b>Corvin Vale</b><div class="muted">Merchant / filed the report</div></div><span class="tag">interesting</span></div><div class="suspect"><div><b>Venn</b><div class="muted">Gate 3 guard / paid recently</div></div><span class="tag">leverage</span></div><div class="suspect"><div><b>Unknown Runner</b><div class="muted">East quay / manifests</div></div><span class="tag">unseen</span></div></div><div style="margin-top:18px">${btn('ASK MARA','askNetwork(\'mara\')')} ${btn('ASK JAX','askNetwork(\'jax\')')} ${btn('ASK SOL','askNetwork(\'sol\')')}</div></section></div>`);
}

function operation(){
  shell(header('The Operation','You have enough information to act. Choose how the legend begins.',btn('BACK','go(\'network\')'))+`<div class="op-grid"><section class="card section"><div class="section-title">Warehouse 9 / 23:00</div><p class="subtitle">The missing crates are staged here. Your theory points to Corvin using Venn and the shift gap to move them.</p><div class="approaches" style="margin-top:18px"><button class="approach" onclick="startCombat('ghost')"><span class="risk">LOW RISK</span><b>THE GHOST</b><small>Use Jax to slip through the service route. You arrive unseen and start with Flow.</small></button><button class="approach" onclick="startCombat('face')"><span class="risk">SOCIAL</span><b>THE FACE</b><small>Let Mara walk you through the front. If it fails, the room turns hostile.</small></button><button class="approach" onclick="startCombat('force')"><span class="risk">HIGH RISK</span><b>THE STATEMENT</b><small>Walk in openly. Start with momentum, but alert everyone nearby.</small></button><button class="approach" onclick="completeQuiet()"><span class="risk">NETWORK</span><b>THE LEVER</b><small>Use your evidence to turn Venn. Resolve the operation without combat.</small></button></div></section><aside class="card section"><div class="section-title">Your theory</div><div class="section-note" style="margin-top:5px">${esc(state.theory||'No theory formed yet.')}</div><div style="height:18px"></div><div class="section-title">Network advantage</div><p class="muted">${state.recruited.includes('sol')?'Sol can reveal hidden connections.':'Recruit Sol to deepen investigation.'}</p></aside></div>`);
}

function progress(){
  const ups=[['silver-tongue','SILVER TONGUE','Social approaches gain +1 Influence.'],['clean-footwork','CLEAN FOOTWORK','Start combat with +1 Flow when entering unseen.'],['deep-cuts','DEEP CUTS','STRIKE deals +3 damage.'],['street-network','STREET NETWORK','Gain +25 crowns at the start of each new day.']];
  shell(header('Become Someone','Your build is not a class. It is the pattern of choices you keep making.',btn('RESET SAVE','resetGame()'))+`<div class="grid cols"><section class="card section"><div class="section-title">Legend traits</div><p class="muted">${traitSummary()}</p><div class="choice-list">${ups.map(u=>`<button class="choice" onclick="buy('${u[0]}')" ${state.upgrades.includes(u[0])?'disabled':''}><b>${state.upgrades.includes(u[0])?'✓ ':''}${u[1]}</b><small>${u[2]}</small><span class="tag" style="float:right">${state.upgrades.includes(u[0])?'OWNED':'50 LEGEND'}</span></button>`).join('')}</div></section><section class="card section"><div class="section-title">The life so far</div><div class="log">${state.log.map(x=>`<div class="logline"><span>LOG</span>${esc(x)}</div>`).join('')}</div></section></div>`);
}
function traitSummary(){if(state.upgrades.length===0)return 'No reputation has hardened into a style yet. The next few choices will define you.';return state.upgrades.map(x=>x.replaceAll('-',' ').toUpperCase()).join(' · ')}

function go(s){state.screen=s;state.combat=null;save();render()}
function render(){if(state.combat)return combat();if(state.screen==='investigate')investigate();else if(state.screen==='operation')operation();else if(state.screen==='progress')progress();else network()}
function findClue(id){if(state.clues.includes(id)){toast('Already understood.');return}if(state.ap<=0){toast('No actions left today.');return}state.ap--;state.clues.push(id);state.intel++;log(`Discovered: ${clues.find(c=>c.id===id).title}.`);save();render()}
function askNetwork(id){if(!state.recruited.includes(id)&&id!=='sol'){toast('They are not in the network.');return}if(state.ap<=0){toast('No actions left today.');return}state.ap--;if(id==='mara'){if(!state.clues.includes('merchant'))state.clues.push('merchant');log('Mara notices Corvin is performing innocence too carefully.');}if(id==='jax'){if(!state.clues.includes('runner'))state.clues.push('runner');log('Jax spotted the same runner twice near Warehouse 9.');}if(id==='sol'){if(!state.clues.includes('warehouse'))state.clues.push('warehouse');log('Sol maps the manifests to Warehouse 9.');}state.relationships[id]=(state.relationships[id]||0)+1;state.intel++;save();render()}
function formTheory(){if(state.clues.length<3)return;state.theory='Corvin is staging the missing shipments at Warehouse 9, using Venn and the 11 PM shift gap to move them out.';state.rep+=3;state.ap=Math.max(0,state.ap-1);log('Theory formed: Corvin + Venn + Warehouse 9. The network believes you.');state.screen='operation';save();render();}
function recruit(){if(state.recruited.includes('sol')){toast('Everyone available is already connected.');return}if(state.money<120){toast('You need 120 crowns to make the introduction.');return}state.money-=120;state.recruited.push('sol');state.relationships.sol=1;log('Sol Reyes joined the network.');save();render()}
function person(id){const p=people[id];const r=state.relationships[id]||0;modal(`<div class="modal-head"><div><div class="eyebrow">NETWORK MEMBER</div><h2>${p.name}</h2></div><button class="close" onclick="closeModal()">×</button></div><p class="muted">${p.text}</p><div class="choice-list"><div class="choice"><b>${p.role}</b><small>Trust ${p.trust+r*5} · Bond ${r} · Core skill ${Math.max(p.charm,p.intel,p.combat)}</small></div><button class="choice" onclick="closeModal();askNetwork('${id}')"><b>ASK FOR HELP</b><small>Spend 1 action to reveal or create useful information.</small></button></div>`)}
function modal(inner){const d=document.createElement('div');d.className='modal';d.id='modal';d.innerHTML=`<div class="modal-box">${inner}</div>`;document.body.appendChild(d)}
function closeModal(){$('#modal')?.remove()}
function newDay(){state.day++;state.ap=6;if(state.upgrades.includes('street-network'))state.money+=25;log(`Day ${state.day}. The network wakes up.`);save();render()}
function resetGame(){localStorage.removeItem('youngLegendSave');state={...defaultState,clues:[],completed:[],recruited:['mara','jax'],relationships:{mara:2,jax:1,sol:0},upgrades:[],log:defaultState.log.slice()};save();render();toast('Network reset.')}
function buy(id){if(state.upgrades.includes(id)){return}if(state.rep<50){toast('You need 50 Legend.');return}state.rep-=50;state.upgrades.push(id);log(`Legend hardened into: ${id.replaceAll('-',' ')}.`);save();render()}
function completeQuiet(){if(!state.theory){toast('Form a theory first.');return}state.completed.push('shipment');state.money+=180;state.rep+=12;state.intel+=2;state.relationships.jax++;log('Venn folded. The shipment was recovered without a fight.');toast('Operation resolved cleanly.');save();go('network')}
function startCombat(method){state.combat={method,enemyHp:42,playerHp:40,energy:3,flow:method==='ghost'?1:0,turn:0,evade:false,weakened:false,log:method==='face'?'Mara gets you through the front door. The room turns cold.':'You enter Warehouse 9. Someone was waiting.'};render()}
function combat(){const c=state.combat;const method=c.method;const enemyIntent=c.weakened?'ATTACK — WEAKENED':(c.turn%2===0?'ATTACK — 7 DAMAGE':'GUARD — BUILDING PRESSURE');shell(`<div class="combat-wrap screen"><div class="hero"><div><div class="eyebrow">OPERATION / WAREHOUSE 9</div><h1 class="title">Make your move.</h1><p class="subtitle">Combat is the resolution layer. Read intent, build Flow, and leave with a story.</p></div><div>${btn('FLEE','fleeCombat()')}</div></div><div class="combat-board"><div class="combat-top"><div class="fighter"><div class="name">YOUNG LEGEND</div><div class="hp"><i style="width:${c.playerHp/40*100}%"></i></div><div class="intent">HP ${c.playerHp}/40 · FLOW ${c.flow}</div></div><div class="fighter" style="text-align:right"><div class="name">WAREHOUSE GUARD</div><div class="hp"><i style="width:${c.enemyHp/42*100}%"></i></div><div class="intent">${enemyIntent}</div></div></div><div class="arena"><div class="avatar">YL</div><div class="vs">VS</div><div class="avatar enemy">WG</div></div><div class="combat-footer"><div class="energy">ENERGY <b>${c.energy}/3</b> · ${esc(c.log)}</div><div class="hand">${cards.map(card=>`<button class="card-btn" onclick="playCard('${card.id}')" ${c.energy<card.cost?'disabled':''}><span class="card-cost">${card.cost}</span><b>${card.name}</b><small>${card.desc}</small></button>`).join('')}</div></div></div></div>`)}
function playCard(id){const c=state.combat,card=cards.find(x=>x.id===id);if(!card||c.energy<card.cost)return;c.energy-=card.cost;let msg='';if(card.effect==='damage'||card.effect==='flow'||card.effect==='evade'||card.effect==='weaken'||card.effect==='counter'){let dmg=card.value;if(card.effect==='damage'&&state.upgrades.includes('deep-cuts'))dmg+=3;if(card.effect==='counter'&&c.turn%2!==0){msg='The counter whiffs. You read the wrong rhythm.';c.playerHp-=3}else{c.enemyHp-=dmg;msg=`${card.name} lands for ${dmg}.`;if(card.effect==='flow')c.flow++;if(card.effect==='evade')c.evade=true;if(card.effect==='weaken')c.weakened=true}}else if(card.effect==='escape'){state.rep+=2;msg='You disappear before the room can close around you.';finishCombat(false,msg);return}if(c.enemyHp<=0){finishCombat(true,`${card.name} ends the fight. Clean.`);return}if(c.turn%2===0){if(c.evade){c.evade=false;msg+=' You slip the return strike.'}else{c.playerHp-=c.weakened?3:7;msg+=' The guard answers.'}}else{c.enemyHp=Math.min(42,c.enemyHp+2);msg+=' The guard recovers 2.'}c.turn++;c.energy=3;c.log=msg;if(c.playerHp<=0){finishCombat(false,'You were forced out. The network survives, but the operation is lost.')}else render()}
function finishCombat(win,msg){const c=state.combat;if(win){state.completed.push('shipment');state.money+=160+state.rep;state.rep+=10+c.flow;state.intel+=1;state.relationships.jax++;log(`Operation won. ${msg}`);state.combat=null;save();toast('Legend + rewards earned.');go('network')}else{state.rep=Math.max(0,state.rep-2);log(msg);state.combat=null;save();toast('Operation failed. Knowledge remains.');go('network')}}
function fleeCombat(){finishCombat(false,'You withdrew before the operation could be secured.');}

window.go=go;window.findClue=findClue;window.askNetwork=askNetwork;window.formTheory=formTheory;window.recruit=recruit;window.person=person;window.closeModal=closeModal;window.newDay=newDay;window.resetGame=resetGame;window.buy=buy;window.completeQuiet=completeQuiet;window.startCombat=startCombat;window.playCard=playCard;window.fleeCombat=fleeCombat;
render();
