// smooth-balls-collision.js
(function() {
    // 配置参数（可根据需要调整）
    const CONFIG = {
        BALL_COUNT: 12,             // 球体数量
        MIN_RADIUS: 20,             // 最小半径(像素)
        MAX_RADIUS: 45,             // 最大半径(像素)
        INIT_SPEED: 14,             // 初始速度基数
        BOUNCE_DAMPING: 0.96,       // 边界碰撞阻尼
        RESTITUTION: 0.98,          // 碰撞恢复系数
        AIR_RESISTANCE: 0.0001,     // 空气阻力系数
        LINE_OPACITY: 0.7,          // 线条透明度
        COLOR: 'rgba(90,90,90,0.7)' // 球体颜色
    };

    // 初始化画布
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // 球体物理类
    class Ball {
        constructor(radius) {
            this.radius = radius;
            this.mass = Math.PI * radius ** 2; // 按面积计算质量
            this._resetPosition();
            this._initVelocity();
        }

        // 安全位置初始化
        _resetPosition() {
            const margin = this.radius * 2;
            this.x = margin + Math.random() * (canvas.width - margin * 2);
            this.y = margin + Math.random() * (canvas.height - margin * 2);
        }

        // 速度初始化
        _initVelocity() {
            const angle = Math.random() * Math.PI * 2;
            const speed = CONFIG.INIT_SPEED * (0.8 + Math.random() * 0.4);
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }

        update() {
            // 应用空气阻力
            this.vx *= (1 - CONFIG.AIR_RESISTANCE);
            this.vy *= (1 - CONFIG.AIR_RESISTANCE);

            // 更新位置
            this.x += this.vx;
            this.y += this.vy;

            // 边界碰撞处理
            this._handleBoundary();
        }

        // 边界碰撞处理
        _handleBoundary() {
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
            ctx.strokeStyle = CONFIG.COLOR;
            ctx.lineWidth = 1.8;
            ctx.stroke();
        }
    }

    // 全局系统
    const balls = [];
    let animationId;

    // 初始化球体（智能防重叠）
    function initBalls() {
        const radii = [];
        for(let i=0; i<CONFIG.BALL_COUNT; i++){
            radii.push(CONFIG.MIN_RADIUS + 
                      (CONFIG.MAX_RADIUS - CONFIG.MIN_RADIUS) * 
                      Math.pow(i/(CONFIG.BALL_COUNT-1), 1.5));
        }
        radii.sort(() => Math.random() - 0.5);

        radii.forEach(r => {
            let newBall, isValid = false;
            for(let attempt=0; attempt<100; attempt++){
                newBall = new Ball(r);
                isValid = !balls.some(b => {
                    const dx = b.x - newBall.x;
                    const dy = b.y - newBall.y;
                    return (dx*dx + dy*dy) < (b.radius + newBall.radius)**2;
                });
                if(isValid) break;
            }
            isValid && balls.push(newBall);
        });
    }

    // 高性能碰撞检测
    function processCollisions() {
        const GRID_SIZE = Math.max(CONFIG.MAX_RADIUS * 2.5, 100);
        const grid = new Map();

        // 构建空间索引
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

        // 处理碰撞
        grid.forEach(cell => {
            for(let i=0; i<cell.length; i++){
                for(let j=i+1; j<cell.length; j++){
                    const b1 = balls[cell[i]];
                    const b2 = balls[cell[j]];
                    const dx = b2.x - b1.x;
                    const dy = b2.y - b1.y;
                    const distSq = dx*dx + dy*dy;
                    const minDist = b1.radius + b2.radius;

                    if(distSq < minDist*minDist && distSq > 1) {
                        const dist = Math.sqrt(distSq);
                        const nx = dx / dist;
                        const ny = dy / dist;

                        // 强制分离
                        const overlap = (minDist - dist) * 1.2;
                        b1.x -= nx * overlap * (b2.radius/(b1.radius + b2.radius));
                        b1.y -= ny * overlap * (b2.radius/(b1.radius + b2.radius));
                        b2.x += nx * overlap * (b1.radius/(b1.radius + b2.radius));
                        b2.y += ny * overlap * (b1.radius/(b1.radius + b2.radius));

                        // 动量交换
                        const vRel = {
                            x: b1.vx - b2.vx,
                            y: b1.vy - b2.vy
                        };
                        const velAlongNormal = vRel.x*nx + vRel.y*ny;

                        if(velAlongNormal > 0) continue;

                        const j = -(1 + CONFIG.RESTITUTION) * velAlongNormal /
                                 (1/b1.mass + 1/b2.mass);

                        b1.vx += (j * nx) / b1.mass;
                        b1.vy += (j * ny) / b1.mass;
                        b2.vx -= (j * nx) / b2.mass;
                        b2.vy -= (j * ny) / b2.mass;
                    }
                }
            }
        });
    }

    // 响应式布局
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            z-index: 0;
            pointer-events: none;
        `;
        balls.forEach(ball => ball._resetPosition());
    }

    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        processCollisions();
        balls.forEach(ball => {
            ball.update();
            ball.draw();
        });
        animationId = requestAnimationFrame(animate);
    }

    // 初始化系统
    function init() {
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', resizeCanvas);
        resizeCanvas();
        initBalls();
        animate();
    }

    // 启动动画
    document.readyState === 'complete' ? init() : window.addEventListener('load', init);

    // 控制接口
    window.ballsController = {
        setCount: (n) => {
            CONFIG.BALL_COUNT = Math.min(15, Math.max(6, n));
            balls.length = 0;
            initBalls();
        },
        restart: () => {
            balls.forEach(b => {
                b._resetPosition();
                b._initVelocity();
            });
        },
        destroy: () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('orientationchange', resizeCanvas);
            canvas.remove();
        }
    };
})();
