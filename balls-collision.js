// balls-collision.js
(function() {
    // 初始化画布
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // 球类定义
    class Ball {
        constructor(radius) {
            this.radius = radius;
            this.x = Math.random() * (window.innerWidth - 2 * radius) + radius;
            this.y = Math.random() * (window.innerHeight - 2 * radius) + radius;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 0.5) * 8;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // 边界碰撞检测
            if (this.x < this.radius) {
                this.x = this.radius;
                this.vx *= -1;
            } else if (this.x > canvas.width - this.radius) {
                this.x = canvas.width - this.radius;
                this.vx *= -1;
            }
            if (this.y < this.radius) {
                this.y = this.radius;
                this.vy *= -1;
            } else if (this.y > canvas.height - this.radius) {
                this.y = canvas.height - this.radius;
                this.vy *= -1;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // 全局变量
    const balls = [];
    let animationId;

    // 初始化球
    function initBalls() {
        while (balls.length < 5) {
            const radius = Math.random() * 20 + 10;
            const newBall = new Ball(radius);
            
            // 检查初始位置是否重叠
            let valid = true;
            for (const ball of balls) {
                const dx = ball.x - newBall.x;
                const dy = ball.y - newBall.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < ball.radius + newBall.radius) {
                    valid = false;
                    break;
                }
            }
            if (valid) balls.push(newBall);
        }
    }

    // 碰撞检测
    function handleCollisions() {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                const b1 = balls[i];
                const b2 = balls[j];
                const dx = b2.x - b1.x;
                const dy = b2.y - b1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < b1.radius + b2.radius) {
                    // 碰撞响应
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
                    
                    // 位置修正
                    const overlap = b1.radius + b2.radius - dist;
                    b1.x -= overlap * cos * 0.5;
                    b1.y -= overlap * sin * 0.5;
                    b2.x += overlap * cos * 0.5;
                    b2.y += overlap * sin * 0.5;

                    // 速度交换
                    const m1 = b1.radius;
                    const m2 = b2.radius;
                    const vx1 = b1.vx * cos + b1.vy * sin;
                    const vy1 = b1.vy * cos - b1.vx * sin;
                    const vx2 = b2.vx * cos + b2.vy * sin;
                    const vy2 = b2.vy * cos - b2.vx * sin;
                    
                    const v1x = ((m1 - m2) * vx1 + 2 * m2 * vx2) / (m1 + m2);
                    const v2x = ((m2 - m1) * vx2 + 2 * m1 * vx1) / (m1 + m2);
                    
                    b1.vx = v1x * cos - vy1 * sin;
                    b1.vy = vy1 * cos + v1x * sin;
                    b2.vx = v2x * cos - vy2 * sin;
                    b2.vy = vy2 * cos + v2x * sin;
                }
            }
        }
    }

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
        canvas.style.zIndex = '-1';
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
    window.destroyBallsAnimation = function() {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resizeCanvas);
        if (canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
    };
})();
