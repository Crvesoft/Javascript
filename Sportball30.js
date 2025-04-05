// 创建画布并设置大小
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '1';
canvas.style.background = 'transparent';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// 定义球体类
class Ball {
    constructor(x, y, radius, color, vx, vy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.mass = radius;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.stroke();
        ctx.closePath();

        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }

    update() {
        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;

        const maxSpeed = 10;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            this.vx *= scale;
            this.vy *= scale;
        }

        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.vy = -this.vy * 1.2;
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = -this.vy;
        }

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = -this.vx;
        }
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.vx = -this.vx;
        }

        if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
            this.vx += (Math.random() - 0.5) * 2;
            this.vy = -Math.random() * 5;
        }
    }
}

// 生成低饱和度冷色系颜色
function randomColor() {
    const h = Math.random() * 180 + 120;
    const s = Math.random() * 20 + 10;
    const l = Math.random() * 30 + 50;
    return `hsl(${h}, ${s}%, ${l}%)`;
}

// 创建球体数组
const balls = [];
const numBalls = 30;
for (let i = 0; i < numBalls; i++) {
    const radius = Math.random() * 20 + 10;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const y = canvas.height - radius;
    const vx = (Math.random() - 0.5) * 5;
    const vy = -Math.random() * 8 - 2;
    const color = randomColor();
    balls.push(new Ball(x, y, radius, color, vx, vy));
}

// 定义重力
const gravity = 0.1;

// 检测球体间碰撞
function detectCollision(ballA, ballB) {
    const dx = ballA.x - ballB.x;
    const dy = ballA.y - ballB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ballA.radius + ballB.radius;
}

// 处理球体间碰撞（增强横向幅度）
function handleCollision(ballA, ballB) {
    const dx = ballB.x - ballA.x;
    const dy = ballB.y - ballA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const m1 = ballA.mass;
    const m2 = ballB.mass;
    const u1x = ballA.vx;
    const u1y = ballA.vy;
    const u2x = ballB.vx;
    const u2y = ballB.vy;

    // 计算碰撞后的速度，增强横向分量
    const v1x = ((m1 - m2) * u1x + 2 * m2 * u2x) / (m1 + m2) * 1.05; // 横向放大1.5倍
    const v1y = ((m1 - m2) * u1y + 2 * m2 * u2y) / (m1 + m2) * 1.05; // 纵向保持不变
    const v2x = ((m2 - m1) * u2x + 2 * m1 * u1x) / (m1 + m2) * 1.05; // 横向放大1.5倍
    const v2y = ((m2 - m1) * u2y + 2 * m1 * u1y) / (m1 + m2) * 1.05 // 纵向保持不变

    ballA.vx = v1x;
    ballA.vy = v1y;
    ballB.vx = v2x;
    ballB.vy = v2y;

    // 分离重叠的球体
    const overlap = (ballA.radius + ballB.radius) - distance;
    if (overlap > 0) {
        const pushX = (dx / distance) * overlap * 0.5;
        const pushY = (dy / distance) * overlap * 0.5;
        ballA.x -= pushX;
        ballA.y -= pushY;
        ballB.x += pushX;
        ballB.y += pushY;
    }
}

// 动画循环
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    balls.forEach(ball => {
        ball.update();
        ball.draw();
    });

    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            if (detectCollision(balls[i], balls[j])) {
                handleCollision(balls[i], balls[j]);
            }
        }
    }

    requestAnimationFrame(animate);
}

// 启动动画
animate();
