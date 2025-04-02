// 紧急修复版本：fixed-balls-collision.js
(function() {
    // 精确物理参数调整
    const CONFIG = {
        BALL_COUNT: 12,
        MIN_RADIUS: 20,
        MAX_RADIUS: 45,
        INIT_SPEED: 14,
        BOUNCE_DAMPING: 0.96,
        RESTITUTION: 0.98,  // 提高恢复系数
        POSITION_CORRECTION: 1.2, // 增加位置修正强度
        LINE_OPACITY: 0.7
    };

    // 画布初始化保持不变...
    
    class Ball {
        // 其他代码保持不变...

        update() {
            // 增加速度下限防止停滞
            const SPEED_EPSILON = 0.15;
            if(Math.abs(this.vx) < SPEED_EPSILON) this.vx = SPEED_EPSILON * (Math.random() > 0.5 ? 1 : -1);
            if(Math.abs(this.vy) < SPEED_EPSILON) this.vy = SPEED_EPSILON * (Math.random() > 0.5 ? 1 : -1);
            
            // 原有更新逻辑...
        }
    }

    // 修复关键碰撞检测逻辑
    function processCollisions() {
        const GRID_SIZE = Math.max(CONFIG.MAX_RADIUS * 2.5, 100);
        // 重建网格索引逻辑...

        // 窄相位检测修复
        grid.forEach(cell => {
            for(let i=0; i<cell.length; i++){
                const b1 = balls[cell[i]];
                for(let j=i+1; j<cell.length; j++){
                    const b2 = balls[cell[j]];
                    const dx = b2.x - b1.x;
                    const dy = b2.y - b1.y;
                    const distSq = dx*dx + dy*dy;
                    const minDist = b1.radius + b2.radius;
                    
                    // 精确碰撞检测
                    if(distSq < minDist*minDist && distSq > 0.01) {
                        const dist = Math.sqrt(distSq);
                        const nx = dx / dist;
                        const ny = dy / dist;
                        
                        // 强化位置修正（新增30%安全余量）
                        const overlap = (minDist - dist) * CONFIG.POSITION_CORRECTION;
                        b1.x -= nx * overlap * (b2.radius/(b1.radius+b2.radius));
                        b1.y -= ny * overlap * (b2.radius/(b1.radius+b2.radius));
                        b2.x += nx * overlap * (b1.radius/(b1.radius+b2.radius));
                        b2.y += ny * overlap * (b1.radius/(b1.radius+b2.radius));

                        // 精确冲量计算（动量守恒）
                        const vRel = {
                            x: b1.vx - b2.vx,
                            y: b1.vy - b2.vy
                        };
                        const velAlongNormal = vRel.x*nx + vRel.y*ny;
                        
                        // 仅处理接近的碰撞
                        if(velAlongNormal > 0) continue;

                        const e = CONFIG.RESTITUTION;
                        const j = -(1 + e) * velAlongNormal / 
                                 (1/b1.mass + 1/b2.mass);
                        
                        // 应用冲量（质量加权）
                        b1.vx += (j * nx) / b1.mass;
                        b1.vy += (j * ny) / b1.mass;
                        b2.vx -= (j * nx) / b2.mass;
                        b2.vy -= (j * ny) / b2.mass;
                    }
                }
            }
        });
    }

    // 其他优化保持不变...
})();
