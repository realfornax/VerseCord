import { React } from "@webpack/common";

const VERSECORD_MARK = "M2 5h4.8L12 16l5.2-11H22l-8 16h-4Z";
const VERSECORD_SPARK = "M12 2l.9 2.4L15.3 5.3l-2.4.9L12 8.6l-.9-2.4-2.4-.9 2.4-.9Z";
const VERSECORD_SPINNER_CSS = `
@keyframes versecord-lift{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes versecord-spark{0%,100%{opacity:.45}50%{opacity:1}}
.versecord-spinner>svg{overflow:visible;animation:versecord-lift 1.2s ease-in-out infinite}
.versecord-spinner .spark{animation:versecord-spark 1.2s ease-in-out infinite}
@media(prefers-reduced-motion:reduce){.versecord-spinner>svg,.versecord-spinner .spark{animation:none}}`;

export const VerseCordPaths = ({ fill = "currentColor", className }: { fill?: string; className?: string }) => (
    <g className={className} fill={fill}>
        <path d={VERSECORD_MARK} />
        <path className="spark" d={VERSECORD_SPARK} />
    </g>
);

export function VerseCordSpinner({ className, onReady, setRef }: { className?: string; onReady?: () => void; setRef?: (element: HTMLElement | null) => void }) {
    React.useEffect(() => void onReady?.(), []);
    return (
        <div
            ref={setRef}
            className={`versecord-spinner ${className ?? ""}`}
            role="progressbar"
            aria-label="Loading"
            data-testid="app-spinner"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 200,
                height: 200,
                margin: "0 auto",
                color: "var(--text-strong,var(--header-primary,black))",
            }}
        >
            <style>{VERSECORD_SPINNER_CSS}</style>
            <svg width="80" height="80" viewBox="0 0 24 24" aria-hidden="true">
                <VerseCordPaths />
            </svg>
        </div>
    );
}
