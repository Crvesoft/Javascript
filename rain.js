const rainContainer = document.createElement('div');
rainContainer.id = 'rain-container';
document.body.appendChild(rainContainer);

// 动态注入样式
const style = document.createElement('style');
style.textContent = `
#rain-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
    perspective: 1000px;
}

/* 更细密的雨滴样式 */
.droplet {
    position: absolute;
    width: 1px;
    height: 20px;
    background: rgba(200, 220, 255, 0.6);
    border-radius: 80% 20% 60% 40%;
    transform: rotate(15deg);
    filter: blur(0.6px);
    animation: fall 1.2s linear forwards;
}

/* 多层涟漪系统 */
.ripple {
    position: absolute;
    border: 1px solid rgba(210, 230, 255, 0.3);
    border-radius: 50%;
    opacity: 0;
    filter: blur(1px);
    animation: 
        spread 1.6s ease-out forwards,
        fade 1.6s linear forwards;
}

.ripple::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    animation: sub-spread 1.6s ease-out forwards;
}

@keyframes fall {
    from {
        transform: translateY(-20vh) rotate(15deg);
        opacity: 0.3;
    }
    to {
        transform: translateY(120vh) rotate(15deg);
        opacity: 0.6;
    }
}

@keyframes spread {
    0% { transform: scale(0); }
    100% { transform: scale(calc(min(100vw, 100vh)/40)); }
}

@keyframes sub-spread {
    0% { transform: scale(0); opacity: 0.4; }
    100% { transform: scale(1.2); opacity: 0; }
}

@keyframes fade {
    0% { opacity: 0.6; }
    100% { opacity: 0; }
}
`;
document.head.appendChild(style);

class DrizzleEffect {
    constructor() {
        this.activeDrops = new Set();
        this.init();
    }

    init() {
        this.setupRain();
        this.adaptiveTimer = setInterval(() => this.adaptDensity(), 5000);
    }

    setupRain() {
        // 高频生成器（每50-150ms）
        this.rainInterval = setInterval(() => {
            if(this.activeDrops.size < 80) {
                this.createRainCluster();
            }
        }, 50 + Math.random() * 100);
    }

    createRainCluster() {
        // 每次生成3-5个雨滴组成雨簇
        const clusterSize = 3 + Math.floor(Math.random() * 3);
        for(let i = 0; i < clusterSize; i++) {
            setTimeout(() => this.createSingleDrop(), i * 20);
        }
    }

    createSingleDrop() {
        const droplet = document.createElement('div');
        droplet.className = 'droplet';
        
        // 随机水平分布（5%-95%）
        const xPos = 5 + Math.random() * 90;
        droplet.style.left = `${xPos}%`;

        // 创建双层涟漪
        const ripple = this.createRipple(xPos);
        
        droplet.addEventListener('animationend', () => {
            rainContainer.appendChild(ripple);
            this.removeElement(droplet);
        });

        rainContainer.appendChild(droplet);
        this.activeDrops.add(droplet);
    }

    createRipple(xPos) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = `${xPos}%`;
        ripple.style.top = `85vh`; // 稍高水位线
        
        ripple.addEventListener('animationend', () => {
            this.removeElement(ripple);
        });

        return ripple;
    }

    removeElement(el) {
        el.parentNode?.removeChild(el);
        this.activeDrops.delete(el);
    }

    adaptDensity() {
        // 根据性能自动调节雨量
        const frameRate = this.getFrameRate();
        if(frameRate < 50 && this.rainInterval > 50) {
            clearInterval(this.rainInterval);
            this.rainInterval = setInterval(() => {
                if(this.activeDrops.size < 60) this.createRainCluster();
            }, 80 + Math.random() * 120);
        }
    }

    getFrameRate() {
        // 简易帧率检测（实现略）
        return 60; // 示例返回值
    }
}

new DrizzleEffect();
