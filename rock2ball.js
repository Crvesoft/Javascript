// dynamic-balls-collision.js
(function() {
    // 配置参数
    const CONFIG = {
        BALL_COUNT: 12,             // 球体数量
        MIN_RADIUS: 15,             // 最小半径(像素)
        MAX_RADIUS: 40,             // 最大半径(像素)
        INIT_SPEED: 8,              // 初始速度基数
        BOUNCE_DAMPING: 0.95,       // 碰撞阻尼
        AIR_RESISTANCE: 0.0001,     // 空气阻力
        LINE_WIDTH: 1.5,            // 线条宽度
        COLOR: 'rgba(80, 80, 80, 0.4)' // 球体颜色
    };

    // 初始化画布
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // 球类定义
    class Ball {
        constructor(radius) {
            this.radius = radius;
            this.mass = radius * radius; // 质量与面积成正比
            this.resetPosition();
            this.vx = (Math.random() - 0.5) * CONFIG.INIT_SPEED * (40/radius);
            this.vy = (Math.random() - 0.5) * CONFIG.INIT_SPEED * (40/radius);
        }

        resetPosition() {
            const margin = this.radius * 2;
            this.x = margin + Math.random() * (canvas.width - margin * 2);
            this.y = margin + Math.random() * (canvas.height - margin * 2);
        }

        update() {
            // 应用空气阻力
            this.vx *= (1 - CONFIG.AIR_RESISTANCE);
            this.vy *= (1 - CONFIG.AIR_RESISTANCE);
            
            // 更新位置
            this.x += this.vx;
            this.y += this.vy;

            // 边界碰撞
            if (this.x < this.radius) {
                this.x = this.radius;
                this.vx = Math.abs(this.vx) * CONFIG.BOUNCE_DAMPING;
            }
            if (this.x > canvas.width - this.radius) {
                this.x = canvas.width - this.radius;
                this.vx = -Math.abs(this.vx) * CONFIG.BOUNCE_DAMPING;
            }
            if (this.y < this.radius) {
                this.y = this.radius;
                this.vy = Math.abs(this.vy) * CONFIG.BOUNCE_DAMPING;
            }
            if (this.y > canvas.height - this.radius) {
                this.y = canvas.height - this.radius;
                this.vy = -Math.abs(this.vy) * CONFIG.BOUNCE_DAMPING;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = CONFIG.COLOR;
            ctx.lineWidth = CONFIG.LINE_WIDTH;
            ctx.stroke();
        }
    }

    // 全局变量
    const balls = [];
    let animationId;

    // 智能生成球体
    function initBalls() {
        for(let i=0; i<CONFIG.BALL_COUNT; i++){
            const radius = CONFIG.MIN_RADIUS + 
                         Math.random()*(CONFIG.MAX_RADIUS - CONFIG.MIN_RADIUS);
            
            let newBall;
            let valid = false;
            let attempts = 0;
            
            // 最大尝试50次生成不重叠球体
            while(!valid && attempts++ < 50) {
                newBall = new Ball(radius);
                valid = !balls.some(b => {
                    const dx = b.x - newBall.x;
                    const dy = b.y - newBall.y;
                    return Math.sqrt(dx*dx + dy*dy) < b.radius + newBall.radius;
                });
            }
            
            if(valid) balls.push(newBall);
            else console.warn('无法生成不重叠球体');
        }
    }

    // 高效碰撞检测
    function handleCollisions() {
        // 空间分割优化：将画布划分为网格
        const GRID_SIZE = CONFIG.MAX_RADIUS * 2;
        const grid = new Map();
        
        // 将球体分配到网格
        balls.forEach((ball, i) => {
            const x = Math.floor(ball.x / GRID_SIZE);
            const y = Math.floor(ball.y / GRID_SIZE);
            const key = `${x},${y}`;
            
            if(!grid.has(key)) grid.set(key, []);
            grid.get(key).push(i);
        });

        // 只检测相邻网格内的碰撞
        grid.forEach((cell, key) => {
            const [x, y] = key.split(',').map(Number);
            
            // 检测当前网格和相邻8个网格
            for(let dx=-1; dx<=1; dx++){
                for(let dy=-1; dy<=1; dy++){
                    const neighborKey = `${x+dx},${y+dy}`;
                    if(grid.has(neighborKey)) {
                        grid.get(neighborKey).forEach(j => {
                            cell.forEach(i => {
                                if(i >= j) return; // 避免重复检测
                                checkCollision(balls[i], balls[j]);
                            });
                        });
                    }
                }
            }
        });
    }

    // 精确碰撞处理
    function checkCollision(b1, b2) {
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx*dx + dy*dy;
        const minDist = b1.radius + b2.radius;
        
        if(distSq < minDist*minDist) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist; // 法线方向
            const ny = dy / dist;
            
            // 位置修正
            const overlap = (minDist - dist) / 2;
            b1.x -= nx * overlap;
            b1.y -= ny * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;

            // 相对速度投影
            const vx = b1.vx - b2.vx;
            const vy = b1.vy - b2.vy;
            const dot = vx*nx + vy*ny;

            // 只处理接近的碰撞
            if(dot > 0) return;

            // 冲量计算 (含恢复系数)
            const e = 0.8; // 恢复系数
            const impulse = -(1 + e) * dot / (1/b1.mass + 1/b2.mass);
            
            // 速度更新
            b1.vx += (impulse * nx) / b1.mass;
            b1.vy += (impulse * ny) / b1.mass;
            b2.vx -= (impulse * nx) / b2.mass;
            b2.vy -= (impulse * ny) / b2.mass;
        }
    }

    // 响应式处理
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.zIndex = '0';
        balls.forEach(ball => ball.resetPosition());
    }

    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        handleCollisions();
        balls.forEach(ball => {
            ball.update();
            ball.draw();
        });
        animationId = requestAnimationFrame(animate);
    }

    // 初始化
    function init() {
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 0;
        `;
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        initBalls();
        animate();
    }

    // 启动
    document.readyState === 'complete' ? init() : window.addEventListener('load', init);

    // 控制接口
    window.ballsController = {
        setSpeedMultiplier: (factor) => {
            balls.forEach(b => {
                b.vx *= factor;
                b.vy *= factor;
            });
        },
        reset: () => {
            balls.forEach(b => {
                b.resetPosition();
                b.vx = (Math.random()-0.5)*CONFIG.INIT_SPEED*(40/b.radius);
                b.vy = (Math.random()-0.5)*CONFIG.INIT_SPEED*(40/b.radius);
            });
        },
        destroy: () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
            canvas.remove();
        }
    };
})();
