// gray-balls-collision.js
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
            const maxX = window.innerWidth - radius * 2;
            const maxY = window.innerHeight - radius * 2;
            this.x = radius + Math.random() * maxX;
            this.y = radius + Math.random() * maxY;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // 边界碰撞检测
            if (this.x < this.radius) {
                this.x = this.radius;
                this.vx *= -0.9; // 增加能量损耗更真实
            } else if (this.x > canvas.width - this.radius) {
                this.x = canvas.width - this.radius;
                this.vx *= -0.9;
            }
            if (this.y < this.radius) {
                this.y = this.radius;
                this.vy *= -0.9;
            } else if (this.y > canvas.height - this.radius) {
                this.y = canvas.height - this.radius;
                this.vy *= -0.9;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#666666'; // 改为灰色
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // 全局变量
    const balls = [];
    let animationId;

    // 智能生成不重叠球体
    function createNonOverlappingBall(radius, existingBalls, maxAttempts = 100) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const newBall = new Ball(radius);
            const collision = existingBalls.some(ball => {
                const dx = ball.x - newBall.x;
                const dy = ball.y - newBall.y;
                return Math.sqrt(dx*dx + dy*dy) < ball.radius + newBall.radius;
            });
            if (!collision) return newBall;
        }
        console.warn(`无法生成半径 ${radius} 的球体`);
        return null;
    }

    // 初始化球
    function initBalls() {
        const minSide = Math.min(window.innerWidth, window.innerHeight);
        const sizes = [
            minSide / 3,       // 最大球
            minSide / 5,       // 最小球
            minSide * 0.25,    // 中间固定值1
            minSide * 0.3,     // 中间固定值2
            minSide * 0.2      // 中间固定值3
        ];
        
        // 打乱尺寸顺序
        sizes.sort(() => Math.random() - 0.5);

        sizes.forEach(radius => {
            const newBall = createNonOverlappingBall(radius, balls);
            if (newBall) balls.push(newBall);
        });

        // 确保生成5个球体
        while (balls.length < 5) {
            const minSide = Math.min(window.innerWidth, window.innerHeight);
            const radius = minSide * (0.2 + Math.random() * 0.13); // 1/5到约1/3之间
            const newBall = createNonOverlappingBall(radius, balls);
            if (newBall) balls.push(newBall);
        }
    }

    // 碰撞检测（优化版）
    function handleCollisions() {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const b1 = balls[i];
                const b2 = balls[j];
                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const distSq = dx*dx + dy*dy;
                const minDist = b1.radius + b2.radius;

                if (distSq < minDist * minDist) {
                    // 碰撞响应
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
                    
                    // 位置修正
                    const overlap = (minDist - Math.sqrt(distSq)) / 2;
                    b1.x -= overlap * cos;
                    b1.y -= overlap * sin;
                    b2.x += overlap * cos;
                    b2.y += overlap * sin;

                    // 速度交换（考虑质量差异）
                    const m1 = b1.radius * b1.radius; // 质量与面积成正比
                    const m2 = b2.radius * b2.radius;
                    
                    // 速度投影
                    const v1x = b1.vx * cos + b1.vy * sin;
                    const v1y = b1.vy * cos - b1.vx * sin;
                    const v2x = b2.vx * cos + b2.vy * sin;
                    const v2y = b2.vy * cos - b2.vx * sin;

                    // 碰撞后速度
                    const v1xFinal = ((m1 - m2) * v1x + 2 * m2 * v2x) / (m1 + m2);
                    const v2xFinal = ((m2 - m1) * v2x + 2 * m1 * v1x) / (m1 + m2);

                    // 更新速度
                    b1.vx = v1xFinal * cos - v1y * sin;
                    b1.vy = v1y * cos + v1xFinal * sin;
                    b2.vx = v2xFinal * cos - v2y * sin;
                    b2.vy = v2y * cos + v2xFinal * sin;
                }
            }
        }
    }

    // 其他保持不变...
    // 调整画布大小
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        balls.length = 0;
        initBalls();
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

    // 初始化函数
    function init() {
        // 设置画布样式
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '0';  // 修改层级
        canvas.style.pointerEvents = 'none';
        
        // 初始设置
        resizeCanvas();
        animate();
        
        // 窗口大小改变时重置
        window.addEventListener('resize', resizeCanvas);
    }

    // 启动动画
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }

    // 提供销毁方法
    window.destroyGrayBalls = function() {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resizeCanvas);
        if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    };
})();
