(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=960,H=600, roadBottom=600, horizon=205;
let state='title',last=0,elapsed=0,distance=0,speed=18,health=3,lane=1,visualLane=1,jump=0,slide=0,invuln=0,shake=0,score=0,objects=[],particles=[],spawnAt=30,boss=false,bossTime=0,bossHit=0,toastTimer=0;
let busX=0,runFrame=0;
const ui={overlay:document.getElementById('overlay'),start:document.getElementById('start'),distance:document.getElementById('distance'),hearts:document.getElementById('hearts'),speed:document.getElementById('speed'),progress:document.getElementById('progress'),bossTag:document.getElementById('bossTag'),toast:document.getElementById('toast')};
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0)}
new ResizeObserver(resize).observe(canvas);resize();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rand=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
function roundRect(c,x,y,w,h,r,fill,stroke=null,lw=2){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.lineWidth=lw;c.strokeStyle=stroke;c.stroke()}}
function poly(points,fill,stroke=null,lw=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke()}}
function text(s,x,y,size,color='#352539',align='center',font='Outfit'){ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.font=`900 ${size}px ${font}, sans-serif`;ctx.fillText(s,x,y)}
function drawSky(t){
 const g=ctx.createLinearGradient(0,0,0,330);g.addColorStop(0,'#f77c64');g.addColorStop(.55,'#ffb56f');g.addColorStop(1,'#ffda91');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // late-afternoon sun and cirrus
 ctx.fillStyle='#ffe2a0';ctx.beginPath();ctx.arc(755,115,43,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd08a55';ctx.beginPath();ctx.arc(755,115,59,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#fff0c04a';for(let i=0;i<5;i++){let x=((i*230-distance*.16)%1250+1250)%1250-80;ctx.beginPath();ctx.ellipse(x,75+i%2*34,48,5,0,0,Math.PI*2);ctx.fill()}
 // Monte Pellegrino silhouette
 poly([[0,256],[42,238],[98,219],[133,225],[181,205],[224,214],[268,230],[322,224],[365,240],[416,229],[457,242],[516,225],[559,238],[610,220],[668,228],[717,214],[765,227],[813,211],[865,229],[920,215],[960,224],[960,335],[0,335]],'#a75e62');
 poly([[0,260],[48,249],[101,228],[152,232],[201,215],[245,226],[289,239],[346,230],[398,248],[450,233],[510,242],[565,228],[614,240],[667,227],[724,237],[777,224],[821,240],[874,226],[922,239],[960,230],[960,346],[0,346]],'#c87568');
 // distant rooftops
 for(let i=0;i<20;i++){let x=i*53-(distance*.38%53),w=34+(i*17%19),h=34+(i*29%43),y=305-h;ctx.fillStyle=['#e6a078','#efbb85','#d98b71','#f2ca91'][i%4];ctx.fillRect(x,y,w,h);ctx.fillStyle='#9b5b59';ctx.fillRect(x+5,y+7,5,8);ctx.fillRect(x+18,y+7,5,8);ctx.fillRect(x+5,y+23,5,8);ctx.fillRect(x+18,y+23,5,8);ctx.fillRect(x+w/2-4,y-8,8,8)}
 // street canyon buildings
 building(0,190,220,170,'#c96953','#f0a36d',distance*.68);building(740,212,220,178,'#b55c54','#e59068',distance*.68);
 // street plane
 poly([[387,207],[573,207],[1030,600],[-70,600]],'#494453');
 poly([[387,207],[405,207],[185,600],[90,600]],'#716056');poly([[555,207],[573,207],[870,600],[775,600]],'#716056');
 // sidewalks and curb
 poly([[370,207],[388,207],[88,600],[-20,600]],'#f5cf9c');poly([[573,207],[590,207],[980,600],[872,600]],'#f5cf9c');
 // dashed lane lines in perspective
 for(let i=0;i<2;i++){let off=(distance*8)%70;for(let j=0;j<7;j++){let d=j*70+off,y=horizon+d*.72;if(y>600)continue;let f=(y-horizon)/(600-horizon),x=480+(i===0?-1:1)*(12+f*128);let ww=1+f*4,hh=5+f*13;ctx.fillStyle='#ffe4a0aa';ctx.fillRect(x-ww/2,y,ww,hh)}}
 // sidewalk paving seams
 for(let j=0;j<8;j++){let y=250+j*54+(distance*5%54);if(y>600)continue;let f=(y-horizon)/(600-horizon);ctx.strokeStyle='#9d6d5f55';ctx.lineWidth=1+f;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(180*f+90,y);ctx.moveTo(960,y);ctx.lineTo(870-180*f,y);ctx.stroke()}
 drawLamp(75,310,0);drawLamp(872,290,1);drawBalcony(90,240);drawBalcony(831,251);
 // tram wires
 ctx.strokeStyle='#53435a77';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(180,170);ctx.quadraticCurveTo(470,204,790,170);ctx.stroke();
 // chasing bus, getting closer as speed builds
 drawBus(480+Math.sin(t*2)*4,324,clamp(.65+(speed-18)*.012,.65,1.05));
}
function building(x,y,w,h,base,light,offset){ctx.fillStyle=base;ctx.fillRect(x,y,w,h);ctx.fillStyle=light;ctx.fillRect(x+5,y+8,w-10,15);ctx.fillStyle='#833f4c';ctx.fillRect(x+9,y+29,w-18,8);for(let xx=x+15;xx<x+w-12;xx+=31){for(let yy=y+48;yy<y+h-20;yy+=43){ctx.fillStyle='#673e4c';ctx.fillRect(xx,yy,17,28);ctx.fillStyle='#f6cc92';ctx.fillRect(xx+3,yy+4,11,18);ctx.fillStyle='#9b5c55';ctx.fillRect(xx-4,yy+23,25,4);}}ctx.fillStyle='#f3c183';ctx.fillRect(x-4,y-7,w+8,8);ctx.fillStyle='#864853';ctx.fillRect(x,y+h-14,w,14);}
function drawBalcony(x,y){ctx.strokeStyle='#55384a';ctx.lineWidth=3;ctx.strokeRect(x,y,48,18);for(let i=1;i<6;i++){ctx.beginPath();ctx.moveTo(x+i*8,y);ctx.lineTo(x+i*8,y+18);ctx.stroke()}ctx.beginPath();ctx.moveTo(x-3,y+1);ctx.lineTo(x+51,y+1);ctx.stroke()}
function drawLamp(x,y,flip){ctx.strokeStyle='#47394c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y+100);ctx.lineTo(x,y);ctx.lineTo(x+(flip?-24:24),y-13);ctx.stroke();ctx.fillStyle='#ffedb5';ctx.beginPath();ctx.ellipse(x+(flip?-24:24),y-14,12,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0bd66';ctx.beginPath();ctx.arc(x+(flip?-24:24),y-14,21,0,Math.PI*2);ctx.fill()}
function drawBus(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#39283c66';ctx.beginPath();ctx.ellipse(0,29,53,9,0,0,Math.PI*2);ctx.fill();roundRect(ctx,-47,-54,94,77,13,'#f3c646','#3f2a3c',4);roundRect(ctx,-36,-44,72,30,5,'#8bd2cc','#3f2a3c',3);ctx.fillStyle='#f7ead0';ctx.fillRect(-32,-40,27,21);ctx.fillRect(4,-40,27,21);ctx.fillStyle='#ea6748';ctx.fillRect(-42,-9,84,21);ctx.fillStyle='#f9df92';ctx.fillRect(-36,-5,72,4);ctx.fillStyle='#fff2ca';ctx.fillRect(-43,6,9,10);ctx.fillRect(34,6,9,10);ctx.fillStyle='#34263a';ctx.beginPath();ctx.arc(-28,23,10,0,Math.PI*2);ctx.arc(28,23,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#aaa';ctx.beginPath();ctx.arc(-28,23,4,0,7);ctx.arc(28,23,4,0,7);ctx.fill();ctx.fillStyle='#3b293b';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('101 · STADIO',0,-49);ctx.restore()}
function roadPoint(l,y){const f=clamp((y-horizon)/(600-horizon),0,1),center=480+(l-1)*(15+f*160);return center}
function drawPlayer(t){visualLane+=(lane-visualLane)*.20;const x=roadPoint(visualLane,490),baseY=493-(jump>0?Math.sin(Math.PI*jump/.72)*66:0),duck=slide>0;ctx.save();ctx.translate(x,baseY);if(invuln>0&&Math.floor(t*14)%2)ctx.globalAlpha=.42;
 // shadow and running legs
 ctx.fillStyle='#34243b55';ctx.beginPath();ctx.ellipse(0,5+jump*44,25-jump*6,7,0,0,Math.PI*2);ctx.fill();
 const run=Math.sin(t*14)*7*(jump?0:.8);ctx.strokeStyle='#403044';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-7,duck? -7:17);ctx.lineTo(-12+run,34);ctx.lineTo(-19+run,39);ctx.moveTo(7,duck?-7:17);ctx.lineTo(12-run,34);ctx.lineTo(19-run,39);ctx.stroke();ctx.strokeStyle='#f3c449';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-20+run,40);ctx.lineTo(-9+run,40);ctx.moveTo(10-run,40);ctx.lineTo(22-run,40);ctx.stroke();
 // backpack
 roundRect(ctx,duck?-18:-18,duck?-27:-14,12,23,5,'#e66d49','#39283d',2);
 // hoodie and arms
 roundRect(ctx,duck?-20:-17,duck?-36:-6,34,duck?25:31,9,'#52b9ad','#39283d',3);ctx.strokeStyle='#39283d';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-15,duck?-22:0);ctx.lineTo(-24+Math.sin(t*13)*7,duck?-13:12);ctx.moveTo(15,duck?-22:0);ctx.lineTo(23-Math.sin(t*13)*7,duck?-13:12);ctx.stroke();
 // head, hair and enormous glasses
 ctx.fillStyle='#f1ae83';ctx.beginPath();ctx.arc(0,duck?-37:-31,14,0,Math.PI*2);ctx.fill();ctx.fillStyle='#39283d';ctx.beginPath();ctx.arc(0,duck?-41:-36,14,Math.PI,Math.PI*2);ctx.lineTo(13,duck?-34:-28);ctx.lineTo(-13,duck?-34:-28);ctx.fill();ctx.strokeStyle='#38283d';ctx.lineWidth=2.5;ctx.strokeRect(-12,duck?-39:-34,10,8);ctx.strokeRect(2,duck?-39:-34,10,8);ctx.beginPath();ctx.moveTo(-2,duck?-35:-30);ctx.lineTo(2,duck?-35:-30);ctx.stroke();ctx.fillStyle='#34243b';ctx.beginPath();ctx.arc(-7,duck?-35:-30,1.5,0,7);ctx.arc(7,duck?-35:-30,1.5,0,7);ctx.fill();ctx.fillStyle='#e7785d';ctx.beginPath();ctx.arc(0,duck?-28:-23,2,0,7);ctx.fill();
 if(jump>0){ctx.strokeStyle='#fff0bb';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-29,26,-2.8,-.4);ctx.stroke()}ctx.restore();
}
function objectXY(o){const z=clamp(1-(o.d-distance)/115,0,1),y=235+z*280;return {x:roadPoint(o.lane,y),y,s:.28+z*.87,z}}
function drawObstacle(o,t){const {x,y,s}=objectXY(o);ctx.save();ctx.translate(x,y);ctx.scale(s,s);if(o.type==='letter'){
 ctx.save();ctx.rotate(Math.sin(t*2+o.d)*.07);roundRect(ctx,-34,-48,68,66,8,'#ffb82e','#35243c',4);text(pickLetter(o.seed),0,-13,62,'#ed5644');ctx.fillStyle='#fff0bd';ctx.beginPath();ctx.arc(-22,-37,4,0,7);ctx.arc(22,-37,4,0,7);ctx.fill();ctx.restore();ctx.fillStyle='#fff4d2';text('JUMP',0,30,11,'#fff4d2','center','DM Mono')
 }else if(o.type==='bully'){
 // red/black Palermo jersey tough guy and slapping palm
 ctx.fillStyle='#302237';ctx.beginPath();ctx.ellipse(0,2,31,8,0,0,7);ctx.fill();ctx.strokeStyle='#33243a';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-11,-15);ctx.lineTo(-14,1);ctx.lineTo(-17,5);ctx.moveTo(11,-15);ctx.lineTo(13,1);ctx.stroke();roundRect(ctx,-25,-57,50,45,8,'#e84e50','#33243a',3);ctx.fillStyle='#282438';ctx.fillRect(-25,-36,50,10);ctx.fillStyle='#f7e6cc';text('PALERMO',0,-28,8,'#fff1d2','center','DM Mono');ctx.fillStyle='#f0b18a';ctx.beginPath();ctx.arc(0,-69,17,0,7);ctx.fill();ctx.fillStyle='#392a3c';ctx.beginPath();ctx.arc(0,-73,17,Math.PI,Math.PI*2);ctx.fill();ctx.strokeStyle='#e95c50';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(20,-49);ctx.lineTo(38,-63+Math.sin(t*10)*5);ctx.stroke();ctx.fillStyle='#f2b68b';ctx.beginPath();ctx.ellipse(41,-65+Math.sin(t*10)*5,10,7,.2,0,7);ctx.fill();text('SLIDE',0,20,10,'#fff4d2','center','DM Mono')
 }else if(o.type==='cyclist'){
 ctx.strokeStyle='#34263d';ctx.lineWidth=4;ctx.beginPath();ctx.arc(-22,-3,17,0,7);ctx.arc(25,-3,17,0,7);ctx.stroke();ctx.strokeStyle='#f0bd42';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-22,-3);ctx.lineTo(-5,-28);ctx.lineTo(7,-3);ctx.lineTo(-22,-3);ctx.moveTo(-5,-28);ctx.lineTo(25,-3);ctx.lineTo(8,-30);ctx.stroke();ctx.fillStyle='#e5544b';ctx.beginPath();ctx.arc(0,-47,9,0,7);ctx.fill();ctx.strokeStyle='#3b2b3d';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(-2,-39);ctx.lineTo(-8,-25);ctx.lineTo(8,-22);ctx.lineTo(17,-30);ctx.moveTo(-6,-26);ctx.lineTo(-19,-18);ctx.stroke();text('BELL!',0,17,10,'#fff2d6','center','DM Mono')
 }else if(o.type==='rose'){
 ctx.shadowColor='#ef425c';ctx.shadowBlur=14;for(let i=0;i<5;i++){ctx.fillStyle=i%2?'#ee405b':'#b82551';ctx.beginPath();ctx.ellipse(Math.cos(i*1.256)*11,Math.sin(i*1.256)*11,10,15,i*1.256,0,7);ctx.fill()}ctx.fillStyle='#f5cb5c';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();ctx.strokeStyle='#427951';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(0,27);ctx.stroke();ctx.shadowBlur=0;text('ROSA!',0,41,9,'#fff1d2','center','DM Mono')
 }ctx.restore()}
function pickLetter(seed){return ['A','R','S','O','L','E','!'][Math.abs(Math.floor(seed*11))%7]}
function drawRosalia(t){if(!boss)return;const phase=clamp(bossTime/12,0,1),y=248+phase*38,scale=.77+phase*.28,x=480+Math.sin(t*1.6)*6;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.shadowColor='#ef5272';ctx.shadowBlur=22;
 // golden radiating halo
 ctx.strokeStyle='#ffe397';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-38,75+Math.sin(t*3)*3,0,Math.PI*2);ctx.stroke();for(let i=0;i<12;i++){let a=i*Math.PI/6+t*.08;ctx.beginPath();ctx.moveTo(Math.cos(a)*83,Math.sin(a)*83-38);ctx.lineTo(Math.cos(a)*101,Math.sin(a)*101-38);ctx.stroke()}
 // veil, robe and shoulders
 ctx.shadowBlur=0;ctx.fillStyle='#f8edd2';ctx.beginPath();ctx.moveTo(-58,-42);ctx.quadraticCurveTo(-75,-96,-39,-117);ctx.quadraticCurveTo(0,-134,39,-117);ctx.quadraticCurveTo(74,-91,58,-42);ctx.lineTo(85,77);ctx.quadraticCurveTo(0,104,-85,77);ctx.closePath();ctx.fill();ctx.strokeStyle='#37243d';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#b8d7c5';ctx.beginPath();ctx.moveTo(-26,-80);ctx.quadraticCurveTo(0,-98,26,-80);ctx.lineTo(57,77);ctx.lineTo(-57,77);ctx.closePath();ctx.fill();
 // face and hair
 ctx.fillStyle='#eab18a';ctx.beginPath();ctx.ellipse(0,-71,24,29,0,0,7);ctx.fill();ctx.fillStyle='#694354';ctx.beginPath();ctx.arc(0,-76,25,Math.PI,0);ctx.fill();ctx.fillRect(-25,-77,8,38);ctx.fillRect(17,-77,8,38);ctx.fillStyle='#3d2c3d';ctx.beginPath();ctx.arc(-8,-69,2,0,7);ctx.arc(8,-69,2,0,7);ctx.fill();ctx.strokeStyle='#b84e58';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-59,6,.1,Math.PI-.1);ctx.stroke();
 // crown
 poly([[-38,-102],[-32,-133],[-13,-115],[0,-149],[14,-116],[34,-137],[39,-102]],'#f6ca52','#3a2a3c',4);ctx.fillStyle='#e74e60';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.arc(i*18,-122-(i===0?18:0),4,0,7);ctx.fill()}
 // bouquet she carries
 ctx.fillStyle='#527b55';ctx.fillRect(-45,0,4,50);ctx.fillRect(-27,4,4,43);for(const [rx,ry] of [[-48,0],[-29,3],[-38,-12]]){ctx.fillStyle='#dc4358';for(let k=0;k<5;k++){ctx.beginPath();ctx.ellipse(rx+Math.cos(k*1.26)*7,ry+Math.sin(k*1.26)*7,5,8,k*1.26,0,7);ctx.fill()}}ctx.fillStyle='#fff4dc';text('SANTA ROSALIA',0,118,12,'#fff0d3','center','DM Mono');ctx.restore();
 // attack warning lanes
}
function drawScene(t){ctx.save();if(shake>0)ctx.translate(rand(-shake,shake),rand(-shake,shake));drawSky(t);drawRosalia(t);for(const o of objects){if(o.d-distance<120&&o.d>=distance-4)drawObstacle(o,t)}drawPlayer(t);drawParticles();ctx.restore();
 // vignette and film grain accents
 const vg=ctx.createRadialGradient(480,330,210,480,330,620);vg.addColorStop(.55,'#3b253500');vg.addColorStop(1,'#36243a33');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}
function drawParticles(){for(const p of particles){ctx.globalAlpha=clamp(p.life,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill()}ctx.globalAlpha=1}
function spawn(type,laneIndex,d){objects.push({type,lane:laneIndex,d,seed:Math.random()})}
function makeObstacle(){let type=pick(['letter','bully','cyclist','cyclist','letter','bully']),l=Math.floor(Math.random()*3);spawn(type,l,spawnAt);if(Math.random()<.30){let other=(l+1+Math.floor(Math.random()*2))%3;spawn(Math.random()<.5?'letter':'cyclist',other,spawnAt+2)}spawnAt+=rand(29,43)}
function startGame(){state='play';elapsed=0;distance=0;speed=18;health=3;lane=1;visualLane=1;jump=slide=invuln=shake=score=0;objects=[];particles=[];spawnAt=34;boss=false;bossTime=0;bossHit=0;ui.overlay.classList.add('hidden');ui.bossTag.style.display='none';last=performance.now();}
function showEnd(win){state=win?'win':'over';ui.overlay.classList.remove('hidden');const best=Math.max(Number(localStorage.getItem('busettaBest')||0),Math.floor(distance));if(win)localStorage.setItem('busettaBest',best);const card=ui.overlay.querySelector('.card');card.innerHTML=`<div class="eyebrow">${win?'Palermo salutes you':'The bus has left the stop'}</div><h1>${win?'BUS<br><em>CAUGHT!</em>':'OOPS!<br><em>Game over.</em>'}</h1><p>${win?'You outran Santa Rosalia and made the 101. Palermo will sing your name.':'The streets got the better of you this time. Lace up those sneakers and try again!'}</p><div class="controls"><div class="key">DISTANCE <span>${Math.floor(distance)} m</span></div><div class="key">BEST <span>${best} m</span></div></div><button id="restart" class="button">${win?'Run it back':'Try again'} →</button><div class="foot">${win?'NEXT STOP: VITTORIO EMANUELE':'THAT BUS WAS TOO FAST ANYWAY'}</div>`;document.getElementById('restart').addEventListener('click',startGame)}
function say(msg){ui.toast.textContent=msg;ui.toast.style.opacity=1;toastTimer=1.5}
function burst(x,y,color,n=12){for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-100,100),vy:rand(-160,-20),r:rand(2,5),life:1,color})}
function damage(){if(invuln>0)return;health--;invuln=1.3;shake=9;burst(roadPoint(lane,490),470,'#ffb451',18);say(health?'Ouch! Keep moving!':'One more hit and it is nap time!');if(health<=0){setTimeout(()=>{if(state==='play')showEnd(false)},550)}}
function action(a){if(state!=='play')return;if(a==='left')lane=Math.max(0,lane-1);if(a==='right')lane=Math.min(2,lane+1);if(a==='jump'&&jump<=0&&slide<=0)jump=.001;if(a==='slide'&&jump<=0)slide=.58}
function update(dt,t){if(state!=='play')return;elapsed+=dt;speed=Math.min(39,18+elapsed*.36);distance+=speed*dt;runFrame+=dt;visualLane+=(lane-visualLane)*Math.min(1,dt*11);if(jump>0){jump+=dt;if(jump>.72)jump=0}slide=Math.max(0,slide-dt);invuln=Math.max(0,invuln-dt);shake=Math.max(0,shake-dt*28);
 if(distance>850&&!boss){boss=true;bossTime=0;bossHit=.6;ui.bossTag.style.display='block';say('The Santuzza is coming! Dodge her roses!')}
 if(!boss){while(distance>spawnAt)makeObstacle()}else{bossTime+=dt;bossHit-=dt;if(bossHit<=0&&bossTime<11){let l=Math.floor(Math.random()*3);spawn('rose',l,distance+speed*1.0);if(bossTime>5&&Math.random()<.34)spawn('rose',(l+1+Math.floor(Math.random()*2))%3,distance+speed*1.12);bossHit=rand(1.05,1.42)}if(bossTime>12.5){distance=1000;ui.bossTag.style.display='none';showEnd(true);return}}
 for(const o of objects){const gap=o.d-distance;if(gap<5.3&&gap>-2.5&&o.lane===lane&&!o.hit){o.hit=true;let safe=o.type==='letter'?jump>.20:o.type==='bully'?slide>.12:false;if(safe){score+=10;burst(roadPoint(lane,482),450,o.type==='letter'?'#ffcd52':'#6fe1c8',8)}else damage()}}
 objects=objects.filter(o=>o.d>distance-12);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=250*dt;p.life-=dt*1.5}particles=particles.filter(p=>p.life>0);if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)ui.toast.style.opacity=0}
 ui.distance.textContent=String(Math.floor(distance)).padStart(3,'0');ui.hearts.textContent='♥'.repeat(Math.max(0,health))||'—';ui.speed.textContent=(speed/18).toFixed(1)+'×';ui.progress.style.width=Math.min(100,distance/10)+'%';
}
ui.start.addEventListener('click',startGame);
window.addEventListener('keydown',e=>{const key=e.key.toLowerCase(),map={arrowleft:'left',a:'left',arrowright:'right',d:'right',arrowup:'jump',w:'jump',' ':'jump',arrowdown:'slide',s:'slide'};if(key==='enter'&&(state==='title'||state==='over'||state==='win')){if(state==='title')startGame();else document.getElementById('restart')?.click();return}if(map[key]){e.preventDefault();action(map[key])}});
document.querySelectorAll('.touch').forEach(button=>button.addEventListener('pointerdown',e=>{e.preventDefault();action(button.dataset.action)}));
let touchStart=null;canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')touchStart={x:e.clientX,y:e.clientY}});canvas.addEventListener('pointerup',e=>{if(!touchStart)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))action(dx<0?'left':'right');else action(dy<0?'jump':'slide')});
function frame(now){const dt=Math.min(.04,(now-last)/1000||0);last=now;if(state==='play')update(dt,now/1000);drawScene(now/1000);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
})();
