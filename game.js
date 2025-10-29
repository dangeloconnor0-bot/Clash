const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let elixir = 10;
let troops = [];
let gameOver = false;
const towerSize = 40;

let towers = [
  { x:60, y:120, hp:1000, type:'arena', enemy:false },
  { x:60, y:520, hp:1000, type:'arena', enemy:false },
  { x:180, y:320, hp:1500, type:'king', enemy:false },
  { x:300, y:120, hp:1000, type:'arena', enemy:true },
  { x:300, y:520, hp:1000, type:'arena', enemy:true },
  { x:180, y:320, hp:1500, type:'king', enemy:true }
];

const troopTypes = {
  Knight: { hp:600, damage:50, speed:1, range:20, cost:3, splash:false, flying:false },
  Archer: { hp:200, damage:20, speed:1.5, range:120, cost:3, splash:false, flying:false },
  Bomber: { hp:250, damage:40, speed:1, range:20, cost:4, splash:true, radius:40, flying:false },
  Minions: { hp:150, damage:30, speed:2, range:20, cost:3, splash:false, flying:true }
};

function drawArena(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width/2,0);
  ctx.lineTo(canvas.width/2,canvas.height);
  ctx.stroke();
  towers.forEach(t=>{
    ctx.fillStyle = t.enemy?'red':'brown';
    ctx.fillRect(t.x-towerSize/2, t.y-towerSize/2, towerSize, towerSize);
    ctx.fillStyle = 'red';
    ctx.fillRect(t.x-towerSize/2, t.y-towerSize/2-10, towerSize*(t.hp/(t.type==='king'?1500:1000)), 5);
  });
  troops.forEach(t=>{
    ctx.fillStyle = t.enemy?t.color:'blue';
    ctx.beginPath();
    ctx.arc(t.x,t.y,15,0,Math.PI*2);
    ctx.fill();
  });
  ctx.fillStyle='white';
  ctx.fillText("Elixir: "+Math.floor(elixir),10,20);
}

function spawnTroop(type, lane='bottom', enemy=false){
  if(!enemy && elixir < troopTypes[type].cost) return;
  if(!enemy) elixir -= troopTypes[type].cost;
  let y = lane==='top'?120:520;
  let x = enemy?300:60;
  troops.push({ x, y, type, hp: troopTypes[type].hp, enemy, targetX: enemy?60:300, targetY: y, color: enemy?'red':'blue' });
}

function updateTroops(){
  troops.forEach((t,i)=>{
    if(t.hp <=0) { troops.splice(i,1); return; }
    let targets = troops.filter(tr => tr.enemy !== t.enemy).concat(towers.filter(tow => tow.enemy !== t.enemy));
    if(targets.length===0) return;
    let nearest = null; let minDist = Infinity;
    targets.forEach(trg=>{
      let d = Math.sqrt((t.x-trg.x)**2 + (t.y-trg.y)**2);
      if(d < minDist){ minDist = d; nearest = trg; }
    });
    if(nearest){
      let dx = nearest.x - t.x;
      let dy = nearest.y - t.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      if(dist > troopTypes[t.type].range){
        t.x += dx/dist * troopTypes[t.type].speed;
        t.y += dy/dist * troopTypes[t.type].speed;
      } else {
        if(troopTypes[t.type].splash){
          targets.forEach(trg=>{
            let dd = Math.sqrt((t.x-trg.x)**2 + (t.y-trg.y)**2);
            if(dd<troopTypes[t.type].radius) trg.hp -= troopTypes[t.type].damage;
          });
        } else {
          nearest.hp -= troopTypes[t.type].damage;
        }
      }
    }
  });
}

function updateTowers(){
  towers.forEach(tow=>{
    if(tow.hp <=0) return;
    let enemies = troops.filter(tr=> tr.enemy !== tow.enemy);
    if(enemies.length ===0) return;
    let nearest = null; let minDist=Infinity;
    enemies.forEach(e=>{
      let d = Math.sqrt((tow.x - e.x)**2 + (tow.y - e.y)**2);
      if(d<minDist){ minDist=d; nearest=e; }
    });
    if(nearest && minDist<150) nearest.hp -=10;
  });
}

function spawnAI(){
  let lane = Math.random()>0.5?'top':'bottom';
  let types = ['Knight','Archer','Bomber','Minions'];
  let t = types[Math.floor(Math.random()*types.length)];
  spawnTroop(t,lane,true);
}

document.querySelectorAll('.card').forEach(card=>{
  card.addEventListener('click', ()=>spawnTroop(card.dataset.type,'bottom'));
});
canvas.addEventListener('touchstart', e=>{
  let touch = e.touches[0];
  let lane = touch.clientY < canvas.height/2?'top':'bottom';
  spawnTroop('Knight', lane);
});

setInterval(()=>{ if(elixir<10) elixir+=0.5; }, 1000);
setInterval(spawnAI,2000);

function checkVictory(){
  towers.forEach(tow=>{
    if(tow.hp <=0 && tow.type==='king'){
      gameOver=true;
      document.getElementById('message').textContent = tow.enemy?'You Lose!':'You Win!';
      document.getElementById('message').style.display='block';
    }
  });
}

function gameLoop(){
  if(!gameOver){
    updateTroops();
    updateTowers();
    drawArena();
    checkVictory();
    requestAnimationFrame(gameLoop);
  }
}
gameLoop();