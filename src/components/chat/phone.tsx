import type { ReactNode } from "react";
import {
  BatteryFull,
  Car,
  CaretLeft,
  CellSignalFull,
  Checks,
  FilePdf,
  IdentificationCard,
  ListBullets,
  Microphone,
  Plus,
  ShieldCheck,
  Warning,
  WifiHigh,
} from "@phosphor-icons/react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/cn";
import type { ChatMessage, ChatState, ListSheet, PhotoVariant } from "./types";

/** WhatsApp-style inline formatting: *bold*, _italic_ and line breaks. */
export function rich(text: string): ReactNode[] {
  return text.split(/(\*[^*\n]+\*|_[^_\n]+_)/g).map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <strong key={i} className="font-semibold text-fg">
          {part.slice(1, -1)}
        </strong>
      );
    }
    if (part.startsWith("_") && part.endsWith("_") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function Time({ time, read }: { time: string; read?: boolean }) {
  return (
    <span className="ml-2 inline-flex translate-y-1 items-center gap-0.5 float-right font-mono text-[9.5px] leading-none opacity-60">
      {time}
      {read && <Checks className="size-3 text-violet" />}
    </span>
  );
}

function BotBubble({ children, time }: { children: ReactNode; time: string }) {
  return (
    <div className="max-w-[84%] self-start rounded-2xl rounded-tl-md bg-canvas-2 px-3 py-2 text-[12.5px] leading-snug whitespace-pre-line text-fg/90 shadow-[0_1px_1px_rgb(11_21_38/0.08)]">
      {children}
      <Time time={time} />
    </div>
  );
}

const PHOTO: Record<
  PhotoVariant,
  { bg: string; icon: ReactNode }
> = {
  card: {
    bg: "bg-[linear-gradient(135deg,#2c5b3f,#173225)]",
    icon: <Car className="size-7 text-mint/80" />,
  },
  license: {
    bg: "bg-[linear-gradient(135deg,#2a4766,#162637)]",
    icon: <IdentificationCard className="size-7 text-violet/80" />,
  },
  damage: {
    bg: "bg-[linear-gradient(135deg,#4a2f26,#21140f)]",
    icon: <Warning className="size-7 text-coral/80" />,
  },
  damage2: {
    bg: "bg-[linear-gradient(160deg,#3d3a2b,#191812)]",
    icon: <Car className="size-7 text-amber/80" />,
  },
};

function Message({ msg }: { msg: ChatMessage }) {
  switch (msg.kind) {
    case "out":
      return (
        <div className="max-w-[80%] self-end rounded-2xl rounded-tr-md bg-brand px-3 py-2 text-[12.5px] leading-snug font-medium whitespace-pre-line text-on-brand">
          {msg.text}
          <Time time={msg.time} read />
        </div>
      );
    case "in":
      return <BotBubble time={msg.time}>{rich(msg.text)}</BotBubble>;
    case "buttons":
      return (
        <div className="flex max-w-[84%] flex-col gap-1 self-start">
          <BotBubble time={msg.time}>{rich(msg.text)}</BotBubble>
          {msg.buttons.map((label, i) => (
            <div
              key={label}
              className={cn(
                "relative overflow-hidden rounded-xl bg-canvas-2 py-2 text-center shadow-[0_1px_1px_rgb(11_21_38/0.08)] text-[12px] font-semibold text-brand transition-colors duration-300",
                msg.picked === i && "bg-canvas-3",
              )}
            >
              {msg.picked === i && (
                <span className="absolute inset-0 m-auto size-6 animate-pulse-ring rounded-full bg-brand/40" />
              )}
              <span className="relative">{label}</span>
            </div>
          ))}
        </div>
      );
    case "list":
      return (
        <div className="max-w-[84%] self-start overflow-hidden rounded-2xl rounded-tl-md bg-canvas-2 text-[12.5px] leading-snug text-fg/90 shadow-[0_1px_1px_rgb(11_21_38/0.08)]">
          <div className="px-3 py-2 whitespace-pre-line">
            {rich(msg.text)}
            <Time time={msg.time} />
          </div>
          <div className="flex items-center justify-center gap-1.5 border-t border-fg/8 py-2 text-[12px] font-semibold text-brand">
            <ListBullets className="size-3.5" /> {msg.button}
          </div>
        </div>
      );
    case "photo":
      return (
        <div className="self-end rounded-2xl rounded-tr-md bg-brand p-1">
          <div
            className={cn(
              "relative grid h-24 w-36 place-items-center overflow-hidden rounded-xl",
              PHOTO[msg.variant].bg,
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.18),transparent_55%)]" />
            {PHOTO[msg.variant].icon}
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[9px] font-medium text-white/90 backdrop-blur">
              {msg.label}
            </span>
            <span className="absolute right-1.5 bottom-1.5 font-mono text-[9px] text-white/70">
              {msg.time}
            </span>
          </div>
        </div>
      );
    case "doc":
      return (
        <div className="w-[78%] self-start rounded-2xl rounded-tl-md bg-canvas-2 p-1.5 shadow-[0_1px_1px_rgb(11_21_38/0.08)]">
          <div className="flex items-center gap-2.5 rounded-xl bg-canvas-3 p-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-coral/90 text-canvas">
              <FilePdf className="size-4.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-fg">
                {msg.name}
              </p>
              <p className="font-mono text-[10px] text-mute">{msg.meta}</p>
            </div>
          </div>
          <div className="px-1 pt-1 text-right font-mono text-[9.5px] text-fg/50">
            {msg.time}
          </div>
        </div>
      );
    case "quote":
      return (
        <div className="w-[88%] self-start overflow-hidden rounded-2xl rounded-tl-md bg-canvas-2 text-[12px] shadow-[0_1px_1px_rgb(11_21_38/0.08)]">
          <div className="flex items-center gap-2 border-b border-fg/8 bg-brand/10 px-3 py-2">
            <ShieldCheck className="size-4 text-brand" />
            <span className="font-semibold text-fg">{msg.title}</span>
          </div>
          <ul className="divide-y divide-fg/6 px-3">
            {msg.rows.map((row, i) => (
              <li
                key={row.name}
                className="flex items-center justify-between py-1.5 animate-pop"
                style={{ animationDelay: `${120 + i * 110}ms` }}
              >
                <span className="text-fg/80">{row.name}</span>
                <span className="font-mono font-semibold text-brand">
                  {row.price}
                </span>
              </li>
            ))}
          </ul>
          <p className="px-3 pt-1 pb-2 text-[10px] leading-snug text-mute">
            {msg.note}
            <span className="float-right font-mono text-fg/50">
              {msg.time}
            </span>
          </p>
        </div>
      );
    case "event":
      return (
        <div
          className={cn(
            "mx-auto my-1 rounded-full px-3 py-1 text-center text-[11px] font-medium",
            msg.tone === "coral"
              ? "bg-coral/15 text-coral"
              : msg.tone === "mute"
                ? "bg-fg/6 text-mute"
                : "bg-brand/12 text-brand",
          )}
        >
          {msg.text}
        </div>
      );
  }
}

function Sheet({ sheet }: { sheet: ListSheet }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-fg/35 animate-[pop_0.35s_var(--ease-out-expo)_both]">
      <div className="rounded-t-3xl bg-canvas-3 px-4 pt-2 pb-5">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-fg/20" />
        <p className="mb-2 text-center text-[12px] font-semibold text-fg/80">
          {sheet.title}
        </p>
        <ul className="space-y-1">
          {sheet.rows.map((row, i) => (
            <li
              key={row.title}
              className={cn(
                "flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-300",
                sheet.picked === i ? "bg-brand/15" : "bg-transparent",
              )}
            >
              <span className="text-[15px]">{row.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-medium text-fg">
                  {row.title}
                </span>
                <span className="block text-[10.5px] text-mute">{row.desc}</span>
              </span>
              <span
                className={cn(
                  "size-4 rounded-full border-2 transition-all duration-300",
                  sheet.picked === i
                    ? "border-brand bg-brand shadow-[0_0_0_3px_var(--color-canvas-3)_inset]"
                    : "border-fg/25",
                )}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Typing() {
  return (
    <div className="flex items-center gap-1 self-start rounded-2xl rounded-tl-md bg-canvas-2 px-3.5 py-3 shadow-[0_1px_1px_rgb(11_21_38/0.08)]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-blink rounded-full bg-fg/70"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}

export function Phone({
  state,
  className,
  name = "Tu Productora",
  statusOverride,
}: {
  state: ChatState;
  className?: string;
  name?: string;
  statusOverride?: string;
}) {
  const status =
    statusOverride ?? (state.typing ? "escribiendo…" : "en línea");
  return (
    <div
      className={cn(
        "relative h-[620px] w-[300px] rounded-[46px] bg-[#0f1412] p-[9px] shadow-[0_0_0_1px_rgb(255_255_255/0.09),0_0_0_9px_#050606,0_0_0_10px_rgb(255_255_255/0.07),0_50px_100px_-20px_rgb(11_21_38/0.2),0_30px_60px_-30px_rgb(31_79_224/0.25)]",
        className,
      )}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[38px] bg-canvas-2">
        {/* status bar */}
        <div className="relative z-10 flex items-center justify-between px-7 pt-3 pb-1 text-[11px] font-semibold text-fg">
          <span className="font-mono tabular-nums">{state.clock}</span>
          <span className="absolute left-1/2 top-2 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
          <span className="flex items-center gap-1">
            <CellSignalFull className="size-3" />
            <WifiHigh className="size-3" />
            <BatteryFull className="size-3.5" />
          </span>
        </div>
        {/* header */}
        <div className="relative z-10 flex items-center gap-2 border-b border-fg/6 bg-canvas-3/90 px-2 py-2 backdrop-blur">
          <CaretLeft className="size-5 text-brand" />
          <div className="grid size-8 place-items-center rounded-full bg-brand">
            <LogoMark className="h-4.5 w-auto text-canvas" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="flex items-center gap-1 truncate text-[13px] font-semibold text-fg">
              {name}
              <span className="grid size-3 place-items-center rounded-full bg-mint text-[7px] text-canvas">
                ✓
              </span>
            </p>
            <p
              className={cn(
                "text-[10.5px] transition-colors",
                state.typing ? "text-brand" : "text-mute",
              )}
            >
              {status}
            </p>
          </div>
        </div>
        {/* thread */}
        <div className="chat-wallpaper relative flex min-h-0 flex-1 flex-col justify-end gap-1.5 overflow-hidden px-2.5 pt-2 pb-2">
          {state.messages.map((msg) => (
            <div
              key={msg.id}
              className="flex shrink-0 flex-col animate-pop"
            >
              <Message msg={msg} />
            </div>
          ))}
          {state.typing && (
            <div className="flex shrink-0 flex-col animate-pop">
              <Typing />
            </div>
          )}
          {state.sheet && <Sheet sheet={state.sheet} />}
        </div>
        {/* composer */}
        <div className="flex items-center gap-2 bg-canvas-3 px-2.5 pt-2 pb-5">
          <Plus className="size-5 text-fg/60" />
          <div className="flex-1 rounded-full bg-canvas-2 px-3 py-1.5 text-[12px] text-mute">
            Mensaje
          </div>
          <div className="grid size-8 place-items-center rounded-full bg-brand text-on-brand">
            <Microphone className="size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
