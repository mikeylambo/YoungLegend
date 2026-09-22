const $ = (s) => document.querySelector(s);
const app = $('#app');

const people = {
  mara:{id:'mara',name:'Mara Vale',role:'The Face',initial:'MV',trust:72,intel:54,combat:42,text:'Reads rooms before rooms read her. Opens doors that should stay closed.'},
  jax:{id:'jax',name:'Jax Mercer',role:'The Runner',initial:'JM',trust:58,intel:63,combat:71,text:'Fast, fearless, and almost impossible to pin down.'},
  sol:{id:'sol',name:'Sol Reyes',role:'The Scholar',initial:'SR',trust:36,intel:91,combat:29,text:'Collects patterns, debts, and facts. Knows why things happen.'}
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
  {id:'counter',name:'COUNTER',cost:2,desc:'Deal 12 damage if the enemy attacks.',effect:'counter',value:12},
  {id:'disarm',name:'DISARM',cost:2,desc:'Deal 7 damage and weaken enemy.',effect:'weaken',value:7},
  {id:'escape',name:'ESCAPE',cost:2,desc:'End combat safely. Gain +2 Legend.',effect:'escape',value:2}
];

const defaultState = {
  version:2, day:7, time:22*60+42, money:340, rep:17, intel:4, ap:6,
  screen:'story', scene:'runner', clues:[], completed:[],
  recruited:['mara','jax'], relationships:{mara:2,jax:1,sol:0}, upgrades:[],
  theory:null, mission:'missing-shipment', missionStarted:false, missionComplete:false,
  combat:null, log:['The network is quiet. That usually means something is about to happen.']
};

function fresh(){return JSON.parse(JSON.stringify(defaultState))}
function load(){
  try{
    const saved=JSON.parse(localStorage.getItem('youngLegendSave')||'null');
    if(!saved || saved.version!==2) return fresh();
    return {...fresh(),...saved,relationships:{...fresh().relationships,...saved.relationships}};
  }catch{return fresh()}
}
let state=load();

function save(){localStorage.setItem('youngLegendSave',JSON.stringify(state))}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){const d=document.createElement('div');d.className='toast';d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function log(msg){state.log.unshift(msg);state.log=state.log.slice(0,8);save()}
function clock(){const h=Math.floor(state.time/60)%24,m=state.time%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
function advance(minutes=30){state.time+=minutes;if(state.time>=24*60){state.day++;state.time-=24*60;state.ap=6;log(`Day ${state.day}. The city starts moving again.`)}}
function stat(label,value,delta=''){return `<div class="card stat"><div class="label">${label}</div><div class="value">${value}</div><div class="delta">${delta}</div></div>`}
function btn(label,fn,primary=false){return `<button class="btn ${primary?'primary':''}" onclick="${fn}">${label}</button>`}
function header(title,sub,actions=''){return `<div class="hero"><div><div class="eyebrow">Young Legend / Day ${String(state.day).padStart(2,'0')} / ${clock()}</div><h1 class="title">${title}</h1><p class="subtitle">${sub}</p></div><div class="actions">${actions}</div></div>`}

function shell(content,locked=false){
  app.innerHTML=`<div class="shell"><aside class="sidebar"><div class="mark">YL</div><nav class="nav">
    <button class="${state.screen==='network'?'active':''}" ${locked?'disabled':''} onclick="go('network')">◆ &nbsp; Network</button>
    <button class="${state.screen==='investigate'?'active':''}" ${locked?'disabled':''} onclick="go('investigate')">⌕ &nbsp; Investigate</button>
    <button class="${state.screen==='operation'?'active':''}" ${locked?'disabled':''} onclick="go('operation')">◇ &nbsp; Operations</button>
    <button class="${state.screen==='progress'?'active':''}" ${locked?'disabled':''} onclick="go('progress')">↗ &nbsp; Progress</button>
  </nav><div class="sidebar-foot">BUILD THE NETWORK.<br>READ THE ROOM.<br>BE REMEMBERED.</div></aside>
  <header class="top"><div class="brand"><small>SLU / CHARACTER RPG</small>YOUNG LEGEND</div><div class="top-meta"><div class="pill">◈ <b>${state.money}</b> crowns</div><div class="pill">◆ <b>${state.rep}</b> legend</div><div class="pill">⌁ <b>${state.intel}</b> intel</div><div class="pill">AP <b>${state.ap}/6</b></div></div></header>
  <main class="main">${content}</main></div>`;
}

function story(){
  const scenes={
    runner:{
      kicker:'MOMENT 01 / EAST QUAY / 22:42',
      title:'The Runner',
      body:'A young runner cuts across the quay with a sealed manifest tucked under his coat. He is moving too quickly for a courier and too carefully for a thief. Nobody else seems to notice.',
      choices:[
        ['FOLLOW HIM','sceneChoice(\'follow\')','You keep your distance. Learn first. Act later.'],
        ['CALL JAX','sceneChoice(\'jax\')','Jax can close the distance without making the scene loud.'],
        ['INTERCEPT','sceneChoice(\'intercept\')','You step into his path and make the first move.'],
        ['LET HIM GO','sceneChoice(\'letgo\')','You memorize the route. Sometimes the best lead is the one you do not touch.']
      ]
    },
    follow:{
      kicker:'MOMENT 02 / THE TRAIL / 22:58',title:'You Follow',
      body:'The runner checks Gate 3, sees the guard rotation forming, and changes direction toward the warehouse district. You now know the route — but not why it matters.',
      choices:[['ASK MARA','sceneChoice(\'mara\')','Turn observation into social intelligence.'],['KEEP WATCHING','sceneChoice(\'watch\')','Stay unseen and learn the pattern yourself.']]
    },
    jax:{
      kicker:'MOMENT 02 / EAST QUAY / 22:51',title:'Jax Gets There First',
      body:'Jax appears beside you with a grin and a stolen scrap of manifest paper. “Same runner has done this three nights in a row.” The problem just became a pattern.',
      choices:[['TAKE THE MANIFEST','sceneChoice(\'manifest\')','Trade speed for evidence.'],['SEND JAX AHEAD','sceneChoice(\'jaxahead\')','Let your network move while you think.']]
    },
    intercept:{
      kicker:'MOMENT 02 / EAST QUAY / 22:50',title:'The First Gamble',
      body:'You stop the runner. He bolts. You catch the manifest, but the shout wakes half the quay. You got evidence — and announced that someone is looking.',
      choices:[['READ THE MANIFEST','sceneChoice(\'manifest\')','Use the evidence before the district reacts.'],['ASK MARA TO CLEAN IT UP','sceneChoice(\'mara\')','Make the social layer absorb your mistake.']]
    },
    letgo:{
      kicker:'MOMENT 02 / GATE 3 / 23:05',title:'You Let Him Run',
      body:'The runner disappears through Gate 3. Ten minutes later a guard changes shifts early. You did not catch the courier. You caught the system.',
      choices:[['WATCH THE SHIFT','sceneChoice(\'watch\')','Turn patience into a tactical advantage.'],['ASK JAX TO TRACE HIM','sceneChoice(\'jaxahead\')','Follow the network instead of the person.']]
    },
    mara:{
      kicker:'MOMENT 03 / MARA’S TABLE / 23:18',title:'Read the Room',
      body:'Mara listens, then laughs once. “Corvin is pretending to help. People only perform innocence that hard when they need you looking somewhere else.”',
      choices:[['PRESS CORVIN','sceneChoice(\'pressure\')','Test the merchant directly.'],['FOLLOW THE MONEY','sceneChoice(\'money\')','Find the person being paid to make the route possible.']]
    },
    manifest:{
      kicker:'MOMENT 03 / THE MANIFEST / 23:12',title:'A Name on Paper',
      body:'The manifest lists Warehouse 9. One payment beside the route is marked for Venn, the Gate 3 guard. The mystery has acquired names.',
      choices:[['FIND THE SHIFT','sceneChoice(\'watch\')','Confirm how Venn opens the route.'],['GO TO WAREHOUSE 9','sceneChoice(\'warehouse\')','Move before the cargo leaves.']]
    },
    watch:{
      kicker:'MOMENT 03 / GATE 3 / 23:20',title:'The Eight-Minute Window',
      body:'At 23:20, the guard rotation leaves Gate 3 exposed for roughly eight minutes. The window is real. Someone planned around it.',
      choices:[['CHECK THE LEDGER','sceneChoice(\'ledger\')','Find who paid for the window.'],['MOVE ON WAREHOUSE 9','sceneChoice(\'warehouse\')','Exploit the opening before it closes.']]
    },
    jaxahead:{
      kicker:'MOMENT 03 / WAREHOUSE DISTRICT / 23:16',title:'Jax Finds the Thread',
      body:'Jax returns with a route: the runner is staging sealed crates at Warehouse 9. He also saw Corvin’s men nearby.',
      choices:[['GET THE LEDGER','sceneChoice(\'ledger\')','Turn a hunch into leverage.'],['GO TO WAREHOUSE 9','sceneChoice(\'warehouse\')','You have enough to act.']]
    },
    pressure:{
      kicker:'MOMENT 04 / CORVIN’S OFFICE / 23:31',title:'Pressure',
      body:'Corvin smiles too quickly. You mention Venn. His smile disappears. He offers money to make the questions stop.',
      choices:[['TAKE THE MONEY','sceneChoice(\'take\')','Profit now. Lose the cleanest route to the truth.'],['REFUSE','sceneChoice(\'ledger\')','Make the accusation matter.']]
    },
    money:{
      kicker:'MOMENT 04 / THE LEDGER / 23:34',title:'Follow the Money',
      body:'The ledger confirms it: Corvin paid Venn to protect the shift window. Warehouse 9 is not a guess anymore.',
      choices:[['FORM THE THEORY','sceneChoice(\'theory\')','Commit to a plan.'],['KEEP DIGGING','sceneChoice(\'dig\')','Spend more time for a cleaner picture.']]
    },
    ledger:{
      kicker:'MOMENT 04 / THE LEDGER / 23:36',title:'The Missing Piece',
      body:'The ledger connects Corvin to Venn. Warehouse 9 appears on the same route. Three fragments now point in one direction.',
      choices:[['FORM THE THEORY','sceneChoice(\'theory\')','Commit to a plan.'],['BRING IN SOL','sceneChoice(\'sol\')','Invest in a deeper investigation.']]
    },
    warehouse:{
      kicker:'MOMENT 04 / WAREHOUSE 9 / 23:40',title:'The Door',
      body:'Warehouse 9 is dark except for a line of light under one door. You can hear crates moving inside. The next decision is no longer about information. It is about how you want to be remembered.',
      choices:[['GHOST','sceneChoice(\'ghost\')','Slip inside unseen. Jax makes this cleaner.'],['FACE','sceneChoice(\'face\')','Walk through the front door with Mara.'],['STATEMENT','sceneChoice(\'force\')','Enter openly and make the room react.'],['LEVER','sceneChoice(\'lever\')','Turn Venn before anyone draws a weapon.']]
    },
    take:{
      kicker:'MOMENT 05 / THE PRICE / 23:36',title:'A Complication',
      body:'You take the money. The shipment still moves, but now you are carrying a secret of your own. The network learns that results can have a price.',
      choices:[['GO TO WAREHOUSE 9','sceneChoice(\'warehouse\')','Finish what you started.']]
    },
    dig:{
      kicker:'MOMENT 05 / TOO LATE / 00:02',title:'The Window Closes',
      body:'You keep digging. The shift changes. The cargo leaves Warehouse 9 before you arrive. You did not fail — you chose certainty over speed. Now you have to track the shipment instead of intercepting it.',
      choices:[['FORM THE THEORY','sceneChoice(\'theory\')','Build the next move from what you know.']]
    },
    sol:{
      kicker:'MOMENT 05 / SOL’S ROOM / 23:45',title:'The Scholar',
      body:'Sol maps the manifests and sees what you missed: Warehouse 9 is only the staging point. Someone higher up is using Corvin as a disposable layer.',
      choices:[['FORM THE THEORY','sceneChoice(\'theory\')','You finally have a complete picture.']]
    }
  };
  const s=scenes[state.scene]||scenes.runner;
  const choices=s.choices.map((c,i)=>`<button class="choice" onclick="${c[1]}"><span class="choice-num">0${i+1}</span><div><b>${c[0]}</b><small>${c[2]}</small></div></button>`).join('');
  shell(`<div class="story-card screen"><div class="story-kicker">${s.kicker}</div><div class="story-layout"><div class="story-copy"><h1>${s.title}</h1><p>${s.body}</p><div class="choice-list">${choices}</div></div><aside class="story-side"><div class="scene-symbol">YL</div><div class="section-title">THE RULE</div><p class="muted">Every choice costs time, creates information, or changes how people see you.</p><div class="clock-card"><span>LOCAL TIME</span><b>${clock()}</b><small>Deadline: midnight cargo movement</small></div></aside></div></div>`,true);
}

function sceneChoice(next){
  const costs={follow:16,jax:9,intercept:8,letgo:23,mara:18,watch:12,manifest:10,jaxahead:14,pressure:13,money:12,ledger:8,warehouse:4,take:5,theory:3,dig:26,sol:10,ghost:0,face:0,force:0,lever:0};
  advance(costs[next]||10);
  if(next==='manifest'&&!state.clues.includes('gate')){state.clues.push('gate');state.intel++}
  if(next==='watch'&&!state.clues.includes('shift')){state.clues.push('shift');state.intel++}
  if(next==='ledger'&&!state.clues.includes('ledger')){state.clues.push('ledger');state.intel++}
  if(next==='mara'&&!state.clues.includes('merchant')){state.clues.push('merchant');state.intel++}
  if(next==='jaxahead'&&!state.clues.includes('runner')){state.clues.push('runner');state.intel++}
  if(next==='warehouse'&&!state.clues.includes('warehouse')){state.clues.push('warehouse');state.intel++}
  if(next==='sol'){if(!state.recruited.includes('sol')){state.recruited.push('sol');state.relationships.sol=1;state.money=Math.max(0,state.money-80);log('Sol Reyes joined the network.')}if(!state.clues.includes('warehouse')){state.clues.push('warehouse');state.intel++}}
  if(next==='theory'){state.theory='Corvin is staging the missing shipments at Warehouse 9, using Venn and the shift gap to move them.';state.rep+=3;state.missionStarted=true;log('Theory formed: Corvin + Venn + Warehouse 9.');state.screen='operation';save();render();return}
  if(['ghost','face','force','lever'].includes(next)){startCombat(next==='lever'?'lever':next);return}
  state.scene=next;state.screen='story';save();render();
}

function network(){
  const cardsPeople=Object.values(people).map(p=>{const r=state.relationships[p.id]||0;return `<div class="person" onclick="person('${p.id}')"><div class="portrait">${p.initial}</div><div class="person-name">${p.name}</div><div class="person-role">${p.role} · Bond ${r}</div><div class="bars"><div class="barrow"><span>TRUST</span><div class="bar"><i style="width:${Math.min(99,p.trust+r*5)}%"></i></div><b>${Math.min(99,p.trust+r*5)}</b></div><div class="barrow"><span>SKILL</span><div class="bar"><i style="width:${p.intel}%"></i></div><b>${p.intel}</b></div></div></div>`}).join('');
  shell(header('The Network','The mission is complete. Now the city opens up.',btn('CONTINUE','continueAfterMission()',true))+
  `<div class="grid stats">${stat('MONEY',state.money,'operational income')}${stat('LEGEND',state.rep,'reputation in the district')}${stat('INTEL',state.intel,'actionable knowledge')}${stat('TIME',clock(),'the city keeps moving')}${stat('NETWORK',state.recruited.length,'active connections')}</div>
  <div class="grid cols"><section class="card section"><div class="section-head"><div><div class="section-title">People worth knowing</div><div class="section-note">Relationships unlock methods, cards and information.</div></div></div><div class="people">${cardsPeople}</div></section>
  <section class="card section"><div class="section-title">The first legend</div><p class="muted">You found the shipment, made a choice under pressure, and changed how the district sees you.</p><div class="mission"><div class="mission-icon">✓</div><div><h3>THE MISSING SHIPMENT</h3><p>Resolved. The next operation will be shaped by what you did here.</p></div></div><div style="height:18px"></div><div class="section-title">Recent word</div><div class="log">${state.log.map((x,i)=>`<div class="logline"><span>${i?'NOTE':'NOW'}</span>${esc(x)}</div>`).join('')}</div></section></div>`);
}

function investigate(){
  shell(header('Read the Room','Investigation is now optional support for the wider game.',btn('BACK','go(\'network\')'))+
  `<div class="grid cols"><section class="card section"><div class="section-head"><div><div class="section-title">Evidence board</div><div class="section-note">Found ${state.clues.length}/6 clues.</div></div></div><div class="clues">${clues.map(c=>`<div class="clue ${state.clues.includes(c.id)?'found':''}" onclick="findClue('${c.id}')"><b>${state.clues.includes(c.id)?'✓ ':''}${c.title}</b><p>${state.clues.includes(c.id)?c.text:'Search this lead to uncover what it knows.'}</p></div>`).join('')}</div></section><section class="card section"><div class="section-title">What you learned</div><p class="muted">${esc(state.theory||'Your first operation taught you that clues are leverage, not collectibles.')}</p></section></div>`);
}
function operation(){
  shell(header('The Operation','Choose the approach that becomes your first defining moment.',btn('BACK','go(\'network\')'))+
  `<div class="op-grid"><section class="card section"><div class="section-title">Warehouse 9 / ${clock()}</div><p class="subtitle">The crates are moving. Your theory points to Corvin, Venn, and the shift gap.</p><div class="approaches" style="margin-top:18px"><button class="approach" onclick="startCombat('ghost')"><span class="risk">LOW RISK</span><b>THE GHOST</b><small>Slip through the service route. Start with Flow.</small></button><button class="approach" onclick="startCombat('face')"><span class="risk">SOCIAL</span><b>THE FACE</b><small>Let Mara open the room. If it fails, it gets physical.</small></button><button class="approach" onclick="startCombat('force')"><span class="risk">HIGH RISK</span><b>THE STATEMENT</b><small>Walk in openly. Make the room react.</small></button><button class="approach" onclick="completeQuiet()"><span class="risk">NETWORK</span><b>THE LEVER</b><small>Turn Venn before anyone draws a weapon.</small></button></div></section><aside class="card section"><div class="section-title">Your theory</div><div class="section-note" style="margin-top:5px">${esc(state.theory||'No theory formed yet.')}</div></aside></div>`);
}
function progress(){
  const ups=[['silver-tongue','SILVER TONGUE','Social approaches gain leverage.'],['clean-footwork','CLEAN FOOTWORK','Start combat with +1 Flow when entering unseen.'],['deep-cuts','DEEP CUTS','STRIKE deals +3 damage.'],['street-network','STREET NETWORK','Gain +25 crowns when a new day begins.']];
  shell(header('Become Someone','Your build is the pattern of choices you keep making.',btn('RESET SAVE','resetGame()'))+`<div class="grid cols"><section class="card section"><div class="section-title">Legend traits</div><p class="muted">${traitSummary()}</p><div class="choice-list">${ups.map(u=>`<button class="choice" onclick="buy('${u[0]}')" ${state.upgrades.includes(u[0])?'disabled':''}><b>${state.upgrades.includes(u[0])?'✓ ':''}${u[1]}</b><small>${u[2]}</small><span class="tag" style="float:right">${state.upgrades.includes(u[0])?'OWNED':'50 LEGEND'}</span></button>`).join('')}</div></section><section class="card section"><div class="section-title">The life so far</div><div class="log">${state.log.map(x=>`<div class="logline"><span>LOG</span>${esc(x)}</div>`).join('')}</div></section></div>`);
}
function traitSummary(){return state.upgrades.length?state.upgrades.map(x=>x.replaceAll('-',' ').toUpperCase()).join(' · '):'No reputation has hardened into a style yet.'}

function go(s){if(!state.missionComplete&&s!=='progress'){toast('Finish the moment first.');return}state.screen=s;state.combat=null;save();render()}
function findClue(id){if(state.clues.includes(id)){toast('Already understood.');return}if(state.ap<=0){toast('No actions left.');return}state.ap--;state.clues.push(id);state.intel++;advance(25);log(`Discovered: ${clues.find(c=>c.id===id).title}.`);save();render()}
function person(id){const p=people[id],r=state.relationships[id]||0;modal(`<div class="modal-head"><div><div class="eyebrow">NETWORK MEMBER</div><h2>${p.name}</h2></div><button class="close" onclick="closeModal()">×</button></div><p class="muted">${p.text}</p><div class="choice-list"><div class="choice"><b>${p.role}</b><small>Trust ${p.trust+r*5} · Bond ${r} · Core skill ${Math.max(p.intel,p.combat)}</small></div></div>`)}
function modal(inner){const d=document.createElement('div');d.className='modal';d.id='modal';d.innerHTML=`<div class="modal-box">${inner}</div>`;document.body.appendChild(d)}
function closeModal(){$('#modal')?.remove()}

function startCombat(method){state.combat={method,enemyHp:42,playerHp:40,energy:3,flow:method==='ghost'&&state.upgrades.includes('clean-footwork')?2:method==='ghost'?1:0,turn:0,evade:false,weakened:false,log:method==='face'?'Mara gets you through the front door. The room turns cold.':method==='force'?'You enter Warehouse 9. Every head turns.':'You slip inside. Someone was waiting.'};render()}
function combat(){
  const c=state.combat;
  if(c.method==='lever'){return shell(header('The Lever','You turn the evidence into pressure instead of violence.'),true)+`<div class="story-card screen"><div class="story-copy"><div class="story-kicker">WAREHOUSE 9 / 23:52</div><h1>Venn Looks at the Ledger.</h1><p>He knows exactly what happens if the payment becomes public. You offer him one clean exit: open the gate, walk away, and let the shipment be recovered.</p><div class="choice-list"><button class="choice" onclick="completeQuiet()"><span class="choice-num">01</span><div><b>MAKE THE DEAL</b><small>Recover the shipment without a fight. Venn becomes a future contact.</small></div></button><button class="choice" onclick="startCombat('force')"><span class="choice-num">02</span><div><b>BREAK THE DEAL</b><small>Use the leverage, then make the room answer to you.</small></div></button></div></div></div>`,true)}
  const intent=c.weakened?'ATTACK — WEAKENED':(c.turn%2===0?'ATTACK — 7 DAMAGE':'GUARD — BUILDING PRESSURE');
  shell(`<div class="combat-wrap screen">${header('Make your move.','Combat is the resolution layer. Read intent, build Flow, and leave with a story.',btn('FLEE','fleeCombat()'))}<div class="combat-board"><div class="combat-top"><div class="fighter"><div class="name">YOUNG LEGEND</div><div class="hp"><i style="width:${c.playerHp/40*100}%"></i></div><div class="intent">HP ${c.playerHp}/40 · FLOW ${c.flow}</div></div><div class="fighter" style="text-align:right"><div class="name">WAREHOUSE GUARD</div><div class="hp"><i style="width:${c.enemyHp/42*100}%"></i></div><div class="intent">${intent}</div></div></div><div class="arena"><div class="avatar">YL</div><div class="vs">VS</div><div class="avatar enemy">WG</div></div><div class="combat-footer"><div class="energy">ENERGY <b>${c.energy}/3</b> · ${esc(c.log)}</div><div class="hand">${cards.map(card=>`<button class="card-btn" onclick="playCard('${card.id}')" ${c.energy<card.cost?'disabled':''}><span class="card-cost">${card.cost}</span><b>${card.name}</b><small>${card.desc}</small></button>`).join('')}</div></div></div></div>`);
}
function playCard(id){
  const c=state.combat,card=cards.find(x=>x.id===id);if(!card||c.energy<card.cost)return;
  c.energy-=card.cost;let msg='';
  if(card.effect==='counter'&&c.turn%2!==0){msg='The counter whiffs. You read the wrong rhythm.';c.playerHp-=3}
  else if(card.effect!=='escape'){let dmg=card.value;if(card.effect==='damage'&&state.upgrades.includes('deep-cuts'))dmg+=3;c.enemyHp-=dmg;msg=`${card.name} lands for ${dmg}.`;if(card.effect==='flow')c.flow++;if(card.effect==='evade')c.evade=true;if(card.effect==='weaken')c.weakened=true}
  else{state.rep+=2;finishCombat(false,'You disappear before the room can close around you.');return}
  if(c.enemyHp<=0){finishCombat(true,`${card.name} ends the fight. Clean.`);return}
  if(c.turn%2===0){if(c.evade){c.evade=false;msg+=' You slip the return strike.'}else c.playerHp-=c.weakened?3:7}else{c.enemyHp=Math.min(42,c.enemyHp+2);msg+=' The guard recovers 2.'}
  c.turn++;c.energy=3;c.log=msg;
  if(c.playerHp<=0)finishCombat(false,'You were forced out. The network survives, but the operation is lost.');else render();
}
function finishCombat(win,msg){
  if(win){state.missionComplete=true;state.completed.push('shipment');state.money+=160+state.rep;state.rep+=10+state.combat.flow;state.intel++;state.relationships.jax++;log(`Operation won. ${msg}`);state.combat=null;state.screen='network';save();toast('First legend earned.');render()}
  else{state.rep=Math.max(0,state.rep-2);log(msg);state.combat=null;state.screen='network';save();toast('The operation changed you, even in failure.');render()}
}
function fleeCombat(){finishCombat(false,'You withdrew before the operation could be secured.')}
function completeQuiet(){state.missionComplete=true;state.completed.push('shipment');state.money+=180;state.rep+=12;state.intel+=2;state.relationships.jax++;log('Venn folded. The shipment was recovered without a fight.');state.screen='network';save();toast('Operation resolved through leverage.');render()}
function continueAfterMission(){state.day++;state.time=9*60;state.ap=6;state.mission='open-network';log(`Day ${state.day}. The network is no longer an idea. It is a force.`);save();render()}
function resetGame(){localStorage.removeItem('youngLegendSave');state=fresh();save();render();toast('Young Legend reset.')}
function buy(id){if(state.upgrades.includes(id)||state.rep<50)return;state.rep-=50;state.upgrades.push(id);log(`Legend hardened into: ${id.replaceAll('-',' ')}.`);save();render()}

function render(){if(!state.missionComplete&&state.screen==='story')story();else if(state.combat)combat();else if(state.screen==='investigate')investigate();else if(state.screen==='operation')operation();else if(state.screen==='progress')progress();else network()}

window.go=go;window.sceneChoice=sceneChoice;window.findClue=findClue;window.person=person;window.closeModal=closeModal;window.resetGame=resetGame;window.buy=buy;window.startCombat=startCombat;window.playCard=playCard;window.fleeCombat=fleeCombat;window.completeQuiet=completeQuiet;window.continueAfterMission=continueAfterMission;
render();
