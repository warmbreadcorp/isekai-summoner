/* 오프닝 카메라 v5 검토 후보 (opening-camera-v5 1.0.0).
   승인 전 검토본이라 주소에 ?opening=v5 를 붙였을 때만 타이틀 앞에서 재생합니다. 저장 데이터는 읽지도 쓰지도 않습니다.
   방 그림 두 장(인물 있음/없음)에 같은 카메라 크롭 하나만 적용합니다. 의자·다리·카펫을 따로 움직이지 않습니다.
   모니터 크레딧 문구는 정해지지 않아 넣지 않았습니다. */
(function(){
 const W=1672,H=941,DUR=5,TARGET=[612,223,1095,494.6875],DISSOLVE_AT=2.25,DISSOLVE_LEN=8/24;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
 const camera=t=>{const k=smooth((t-.5)/4);return [0,0,W,H].map((a,i)=>a+(TARGET[i]-a)*k)};
 const dissolve=t=>smooth((t-DISSOLVE_AT)/DISSOLVE_LEN);
 const api=window.OPENING_V5={W,H,DUR,camera,dissolve,state:"off"};
 if(new URLSearchParams(location.search).get("opening")!=="v5")return;
 const landing=document.getElementById("landing");
 if(!landing||landing.classList.contains("hidden"))return; // 공유 결과로 바로 들어온 경우엔 틀지 않음

 const css=document.createElement("style");
 css.textContent="#opening{position:fixed;inset:0;z-index:1000;background:#000;display:flex;align-items:center;justify-content:center;opacity:1;transition:opacity .4s}"
  +"#opening.out{opacity:0;pointer-events:none}#opening canvas{display:block}"
  +"#opening button{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));min-width:88px;min-height:44px;padding:0 16px;border:1px solid rgba(255,255,255,.35);border-radius:10px;background:rgba(10,10,24,.6);color:#fff;font:600 14px/1 inherit;cursor:pointer}";
 document.head.appendChild(css);
 const box=document.createElement("div");box.id="opening";
 const cv=document.createElement("canvas"),skip=document.createElement("button");
 skip.type="button";skip.textContent="건너뛰기";
 box.append(cv,skip);document.body.appendChild(box);
 const ctx=cv.getContext("2d");
 let rear,empty,t=0,last=0,raf=0,done=false,paused=false;

 function fit(){ // 16:9를 화면 안에 통째로(위아래 또는 좌우 검은 띠)
  const vw=box.clientWidth,vh=box.clientHeight,w=Math.min(vw,vh*16/9),h=w*9/16,d=Math.min(window.devicePixelRatio||1,2);
  cv.style.width=w+"px";cv.style.height=h+"px";cv.width=Math.round(w*d);cv.height=Math.round(h*d);
  if(rear)render(t);
 }
 function render(at){
  const b=camera(at),sw=b[2]-b[0],sh=b[3]-b[1],a=dissolve(at);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
  ctx.globalAlpha=1;ctx.drawImage(rear,b[0],b[1],sw,sh,0,0,cv.width,cv.height);
  if(a>0){ctx.globalAlpha=a;ctx.drawImage(empty,b[0],b[1],sw,sh,0,0,cv.width,cv.height);ctx.globalAlpha=1}
 }
 function frame(now){
  if(done||paused)return;
  t+=Math.min(.1,(now-last)/1000);last=now; // 탭이 가려졌다 돌아와도 건너뛰지 않게
  render(Math.min(t,DUR));
  if(t>=DUR)finish("ended");else raf=requestAnimationFrame(frame);
 }
 function finish(why){
  if(done)return;done=true;cancelAnimationFrame(raf);clearTimeout(guard);
  removeEventListener("resize",fit);removeEventListener("keydown",onKey);
  api.state=why;box.classList.add("out");setTimeout(()=>{box.remove();css.remove()},450);
 }
 function onKey(e){if(e.key==="Escape")finish("skipped")}
 function load(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src})}

 skip.onclick=()=>finish("skipped");
 addEventListener("resize",fit);addEventListener("keydown",onKey);
 const guard=setTimeout(()=>finish("timeout"),8000); // 그림을 못 받으면 타이틀로
 api.state="loading";
 api.seek=at=>{paused=true;cancelAnimationFrame(raf);t=at;render(at)}; // 검수용: 특정 시각에 멈춰 보기
 Promise.all([load("img/opening/room-rear-v2.png"),load("img/opening/room-empty-v2.png")]).then(im=>{
  if(done)return;clearTimeout(guard);rear=im[0];empty=im[1];fit();
  api.state="playing";last=performance.now();raf=requestAnimationFrame(frame);
 }).catch(()=>finish("error"));
})();
