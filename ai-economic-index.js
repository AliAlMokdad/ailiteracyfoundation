/* AI Economic Index - interactive views over window.AEI (Anthropic Economic Index, release 2026-06-26) */
(function(){
"use strict";
var D = window.AEI;
if(!D){return;}

/* ---- terracotta quartile ramp ---- */
var RAMP = [
  {bg:'#8E3F22', tx:'#FDFBF6', label:'Leading, top 25%'},
  {bg:'#B05433', tx:'#FDFBF6', label:'Upper middle'},
  {bg:'#D08667', tx:'#15140F', label:'Lower middle'},
  {bg:'#F0E2D8', tx:'#15140F', label:'Emerging, bottom 25%'}
];
function tier(rank, total){ var q=rank/total; if(q<0.25)return 0; if(q<0.5)return 1; if(q<0.75)return 2; return 3; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function refocus(sel){ try{ var el=document.querySelector(sel); if(el&&el.focus) el.focus(); }catch(e){} }
function fmtIdx(v){ return v.toFixed(2)+'×'; }

/* ================= HERO STATS ================= */
(function(){
  var el=document.getElementById('aeiStats'); if(!el)return;
  var s=D.snapshot||{};
  var cards=[
    {n:(s.USA&&s.USA.usage_per_capita_index?s.USA.usage_per_capita_index.toFixed(2):'3.87')+'×', k:'US Usage Index, May 2026'},
    {n:(s.DNK&&s.DNK.usage_per_capita_index?s.DNK.usage_per_capita_index.toFixed(2):'3.57')+'×', k:'Denmark Usage Index'},
    {n:Math.round(s.global&&s.global.collaboration_bucket_augmentation_pct?s.global.collaboration_bucket_augmentation_pct:51)+'%', k:'Collaborative use, global'},
    {n:(D.meta&&D.meta.n_countries?D.meta.n_countries:D.countries.length), k:'Countries measured'}
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
  var byAbbr={}; states.forEach(function(s,i){ s.rank=i+1; s.t=tier(i,total); byAbbr[s.abbr]=s; });
  var sel='DC', base=null, topicMode='freq';
  var STEP=42, TILE=38;

  function buildMap(){
    var w=11*STEP-(STEP-TILE), h=8*STEP-(STEP-TILE);
    var parts=['<svg viewBox="0 0 '+w+' '+h+'" role="group">'];
    states.forEach(function(s){
      var p=POS[s.abbr]; if(!p)return;
      var x=p[0]*STEP, y=p[1]*STEP, r=RAMP[s.t];
      parts.push(
        '<g class="aei-tile" data-abbr="'+s.abbr+'" tabindex="0" role="button" aria-label="'+esc(s.name)+', Usage Index '+s.idx.toFixed(2)+', rank '+s.rank+' of '+total+'. Select to see detail.">'+
        '<rect x="'+x+'" y="'+y+'" width="'+TILE+'" height="'+TILE+'" rx="5" fill="'+r.bg+'" stroke="rgba(255,255,255,.55)" stroke-width="1"></rect>'+
        '<text x="'+(x+TILE/2)+'" y="'+(y+TILE/2+3.5)+'" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="10" fill="'+r.tx+'" style="pointer-events:none">'+s.abbr+'</text>'+
        '</g>');
    });
    parts.push('</svg>');
    document.getElementById('usMap').innerHTML=parts.join('');
  }
  function buildBoard(){
    var pinned = base?byAbbr[base]:null;
    document.getElementById('usBoardTitle').textContent = pinned? ('Compared to '+pinned.name.replace('Washington, D.C.','D.C.')) : 'States by Usage Index';
    var rows=states.map(function(s){
      var r=RAMP[s.t];
      var dl = pinned? ('<span class="dl">'+ (s.idx/pinned.idx).toFixed(2) +'×</span>') : '';
      return '<button class="aei-row'+(s.abbr===sel?' sel':'')+'" data-abbr="'+s.abbr+'">'+
        '<span class="rk">'+s.rank+'</span>'+
        '<span class="sq" style="background:'+r.bg+'"></span>'+
        '<span class="nm">'+esc(s.name)+'</span>'+
        '<span class="vl">'+s.idx.toFixed(2)+'</span>'+ dl +
        '</button>';
    });
    document.getElementById('usBoard').innerHTML=rows.join('');
  }
  function panel(){
    var s=byAbbr[sel]; var el=document.getElementById('usPanel');
    var tp=(D.stateTopics&&D.stateTopics[sel])||{freq:[],dist:[]};
    var list = topicMode==='freq'?tp.freq:tp.dist;
    var cap = topicMode==='freq'? ('Most frequent topics in '+s.name) : ('Topics most distinctive to '+s.name+', versus the US');
    var ex=(D.stateExtra&&D.stateExtra[s.abbr])||{};
    var scaleMax=4;
    var fillW=Math.min(100, s.idx/scaleMax*100);
    var tickL=(1/scaleMax*100);
    var pinned=base?byAbbr[base]:null;
    var deltaLine = pinned && pinned.abbr!==s.abbr ? ('<div class="aei-pdelta">Versus <b>'+esc(pinned.name.replace('Washington, D.C.','D.C.'))+'</b>: '+(s.idx/pinned.idx).toFixed(2)+'× its intensity</div>') : '';
    var topics = list && list.length ? list.map(function(t,i){
      var val = topicMode==='freq'? ((t.pct!=null?t.pct.toFixed(1):'-')+'%') : ((t.ratio!=null?t.ratio.toFixed(1):'-')+'×');
      return '<li><span class="ti">'+(i+1)+'</span><span class="tn">'+esc(t.name)+'</span><span class="tv">'+val+'</span></li>';
    }).join('') : '<li><span class="tn" style="color:var(--ink-quiet)">Not published for this state.</span></li>';
    el.innerHTML=
      '<p class="ph">Usage rank '+s.rank+' of '+total+'</p>'+
      '<div class="aei-pname">'+esc(s.name)+'</div>'+
      '<div class="aei-pidxrow"><span class="aei-pidx">'+fmtIdx(s.idx)+'</span><span class="aei-pidxlbl">Usage Index</span></div>'+
      deltaLine+
      '<div class="aei-meter"><div class="fill" style="width:'+fillW.toFixed(0)+'%"></div><span class="tick" style="left:'+tickL.toFixed(1)+'%"></span></div>'+
      '<div class="aei-metercap"><span>0</span><span>1.0 expected</span><span>4.0</span></div>'+
      (ex.collaboration_bucket_augmentation_pct!=null?
        '<div class="aei-pdiv"></div><div class="aei-mini">'+
        '<div class="aei-minicell"><div class="mv">'+Math.round(ex.collaboration_bucket_augmentation_pct)+'%</div><div class="mk">Collaborate</div></div>'+
        '<div class="aei-minicell"><div class="mv">'+(ex.use_case_work_pct!=null?Math.round(ex.use_case_work_pct):'--')+'%</div><div class="mk">Work use</div></div>'+
        '<div class="aei-minicell"><div class="mv">'+(ex.ai_autonomy_mean!=null?ex.ai_autonomy_mean.toFixed(1):'--')+'</div><div class="mk">Autonomy / 5</div></div>'+
        '</div>':'')+
      '<div class="aei-topichead"><span class="cap">'+esc(cap)+'</span></div>'+
      '<div class="aei-seg mini" role="group" aria-label="Topic ranking"><button data-tm="freq" aria-pressed="'+(topicMode==='freq')+'">Frequent</button><button data-tm="dist" aria-pressed="'+(topicMode==='dist')+'">Distinctive</button></div>'+
      '<ul class="aei-topics" style="margin-top:.7rem">'+topics+'</ul>'+
      '<button class="aei-pinbtn'+(base===sel?' active':'')+'" data-pin="'+s.abbr+'">'+(base===sel?'Pinned as baseline':'Pin '+esc(shortName(s.name))+' as baseline')+'</button>';
  }
  function shortName(n){ return n.replace('Washington, D.C.','D.C.'); }
  function chip(){
    var c=document.getElementById('usBaseChip');
    if(base){ var b=byAbbr[base]; c.className='aei-basechip on'; c.innerHTML='Baseline <b>'+esc(shortName(b.name))+' '+fmtIdx(b.idx)+'</b><button aria-label="Clear baseline" data-clear="1">×</button>'; }
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
  var countries=cfg.countries.map(function(c){ return {code:c.code,name:c.name,idx:c.idx,share:c.share}; }); // clone so views do not clobber each other
  var total=countries.length;
  var byCode={}; countries.forEach(function(c,i){ c.rank=i+1; c.t=tier(i,total); byCode[c.code]=c; });
  var sel=(cfg.defaultSel&&byCode[cfg.defaultSel])?cfg.defaultSel:(countries[0]&&countries[0].code), base=null, topicMode='freq';
  function el(id){ return document.getElementById(id); }
  function buildGrid(){
    el(G.grid).innerHTML=countries.map(function(c){
      var r=RAMP[c.t];
      return '<button class="aei-ctile'+(c.code===sel?' sel':'')+(c.code===base?' base':'')+'" data-code="'+c.code+'" style="background:'+r.bg+';color:'+r.tx+'" aria-label="'+esc(c.name)+', Usage Index '+c.idx.toFixed(2)+', rank '+c.rank+'. Select to see detail.">'+
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
    var cap = topicMode==='freq'? ('Most frequent topics in '+c.name) : ('Topics most distinctive to '+c.name+', versus the world');
    var fillW=Math.min(100,c.idx/scaleMax*100), tickL=(1/scaleMax*100);
    var pinned=base?byCode[base]:null;
    var deltaLine = pinned && pinned.code!==c.code ? ('<div class="aei-pdelta">Versus <b>'+esc(pinned.name)+'</b>: '+(c.idx/pinned.idx).toFixed(2)+'× its intensity</div>') : '';
    var topics = list && list.length ? list.map(function(t,i){
      var val=topicMode==='freq'?((t.pct!=null?t.pct.toFixed(1):'-')+'%'):((t.ratio!=null?t.ratio.toFixed(1):'-')+'×');
      return '<li><span class="ti">'+(i+1)+'</span><span class="tn">'+esc(t.name)+'</span><span class="tv">'+val+'</span></li>';
    }).join('') : '<li><span class="tn" style="color:var(--ink-quiet)">Topic detail not published for this country.</span></li>';
    var shareTxt = c.share>0 ? (c.share.toFixed(2)+'% of all measured usage') : 'Share not published';
    el(G.panel).innerHTML=
      '<p class="ph">Usage rank '+c.rank+' of '+total+rankNote+'</p>'+
      '<div class="aei-pname">'+esc(c.name)+'</div>'+
      '<div class="aei-pidxrow"><span class="aei-pidx">'+fmtIdx(c.idx)+'</span><span class="aei-pidxlbl">Usage Index</span></div>'+
      deltaLine+
      '<div class="aei-meter"><div class="fill" style="width:'+fillW.toFixed(0)+'%"></div><span class="tick" style="left:'+tickL.toFixed(1)+'%"></span></div>'+
      '<div class="aei-metercap"><span>0</span><span>1.0 expected</span><span>'+scaleMax.toFixed(1)+'</span></div>'+
      '<div class="aei-pdelta" style="margin-top:.55rem">'+esc(shareTxt)+'</div>'+
      '<div class="aei-pdiv"></div>'+
      '<div class="aei-topichead"><span class="cap">'+esc(cap)+'</span></div>'+
      '<div class="aei-seg mini" role="group" aria-label="Topic ranking"><button data-tm="freq" aria-pressed="'+(topicMode==='freq')+'">Frequent</button><button data-tm="dist" aria-pressed="'+(topicMode==='dist')+'">Distinctive</button></div>'+
      '<ul class="aei-topics" style="margin-top:.7rem">'+topics+'</ul>'+
      '<button class="aei-pinbtn'+(base===sel?' active':'')+'" data-pin="'+c.code+'">'+(base===sel?'Pinned as baseline':'Pin '+esc(c.name)+' as baseline')+'</button>';
  }
  function chip(){
    if(!G.chip) return; var box=el(G.chip);
    if(base){ var b=byCode[base]; box.className='aei-basechip on'; box.innerHTML='Baseline <b>'+esc(b.name)+' '+fmtIdx(b.idx)+'</b><button aria-label="Clear baseline" data-clear="1">×</button>'; }
    else { box.className='aei-basechip'; box.innerHTML=''; }
  }
  function shareBars(){
    if(!G.share) return;
    var arr=(cfg.shareData||[]).slice(0,15); if(!arr.length){ el(G.share).innerHTML=''; return; }
    var max=arr[0].share||1;
    el(G.share).innerHTML=arr.map(function(c){
      return '<div class="aei-bar"><span class="bl">'+esc(c.name)+'</span><span class="bt"><i style="width:'+((c.share||0)/max*100).toFixed(1)+'%"></i></span><span class="bv">'+(c.share!=null?c.share.toFixed(1):'-')+'%</span></div>';
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
var EUROPE = geoView({ countries:euCountries(), defaultSel:'DNK', rankNote:' in Europe', ids:{grid:'euGrid',board:'euBoard',panel:'euPanel',chip:'euBaseChip',dkPin:'euDkPin'} });

/* ================= DENMARK VIEW ================= */
var DENMARK = (function(){
  var topicMode='freq';
  function render(){
    var dnk=null, wr=0;
    for(var i=0;i<D.countries.length;i++){ if(D.countries[i].code==='DNK'){ dnk=D.countries[i]; wr=i+1; break; } }
    var box=document.getElementById('dkProfile');
    if(!dnk){ box.innerHTML='<div class="aei-card">Denmark data is not published in this release.</div>'; return; }
    var eu=euCountries(), er=0; for(var j=0;j<eu.length;j++){ if(eu[j].code==='DNK'){ er=j+1; break; } }
    var sn=(D.snapshot&&D.snapshot.DNK)||{}, g=(D.snapshot&&D.snapshot.global)||{};
    var scaleMax=6.5, fillW=Math.min(100,dnk.idx/scaleMax*100), tickL=1/scaleMax*100;
    function bar(cls,pct){ return '<div class="b '+cls+'"><i style="width:'+Math.max(0,Math.min(100,pct)).toFixed(0)+'%"></i></div>'; }
    function cmpRow(label,dk,wd){
      if(dk==null||wd==null) return '';
      return '<div class="crow"><div class="rl"><span>'+label+'</span><span><b>'+Math.round(dk)+'%</b> Denmark · '+Math.round(wd)+'% world</span></div>'+
        bar('dk',dk)+bar('wd',wd)+'</div>';
    }
    var rows=cmpRow('Augmentation, working with AI', sn.collaboration_bucket_augmentation_pct, g.collaboration_bucket_augmentation_pct)+
             cmpRow('Automation, delegating tasks', sn.collaboration_bucket_automation_pct, g.collaboration_bucket_automation_pct)+
             cmpRow('Work use', sn.use_case_work_pct, g.use_case_work_pct)+
             cmpRow('Personal use', sn.use_case_personal_pct, g.use_case_personal_pct)+
             cmpRow('Coursework', sn.use_case_coursework_pct, g.use_case_coursework_pct);
    var tp=(D.countryTopics&&D.countryTopics.DNK)||{freq:[],dist:[]};
    var tl=topicMode==='freq'?tp.freq:tp.dist;
    var cap=topicMode==='freq'?'Most frequent topics in Denmark':'Topics most distinctive to Denmark, versus the world';
    var topics=(tl&&tl.length)?tl.map(function(t,i){ var val=topicMode==='freq'?((t.pct!=null?t.pct.toFixed(1):'-')+'%'):((t.ratio!=null?t.ratio.toFixed(1):'-')+'×'); return '<li><span class="ti">'+(i+1)+'</span><span class="tn">'+esc(t.name)+'</span><span class="tv">'+val+'</span></li>'; }).join(''):'<li><span class="tn" style="color:var(--ink-quiet)">Not published.</span></li>';
    var autonomy=sn.ai_autonomy_mean!=null?sn.ai_autonomy_mean.toFixed(1):'-';
    box.innerHTML=
      '<div class="aei-dkgrid">'+
        '<div class="aei-card aei-panel">'+
          '<p class="ph">Denmark · Usage Index</p>'+
          '<div class="aei-pname">Denmark</div>'+
          '<div class="aei-pidxrow"><span class="aei-pidx">'+fmtIdx(dnk.idx)+'</span><span class="aei-pidxlbl">times the world average</span></div>'+
          '<div class="aei-pdelta">World rank <b>'+wr+' of '+D.countries.length+'</b>'+(er?(' &middot; Europe rank <b>'+er+' of '+eu.length+'</b>'):'')+'</div>'+
          '<div class="aei-meter"><div class="fill" style="width:'+fillW.toFixed(0)+'%"></div><span class="tick" style="left:'+tickL.toFixed(1)+'%"></span></div>'+
          '<div class="aei-metercap"><span>0</span><span>1.0 expected</span><span>6.5</span></div>'+
          '<div class="aei-pdiv"></div>'+
          '<div class="aei-mini">'+
            '<div class="aei-minicell"><div class="mv">'+(sn.collaboration_bucket_augmentation_pct!=null?Math.round(sn.collaboration_bucket_augmentation_pct):'-')+'%</div><div class="mk">Collaborate</div></div>'+
            '<div class="aei-minicell"><div class="mv">'+(sn.use_case_work_pct!=null?Math.round(sn.use_case_work_pct):'-')+'%</div><div class="mk">Work use</div></div>'+
            '<div class="aei-minicell"><div class="mv">'+autonomy+'</div><div class="mk">Autonomy / 5</div></div>'+
          '</div>'+
          '<p class="aei-dknote">Denmark uses Claude well above its population share, and leans to collaboration over pure automation.</p>'+
        '</div>'+
        '<div class="aei-card">'+
          '<div style="font-family:var(--serif);font-size:1.2rem;font-weight:600;margin:0 0 1.1rem;color:var(--ink)">Denmark next to the world</div>'+
          '<div class="aei-cmp">'+rows+'</div>'+
        '</div>'+
      '</div>'+
      '<div class="aei-card">'+
        '<div class="aei-topichead" style="margin-top:0"><span class="cap">'+esc(cap)+'</span></div>'+
        '<div class="aei-seg mini" role="group" aria-label="Topic ranking"><button data-tm="freq" aria-pressed="'+(topicMode==='freq')+'">Frequent</button><button data-tm="dist" aria-pressed="'+(topicMode==='dist')+'">Distinctive</button></div>'+
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
      var dot=j.mode==='aug'?'var(--accent)':'var(--ink-quiet)';
      var meta = sum>0 ? ('Augmentation '+Math.round(aug)+'% · Automation '+Math.round(auto)+'%') : 'Split not published';
      return '<div class="aei-job"><div class="jt"><span class="jd" style="background:'+dot+'"></span><span class="jname">'+esc(j.title)+'</span></div>'+
        '<div class="jpct">'+(j.pct!=null?j.pct.toFixed(2):'-')+'% of usage</div>'+
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
      '<div class="aei-dlegend"><span class="lg"><span class="sw" style="background:var(--ink-quiet)"></span>Automation, delegated</span>'+
      '<span class="lg"><span class="sw" style="background:var(--accent)"></span>Augmentation, collaborated</span>'+
      (a.autonomy!=null?'<span class="lg" style="margin-left:auto">AI autonomy '+a.autonomy.toFixed(1)+' of 5</span>':'')+'</div>';
  }
  function artifacts(){
    var arr=(D.artifacts||[]).slice(0,6);
    var pal=['#8E3F22','#B05433','#C77049','#D08667','#DFA588','#EBCBB6'];
    var names={explanation_or_answer:'Explanation or answer',document_or_report:'Document or report',advice_or_recommendation:'Advice or recommendation',analysis_or_summary:'Analysis or summary',email_or_message:'Email or message',app_or_website:'App or website',plan_or_strategy:'Plan or strategy',code_fix_or_debug:'Code fix or debug',data_or_spreadsheet:'Data or spreadsheet',creative_writing:'Creative writing'};
    var squares=[], legend=[];
    arr.forEach(function(a,i){
      var n=Math.max(1,Math.round(a.pct||0));
      for(var k=0;k<n;k++) squares.push(pal[i]);
      legend.push('<div class="lg"><span class="sw" style="background:'+pal[i]+'"></span>'+esc(names[a.label]||a.label.replace(/_/g,' '))+'<b>'+(a.pct!=null?a.pct.toFixed(1):'-')+'%</b></div>');
    });
    squares=squares.slice(0,100);
    while(squares.length<100) squares.push('var(--bg-deep)');
    document.getElementById('artWaffle').innerHTML=squares.map(function(c){return '<span style="background:'+c+'"></span>';}).join('');
    legend.push('<div class="lg"><span class="sw" style="background:var(--bg-deep)"></span>Everything else<b>'+Math.max(0,100-squares.filter(function(c){return c!=='var(--bg-deep)';}).length)+'%</b></div>');
    document.getElementById('artLegend').innerHTML=legend.join('');
  }
  var reqKey='global';
  function requests(){
    var arr=(reqKey==='us'?D.reqUS:D.reqGlobal)||[]; if(!arr.length)return;
    var max=arr[0].pct||1;
    document.getElementById('reqBars').innerHTML=arr.map(function(r){
      return '<div class="aei-bar"><span class="bl">'+esc(r.name)+'</span><span class="bt"><i style="width:'+((r.pct||0)/max*100).toFixed(1)+'%"></i></span><span class="bv">'+(r.pct!=null?r.pct.toFixed(1):'-')+'%</span></div>';
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
    {t:'US usage stands out', h:'In May 2026 the United States had a Usage Index of <b>3.87</b> and about <b>20%</b> of all measured Claude.ai usage.'},
    {t:'State gaps are wide', h:'Washington, D.C. led every state at <b>3.32</b>. West Virginia was lowest at <b>0.25</b>, more than a tenfold gap.'},
    {t:'Denmark leans collaborative', h:'Denmark used AI at <b>3.57</b> times its population share, and leaned to collaboration: <b>58%</b> augmentation to <b>42%</b> automation.'},
    {t:'The API is a different world', h:'Personal chat was near even, <b>51%</b> augmentation. The developer API was <b>94%</b> automation, machines doing delegated work.'}
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
