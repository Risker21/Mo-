"use strict";
(self.webpackChunkcreatorspc = self.webpackChunkcreatorspc || []).push([
  [272],
  {
    272: (t, e, r) => {
      r.r(e);
      var n = r(8760);
      function o(t, e) {
        for (var r = 0; r < e.length; r++) {
          var n = e[r];
          (n.enumerable = n.enumerable || !1),
            (n.configurable = !0),
            "value" in n && (n.writable = !0),
            Object.defineProperty(t, n.key, n);
        }
      }
      function i(t, e, r) {
        return (
          (i =
            "undefined" != typeof Reflect && Reflect.get
              ? Reflect.get
              : function (t, e, r) {
                  var n = (function (t, e) {
                    for (
                      ;
                      !Object.prototype.hasOwnProperty.call(t, e) &&
                      null !== (t = s(t));

                    );
                    return t;
                  })(t, e);
                  if (n) {
                    var o = Object.getOwnPropertyDescriptor(n, e);
                    return o.get ? o.get.call(r || t) : o.value;
                  }
                }),
          i(t, e, r || t)
        );
      }
      function s(t) {
        return (
          (s = Object.setPrototypeOf
            ? Object.getPrototypeOf
            : function (t) {
                return t.__proto__ || Object.getPrototypeOf(t);
              }),
          s(t)
        );
      }
      function l(t, e) {
        return (
          (l =
            Object.setPrototypeOf ||
            function (t, e) {
              return (t.__proto__ = e), t;
            }),
          l(t, e)
        );
      }
      function c(t) {
        var e = (function () {
          if ("undefined" == typeof Reflect || !Reflect.construct) return !1;
          if (Reflect.construct.sham) return !1;
          if ("function" == typeof Proxy) return !0;
          try {
            return (
              Boolean.prototype.valueOf.call(
                Reflect.construct(Boolean, [], function () {})
              ),
              !0
            );
          } catch (t) {
            return !1;
          }
        })();
        return function () {
          var r,
            n = s(t);
          if (e) {
            var o = s(this).constructor;
            r = Reflect.construct(n, arguments, o);
          } else r = n.apply(this, arguments);
          return (function (t, e) {
            return !e ||
              ("object" !=
                ((r = e) &&
                "undefined" != typeof Symbol &&
                r.constructor === Symbol
                  ? "symbol"
                  : typeof r) &&
                "function" != typeof e)
              ? (function (t) {
                  if (void 0 === t)
                    throw new ReferenceError(
                      "this hasn't been initialised - super() hasn't been called"
                    );
                  return t;
                })(t)
              : e;
            var r;
          })(this, r);
        };
      }
      window.plr.controllers.SiteScrollbar = (function (t) {
        !(function (t, e) {
          if ("function" != typeof e && null !== e)
            throw new TypeError(
              "Super expression must either be null or a function"
            );
          (t.prototype = Object.create(e && e.prototype, {
            constructor: {
              value: t,
              writable: !0,
              configurable: !0,
            },
          })),
            e && l(t, e);
        })(a, t);
        var e,
          r,
          n = c(a);
        function a() {
          return (
            (function (t, e) {
              if (!(t instanceof e))
                throw new TypeError("Cannot call a class as a function");
            })(this, a),
            n.apply(this, arguments)
          );
        }
        return (
          (e = a),
          (r = [
            {
              key: "init",
              value: function () {
                if (luge) {
                  if (luge.browser.some(["mobile", "safari", "tablet"])) return;
                  document.documentElement.classList.add("has-scrollbar"),
                    luge.emitter.emit("resize"),
                    i(s(a.prototype), "init", this).call(this);
                }
              },
            },
            {
              key: "bindEvents",
              value: function () {
                i(s(a.prototype), "bindEvents", this).call(this),
                  luge &&
                    (luge.emitter.on("resize", this.setScrollbar.bind(this)),
                    luge.emitter.on("scroll", this.setScrollbar.bind(this)),
                    luge.emitter.on(
                      "afterPageInit",
                      this.setScrollbar.bind(this)
                    )),
                  this.on(
                    this.refs.thumb,
                    "mousedown",
                    this.dragStart.bind(this)
                  ),
                  this.on(
                    this.refs.thumb,
                    "touchstart",
                    this.dragStart.bind(this)
                  ),
                  this.on(document, "mousemove", this.dragMove.bind(this)),
                  this.on(document, "touchmove", this.dragMove.bind(this)),
                  this.on(document, "mouseup", this.dragEnd.bind(this)),
                  this.on(document, "touchend", this.dragEnd.bind(this));
              },
            },
            {
              key: "resizeHandler",
              value: function () {
                this.setScrollbar();
              },
            },
            {
              key: "scrollHandler",
              value: function () {
                this.setScrollbar();
              },
            },
            {
              key: "setScrollbar",
              value: function () {
                var t =
                    (window.safeHeight / document.body.scrollHeight) *
                    window.safeHeight,
                  e = window.scrollProgress * (window.safeHeight - t);
                this.el.style.setProperty(
                  "--scrollbar-height",
                  "".concat(t, "px")
                ),
                  this.el.style.setProperty(
                    "--scrollbar-top",
                    "".concat(e, "px")
                  );
              },
            },
            {
              key: "dragStart",
              value: function (t) {
                t.preventDefault(),
                  (this.dragging = !0),
                  (this.dragStartY = t.clientY || t.touches[0].clientY),
                  (this.dragStartScroll = window.scrollProgress),
                  this.el.classList.add("is-dragging");
              },
            },
            {
              key: "dragMove",
              value: function (t) {
                if (this.dragging) {
                  t.preventDefault();
                  var e =
                      ((t.clientY || (t.touches && t.touches[0].clientY)) -
                        this.dragStartY) /
                      window.safeHeight,
                    r = (this.dragStartScroll + e) * window.maxScrollTop;
                  luge.smoothscroll.lenis
                    ? luge.smoothscroll.lenis.scrollTo(r)
                    : window.scrollTo(0, r);
                }
              },
            },
            {
              key: "dragEnd",
              value: function (t) {
                t.preventDefault(),
                  (this.dragging = !1),
                  this.el.classList.remove("is-dragging");
              },
            },
          ]) && o(e.prototype, r),
          a
        );
      })(n.c);
    },
  },
]);
