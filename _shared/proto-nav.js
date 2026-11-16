/* CMCPSI prototipos: selector "Ir a pantalla" en la barra del prototipo.
   Permite recorrer todas las vistas de un formulario sin completar datos ni validar. */
(function(){
  var views=[].slice.call(document.querySelectorAll('section.view'));
  var bar=document.querySelector('.proto-bar .container');
  if(views.length<2||!bar)return;
  var wrap=document.createElement('label');
  wrap.style.cssText='display:inline-flex;align-items:center;gap:8px;font-weight:600;margin-left:auto';
  wrap.innerHTML='<span>Ir a pantalla</span>';
  var sel=document.createElement('select');
  sel.style.cssText='font:inherit;font-weight:500;color:#1b2430;background:#e8edf3;border:0;border-radius:999px;padding:6px 12px;max-width:260px;cursor:pointer';
  views.forEach(function(v,i){
    var h=v.querySelector('h1'),bar2=v.querySelector('.stepbar .top span:last-child, .stepper-mobile .top span:last-child, .step-mini strong');
    var name=(h?h.textContent.trim():v.id);
    if(v.id==='v-start')name='Inicio: '+name;
    else if(v.id==='v-done')name='Confirmación';
    else if(bar2)name=bar2.textContent.trim()+': '+name;
    var o=document.createElement('option');o.value=v.id;o.textContent=name;sel.appendChild(o);
  });
  function current(){var v=views.filter(function(x){return !x.hidden;})[0];return v?v.id:views[0].id;}
  sel.value=current();
  sel.addEventListener('change',function(){
    views.forEach(function(v){v.hidden=v.id!==sel.value;});
    var aside=document.getElementById('aside')||document.querySelector('.aside');if(aside)aside.hidden=(sel.value==='v-done');
    if(window.__cmcpsiForm&&window.__cmcpsiForm.fill)try{window.__cmcpsiForm.fill();}catch(e){}
    window.scrollTo(0,0);
  });
  /* mantener el selector sincronizado cuando se navega con los botones */
  new MutationObserver(function(){sel.value=current();}).observe(document.body,{attributes:true,subtree:true,attributeFilter:['hidden']});
  wrap.appendChild(sel);
  var notesBtn=document.getElementById('toggle-notes');
  bar.insertBefore(wrap,notesBtn);
  if(notesBtn)notesBtn.style.marginLeft='0';
})();
