// 加载完成处理函数
function handlePageLoad() {
  gsap.to("#loader", 0.5, { y: "-100%" });
  gsap.to("#loader", 0.5, { opacity: 0 });
  gsap.to("#loader", 0, { display: "none", delay: 0.5 });
  gsap.to("#header", 0, { display: "block", delay: 0.5 });
  gsap.to("#navigation-content", 0, { display: "none" });
  gsap.to("#navigation-content", 0, { display: "flex", delay: 0.5 });

  // 清除超时定时器，防止重复执行
  if (window.loadTimeout) {
    clearTimeout(window.loadTimeout);
    window.loadTimeout = null;
  }
}

// 设置3秒超时机制 - 防止网络问题导致加载动画卡住
window.loadTimeout = setTimeout(function () {
  // 如果3秒后页面还没有加载完成，强制隐藏加载动画
  if (document.readyState !== "complete") {
    handlePageLoad();
  }
}, 3000);

// 页面加载完成事件
$(document).ready(handlePageLoad);

// 如果页面已经加载完成，立即执行
if (document.readyState === "complete") {
  handlePageLoad();
}
$(function () {
  $(".color-panel").on("click", function (e) {
    e.preventDefault();
    $(".color-changer").toggleClass("color-changer-active");
  });
  $(".colors a").on("click", function (e) {
    e.preventDefault();
    var attr = $(this).attr("title");
    $("head").append('<link rel="stylesheet" href="css/' + attr + '.css">');
  });
});
$(function () {
  $(".menubar").on("click", function () {
    gsap.to("#navigation-content", 0.6, { y: 0 });
  });
  $(".navigation-close").on("click", function () {
    gsap.to("#navigation-content", 0.6, { y: "-100%" });
  });
});

$(function () {
  var TxtRotate = function (el, toRotate, period) {
    this.toRotate = toRotate;
    this.el = el;
    this.loopNum = 0;
    this.period = parseInt(period, 10) || 2000;
    this.txt = "";
    this.currentColor = "#3dd60fff"; // Initialize with default color
    this.tick();
    this.isDeleting = false;
  };

  TxtRotate.prototype.tick = function () {
    var i = this.loopNum % this.toRotate.length;
    var fullTxt = this.toRotate[i];

    if (this.isDeleting) {
      this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
      this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    // Generate new random color at start of each loop
    if (this.txt.length === 0) {
      this.currentColor =
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0");
    }

    this.el.innerHTML =
      '<span class="wrap" style="color:' +
      this.currentColor +
      '">' +
      this.txt +
      "</span>";

    var that = this;
    var delta = 200 - Math.random() * 100;

    if (this.isDeleting) {
      delta /= 2;
    }

    if (!this.isDeleting && this.txt === fullTxt) {
      delta = this.period;
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === "") {
      this.isDeleting = false;
      this.loopNum++;
      delta = 100;
    }

    setTimeout(function () {
      that.tick();
    }, delta);
  };

  // 立即初始化打字机效果
  var elements = document.getElementsByClassName("txt-rotate");
  for (var i = 0; i < elements.length; i++) {
    var toRotate = elements[i].getAttribute("data-rotate");
    var period = elements[i].getAttribute("data-period");
    if (toRotate) {
      new TxtRotate(elements[i], JSON.parse(toRotate), period);
    }
  }
  // INJECT CSS
  var css = document.createElement("style");
  css.type = "text/css";
  css.innerHTML = ".txt-rotate > .wrap { border-right: 0em solid #666 ; }";
  document.body.appendChild(css);
});
$(function () {
  $("#about-link").on("click", function () {
    gsap.to("#navigation-content", 0, { display: "none", delay: 0.7 });
    gsap.to("#navigation-content", 0, { y: "-100%", delay: 0.7 });
    gsap.to("#header", 0, { display: "none" });
    gsap.to("#blog", 0, { display: "none" });
    gsap.to("#portfolio", 0, { display: "none" });
    gsap.to("#breaker", 0, { display: "block" });
    gsap.to("#breaker-two", 0, { display: "block", delay: 0.1 });
    gsap.to("#contact", 0, { display: "none" });
    gsap.to("#breaker", 0, { display: "none", delay: 2 });
    gsap.to("#breaker-two", 0, { display: "none", delay: 2 });
    gsap.to("#about", 0, { display: "block", delay: 0.7 });
    gsap.to("#navigation-content", 0, { display: "flex", delay: 2 });
  });
  $("#contact-link").on("click", function () {
    gsap.to("#navigation-content", 0, { display: "none", delay: 0.7 });
    gsap.to("#navigation-content", 0, { y: "-100%", delay: 0.7 });
    gsap.to("#header", 0, { display: "none" });
    gsap.to("#about", 0, { display: "none" });
    gsap.to("#blog", 0, { display: "none" });
    gsap.to("#portfolio", 0, { display: "none" });
    gsap.to("#breaker", 0, { display: "block" });
    gsap.to("#breaker-two", 0, { display: "block", delay: 0.1 });
    gsap.to("#breaker", 0, { display: "none", delay: 2 });
    gsap.to("#breaker-two", 0, { display: "none", delay: 2 });
    gsap.to("#contact", 0, { display: "block", delay: 0.7 });
    gsap.to("#navigation-content", 0, { display: "flex", delay: 2 });
  });
  $("#portfolio-link").on("click", function () {
    gsap.to("#navigation-content", 0, { display: "none", delay: 0.7 });
    gsap.to("#navigation-content", 0, { y: "-100%", delay: 0.7 });
    gsap.to("#header", 0, { display: "none" });
    gsap.to("#about", 0, { display: "none" });
    gsap.to("#contact", 0, { display: "none" });
    gsap.to("#blog", 0, { display: "none" });
    gsap.to("#breaker", 0, { display: "block" });
    gsap.to("#breaker-two", 0, { display: "block", delay: 0.1 });
    gsap.to("#breaker", 0, { display: "none", delay: 2 });
    gsap.to("#breaker-two", 0, { display: "none", delay: 2 });
    gsap.to("#portfolio", 0, { display: "block", delay: 0.7 });
    gsap.to("#navigation-content", 0, { display: "flex", delay: 2 });
  });
  $("#blog-link").on("click", function () {
    gsap.to("#navigation-content", 0, { display: "none", delay: 0.7 });
    gsap.to("#navigation-content", 0, { y: "-100%", delay: 0.7 });
    gsap.to("#header", 0, { display: "none" });
    gsap.to("#about", 0, { display: "none" });
    gsap.to("#portfolio", 0, { display: "none" });
    gsap.to("#contact", 0, { display: "none" });
    gsap.to("#breaker", 0, { display: "block" });
    gsap.to("#breaker-two", 0, { display: "block", delay: 0.1 });
    gsap.to("#breaker", 0, { display: "none", delay: 2 });
    gsap.to("#breaker-two", 0, { display: "none", delay: 2 });
    gsap.to("#blog", 0, { display: "block", delay: 0.7 });
    gsap.to("#navigation-content", 0, { display: "flex", delay: 2 });
  });
  $("#home-link").on("click", function () {
    gsap.to("#navigation-content", 0, { display: "none", delay: 0.7 });
    gsap.to("#navigation-content", 0, { y: "-100%", delay: 0.7 });
    gsap.to("#header", 0, { display: "none" });
    gsap.to("#about", 0, { display: "none" });
    gsap.to("#portfolio", 0, { display: "none" });
    gsap.to("#contact", 0, { display: "none" });
    gsap.to("#blog", 0, { display: "none" });
    gsap.to("#breaker", 0, { display: "block" });
    gsap.to("#breaker-two", 0, { display: "block", delay: 0.1 });
    gsap.to("#breaker", 0, { display: "none", delay: 2 });
    gsap.to("#breaker-two", 0, { display: "none", delay: 2 });
    gsap.to("#header", 0, { display: "block", delay: 0.7 });
    gsap.to("#navigation-content", 0, { display: "flex", delay: 2 });
  });
});
$(function () {
  var body = document.querySelector("body");
  var $cursor = $(".cursor");
  function cursormover(e) {
    gsap.to($cursor, {
      x: e.clientX,
      y: e.clientY,
      stagger: 0.002,
    });
  }
  function cursorhover(e) {
    gsap.to($cursor, {
      scale: 1.4,
      opacity: 1,
    });
  }
  function cursor(e) {
    gsap.to($cursor, {
      scale: 1,
      opacity: 0.6,
    });
  }
  $(window).on("mousemove", cursormover);
  $(".menubar").hover(cursorhover, cursor);
  $('a:not([target="_blank"])').hover(cursorhover, cursor);
  $(".navigation-close").hover(cursorhover, cursor);
});


