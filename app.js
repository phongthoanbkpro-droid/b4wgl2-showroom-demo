// B4WGL2 public preview — original procedural WebGL2 showcase.
// The original private Blend4Web CE scenes and runtime are NOT included.
const PRODUCTS = [
  {id:'chair',number:'01',name:'FORMA Lounge',type:'Ghế thư giãn · Demo',symbol:'◧',description:'Mẫu ghế dạng khối gọn gàng giúp thử cấu hình showroom, thay màu vật liệu và điều khiển góc nhìn trực tiếp.',tags:['3D tương tác','Bốn phối màu'], colors:[['Sage','#84a996'],['Clay','#c98c76'],['Sand','#d4c2a5'],['Ink','#3c5967']]},
  {id:'lamp',number:'02',name:'ARC Table Light',type:'Đèn bàn · Demo',symbol:'◉',description:'Mẫu đèn trang trí dựng bằng hình học WebGL2 để trình diễn ánh sáng, chất liệu và điều hướng sản phẩm chung.',tags:['Xoay 360°','Mô hình demo'], colors:[['Warm ivory','#e5d0ab'],['Olive','#9fa778'],['Terracotta','#c98364'],['Midnight','#485d72']]},
  {id:'pump',number:'03',name:'NOVA Compact',type:'Thiết bị kỹ thuật · Demo',symbol:'⬡',description:'Mô hình thiết bị cơ khí mô phỏng tự dựng. Không phản ánh kích thước, công suất hay cấu tạo của một sản phẩm thương mại cụ thể.',tags:['Mô hình nguyên bản','WebGL2'], colors:[['Arctic blue','#7daab8'],['Coral','#c87f72'],['Moss','#83a38b'],['Titanium','#9ea8ae']]}
];
const $=id=>document.getElementById(id);
const canvas=$('glCanvas'), viewer=$('viewer');
let active=0, finish=0, theme='dark', gl=null, shader=null, mesh=null, zoom=5.2, yaw=0.57, pitch=0.28, pending=false;
const gpu={buffer:null,program:null,position:0,normal:0,color:0,mvp:null,model:null};
const appState={ready:false};
function safeThemeRead(){try{return localStorage.getItem('b4w-public-theme')}catch{return null}}
function safeThemeSave(t){try{localStorage.setItem('b4w-public-theme',t)}catch{}}
function setTheme(v){theme=v==='light'?'light':'dark';document.documentElement.dataset.theme=theme;$('themeToggle').innerHTML=theme==='dark'?'☀ <span>Giao diện</span>':'☾ <span>Giao diện</span>';safeThemeSave(theme)}
function escURL(id){return '?product='+encodeURIComponent(id)}
function renderMenu(){const list=$('productList');list.replaceChildren();PRODUCTS.forEach((product,i)=>{const b=document.createElement('button');b.type='button';b.className='product'+(i===active?' active':'');b.dataset.id=product.id;b.setAttribute('aria-pressed',String(i===active));b.innerHTML=`<span class="product-art" aria-hidden="true">${product.symbol}</span><span><span class="product-title">${product.name}</span><span class="product-id">${product.number} / ${product.type}</span></span>`;b.addEventListener('click',()=>choose(i));list.append(b)})}
function renderFinishes(){const product=PRODUCTS[active];const list=$('finishes');list.replaceChildren();product.colors.forEach(([label,color],i)=>{const b=document.createElement('button');b.type='button';b.className='finish'+(i===finish?' active':'');b.style.backgroundColor=color;b.setAttribute('aria-label','Màu '+label);b.setAttribute('aria-pressed',String(i===finish));b.title=label;b.addEventListener('click',()=>{finish=i;renderFinishes();updateGeometry()});list.append(b)});$('finishLabel').textContent=product.colors[finish][0]+' · WebGL2 preview'}
function choose(i,historyMode='push'){if(i<0||i>=PRODUCTS.length)return;active=i;finish=0;const p=PRODUCTS[i];$('breadcrumb').textContent=p.name;$('productTitle').textContent=p.name;$('productSubtitle').textContent=p.type;$('productDescription').textContent=p.description;const specs=$('specs');specs.replaceChildren();for(const tag of p.tags){const d=document.createElement('span');d.className='spec';d.textContent=tag;specs.append(d)};renderMenu();renderFinishes();yaw=.57;pitch=.28;zoom=5.2;updateGeometry();const cat=$('catalog');cat.classList.remove('open');$('catalogOpen').setAttribute('aria-expanded','false');if(historyMode!=='none'){const next=escURL(p.id);if(historyMode==='replace')history.replaceState(null,'',next);else if(new URLSearchParams(location.search).get('product')!==p.id)history.pushState(null,'',next)}}
function hex(v){const n=parseInt(v.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]}
function tint(c,s){return c.map(v=>Math.min(1,Math.max(0,v*s)))}
function lerpColor(a,b,f){return a.map((v,i)=>v*(1-f)+b[i]*f)}
const metal=[.63,.74,.73], dark=[.15,.23,.25], charcoal=[.22,.29,.3], pale=[.83,.84,.76], bronze=[.77,.55,.33];
function createModel(modelId,chosenHex){const points=[],normals=[],cols=[];const primary=hex(chosenHex);
  function triangle(a,b,c,n1,n2,n3,col){for(const [p,n] of [[a,n1],[b,n2],[c,n3]]){points.push(...p);normals.push(...n);cols.push(...col)}}
  function quad(a,b,c,d,n,col){triangle(a,b,c,n,n,n,col);triangle(a,c,d,n,n,n,col)}
  function box(x,y,z,w,h,d,col){const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;quad([a,c,g],[b,c,g],[b,e,g],[a,e,g],[0,0,1],col);quad([b,c,f],[a,c,f],[a,e,f],[b,e,f],[0,0,-1],col);quad([a,c,f],[a,c,g],[a,e,g],[a,e,f],[-1,0,0],col);quad([b,c,g],[b,c,f],[b,e,f],[b,e,g],[1,0,0],col);quad([a,e,g],[b,e,g],[b,e,f],[a,e,f],[0,1,0],col);quad([a,c,f],[b,c,f],[b,c,g],[a,c,g],[0,-1,0],col)}
  function sphere(x,y,z,r,col,lat=16,lon=24){for(let i=0;i<lat;i++){const th0=i*Math.PI/lat,th1=(i+1)*Math.PI/lat;for(let j=0;j<lon;j++){const ph0=j*2*Math.PI/lon,ph1=(j+1)*2*Math.PI/lon;const v=(t,p)=>[Math.sin(t)*Math.cos(p),Math.cos(t),Math.sin(t)*Math.sin(p)];const n00=v(th0,ph0),n01=v(th0,ph1),n10=v(th1,ph0),n11=v(th1,ph1);const pos=n=>[x+n[0]*r,y+n[1]*r,z+n[2]*r];triangle(pos(n00),pos(n10),pos(n11),n00,n10,n11,col);triangle(pos(n00),pos(n11),pos(n01),n00,n11,n01,col)}}}
  function cyl(x,y,z,r,h,col,axis='y',r2=r,n=34){const mapper=(dy,dx,dz)=>axis==='x'?[x+dy,y+dx,z+dz]:axis==='z'?[x+dx,y+dz,z+dy]:[x+dx,y+dy,z+dz];const nm=(dx,dy,dz)=>axis==='x'?[dy,dx,dz]:axis==='z'?[dx,dz,dy]:[dx,dy,dz];for(let i=0;i<n;i++){const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;const c=Math.cos(a),s=Math.sin(a),C=Math.cos(b),S=Math.sin(b);const p0=mapper(-h/2,c*r,s*r),p1=mapper(-h/2,C*r,S*r),p2=mapper(h/2,C*r2,S*r2),p3=mapper(h/2,c*r2,s*r2);const sl=(r-r2)/h;const no=(u,v)=>{const norm=Math.hypot(u,sl,v);return nm(u/norm,sl/norm,v/norm)};triangle(p0,p1,p2,no(c,s),no(C,S),no(C,S),col);triangle(p0,p2,p3,no(c,s),no(C,S),no(c,s),col);const bot=nm(0,-1,0),top=nm(0,1,0);triangle(mapper(-h/2,0,0),p1,p0,bot,bot,bot,col);triangle(mapper(h/2,0,0),p3,p2,top,top,top,col)}}
  function ring(x,y,z,r,t,col){cyl(x,y,z,r,t,col)}
  // Common elevated showroom plinth. Original geometry only.
  cyl(0,.11,0,1.38,.20,[.29,.39,.37]);cyl(0,.217,0,1.33,.025,[.53,.66,.61]);cyl(0,.247,0,1.22,.02,[.21,.31,.30]);
  if(modelId==='chair'){
    const wood=[.32,.27,.24],fabric=primary;
    for(const x of [-.58,.58])for(const z of [-.52,.5]){box(x,.59,z,.11,.65,.11,wood);sphere(x,.27,z,.075,[.13,.2,.2],10,14)}
    box(0,.96,-.04,1.57,.24,1.31,tint(fabric,.72));box(0,1.1,-.04,1.54,.18,1.29,fabric);
    box(0,1.6,.53,1.58,1.16,.22,tint(fabric,.77));box(0,1.62,.39,1.47,1.03,.12,fabric);
    for(const x of [-.77,.77]){box(x,1.19,-.09,.13,.28,1.20,wood);box(x,1.34,.03,.17,.13,.9,tint(fabric,.82))}
    box(0,.74,-.04,1.5,.10,1.3,[.25,.26,.24]);
  }else if(modelId==='lamp'){
    const body=primary;
    cyl(0,.39,0,.69,.16,dark);cyl(0,.49,0,.53,.055,metal);cyl(0,1.31,0,.074,1.67,bronze);cyl(0,2.07,0,.14,.1,dark);
    cyl(0,2.13,0,.67,.76,body,'y',.31);cyl(0,1.73,0,.66,.035,tint(body,.76));cyl(0,2.51,0,.30,.035,tint(body,.76));
    sphere(0,1.79,0,.22,[.98,.9,.65]);cyl(0,.64,0,.19,.15,charcoal);
    sphere(.1,.53,.38,.072,[.93,.69,.39],12,16);
  }else{
    const c=primary;
    box(0,.40,0,2.05,.23,1.25,dark);for(const x of [-.78,.78])for(const z of [-.44,.44])cyl(x,.23,z,.10,.09,bronze);
    box(.1,.63,0,1.7,.24,1.0,[.34,.42,.44]);
    cyl(.25,1.26,0,.46,1.13,tint(c,.95),'x');cyl(.84,1.26,0,.47,.12,[.75,.8,.81],'x');cyl(.94,1.26,0,.34,.10,dark,'x');
    for(let i=0;i<6;i++){const angle=i*Math.PI/3;box(.08,1.26+Math.cos(angle)*.43,Math.sin(angle)*.43,.7,.065,.085,tint(c,.67))}
    cyl(-.72,1.28,.08,.56,.51,c,'z');cyl(-.72,1.28,.37,.44,.12,metal,'z');cyl(-.72,1.28,.47,.24,.08,dark,'z');
    cyl(-.65,1.97,.05,.12,.75,metal);cyl(-.65,2.37,.05,.31,.11,bronze);cyl(-1.02,1.28,.05,.13,.61,metal,'x');
    for(const x of [.2,.54,.88])box(x,.66,-.47,.055,.15,.09,bronze);
  }
  return {positions:new Float32Array(points),normals:new Float32Array(normals),colors:new Float32Array(cols),count:points.length/3};
}
function compile(gl,type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw Error(e)}return sh}
function initGL(){gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'default'});if(!gl)throw Error('Thiết bị hoặc trình duyệt không hỗ trợ WebGL2.');const vs=`#version 300 es
precision highp float;in vec3 aPos;in vec3 aNormal;in vec3 aColor;uniform mat4 uMvp;out vec3 vNormal;out vec3 vColor;out vec3 vPos;void main(){vNormal=aNormal;vColor=aColor;vPos=aPos;gl_Position=uMvp*vec4(aPos,1.);}`;const fs=`#version 300 es
precision highp float;in vec3 vNormal;in vec3 vColor;in vec3 vPos;out vec4 outColor;void main(){vec3 N=normalize(vNormal);vec3 L=normalize(vec3(-.52,.86,1.0));float diff=max(dot(N,L),0.);float sky=.20+.17*max(N.y,0.);float rim=pow(1.-abs(dot(N,normalize(vec3(.3,.38,1.)))),2.)*.13;vec3 col=vColor*(.40+.53*diff+sky)+vec3(.94,.9,.77)*rim;col=pow(max(col,vec3(0.)),vec3(.84));outColor=vec4(col,1.);}`;
  const program=gl.createProgram(),vert=compile(gl,gl.VERTEX_SHADER,vs),frag=compile(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);gl.deleteShader(vert);gl.deleteShader(frag);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gpu.program=program;gpu.position=gl.getAttribLocation(program,'aPos');gpu.normal=gl.getAttribLocation(program,'aNormal');gpu.color=gl.getAttribLocation(program,'aColor');gpu.mvp=gl.getUniformLocation(program,'uMvp');gpu.buffer=gl.createBuffer();gl.enable(gl.DEPTH_TEST);/* two-sided procedural surfaces */appState.ready=true;updateGeometry();new ResizeObserver(()=>schedule()).observe(viewer);window.addEventListener('resize',schedule);canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();appState.ready=false;$('viewerError').hidden=false;$('viewerError').querySelector('strong').textContent='Kết nối đồ họa bị gián đoạn.'});canvas.addEventListener('webglcontextrestored',()=>{appState.ready=false;initGL();$('viewerError').hidden=true})}
function length(v){return Math.hypot(...v)}function sub(a,b){return a.map((v,i)=>v-b[i])}function dot(a,b){return a.reduce((s,v,i)=>s+v*b[i],0)}function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}function normalize(a){const l=length(a)||1;return a.map(v=>v/l)}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0])}
function lookAt(eye,target){const z=normalize(sub(eye,target)),x=normalize(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1])}
function mul(a,b){const c=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)c[j*4+i]+=a[k*4+i]*b[j*4+k];return c}
function updateGeometry(){if(!appState.ready)return;mesh=createModel(PRODUCTS[active].id,PRODUCTS[active].colors[finish][1]);const packed=new Float32Array(mesh.count*9);for(let i=0;i<mesh.count;i++){packed.set(mesh.positions.subarray(i*3,i*3+3),i*9);packed.set(mesh.normals.subarray(i*3,i*3+3),i*9+3);packed.set(mesh.colors.subarray(i*3,i*3+3),i*9+6)}gl.bindBuffer(gl.ARRAY_BUFFER,gpu.buffer);gl.bufferData(gl.ARRAY_BUFFER,packed,gl.STATIC_DRAW);schedule()}
function schedule(){if(pending||!appState.ready)return;pending=true;requestAnimationFrame(()=>{pending=false;draw()})}
function draw(){if(!appState.ready||!mesh)return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const scale=Math.min(window.devicePixelRatio||1,2);const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(gpu.program);const r=zoom*Math.cos(pitch),eye=[r*Math.sin(yaw),1.15+zoom*Math.sin(pitch),r*Math.cos(yaw)],proj=perspective(Math.PI/4,w/h,.08,100),view=lookAt(eye,[0,1.22,0]);gl.uniformMatrix4fv(gpu.mvp,false,mul(proj,view));gl.bindBuffer(gl.ARRAY_BUFFER,gpu.buffer);for(const [a,loc] of [[0,gpu.position],[12,gpu.normal],[24,gpu.color]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,a)}gl.drawArrays(gl.TRIANGLES,0,mesh.count)}
const pointers=new Map();let lastDistance=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);lastDistance=0});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===1){const deltaX=e.clientX-prev[0],deltaY=e.clientY-prev[1];yaw+=deltaX*.009;pitch=Math.min(1.15,Math.max(-.5,pitch+deltaY*.007));schedule()}else if(pointers.size===2){const p=[...pointers.values()],dist=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(lastDistance)zoom=Math.min(9,Math.max(3.3,zoom*lastDistance/dist));lastDistance=dist;schedule()}});
function release(e){pointers.delete(e.pointerId);lastDistance=0}for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,release);
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(3.3,Math.min(9,zoom+Math.sign(e.deltaY)*.30));schedule()},{passive:false});
canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.16;if(e.key==='ArrowRight')yaw+=.16;if(e.key==='ArrowUp')pitch=Math.max(-.5,pitch-.12);if(e.key==='ArrowDown')pitch=Math.min(1.15,pitch+.12);if(e.key==='+')zoom=Math.max(3.3,zoom-.3);if(e.key==='-')zoom=Math.min(9,zoom+.3);schedule()}});
$('resetView').addEventListener('click',()=>{yaw=.57;pitch=.28;zoom=5.2;schedule()});
$('themeToggle').addEventListener('click',()=>setTheme(theme==='dark'?'light':'dark'));
$('catalogOpen').addEventListener('click',()=>{const isOpen=$('catalog').classList.toggle('open');$('catalogOpen').setAttribute('aria-expanded',String(isOpen));if(isOpen)$('catalog').scrollIntoView({behavior:'smooth',block:'nearest'})});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(viewer.requestFullscreen)await viewer.requestFullscreen();else throw Error('Tính năng không được hỗ trợ')}catch(e){$('canvasHint').textContent='Không mở được toàn màn hình trên trình duyệt này.'}});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').innerHTML=document.fullscreenElement?'⛶ <span>Thu nhỏ</span>':'⛶ <span>Toàn màn hình</span>';schedule()});
window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('product');choose(Math.max(0,PRODUCTS.findIndex(p=>p.id===id)),'none')});
setTheme(safeThemeRead()||'dark');$('productCount').textContent=String(PRODUCTS.length).padStart(2,'0');const requested=new URLSearchParams(location.search).get('product');choose(Math.max(0,PRODUCTS.findIndex(p=>p.id===requested)),'replace');
try{initGL()}catch(e){$('viewerError').hidden=false;$('viewerError').querySelector('p').textContent=e.message||String(e);console.error('WebGL init failed',e)}