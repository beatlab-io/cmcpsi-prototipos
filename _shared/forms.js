/* CMCPSI prototipos: motor de formularios por pasos.
   Vistas: #v-start (opcional), #v-1 … #v-N (pasos con <form data-step>), #v-(N+1) revisión, #v-done.
   Uso: CMCPSIForm({steps:N, rules:{1:{campo:fn(valor,v)}}, review:fn(v,rows), reveals:{radio:{valor:'idBloque'}}, doneEmail:'campo'}) */
(function(){
  var ARROW='<svg class="icon icon-sm" aria-hidden="true"><use href="#i-arrow-r"/></svg>';
  window.CMCPSIForm=function(cfg){
    var N=cfg.steps, REV=N+1, fromReview=false, files={}, tried={};
    function $(id){return document.getElementById(id);}
    function v(name){
      var el=document.querySelector('[name="'+name+'"]');if(!el)return'';
      if(el.type==='radio'){var r=document.querySelector('[name="'+name+'"]:checked');return r?r.value:'';}
      if(el.type==='checkbox')return el.checked?'sí':'';
      if(el.type==='file')return files[name]?files[name].name:'';
      return el.value.trim();
    }
    v.digits=function(s){return String(s).replace(/\D/g,'');};
    v.email=function(x){return/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x);};
    var keys=['start'];for(var i=1;i<=REV;i++)keys.push(i);keys.push('done');
    function go(k){
      keys.forEach(function(x){var el=$('v-'+x);if(el)el.hidden=String(x)!==String(k);});
      var aside=$('aside');if(aside)aside.hidden=(k==='done');
      var sec=$('v-'+k);
      sec.querySelectorAll('[data-main]').forEach(function(b){
        if(b.dataset.final)return;
        b.innerHTML=fromReview?'Guardar y volver a la revisión':'Continuar '+ARROW;
      });
      window.scrollTo(0,0);var h=sec.querySelector('h1');if(h)h.focus();
    }
    var start=$('start');if(start)start.addEventListener('click',function(){go(1);});
    document.querySelectorAll('[data-prev]').forEach(function(b){b.addEventListener('click',function(){var s=+b.closest('[data-step]').dataset.step;fromReview=false;go(s-1);});});
    document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(ev){ev.preventDefault();fromReview=!!(b.closest('#v-'+REV)&&b.classList.contains('link'));go(+b.dataset.go);});});

    function show(id,msg){
      var f=$('f-'+id),e=$(id+'-err');if(!f||!e)return;
      f.classList.toggle('is-error',!!msg);e.hidden=!msg;e.querySelector('span').textContent=msg||'';
      var el=$(id);if(el&&el.type!=='radio'&&el.type!=='checkbox')el.setAttribute('aria-invalid',msg?'true':'false');
    }
    function validate(step){var errs=[],r=cfg.rules[step]||{};Object.keys(r).forEach(function(id){var m=r[id](v(id),v);show(id,m);if(m)errs.push([id,m]);});return errs;}
    function summary(step,errs){
      var box=$('v-'+step).querySelector('.err-summary');if(!box)return;var ul=box.querySelector('.err-list');
      if(!errs.length){box.hidden=true;return;}
      ul.innerHTML='';box.querySelector('.err-count').textContent=errs.length===1?'1 dato':errs.length+' datos';
      errs.forEach(function(x){var li=document.createElement('li'),a=document.createElement('a');a.href='#f-'+x[0];a.textContent=x[1];
        a.addEventListener('click',function(ev){ev.preventDefault();var t=$(x[0])||document.querySelector('[name="'+x[0]+'"]');if(t.type==='file'){t=$(x[0]+'-pick')||t;}t.focus&&t.focus();t.scrollIntoView({block:'center'});});
        li.appendChild(a);ul.appendChild(li);});
      box.hidden=false;
    }
    document.querySelectorAll('form[data-step]').forEach(function(form){
      var step=+form.dataset.step;
      form.addEventListener('submit',function(ev){
        ev.preventDefault();tried[step]=true;var errs=validate(step);summary(step,errs);
        if(errs.length){$('v-'+step).querySelector('.err-summary').focus();return;}
        if(fromReview||step===N){fill();fromReview=false;go(REV);}else go(step+1);
      });
      form.addEventListener('change',function(e){if(tried[step]){var r=cfg.rules[step]||{};if(r[e.target.name])show(e.target.name,r[e.target.name](v(e.target.name),v));summary(step,validate(step));}});
      form.addEventListener('focusout',function(e){var r=cfg.rules[step]||{};if(tried[step]&&e.target.name&&r[e.target.name]&&e.target.type!=='file')show(e.target.name,r[e.target.name](v(e.target.name),v));});
    });
    // Bloques que aparecen según una respuesta (radio o checkbox)
    Object.keys(cfg.reveals||{}).forEach(function(name){
      var map=cfg.reveals[name];
      function upd(){Object.keys(map).forEach(function(val){var el=$(map[val]);if(el)el.hidden=(val==='checked'?v(name)!=='sí':v(name)!==val);});}
      document.querySelectorAll('[name="'+name+'"]').forEach(function(r){r.addEventListener('change',upd);});upd();
    });
    // Archivos: estado Cargado con Reemplazar y Quitar
    function fmt(b){return b>1048576?(b/1048576).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(b/1024))+' KB';}
    document.querySelectorAll('.file-pick input[type=file]').forEach(function(inp){
      var id=inp.id;
      inp.addEventListener('change',function(){if(!inp.files.length)return;files[id]=inp.files[0];$(id+'-fname').textContent=files[id].name;$(id+'-fsize').textContent='Cargado, '+fmt(files[id].size);$(id+'-pick').hidden=true;$(id+'-done').hidden=false;show(id,'');});
    });
    document.querySelectorAll('[data-remove]').forEach(function(b){b.addEventListener('click',function(){var id=b.dataset.remove;delete files[id];$(id).value='';$(id+'-done').hidden=true;$(id+'-pick').hidden=false;$(id).focus();});});
    document.querySelectorAll('[data-replace]').forEach(function(b){b.addEventListener('click',function(){$(b.dataset.replace).click();});});
    // Revisión
    function rows(dl,list){var el=$(dl);if(!el)return;el.innerHTML='';list.forEach(function(r){if(!r||!r[1])return;var dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=r[0];dd.textContent=r[1];el.appendChild(dt);el.appendChild(dd);});}
    function fill(){cfg.review(v,rows);}
    var send=$('send');if(send)send.addEventListener('click',function(){var de=$('done-email');if(de)de.textContent=v(cfg.doneEmail||'email');go('done');});
    // Flecha en los "Continuar" iniciales
    document.querySelectorAll('[data-main]').forEach(function(b){if(!b.dataset.final)b.innerHTML='Continuar '+ARROW;});
    var api={go:go,v:v,fill:fill};window.__cmcpsiForm=api;return api;
  };
})();
