let pairToken=localStorage.getItem('charliTerrainPair')||'';
const match=location.hash.match(/^#pair=([a-f0-9]{64})$/);
if(match){pairToken=match[1];localStorage.setItem('charliTerrainPair',pairToken);history.replaceState(null,'',location.pathname)}
let syncing=false;
window.charliPcMissions=window.charliPcMissions||[];
function syncLabel(message){
 const a=document.getElementById('syncState');if(a)a.textContent=message;
 const b=document.getElementById('syncPageState');if(b)b.textContent=message;
}
function updateLastSync(){
 const raw=localStorage.getItem('charliTerrainLastSync');
 const el=document.getElementById('lastSyncLabel');
 if(!el)return;
 if(!raw){el.textContent='Jamais';return}
 const d=new Date(raw);el.textContent='OK – '+d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
updateLastSync();

function connectionMode(){
  const host=location.hostname;
  const local=/^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  if(location.protocol==='https:'&&!local)return 'github';
  if(local&&location.port==='8787')return 'local';
  return local?'local':'external';
}
function showConnectionHint(){
  const mode=connectionMode();
  if(mode==='github')syncLabel('⚠️ Version GitHub détectée : la synchronisation locale PC est impossible ici. Ouvre le lien généré par Charli STM sur le PC.');
  else if(mode==='local')syncLabel('✅ Liaison locale détectée : '+location.origin+' • prêt à synchroniser.');
  else syncLabel('Connexion actuelle : '+location.origin+'. Pour la synchro, ouvre le lien local généré par Charli STM.');
}
setTimeout(showConnectionHint,150);

async function syncTerrain(){
  if(syncing)return;
  if(connectionMode()==='github'){syncLabel('⚠️ Tu es sur la version GitHub. Ouvre depuis le téléphone le lien affiché dans Charli STM > Paramètres > Charli Terrain.');return}
  if(!pairToken){syncLabel('Liaison non configurée. Depuis le PC : Paramètres → liaison Terrain, puis ouvre le lien sur ce téléphone.');return}
  syncing=true;syncLabel('Synchronisation en cours…');
  try{
    const pending=missions.filter(m=>!m.synced);
    for(const m of pending)if(!m.id)m.id='terrain-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,14);
    if(pending.length)persist();
    const r=await fetch(pending.length?'/api/sync':'/api/snapshot',{method:pending.length?'POST':'GET',headers:{'Authorization':'Bearer '+pairToken,'Content-Type':'application/json'},body:pending.length?JSON.stringify({missions:pending}):undefined,signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw new Error(r.status===401?'Liaison refusée. Rouvre le lien affiché sur le PC.':'Connexion indisponible ('+r.status+').');
    const data=await r.json();
    const remote=data.missions||[];
    const confirmed=new Set(remote.map(x=>x.terrainId).filter(Boolean));
    const accepted=new Set((data.accepted||[]).filter(id=>confirmed.has(id)));
    for(const m of missions)if(accepted.has(m.id))m.synced=true;
    window.charliPcMissions=remote;
    persist();if(window.renderMissionPage)window.renderMissionPage();
    const now=new Date();localStorage.setItem('charliTerrainLastSync',now.toISOString());updateLastSync();
    const pendingAfter=missions.filter(m=>!m.synced).length;
    syncLabel('✅ Synchronisation confirmée par le PC • '+accepted.size+' mission(s) reçue(s) • '+pendingAfter+' en attente • '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}));
    const pc=document.getElementById('pcMissions');if(pc)pc.innerHTML=window.charliPcMissions.slice(-25).reverse().map(m=>`<div class="pcMission"><b>${esc(m.title)}</b><small>${esc(m.team)} • ${esc(m.status)}${m.date?' • '+esc(m.date):''}</small></div>`).join('');
  }catch(e){syncLabel('Hors connexion : rien n’est perdu sur le téléphone. '+(e.name==='TimeoutError'?'PC inaccessible.':e.message))}
  finally{syncing=false}
}
window.syncTerrain=syncTerrain;
const b1=document.getElementById('syncNow');if(b1)b1.onclick=syncTerrain;
const b2=document.getElementById('syncPageBtn');if(b2)b2.onclick=syncTerrain;
// Synchronisation volontairement MANUELLE : pas de timer ni d'envoi automatique.
