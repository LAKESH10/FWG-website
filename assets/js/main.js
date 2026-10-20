/* FWG Group website
 * 1. Router, menus, review notes, forms
 * 2. Theme, fades, home interactions and 3D scenes (three.js r128)
 */
(function(){
  var pages=[].slice.call(document.querySelectorAll('section.page'));
  var names=pages.map(function(p){return p.dataset.page});
  var nav=document.getElementById('main-nav'),toggle=document.getElementById('menu-toggle');
  function closeMenus(){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');document.querySelectorAll('.dd').forEach(function(d){d.classList.remove('open')})}
  function show(){
    var h=(location.hash||'#home').slice(1),target=h,anchor=null;
    if(names.indexOf(h)<0){var el=h&&document.getElementById(h);var host=el&&el.closest('section.page');if(host){target=host.dataset.page;anchor=el}else target='home'}
    pages.forEach(function(p){p.hidden=p.dataset.page!==target});
    document.querySelectorAll('[data-nav]').forEach(function(a){var on=a.dataset.nav.split(' ').indexOf(target)>=0;a.classList.toggle('on',on);if(a.tagName==='A'){if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}});
    closeMenus();
    if(anchor){anchor.scrollIntoView()}else{window.scrollTo(0,0)}
    var t=document.querySelector('section.page:not([hidden]) h1');
    document.title=target==='home'?'FWG Group':(t?t.textContent+' · FWG Group':'FWG Group');
    window.dispatchEvent(new Event('resize'));window.dispatchEvent(new Event('scroll'));
  }
  window.addEventListener('hashchange',show);show();
  toggle.addEventListener('click',function(e){e.stopPropagation();var o=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',o)});
  document.querySelectorAll('.dd > button').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();var o=b.parentNode.classList.toggle('open');b.setAttribute('aria-expanded',o)})});
  document.addEventListener('click',function(e){if(!e.target.closest('.dd')&&!e.target.closest('#main-nav'))closeMenus()});
  var nt=document.getElementById('notes-toggle');var sv=null;try{sv=localStorage.getItem('fwg-notes')}catch(e){}
  nt.checked=sv==='on';
  function ap(){document.body.classList.toggle('notes',nt.checked);try{localStorage.setItem('fwg-notes',nt.checked?'on':'off')}catch(e){}}
  nt.addEventListener('change',ap);ap();
  function wire(fid,did,msg){var f=document.getElementById(fid),d=document.getElementById(did);if(!f)return;f.addEventListener('submit',function(e){e.preventDefault();if(!f.checkValidity()){f.reportValidity();return}d.textContent=msg;d.classList.add('show')})}
  wire('quote-form','quote-done','Thank you. In the live site your request would now go to the selected country team. This preview does not send anything.');
  wire('career-form','career-done','Thank you. In the live site your application would now go to the recruitment team. This preview does not send anything.');
  document.querySelectorAll('.cpy').forEach(function(b){b.addEventListener('click',function(){var v=b.dataset.copy;function ok(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1500)}try{navigator.clipboard.writeText(v).then(ok,function(){b.textContent=v})}catch(e){b.textContent=v}})});
})();

(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* light / dark mode: follows the device until the visitor chooses */
  var root=document.documentElement, mq=window.matchMedia('(prefers-color-scheme: dark)'), tbtn=document.getElementById('themeBtn');
  try{var saved=localStorage.getItem('fwg-theme');if(saved==='dark'||saved==='light')root.setAttribute('data-theme',saved)}catch(e){}
  function isDark(){var a=root.getAttribute('data-theme');return a?a==='dark':mq.matches}
  function announce(){tbtn.setAttribute('aria-label',isDark()?'Switch to light mode':'Switch to dark mode');document.dispatchEvent(new CustomEvent('fwgtheme',{detail:isDark()}))}
  tbtn.addEventListener('click',function(){var d=!isDark();root.setAttribute('data-theme',d?'dark':'light');try{localStorage.setItem('fwg-theme',d?'dark':'light')}catch(e){}announce()});
  if(mq.addEventListener)mq.addEventListener('change',announce);
  new MutationObserver(function(){announce()}).observe(root,{attributes:true,attributeFilter:['data-theme']});

  /* fades + quote underline */
  var fades=[].slice.call(document.querySelectorAll('.fade'));
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.2});
    fades.forEach(function(f){io.observe(f)});
  }else fades.forEach(function(f){f.classList.add('in')});

  /* floating contact + feature highlight */
  var fl=document.getElementById('float'),hero=document.querySelector('.hero');
  var fitems=[].slice.call(document.querySelectorAll('.fitem')),fimgs=[].slice.call(document.querySelectorAll('.fimg img')),fnum=document.getElementById('fnum'),cur=0;
  function setF(i){if(i===cur)return;cur=i;fitems.forEach(function(f,j){f.classList.toggle('on',j===i)});fimgs.forEach(function(m,j){m.classList.toggle('on',j===i)});fnum.textContent='0'+(i+1)+' / 04'}
  function onScroll(){
    var vh=window.innerHeight;
    fl.classList.toggle('show',hero.getBoundingClientRect().bottom<vh*0.4);
    if(window.innerWidth>860){
      var best=0,bd=1e9;
      fitems.forEach(function(f,i){var r=f.getBoundingClientRect();var d=Math.abs(r.top+r.height/2-vh*0.5);if(d<bd){bd=d;best=i}});
      setF(best);
    }
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  [].slice.call(document.querySelectorAll('#chips button')).forEach(function(b,ix,all){
    b.addEventListener('click',function(){all.forEach(function(x){x.setAttribute('aria-pressed',x===b)})});
  });

  /* ---------------- 3D (three.js r128). Logo is never rendered in 3D. ---------------- */
  var bdBtn=document.getElementById('b-day'),bnBtn=document.getElementById('b-night'),cd=document.getElementById('c-day'),cn=document.getElementById('c-night');
  var siteNight=false, siteApi=null;
  function setShift(n){siteNight=n;bdBtn.setAttribute('aria-pressed',!n);bnBtn.setAttribute('aria-pressed',n);cd.classList.toggle('on',!n);cn.classList.toggle('on',n);if(siteApi)siteApi.kick()}
  bdBtn.addEventListener('click',function(){setShift(false)});
  bnBtn.addEventListener('click',function(){setShift(true)});
  if(!window.THREE)return;

  var C={bg:0xF7F6F6,ground:0xEFECEC,white:0xFBFAFA,n2:0xF0EEEE,n3:0xE5E2E3,n4:0xD8D4D5,burg:0x660220,b80:0x853549,b60:0xA96877,b40:0xCC9AA5,b20:0xE6CCD2,b10:0xF3E6E9,char:0x231F20};

  function makeRenderer(box,stage){
    var r;
    try{r=new THREE.WebGLRenderer({antialias:true})}catch(e){return null}
    if(!r.getContext())return null;
    r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
    r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;
    box.appendChild(r.domElement);stage.classList.add('gl');
    return r;
  }
  function loop(stage,frame){
    var visible=false,raf=null;
    function tick(now){frame(now);raf=(!reduce&&visible)?requestAnimationFrame(tick):null}
    function start(){if(!raf)raf=requestAnimationFrame(tick)}
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)start()},{rootMargin:'100px'}).observe(stage);
    }else{visible=true;start()}
    document.addEventListener('visibilitychange',function(){if(document.hidden&&raf){cancelAnimationFrame(raf);raf=null}else if(!document.hidden&&visible)start()});
    return {kick:function(){if(reduce||!raf)requestAnimationFrame(function(n){frame(n);if(!reduce&&visible)start()})}};
  }
  var seed=7;function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
  var boxGeo=new THREE.BoxGeometry(1,1,1);boxGeo.translate(0,.5,0);

  /* ---- Scene A: cinematic city hero ---- */
  (function(){
    var stage=document.getElementById('heroStage'),box=document.getElementById('heroBox');
    var R;
    try{R=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){return}
    if(!R.getContext())return;
    R.setPixelRatio(Math.min(2,window.devicePixelRatio||1));R.setClearColor(0x000000,0);
    R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
    box.appendChild(R.domElement);stage.classList.add('gl');
    var scene=new THREE.Scene();scene.fog=new THREE.Fog(0xF5EEF0,70,190);
    var cam=new THREE.PerspectiveCamera(30,1,.1,500);
    var hemi=new THREE.HemisphereLight(0xffffff,0xD8D4D5,.8);scene.add(hemi);
    var sun=new THREE.DirectionalLight(0xFFF1EC,.9);sun.position.set(-40,42,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
    var sc=sun.shadow.camera;sc.left=-50;sc.right=50;sc.top=50;sc.bottom=-50;sc.far=160;sun.shadow.bias=-.0008;scene.add(sun);
    var g=new THREE.Mesh(new THREE.PlaneGeometry(600,600),new THREE.MeshStandardMaterial({color:C.ground,roughness:1}));g.rotation.x=-Math.PI/2;g.receiveShadow=true;scene.add(g);
    var grid=new THREE.GridHelper(300,100,C.n4,C.n3);grid.position.y=.01;grid.material.transparent=true;grid.material.opacity=.35;scene.add(grid);
    var S=6,N=6,boxes=[];
    for(var i=-N;i<=N;i++)for(var j=-N;j<=N;j++){
      var d=Math.hypot(i,j);
      if(i===0&&j===0){boxes.push({x:0,z:0,w:3.8,d:3.8,h:18,c:C.burg});continue}
      var parts=rnd()<.45?2:1;
      for(var k=0;k<parts;k++){
        var w=parts===2?1.7:2.6+rnd()*1.4,dd=2.4+rnd()*1.6,ox=parts===2?(k?1:-1)*1.05:0;
        var h=(1.4+rnd()*rnd()*11)*(d<2.5?1.35:1)*(d>4.5?.55:1);
        boxes.push({x:i*S+ox,z:j*S,w:w,d:dd,h:h,c:rnd()<.07?C.b20:(rnd()<.5?C.white:C.n2)});
      }
    }
    var city=new THREE.InstancedMesh(boxGeo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.75}),boxes.length);
    city.castShadow=city.receiveShadow=true;
    var m=new THREE.Matrix4(),col=new THREE.Color();
    boxes.forEach(function(b,ix){m.makeScale(b.w,b.h,b.d);m.setPosition(b.x,0,b.z);city.setMatrixAt(ix,m);city.setColorAt(ix,col.setHex(b.c))});
    scene.add(city);
    /* night windows: thin emissive strips on two faces of taller buildings */
    var wins=[];boxes.forEach(function(b){if(b.h<3||b.c===C.burg)return;for(var f=1;f<b.h-.6;f+=1.1){if(rnd()<.45){wins.push([b.x,f,b.z+b.d/2+.02,b.w*.7,0]);}if(rnd()<.35){wins.push([b.x+b.w/2+.02,f,b.z,b.d*.7,1]);}}});
    var winMat=new THREE.MeshBasicMaterial({color:0xF6E6EA,transparent:true,opacity:0});
    var winMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.22,.04),winMat,wins.length);
    var q=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),sv=new THREE.Vector3(),pv=new THREE.Vector3();
    wins.forEach(function(wv,ix){q.setFromAxisAngle(up,wv[4]?Math.PI/2:0);pv.set(wv[0],wv[1],wv[2]);sv.set(wv[3],1,1);m.compose(pv,q,sv);winMesh.setMatrixAt(ix,m)});
    scene.add(winMesh);
    /* HQ crown + beacon */
    var crownMat=new THREE.MeshStandardMaterial({color:C.burg,emissive:C.burg,emissiveIntensity:.4});
    var crown=new THREE.Mesh(new THREE.TorusGeometry(3.6,.1,12,120),crownMat);crown.rotation.x=Math.PI/2;crown.scale.set(1,.7,1);crown.position.y=19.4;scene.add(crown);
    var crown2=new THREE.Mesh(new THREE.TorusGeometry(5.2,.05,8,140),new THREE.MeshBasicMaterial({color:C.b40,transparent:true,opacity:.6}));crown2.rotation.x=Math.PI/2;crown2.scale.set(1,.7,1);crown2.position.y=18.4;scene.add(crown2);
    var beamMat=new THREE.MeshBasicMaterial({color:C.b40,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
    var beam=new THREE.Mesh(new THREE.CylinderGeometry(.5,1.6,60,32,1,true),beamMat);beam.position.y=48;scene.add(beam);
    function route(pts){return new THREE.CatmullRomCurve3(pts.map(function(p){return new THREE.Vector3(p[0],.25,p[1])}),true,'catmullrom',.04)}
    var routes=[{c:route([[-15,15],[-15,-3],[3,-3],[3,-15],[21,-15],[21,9],[-3,9],[-3,15]]),col:C.burg,n:3,sp:.011},
                {c:route([[-27,-21],[-9,-21],[-9,-9],[-27,-9]]),col:C.b80,n:1,sp:.018},
                {c:route([[9,21],[33,21],[33,3],[9,3]]),col:C.b80,n:1,sp:.016}];
    var veh=[],tubes=[],vGeo=new THREE.BoxGeometry(1.1,.55,.6);vGeo.translate(0,.3,0);
    routes.forEach(function(r){
      var tm=new THREE.MeshStandardMaterial({color:r.col,emissive:r.col,emissiveIntensity:.3,roughness:.5});tubes.push({m:tm,col:r.col});scene.add(new THREE.Mesh(new THREE.TubeGeometry(r.c,500,.17,8,true),tm));
      for(var qq=0;qq<r.n;qq++){
        var v=new THREE.Mesh(vGeo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35}));v.castShadow=true;
        var st=new THREE.Mesh(new THREE.BoxGeometry(1.12,.12,.62),new THREE.MeshStandardMaterial({color:C.burg}));st.position.y=.38;v.add(st);
        var hl=new THREE.Mesh(new THREE.ConeGeometry(.9,3,16,1,true),new THREE.MeshBasicMaterial({color:0xFFF3E8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));hl.rotation.z=Math.PI/2;hl.position.set(-2,.35,0);v.add(hl);
        scene.add(v);veh.push({m:v,c:r.c,t:qq/r.n,sp:r.sp,hl:hl});
      }
    });
    var sens=[],ringGeo=new THREE.RingGeometry(.5,.62,48),sbeamGeo=new THREE.CylinderGeometry(.08,.35,9,12,1,true);
    boxes.filter(function(b){return b.c!==C.burg&&b.h>5}).sort(function(a,b){return b.h-a.h}).slice(0,12).forEach(function(b,ix){
      var dot=new THREE.Mesh(new THREE.SphereGeometry(.3,16,12),new THREE.MeshStandardMaterial({color:C.burg,emissive:C.burg,emissiveIntensity:.6}));dot.position.set(b.x,b.h+.3,b.z);scene.add(dot);
      var ring=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:C.b60,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(b.x,b.h+.05,b.z);scene.add(ring);
      var sb=new THREE.Mesh(sbeamGeo,new THREE.MeshBasicMaterial({color:C.b40,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));sb.position.set(b.x,b.h+4.8,b.z);scene.add(sb);
      sens.push({r:ring,b:sb,o:ix*.37});
    });
    var perim=new THREE.Mesh(new THREE.TorusGeometry(46,.12,8,240),new THREE.MeshBasicMaterial({color:C.b40}));perim.rotation.x=Math.PI/2;perim.scale.set(1,.72,1);perim.position.y=.2;scene.add(perim);
    var DARKMAP={};DARKMAP[C.white]=0x3A3435;DARKMAP[C.n2]=0x332E2F;DARKMAP[C.b20]=0x5A2A38;DARKMAP[C.burg]=0x7A0A2C;
    var dark=false;
    function themeCity(dk){
      dark=dk;
      scene.fog.color.setHex(dk?0x1C1215:0xF3E9EC);
      g.material.color.setHex(dk?0x1E1A1B:C.ground);
      grid.material.opacity=dk?.14:.35;
      boxes.forEach(function(b,ix){city.setColorAt(ix,col.setHex(dk?(DARKMAP[b.c]||b.c):b.c))}); city.instanceColor.needsUpdate=true;
      tubes.forEach(function(t){var c=dk&&t.col===C.burg?C.b40:t.col;t.m.color.setHex(c);t.m.emissive.setHex(c);t.m.emissiveIntensity=dk?.7:.3});
      hemi.intensity=dk?.45:.8; sun.intensity=dk?.25:.9; sun.color.setHex(dk?0xB9A0C0:0xFFF1EC);
      winMat.opacity=dk?.85:0; beamMat.opacity=dk?.16:0; crownMat.emissiveIntensity=dk?1.2:.4;
      veh.forEach(function(v){v.hl.material.opacity=dk?.22:0});
      sens.forEach(function(s){s.b.material.opacity=dk?.22:0});
    }
    function size(){var w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;R.setSize(w,h,false);
      if(w>=760){var W=w*1.6;cam.aspect=W/h;cam.setViewOffset(W,h,0,0,w,h);cam.fov=30}else{cam.clearViewOffset();cam.aspect=w/h;cam.fov=42}
      cam.updateProjectionMatrix()}
    size();window.addEventListener('resize',size);
    var t0=performance.now(),mx=0,my=0,tx=0,ty=0;
    window.addEventListener('pointermove',function(e){tx=e.clientX/window.innerWidth-.5;ty=e.clientY/window.innerHeight-.5},{passive:true});
    function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
    themeCity(isDark());
    var api=loop(stage,function(now){
      var t=reduce?30:(now-t0)/1000, e=ease(Math.min(1,t/5.5));
      mx+=(tx-mx)*.03;my+=(ty-my)*.03;
      var ang=-0.95+.55*e+Math.max(0,t-5.5)*.012+mx*.12;
      var rad=150-74*e, ht=110-78*e+my*4;
      cam.position.set(Math.sin(ang)*rad,ht,Math.cos(ang)*rad);cam.lookAt(0,5-2*e,0);
      veh.forEach(function(v){v.t=(v.t+v.sp*.016)%1;var p=v.c.getPointAt(v.t),q2=v.c.getPointAt((v.t+.002)%1);v.m.position.set(p.x,.1,p.z);v.m.lookAt(q2.x,.1,q2.z);v.m.rotateY(Math.PI/2)});
      sens.forEach(function(s){var k=(t*.3+s.o)%1;s.r.scale.setScalar(1+k*6);s.r.material.opacity=(1-k)*.7});
      crown.rotation.z=t*.25;crown2.rotation.z=-t*.12;
      R.render(scene,cam);
    });
    document.addEventListener('fwgtheme',function(e){themeCity(e.detail);api.kick()});
  })();

  /* ---- Scene B: one site, day and night ---- */
  (function(){
    var stage=document.getElementById('siteStage'),box=document.getElementById('siteBox');
    var R=makeRenderer(box,stage);if(!R)return;
    var scene=new THREE.Scene(),bgDay=new THREE.Color(C.b10),bgNight=new THREE.Color(0x231F20);scene.background=bgDay.clone();
    var cam=new THREE.PerspectiveCamera(30,1,.1,200);
    var hemi=new THREE.HemisphereLight(0xffffff,0xD8D4D5,.9);scene.add(hemi);
    var sun=new THREE.DirectionalLight(0xffffff,.8);sun.position.set(-14,24,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
    var sc=sun.shadow.camera;sc.left=-16;sc.right=16;sc.top=16;sc.bottom=-16;sc.far=80;sun.shadow.bias=-.001;scene.add(sun);
    var groundMat=new THREE.MeshStandardMaterial({color:C.n3,roughness:1});
    var ground=new THREE.Mesh(new THREE.PlaneGeometry(80,80),groundMat);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
    var roadMat=new THREE.MeshStandardMaterial({color:C.n4,roughness:1});
    var road=new THREE.Mesh(new THREE.PlaneGeometry(80,4),roadMat);road.rotation.x=-Math.PI/2;road.position.set(0,.01,7);road.receiveShadow=true;scene.add(road);
    function block(w,h,d,color,x,y,z){var mm=new THREE.MeshStandardMaterial({color:color,roughness:.8});var b=new THREE.Mesh(boxGeo,mm);b.scale.set(w,h,d);b.position.set(x,y||0,z);b.castShadow=b.receiveShadow=true;scene.add(b);return b}
    var tower=block(7,12,6,C.white,-1,0,-3), wing=block(5,6,5,C.n2,5.2,0,-2.5);
    var door=block(1.8,2.2,.1,C.burg,-1,0,0.02);
    // windows on the front faces
    var winGeo=new THREE.BoxGeometry(.9,.6,.08);
    var winDark=new THREE.MeshStandardMaterial({color:0xBDB3B6,roughness:.3}), winLit=new THREE.MeshStandardMaterial({color:0xBDB3B6,emissive:0xFFF7F0,emissiveIntensity:0,roughness:.3});
    var litIdx=[1,4,6,9,11,14,15,20,22,25,27],wi=0;
    for(var r=0;r<7;r++)for(var c=0;c<5;c++){if(r===0&&c===2)continue;var wm=new THREE.Mesh(winGeo,litIdx.indexOf(wi)>=0?winLit:winDark);wm.position.set(-3.6+c*1.3,3+r*1.3,0.02);scene.add(wm);wi++}
    for(var r2=0;r2<3;r2++)for(var c2=0;c2<3;c2++){var wm2=new THREE.Mesh(winGeo,(r2+c2)%2?winLit:winDark);wm2.position.set(3.6+c2*1.5,1.6+r2*1.4,0.02);scene.add(wm2)}
    // guard booth + barrier
    block(1.8,2.2,1.8,C.white,-7.5,0,4);block(2,.25,2,C.burg,-7.5,2.2,4);
    var boothWin=new THREE.Mesh(new THREE.BoxGeometry(1.2,.6,.05),winLit);boothWin.position.set(-7.5,1.4,4.92);scene.add(boothWin);
    var arm=block(5,.18,.18,C.burg,-4.6,1,5);
    // guard
    var guard=new THREE.Group();
    var body=new THREE.Mesh(new THREE.CylinderGeometry(.28,.3,1.1,16),new THREE.MeshStandardMaterial({color:0xffffff}));body.position.y=1.15;
    var legs=new THREE.Mesh(new THREE.CylinderGeometry(.28,.26,.7,16),new THREE.MeshStandardMaterial({color:C.char}));legs.position.y=.35;
    var head=new THREE.Mesh(new THREE.SphereGeometry(.24,16,12),new THREE.MeshStandardMaterial({color:0x8a6a5a}));head.position.y=1.95;
    var capm=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.12,16),new THREE.MeshStandardMaterial({color:C.char}));capm.position.y=2.14;
    [body,legs,head,capm].forEach(function(o){o.castShadow=true;guard.add(o)});guard.position.set(-5.6,0,3.4);scene.add(guard);
    // cctv pole + cone
    block(.18,4.4,.18,0x5E5658,6.5,0,4.5);var camBody=block(.8,.4,.4,C.char,6.2,4.3,4.5);
    var coneMat=new THREE.MeshBasicMaterial({color:C.b40,transparent:true,opacity:0,depthWrite:false});
    var cone=new THREE.Mesh(new THREE.ConeGeometry(2.6,4.6,32,1,true),coneMat);cone.position.set(4.6,2.3,5.2);cone.rotation.set(0,0,-0.45);scene.add(cone);
    // patrol car
    var car=new THREE.Group();
    var cb=new THREE.Mesh(new THREE.BoxGeometry(2.4,.6,1.1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35}));cb.position.y=.55;
    var ct=new THREE.Mesh(new THREE.BoxGeometry(1.3,.45,1),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35}));ct.position.set(-.1,1.05,0);
    var cs=new THREE.Mesh(new THREE.BoxGeometry(2.42,.14,1.12),new THREE.MeshStandardMaterial({color:C.burg}));cs.position.y=.62;
    [cb,ct,cs].forEach(function(o){o.castShadow=true;car.add(o)});
    var head1=new THREE.PointLight(0xFFF3E8,0,10);head1.position.set(1.5,.6,0);car.add(head1);
    scene.add(car);
    // trees (simple)
    [[-11,-1],[10,-4],[11,1]].forEach(function(p){var tr=new THREE.Mesh(new THREE.SphereGeometry(1.1,16,12),new THREE.MeshStandardMaterial({color:0xB9C2B0,roughness:1}));tr.position.set(p[0],1.8,p[1]);tr.castShadow=true;scene.add(tr);block(.2,1.2,.2,0x7a6a60,p[0],0,p[1])});
    var moonMat=new THREE.MeshBasicMaterial({color:0xF7F6F6,transparent:true,opacity:0});var moon=new THREE.Mesh(new THREE.SphereGeometry(1.2,24,16),moonMat);moon.position.set(12,16,-20);scene.add(moon);

    var wide=true;function size(){var w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;R.setSize(w,h,false);wide=w/h>1.4;
      if(wide){var W=w*1.3;cam.aspect=W/h;cam.setViewOffset(W,h,0,0,w,h)}else{cam.clearViewOffset();cam.aspect=w/h}cam.fov=wide?26:34;cam.updateProjectionMatrix()}
    size();window.addEventListener('resize',size);
    var mix=0,t0=performance.now(),last=performance.now();
    var dayGround=new THREE.Color(0xDDD8D9),nightGround=new THREE.Color(0x2E292A),dayRoad=new THREE.Color(C.n4),nightRoad=new THREE.Color(0x3A3435);
    var dayTower=new THREE.Color(C.white),nightTower=new THREE.Color(0x4A4344),dayWing=new THREE.Color(C.n2),nightWing=new THREE.Color(0x433D3E);
    var api=loop(stage,function(now){
      var dt=Math.min(.05,(now-last)/1000);last=now;var t=reduce?4:(now-t0)/1000;
      var target=siteNight?1:0; mix=reduce?target:mix+(target-mix)*Math.min(1,dt*3);
      scene.background.copy(bgDay).lerp(bgNight,mix);
      hemi.intensity=.62-.4*mix; sun.intensity=.75-.65*mix;
      groundMat.color.copy(dayGround).lerp(nightGround,mix); roadMat.color.copy(dayRoad).lerp(nightRoad,mix);
      tower.material.color.copy(dayTower).lerp(nightTower,mix); wing.material.color.copy(dayWing).lerp(nightWing,mix);
      winLit.emissiveIntensity=mix*1.1; winDark.color.setHex(0xBDB3B6).lerp(new THREE.Color(0x2A2526),mix);
      coneMat.opacity=.28*mix; moonMat.opacity=mix; head1.intensity=1.6*mix;
      guard.visible=mix<.5; arm.rotation.z=0;
      var cx=((t*2.2)%40)-20; car.position.set(cx,0,7);
      var ang=Math.sin(t*.12)*.12;
      var dd=wide?52:54;cam.position.set(Math.sin(.6+ang)*dd,wide?17:22,Math.cos(.6+ang)*dd);cam.lookAt(-.5,4.2,1.5);
      R.render(scene,cam);
    });
    siteApi=api;
    if(isDark())setShift(true);
    document.addEventListener('fwgtheme',function(e){setShift(e.detail)});
  })();
})();
