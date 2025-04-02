// gray-transparent-balls.js
(function() {
    // 初始化画布
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // 球类定义
    class Ball {
        constructor(radius) {
            this.radius = radius;
            // 动态计算安全范围
            const safeX = window.innerWidth - radius * 2;
            const safeY = window.innerHeight - radius * 2;
            this.x = radius + Math.random() * Math.max(0, safeX);
            this.y = radius + Math.random() * Math.max(0, safeY);
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = (Math.random() - 0.5) * 6;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // 智能边界碰撞
            const bounceDamping = 0.92; // 碰撞阻尼系数
            if (this.x < this.radius) {
                this.x = this.radius + (this.radius - this.x) * 0.1;
                this.vx *= -bounceDamping;
            } 
            if (this.x > canvas.width - this.radius) {
                this.x = canvas.width - this.radius - (this.x - (canvas.width - this.radius)) * 0.1;
                this.vx *= -bounceDamping;
            }
            if (this.y < this.radius) {
                this.y = this.radius + (this.radius - this.y) * 0.1;
                this.vy *= -bounceDamping;
            } 
            if (this.y > canvas.height - this.radius) {
                this.y = canvas.height - this.radius - (this.y - (canvas.height - this.radius)) * 0.1;
                this.vy *= -bounceDamping;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(102, 102, 102, 0.7)'; // 70%透明度灰色
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // 全局变量
    const balls = [];
    let animationId;

    // 智能生成球体尺寸
    function generateBallSizes() {
        const minSide = Math.min(window.innerWidth, window.innerHeight);
        const sizes = [];
        
        // 固定最大和最小值
        sizes.push(minSide / 6);  // 最大球
        sizes.push(minSide / 9);  // 最小球
        
        // 生成三个中间尺寸
        const range = minSide/6 - minSide/9;
        for(let i=0; i<3; i++){
            sizes.push(minSide/9 + range * Math.random());
        }
        
        return sizes.sort(() => Math.random() - 0.5); // 随机排序
    }

    // 碰撞安全生成
    function createSafeBall(radius, existingBalls) {
        const maxAttempts = 200;
        for(let attempt=0; attempt<maxAttempts; attempt++){
            const newBall = new Ball(radius);
            const collision = existingBalls.some(b => {
                const dx = b.x - newBall.x;
                const dy = b.y - newBall.y;
                return Math.sqrt(dx*dx + dy*dy) < b.radius + newBall.radius;
            });
            if(!collision) return newBall;
        }
        return null;
    }

    // 初始化球
    function initBalls() {
        balls.length = 0;
        const sizes = generateBallSizes();
        
        sizes.forEach(radius => {
            const ball = createSafeBall(radius, balls);
            if(ball) balls.push(ball);
        });

        // 确保5个球体
        while(balls.length < 5){
            const minSide = Math.min(window.innerWidth, window.innerHeight);
            const radius = minSide/9 + (minSide/6 - minSide/9) * Math.random();
            const ball = createSafeBall(radius, balls);
            if(ball) balls.push(ball);
        }
    }

    // 优化碰撞检测
    function handleCollisions() {
        for(let i=0; i<balls.length; i++){
            for(let j=i+1; j<balls.length; j++){
                const b1 = balls[i];
                const b2 = balls[j];
                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const minDist = b1.radius + b2.radius;

                if(dist < minDist){
                    // 修正重叠
                    const correction = (minDist - dist)/2;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    b1.x -= nx * correction;
                    b1.y -= ny * correction;
                    b2.x += nx * correction;
                    b2.y += ny * correction;

                    // 速度交换
                    const m1 = b1.radius**2; // 质量与面积成正比
                    const m2 = b2.radius**2;
                    const vx = b1.vx - b2.vx;
                    const vy = b1.vy - b2.vy;
                    const dot = vx*nx + vy*ny;
                    
                    if(dot < 0) continue; // 避免重复计算
                    
                    const impulse = (2 * dot) / (m1 + m2);
                    b1.vx -= impulse * m2 * nx;
                    b1.vy -= impulse * m2 * ny;
                    b2.vx += impulse * m1 * nx;
                    b2.vy += impulse * m1 * ny;
                }
            }
        }
    }

    // 响应式画布
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initBalls(); // 尺寸变化时重新生成球体
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
        // 画布层级设置
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            z-index: 0;
            pointer-events: none;
        `;
        
        // 事件监听
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', resizeCanvas);
        
        resizeCanvas();
        animate();
    }

    // 启动
    document.readyState === 'complete' ? init() : window.addEventListener('load', init);

    // 控制接口
    window.ballsController = {
        setBallCount(count) {
            while(balls.length > count) balls.pop();
            while(balls.length < count) {
                const minSide = Math.min(window.innerWidth, window.innerHeight);
                const radius = minSide/9 + (minSide/6 - minSide/9)*Math.random();
                balls.push(createSafeBall(radius, balls));
            }
        },
        destroy() {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('orientationchange', resizeCanvas);
            canvas.remove();
        }
    };
})();
