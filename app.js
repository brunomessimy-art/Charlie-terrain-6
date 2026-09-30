const TEAMS=["Bâtiment","Voirie","Espaces verts","Propreté","Festivités","Moyens techniques"];
const ACT={
"Bâtiment":["Plomberie","Électricité","Serrurerie","Peinture","Menuiserie","Maintenance","Contrôle réglementaire","Petites réparations","Autre"],
"Voirie":["Signalisation verticale","Signalisation horizontale","Enrobé / nids-de-poule","Mobilier urbain","Maçonnerie","Réseaux","Barriérage","Autre"],
"Espaces verts":["Tonte","Taille","Élagage","Arrosage","Désherbage","Plantation","Entretien massifs","Autre"],
"Propreté":["Balayage","Lavage","Collecte","Dépôt sauvage","Corbeilles","Nettoyage","Autre"],
"Festivités":["Montage","Démontage","Transport","Manutention","Barriérage","Branchement électrique","Nettoyage événementiel","Autre"],
"Moyens techniques":["Logistique","Transport","Maintenance matériel","Préparation","Coordination","Autre"]};
let missions=JSON.parse(localStorage.getItem("charliTerrainMissions")||"[]"), editing=null;
const $=id=>document.getElementById(id);
function persist(){localStorage.setItem("charliTerrainMissions",JSON.stringify(missions));let n=missions.filter(m=>!m.synced).length;if($("count"))$("count").textContent=n;if($("settingsPending"))$("settingsPending").textContent=n;if(window.renderMissionPage)window.renderMissionPage()}
function fillTeams(){ $("team").innerHTML=TEAMS.map(x=>`<option>${x}</option>`).join(""); refreshActs()}
function refreshActs(){let t=$("team").value;$("activity").innerHTML=(ACT[t]||["Autre"]).map(x=>`<option>${x}</option>`).join("")}
$("team").onchange=refreshActs; fillTeams(); persist();

function classify(s){
 const x=s.toLowerCase();
 let team=/tonte|taille|élag|elag|arros|désherb|desherb|plantation|massif/.test(x)?"Espaces verts":
 /balay|lavage|collect|dépôt|depot|corbeille|nettoy/.test(x)?"Propreté":
 /plomb|électr|electr|serrur|peint|menuis|bâtiment|batiment|toiture|porte|fenêtre|fenetre/.test(x)?"Bâtiment":
 /fête|fete|festiv|barrière|barriere|podium|chapiteau|manifestation/.test(x)?"Festivités":
 /voirie|panneau|signalisation|marquage|enrob|nid.de.poule|trottoir|chaussée|chaussee|mobilier urbain/.test(x)?"Voirie":"Moyens techniques";
 let activity=(ACT[team]||[]).find(a=>{
   let k=a.toLowerCase().split(/[ /-]/)[0];
   return k.length>3 && x.includes(k);
 })||"Autre";
 if(team==="Voirie"&&/panneau|stop|sens interdit|signalisation/.test(x))activity="Signalisation verticale";
 if(team==="Voirie"&&/marquage|peinture au sol/.test(x))activity="Signalisation horizontale";
 let loc="";
 let m=s.match(/\b(?:rue|avenue|av\.?|boulevard|bd\.?|route|chemin|impasse|place|parc|square|école|ecole|gymnase|halle|camping)\s+[^,.]+/i);
 if(m) loc=m[0].trim();
 return {team,activity,location:loc,title:s.trim().slice(0,120),description:s.trim()};
}
function openEdit(data,index=null){
 editing=index; $("dlgTitle").textContent=index===null?"Contrôle de la mission":"Modifier la mission";
 $("team").value=data.team||"Moyens techniques"; refreshActs();
 $("activity").value=(ACT[$("team").value]||[]).includes(data.activity)?data.activity:"Autre";
 $("location").value=data.location||"";$("titleText").value=data.title||"";$("description").value=data.description||"";
 editDlg.showModal();
}
$("saveBtn").onclick=e=>{e.preventDefault();let d={team:$("team").value,activity:$("activity").value,location:$("location").value.trim(),title:$("titleText").value.trim(),description:$("description").value.trim(),created:new Date().toISOString()};
 if(!d.title){alert("Indiquez la mission.");return}
 if(editing===null)missions.push({...d,id:'terrain-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,14)});else missions[editing]={...missions[editing],...d};
 persist();editDlg.close();$("heard").textContent="✓ Mission enregistrée. Vous pouvez dicter la suivante.";};

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
$("mic").onclick=()=>{
 if(!SR){let s=prompt("La reconnaissance vocale n'est pas disponible ici. Dictez avec le micro du clavier Android ou saisissez la mission :");if(s)openEdit(classify(s));return}
 const r=new SR();r.lang="fr-FR";r.interimResults=false;r.maxAlternatives=1;
 $("mic").classList.add("listening");$("heard").textContent="🎙️ Je vous écoute…";
 r.onresult=e=>{let s=e.results[0][0].transcript;$("heard").textContent="« "+s+" »";openEdit(classify(s))};
 r.onerror=e=>{$("heard").textContent="Reconnaissance vocale impossible : "+e.error};
 r.onend=()=> $("mic").classList.remove("listening"); r.start();
};

function showList(){missionList.innerHTML=missions.length?missions.map((m,i)=>`<div class="mission"><b>${i+1}. ${esc(m.title)}</b><small>${esc(m.team)} • ${esc(m.activity)} • ${esc(m.location||"Lieu à préciser")} • ${m.synced?'Transmise à STM':'En attente'}</small><div class="row">${m.synced?'':`<button onclick="editOne(${i})">✏️ Modifier</button><button class="del" onclick="delOne(${i})">🗑️ Supprimer</button>`}</div></div>`).join(""):'<p>Aucune mission enregistrée.</p>';listDlg.showModal()}
$("listBtn").onclick=showList; window.editOne=i=>{if(missions[i].synced)return;listDlg.close();openEdit(missions[i],i)};window.delOne=i=>{if(missions[i].synced)return;if(confirm("Supprimer cette mission ?")){missions.splice(i,1);persist();showList()}};

function esc(s){return String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function codeFor(team,act){let p={"Voirie":"VOI","Bâtiment":"BAT","Espaces verts":"EV","Propreté":"PRO","Festivités":"FES","Moyens techniques":"MT"}[team]||"MT";return p+"-"+String(act||"AUTRE").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"")}
function refFor(i){let d=new Date(),yy=String(d.getFullYear()).slice(-2),mm=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");return yy+mm+dd+String(i+1).padStart(3,"0")}
function pdfEscapeBytes(s){ // WinAnsi/Windows-1252-ish, emitted as hex string
 const map={"€":128,"‚":130,"ƒ":131,"„":132,"…":133,"†":134,"‡":135,"ˆ":136,"‰":137,"Š":138,"‹":139,"Œ":140,"Ž":142,"‘":145,"’":146,"“":147,"”":148,"•":149,"–":150,"—":151,"˜":152,"™":153,"š":154,"›":155,"œ":156,"ž":158,"Ÿ":159};
 let a=[];for(const ch of s){let n=map[ch]??ch.charCodeAt(0);if(n>255)n=63;a.push(n.toString(16).padStart(2,"0"))}return "<"+a.join("")+">"}
function wrap(s,n=88){let w=String(s||"").replace(/\s+/g," ").trim().split(" "),out=[],line="";for(const x of w){if((line+" "+x).trim().length>n){out.push(line);line=x}else line=(line+" "+x).trim()}if(line)out.push(line);return out}
function makePdf(){
 if(!missions.length){alert("Aucune mission à exporter.");return}
 let lines=["CHARLI TERRAIN - IMPORT CHARLI STM","Numero  Titre  Type de travaux  Service destinataire  Localisation  Description",""];
 missions.forEach((m,i)=>{lines.push(`${refFor(i)} ${m.title}`);lines.push(`${codeFor(m.team,m.activity)} ${m.team}`);lines.push(`LIEU: ${m.location||"A PRECISER"}`);lines.push(`DESCRIPTION: ${m.description||m.title}`);lines.push("")});
 let content="BT\n/F1 10 Tf\n45 800 Td\n";
 let y=0;for(const line of lines.flatMap(x=>wrap(x))){content+=`${pdfEscapeBytes(line)} Tj\n0 -13 Td\n`;y+=13;if(y>730){break}}
 content+="ET";
 const objs=[];
 const add=s=>{objs.push(s);return objs.length};
 const font=add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
 const stream=add(`<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`);
 const page=add(`<< /Type /Page /Parent 4 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${stream} 0 R >>`);
 const pages=add(`<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`);
 const catalog=add(`<< /Type /Catalog /Pages ${pages} 0 R >>`);
 let pdf="%PDF-1.4\n",offs=[0];objs.forEach((o,i)=>{offs[i+1]=new TextEncoder().encode(pdf).length;pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});
 let xref=new TextEncoder().encode(pdf).length;pdf+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;for(let i=1;i<=objs.length;i++)pdf+=String(offs[i]).padStart(10,"0")+" 00000 n \n";
 pdf+=`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
 let blob=new Blob([new TextEncoder().encode(pdf)],{type:"application/pdf"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`Charli_Terrain_${new Date().toISOString().slice(0,10)}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
$("pdfBtn").onclick=makePdf;
$("clearBtn").onclick=()=>{if(!missions.length)return;if(confirm(`Effacer les ${missions.length} mission(s) du téléphone ?\n\nLes missions transmises restent dans Charli STM. Les missions en attente seront perdues.`)){missions=[];persist();$("heard").textContent="Missions effacées."}};


// --- Interface V7.11 ---
function updateClock(){
 const now=new Date();
 if($("todayDate"))$("todayDate").textContent=now.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
 if($("todayTime"))$("todayTime").textContent=now.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
}
updateClock();setInterval(updateClock,30000);

function showScreen(name){
 document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('.bottomNav button').forEach(x=>x.classList.remove('active'));
 const ids={home:'screenHome',missions:'screenMissions',sync:'screenSync',settings:'screenSettings'};
 const el=$(ids[name]||'screenHome');if(el)el.classList.add('active');
 const btn=document.querySelector(`.bottomNav button[data-screen="${name}"]`);if(btn)btn.classList.add('active');
 if(name==='missions')renderMissionPage();
 window.scrollTo({top:0,behavior:'smooth'});
}
window.showScreen=showScreen;

document.querySelectorAll('.bottomNav button').forEach(b=>b.onclick=()=>{
 const s=b.dataset.screen;
 if(s==='dictation'){showScreen('home');setTimeout(()=>$('mic')?.click(),100);return}
 showScreen(s);
});
document.querySelectorAll('.backHome').forEach(b=>b.onclick=()=>showScreen('home'));

window.renderMissionPage=function(){
 const root=$("missionsPage");if(!root)return;
 const local=missions.length?missions.slice().reverse().map((m,ri)=>{let i=missions.length-1-ri;return `<div class="mission"><b>${esc(m.title)}</b><small>${esc(m.team)} • ${esc(m.activity)} • ${esc(m.location||"Lieu à préciser")} • ${m.synced?'Synchronisée':'En attente'}</small><div class="row">${m.synced?'':`<button onclick="editFromPage(${i})">✏️ Modifier</button><button class="del" onclick="deleteFromPage(${i})">🗑️ Supprimer</button>`}</div></div>`}).join(''):'<div class="heard">Aucune mission locale.</div>';
 const remote=(window.charliPcMissions||[]).length?`<h3 style="color:#ffc431;margin-top:20px">Missions reçues de Charli STM</h3>`+(window.charliPcMissions||[]).slice().reverse().slice(0,25).map(m=>`<div class="pcMission"><b>${esc(m.title)}</b><small>${esc(m.team||'')} • ${esc(m.status||'')}${m.date?' • '+esc(m.date):''}</small></div>`).join(''):'';
 root.innerHTML=`<h3 style="color:#ffc431">Missions Terrain</h3>${local}${remote}`;
}
window.editFromPage=i=>{showScreen('home');openEdit(missions[i],i)};
window.deleteFromPage=i=>{if(confirm('Supprimer cette mission ?')){missions.splice(i,1);persist();renderMissionPage()}};

if($("planningBtn"))$("planningBtn").onclick=()=>{
 const a=window.charliPcMissions||[];
 $("planningList").innerHTML=a.length?a.slice().reverse().slice(0,30).map(m=>`<div class="mission"><b>${esc(m.title)}</b><small>${esc(m.team||'')} • ${esc(m.status||'')}${m.date?' • '+esc(m.date):''}</small></div>`).join(''):'<p>Aucune mission reçue de Charli STM. Lance une synchronisation manuelle.</p>';
 planningDlg.showModal();
};
if($("quickReport"))$("quickReport").onclick=()=>$('mic')?.click();
if($("historyBtn"))$("historyBtn").onclick=()=>showScreen('missions');
if($("photoBtn"))$("photoBtn").onclick=()=>$("photoInput")?.click();
if($("photoInput"))$("photoInput").onchange=e=>{
 const f=e.target.files?.[0];
 if(f)alert('Photo sélectionnée : '+f.name+'\n\nL’interface photo est prête. Le rattachement et le transfert de la photo à une mission seront raccordés au moteur de synchronisation dans l’étape suivante.');
 e.target.value='';
};
persist();

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
