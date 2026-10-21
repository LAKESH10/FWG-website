/* FWG animated 3D vignettes.
 * One hidden WebGL renderer draws every small scene (service cards, steps, statement, numbers tower)
 * and copies each frame into that element's own 2D canvas, so the page uses a single GPU context.
 * Scenes only animate while on screen; with reduced motion each shows one still frame.
 * Elements opt in with data-fx="name"; their <img> stays as the fallback when WebGL is unavailable. */
(function(){
  if(typeof THREE==='undefined')return;
  var els=[].slice.call(document.querySelectorAll('[data-fx]'));
  if(!els.length)return;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var R;
  try{R=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){return}
  if(!R.getContext())return;
  var SZ=760;
  R.setPixelRatio(1);R.setSize(SZ,SZ);R.setClearColor(0x000000,0);R.setScissorTest(true);
  R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=.95;
  var env=new THREE.PMREMGenerator(R).fromScene(new THREE.RoomEnvironment(),.04).texture;
  var lin=function(h){return new THREE.Color(h).convertSRGBToLinear()};
  var PI=Math.PI,sin=Math.sin,cos=Math.cos;
  function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
  function ease(x){x=clamp(x,0,1);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
  function smooth(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)}
  function back(x){x=clamp(x,0,1);var c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}

  /* shared brand materials (Burgundy #660220, White, Deep Charcoal, Burgundy tints) */
  var M={
    burg:new THREE.MeshPhysicalMaterial({color:lin(0x5E011D),roughness:.3,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.75}),
    white:new THREE.MeshPhysicalMaterial({color:lin(0xF6F3F4),roughness:.32,clearcoat:.7,clearcoatRoughness:.18,envMapIntensity:.9}),
    pink:new THREE.MeshPhysicalMaterial({color:lin(0xE6CCD2),roughness:.35,clearcoat:.7,clearcoatRoughness:.2}),
    rose:new THREE.MeshPhysicalMaterial({color:lin(0xA96877),roughness:.35,clearcoat:.8,clearcoatRoughness:.2}),
    dark:new THREE.MeshPhysicalMaterial({color:lin(0x231F20),roughness:.25,clearcoat:1,clearcoatRoughness:.08}),
    glass:new THREE.MeshPhysicalMaterial({color:lin(0x3A2A30),roughness:.05,metalness:.2,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:1.4}),
    led:new THREE.MeshStandardMaterial({color:lin(0xCC9AA5),emissive:lin(0xCC9AA5),emissiveIntensity:1.6})
  };
  function glow(op){return new THREE.MeshBasicMaterial({color:lin(0xE6CCD2),transparent:true,opacity:op,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false})}
  function ext(shape,depth,bevel){return new THREE.ExtrudeGeometry(shape,{depth:depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:8,curveSegments:48})}
  function rrect(w,h,r){var s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s}
  function mesh(g,m){return new THREE.Mesh(g,m)}
  /* a flat slab lying on the ground */
  function slab(w,d,h,r,m){var bv=Math.min(.05,h/3),g=ext(rrect(w,d,r),h,bv);g.translate(0,0,-h-bv);var o=mesh(g,m);o.rotation.x=-PI/2;return o}
  function norm(obj,h){var box=new THREE.Box3().setFromObject(obj),s=box.getSize(new THREE.Vector3());obj.scale.multiplyScalar(h/s.y);
    box=new THREE.Box3().setFromObject(obj);var c=box.getCenter(new THREE.Vector3());obj.position.x-=c.x;obj.position.z-=c.z;obj.position.y-=box.min.y;
    var w=new THREE.Group();w.add(obj);return w}
  var shTex=(function(){var c=document.createElement('canvas');c.width=c.height=128;var x=c.getContext('2d');var g=x.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(.5,'rgba(0,0,0,.2)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
  function shadow(sx,sz){var m=mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false,toneMapped:false}));m.rotation.x=-PI/2;m.scale.set(sx,sz,1);m.position.y=.01;return m}
  function stage(){var s=new THREE.Scene();s.environment=env;
    var k=new THREE.DirectionalLight(0xffffff,1.5);k.position.set(-3,6,5);s.add(k);
    var r=new THREE.DirectionalLight(0xFFE3EA,1.2);r.position.set(4,3,-4);s.add(r);
    s.add(new THREE.AmbientLight(0xffffff,.22));return s}
  function cam(fov,p,l){var c=new THREE.PerspectiveCamera(fov,1,.1,100);c.position.set(p[0],p[1],p[2]);c.userData.look=new THREE.Vector3(l[0],l[1],l[2]);c.lookAt(c.userData.look);return c}
  function ring(r,tube,m){var o=mesh(new THREE.TorusGeometry(r,tube,16,96),m);o.rotation.x=PI/2;return o}
  /* a small officer figure */
  function officer(){var g=new THREE.Group();
    var body=mesh(new THREE.CylinderGeometry(.16,.2,.5,24),M.white);body.position.y=.25;g.add(body);
    var belt=mesh(new THREE.CylinderGeometry(.205,.205,.06,24),M.dark);belt.position.y=.14;g.add(belt);
    var head=mesh(new THREE.SphereGeometry(.13,24,16),M.pink);head.position.y=.64;g.add(head);
    var cap=mesh(new THREE.CylinderGeometry(.14,.14,.07,24),M.dark);cap.position.y=.74;g.add(cap);
    var brim=mesh(new THREE.BoxGeometry(.12,.02,.1),M.dark);brim.position.set(0,.72,.14);g.add(brim);
    var badge=mesh(new THREE.SphereGeometry(.045,12,8),M.burg);badge.position.set(.08,.38,.17);g.add(badge);
    return g}

  /* ---------- objects (same builders as the static icon set) ---------- */
  function shieldObj(){var g=new THREE.Group();var sh=new THREE.Shape();
    function outline(s,k){s.moveTo(0,1.55*k);s.bezierCurveTo(.55*k,1.25*k,1.05*k,1.2*k,1.35*k,1.15*k);s.lineTo(1.35*k,.15*k);s.bezierCurveTo(1.35*k,-.85*k,.6*k,-1.45*k,0,-1.7*k);s.bezierCurveTo(-.6*k,-1.45*k,-1.35*k,-.85*k,-1.35*k,.15*k);s.lineTo(-1.35*k,1.15*k);s.bezierCurveTo(-1.05*k,1.2*k,-.55*k,1.25*k,0,1.55*k)}
    outline(sh,1);var geo=ext(sh,.42,.16);geo.center();g.add(mesh(geo,M.burg));
    var inner=new THREE.Shape();outline(inner,.78);var ig=ext(inner,.06,.04);ig.center();var im=mesh(ig,M.white);im.position.z=.33;g.add(im);
    var ck=new THREE.Shape();ck.moveTo(-.6,.05);ck.lineTo(-.16,-.42);ck.lineTo(.66,.46);ck.lineTo(.46,.66);ck.lineTo(-.16,0);ck.lineTo(-.42,.26);
    var cg=ext(ck,.12,.05);cg.center();var c=mesh(cg,M.burg);c.position.z=.46;g.add(c);g.userData.check=c;return g}
  function checkMesh(){var ck=new THREE.Shape();ck.moveTo(-.6,.05);ck.lineTo(-.16,-.42);ck.lineTo(.66,.46);ck.lineTo(.46,.66);ck.lineTo(-.16,0);ck.lineTo(-.42,.26);var cg=ext(ck,.1,.04);cg.center();return mesh(cg,M.burg)}
  function pinObj(){var g=new THREE.Group(),Rr=1,C=1.75,pts=[],th=Math.acos(Rr/C),i;
    for(i=0;i<=40;i++){var t=i/40*(PI-th);pts.push(new THREE.Vector2(Math.max(1e-4,Rr*sin(t)),C+Rr*cos(t)))}
    var last=pts[pts.length-1];for(i=1;i<=12;i++){var f=i/12;pts.push(new THREE.Vector2(Math.max(1e-4,last.x*(1-f)),last.y*(1-f)))}
    g.add(mesh(new THREE.LatheGeometry(pts,96),M.burg));
    var r=mesh(new THREE.TorusGeometry(.42,.12,24,72),M.white);r.position.set(0,C,.93);g.add(r);
    var d=mesh(new THREE.SphereGeometry(.26,32,24),M.pink);d.scale.z=.5;d.position.set(0,C,.95);g.add(d);return g}
  function cameraHead(){var g=new THREE.Group();
    var body=mesh(new THREE.CylinderGeometry(.52,.52,2.3,48),M.white);body.rotation.x=PI/2;g.add(body);
    var bk=mesh(new THREE.SphereGeometry(.52,32,24,0,PI*2,0,PI/2),M.white);bk.rotation.x=-PI/2;bk.position.z=-1.15;g.add(bk);
    var hood=mesh(new THREE.CylinderGeometry(.64,.64,2.1,48,1,true,-PI/2*1.15,PI*1.15),M.burg.clone());hood.material.side=THREE.DoubleSide;hood.rotation.x=PI/2;hood.rotation.y=PI/2;hood.position.z=.35;g.add(hood);
    var face=mesh(new THREE.CylinderGeometry(.5,.5,.06,48),M.dark);face.rotation.x=PI/2;face.position.z=1.16;g.add(face);
    var lens=mesh(new THREE.SphereGeometry(.3,32,24,0,PI*2,0,PI/2),M.glass);lens.rotation.x=PI/2;lens.position.z=1.18;g.add(lens);
    var led=mesh(new THREE.SphereGeometry(.06,12,8),new THREE.MeshStandardMaterial({color:lin(0xCC9AA5),emissive:lin(0xCC9AA5),emissiveIntensity:1.6}));led.position.set(.32,.24,1.2);g.add(led);g.userData.led=led;return g}
  function targetObj(){var g=new THREE.Group();
    function disc(r,d,m){var o=mesh(new THREE.CylinderGeometry(r,r,d,96),m);o.rotation.x=PI/2;o.position.z=d/2-.18;g.add(o)}
    disc(1.55,.36,M.burg);disc(1.2,.42,M.white);disc(.86,.48,M.burg);disc(.52,.54,M.white);disc(.24,.6,M.burg);
    var rim=mesh(new THREE.TorusGeometry(1.55,.07,16,96),M.burg);rim.position.z=.18;g.add(rim);var rb=rim.clone();rb.position.z=-.18;g.add(rb);return g}
  function arrowObj(){var ar=new THREE.Group(),L=2.5;
    var sh=mesh(new THREE.CylinderGeometry(.045,.045,L,16),M.white);sh.position.y=L/2-.12;ar.add(sh);
    var nk=mesh(new THREE.CylinderGeometry(.06,.05,.14,16),M.burg);nk.position.y=L-.05;ar.add(nk);
    var vs=new THREE.Shape();vs.moveTo(0,0);vs.lineTo(.34,.14);vs.lineTo(.34,.72);vs.lineTo(0,.62);vs.lineTo(0,0);
    var vg=new THREE.ExtrudeGeometry(vs,{depth:.022,bevelEnabled:false});vg.translate(.04,0,-.011);
    for(var i=0;i<3;i++){var v=mesh(vg,i===0?M.burg:M.pink);v.position.y=L-.86;v.rotation.y=i*PI*2/3;ar.add(v)}
    return ar}
  function towerObj(){var g=new THREE.Group(),wins=[];
    var t=mesh(ext(rrect(1.1,1.1,.12),2.8,.04),M.burg);t.rotation.x=-PI/2;g.add(t);
    for(var y=0;y<6;y++)for(var x=0;x<2;x++){var m=new THREE.MeshPhysicalMaterial({color:lin(0xE6CCD2),roughness:.35,clearcoat:.7,emissive:lin(0xE6CCD2),emissiveIntensity:0});
      var w=mesh(new THREE.BoxGeometry(.3,.2,.04),m);w.position.set(-.2+x*.4,.45+y*.38,.6);g.add(w);
      var w2=w.clone();w2.rotation.y=PI/2;w2.position.set(.6,.45+y*.38,-.2+x*.4);g.add(w2);wins.push(m)}
    var door=mesh(new THREE.BoxGeometry(.36,.4,.04),M.white);door.position.set(0,.2,.6);g.add(door);
    var rg=mesh(new THREE.TorusGeometry(1.0,.07,16,96),M.pink);rg.rotation.x=PI/2;rg.scale.set(1,.68,1);rg.position.y=3.15;g.add(rg);
    var l1=mesh(ext(rrect(.8,.8,.08),1.1,.03),M.white);l1.rotation.x=-PI/2;l1.position.set(-1.05,0,.25);g.add(l1);
    var l2=mesh(ext(rrect(.7,.7,.08),.7,.03),M.white);l2.rotation.x=-PI/2;l2.position.set(.95,0,.55);g.add(l2);
    g.userData.wins=wins;g.userData.ring=rg;return g}

  /* ---------- scenes ---------- */
  var FX={};

  /* Manned security: shield on guard, officers patrolling the perimeter, signal rings */
  FX.guard=function(){var s=stage();
    var sh=norm(shieldObj(),2.6);var hold=new THREE.Group();hold.add(sh);s.add(hold);sh.position.y+=.35;
    s.add(shadow(2.6,1.2));
    var rings=[0,1].map(function(){var r=ring(1,.03,glow(.6));r.position.y=.03;s.add(r);return r});
    var offs=[0,1,2].map(function(){var o=officer();o.scale.setScalar(1.15);s.add(o);var d=shadow(.6,.6);s.add(d);o.userData.sh=d;return o});
    var c=cam(26,[4.4,4.4,10.2],[0,1.35,0]);
    return{scene:s,cam:c,update:function(t){
      hold.position.y=.12*sin(t*1.6);hold.rotation.y=-.42+.38*sin(t*.6);
      rings.forEach(function(r,i){var p=(t*.4+i*.5)%1;r.scale.setScalar(.9+2.1*p);r.material.opacity=.55*(1-p)});
      offs.forEach(function(o,i){var a=t*.45+i*PI*2/3,x=2.15*cos(a),z=1.25*sin(a);o.position.set(x,Math.abs(sin(t*6+i))*.05,z);o.rotation.y=-a;o.userData.sh.position.set(x,.01,z)})}}};

  /* VIP and cash-in-transit: escort car and van follow a route to the GPS pin */
  FX.escort=function(){var s=stage();
    var tile=slab(5.6,3.9,.16,.45,M.white);s.add(tile);
    var curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-2.9,0,1.25),new THREE.Vector3(-1.6,0,.25),new THREE.Vector3(-.2,0,1.0),new THREE.Vector3(1.0,0,.1),new THREE.Vector3(1.75,0,-.85)]);
    var N=80,W=.26,pos=[],idx=[],i;
    for(i=0;i<=N;i++){var u=i/N,p=curve.getPointAt(u),tg=curve.getTangentAt(u),nx=-tg.z,nz=tg.x;pos.push(p.x+nx*W,.012,p.z+nz*W,p.x-nx*W,.012,p.z-nz*W);if(i<N){var a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}}
    var rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));rg.setIndex(idx);rg.computeVertexNormals();
    var road=mesh(rg,M.dark);road.material=M.dark.clone();road.material.side=THREE.DoubleSide;s.add(road);
    for(i=1;i<14;i++){var u2=i/14,pp=curve.getPointAt(u2),t2=curve.getTangentAt(u2);var d=mesh(new THREE.BoxGeometry(.05,.01,.16),M.white);d.position.set(pp.x,.02,pp.z);d.rotation.y=Math.atan2(t2.x,t2.z);s.add(d)}
    /* buildings on the map */
    [[-1.9,-1.05,.5,.7],[-.9,-1.1,.45,1.0],[.2,-1.05,.5,.55],[-.6,1.45,.6,.4],[1.6,1.1,.55,.8]].forEach(function(b,k){var o=mesh(ext(rrect(b[2],b[2],.06),b[3],.02),k%2?M.pink:M.white);o.rotation.x=-PI/2;o.position.set(b[0],0,b[1]);s.add(o)});
    function vehicle(main,roof){var g=new THREE.Group();var bd=mesh(ext(rrect(.34,.62,.1),.2,.03),main);bd.rotation.x=-PI/2;bd.position.y=.05;g.add(bd);
      var cb=mesh(ext(rrect(.28,.34,.08),.14,.03),roof);cb.rotation.x=-PI/2;cb.position.set(0,.26,-.03);g.add(cb);
      [[-.17,.2],[.17,.2],[-.17,-.2],[.17,-.2]].forEach(function(w){var wh=mesh(new THREE.CylinderGeometry(.07,.07,.06,16),M.dark);wh.rotation.z=PI/2;wh.position.set(w[0],.07,w[1]);g.add(wh)});
      var lt=mesh(new THREE.SphereGeometry(.035,8,6),M.led);lt.position.set(0,.43,-.03);g.add(lt);g.userData.lt=lt;return g}
    var car=vehicle(M.burg,M.white),van=vehicle(M.white,M.burg);s.add(car);s.add(van);
    var pin=norm(pinObj(),1.5);s.add(pin);var end=curve.getPointAt(1);pin.position.set(end.x+.05,0,end.z-.05);
    var pr=ring(.5,.03,glow(.7));pr.position.set(pin.position.x,.03,pin.position.z);s.add(pr);
    var c=cam(30,[0,6.9,9.4],[.1,.2,.1]);
    function place(o,u){u=clamp(u,0,1);var p=curve.getPointAt(u),t=curve.getTangentAt(u);o.position.set(p.x,.02,p.z);o.rotation.y=Math.atan2(t.x,t.z);var sc=smooth(0,.06,u)*(1-smooth(.92,1,u));o.visible=sc>.02;o.children.forEach(function(){});o.userData.k=sc}
    return{scene:s,cam:c,update:function(t){
      var u=(t*.11)%1.08;place(van,u);place(car,u-.09);
      [car,van].forEach(function(v){var k=v.userData.k||0,b=v===van?1.75:1.5;v.scale.set(b,b*Math.max(.001,k),b*(v===van?1.12:1));v.userData.lt.visible=(t*4|0)%2===0});
      pin.position.y=.12+.12*sin(t*2.2);
      var p=(t*.7)%1;pr.scale.setScalar(.6+1.6*p);pr.material.opacity=.7*(1-p)}}};

  /* Electronic security: camera pans, view cone sweeps the site, a visitor gets flagged */
  FX.cctv=function(){var s=stage();
    var tile=slab(5.4,3.8,.16,.45,M.white);s.add(tile);
    /* wall with the camera on a bracket */
    var pole=mesh(new THREE.CylinderGeometry(.09,.11,1.75,20),M.burg);pole.position.set(-1.75,.88,-.75);s.add(pole);
    var foot=mesh(new THREE.CylinderGeometry(.38,.44,.1,32),M.burg);foot.position.set(-1.75,.05,-.75);s.add(foot);
    var fr=ring(.38,.035,M.pink);fr.position.set(-1.75,.11,-.75);s.add(fr);
    var jt=mesh(new THREE.SphereGeometry(.14,20,14),M.burg);jt.position.set(-1.75,1.78,-.75);s.add(jt);
    var pan=new THREE.Group();pan.position.set(-1.75,1.98,-.75);s.add(pan);
    var head=cameraHead();head.scale.setScalar(.62);pan.add(head);
    var tilt=new THREE.Group();tilt.rotation.x=.36;pan.add(tilt);
    var cg=new THREE.ConeGeometry(1.0,3.8,48,1,true);cg.translate(0,-1.9,0);cg.rotateX(-PI/2);
    var cone=mesh(cg,glow(.16));cone.position.z=.62;tilt.add(cone);
    var person=officer();person.scale.setScalar(1.25);s.add(person);
    var mat=new THREE.LineBasicMaterial({color:lin(0xE6CCD2),transparent:true,toneMapped:false});
    var bp=[],h=.62,w=.38,L=.14;[[-1,1],[1,1],[-1,-1],[1,-1]].forEach(function(q){var x=q[0]*w,y=h+q[1]*h;bp.push(x,y,0,x-q[0]*L,y,0,x,y,0,x,y-q[1]*L,0)});
    var bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(bp,3));var box=new THREE.LineSegments(bg,mat);s.add(box);
    var ps=shadow(.7,.7);s.add(ps);
    var c=cam(28,[1.2,4.4,9.4],[.1,.95,0]);
    var fwd=new THREE.Vector3(),to=new THREE.Vector3(),cp=new THREE.Vector3();
    return{scene:s,cam:c,update:function(t){
      pan.rotation.y=.95+.55*sin(t*.7);
      var x=-.6+2.8*(.5+.5*sin(t*.33));person.position.set(x,Math.abs(sin(t*7))*.04,.75);person.rotation.y=cos(t*.33)>0?PI/2:-PI/2;
      ps.position.set(x,.012,.75);
      cone.getWorldPosition(cp);fwd.set(0,0,1).applyQuaternion(cone.getWorldQuaternion(new THREE.Quaternion()));to.set(x,.5,.75).sub(cp).normalize();
      var hit=fwd.dot(to)>Math.cos(.27);
      box.visible=hit&&((t*5|0)%3!==0);box.position.set(x,0,.75+.3);box.quaternion.copy(c.quaternion);
      cone.material.opacity=hit?.26:.15;head.userData.led.material.emissiveIntensity=hit?(1+sin(t*20)):.8}}};

  /* Safety and risk: the risk gauge falls from high to low as safety measures go in */
  FX.risk=function(){var s=stage();
    var g=new THREE.Group();s.add(g);
    function semi(r){var sh=new THREE.Shape();sh.moveTo(r,0);sh.absarc(0,0,r,0,PI,false);sh.lineTo(r,0);return sh}
    var face=mesh(ext(semi(1.5),.16,.04),M.white);face.position.z=-.04;g.add(face);
    var backing=mesh(ext(semi(1.64),.14,.05),M.burg);backing.position.z=-.22;g.add(backing);
    var bands=[[0,PI/3,M.burg],[PI/3,PI/3,M.rose],[2*PI/3,PI/3,M.pink]];
    bands.forEach(function(b){var a=mesh(new THREE.TorusGeometry(1.22,.12,16,64,b[1]),b[2]);a.rotation.z=PI-b[0]-b[1];a.position.z=.14;g.add(a)});
    for(var i=0;i<=8;i++){var tk=mesh(new THREE.BoxGeometry(.04,.16,.04),M.dark);var a=PI-i*PI/8;tk.position.set(.92*cos(a),.92*sin(a),.15);tk.rotation.z=a-PI/2;g.add(tk)}
    var base=mesh(ext(rrect(3.5,.34,.1),.4,.04),M.burg);base.position.set(0,-.17,-.24);g.add(base);
    var needle=new THREE.Group();needle.position.z=.2;g.add(needle);
    var nd=mesh(new THREE.CylinderGeometry(.02,.07,1.15,16),M.dark);nd.position.y=.56;needle.add(nd);
    var hub=mesh(new THREE.SphereGeometry(.14,24,16),M.burg);needle.add(hub);
    g.position.y=.38;g.scale.setScalar(1.05);
    /* safety cones */
    function sc(){var o=new THREE.Group();var b=mesh(new THREE.BoxGeometry(.5,.05,.5),M.burg);b.position.y=.025;o.add(b);
      var cn=mesh(new THREE.ConeGeometry(.2,.6,32),M.burg);cn.position.y=.33;o.add(cn);
      var st=mesh(new THREE.CylinderGeometry(.125,.155,.1,32),M.white);st.position.y=.33;o.add(st);return o}
    var cones=[[-1.5,.9],[0,1.25],[1.5,.9]].map(function(p){var o=sc();o.position.set(p[0],0,p[1]);s.add(o);return o});
    s.add(shadow(4,1.6));
    var c=cam(27,[1.4,2.9,9.6],[0,.95,.3]);
    return{scene:s,cam:c,update:function(t){
      var T=7,p=(t%T)/T;
      var lvl=p<.12?0:(p<.72?ease((p-.12)/.6):1-ease((p-.86)/.14));
      needle.rotation.z=-1.2+2.3*lvl*(lvl>0?1:1);  /* right = high risk, left = low risk */
      needle.rotation.z=(-1.25)+(2.5)*lvl;
      needle.rotation.z+=.03*sin(t*9)*(1-lvl);
      cones.forEach(function(o,i){var k=back((p-.18-i*.17)/.12);if(p>.9)k=1-smooth(.9,1,p);o.scale.setScalar(Math.max(.001,k))});
      g.rotation.y=.18*sin(t*.5)}}};

  /* Statement: the arrow strikes the centre, then the target settles */
  FX.target=function(){var s=stage();
    var tg=targetObj();var hold=new THREE.Group();hold.add(tg);s.add(hold);hold.rotation.set(-.06,-.2,0);
    var ar=arrowObj();hold.add(ar);var hit=new THREE.Vector3(.04,.06,.42),dir=new THREE.Vector3(-.95,.6,.8).normalize();
    var q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
    var rp=mesh(new THREE.TorusGeometry(.3,.025,12,64),glow(.8));rp.position.set(0,0,.62);hold.add(rp);
    var c=cam(24,[3.2,1.6,11.8],[0,-.05,0]);
    return{scene:s,cam:c,update:function(t){
      var T=4.6,p=(t%T)/T,fly=ease(p/.16),out=smooth(.9,1,p);
      ar.quaternion.copy(q);
      var d=(1-fly)*7;ar.position.copy(hit).addScaledVector(dir,d);
      var wob=p>.16?Math.exp(-(p-.16)*30)*sin((p-.16)*90)*.06:0;ar.rotateX(wob);
      ar.scale.setScalar(Math.max(.001,1-out));
      var r=p>.16?(p-.16)/.5:0;rp.visible=r>0&&r<1;rp.scale.setScalar(1+5*r);rp.material.opacity=.8*(1-r);
      hold.rotation.y=-.2+.12*sin(t*.5);hold.position.y=.08*sin(t*1.1);
      hold.position.x=p>.16&&p<.2?.04*sin(p*400):0}}};

  /* Numbers: headquarters tower with lit windows and a turning ring */
  FX.tower=function(){var s=stage();var tw=towerObj();var n=norm(tw,3.2);n.rotation.y=-.55;s.add(n);s.add(shadow(3.4,2.2));
    var c=cam(24,[4.6,4.1,10.6],[0,1.55,0]);var W=tw.userData.wins;
    return{scene:s,cam:c,update:function(t){tw.userData.ring.rotation.z=t*.6;tw.userData.ring.position.y=3.15+.08*sin(t*1.5);
      for(var i=0;i<W.length;i++)W[i].emissiveIntensity=.35+.35*sin(t*1.3+i*1.7)}}};

  /* Step 1: tell us about your site, a clipboard form fills in */
  FX.brief=function(){var s=stage();var g=new THREE.Group();s.add(g);
    var board=mesh(ext(rrect(2.1,2.7,.18),.12,.04),M.burg);g.add(board);
    var paper=mesh(new THREE.BoxGeometry(1.8,2.3,.03),M.white);paper.position.set(0,-.08,.17);g.add(paper);
    var clip=mesh(ext(rrect(.9,.3,.1),.14,.03),M.pink);clip.position.set(0,1.25,.12);g.add(clip);
    var rows=[],i;for(i=0;i<4;i++){var y=.72-i*.5;
      var bx=mesh(new THREE.BoxGeometry(.24,.24,.03),M.pink);bx.position.set(-.6,y,.2);g.add(bx);
      var ln=mesh(new THREE.BoxGeometry(1,.09,.03),M.rose);ln.geometry.translate(.5,0,0);ln.position.set(-.38,y,.2);g.add(ln);
      var ck=checkMesh();ck.scale.setScalar(.22);ck.position.set(-.6,y+.02,.26);g.add(ck);rows.push([ln,ck])}
    var pen=new THREE.Group();var pb=mesh(new THREE.CylinderGeometry(.06,.06,1.1,16),M.white);pb.position.y=.62;pen.add(pb);
    var pt=mesh(new THREE.ConeGeometry(.06,.16,16),M.burg);pt.rotation.x=PI;pt.position.y=.0;pen.add(pt);pen.rotation.z=-.5;g.add(pen);
    g.rotation.set(-.12,.32,.04);g.position.y=1.45;
    var c=cam(24,[0,1.6,11],[0,1.45,0]);
    return{scene:s,cam:c,update:function(t){var T=6,p=(t%T)/T,i;
      for(i=0;i<4;i++){var a=.08+i*.19,k=ease((p-a)/.14),fade=1-smooth(.88,.98,p);rows[i][0].scale.x=Math.max(.001,k*fade*(i===3?.55:.8));
        var c2=back((p-a-.13)/.06)*fade;rows[i][1].scale.setScalar(Math.max(.001,.22*c2))}
      var cur=clamp(Math.floor((p-.08)/.19),0,3),lp=ease(((p-.08)%.19)/.14);
      pen.position.set(-.38+.8*lp,.72-cur*.5+.05,.32);pen.visible=p<.86&&p>.06;
      g.position.y=1.45+.06*sin(t*1.3)}}};

  /* Step 2: site survey, a magnifier passes over the floor plan and finds blind spots */
  FX.survey=function(){var s=stage();
    var plan=slab(4.6,2.8,.14,.3,M.white);s.add(plan);
    function wall(x1,z1,x2,z2){var l=Math.hypot(x2-x1,z2-z1);var w=mesh(new THREE.BoxGeometry(l,.32,.07),M.burg);w.position.set((x1+x2)/2,.16,(z1+z2)/2);w.rotation.y=-Math.atan2(z2-z1,x2-x1);s.add(w)}
    wall(-2.2,-1.3,2.2,-1.3);wall(-2.2,-1.3,-2.2,1.3);wall(2.2,-1.3,2.2,1.3);wall(-2.2,1.3,-.6,1.3);wall(.2,1.3,2.2,1.3);
    wall(-.5,-1.3,-.5,-.1);wall(-.5,.5,-.5,1.3);wall(.9,-.2,2.2,-.2);wall(.9,-.2,.9,.4);
    var spots=[[-1.8,-.9],[1.9,-.95],[-1.75,1.0],[1.8,.95],[.25,.1]].map(function(p){var d=mesh(new THREE.CircleGeometry(.24,32),new THREE.MeshBasicMaterial({color:lin(0x660220),transparent:true,opacity:.0,depthWrite:false,toneMapped:false}));d.rotation.x=-PI/2;d.position.set(p[0],.02,p[1]);s.add(d);d.userData.on=0;return d});
    var mg=new THREE.Group();var rm=mesh(new THREE.TorusGeometry(.42,.07,16,64),M.burg);mg.add(rm);
    var gl=mesh(new THREE.CircleGeometry(.4,48),glow(.22));mg.add(gl);
    var hd=mesh(new THREE.CylinderGeometry(.07,.07,.75,16),M.burg);hd.position.set(.55,-.5,0);hd.rotation.z=.75;mg.add(hd);
    mg.rotation.x=-1.05;s.add(mg);var msh=shadow(1.1,1.1);s.add(msh);
    var c=cam(26,[0,6.4,6.8],[0,0,.05]);
    return{scene:s,cam:c,update:function(t){var x=1.8*sin(t*.55),z=.9*sin(t*1.1);mg.position.set(x,.95+.08*sin(t*2),z+.25);msh.position.set(x,.015,z);
      spots.forEach(function(d){var dd=Math.hypot(d.position.x-x,d.position.z-z);if(dd<.55)d.userData.on=1;d.userData.on=Math.max(0,d.userData.on-.004);
        d.material.opacity=.55*d.userData.on*(.75+.25*sin(t*6));d.scale.setScalar(.8+.4*d.userData.on)})}}};

  /* Step 3: deploy and monitor, officers on site report into a live monitor */
  FX.monitor=function(){var s=stage();
    var cv=document.createElement('canvas');cv.width=320;cv.height=200;var cx=cv.getContext('2d');var tex=new THREE.CanvasTexture(cv);tex.encoding=THREE.sRGBEncoding;
    var mon=new THREE.Group();s.add(mon);
    var fr=mesh(ext(rrect(2.6,1.7,.14),.12,.04),M.dark);fr.position.y=1.55;mon.add(fr);
    var scr=mesh(new THREE.PlaneGeometry(2.36,1.46),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));scr.position.set(0,1.55,.17);mon.add(scr);
    var nk=mesh(new THREE.CylinderGeometry(.08,.1,.62,16),M.burg);nk.position.y=.4;mon.add(nk);
    var ft=mesh(ext(rrect(1.1,.5,.2),.08,.03),M.burg);ft.rotation.x=-PI/2;ft.position.y=0;mon.add(ft);
    mon.rotation.y=-.18;
    var offs=[[-2.25,.4],[2.2,.5]].map(function(p,i){var o=officer();o.scale.setScalar(1.35);o.position.set(p[0],0,p[1]);o.rotation.y=i?-.5:.5;s.add(o);var sh=shadow(.7,.7);sh.position.set(p[0],.01,p[1]);s.add(sh);
      var waves=[0,1,2].map(function(k){var a=mesh(new THREE.TorusGeometry(.18+k*.14,.025,8,32,PI/2),glow(.8));a.position.set(p[0],1.12,p[1]);a.rotation.z=PI/4;s.add(a);return a});o.userData.w=waves;return o});
    s.add(shadow(3,1));
    var pts=[];for(var i=0;i<40;i++)pts.push(.5);
    var c=cam(26,[0,2.2,10.4],[0,1.0,0]);var last=0;
    function draw(t){cx.fillStyle='#231F20';cx.fillRect(0,0,320,200);cx.strokeStyle='rgba(204,154,165,.18)';cx.lineWidth=1;
      for(var x=0;x<320;x+=32){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,200);cx.stroke()}for(var y=0;y<200;y+=32){cx.beginPath();cx.moveTo(0,y);cx.lineTo(320,y);cx.stroke()}
      cx.strokeStyle='#E6CCD2';cx.lineWidth=4;cx.beginPath();for(var i=0;i<pts.length;i++){var X=i*8.2,Y=170-pts[i]*120;i?cx.lineTo(X,Y):cx.moveTo(X,Y)}cx.stroke();
      cx.fillStyle='#660220';cx.fillRect(16,14,74,26);cx.fillStyle='#fff';cx.font='600 15px Inter, sans-serif';cx.fillText('LIVE',40,32);
      cx.fillStyle=(t*2|0)%2?'#CC9AA5':'#fff';cx.beginPath();cx.arc(29,27,5,0,7);cx.fill();
      for(var k=0;k<3;k++){cx.fillStyle=k===((t*1.2|0)%3)?'#E6CCD2':'rgba(230,204,210,.35)';cx.fillRect(220+k*30,16,22,22)}
      tex.needsUpdate=true}
    return{scene:s,cam:c,update:function(t){if(t-last>.09||!last){last=t;pts.shift();pts.push(.5+.28*sin(t*2.1)+.12*sin(t*5.3)+(Math.random()-.5)*.12);draw(t)}
      offs.forEach(function(o,i){o.userData.w.forEach(function(a,k){var p=((t*.9+k*.33+i*.5)%1);a.material.opacity=.85*sin(p*PI);a.scale.setScalar(.9+.2*p)})});
      mon.position.y=.04*sin(t*1.2)}}};

  /* ---------- run ---------- */
  var items=[];
  els.forEach(function(el){var f=FX[el.getAttribute('data-fx')];if(!f)return;var spec;try{spec=f()}catch(e){return}
    var cv=document.createElement('canvas');cv.className='fx-cv';cv.setAttribute('aria-hidden','true');el.appendChild(cv);el.classList.add('fx-on');
    items.push({el:el,cv:cv,ctx:cv.getContext('2d'),spec:spec,vis:false,w:0,h:0,t0:Math.random()*3})});
  function size(it){var dpr=Math.min(innerWidth<760?1.5:2,window.devicePixelRatio||1),w=it.el.clientWidth*dpr,h=it.el.clientHeight*dpr;if(!w||!h)return false;
    var k=Math.min(1,SZ/w,SZ/h);w=Math.round(w*k);h=Math.round(h*k);if(w!==it.w||h!==it.h){it.w=w;it.h=h;it.cv.width=w;it.cv.height=h;it.spec.cam.aspect=w/h;
      /* keep the subject the same size on wide or narrow boxes */
      var c=it.spec.cam;if(c.userData.fov0===undefined)c.userData.fov0=c.fov;var a=w/h,base=c.userData.base||1.12;
      c.fov=a<base?2*Math.atan(Math.tan(c.userData.fov0*PI/360)*base/a)*180/PI:c.userData.fov0;c.updateProjectionMatrix()}return true}
  function draw(it,t){if(!size(it))return;var w=it.w,h=it.h;it.spec.update(t+it.t0);
    R.setViewport(0,0,w,h);R.setScissor(0,0,w,h);R.clear();R.render(it.spec.scene,it.spec.cam);
    it.ctx.clearRect(0,0,w,h);it.ctx.drawImage(R.domElement,0,SZ-h,w,h,0,0,w,h)}
  var raf=null;
  var lastT=0;function tick(now){raf=null;var t=now/1000,any=false;if(now-lastT<24&&lastT){raf=requestAnimationFrame(tick);return}lastT=now;items.forEach(function(it){if(it.vis&&it.el.offsetParent!==null){draw(it,t);any=true}});if(any&&!reduce&&!document.hidden)raf=requestAnimationFrame(tick)}
  function kick(){if(!raf)raf=requestAnimationFrame(tick)}
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){items.forEach(function(it){if(it.el===e.target)it.vis=e.isIntersecting})});kick()},{rootMargin:'120px'});items.forEach(function(it){io.observe(it.el)})}
  else items.forEach(function(it){it.vis=true});
  addEventListener('resize',kick);addEventListener('hashchange',function(){setTimeout(kick,80)});document.addEventListener('visibilitychange',kick);
  if(reduce){reduce=true}
  kick();
  window.__fwgFx=items;
})();

/* FWG motion: staggered reveals, number count-up. Respects reduced motion. */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var groups=[].slice.call(document.querySelectorAll('.stagger'));
  groups.forEach(function(g){[].slice.call(g.children).forEach(function(c,i){c.style.setProperty('--i',i)})});
  var nums=[].slice.call(document.querySelectorAll('[data-count]'));
  function count(el){var to=+el.getAttribute('data-count'),from=+(el.getAttribute('data-from')||0),t0=null,D=1400;
    function f(now){if(!t0)t0=now;var p=Math.min(1,(now-t0)/D),e=1-Math.pow(1-p,3);var v=Math.round(from+(to-from)*e);el.textContent=(to>=1000&&!el.hasAttribute('data-plain'))?v.toLocaleString('en-US'):v;if(p<1)requestAnimationFrame(f)}
    el.textContent=from;requestAnimationFrame(f)}
  if(reduce||!('IntersectionObserver' in window)){groups.forEach(function(g){g.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var t=e.target;io.unobserve(t);
    if(t.hasAttribute('data-count'))count(t);else t.classList.add('in')})},{threshold:.18});
  groups.concat(nums).forEach(function(x){io.observe(x)});
})();
/* general enquiry form (preview: does not send) */
(function(){var f=document.getElementById('enquiry-form');if(!f)return;var d=document.getElementById('enquiry-done');
  f.addEventListener('submit',function(e){e.preventDefault();if(!f.checkValidity()){f.reportValidity();return}
    d.textContent='Thank you. In the live site your message would now go to the FWG team. This preview does not send anything.';d.classList.add('show')})})();
/* country-aware contact widgets: hotline, WhatsApp, quote country preset */
(function(){
  /* WhatsApp numbers per country, digits only with country code (e.g. '60123456789'). Leave empty to hide the button. */
  var WA={MY:'',IN:'',SG:''};
  var IN_PAGES=['india'],SG_PAGES=['singapore'];
  var fl=document.getElementById('float'),wa=document.getElementById('wa');
  function country(p){return IN_PAGES.indexOf(p)>=0?'IN':SG_PAGES.indexOf(p)>=0?'SG':'MY'}
  function apply(p){var c=country(p);
    if(fl){var b=fl.querySelector('b');if(c==='IN'){b.textContent='+91 44 4005 0684';fl.setAttribute('href','#india-contact');fl.setAttribute('aria-label','Talk to FWG India, +91 44 4005 0684')}
      else{b.textContent='1300 22 0000';fl.setAttribute('href','#quote');fl.setAttribute('aria-label','Talk to FWG, hotline 1300 22 0000')}}
    if(wa){var n=WA[c]||WA.MY;if(n){wa.hidden=false;wa.href='https://wa.me/'+n}else wa.hidden=true}}
  window.addEventListener('fwg:route',function(e){apply(e.detail)});
  var cur=document.querySelector('section.page:not([hidden])');apply(cur?cur.getAttribute('data-page'):'home');
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-country]');if(!a)return;var c=a.getAttribute('data-country');
    setTimeout(function(){var sel=document.getElementById('q-country');if(sel)sel.value=c},60)});
})();
