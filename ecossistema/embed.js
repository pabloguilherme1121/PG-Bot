// Incorporação opcional. Não lê dados do projeto hospedeiro nem da partida.
(() => {
  const script=document.currentScript;
  if(!script || !script.src || document.getElementById('pgbot-ecosystem-host')) return;
  const base=new URL('.',script.src);
  const project=script.dataset.project || '';
  if(project && !/^[a-zA-Z0-9._-]{1,100}$/.test(project)) return;
  const host=document.createElement('div');
  host.id='pgbot-ecosystem-host';
  const shadow=host.attachShadow({mode:'open'});
  const style=document.createElement('style');
  style.textContent=`
    :host{all:initial;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
    button{font:inherit;cursor:pointer}
    button:focus-visible{outline:3px solid #b9ee86;outline-offset:3px}
    .launcher{position:fixed;right:16px;bottom:16px;z-index:2147483000;background:#b9ee86;color:#163024;border:1px solid #2c8493;
      border-radius:999px;box-shadow:0 10px 35px #0006;min-height:48px;padding:12px 18px;font-size:14px;font-weight:800}
    .panel{position:fixed;right:14px;bottom:76px;z-index:2147483000;width:min(440px,calc(100vw - 28px));
      height:min(690px,calc(100dvh - 96px));background:#102438;border:1px solid #416275;border-radius:16px;
      box-shadow:0 25px 70px #0009;overflow:hidden}
    .panel[hidden]{display:none}
    .heading{height:54px;background:#122e42;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;color:#e7f5ff;
      font-size:14px;font-weight:750}
    .close{border:1px solid #527489;border-radius:8px;min-height:38px;background:#1a4254;color:#fff;padding:7px 12px}
    iframe{border:0;width:100%;height:calc(100% - 54px);display:block;background:#0a1321}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
  `;
  const launcher=document.createElement('button');
  launcher.className='launcher';launcher.type='button';launcher.textContent='Ajuda PG Bot';
  launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-controls','pgbot-ecosystem-panel');
  const panel=document.createElement('section');panel.id='pgbot-ecosystem-panel';panel.className='panel';panel.hidden=true;
  panel.setAttribute('aria-label','Consulta pública do PG Bot');
  const heading=document.createElement('div');heading.className='heading';
  const title=document.createElement('span');title.textContent='PG Bot · Assistente do ecossistema';
  const close=document.createElement('button');close.className='close';close.type='button';close.textContent='Fechar';
  const iframe=document.createElement('iframe');iframe.title='PG Bot, consulta pública de projetos';iframe.loading='lazy';
  const token=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  const url=new URL('index.html',base);url.searchParams.set('embed','1');url.searchParams.set('embed-token',token);
  if(project)url.searchParams.set('project',project);
  iframe.src=url.href;
  function show(open) {
    panel.hidden=!open;
    launcher.setAttribute('aria-expanded',String(open));
    if(open)close.focus({preventScroll:true});
    else {
      const restoreFocus=()=>{
        if(panel.hidden && (document.activeElement===document.body ||
          (document.activeElement===host && shadow.activeElement!==launcher)))launcher.focus({preventScroll:true});
      };
      setTimeout(restoreFocus,60);
      setTimeout(restoreFocus,220);
    }
  }
  launcher.addEventListener('click',()=>show(panel.hidden));
  close.addEventListener('click',()=>show(false));
  shadow.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)show(false);});
  window.addEventListener('message',event=>{
    if(event.origin===base.origin && event.data?.type==='pgbot-ecosystem-close' &&
      event.data?.token===token)show(false);
  });
  heading.append(title,close);panel.append(heading,iframe);shadow.append(style,launcher,panel);
  document.body.append(host);
})();
