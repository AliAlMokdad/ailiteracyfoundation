/* AI Economic Index - interactive views over window.AEI (Anthropic Economic Index, release 2026-06-26) */
(function(){
"use strict";
var D = window.AEI;
if(!D){return;}

/* ---- terracotta quartile ramp ---- */
var RAMP = [
  {bg:'#8E3F22', tx:'#FDFBF6', label:'Førende, top 25%'},
  {bg:'#B05433', tx:'#FDFBF6', label:'Øvre midte'},
  {bg:'#D08667', tx:'#15140F', label:'Nedre midte'},
  {bg:'#F0E2D8', tx:'#15140F', label:'Spirende, nederste 25%'}
];
function tier(rank, total){ var q=rank/total; if(q<0.25)return 0; if(q<0.5)return 1; if(q<0.75)return 2; return 3; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function refocus(sel){ try{ var el=document.querySelector(sel); if(el&&el.focus) el.focus(); }catch(e){} }
function fmtIdx(v){ return v.toFixed(2)+'×'; }
var STATE_NAMES={AK:'Alaska',AL:'Alabama',AR:'Arkansas',AZ:'Arizona',CA:'Californien',CO:'Colorado',CT:'Connecticut',DC:'Washington, D.C.',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',IA:'Iowa',ID:'Idaho',IL:'Illinois',IN:'Indiana',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',MA:'Massachusetts',MD:'Maryland',ME:'Maine',MI:'Michigan',MN:'Minnesota',MO:'Missouri',MS:'Mississippi',MT:'Montana',NC:'North Carolina',ND:'North Dakota',NE:'Nebraska',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NV:'Nevada',NY:'New York',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VA:'Virginia',VT:'Vermont',WA:'Washington',WI:'Wisconsin',WV:'West Virginia',WY:'Wyoming'};
var COUNTRY_NAMES={AUS:'Australien',SGP:'Singapore',CHE:'Schweiz',LUX:'Luxembourg',NZL:'New Zealand',CAN:'Canada',NOR:'Norge',ISL:'Island',MLT:'Malta',FRA:'Frankrig',NLD:'Nederlandene',USA:'USA',BEL:'Belgien',KOR:'Sydkorea',DNK:'Danmark',GBR:'Storbritannien',PRT:'Portugal',IRL:'Irland',EST:'Estland',CYP:'Cypern',ISR:'Israel',SWE:'Sverige',ARE:'Forenede Arabiske Emirater',ESP:'Spanien',AUT:'Østrig',DEU:'Tyskland',LVA:'Letland',LTU:'Litauen',FIN:'Finland',SVN:'Slovenien',TWN:'Taiwan',JPN:'Japan',URY:'Uruguay',CHL:'Chile',CZE:'Tjekkiet',GEO:'Georgien',HRV:'Kroatien',MUS:'Mauritius',ITA:'Italien',PRI:'Puerto Rico',QAT:'Qatar',CRI:'Costa Rica',GRC:'Grækenland',BHR:'Bahrain',ARG:'Argentina',MDA:'Moldova',SVK:'Slovakiet',TUN:'Tunesien',MNG:'Mongoliet',ROU:'Rumænien',BGR:'Bulgarien',POL:'Polen',SRB:'Serbien',PAN:'Panama',COL:'Colombia',HUN:'Ungarn',PER:'Peru',TTO:'Trinidad og Tobago',ALB:'Albanien',MKD:'Nordmakedonien',BRA:'Brasilien',LBN:'Libanon',ARM:'Armenien',SAU:'Saudi-Arabien',KWT:'Kuwait',MAR:'Marokko',MYS:'Malaysia',UKR:'Ukraine',OMN:'Oman',THA:'Thailand',KAZ:'Kasakhstan',DOM:'Den Dominikanske Republik',JAM:'Jamaica',JOR:'Jordan',TUR:'Tyrkiet',MEX:'Mexico',BIH:'Bosnien-Hercegovina',PRY:'Paraguay',SLV:'El Salvador',ECU:'Ecuador',BOL:'Bolivia',DZA:'Algeriet',LKA:'Sri Lanka',VNM:'Vietnam',BWA:'Botswana',IDN:'Indonesien',ZAF:'Sydafrika',NAM:'Namibia',PHL:'Filippinerne',AZE:'Aserbajdsjan',PSE:'Palæstina',NPL:'Nepal',SEN:'Senegal',BEN:'Benin',CMR:'Cameroun',GHA:'Ghana',GTM:'Guatemala',EGY:'Egypten',KGZ:'Kirgisistan',KEN:'Kenya',PAK:'Pakistan',CIV:'Elfenbenskysten',IND:'Indien',UZB:'Usbekistan',HND:'Honduras',COG:'Republikken Congo',IRQ:'Irak',NGA:'Nigeria',TGO:'Togo',KHM:'Cambodja',RWA:'Rwanda',ZWE:'Zimbabwe',BFA:'Burkina Faso',ZMB:'Zambia',HTI:'Haiti',BGD:'Bangladesh',UGA:'Uganda',AGO:'Angola',MDG:'Madagaskar',MOZ:'Mozambique',TZA:'Tanzania'};
var TOPIC_NAMES={'AI agent design':'Design af AI-agenter','AI app building':'Bygning af AI-apps','AI image generation':'AI-billedgenerering','API debugging':'API-fejlfinding','Account and billing':'Konto og fakturering','Accounting and bookkeeping':'Regnskab og bogføring','Animal behavior':'Dyreadfærd','Automated pipelines':'Automatiserede pipelines','Backend architecture':'Backend-arkitektur','Booking and scheduling':'Booking og planlægning','Business compliance':'Forretningscompliance','Business ideation':'Forretningsideer','Business operations':'Forretningsdrift','Buying and investing':'Køb og investering','CRM':'CRM','Career interview prep':'Forberedelse til jobsamtaler','Career navigation':'Karrierevalg','Certification and training':'Certificering og træning','Code design':'Kodedesign','Companionship and conversation':'Selskab og samtale','Company and deal research':'Virksomheds- og aftaleanalyse','Conversation and meeting intelligence':'Samtale- og mødeanalyse','Cooking':'Madlavning','Customer support and service':'Kundesupport og service','Dashboards and charts':'Dashboards og diagrammer','Data analysis':'Dataanalyse','Debugging':'Fejlfinding','Destination research':'Research om rejsemål','Dev environment setup':'Opsætning af udviklingsmiljø','Document transformation':'Dokumentomformning','Editing and rewriting':'Redigering og omskrivning','Education and learning - other':'Uddannelse og læring, andet','Emotional Wellbeing and Support':'Følelsesmæssig trivsel og støtte','Entertainment and Recreation':'Underholdning og fritid','Entitlements and rules':'Rettigheder og regler','Fashion shopping':'Modeindkøb','Fiction writing':'Skønlitterær skrivning','Financial modeling':'Finansiel modellering','Finding the best price':'At finde den bedste pris','Formatted writing':'Formateret skrivning','Gaming':'Gaming','Hobbies and lifestyle - other':'Hobbyer og livsstil, andet','Home furnishing and decor':'Boligindretning og dekoration','Home renovation':'Boligrenovering','Home tech setup':'Opsætning af hjemmeteknologi','Homework':'Lektier','Industry and sector knowledge':'Branche- og sektorkendskab','Instructional design':'Undervisningsdesign','Language and linguistics':'Sprog og lingvistik','Math and CS theory':'Matematik og datalogisk teori','Media discovery':'Medieopdagelse','Medical Questions':'Medicinske spørgsmål','Outdoor and garden':'Udendørs og have','Personal messages':'Personlige beskeder','Personal records':'Personlige dokumenter','Photo and video editing':'Foto- og videoredigering','Physical crafting':'Fysisk håndarbejde','Politics and public record':'Politik og offentlige kilder','Promotional writing':'Promoverende tekster','Publishing and announcements':'Udgivelse og annonceringer','Quality scoring':'Kvalitetsvurdering','Quant trading':'Kvantitativ handel','Reference and fact-finding':'Opslag og faktatjek','Reference documentation':'Referencedokumentation','Regulatory rules':'Regulatoriske regler','Relocation and travel':'Flytning og rejser','Research and evidence':'Research og dokumentation','Sales and revenue ops - other':'Salg og revenue operations, andet','Science':'Naturvidenskab','Self-presentation writing':'Selvpræsentation','Self-reflection':'Selvrefleksion','Server infrastructure':'Serverinfrastruktur','Shell and systems code':'Shell- og systemkode','Slide decks':'Præsentationer','Social science':'Samfundsvidenskab','Software development - other':'Softwareudvikling, andet','Software how-to':'Softwarevejledning','Spoken writing':'Mundtlig formidling på skrift','Starting a business':'At starte virksomhed','Structured extraction':'Struktureret udtræk','Summarizing':'Opsummering','Translation':'Oversættelse','Trend tracking':'Trendovervågning','Vehicles and motors':'Køretøjer og motorer','Video scripts':'Videomanuskripter','Web front-end':'Webfrontend','Wellness and fitness':'Velvære og fitness','Workplace writing':'Arbejdspladstekster'};
var JOB_TITLES={'Document Management Specialists':'Dokumentstyringsspecialister','Librarians and Media Collections Specialists':'Bibliotekarer og specialister i mediesamlinger','Counter and Rental Clerks':'Kunde- og udlejningsmedarbejdere','Editors':'Redaktører','Writers and Authors':'Skribenter og forfattere','Computer User Support Specialists':'Specialister i IT-brugersupport','Computer Systems Analysts':'IT-systemanalytikere','Web and Digital Interface Designers':'Web- og digitale interfacedesignere','Computer Programmers':'Programmører','Technical Writers':'Tekniske skribenter','Data Warehousing Specialists':'Data warehouse-specialister','News Analysts, Reporters, and Journalists':'Nyhedsanalytikere, reportere og journalister','Library Technicians':'Biblioteksteknikere','Credit Counselors':'Kreditrådgivere','Poets, Lyricists and Creative Writers':'Digtere, sangtekstforfattere og kreative skribenter','Sales Representatives, Wholesale and Manufacturing, Except Technical and Scientific Products':'Salgsrepræsentanter inden for engros og produktion, undtagen tekniske og videnskabelige produkter','Substitute Teachers, Short-Term':'Korttidsvikarer i undervisning','Software Quality Assurance Analysts and Testers':'Analytikere og testere inden for softwarekvalitet','Tutors':'Undervisere og tutorer','Word Processors and Typists':'Tekstbehandlere og maskinskrivere','Graphic Designers':'Grafiske designere','Computer Systems Engineers/Architects':'IT-systemingeniører og -arkitekter','Instructional Coordinators':'Undervisningskoordinatorer','Mathematicians':'Matematikere','Cashiers':'Kassemedarbejdere','Interpreters and Translators':'Tolke og oversættere','Geographic Information Systems Technologists and Technicians':'Teknologer og teknikere inden for geografiske informationssystemer','Demonstrators and Product Promoters':'Produktdemonstratører og promotere','Cardiologists':'Kardiologer','Insurance Claims and Policy Processing Clerks':'Medarbejdere til forsikringskrav og policebehandling'};
var REQUEST_NAMES={'Business Process & Operations':'Forretningsprocesser og drift','Content Creation & Copywriting':'Indholdsproduktion og tekstforfatning','Data Analysis & Business Intelligence':'Dataanalyse og business intelligence','DevOps & Infrastructure Operations':'DevOps og infrastrukturdrift','Document Processing & Extraction':'Dokumentbehandling og udtræk','Education & Learning':'Uddannelse og læring','Existential, Relational, and Emotional Support':'Eksistentiel, relationel og følelsesmæssig støtte','Hobbies & Lifestyle':'Hobbyer og livsstil','Knowledge Retrieval & Enterprise Search':'Videnssøgning og virksomhedssøgning','Personal AI Assistant':'Personlig AI-assistent','Research & Intelligence':'Research og efterretning','Sales & Revenue Operations':'Salg og revenue operations','Software Development':'Softwareudvikling'};
var ARTIFACT_NAMES={explanation_or_answer:'Forklaring eller svar',document_or_report:'Dokument eller rapport',advice_or_recommendation:'Råd eller anbefaling',analysis_or_summary:'Analyse eller opsummering',email_or_message:'E-mail eller besked',app_or_website:'App eller website',plan_or_strategy:'Plan eller strategi',code_fix_or_debug:'Kode, rettelse eller fejlfinding',data_or_spreadsheet:'Data eller regneark',script_or_snippet:'Script eller kodestykke',educational_material:'Undervisningsmateriale',marketing_or_social_content:'Marketing- eller SoMe-indhold',presentation_or_slides:'Præsentation eller slides',chart_or_visualization:'Diagram eller visualisering',resume_or_job_application:'CV eller jobansøgning',config_or_infra:'Konfiguration eller infrastruktur',math_or_calculation:'Matematik eller beregning',creative_writing:'Kreativ skrivning',academic_paper_or_thesis:'Akademisk opgave eller speciale',image_or_graphic:'Billede eller grafik',ui_or_design_mockup:'UI- eller designmockup',translation:'Oversættelse',idea_or_brainstorm:'Ide eller brainstorm',recipe_or_meal_plan:'Opskrift eller madplan',blog_or_article:'Blogindlæg eller artikel',ml_or_ai_system:'ML- eller AI-system',sql_or_database_query:'SQL- eller databaseforespørgsel',game_or_interactive:'Spil eller interaktivt element',video_or_animation:'Video eller animation',other:'Andet',audio_or_music:'Lyd eller musik'};
function keyText(s){ return String(s).replace(/\u2014/g,'-'); }
function daState(s){ return STATE_NAMES[s.abbr]||s.name; }
function daCountry(c){ return COUNTRY_NAMES[c.code]||c.name; }
function daTopic(t){ return TOPIC_NAMES[keyText(t.name)]||t.name; }
function daJob(j){ return JOB_TITLES[j.title]||j.title; }
function daRequest(r){ return REQUEST_NAMES[r.name]||r.name; }
function daArtifact(label){ return ARTIFACT_NAMES[label]||String(label).replace(/_/g,' '); }

/* ================= HERO STATS ================= */
(function(){
  var el=document.getElementById('aeiStats'); if(!el)return;
  var s=D.snapshot||{};
  var cards=[
    {n:(s.USA&&s.USA.usage_per_capita_index?s.USA.usage_per_capita_index.toFixed(2):'3.87')+'×', k:"USA's brugsindeks, maj 2026"},
    {n:(s.DNK&&s.DNK.usage_per_capita_index?s.DNK.usage_per_capita_index.toFixed(2):'3.57')+'×', k:'Danmarks brugsindeks'},
    {n:Math.round(s.global&&s.global.collaboration_bucket_augmentation_pct?s.global.collaboration_bucket_augmentation_pct:51)+'%', k:'Samarbejdende brug, globalt'},
    {n:(D.meta&&D.meta.n_countries?D.meta.n_countries:D.countries.length), k:'Lande målt'}
  ];
  el.innerHTML=cards.map(function(c){return '<div class="aei-stat"><div class="n"><b>'+esc(c.n)+'</b></div><div class="k">'+esc(c.k)+'</div></div>';}).join('');
})();

/* ================= LEGENDS ================= */
function legendHTML(){
  return RAMP.map(function(r){return '<span class="lg"><span class="sw" style="background:'+r.bg+'"></span>'+esc(r.label)+'</span>';}).join('');
}
['usLegend','worldLegend','euLegend'].forEach(function(id){ var el=document.getElementById(id); if(el)el.innerHTML=legendHTML(); });

/* ================= US VIEW ================= */
var US = (function(){
  var POS={AK:[0,0],ME:[10,0],WI:[5,1],VT:[9,1],NH:[10,1],WA:[0,2],ID:[1,2],MT:[2,2],ND:[3,2],MN:[4,2],IL:[5,2],MI:[6,2],NY:[8,2],MA:[9,2],RI:[10,2],OR:[0,3],NV:[1,3],WY:[2,3],SD:[3,3],IA:[4,3],IN:[5,3],OH:[6,3],PA:[7,3],NJ:[8,3],CT:[9,3],CA:[0,4],UT:[1,4],CO:[2,4],NE:[3,4],MO:[4,4],KY:[5,4],WV:[6,4],VA:[7,4],MD:[8,4],DE:[9,4],AZ:[1,5],NM:[2,5],KS:[3,5],AR:[4,5],TN:[5,5],NC:[6,5],SC:[7,5],DC:[8,5],OK:[3,6],LA:[4,6],MS:[5,6],AL:[6,6],GA:[7,6],HI:[0,7],TX:[3,7],FL:[8,7]};
  var states=D.states.slice(); // already sorted desc by idx
  var total=states.length;
  var byAbbr={}; states.forEach(function(s,i){ s.rank=i+1; s.t=tier(i,total); s.daName=daState(s); byAbbr[s.abbr]=s; });
  var sel='DC', base=null, topicMode='freq';
  var STEP=42, TILE=38;

  function buildMap(){
    var w=11*STEP-(STEP-TILE), h=8*STEP-(STEP-TILE);
    var parts=['<svg viewBox="0 0 '+w+' '+h+'" role="group">'];
    states.forEach(function(s){
      var p=POS[s.abbr]; if(!p)return;
      var x=p[0]*STEP, y=p[1]*STEP, r=RAMP[s.t];
      parts.push(
        '<g class="aei-tile" data-abbr="'+s.abbr+'" tabindex="0" role="button" aria-label="'+esc(s.daName)+', Brugsindeks '+s.idx.toFixed(2)+', brugsplacering '+s.rank+' af '+total+'. Vælg for at se detaljer.">'+
        '<rect x="'+x+'" y="'+y+'" width="'+TILE+'" height="'+TILE+'" rx="5" fill="'+r.bg+'" stroke="rgba(255,255,255,.55)" stroke-width="1"></rect>'+
        '<text x="'+(x+TILE/2)+'" y="'+(y+TILE/2+3.5)+'" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="'+r.tx+'" style="pointer-events:none">'+s.abbr+'</text>'+
        '</g>');
    });
    parts.push('</svg>');
    document.getElementById('usMap').innerHTML=parts.join('');
  }
  function buildBoard(){
    var pinned = base?byAbbr[base]:null;
    document.getElementById('usBoardTitle').textContent = pinned? ('Sammenlignet med '+shortName(pinned.daName)) : 'Delstater efter brugsindeks';
    var rows=states.map(function(s){
      var r=RAMP[s.t];
      var dl = pinned? ('<span class="dl">'+ (s.idx/pinned.idx).toFixed(2) +'×</span>') : '';
      return '<button class="aei-row'+(s.abbr===sel?' sel':'')+'" data-abbr="'+s.abbr+'">'+
        '<span class="rk">'+s.rank+'</span>'+
        '<span class="sq" style="background:'+r.bg+'"></span>'+
        '<span class="nm">'+esc(s.daName)+'</span>'+
        '<span class="vl">'+s.idx.toFixed(2)+'</span>'+ dl +
        '</button>';
    });
    document.getElementById('usBoard').innerHTML=rows.join('');
  }
  function panel(){
    var s=byAbbr[sel]; var el=document.getElementById('usPanel');
    var tp=(D.stateTopics&&D.stateTopics[sel])||{freq:[],dist:[]};
    var list = topicMode==='freq'?tp.freq:tp.dist;
    var cap = topicMode==='freq'? ('Hyppigste emner i '+s.daName) : ('Mest kendetegnende emner for '+s.daName+', i forhold til USA');
    var ex=(D.stateExtra&&D.stateExtra[s.abbr])||{};
    var scaleMax=4;
    var fillW=Math.min(100, s.idx/scaleMax*100);
    var tickL=(1/scaleMax*100);
    var pinned=base?byAbbr[base]:null;
    var deltaLine = pinned && pinned.abbr!==s.abbr ? ('<div class="aei-pdelta">Sammenlignet med <b>'+esc(shortName(pinned.daName))+'</b>: '+(s.idx/pinned.idx).toFixed(2)+'× af udgangspunktets intensitet</div>') : '';
    var topics = list && list.length ? list.map(function(t,i){
      var val = topicMode==='freq'? ((t.pct!=null?t.pct.toFixed(1):'-')+'%') : ((t.ratio!=null?t.ratio.toFixed(1):'-')+'×');
      return '<li><span class="ti">'+(i+1)+'</span><span class="tn">'+esc(daTopic(t))+'</span><span class="tv">'+val+'</span></li>';
    }).join('') : '<li><span class="tn" style="color:var(--ink-quiet)">Ikke offentliggjort for denne delstat.</span></li>';
    el.innerHTML=
      '<p class="ph">Brugsplacering '+s.rank+' af '+total+'</p>'+
      '<div class="aei-pname">'+esc(s.daName)+'</div>'+
      '<div class="aei-pidxrow"><span class="aei-pidx">'+fmtIdx(s.idx)+'</span><span class="aei-pidxlbl">Brugsindeks</span></div>'+
      deltaLine+
      '<div class="aei-meter"><div class="fill" style="width:'+fillW.toFixed(0)+'%"></div><span class="tick" style="left:'+tickL.toFixed(1)+'%"></span></div>'+
      '<div class="aei-metercap"><span>0</span><span>1,0 forventet</span><span>4.0</span></div>'+
      (ex.collaboration_bucket_augmentation_pct!=null?
        '<div class="aei-pdiv"></div><div class="aei-mini">'+
        '<div class="aei-minicell"><div class="mv">'+Math.round(ex.collaboration_bucket_augmentation_pct)+'%</div><div class="mk">Samarbejde</div></div>'+
        '<div class="aei-minicell"><div class="mv">'+(ex.use_case_work_pct!=null?Math.round(ex.use_case_work_pct):'--')+'%</div><div class="mk">Arbejde</div></div>'+
        '<div class="aei-minicell"><div class="mv">'+(ex.ai_autonomy_mean!=null?ex.ai_autonomy_mean.toFixed(1):'--')+'</div><div class="mk">Autonomi / 5</div></div>'+
        '</div>':'')+
      '<div class="aei-topichead"><span class="cap">'+esc(cap)+'</span></div>'+
      '<div class="aei-seg mini" role="group" aria-label="Emnerangering"><button data-tm="freq" aria-pressed="'+(topicMode==='freq')+'">Hyppige</button><button data-tm="dist" aria-pressed="'+(topicMode==='dist')+'">Kendetegnende</button></div>'+
      '<ul class="aei-topics" style="margin-top:.7rem">'+topics+'</ul>'+
      '<button class="aei-pinbtn'+(base===sel?' active':'')+'" data-pin="'+s.abbr+'">'+(base===sel?'Fastgjort som udgangspunkt':'Fastgør '+esc(shortName(s.daName))+' som udgangspunkt')+'</button>';
  }
  function shortName(n){ return n.replace('Washington, D.C.','D.C.'); }
  function chip(){
    var c=document.getElementById('usBaseChip');
    if(base){ var b=byAbbr[base]; c.className='aei-basechip on'; c.innerHTML='Udgangspunkt <b>'+esc(shortName(b.daName))+' '+fmtIdx(b.idx)+'</b><button aria-label="Ryd udgangspunkt" data-clear="1">×</button>'; }
    else { c.className='aei-basechip'; c.innerHTML=''; }
  }
  function marks(){
    document.querySelectorAll('#usMap .aei-tile').forEach(function(g){
      g.classList.toggle('sel', g.getAttribute('data-abbr')===sel);
      g.classList.toggle('base', g.getAttribute('data-abbr')===base);
    });
  }
  function selectState(a){ if(!byAbbr[a])return; sel=a; buildBoard(); panel(); marks(); }
  function repaint(){ buildBoard(); panel(); chip(); marks(); } // pin/clear: no map rebuild, keeps tile focus
  function render(){ buildMap(); buildBoard(); panel(); chip(); marks(); }

  function wire(){
    var map=document.getElementById('usMap');
    map.addEventListener('click',function(e){ var g=e.target.closest('.aei-tile'); if(g)selectState(g.getAttribute('data-abbr')); });
    map.addEventListener('keydown',function(e){ var g=e.target.closest('.aei-tile'); if(g&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); selectState(g.getAttribute('data-abbr')); } });
    document.getElementById('usBoard').addEventListener('click',function(e){ var b=e.target.closest('.aei-row'); if(b){ var a=b.getAttribute('data-abbr'); selectState(a); refocus('#usBoard [data-abbr="'+a+'"]'); } });
    document.getElementById('usPanel').addEventListener('click',function(e){
      var tm=e.target.closest('[data-tm]'); if(tm){ topicMode=tm.getAttribute('data-tm'); panel(); refocus('#usPanel [data-tm="'+topicMode+'"]'); return; }
      var pin=e.target.closest('[data-pin]'); if(pin){ var a=pin.getAttribute('data-pin'); base=(base===a?null:a); repaint(); refocus('#usPanel .aei-pinbtn'); return; }
    });
    document.getElementById('usBaseChip').addEventListener('click',function(e){ if(e.target.closest('[data-clear]')){ base=null; repaint(); refocus('#usPanel .aei-pinbtn'); } });
  }
  return { render:render, wire:wire };
})();

/* ================= COUNTRY VIEWS (World + Europe) ================= */
var EUROPE_CODES={AUT:1,BEL:1,BGR:1,HRV:1,CYP:1,CZE:1,DNK:1,EST:1,FIN:1,FRA:1,DEU:1,GRC:1,HUN:1,IRL:1,ITA:1,LVA:1,LTU:1,LUX:1,MLT:1,NLD:1,POL:1,PRT:1,ROU:1,SVK:1,SVN:1,ESP:1,SWE:1,GBR:1,CHE:1,NOR:1,ISL:1,UKR:1,SRB:1,BIH:1,ALB:1,MKD:1,MNE:1,MDA:1,BLR:1,XKX:1};
function euCountries(){ return D.countries.filter(function(c){ return EUROPE_CODES[c.code]; }); }

function geoView(cfg){
  var G=cfg.ids, scaleMax=cfg.scaleMax||6.5, rankNote=cfg.rankNote||'';
  var countries=cfg.countries.map(function(c){ return {code:c.code,name:daCountry(c),idx:c.idx,share:c.share}; }); // clone so views do not clobber each other
  var total=countries.length;
  var byCode={}; countries.forEach(function(c,i){ c.rank=i+1; c.t=tier(i,total); byCode[c.code]=c; });
  var sel=(cfg.defaultSel&&byCode[cfg.defaultSel])?cfg.defaultSel:(countries[0]&&countries[0].code), base=null, topicMode='freq';
  function el(id){ return document.getElementById(id); }
  function buildGrid(){
    el(G.grid).innerHTML=countries.map(function(c){
      var r=RAMP[c.t];
      return '<button class="aei-ctile'+(c.code===sel?' sel':'')+(c.code===base?' base':'')+'" data-code="'+c.code+'" style="background:'+r.bg+';color:'+r.tx+'" aria-label="'+esc(c.name)+', Brugsindeks '+c.idx.toFixed(2)+', brugsplacering '+c.rank+'. Vælg for at se detaljer.">'+
        '<span class="cc">'+esc(c.code)+'</span><span class="cv">'+c.idx.toFixed(2)+'</span></button>';
    }).join('');
  }
  function buildBoard(){
    var pinned=base?byCode[base]:null;
    el(G.board).innerHTML=countries.map(function(c){
      var r=RAMP[c.t];
      var dl=pinned?('<span class="dl">'+(c.idx/pinned.idx).toFixed(2)+'×</span>'):'';
      return '<button class="aei-row'+(c.code===sel?' sel':'')+'" data-code="'+c.code+'">'+
        '<span class="rk">'+c.rank+'</span><span class="sq" style="background:'+r.bg+'"></span>'+
        '<span class="nm">'+esc(c.name)+'</span><span class="vl">'+c.idx.toFixed(2)+'</span>'+dl+'</button>';
    }).join('');
  }
  function panel(){
    var c=byCode[sel];
    var tp=(D.countryTopics&&D.countryTopics[sel])||null;
    var list = tp? (topicMode==='freq'?tp.freq:tp.dist) : [];
    var cap = topicMode==='freq'? ('Hyppigste emner i '+c.name) : ('Mest kendetegnende emner for '+c.name+', i forhold til verden');
    var fillW=Math.min(100,c.idx/scaleMax*100), tickL=(1/scaleMax*100);
    var pinned=base?byCode[base]:null;
    var deltaLine = pinned && pinned.code!==c.code ? ('<div class="aei-pdelta">Sammenlignet med <b>'+esc(pinned.name)+'</b>: '+(c.idx/pinned.idx).toFixed(2)+'× af udgangspunktets intensitet</div>') : '';
    var topics = list && list.length ? list.map(function(t,i){
      var val=topicMode==='freq'?((t.pct!=null?t.pct.toFixed(1):'-')+'%'):((t.ratio!=null?t.ratio.toFixed(1):'-')+'×');
      return '<li><span class="ti">'+(i+1)+'</span><span class="tn">'+esc(daTopic(t))+'</span><span class="tv">'+val+'</span></li>';
    }).join('') : '<li><span class="tn" style="color:var(--ink-quiet)">Emnedata er ikke offentliggjort for dette land.</span></li>';
    var shareTxt = c.share>0 ? (c.share.toFixed(2)+'% af al målt brug') : 'Andel ikke offentliggjort';
    el(G.panel).innerHTML=
      '<p class="ph">Brugsplacering '+c.rank+' af '+total+rankNote+'</p>'+
      '<div class="aei-pname">'+esc(c.name)+'</div>'+
      '<div class="aei-pidxrow"><span class="aei-pidx">'+fmtIdx(c.idx)+'</span><span class="aei-pidxlbl">Brugsindeks</span></div>'+
      deltaLine+
      '<div class="aei-meter"><div class="fill" style="width:'+fillW.toFixed(0)+'%"></div><span class="tick" style="left:'+tickL.toFixed(1)+'%"></span></div>'+
      '<div class="aei-metercap"><span>0</span><span>1,0 forventet</span><span>'+scaleMax.toFixed(1)+'</span></div>'+
      '<div class="aei-pdelta" style="margin-top:.55rem">'+esc(shareTxt)+'</div>'+
      '<div class="aei-pdiv"></div>'+
      '<div class="aei-topichead"><span class="cap">'+esc(cap)+'</span></div>'+
      '<div class="aei-seg mini" role="group" aria-label="Emnerangering"><button data-tm="freq" aria-pressed="'+(topicMode==='freq')+'">Hyppige</button><button data-tm="dist" aria-pressed="'+(topicMode==='dist')+'">Kendetegnende</button></div>'+
      '<ul class="aei-topics" style="margin-top:.7rem">'+topics+'</ul>'+
      '<button class="aei-pinbtn'+(base===sel?' active':'')+'" data-pin="'+c.code+'">'+(base===sel?'Fastgjort som udgangspunkt':'Fastgør '+esc(c.name)+' som udgangspunkt')+'</button>';
  }
  function chip(){
    if(!G.chip) return; var box=el(G.chip);
    if(base){ var b=byCode[base]; box.className='aei-basechip on'; box.innerHTML='Udgangspunkt <b>'+esc(b.name)+' '+fmtIdx(b.idx)+'</b><button aria-label="Ryd udgangspunkt" data-clear="1">×</button>'; }
    else { box.className='aei-basechip'; box.innerHTML=''; }
  }
  function shareBars(){
    if(!G.share) return;
    var arr=(cfg.shareData||[]).slice(0,15); if(!arr.length){ el(G.share).innerHTML=''; return; }
    var max=arr[0].share||1;
    el(G.share).innerHTML=arr.map(function(c){
      return '<div class="aei-bar"><span class="bl">'+esc(daCountry(c))+'</span><span class="bt"><i style="width:'+((c.share||0)/max*100).toFixed(1)+'%"></i></span><span class="bv">'+(c.share!=null?c.share.toFixed(1):'-')+'%</span></div>';
    }).join('');
  }
  function marks(){
    document.querySelectorAll('#'+G.grid+' .aei-ctile').forEach(function(b){
      b.classList.toggle('sel', b.getAttribute('data-code')===sel);
      b.classList.toggle('base', b.getAttribute('data-code')===base);
    });
  }
  function selectC(code){ if(!byCode[code])return; sel=code; buildBoard(); panel(); marks(); }
  function repaint(){ buildBoard(); panel(); chip(); marks(); } // pin/clear: no grid rebuild, keeps tile focus
  function render(){ buildGrid(); buildBoard(); panel(); chip(); shareBars(); marks(); }
  function wire(){
    el(G.grid).addEventListener('click',function(e){ var b=e.target.closest('.aei-ctile'); if(b)selectC(b.getAttribute('data-code')); });
    el(G.board).addEventListener('click',function(e){ var b=e.target.closest('.aei-row'); if(b){ var a=b.getAttribute('data-code'); selectC(a); refocus('#'+G.board+' [data-code="'+a+'"]'); } });
    el(G.panel).addEventListener('click',function(e){
      var tm=e.target.closest('[data-tm]'); if(tm){ topicMode=tm.getAttribute('data-tm'); panel(); refocus('#'+G.panel+' [data-tm="'+topicMode+'"]'); return; }
      var pin=e.target.closest('[data-pin]'); if(pin){ var a=pin.getAttribute('data-pin'); base=(base===a?null:a); repaint(); refocus('#'+G.panel+' .aei-pinbtn'); return; }
    });
    if(G.chip) el(G.chip).addEventListener('click',function(e){ if(e.target.closest('[data-clear]')){ base=null; repaint(); refocus('#'+G.panel+' .aei-pinbtn'); } });
    if(G.dkPin){ var d=el(G.dkPin); if(d) d.addEventListener('click',function(){ if(byCode.DNK){ base='DNK'; sel='DNK'; repaint(); refocus('#'+G.dkPin); } }); }
  }
  return { render:render, wire:wire };
}

var WORLD = geoView({ countries:D.countries, shareData:D.countryShare, ids:{grid:'worldGrid',board:'worldBoard',panel:'worldPanel',chip:'worldBaseChip',dkPin:'dkPin',share:'worldShare'} });
var EUROPE = geoView({ countries:euCountries(), defaultSel:'DNK', rankNote:' i Europa', ids:{grid:'euGrid',board:'euBoard',panel:'euPanel',chip:'euBaseChip',dkPin:'euDkPin'} });

/* ================= DENMARK VIEW ================= */
var DENMARK = (function(){
  var topicMode='freq';
  function render(){
    var dnk=null, wr=0;
    for(var i=0;i<D.countries.length;i++){ if(D.countries[i].code==='DNK'){ dnk=D.countries[i]; wr=i+1; break; } }
    var box=document.getElementById('dkProfile');
    if(!dnk){ box.innerHTML='<div class="aei-card">Data for Danmark er ikke offentliggjort i denne udgivelse.</div>'; return; }
    var eu=euCountries(), er=0; for(var j=0;j<eu.length;j++){ if(eu[j].code==='DNK'){ er=j+1; break; } }
    var sn=(D.snapshot&&D.snapshot.DNK)||{}, g=(D.snapshot&&D.snapshot.global)||{};
    var scaleMax=6.5, fillW=Math.min(100,dnk.idx/scaleMax*100), tickL=1/scaleMax*100;
    function bar(cls,pct){ return '<div class="b '+cls+'"><i style="width:'+Math.max(0,Math.min(100,pct)).toFixed(0)+'%"></i></div>'; }
    function cmpRow(label,dk,wd){
      if(dk==null||wd==null) return '';
      return '<div class="crow"><div class="rl"><span>'+label+'</span><span><b>'+Math.round(dk)+'%</b> Danmark · '+Math.round(wd)+'% verden</span></div>'+
        bar('dk',dk)+bar('wd',wd)+'</div>';
    }
    var rows=cmpRow('Samarbejde, hvor man arbejder med AI', sn.collaboration_bucket_augmentation_pct, g.collaboration_bucket_augmentation_pct)+
             cmpRow('Automatisering, opgaver uddelegeres', sn.collaboration_bucket_automation_pct, g.collaboration_bucket_automation_pct)+
             cmpRow('Arbejde', sn.use_case_work_pct, g.use_case_work_pct)+
             cmpRow('Privat brug', sn.use_case_personal_pct, g.use_case_personal_pct)+
             cmpRow('Studier', sn.use_case_coursework_pct, g.use_case_coursework_pct);
    var tp=(D.countryTopics&&D.countryTopics.DNK)||{freq:[],dist:[]};
    var tl=topicMode==='freq'?tp.freq:tp.dist;
    var cap=topicMode==='freq'?'Hyppigste emner i Danmark':'Mest kendetegnende emner for Danmark, i forhold til verden';
    var topics=(tl&&tl.length)?tl.map(function(t,i){ var val=topicMode==='freq'?((t.pct!=null?t.pct.toFixed(1):'--')+'%'):((t.ratio!=null?t.ratio.toFixed(1):'--')+'×'); return '<li><span class="ti">'+(i+1)+'</span><span class="tn">'+esc(daTopic(t))+'</span><span class="tv">'+val+'</span></li>'; }).join(''):'<li><span class="tn" style="color:var(--ink-quiet)">Ikke offentliggjort.</span></li>';
    var autonomy=sn.ai_autonomy_mean!=null?sn.ai_autonomy_mean.toFixed(1):'--';
    box.innerHTML=
      '<div class="aei-dkgrid">'+
        '<div class="aei-card aei-panel">'+
          '<p class="ph">Danmark - Brugsindeks</p>'+
          '<div class="aei-pname">Danmark</div>'+
          '<div class="aei-pidxrow"><span class="aei-pidx">'+fmtIdx(dnk.idx)+'</span><span class="aei-pidxlbl">gange verdensgennemsnittet</span></div>'+
          '<div class="aei-pdelta">Placering i verden <b>'+wr+' af '+D.countries.length+'</b>'+(er?(' &middot; Placering i Europa <b>'+er+' af '+eu.length+'</b>'):'')+'</div>'+
          '<div class="aei-meter"><div class="fill" style="width:'+fillW.toFixed(0)+'%"></div><span class="tick" style="left:'+tickL.toFixed(1)+'%"></span></div>'+
          '<div class="aei-metercap"><span>0</span><span>1,0 forventet</span><span>6.5</span></div>'+
          '<div class="aei-pdiv"></div>'+
          '<div class="aei-mini">'+
            '<div class="aei-minicell"><div class="mv">'+(sn.collaboration_bucket_augmentation_pct!=null?Math.round(sn.collaboration_bucket_augmentation_pct):'--')+'%</div><div class="mk">Samarbejde</div></div>'+
            '<div class="aei-minicell"><div class="mv">'+(sn.use_case_work_pct!=null?Math.round(sn.use_case_work_pct):'--')+'%</div><div class="mk">Arbejde</div></div>'+
            '<div class="aei-minicell"><div class="mv">'+autonomy+'</div><div class="mk">Autonomi / 5</div></div>'+
          '</div>'+
          '<p class="aei-dknote">Danmark bruger Claude langt over sin befolkningsandel og hælder mod samarbejde frem for ren automatisering.</p>'+
        '</div>'+
        '<div class="aei-card">'+
          '<div style="font-family:var(--serif);font-size:1.2rem;font-weight:600;margin:0 0 1.1rem;color:var(--ink)">Danmark sammenlignet med verden</div>'+
          '<div class="aei-cmp">'+rows+'</div>'+
        '</div>'+
      '</div>'+
      '<div class="aei-card">'+
        '<div class="aei-topichead" style="margin-top:0"><span class="cap">'+esc(cap)+'</span></div>'+
        '<div class="aei-seg mini" role="group" aria-label="Emnerangering"><button data-tm="freq" aria-pressed="'+(topicMode==='freq')+'">Hyppige</button><button data-tm="dist" aria-pressed="'+(topicMode==='dist')+'">Kendetegnende</button></div>'+
        '<ul class="aei-topics aei-dktopics" style="margin-top:.9rem">'+topics+'</ul>'+
      '</div>';
  }
  function wire(){
    document.getElementById('dkProfile').addEventListener('click',function(e){
      var tm=e.target.closest('[data-tm]'); if(tm){ topicMode=tm.getAttribute('data-tm'); render(); refocus('#dkProfile [data-tm="'+topicMode+'"]'); }
    });
  }
  return { render:render, wire:wire };
})();

/* ================= USE VIEW ================= */
var USE = (function(){
  function jobs(){
    var el=document.getElementById('useJobs');
    var arr=(D.jobs||[]).slice(0,24);
    el.innerHTML=arr.map(function(j){
      var aug=j.aug!=null?j.aug:0, auto=j.auto!=null?j.auto:0, sum=aug+auto;
      var aw=sum>0?(aug/sum*100):50, bw=100-aw;
      var dot=j.mode==='aug'?'var(--accent)':'var(--chart-neutral)';
      var meta = sum>0 ? ('Samarbejde '+Math.round(aug)+'% · Automatisering '+Math.round(auto)+'%') : 'Fordeling ikke offentliggjort';
      return '<div class="aei-job"><div class="jt"><span class="jd" style="background:'+dot+'"></span><span class="jname">'+esc(daJob(j))+'</span></div>'+
        '<div class="jpct">'+(j.pct!=null?j.pct.toFixed(2):'--')+'% af brugen</div>'+
        '<div class="jsplit"><span class="a" style="width:'+aw.toFixed(0)+'%"></span><span class="b" style="width:'+bw.toFixed(0)+'%"></span></div>'+
        '<div class="jmeta">'+meta+'</div></div>';
    }).join('');
  }
  var divKey='global';
  function diverge(){
    var s=D.snapshot||{}, a;
    if(divKey==='api'){ a={auto:D.api.automation, aug:D.api.augmentation, autonomy:D.api.autonomy}; }
    else { var g=s[divKey]||s.global; a={auto:g.collaboration_bucket_automation_pct, aug:g.collaboration_bucket_augmentation_pct, autonomy:g.ai_autonomy_mean}; }
    var auto=a.auto||0, aug=a.aug||0, sum=auto+aug||100;
    var autoW=auto/sum*100, augW=aug/sum*100;
    document.getElementById('divChart').innerHTML=
      '<div class="aei-dtrack"><div class="auto" style="width:'+autoW.toFixed(1)+'%"><span>'+auto.toFixed(0)+'%</span></div>'+
      '<div class="aug" style="width:'+augW.toFixed(1)+'%"><span>'+aug.toFixed(0)+'%</span></div></div>'+
      '<div class="aei-dlegend"><span class="lg"><span class="sw" style="background:var(--chart-neutral)"></span>Automatisering, uddelegeret</span>'+
      '<span class="lg"><span class="sw" style="background:var(--accent)"></span>Samarbejde</span>'+
      (a.autonomy!=null?'<span class="lg" style="margin-left:auto">AI-autonomi '+a.autonomy.toFixed(1)+' ud af 5</span>':'')+'</div>';
  }
  function artifacts(){
    var arr=(D.artifacts||[]).slice(0,6);
    var pal=['#8E3F22','#B05433','#C77049','#D08667','#DFA588','#EBCBB6'];
    var squares=[], legend=[];
    arr.forEach(function(a,i){
      var n=Math.max(1,Math.round(a.pct||0));
      for(var k=0;k<n;k++) squares.push(pal[i]);
      legend.push('<div class="lg"><span class="sw" style="background:'+pal[i]+'"></span>'+esc(daArtifact(a.label))+'<b>'+(a.pct!=null?a.pct.toFixed(1):'--')+'%</b></div>');
    });
    squares=squares.slice(0,100);
    while(squares.length<100) squares.push('var(--bg-deep)');
    document.getElementById('artWaffle').innerHTML=squares.map(function(c){return '<span style="background:'+c+'"></span>';}).join('');
    legend.push('<div class="lg"><span class="sw" style="background:var(--bg-deep)"></span>Alt andet<b>'+Math.max(0,100-squares.filter(function(c){return c!=='var(--bg-deep)';}).length)+'%</b></div>');
    document.getElementById('artLegend').innerHTML=legend.join('');
  }
  var reqKey='global';
  function requests(){
    var arr=(reqKey==='us'?D.reqUS:D.reqGlobal)||[]; if(!arr.length)return;
    var max=arr[0].pct||1;
    document.getElementById('reqBars').innerHTML=arr.map(function(r){
      return '<div class="aei-bar"><span class="bl">'+esc(daRequest(r))+'</span><span class="bt"><i style="width:'+((r.pct||0)/max*100).toFixed(1)+'%"></i></span><span class="bv">'+(r.pct!=null?r.pct.toFixed(1):'--')+'%</span></div>';
    }).join('');
  }
  function render(){ jobs(); diverge(); artifacts(); requests(); }
  function wire(){
    document.getElementById('divToggle').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; divKey=b.getAttribute('data-k'); setPressed('divToggle',b); diverge(); });
    document.getElementById('reqToggle').addEventListener('click',function(e){ var b=e.target.closest('button'); if(!b)return; reqKey=b.getAttribute('data-k'); setPressed('reqToggle',b); requests(); });
  }
  return { render:render, wire:wire };
})();

function setPressed(groupId, btn){
  document.querySelectorAll('#'+groupId+' button').forEach(function(b){ b.setAttribute('aria-pressed', String(b===btn)); });
}

/* ================= INSIGHTS ================= */
(function(){
  var el=document.getElementById('aeiInsights'); if(!el)return;
  var ins=[
    {t:"USA's brug skiller sig ud", h:'I maj 2026 havde USA et brugsindeks på <b>3.87</b> og omkring <b>20%</b> af al målt Claude.ai-brug.'},
    {t:'Forskellene mellem delstater er store', h:'Washington, D.C. lå højest blandt alle delstater med <b>3.32</b>. West Virginia lå lavest med <b>0.25</b>, en forskel på mere end en faktor ti.'},
    {t:'Danmark hælder mod samarbejde', h:'Danmark brugte AI <b>3.57</b> gange over sin befolkningsandel og hældte mod samarbejde: <b>58%</b> samarbejde mod <b>42%</b> automatisering.'},
    {t:'API-brug er en anden verden', h:'Personlig chat lå næsten lige, med <b>51%</b> samarbejde. Udvikler-API&rsquo;et var <b>94%</b> automatisering, maskiner der udfører uddelegeret arbejde.'}
  ];
  el.innerHTML=ins.map(function(i){return '<div class="aei-ins"><p class="it">'+esc(i.t)+'</p><p>'+i.h+'</p></div>';}).join('');
})();

/* ================= MODE SWITCH ================= */
(function(){
  var rendered={denmark:false,europe:false,us:false,world:false,use:false};
  function show(mode){
    ['denmark','europe','us','world','use'].forEach(function(m){
      var v=document.getElementById('view-'+m); if(v) v.classList.toggle('on', m===mode);
    });
    document.querySelectorAll('#aeiModes button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-mode')===mode)); });
    if(!rendered[mode]){
      if(mode==='denmark') DENMARK.render();
      else if(mode==='europe') EUROPE.render();
      else if(mode==='us') US.render();
      else if(mode==='world') WORLD.render();
      else USE.render();
      rendered[mode]=true;
    }
  }
  document.getElementById('aeiModes').addEventListener('click',function(e){ var b=e.target.closest('button'); if(b)show(b.getAttribute('data-mode')); });
  DENMARK.wire(); EUROPE.wire(); US.wire(); WORLD.wire(); USE.wire();
  show('denmark');
})();
})();
