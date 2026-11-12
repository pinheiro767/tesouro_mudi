/*
 * Theo — módulo aditivo v2 para Caça aos Tesouros do MUDI.
 * NÃO altera a função de leitura/decodificação de QR, o array codes,
 * o armazenamento maya-* nem o identificador mudi-tesouros-v2.
 * A carteira e o álbum do Theo usam exclusivamente mudi-theo-v1.
 */
(function(){
  'use strict';
  const main=document.querySelector('main.wrap');
  if(!main || !document.getElementById('mayaPortrait') || !document.getElementById('mayaWalker') || !document.getElementById('rewardDialog')){
    console.warn('[MUDI Theo] Estrutura da Maya não reconhecida. O complemento não foi ativado.');
    return;
  }
  const storage=window.mudiTestStorage || window.localStorage;
  const KEY='mudi-theo-v1';
  const CHAR_KEY='mudi-personagem-v1';
  const outfits=[
    {name:'Explorador',price:0},
    {name:'Cientista',price:25},
    {name:'Investigador',price:35},
    {name:'Mago',price:45},
    {name:'Astronauta',price:65},
    {name:'Mergulhador',price:85}
  ];
  const cardNames=['Estômago','Intestinos','Coração','DNA','Pulmões','Célula','Cérebro'];
  const outSrc=i=>'assets/theo/roupas/theo_'+String(i+1).padStart(2,'0')+'.png';
  const cardSrc=i=>'assets/theo/figurinhas/theo_card_'+String(i+1).padStart(2,'0')+'.png'; // Figurinhas com trajes aprovados
  const parse=(key,defaultValue)=>{try{const val=storage.getItem(key);return val?JSON.parse(val):defaultValue}catch(_){return defaultValue}};
  let state=parse(KEY,{});
  if(!state || typeof state!=='object' || Array.isArray(state))state={};
  const uniqueRange=(arr,max)=>Array.isArray(arr)?Array.from(new Set(arr.filter(n=>Number.isInteger(n)&&n>=0&&n<max))):[];
  state.coins=Number.isSafeInteger(state.coins)&&state.coins>=0?state.coins:0;
  state.owned=uniqueRange(state.owned,6);if(!state.owned.includes(0))state.owned.unshift(0);
  state.cards=uniqueRange(state.cards,7);
  state.pasted=uniqueRange(state.pasted,7).filter(id=>state.cards.includes(id));
  state.credited=Array.isArray(state.credited)?Array.from(new Set(state.credited.filter(n=>Number.isInteger(n)&&n>=1&&n<=7))):[];
  state.outfit=state.owned.includes(state.outfit)?state.outfit:0;
  let character='maya';
  try{character=storage.getItem(CHAR_KEY)==='theo'?'theo':'maya'}catch(_){}
  const save=()=>{try{storage.setItem(KEY,JSON.stringify(state))}catch(_){}};
  const saveChar=()=>{try{storage.setItem(CHAR_KEY,character)}catch(_){}};
  const foundIds=()=>{
    const ids=parse('mudi-tesouros-v2',[]);
    return Array.isArray(ids)?Array.from(new Set(ids.filter(n=>Number.isInteger(n)&&n>=1&&n<=7))):[];
  };
  // Toda estação concluída vale 100 moedas para Theo uma única vez,
  // inclusive quando a conquista ocorreu usando Maya. Nunca debita Maya.
  function syncCredits(){
    let updated=false;
    for(const id of foundIds())if(!state.credited.includes(id)){
      state.credited.push(id);state.coins+=100;updated=true;
    }
    if(updated)save();
  }
  syncCredits();
  const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const picker=document.createElement('section');
  picker.className='theo-choose';picker.setAttribute('aria-label','Escolha de personagem');
  picker.innerHTML='<div class="theo-choose-title">🎒 Quem vai explorar o MUDI?</div><div class="theo-options"><button class="theo-option" id="chooseMaya" type="button" aria-pressed="false"><img src="assets/maya.png" alt="">Maya</button><button class="theo-option" id="chooseTheo" type="button" aria-pressed="false"><img src="'+outSrc(0)+'" alt="">Theo</button></div>';
  const subtitle=main.querySelector('.subtitle');(subtitle||main.querySelector('.top')).after(picker);
  picker.querySelector('#chooseMaya').addEventListener('click',()=>select('maya'));
  picker.querySelector('#chooseTheo').addEventListener('click',()=>select('theo'));
  const title=main.querySelector('h1');
  const heroInfo=main.querySelector('.maya-intro');
  const portrait=document.getElementById('mayaPortrait');
  const hudTitle=portrait?.parentElement?.querySelector('strong');
  const hudStatus=document.getElementById('mayaStatus');
  const walker=document.getElementById('mayaWalker');
  const walkerImg=walker?.querySelector('img');
  const walkerTag=walker?.querySelector('.mayaTag');
  const barWardrobe=document.querySelector('.gamebar button[onclick="openWardrobe()"]');
  const barCard=document.querySelector('.gamebar button[onclick="buyCard()"]');
  const tileWardrobe=document.querySelector('.visual-hub button[onclick="openWardrobe()"] span');
  const finalTitle=document.getElementById('finalTitle');
  const finalText=document.querySelector('#finalBox > p');
  function updateUI(){
    syncCredits();
    const theo=character==='theo';
    picker.querySelector('#chooseMaya').setAttribute('aria-pressed',String(!theo));
    picker.querySelector('#chooseTheo').setAttribute('aria-pressed',String(theo));
    title.textContent=theo?'🧭 THEO — CAÇA AOS TESOUROS DO MUDI':'🧭 MAYA — CAÇA AOS TESOUROS DO MUDI';
    subtitle.textContent=theo?'Theo é seu explorador! Encontre os QR Codes para revelar os tesouros e conquistar moedas e figurinhas.':'Maya é sua exploradora! Aponte a câmera para o QR Code e veja o tesouro flutuar no ambiente.';
    if(heroInfo){
      const img=heroInfo.querySelector('img'),strong=heroInfo.querySelector('strong');
      if(img){img.src=theo?outSrc(state.outfit):'assets/maya.png';img.alt=theo?'Theo, explorador do MUDI':'Maya, exploradora do MUDI';img.style.objectFit=theo?'contain':'cover'}
      if(strong)strong.textContent=theo?'Olá! Eu sou o Theo!':'Olá! Eu sou a Maya!';
    }
    if(theo){
      portrait.src=outSrc(state.outfit);portrait.alt='Theo';
      if(hudTitle)hudTitle.textContent='Theo, explorador do MUDI';
      hudStatus.textContent='🪙 '+state.coins+' moedas • '+foundIds().length+'/7 tesouros • 👕 '+outfits[state.outfit].name;
      if(walkerImg)walkerImg.src=outSrc(state.outfit);
      if(walkerTag)walkerTag.textContent='THEO';
      if(barWardrobe)barWardrobe.textContent='👕 Roupas de Theo';
      if(barCard)barCard.textContent='🎁 Figurinhas do Theo • 20 🪙';
      if(tileWardrobe)tileWardrobe.firstChild.textContent='👕 Guarda-roupa do Theo';
      if(finalTitle)finalTitle.textContent='🏆 PARABÉNS, EXPLORADOR!';
      if(finalText)finalText.textContent='Você e Theo encontraram os 7 tesouros do MUDI! 🎊';
    }else{
      // O retrato e a roupa de Maya são restaurados pelo refreshHud original.
      if(hudTitle)hudTitle.textContent='Maya, exploradora do MUDI';
      if(walkerTag)walkerTag.textContent='MAYA';
      if(barWardrobe)barWardrobe.textContent='👕 Roupas de Maya';
      if(barCard)barCard.textContent='🎁 Card surpresa • 50 🪙';
      if(tileWardrobe)tileWardrobe.firstChild.textContent='👕 Guarda-roupa da Maya';
      if(finalTitle)finalTitle.textContent='🏆 PARABÉNS, EXPLORADORA!';
      if(finalText)finalText.textContent='Você e Maya encontraram os 7 tesouros do MUDI! 🎊';
    }
  }
  function select(which){
    character=which==='theo'?'theo':'maya';saveChar();
    if(typeof window.refreshHud==='function')window.refreshHud();
    updateUI();
    const msg=document.getElementById('message');
    if(msg)msg.textContent=character==='theo'?'🧭 Theo entrou na aventura! As sete estações e os QR Codes continuam os mesmos.':'🧭 Maya voltou à aventura! Seu progresso foi preservado.';
  }
  const origHud=window.refreshHud;
  if(typeof origHud==='function')window.refreshHud=function(){origHud();updateUI();};
  const origMove=window.moveMaya;
  if(typeof origMove==='function')window.moveMaya=function(dir){origMove(dir);updateUI();if(character==='theo'){const msg=document.getElementById('message');if(msg)msg.textContent=msg.textContent.replace(/Maya/g,'Theo');}};
  const origSetMap=window.setMap;
  if(typeof origSetMap==='function')window.setMap=function(n){origSetMap(n);updateUI();};
  const origTreasure=window.openTreasure;
  if(typeof origTreasure==='function')window.openTreasure=function(...args){origTreasure(...args);if(character==='theo'){const detail=document.getElementById('detail');if(detail)detail.textContent=detail.textContent.replace(/Maya/g,'Theo');}};
  const baseWardrobe=window.openWardrobe;
  const baseAlbum=window.openAlbum;
  const baseBuyCard=window.buyCard;
  const show=(title,html)=>{
    const dlg=document.getElementById('rewardDialog');
    // A troca de roupa/figurinha pode ocorrer com o diálogo já aberto.
    if(dlg && dlg.open){
      document.getElementById('rewardTitle').textContent=title;
      document.getElementById('rewardBody').innerHTML=html;
    }else if(typeof window.rewardShow==='function')window.rewardShow(title,html);
  };
  function outfitShop(){
    syncCredits();
    const cells=outfits.map((item,i)=>{
      const owned=state.owned.includes(i),selected=state.outfit===i;
      const text=selected?'✓ Vestindo':owned?'Vestir':'🪙 '+item.price;
      return '<button type="button" class="theo-catalog-item" aria-pressed="'+selected+'" onclick="theoSelectOutfit('+i+')"><img src="'+outSrc(i)+'" alt="Traje '+escapeText(item.name)+'"><strong>'+escapeText(item.name)+'</strong><small>'+text+'</small></button>';
    }).join('');
    show('👕 Guarda-roupa do Theo','<div class="theo-coins">🪙 '+state.coins+' moedas do Theo</div><p class="theo-info">Encontre tesouros para receber 100 moedas por estação. A primeira roupa é gratuita; as outras são compradas somente com as moedas do Theo.</p><div class="theo-catalog">'+cells+'</div>');
  }
  function album(){
    syncCredits();
    const unlocked=foundIds();
    const cards=cardNames.map((label,i)=>{
      const owned=state.cards.includes(i),pasted=state.pasted.includes(i),available=unlocked.includes(i+1);
      const status=pasted?'✓ Colada':owned?'📌 Colar':available?'🪙 20 moedas':'🔒 Encontre o tesouro';
      return '<button type="button" class="theo-card-cell '+(owned?'':'locked')+'" onclick="theoSelectCard('+i+')"><img src="'+cardSrc(i)+'" alt="Figurinha '+escapeText(label)+'"><strong>'+escapeText(label)+'</strong><small>'+status+'</small></button>';
    }).join('');
    show('📚 Álbum de figurinhas do Theo','<div class="theo-coins">🪙 '+state.coins+' moedas • '+state.pasted.length+'/7 coladas</div><p class="theo-info">Cada tesouro encontrado libera a possibilidade de comprar sua figurinha por 20 moedas. As figurinhas da Maya continuam no álbum dela.</p><div class="theo-card-collection">'+cards+'</div>');
  }
  window.theoSelectOutfit=function(i){
    i=Number(i);if(!Number.isInteger(i)||i<0||i>=outfits.length)return;
    const item=outfits[i];syncCredits();
    if(!state.owned.includes(i)){
      if(state.coins<item.price){show('🪙 Moedas insuficientes','<p>O traje '+escapeText(item.name)+' custa '+item.price+' moedas. Theo possui '+state.coins+'.</p><button class="btn blue" onclick="openWardrobe()">Voltar às roupas</button>');return;}
      state.coins-=item.price;state.owned.push(i);
    }
    state.outfit=i;save();
    // Passa pelo render original da Maya (sem mudar suas chaves), depois substitui só a imagem exibida.
    if(typeof window.refreshHud==='function')window.refreshHud();
    outfitShop();
    const msg=document.getElementById('message');if(msg)msg.textContent='✨ Theo vestiu o traje '+item.name+'!';
  };
  window.theoSelectCard=function(i){
    i=Number(i);if(!Number.isInteger(i)||i<0||i>=7)return;
    syncCredits();
    if(state.cards.includes(i)){
      if(!state.pasted.includes(i))state.pasted.push(i);
      save();album();return;
    }
    if(!foundIds().includes(i+1)){
      show('🔒 Tesouro ainda não encontrado','<p>Encontre primeiro o QR Code da estação '+escapeText(cardNames[i])+' para liberar esta figurinha.</p><button class="btn blue" onclick="openAlbum()">Voltar ao álbum</button>');return;
    }
    if(state.coins<20){
      show('🪙 Moedas insuficientes','<p>Theo precisa de 20 moedas para comprar essa figurinha.</p><button class="btn blue" onclick="openAlbum()">Voltar ao álbum</button>');return;
    }
    state.coins-=20;state.cards.push(i);save();
    show('🎉 Figurinha conquistada!','<img src="'+cardSrc(i)+'" class="theo-reward-img" alt="Figurinha de '+escapeText(cardNames[i])+'"><p>Você ganhou a figurinha '+escapeText(cardNames[i])+'! Agora cole-a no álbum do Theo.</p><button class="btn green" onclick="openAlbum()">📚 Abrir álbum</button>');
    updateUI();
  };
  if(typeof baseWardrobe==='function')window.openWardrobe=function(){if(character==='theo')outfitShop();else baseWardrobe();};
  if(typeof baseAlbum==='function')window.openAlbum=function(){if(character==='theo')album();else baseAlbum();};
  if(typeof baseBuyCard==='function')window.buyCard=function(){if(character==='theo')album();else baseBuyCard();};
  const origReset=window.resetCollection;
  if(typeof origReset==='function')window.resetCollection=function(){
    if(character==='theo'){
      show('🛡️ Progresso protegido','<p>Os sete tesouros são compartilhados por Maya e Theo. Para não apagar as conquistas da Maya, o botão de reiniciar missão está protegido enquanto Theo estiver selecionado.</p><p>Você pode continuar explorando, trocar de personagem ou adquirir roupas e figurinhas sem perder dados.</p>');
      return;
    }
    return origReset();
  };
  const origAnswer=window.answerQuiz;
  if(typeof origAnswer==='function')window.answerQuiz=function(choice){
    const before=foundIds();
    // O motor original sempre credita Maya. Quando Theo joga, preservamos
    // o saldo e o traje da Maya, inclusive as variáveis em memória.
    const mayaCoinsBefore=Number(storage.getItem('maya-coins')||0);
    const mayaOutfitBefore=Number(storage.getItem('maya-outfit')||0);
    origAnswer(choice);
    const after=foundIds();
    if(character==='theo' && after.length>before.length){
      // Essas variáveis globais são definidas pelo jogo base em script clássico.
      // Restaurá-las evita que futuras recompensas da Maya sejam duplicadas.
      try{
        if(typeof coins==='number')coins=mayaCoinsBefore;
        if(typeof outfit==='number')outfit=mayaOutfitBefore;
        if(typeof saved==='function')saved();
      }catch(e){console.warn('[Theo] Não foi possível restaurar as variáveis em memória de Maya',e)}
      storage.setItem('maya-coins',String(mayaCoinsBefore));
      storage.setItem('maya-outfit',String(mayaOutfitBefore));
    }
    syncCredits();updateUI();
    if(character==='theo' && after.length>before.length){
      const newId=after.find(id=>!before.includes(id));
      if(newId){
        showRewardTheo(newId);
        const msg=document.getElementById('message');
        if(msg)msg.textContent='🎉 Resposta correta! Theo conquistou '+cardNames[newId-1]+' e recebeu +100 moedas.';
      }
    }
  };
  function showRewardTheo(id){
    const area=document.getElementById('rewardBody'),heading=document.getElementById('rewardTitle');
    if(!area||!heading)return;
    heading.textContent='🏆 Theo conquistou um tesouro!';
    area.innerHTML='<p>Você encontrou <b>'+escapeText(cardNames[id-1])+'</b> e ganhou <b>100 moedas do Theo!</b></p><img class="theo-reward-img" src="'+outSrc(state.outfit)+'" alt="Theo comemorando"><div class="gamebar"><button onclick="rewards.close();openWardrobe()">👕 Comprar roupa</button><button onclick="rewards.close();openAlbum()">📚 Figurinhas</button><button onclick="rewards.close()">Continuar aventura</button></div>';
  }
  updateUI();
  console.info('[MUDI Theo] Personagem adicional ativo. QR Codes preservados.');
})();
