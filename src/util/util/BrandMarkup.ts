export const INSTANCE_ICON_PATH = "M2 5h4.8L12 16l5.2-11H22l-8 16h-4Z";
export const INSTANCE_SPARK_PATH = "M12 2l.9 2.4L15.3 5.3l-2.4.9L12 8.6l-.9-2.4-2.4-.9 2.4-.9Z";

export const BRAND_COLOR = "#5142CB";

export const APP_THEME_COLOR = "#121214";

export const escapeXml = (text: string) => text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const iconTileMarkup = (iconUrl: string | null) =>
    iconUrl
        ? `<img class="brand-icon" src="${escapeXml(iconUrl)}" alt="" />`
        : `<svg class="brand-icon" viewBox="0 0 48 48" aria-hidden="true"><rect width="48" height="48" rx="15" fill="${BRAND_COLOR}"/><g transform="translate(6 6) scale(1.5)" fill="#fff"><path d="${INSTANCE_ICON_PATH}"/><path fill="#A0F5E5" d="${INSTANCE_SPARK_PATH}"/></g></svg>`;

export const brandPageMarkup = (html: string, name: string, iconUrl: string | null) =>
    html.replaceAll("__INSTANCE_NAME__", escapeXml(name)).replaceAll("__INSTANCE_ICON__", iconTileMarkup(iconUrl));

const iconMarkup = (x: number, y: number, size: number, iconUri: string | null) =>
    iconUri
        ? `<image href="${escapeXml(iconUri)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`
        : `<g fill="#fff" transform="translate(${x} ${y}) scale(${size / 24})"><path d="${INSTANCE_ICON_PATH}"/><path d="${INSTANCE_SPARK_PATH}"/></g>`;

export const wordmarkMarkup = (name: string, box?: [number, number], iconUri: string | null = null) => {
    const width = Math.ceil(34 + [...name].length * 12.5);
    const [boxWidth, boxHeight] = box ?? [width, 24];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${boxWidth}" height="${boxHeight}" viewBox="0 0 ${width} 24" fill="none">${iconMarkup(0, 0, 24, iconUri)}<text x="32" y="19.5" fill="#fff" font-family="'gg sans','Noto Sans','Helvetica Neue',Helvetica,Arial,sans-serif" font-size="20" font-weight="800">${escapeXml(name)}</text></svg>`;
};

export const qrLogoSvg = (iconUri: string | null = null) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#000"/>${iconMarkup(23, 23, 54, iconUri)}</svg>`;

export const placeholderAvatarSvg = (size: number, background: string, foreground: string, iconUri: string | null = null) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="${background}"/>${
        iconUri
            ? `<image href="${escapeXml(iconUri)}" x="62" y="62" width="132" height="132" preserveAspectRatio="xMidYMid meet" opacity="0.6"/>`
            : `<g fill="${foreground}" transform="translate(62 62) scale(5.5)"><path d="${INSTANCE_ICON_PATH}"/><path d="${INSTANCE_SPARK_PATH}"/></g>`
    }</svg>`;

export const BRANDED_CLIENT_ASSETS: Record<string, { wordmark?: boolean; svg: (name: string, iconUri: string | null) => string }> = {
    "131c318dd45b7aa4.svg": { wordmark: true, svg: (name, iconUri) => wordmarkMarkup(name, undefined, iconUri) },
    "bbbc3d376d38e7bc.svg": { wordmark: true, svg: (name, iconUri) => wordmarkMarkup(name, [112, 36], iconUri) },
    "dd05fd1ea37e7747.png": { svg: (name, iconUri) => qrLogoSvg(iconUri) },
    "d11a9f2f62494f22.png": {
        svg: (name, iconUri) => placeholderAvatarSvg(132, "rgb(116 126 136 / 30%)", "rgb(255 255 255 / 30%)", iconUri),
    },
    "9d8606c1376ca484.png": {
        svg: (name, iconUri) => placeholderAvatarSvg(128, "rgb(170 170 178 / 80%)", "#fff", iconUri),
    },
    "2ca6b6f4a73913ed.png": {
        svg: (name, iconUri) => placeholderAvatarSvg(128, "rgb(111 111 116 / 80%)", "rgb(191 191 193 / 90%)", iconUri),
    },
    "53728a8572402a56.png": {
        svg: (name, iconUri) => placeholderAvatarSvg(396, "#0c0d0e", "#444545", iconUri),
    },
};
