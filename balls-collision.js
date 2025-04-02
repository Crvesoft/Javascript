// rain-effect.js
(function() {
    // 创建画布
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    
    // 雨滴类
    class RainDrop {
        constructor() {
            this.reset();
            this.vy = Math.random() * 8 + 4; // 垂直速度
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = -20;
            this.length = Math.random() * 20 + 10;
            this.thickness = Math.random() * 1 + 0.5;
            this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.2;
        }

        update() {
            this.y += this.vy;
            this.x += Math.tan(this.angle) * 2; // 斜向移动
            
            // 超出屏幕后重置
            if (this.y > canvas.height + 50) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.sin(this.angle) * this.length,
                this.y + Math.cos(this.angle) * this.length
            );
            ctx.strokeStyle = `rgba(150, 200, 255, ${this.thickness/2})`;
            ctx.lineWidth = this.thickness;
            ctx.stroke();
        }
    }

    // 全局配置
    const config = {
        dropCount: 150,     // 雨滴数量
        wind: 0.1,          // 风力系数
        maxSpeed: 12       // 最大下落速度
    };

    // 初始化
    let raindrops = [];
    let animationId;
    
    function initRain() {
        // 创建雨滴实例
        for (let i = 0; i < config.dropCount; i++) {
            raindrops.push(new RainDrop());
        }
        
        // 设置画布样式
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';
        
        // 窗口大小处理
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();
    }

    // 动画循环
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 更新物理效果
        raindrops.forEach(drop => {
            drop.vy += config.wind * (Math.random() - 0.5);
            drop.vy = Math.min(Math.max(drop.vy, 4), config.maxSpeed);
            drop.angle += (Math.random() - 0.5) * 0.02;
            
            drop.update();
            drop.draw();
        });

        animationId = requestAnimationFrame(animate);
    }

    // 启动动画
    if (document.readyState === 'complete') {
        initRain();
        animate();
    } else {
        window.addEventListener('load', () => {
            initRain();
            animate();
        });
    }

    // 提供控制接口
    window.rainEffect = {
        setIntensity(count) {  // 设置雨量强度
            config.dropCount = count;
            raindrops = raindrops.slice(0, count);
            while(raindrops.length < count) {
                raindrops.push(new RainDrop());
            }
        },
        setWind(value) {      // 设置风力
            config.wind = value;
        },
        destroy() {          // 销毁效果
            cancelAnimationFrame(animationId);
            canvas.parentNode?.removeChild(canvas);
        }
    };
})();
