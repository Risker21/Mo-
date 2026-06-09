/**
 * Main JavaScript for Personal Portfolio
 * Features: Loading animation, navigation, theme toggle, scroll animations, video player, particles
 */

// ========================================
// 工具函数
// ========================================
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const debounce = (func, wait) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};

// ========================================
// 加载动画
// ========================================
const initLoader = () => {
  const loader = document.querySelector('.loader');
  const container = document.querySelector('.container');

  if (!loader || !container) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      container.style.opacity = '1';
    }, 800);
  });
};

// ========================================
// 导航栏功能
// ========================================
const initNavigation = () => {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!navbar) return;

  // 滚动时改变导航栏样式
  const handleScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', throttle(handleScroll, 100));

  // 移动端菜单切换
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // 点击导航链接后关闭菜单
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  // 平滑滚动到锚点
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const offsetTop = target.offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });
};

// ========================================
// 主题切换
// ========================================
const initThemeToggle = () => {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const icon = themeToggle.querySelector('i');
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // 初始化主题
  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    if (icon) {
      icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    }
    localStorage.setItem('theme', theme);
  };

  if (savedTheme) {
    setTheme(savedTheme);
  } else if (!prefersDark) {
    setTheme('light');
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  });
};

// ========================================
// 返回顶部按钮
// ========================================
const initBackToTop = () => {
  const backToTop = document.getElementById('backToTop');
  if (!backToTop) return;

  const toggleVisibility = () => {
    if (window.scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  };

  window.addEventListener('scroll', throttle(toggleVisibility, 100));

  backToTop.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
};

// ========================================
// 滚动动画 (AOS-like)
// ========================================
const initScrollAnimations = () => {
  const animatedElements = document.querySelectorAll('[data-aos]');
  if (animatedElements.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.aosDelay || 0;
        setTimeout(() => {
          entry.target.classList.add('aos-animate');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animatedElements.forEach(el => observer.observe(el));
};

// ========================================
// 技能条动画
// ========================================
const initSkillBars = () => {
  const skillBars = document.querySelectorAll('.skill-bar');
  if (skillBars.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const level = entry.target.dataset.level;
        if (level) {
          entry.target.style.setProperty('--level', `${level}%`);
          entry.target.classList.add('animate');
        }
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  skillBars.forEach(bar => observer.observe(bar));
};

// ========================================
// 视频播放器
// ========================================
const initVideoPlayer = () => {
  const videoPoster = document.getElementById('videoPoster');
  const videoPlayer = document.getElementById('videoPlayer');
  const closeVideo = document.getElementById('closeVideo');
  const video = document.getElementById('localVideo');

  if (!videoPoster || !videoPlayer || !video) return;

  const openVideo = () => {
    videoPoster.style.display = 'none';
    videoPlayer.style.display = 'block';
    video.play().catch(() => {});
  };

  const closeVideoPlayer = () => {
    video.pause();
    video.currentTime = 0;
    videoPlayer.style.display = 'none';
    videoPoster.style.display = 'block';
  };

  videoPoster.addEventListener('click', openVideo);

  if (closeVideo) {
    closeVideo.addEventListener('click', closeVideoPlayer);
  }

  // ESC键关闭视频
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoPlayer.style.display === 'block') {
      closeVideoPlayer();
    }
  });
};

// ========================================
// 粒子效果
// ========================================
const initParticles = () => {
  const particlesContainer = document.getElementById('particles-js');
  if (!particlesContainer || typeof particlesJS !== 'function') {
    return;
  }

  const isMobile = window.matchMedia('(pointer: coarse)').matches;

  particlesJS('particles-js', {
    particles: {
      number: {
        value: isMobile ? 40 : 80,
        density: { enable: true, value_area: 800 }
      },
      color: { value: '#2dd4bf' },
      shape: { type: 'circle' },
      opacity: {
        value: 0.5,
        random: true,
        anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
      },
      size: {
        value: 3,
        random: true,
        anim: { enable: true, speed: 2, size_min: 0.1, sync: false }
      },
      line_linked: {
        enable: true,
        distance: 150,
        color: '#2dd4bf',
        opacity: 0.2,
        width: 1
      },
      move: {
        enable: true,
        speed: 1.5,
        direction: 'none',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false
      }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: {
          enable: !isMobile,
          mode: 'repulse'
        },
        onclick: {
          enable: true,
          mode: 'push'
        },
        resize: true
      },
      modes: {
        repulse: { distance: 100, duration: 0.4 },
        push: { particles_nb: 4 }
      }
    },
    retina_detect: true
  });
};

// ========================================
// 打字机效果
// ========================================
const initTypewriter = () => {
  const tagline = document.querySelector('.tagline');
  if (!tagline) return;

  const text = tagline.textContent;
  tagline.textContent = '';
  tagline.style.opacity = '1';

  let i = 0;
  const type = () => {
    if (i < text.length) {
      tagline.textContent += text.charAt(i);
      i++;
      setTimeout(type, 50);
    }
  };

  setTimeout(type, 1000);
};

// ========================================
// 鼠标跟随效果
// ========================================
const initMouseFollow = () => {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cards = document.querySelectorAll('.about-card, .skill-card, .project-card, .timeline-content');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
};

// ========================================
// 当前导航高亮
// ========================================
const initActiveNav = () => {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

  if (sections.length === 0 || navLinks.length === 0) return;

  const highlightNav = () => {
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', throttle(highlightNav, 100));
};

// ========================================
// 课程标签随机颜色
// ========================================
const initCourseTags = () => {
  const courseTags = document.querySelectorAll('.course-tag');
  const colors = [
    'rgba(45, 212, 191, 0.2)',
    'rgba(251, 191, 36, 0.2)',
    'rgba(167, 139, 250, 0.2)',
    'rgba(244, 114, 182, 0.2)',
    'rgba(96, 165, 250, 0.2)'
  ];

  courseTags.forEach((tag, index) => {
    const color = colors[index % colors.length];
    tag.addEventListener('mouseenter', () => {
      tag.style.background = color;
    });
    tag.addEventListener('mouseleave', () => {
      tag.style.background = '';
    });
  });
};

// ========================================
// 视差滚动效果
// ========================================
const initParallax = () => {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const shapes = document.querySelectorAll('.floating-shape');
  if (shapes.length === 0) return;

  const handleParallax = () => {
    const scrolled = window.scrollY;

    shapes.forEach((shape, index) => {
      const speed = 0.5 + (index * 0.1);
      const yPos = -(scrolled * speed);
      shape.style.transform = `translateY(${yPos}px)`;
    });
  };

  window.addEventListener('scroll', throttle(handleParallax, 16));
};

// ========================================
// 性能优化：图片懒加载
// ========================================
const initLazyLoading = () => {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if (lazyImages.length === 0) return;

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
  }
};

// ========================================
// 初始化所有功能
// ========================================
const init = () => {
  initLoader();
  initNavigation();
  initThemeToggle();
  initBackToTop();
  initScrollAnimations();
  initSkillBars();
  initVideoPlayer();
  initParticles();
  initTypewriter();
  initMouseFollow();
  initActiveNav();
  initCourseTags();
  initParallax();
  initLazyLoading();
};

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 页面可见性变化时暂停/恢复粒子动画
document.addEventListener('visibilitychange', () => {
  if (window.pJSDom && window.pJSDom.length > 0) {
    const pJS = window.pJSDom[0].pJS;
    if (document.hidden) {
      pJS.particles.move.enable = false;
    } else {
      pJS.particles.move.enable = true;
      pJS.fn.particlesRefresh();
    }
  }
});
