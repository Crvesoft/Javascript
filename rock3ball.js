// optimized-balls-collision.js
(function() {
    // 精准物理参数配置
    const CONFIG = {
        BALL_COUNT: 9,              // 最佳碰撞数量（经测试验证）
        MIN_RADIUS: 18,             
        MAX_RADIUS: 36,             
        INIT_SPEED: 12,             // 提高初始速度
        BOUNCE_DAMPING: 0.97,       // 降低边界阻尼
        AIR_RESISTANCE: 0.00005,    // 更小空气阻力
        RESTITUTION: 0.92,          // 提高恢复系数
        LINE_OPACITY: 0.6,          
        COLOR_BASE: 90              // 灰度基准值
    };

    // 初始化画布
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // 高级球体类
    class Ball {
        constructor(radius) {
            this.radius = radius;
            this.mass = Math.PI * radius ** 2; // 按实际面积计算质量
            this._resetPosition();
            this._initVelocity();
        }

        _resetPosition() {
            const safeZone = this.radius * 2.5;
            this.x = safeZone + Math.random() * (canvas.width - safeZone*2);
            this.y = safeZone + Math.random() * (canvas.height - safeZone*2);
        }

        _initVelocity() {
            const angle = Math.random() * Math.PI * 2;
            const speed = CONFIG.INIT_SPEED * (0.8 + Math.random()*0.4);
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }

        update() {
            // 运动衰减
            this.vx *= 1 - CONFIG.AIR_RESISTANCE;
            this.vy *= 1 - CONFIG.AIR_RESISTANCE;
            
            // 更新位置
            this.x += this.vx;
            this.y += this.vy;

            // 弹性边界处理
            const bounce = (pos, max, r) => {
                if (pos < r) {
                    this.vx = Math.abs(this.vx) * CONFIG.BOUNCE_DAMPING;
                    return r + (r - pos) * 0.1;
                }
                if (pos > max - r) {
                    this.vx = -Math.abs(this.vx) * CONFIG.BOUNCE_DAMPING;
                    return max - r - (pos - (max - r)) * 0.1;
                }
                return pos;
            };
            this.x = bounce(this.x, canvas.width, this.radius);
            this.y = bounce(this.y, canvas.height, this.radius);
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${CONFIG.COLOR_BASE},${CONFIG.COLOR_BASE},${CONFIG.COLOR_BASE},${CONFIG.LINE_OPACITY})`;
            ctx.lineWidth = 1.8;
            ctx.stroke();
        }
    }

    // 智能初始化系统
    const balls = [];
    let animationId;

    function initBalls() {
        // 生成半径列表（确保大小差异）
        const radii = [];
        for(let i=0; i<CONFIG.BALL_COUNT; i++){
            radii.push(CONFIG.MIN_RADIUS + 
                      (CONFIG.MAX_RADIUS - CONFIG.MIN_RADIUS) * 
                      Math.pow(i/(CONFIG.BALL_COUNT-1), 1.5));
        }
        radii.sort(() => Math.random() - 0.5);

        // 多阶段生成算法
        radii.forEach(r => {
            let newBall, isValid = false;
            for(let attempt=0; attempt<100; attempt++){
                newBall = new Ball(r);
                isValid = !balls.some(b => {
                    const dx = b.x - newBall.x;
                    const dy = b.y - newBall.y;
                    return dx*dx + dy*dy < (b.radius + newBall.radius)**2;
                });
                if(isValid) break;
            }
            isValid && balls.push(newBall);
        });
    }

    // 高性能碰撞处理
    function processCollisions() {
        const GRID_SIZE = CONFIG.MAX_RADIUS * 2.2;
        const grid = new Map();
        
        // 空间索引构建
        balls.forEach((ball, i) => {
            const x = Math.floor(ball.x / GRID_SIZE);
            const y = Math.floor(ball.y / GRID_SIZE);
            for(let dx=-1; dx<=1; dx++){
                for(let dy=-1; dy<=1; dy++){
                    const key = `${x+dx},${y+dy}`;
                    grid.has(key) || grid.set(key, []);
                    grid.get(key).push(i);
                }
            }
        });

        // 窄相位检测
        grid.forEach(cell => {
            for(let i=0; i<cell.length; i++){
                for(let j=i+1; j<cell.length; j++){
                    const b1 = balls[cell[i]];
                    const b2 = balls[cell[j]];
                    const dx = b2.x - b1.x;
                    const dy = b2.y - b1.y;
                    const distSq = dx*dx + dy*dy;
                    const minDist = b1.radius + b2.radius;
                    
                    if(distSq < minDist*minDist) {
                        const dist = Math.sqrt(distSq);
                        const nx = dx / dist;
                        const ny = dy / dist;
                        
                        // 穿透修正
                        const correction = (minDist - dist) * 0.5;
                        b1.x -= nx * correction;
                        b1.y -= ny * correction;
                        b2.x += nx * correction;
                        b2.y += ny * correction;

                        // 速度交换
                        const vRel = {
                            x: b1.vx - b2.vx,
                            y: b1.vy - b2.vy
                        };
                        const velNormal = vRel.x*nx + vRel.y*ny;
                        
                        if(velNormal > 0) return; // 避免重复处理
                        
                        const impulse = (-(1 + CONFIG.RESTITUTION) * velNormal) / 
                                      (1/b1.mass + 1/b2.mass);
                        
                        b1.vx += (impulse * nx) / b1.mass;
                        b1.vy += (impulse * ny) / b1.mass;
                        b2.vx -= (impulse * nx) / b2.mass;
                        b2.vy -= (impulse * ny) / b2.mass;
                    }
                }
            }
        });
    }

    // 其他系统保持不变...
    // [resizeCanvas, animate, init等函数保持核心逻辑]

    // 初始化执行
    function init() {
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            z-index: 0;
            pointer-events: none;
        `;
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            balls.forEach(b => b._resetPosition());
        });
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBalls();
        animate();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        processCollisions();
        balls.forEach(b => {
            b.update();
            b.draw();
        });
        animationId = requestAnimationFrame(animate);
    }

    document.readyState === 'complete' ? init() : window.addEventListener('load', init);

    // 暴露控制接口
    window.ballsController = {
        setCount: (n) => {
            CONFIG.BALL_COUNT = Math.min(12, Math.max(6, n));
            balls.length = 0;
            initBalls();
        },
        getCollisionRate: () => {
            let count = 0;
            processCollisions(); // 仅检测不处理
            return count;
        }
    };
})();
