/* CMCPSI prototipos: desplegable con el diseño del sistema (reemplaza la lista nativa del navegador).
   Patrón ARIA "select-only combobox". El <select> original queda en el DOM, oculto, y sigue siendo
   la fuente del valor: el motor de formularios lo lee y recibe el evento change como siempre. */
(function(){
  var done=new WeakSet(),uid=0;
  var CHECK='<svg class="icon icon-sm" aria-hidden="true"><use href="#i-check"/></svg>';

  function enhance(wrap){
    var sel=wrap.querySelector('select');if(!sel||done.has(sel))return;
    /* si viene de un clon (filas repetibles), descartar lo generado y volver a armar */
    wrap.querySelectorAll('.cs-btn,.cs-list').forEach(function(n){n.remove();});
    done.add(sel);
    var id=sel.id||('cs'+(++uid)),btn=document.createElement('button'),list=document.createElement('ul');
    var lab=document.querySelector('label[for="'+id+'"]');
    if(lab&&!lab.id)lab.id=id+'-lbl';
    btn.type='button';btn.className='control cs-btn';btn.id=id+'-btn';
    btn.setAttribute('role','combobox');btn.setAttribute('aria-haspopup','listbox');
    btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls',id+'-list');
    if(lab)btn.setAttribute('aria-labelledby',lab.id);
    if(sel.getAttribute('aria-describedby'))btn.setAttribute('aria-describedby',sel.getAttribute('aria-describedby'));
    list.className='cs-list';list.id=id+'-list';list.setAttribute('role','listbox');list.tabIndex=-1;
    if(lab)list.setAttribute('aria-labelledby',lab.id);list.hidden=true;

    var opts=[].slice.call(sel.options),items=[],active=-1;
    opts.forEach(function(o,i){
      if(o.disabled&&!o.value)return; /* el placeholder no es una opción elegible */
      var li=document.createElement('li');li.id=id+'-opt-'+i;li.setAttribute('role','option');
      li.dataset.i=i;li.innerHTML='<span>'+o.textContent+'</span>'+CHECK;
      li.addEventListener('mousedown',function(e){e.preventDefault();});
      li.addEventListener('click',function(){pick(i);close(true);});
      li.addEventListener('mousemove',function(){setActive(items.indexOf(li));});
      list.appendChild(li);items.push(li);
    });
    sel.classList.add('cs-native');sel.tabIndex=-1;sel.setAttribute('aria-hidden','true');
    var chev=wrap.querySelector('.icon');
    wrap.insertBefore(btn,chev);wrap.appendChild(list);wrap.classList.add('cs');

    function render(){
      var o=sel.options[sel.selectedIndex],ph=!sel.value;
      btn.innerHTML='<span class="cs-value'+(ph?' is-placeholder':'')+'">'+(o?o.textContent:'')+'</span>';
      items.forEach(function(li){var on=+li.dataset.i===sel.selectedIndex&&!ph;li.setAttribute('aria-selected',on?'true':'false');});
    }
    function setActive(k){
      if(k<0||k>=items.length)return;active=k;
      items.forEach(function(li,j){li.classList.toggle('is-active',j===k);});
      btn.setAttribute('aria-activedescendant',items[k].id);
      var li=items[k];if(li.offsetTop<list.scrollTop)list.scrollTop=li.offsetTop;
      else if(li.offsetTop+li.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=li.offsetTop+li.offsetHeight-list.clientHeight;
    }
    function open(){
      if(!list.hidden)return;closeAll();list.hidden=false;btn.setAttribute('aria-expanded','true');wrap.classList.add('is-open');
      var cur=items.findIndex(function(li){return li.getAttribute('aria-selected')==='true';});
      /* abrir hacia arriba si no hay lugar abajo */
      var r=btn.getBoundingClientRect();wrap.classList.toggle('cs-up',window.innerHeight-r.bottom<300&&r.top>window.innerHeight-r.bottom);
      setActive(cur<0?0:cur);
    }
    function close(focus){
      if(list.hidden)return;list.hidden=true;btn.setAttribute('aria-expanded','false');btn.removeAttribute('aria-activedescendant');wrap.classList.remove('is-open');
      if(focus)btn.focus();
    }
    function pick(i){
      if(sel.selectedIndex!==i){sel.selectedIndex=i;sel.dispatchEvent(new Event('change',{bubbles:true}));}
      render();
    }
    wrap._csClose=function(){close(false);};

    btn.addEventListener('click',function(){list.hidden?open():close(true);});
    btn.addEventListener('blur',function(){setTimeout(function(){if(document.activeElement!==btn)close(false);},0);});
    var typed='',tt;
    btn.addEventListener('keydown',function(e){
      var k=e.key,isOpen=!list.hidden;
      if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();if(!isOpen){open();return;}setActive(active+(k==='ArrowDown'?1:-1));}
      else if(k==='Home'||k==='End'){if(isOpen){e.preventDefault();setActive(k==='Home'?0:items.length-1);}}
      else if(k==='Enter'||k===' '){e.preventDefault();if(!isOpen)open();else{pick(+items[active].dataset.i);close(true);}}
      else if(k==='Escape'){if(isOpen){e.preventDefault();close(true);}}
      else if(k==='Tab'){if(isOpen){pick(+items[active].dataset.i);close(false);}}
      else if(k.length===1&&/\S/.test(k)){
        typed+=k.toLowerCase();clearTimeout(tt);tt=setTimeout(function(){typed='';},600);
        var m=items.findIndex(function(li){return li.textContent.toLowerCase().indexOf(typed)===0;});
        if(m>-1){if(isOpen)setActive(m);else pick(+items[m].dataset.i);}
      }
    });
    /* el label y el resumen de errores apuntan al <select>: llevar el foco al botón */
    sel.addEventListener('focus',function(){btn.focus();});
    if(lab)lab.addEventListener('click',function(e){e.preventDefault();btn.focus();});
    /* reflejar aria-invalid que pone el motor de formularios */
    new MutationObserver(function(){var v=sel.getAttribute('aria-invalid');if(v)btn.setAttribute('aria-invalid',v);else btn.removeAttribute('aria-invalid');}).observe(sel,{attributes:true,attributeFilter:['aria-invalid']});
    sel.addEventListener('change',render);
    render();
  }
  function closeAll(){document.querySelectorAll('.select-wrap.is-open').forEach(function(w){w._csClose&&w._csClose();});}
  document.addEventListener('mousedown',function(e){if(!e.target.closest('.select-wrap.is-open'))closeAll();});
  function scan(root){(root.querySelectorAll?root:document).querySelectorAll('.select-wrap').forEach(enhance);if(root.classList&&root.classList.contains('select-wrap'))enhance(root);}
  scan(document);
  /* filas que se agregan después (por ejemplo, otro hijo o hija) */
  new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)scan(n);});});}).observe(document.body,{childList:true,subtree:true});
  window.CMCPSISelect={enhance:enhance};
})();
