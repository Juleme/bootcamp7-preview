/* Shared behaviour for the round 3 pages: film, graduate videos, payback slider, Reserve bar, smooth scroll. */
(function(){
  document.documentElement.lang='en';
  var BC=window.BC={reduce:matchMedia('(prefers-reduced-motion:reduce)').matches,playing:null};
  var films=[].slice.call(document.querySelectorAll('.film')),filmV=null;
  BC.pauseAll=function(keep){
    if(filmV&&filmV!==keep)filmV.pause();
    films.forEach(function(f){var v=f.querySelector('video');if(v!==keep)v.pause()});
    if(BC.onOtherPlay)BC.onOtherPlay(keep);
  };

  // The film plays right here, streamed from the page's own files.
  var tv=document.getElementById('tv'),link=document.getElementById('tv-link');
  if(tv&&link)link.addEventListener('click',function(e){
    e.preventDefault();
    if(filmV){filmV.play();return}
    var v=filmV=document.createElement('video'),fell=false,hls=null;
    v.controls=true;v.playsInline=true;v.poster='img/agentic-wide.jpg';
    v.setAttribute('aria-label','The Agentic Era, with Benza Maman');
    function small(){ // Backup copy for any browser that can't stream.
      if(fell)return;fell=true;
      if(hls){try{hls.destroy()}catch(x){}}
      v.src='img/agentic-360.mp4';v.load();var p=v.play();if(p&&p.catch)p.catch(function(){});
    }
    v.addEventListener('error',small);
    v.addEventListener('play',function(){BC.pauseAll(v)});
    tv.classList.add('on');tv.appendChild(v);link.tabIndex=-1;
    if(window.Hls&&Hls.isSupported()){
      hls=new Hls({enableWorker:false,maxBufferLength:24});
      hls.on(Hls.Events.ERROR,function(_,d){if(d.fatal)small()});
      hls.on(Hls.Events.MANIFEST_PARSED,function(){var p=v.play();if(p&&p.catch)p.catch(function(){})});
      hls.loadSource('img/agentic/index.txt');hls.attachMedia(v);
    }else small();
    new IntersectionObserver(function(es){if(!es[0].isIntersecting)v.pause()},{threshold:.15}).observe(v);
  });

  // Graduate videos: tap to play with sound and captions, one at a time. Nothing loads until tapped.
  films.forEach(function(f){
    var v=f.querySelector('video'),b=f.querySelector('.fbar');
    f.addEventListener('click',function(){
      if(v.paused){BC.pauseAll(v);var p=v.play();if(p&&p.catch)p.catch(function(){})}else v.pause();
    });
    v.addEventListener('play',function(){f.classList.add('playing');f.setAttribute('aria-label',f.getAttribute('aria-label').replace('Play','Pause'))});
    v.addEventListener('pause',function(){f.classList.remove('playing');f.setAttribute('aria-label',f.getAttribute('aria-label').replace('Pause','Play'))});
    v.addEventListener('timeupdate',function(){if(v.duration&&b)b.style.transform='scaleX('+(v.currentTime/v.duration)+')'});
    v.addEventListener('ended',function(){v.currentTime=0;if(b)b.style.transform='scaleX(0)'});
    new IntersectionObserver(function(es){if(!es[0].isIntersecting)v.pause()},{threshold:.1}).observe(f);
  });

  // Payback slider. Our estimate: 6 to 13 hours back a week. Seat price $1,800.
  var rate=document.getElementById('rate');
  if(rate){
    var out=document.getElementById('rate-out'),back=document.getElementById('back');
    var span=function(d){return d<14?{n:Math.max(1,Math.round(d)),u:'days'}:{n:Math.round(d/7),u:'weeks'}};
    var calc=function(){
      var r=+rate.value,a=span(1800/(13*r)*7),b=span(1800/(6*r)*7);
      out.textContent='$'+r;
      rate.setAttribute('aria-valuetext','$'+r+' an hour');
      rate.style.setProperty('--fill',((r-25)/175*100)+'%');
      back.textContent=a.u===b.u?a.n+' to '+b.n+' '+b.u:a.n+' '+a.u+' to '+b.n+' '+b.u;
    };
    rate.addEventListener('input',calc);calc();
  }

  // Reserve appears once the opening has passed, and steps aside at the box office.
  var pill=document.getElementById('pill'),hero=document.querySelector('[data-hero]'),box=document.getElementById('reserve');
  if(pill&&hero&&box){
    var heroIn=true,boxIn=false,upd=function(){pill.classList.toggle('show',!heroIn&&!boxIn)};
    new IntersectionObserver(function(es){heroIn=es[0].isIntersecting;upd()}).observe(hero);
    new IntersectionObserver(function(es){boxIn=es[0].isIntersecting;upd()}).observe(box);
  }

  // Momentum scrolling on mouse and trackpad; phones keep their native scroll.
  if(!BC.reduce&&window.gsap&&window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ignoreMobileResize:true});
    if(window.Lenis){
      var lenis=new Lenis({duration:1.1,easing:function(t){return 1-Math.pow(1-t,4)},smoothWheel:true});
      BC.lenis=lenis;
      lenis.on('scroll',ScrollTrigger.update);
      gsap.ticker.add(function(t){lenis.raf(t*1000)});
      gsap.ticker.lagSmoothing(0);
    }
    BC.motion=true;
    document.querySelectorAll('details').forEach(function(d){d.addEventListener('toggle',function(){setTimeout(function(){ScrollTrigger.refresh()},280)})});
    addEventListener('load',function(){ScrollTrigger.refresh()});
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){ScrollTrigger.refresh()});
    // Layouts differ on phones, so crossing that width rebuilds the page.
    matchMedia('(max-width:820px)').addEventListener('change',function(){location.reload()});
  }
})();
