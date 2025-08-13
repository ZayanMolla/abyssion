const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 32;

// Player
let player = {
    x: 10,
    y: 7,
    width: 28,
    height: 28,
    color: 'cyan',
    speed: 3,
    health: 5,
    facing: 'right',
    sword: null
};

// Enemies
let enemies = [
    {x: 15, y: 5, width: 28, height: 28, color: 'red', speed: 1, health: 3},
    {x: 5, y: 10, width: 28, height: 28, color: 'red', speed: 1, health: 3}
];

// Keys
let keys = {};
window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if(e.key === ' '){
        attackSword();
    }
});
window.addEventListener('keyup', e => keys[e.key] = false);

// Sword swing function
function attackSword() {
    if(player.sword) return; // only one swing at a time

    player.sword = {
        angle: 0,            // current swing angle
        maxAngle: Math.PI/2, // 90 degrees swing
        speed: 0.2,          // radians per frame
        length: 48           // sword length
    };
}

// Main game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Player movement
    if(keys['ArrowUp'] || keys['w']) { player.y -= player.speed / TILE_SIZE; player.facing = 'up'; }
    if(keys['ArrowDown'] || keys['s']) { player.y += player.speed / TILE_SIZE; player.facing = 'down'; }
    if(keys['ArrowLeft'] || keys['a']) { player.x -= player.speed / TILE_SIZE; player.facing = 'left'; }
    if(keys['ArrowRight'] || keys['d']) { player.x += player.speed / TILE_SIZE; player.facing = 'right'; }

    // Enemy movement
    enemies.forEach(enemy => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist > 0){
            enemy.x += (dx/dist) * enemy.speed / TILE_SIZE;
            enemy.y += (dy/dist) * enemy.speed / TILE_SIZE;
        }

        // Collision with player
        if(Math.abs(player.x - enemy.x) < 1 && Math.abs(player.y - enemy.y) < 1){
            player.health -= 0.02;
        }

        // Sword hits enemy
        if(player.sword){
            let swordBox = getSwordBox();
            if(rectCollision(swordBox, enemy)){
                enemy.health -= 1;
            }
        }
    });

    // Remove dead enemies
    enemies = enemies.filter(e => e.health > 0);

    // Sword swing update
    if(player.sword){
        player.sword.angle += player.sword.speed;
        if(player.sword.angle >= player.sword.maxAngle){
            player.sword = null;
        }
    }
}

// Get current sword rectangle based on swing
function getSwordBox() {
    const px = player.x * TILE_SIZE + player.width/2;
    const py = player.y * TILE_SIZE + player.height/2;
    const length = player.sword ? player.sword.length : 48; // sword length
    const width = 8;
    let x = px;
    let y = py;

    switch(player.facing){
        case 'up':
            x = px - width/2;
            y = py - length;
            break;
        case 'down':
            x = px - width/2;
            y = py;
            break;
        case 'left':
            x = px - length;
            y = py - width/2;
            break;
        case 'right':
            x = px;
            y = py - width/2;
            break;
    }

    return {
        x,
        y,
        width: (player.facing==='left'||player.facing==='right')?length:width,
        height: (player.facing==='up'||player.facing==='down')?length:width
    };
}

// Check rectangle collision
function rectCollision(a, b){
    return (a.x < b.x * TILE_SIZE + b.width &&
            a.x + a.width > b.x * TILE_SIZE &&
            a.y < b.y * TILE_SIZE + b.height &&
            a.y + a.height > b.y * TILE_SIZE);
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x*TILE_SIZE, player.y*TILE_SIZE, player.width, player.height);

    // Draw sword swing as pixelated sword with hilt attached to player
    if(player.sword){
        ctx.save();
        // Translate to player center
        ctx.translate(player.x*TILE_SIZE + player.width/2, player.y*TILE_SIZE + player.height/2);
        let swingAngle = player.sword.angle;
        if(player.facing === 'left' || player.facing === 'up') swingAngle *= -1;
        ctx.rotate(swingAngle);

        const swordWidth = 4;       // blade width
        const swordLength = player.sword.length;

        // Draw hilt (brown) attached to player
        ctx.fillStyle = '#8B4513';
        if(player.facing === 'up' || player.facing === 'down'){
            ctx.fillRect(-2, -2, swordWidth+4, 4); // horizontal hilt
        } else {
            ctx.fillRect(-2, -2, 4, swordWidth+4); // vertical hilt
        }

        // Draw blade (gold) extending from hilt
        ctx.fillStyle = '#FFD700';
        for(let i=4; i<swordLength; i+=4){ // start after hilt
            if(player.facing === 'up' || player.facing === 'down'){
                ctx.fillRect(0, i, swordWidth, 4);
            } else {
                ctx.fillRect(i, 0, 4, swordWidth);
            }
        }

        ctx.restore();
    }

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x*TILE_SIZE, enemy.y*TILE_SIZE, enemy.width, enemy.height);
    });

    // Draw HUD
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('Health: ' + Math.floor(player.health), 10, 20);
}

gameLoop();
