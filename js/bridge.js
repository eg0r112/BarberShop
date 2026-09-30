/* Единый мост для Telegram WebApp и MAX WebApp. Без зависимостей от приложения. */
window.Bridge = (function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  const mx = window.WebApp;

  function platform() {
    if (tg && tg.initData) return "telegram";
    if (mx && mx.initData) return "max";
    return null; // обычный браузер (проверка в DEV_MODE)
  }

  const p = platform();
  const native = p === "telegram" ? tg : p === "max" ? mx : null;

  function safe(fn) {
    try { return fn(); } catch (_) { return undefined; }
  }

  function init() {
    if (!native) return;
    safe(() => native.ready());
    safe(() => native.expand && native.expand());
    if (p === "telegram") {
      safe(() => tg.setHeaderColor && tg.setHeaderColor("#3d2416"));
      safe(() => tg.setBackgroundColor && tg.setBackgroundColor("#f6f0e8"));
      safe(() => tg.setBottomBarColor && tg.setBottomBarColor("#ffffff"));
      safe(() => tg.disableVerticalSwipes && tg.disableVerticalSwipes());
    }
  }

  function user() {
    const u = native && native.initDataUnsafe && native.initDataUnsafe.user;
    if (!u) return null;
    return {
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(" "),
      first: u.first_name || "",
    };
  }

  // ---- нативная кнопка «назад»
  let backHandler = null;
  const backBtn = native && native.BackButton;
  const hasNativeBack = !!(backBtn && typeof backBtn.onClick === "function");
  if (hasNativeBack) {
    safe(() => backBtn.onClick(() => backHandler && backHandler()));
  }
  function setBack(handler) {
    backHandler = handler || null;
    if (!hasNativeBack) return;
    safe(() => (handler ? backBtn.show() : backBtn.hide()));
  }

  function confirmClose(on) {
    if (!native) return;
    safe(() => (on ? native.enableClosingConfirmation() : native.disableClosingConfirmation()));
  }

  function haptic(kind) {
    const h = native && native.HapticFeedback;
    if (!h) return;
    safe(() => {
      if (kind === "success" || kind === "error" || kind === "warning") h.notificationOccurred(kind);
      else if (kind === "select") h.selectionChanged();
      else h.impactOccurred(kind || "light");
    });
  }

  function openLink(url) {
    if (native && native.openLink && /^https?:/i.test(url)) return safe(() => native.openLink(url));
    window.open(url, "_blank");
  }

  function close() { safe(() => native && native.close()); }

  return {
    platform: p,
    init,
    user,
    initData: native ? native.initData || "" : "",
    hasNativeBack,
    setBack,
    confirmClose,
    haptic,
    openLink,
    close,
  };
})();
