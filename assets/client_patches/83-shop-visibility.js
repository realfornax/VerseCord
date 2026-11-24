(() => {
    if (window.GLOBAL_ENV?.SHOP_ENABLED !== false) return;
    const style = document.createElement("style");
    style.textContent = 'a[href="/shop"],a[href^="/shop?"],a[href^="/shop/"]{display:none!important}';
    document.head.append(style);
    window.navigation?.addEventListener("navigate", (event) => {
        const destination = new URL(event.destination.url);
        if (event.cancelable && destination.origin === location.origin && /^\/shop(?:\/|$)/.test(destination.pathname)) event.preventDefault();
    });
})();
