// 初始化雨滴容器
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
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
}

.raindrop {
    position: absolute;
    background: rgba(160, 160, 160, 0.4);
    width: 1px;
    height: 25px;
    transform: translateY(-100%) rotate(15deg);
    animation: fall linear forwards;
    box-shadow: 0 0 5px rgba(255, 255, 255, 0.2);
}

@keyframes fall {
    to {
        transform: translateY(100vh) rotate(15deg);
        opacity: 0;
    }
}
`;
document.head.appendChild(style);

// 雨滴动画逻辑
class RainAnimation {
    constructor() {
        this.container = rainContainer;
        this.maxDrops = 150;
        this.dropCreationInterval = 30;
        this.animationTimer = null;
    }

    createDrop() {
        if (this.container.children.length >= this.maxDrops) return;

        const drop = document.createElement('div');
        drop.className = 'raindrop';

        const left = Math.random() * 100;
        const duration = 0.8 + Math.random() * 0.5;
        const delay = Math.random() * 0.5;
        const height = 20 + Math.random() * 15;

        Object.assign(drop.style, {
            left: `${left}%`,
            height: `${height}px`,
            animationDuration: `${duration}s`,
            animationDelay: `${delay}s`
        });

        drop.addEventListener('animationend', () => drop.remove());
        this.container.appendChild(drop);
    }

    start() {
        this.animationTimer = setInterval(
            () => this.createDrop(),
            this.dropCreationInterval
        );
    }

    stop() {
        clearInterval(this.animationTimer);
        this.container.innerHTML = '';
    }
}

// 自动启动
document.addEventListener('DOMContentLoaded', () => {
    const rain = new RainAnimation();
    rain.start();
    
    // 窗口尺寸变化时重置容器
    window.addEventListener('resize', () => {
        rain.container.innerHTML = '';
    });
});
