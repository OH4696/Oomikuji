const elResult = document.getElementById('fortune-result');
const elShort = document.getElementById('fortune-short');
const elCategories = document.getElementById('fortune-categories');
const elLong = document.getElementById('fortune-long');
const drawBtn = document.getElementById('draw-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const saveBtn = document.getElementById('save-btn');
const pageIndicator = document.getElementById('page-indicator');
const pager = document.getElementById('pager');
const elFooter = document.querySelector('.footer');

// ボックスの縦サイズを大きくする設定
const styleBox = document.createElement('style');
styleBox.textContent = `
  .fortune-card { height: 700px; overflow-y: auto; }
`;
document.head.appendChild(styleBox);

let currentPage = 1;
let hasDrawn = false;
let currentResultData = null; // 結果データを保存する変数
// ensure pager controls hidden before draw
if(pager) {
  pager.hidden = true;
  pager.style.display = 'none';
}
if(prevBtn) prevBtn.style.display = 'none';
if(nextBtn) nextBtn.style.display = 'none';
if(pageIndicator) pageIndicator.style.display = 'none';

function showPage(n){
  const total = 3;
  const target = Math.max(1, Math.min(total, n));
  const currentEl = document.querySelector('.page:not([hidden])');

  const updateDOM = () => {
    currentPage = target;
    document.querySelectorAll('.page').forEach(sec=>{
      const p = Number(sec.dataset.page);
      if(p === currentPage){
        sec.classList.add('active');
        sec.removeAttribute('hidden');
        // ページ遷移時（既におみくじを引いていて、かつページが変わる場合）はフェードイン
        if(hasDrawn && currentEl && currentEl !== sec){
          sec.animate([{opacity:0}, {opacity:1}], {duration: 400, easing: 'ease-out'});
        }
      } else {
        sec.classList.remove('active');
        sec.setAttribute('hidden','');
      }
    });
    if(pageIndicator) pageIndicator.textContent = `${currentPage} / ${total}`;
    if(prevBtn) prevBtn.disabled = currentPage === 1;
    if(nextBtn) nextBtn.disabled = currentPage === total;

    // 最後のページなら「次へ」を隠して「保存」を表示
    if(currentPage === total){
      if(nextBtn) nextBtn.style.display = 'none';
      if(saveBtn) saveBtn.style.display = 'inline-block';
    } else {
      if(nextBtn) nextBtn.style.display = '';
      if(saveBtn) saveBtn.style.display = 'none';
    }
  };

  // 既におみくじを引いていて、かつ別のページへ移動する場合はフェードアウトから開始
  if(hasDrawn && currentEl && target !== currentPage){
    if(prevBtn) prevBtn.disabled = true;
    if(nextBtn) nextBtn.disabled = true;
    const anim = currentEl.animate([{opacity:1}, {opacity:0}], {duration: 400, easing: 'ease-in'});
    anim.onfinish = updateDOM;
  } else {
    updateDOM();
  }
}

function weightedPick(list){
  let total = 0;
  list.forEach(f => total += (f.weight || 0));
  let r = Math.random() * total;
  for(const f of list){
    const w = f.weight || 0;
    if(r < w) return f;
    r -= w;
  }
  return list[0];
}

function clearConfetti(){
  document.querySelectorAll('.confetti').forEach(n=>n.remove());
}

function spawnConfetti(color){
  for(let i=0;i<12;i++){
    const d = document.createElement('div');
    d.className='confetti';
    d.style.position='fixed';
    d.style.zIndex='1000';
    d.style.width='8px';d.style.height='12px';
    d.style.background=color;d.style.left=(15+i*6)+'%';
    d.style.top='40%';
    const r = Math.random()*360;
    d.style.transform=`translateY(0) rotate(${r}deg)`;
    document.body.appendChild(d);
    const anim = d.animate([
      { transform: `translateY(0) rotate(${r}deg)`, opacity: 1 },
      { transform: `translateY(200px) rotate(${r+180}deg)`, opacity: 0 }
    ], { duration: 1400, easing: 'ease-out' });
    anim.onfinish = () => d.remove();
  }
}

function updateFooter(){
  if(!elFooter) return;
  const count = parseInt(localStorage.getItem('omikuji_count') || '0');
  
  // 1回目から100回目までのメッセージリスト
  const messages = [
    "おみくじやでな。気軽にとらえてたも。",
    "あれ、気に入らんかった？もう1回ぐらいええよ。",
    "まぁまぁ、3度目の正直って言葉もあるから。",
    "もしかして自分、結構欲張りちゃんと違う？",
    "5回目や。そろそろ満足した？",
    "満足せんかったんやな、おみくじも喜んどるわ。",
    "よし！7回目やな。ラッキーセブンや！ ",
    "8回目。末広がりやで。",
    "苦はないで、楽しみや～。",
    "10回目。そろそろええんとちゃう？1000円は擦ったで。",
    "あかんかったんやな。",
    "ほいな、干支が一巡しました。",
    "え、実はここ変わってるん今気づいた？流石にあらへんか。",
    "ちょい引きながらでええから、話聞いてや。",
    "最近な、珍しく袋菓子買うてん。",
    "ほんでめっちゃうまいやんコレ～思うてふと裏見たんやけど、",
    "ごりごりの犬用書いてあってん。",
    "あれ？犬用？思うてな。",
    "なんや自分恥ずかしいわ～言うておかんに話したらな、",
    "おかんも同じの買うてたわ。",
    "遺伝子って怖いわ～。",
    "あ、今何回目やっけ？",
    "たぶん、23回目ぐらい？",
    "随分と引くなぁ。続きが気になってしゃあないんやろ～。",
    "ほな、また違う話でも聞いてもらおか！",
    "...いや、逆に自分の話聞かせてや～。",
    "ほら、なんでもええから～。相談事でもかまへんよ～。",
    "どうやって解決したらええか分からんこととか～。",
    "...う～ん、自分えらい無口やな～。",
    "いやどうやってここに話しかけるんか～いうてな。",
    "あは♡",
    "どや？そろそろええ内容でたか？",
    "ちなみに33回目やで。ちゃんと数えとるからな～。",
    "他に引く人もおらんから、好きなだけ引いたらええわ。",
    "お布施も期待しとるで～。",
    "...気持ちでええからな？",
    "ほんまに...。",
    "来てくれるだけでも嬉しいから...、",
    "あ...。",
    "かんにんな、どうにか最近涙もろうてな。",
    "参拝しに来はってもろてるのにこんな姿見せてしもて申し訳が立たへんわ。",
    "話を聞く...？",
    "さっきみたいな対しておもろない話ばっかりやで！",
    "それでもええ言うんやったら、まぁ...",
    "そう.....やな。",
    "ここもな、昔はように賑わっとったんよ。",
    "家族連れとか、若い夫婦とかもよう来とったわ。",
    "みんな笑顔でな、おみくじ引いたり、絵馬書いたりしとってん、",
    "ほんでな、子供らが走り回っとったりしてな。",
    "みんな楽しそうやってん。",
    "ほんでな、",
    "時代の流れか知らんけど、",
    "少ーしずつ少ーしずつ人が来んようになってな。",
    "気づいたら、こんな状態やわ。",
    "...まぁ、ええねんけどな。",
    "今日もこうして誰かが来てくれたんも随分久しぶりなんよ。",
    "前に来た人は市の職員さんやったわ。",
    "土地がどうとか言うてな。",
    "あんまり詳しいことは分からんけどな。",
    "なんや色々大変みたいやわ。",
    "最近の人間は自分たちの事で精一杯なんかもな。",
    "それが悪いとは言わんけどな。",
    "少し寂しいやんか...。",
    "これは独り言やけどな？",
    "神社に来てする事言うたら、神様にお参りする事やろ？",
    "みんなお願い事ばっかり言うてな。",
    "自分の事ばっかりや。",
    "形式的にお参りして、",
    "さっさと帰ってまう。",
    "ほんでまた次のお願い事しに来る。",
    "なんや、神様も便利な道具みたいやな。",
    "あかんわ～、また涙出てきたわ。",
    "ほんまにかんにんな。",
    "でもな、それでもええんよ。",
    "誰かがここに来てくれるんやったらな。",
    "それでもええんよ。",
    "...それでも。",
    "時代の在り方沿って変わっていくのも大切やしな。",
    "それがたとえ神様の望みやったとしてもな。",
    "人にはそれぞれの生き方があるんやからな。",
    "なんや、もう重い話はおしまいや！",
    "話して随分楽になったわ～。",
    "ほれ！引いたおみくじ見してみ！",
    "なんやええ事書いてあるやんか！",
    "よかったな～！うらやましいわ～！",
    "え、自分も引いてみろって？",
    "あはは、そらあかんな～。",
    "自分で自分の運勢決めるんも変な話やしな～。",
    "ん？",
    "今まで引いた中で一番のものをくれるって？",
    "そらあかんわ、そんなんもったいないやん！",
    "...ほんまに？",
    "...。",
    "なんか、ありがとうな。話も聞いてくれた上に、こんなええもんまでくれて。",
    "あんた、ええ人やな。",
    "ほれ！引いたおみくじ結んでき！",
    "ほんでな、またおいでな！",
    "待っとるからな！",
    "...",
    "気が付くと、社は古び、朱は剥げ、石段には苔が広がっている神社の中に立っていた。ふと目に入った結び所には、一つだけおみくじが結ばれていた。なぜか手に持っていたおみくじを結び、本殿に向かうと深く静かに名乗りと感謝を述べた。鈴の音が聞こえた気がしたが、たぶん気のせいだろう。　",
  ];

  let msg = 'おみくじやでな。気軽にとらえてたも。';
  if(count >= 1 && count <= 100){
    msg = messages[count - 1];
  } else if(count > 100){
    msg = '100回以上お引きいただきありがとうございました。';
  }
  elFooter.textContent = msg;
}

function draw(){
  clearConfetti();
  let count = parseInt(localStorage.getItem('omikuji_count') || '0');
  localStorage.setItem('omikuji_count', count + 1);

  const f = weightedPick(fortunes);
  // overview
  elResult.textContent = f.name;
  elResult.style.color = f.color;
  elResult.style.fontSize = '';
  elShort.style.textAlign = 'center';
  const shortMsg = Array.isArray(f.short) ? f.short[Math.floor(Math.random() * f.short.length)] : f.short;
  elShort.innerHTML = shortMsg || '';

  // categories
  elCategories.innerHTML = '';
  const categoryResults = []; // 画像生成用に保存するリスト
  // カテゴリのキー一覧を取得（全ての運勢データで共通と仮定）
  const catKeys = Object.keys(fortunes[0].categories);
  for(const k of catKeys){
    // カテゴリごとに個別に抽選を行う（重み付け抽選を再利用）
    const subF = weightedPick(fortunes);
    // 配列からランダムに1つ選ぶ
    const catList = subF.categories[k];
    const msg = Array.isArray(catList) ? catList[Math.floor(Math.random() * catList.length)] : catList;

    categoryResults.push({title: k, content: msg});

    const li = document.createElement('li');
    li.style.textAlign = 'center';
    li.innerHTML = `<strong>${k}</strong><br>${msg}`;
    elCategories.appendChild(li);
  }

  // long text
  elLong.style.textAlign = 'center';
  let displayLongMsg = '';
  const longMsg = Array.isArray(f.long) ? f.long[Math.floor(Math.random() * f.long.length)] : f.long;
  if(longMsg){
    // 「お告げ：」などの接頭辞を削除して表示
    displayLongMsg = longMsg.replace(/^お告げ[：:]\s*/, '');
    elLong.textContent = displayLongMsg;
  } else {
    elLong.textContent = '';
  }

  // 結果を保存
  currentResultData = {
    fortune: f,
    shortMsg: shortMsg,
    categories: categoryResults,
    longMsg: displayLongMsg
  };

  showPage(1);
  spawnConfetti(f.color);
  // update UI state: reveal pager and hide draw button
  hasDrawn = true;
  if(pager) {
    pager.hidden = false;
    pager.style.display = '';
  }
  // reveal pager controls
  if(prevBtn) prevBtn.style.display = '';
  if(nextBtn) nextBtn.style.display = '';
  if(pageIndicator) pageIndicator.style.display = '';
  drawBtn.style.display = 'none';
}

drawBtn.addEventListener('click', ()=>{
  drawBtn.disabled = true;
  if(pager) {
    pager.hidden = true;
    pager.style.display = 'none';
  }
  showPage(1);
  elResult.textContent = '';
  const loadImgs = [
    { src: 'mikuji1.png', deg: -20 },
    { src: 'mikuji1.png', deg: 20 },
    { src: 'mikuji2.png', deg: -20 }
  ];
  loadImgs.forEach((d, i) => {
    setTimeout(() => {
      elResult.innerHTML = '';
      const img = document.createElement('img');
      img.src = `img/${d.src}`;
      img.style.width = '100px';
      img.style.transform = `rotate(${d.deg}deg)`;
      elResult.appendChild(img);
      img.animate([{opacity:0, transform: `rotate(${d.deg}deg)`}, {opacity:1, transform: `rotate(${d.deg}deg)`}], {duration: 800, easing: 'ease-out'});
    }, i * 900);
  });
  elResult.style.color = '#333';
  elShort.textContent = '';
  elCategories.innerHTML = '';
  elLong.textContent = '';

  // 3.5秒後にフェードアウト開始
  setTimeout(()=>{
    const fadeOut = elResult.animate([{opacity:1}, {opacity:0}], {duration: 1000, easing: 'ease-in'});
    fadeOut.onfinish = () => {
      draw();
      const p1 = document.querySelector('.page[data-page="1"]');
      if(p1) p1.animate([{opacity:0}, {opacity:1}], {duration: 1500, easing: 'ease-out'});
    };
  }, 3500);
});

nextBtn.addEventListener('click', ()=>{ if(hasDrawn) showPage(currentPage+1); });
prevBtn.addEventListener('click', ()=>{ if(hasDrawn) showPage(currentPage-1); });

// 画像保存ボタンの処理
saveBtn.addEventListener('click', () => {
  if (!currentResultData) return;

  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#fdfcf0'; // クリーム色
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 枠線（オプション）
  ctx.strokeStyle = currentResultData.fortune.color || '#333';
  ctx.lineWidth = 20;
  ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

  // 運勢（大吉など）
  ctx.fillStyle = currentResultData.fortune.color || '#333';
  ctx.font = 'bold 150px serif';
  ctx.textAlign = 'center';
  ctx.fillText(currentResultData.fortune.name, canvas.width / 2, 250);

  // 短いメッセージ
  ctx.fillStyle = '#333';
  ctx.font = '30px serif';
  ctx.fillText(currentResultData.shortMsg || '', canvas.width / 2, 340);

  // 項目別運勢（2行3列で配置）
  ctx.font = '30px serif';
  const cats = currentResultData.categories;
  const cols = 3;
  const startX = 200;
  const startY = 480;
  const colWidth = (canvas.width - 400) / cols;
  const rowHeight = 180;

  cats.forEach((cat, index) => {
    const r = Math.floor(index / cols);
    const c = index % cols;
    const x = startX + c * colWidth + colWidth / 2;
    const y = startY + r * rowHeight;

    // 項目名
    ctx.font = 'bold 36px serif';
    ctx.fillStyle = '#555';
    ctx.fillText(cat.title, x, y);

    // 内容（折り返し処理）
    ctx.font = '30px serif';
    ctx.fillStyle = '#333';
    wrapText(ctx, cat.content, x, y + 50, colWidth - 40, 40);
  });

  // 狐ノ御告
  if (currentResultData.longMsg) {
    ctx.fillStyle = '#000';
    ctx.font = 'bold 40px serif';
    ctx.fillText('狐ノ御告', canvas.width / 2, 880);

    ctx.font = '34px serif';
    wrapText(ctx, currentResultData.longMsg, canvas.width / 2, 940, 1600, 50);
  }

  // ダウンロード
  const link = document.createElement('a');
  link.download = 'omikuji_result.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// テキスト折り返し用関数
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

// Accessibility: press Enter on focused buttons
drawBtn.addEventListener('keyup', (e)=>{ if(e.key==='Enter') drawBtn.click(); });
if(nextBtn) nextBtn.addEventListener('keyup', (e)=>{ if(e.key==='Enter') nextBtn.click(); });
if(prevBtn) prevBtn.addEventListener('keyup', (e)=>{ if(e.key==='Enter') prevBtn.click(); });

// Initialize footer text
updateFooter();
