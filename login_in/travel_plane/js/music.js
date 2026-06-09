// 背景音乐控制
document.addEventListener('DOMContentLoaded', function() {
    // 创建音乐元素
    const bgMusic = new Audio('../link/music/爱你.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.5; // 设置音量
    
    // 确保音频文件存在
    bgMusic.addEventListener('error', function() {
        console.error('音频加载失败:', bgMusic.error);
        alert('音乐文件加载失败，请检查路径');
    });
    
    // 添加静音状态检测
    let isMuted = false;
    
    // 创建音乐控制按钮
    const musicBtn = document.createElement('div');
    musicBtn.id = 'music-control';
    musicBtn.style.position = 'fixed';
    musicBtn.style.right = '20px';
    musicBtn.style.top = '50%';
    musicBtn.style.transform = 'translateY(-50%)';
    musicBtn.style.width = '50px';
    musicBtn.style.height = '50px';
    musicBtn.style.cursor = 'pointer';
    musicBtn.style.zIndex = '9999';
    
    // 设置初始图标
    const musicIcon = document.createElement('img');
    musicIcon.src = './images/music.png';
    musicIcon.style.width = '100%';
    musicIcon.style.height = '100%';
    musicBtn.appendChild(musicIcon);
    
    // 添加到页面
    document.body.appendChild(musicBtn);
    
    // 点击事件
    musicBtn.addEventListener('click', function() {
        if (bgMusic.paused) {
            bgMusic.play();
            musicIcon.src = './images/music.png';
        } else {
            bgMusic.pause();
            musicIcon.src = './images/mute.png';
        }
    });
    
    // 自动播放处理 - 改为页面加载后尝试播放
    function tryPlayMusic() {
        bgMusic.play().catch(e => {
            console.log('自动播放被阻止:', e);
            // 显示播放按钮提示
            musicBtn.style.display = 'block';
            musicBtn.style.animation = 'pulse 2s infinite';
        });
    }
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translateY(-50%) scale(1); }
            50% { transform: translateY(-50%) scale(1.2); }
            100% { transform: translateY(-50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // 页面加载后尝试播放
    window.addEventListener('load', tryPlayMusic);
    
    // 用户首次交互时再次尝试
    document.addEventListener('click', function firstClick() {
        tryPlayMusic();
        document.removeEventListener('click', firstClick);
    });
});
