"use client";

/*
 * The hill.
 *
 * A machined block on a bench, whoever holds the crown standing on top of it
 * with both arms up, and everybody else in this hour crowded around the base.
 * Real perspective, not axonometry: there is one object here and the argument
 * is that everyone wants to be on it, so the projection that makes the centre
 * of the frame the most important place in it is the right one.
 *
 * Four things are true on screen and all four are true off it:
 *
 *   THE LIGHT IS THE CLOCK. The key light swings once around the block per
 *   hour, so the shadow sweeps the bench like a sundial and the frame tells
 *   you how far into the hour you are before you have read a number. This
 *   works before anything is deployed, because the hour does not need a
 *   contract to be real.
 *
 *   THE RING IS THE HOUR. The band on the bench is the sixty minutes, :00 at
 *   the top, clockwise. Every reign inside this hour is an arc of it, and the
 *   longest arc is drawn in amber because the longest arc is the one that
 *   wins. That is the payout rule rendered as a picture rather than described
 *   beside one.
 *
 *   THE CROWD IS THE STANDINGS. The figure on top is whoever holds the crown;
 *   each solid figure at the base is an address that has actually banked time
 *   this hour, in rank order. The remaining places are outlines, because an
 *   empty place is somewhere nobody is standing.
 *
 *   AMBER MEANS WORN, and there is exactly one amber object: the crown. The
 *   podium carries no colour of its own. Before launch the crown is a dashed
 *   outline above an empty throne, and there is no amber in this canvas at all.
 *
 * Everything is drawn. No textures, no raster assets, no WebGL.
 */

import { useEffect, useMemo, useRef } from "react";
import {
  EPOCH_SECONDS,
  epochAt,
  epochStart,
  slicesFor,
  standingsFor,
  type CrownChange,
} from "@/lib/crown";

// ---- colour -------------------------------------------------------------

type RGB = [number, number, number];

/**
 * Parse a hex colour. Hex only, and it throws rather than returning something
 * the canvas will quietly ignore.
 *
 * Passing `mix()` an `rgb()` string on a sister project produced
 * "rgb(NaN, NaN, NaN)", which canvas discards while keeping the previous
 * fillStyle — a whole face came out in the wrong colour and looked like a
 * design choice instead of a bug. Failing loudly here costs one line.
 */
function hex(value: string, fallback: string): RGB {
  const text = (value || fallback).trim();
  const m = /^#?([0-9a-f]{6})$/i.exec(text);
  if (!m) {
    const f = /^#?([0-9a-f]{6})$/i.exec(fallback.trim());
    if (!f) throw new Error(`hill: unparseable colour ${JSON.stringify(text)}`);
    return hex(fallback, fallback);
  }
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const WHITE: RGB = [255, 255, 255];

function mix(a: RGB, b: RGB, t: number): RGB {
  const k = Math.min(1, Math.max(0, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

function css(c: RGB, alpha = 1): string {
  return alpha >= 1
    ? `rgb(${c[0]}, ${c[1]}, ${c[2]})`
    : `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

interface Palette {
  field: RGB;
  fieldLit: RGB;
  fieldDeep: RGB;
  top: RGB;
  topLit: RGB;
  left: RGB;
  right: RGB;
  edge: RGB;
  ink: RGB;
  inkSoft: RGB;
  inkMute: RGB;
  crown: RGB;
  crownLit: RGB;
}

function readPalette(el: HTMLElement): Palette {
  const s = getComputedStyle(el);
  const v = (name: string, fallback: string) =>
    hex(s.getPropertyValue(name), fallback);
  return {
    field: v("--field", "#eef0f2"),
    fieldLit: v("--field-lit", "#f9fafb"),
    fieldDeep: v("--field-deep", "#e2e5e9"),
    top: v("--tile-top", "#d9dde2"),
    topLit: v("--tile-top-lit", "#f4f6f8"),
    left: v("--tile-left", "#a8b0b9"),
    right: v("--tile-right", "#7f8891"),
    edge: v("--tile-edge", "#5c646d"),
    ink: v("--ink", "#101317"),
    inkSoft: v("--ink-soft", "#454c55"),
    inkMute: v("--ink-mute", "#5d646d"),
    crown: v("--crown", "#9a5a06"),
    crownLit: v("--crown-lit", "#e39a2a"),
  };
}

// ---- geometry -----------------------------------------------------------

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Pt {
  x: number;
  y: number;
  /** Distance from the camera. Bigger is farther. */
  d: number;
}

interface Camera {
  /** Pitch, radians. How far the camera looks down at the bench. */
  el: number;
  /** Yaw, radians. Nudged a few degrees by the pointer and nothing more. */
  az: number;
  /** Camera distance and focal length, in world units. */
  dist: number;
  focal: number;
  cx: number;
  cy: number;
  scale: number;
}

/**
 * Pinhole projection. World is right-handed with +y up and +z away from the
 * camera; the bench is the y = 0 plane.
 */
function project(p: Vec3, c: Camera): Pt {
  const ca = Math.cos(c.az);
  const sa = Math.sin(c.az);
  const x1 = p.x * ca - p.z * sa;
  const z1 = p.x * sa + p.z * ca;

  const ce = Math.cos(c.el);
  const se = Math.sin(c.el);
  const y2 = p.y * ce + z1 * se;
  const z2 = -p.y * se + z1 * ce;

  const zc = z2 + c.dist;
  const k = (c.focal / Math.max(0.2, zc)) * c.scale;
  return { x: c.cx + x1 * k, y: c.cy - y2 * k, d: zc };
}

/*
 * Proportions.
 *
 * The podium was a slab for four passes and it was wrong the whole time. A
 * 0.4-tall plate is something you put an object ON; the thing this game is
 * about is a block people climb. Raised to 0.62 it reads as a podium, and the
 * figure on top stops looking like an ornament placed on a tray.
 *
 * Not a true cube, though — matching the reference exactly would mean a height
 * of 1.52, which buries the hour ring behind it. 0.62 is the tallest the block
 * gets before it starts eating its own clock.
 *
 * The half-width is 0.76 because the tile is turned 35°, and a square turned
 * 35° reaches √2 further across the frame than it does square-on: the number
 * that fitted comfortably inside the dial before the turn covered it after,
 * hid the :00 mark and left the hour as a thin halo behind the subject.
 *
 * The ring came in from 1.9 at the same time. Wide, it made a grey donut that
 * out-weighed the object at its centre; the hour is the frame around the
 * fight, not the subject of the picture.
 */
const TILE_W = 0.76; // half-width
const TILE_H = 0.62;
// Wide enough to read as a milled edge rather than a drawn line.
const CHAMFER = 0.058;
const RING_IN = 1.52;
const RING_OUT = 1.74;
const TICK_OUT = 1.84;

/** How tall the people are, in world units. */
const KING_H = 0.85;
const BYSTANDER_H = 0.44;

/*
 * The tile is turned on the bench, and this is the single change that did the
 * most for it.
 *
 * Square to the camera it showed one flat face and read as an elevation
 * drawing — a picture of a block rather than a block. Turned, two faces catch
 * different amounts of light and the object acquires a near vertical edge,
 * which is what the eye actually uses to judge depth.
 *
 * 35°, not 45°: at 45° the two faces are identical and the silhouette becomes
 * a symmetrical diamond, which is a logo. An off angle gives one dominant face
 * and one narrow one, which is how anything ends up sitting on a bench.
 *
 * The hour ring is deliberately NOT turned with it. The ring is a dial and has
 * to stay square to the reader, so :00 is at the top and :15 is on the right.
 */
const TILE_YAW = 0.62;

function square(half: number, y: number, yaw = TILE_YAW): Vec3[] {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const corners: [number, number][] = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];
  return corners.map(([x, z]) => ({ x: x * c - z * s, y, z: x * s + z * c }));
}

/** Tile space → world. Used by anything drawn on the tile's own surface. */
function onTile(x: number, z: number, y: number): Vec3 {
  const c = Math.cos(TILE_YAW);
  const s = Math.sin(TILE_YAW);
  return { x: x * c - z * s, y, z: x * s + z * c };
}

/** Face normal from three points, normalised. */
function normalOf(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const uz = b.z - a.z;
  const vx = c.x - a.x;
  const vy = c.y - a.y;
  const vz = c.z - a.z;
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Convex hull in the bench plane, for the cast shadow. Monotone chain. */
function hullXZ(points: Vec3[]): Vec3[] {
  const pts = [...points].sort((a, b) => (a.x - b.x) || (a.z - b.z));
  const cross = (o: Vec3, a: Vec3, b: Vec3) =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower: Vec3[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: Vec3[] = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function pathOf(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

// ---- the component ------------------------------------------------------

export interface HillProps {
  /** Crown history, ascending. Empty before launch, which is the honest state. */
  changes: readonly CrownChange[];
  /** True once the crown module is deployed and these arcs came off the chain. */
  live: boolean;
  className?: string;
  /** Set on the worked example so the frame can be told apart from the real one. */
  preview?: boolean;
}

export function Hill({ changes, live, className, preview = false }: HillProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The pointer nudges the camera by a few degrees. Enough that the object
  // reads as an object and not a picture of one; not enough to be a toy.
  const aim = useRef({ x: 0, y: 0, ax: 0, ay: 0 });

  // Latest props, read from inside the animation frame without restarting it.
  // Written in an effect rather than in the body: React 19 lints a ref
  // mutation during render, and the frame that runs before this commits is
  // one sixtieth of a second drawn from the previous props, which nothing on
  // screen can tell apart.
  const state = useRef({ changes, live });
  useEffect(() => {
    state.current = { changes, live };
  }, [changes, live]);

  // The instant the crown last moved, so the tile can react to it once.
  const lastChangeAt = useMemo(
    () => (changes.length > 0 ? changes[changes.length - 1].at : null),
    [changes],
  );
  const struckRef = useRef<{ at: number; seen: number | null }>({ at: 0, seen: null });
  useEffect(() => {
    if (lastChangeAt !== null && struckRef.current.seen !== lastChangeAt) {
      struckRef.current = { at: performance.now(), seen: lastChangeAt };
    }
  }, [lastChangeAt]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const palette = readPalette(wrap);
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;

    /*
     * Measure from the element, never from innerWidth.
     *
     * With the preview pane hidden, innerWidth reads 0 and ResizeObserver
     * stops delivering entirely — its callbacks are tied to rendering steps,
     * like rAF. A canvas sized from either of those stays at the 300x150
     * default and everything drawn into it is wrong. getBoundingClientRect
     * still answers, and the fallbacks below keep the scene sane if it does
     * not.
     */
    const measure = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(320, Math.round(rect.width || wrap.offsetWidth || 960));
      const h = Math.max(260, Math.round(rect.height || wrap.offsetHeight || 560));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      if (w === width && h === height) return;
      width = w;
      height = h;
      /*
       * Only the backing store is set here. The element's own size is left to
       * CSS — w-full inside a wrapper — and that is not a preference.
       *
       * Writing canvas.style.width in pixels pins the element to whatever the
       * last redraw measured, and the redraw runs on rAF, which the browser
       * stops delivering whenever the page is not being painted. Come back to
       * a backgrounded tab at a narrower width and the canvas is still as wide
       * as the old viewport: 378px of horizontal scroll on a phone, from an
       * element that is nominally w-full. Sizing only the bitmap means the
       * element can never be wider than its container, and a stale bitmap is
       * merely scaled for one frame until the next one lands.
       */
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(wrap);

    const onPointer = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      aim.current.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      aim.current.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onLeave = () => {
      aim.current.x = 0;
      aim.current.y = 0;
    };
    wrap.addEventListener("pointermove", onPointer);
    wrap.addEventListener("pointerleave", onLeave);

    let frame = 0;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      measure();

      const now = Date.now() / 1000;
      const epoch = epochAt(now);
      const start = epochStart(epoch);
      const into = now - start;
      const progress = Math.min(1, Math.max(0, into / EPOCH_SECONDS));

      // Ease the pointer nudge so the object never snaps.
      const target = reduced ? { x: 0, y: 0 } : aim.current;
      aim.current.ax += (target.x - aim.current.ax) * 0.06;
      aim.current.ay += (target.y - aim.current.ay) * 0.06;

      const cam: Camera = {
        /*
         * 33°, up from 26°. The low camera foreshortened the far half of the
         * dial so hard that the :00 mark projected to the same height as the
         * tile's far corner and vanished behind it — the one label that has
         * to be readable for the ring to be a clock at all. Opening the
         * ellipse costs a little of the tile's sides and buys the hour back.
         */
        el: 0.58 + aim.current.ay * 0.05,
        az: aim.current.ax * 0.11,
        dist: 9.2,
        focal: 8.4,
        cx: width / 2,
        // Above centre, not on it: the tile stands up out of the bench, so
        // its own height uses the space above the origin and the near edge of
        // the ring needs room below for the readout that sits on it.
        /*
         * Below centre. The scene grew upward when the podium became a block
         * and somebody climbed onto it — the tallest thing in frame is now
         * the crown, about 1.9 units off the bench, against a ring that
         * reaches 2.2 sideways. Keeping the origin on the midline pushed the
         * crown into the readouts.
         */
        cy: height * 0.55,
        scale: Math.max(46, Math.min(width * 0.2, height * 0.3)),
      };

      /*
       * The key light makes one turn per hour, and it is placed OPPOSITE the
       * minute hand rather than on it. That is not a detail: a shadow falls
       * away from its light, so putting the light across the bench makes the
       * cast shadow lie along the hand and the two become one instrument.
       * With the light on the same side they pointed opposite ways and the
       * frame read as two clocks disagreeing.
       *
       * Elevation is fixed and high so the shadow stays short and the tile
       * never falls into a tone where it stops being legible — a light that
       * actually set would take the object with it.
       */
      const lightAngle = (progress + 0.5) * Math.PI * 2;
      // 35°, and it was 47° first. High light gave a shadow shorter than the
      // chamfer — technically cast, invisible on screen, and the tile went
      // back to floating. Low enough to throw, high enough not to rake.
      const lightEl = 0.62;
      const light: Vec3 = {
        x: Math.sin(lightAngle) * Math.cos(lightEl),
        y: Math.sin(lightEl),
        z: Math.cos(lightAngle) * Math.cos(lightEl),
      };

      // One reaction per crown change: the tile takes the weight and settles.
      const sinceStrike = performance.now() - struckRef.current.at;
      const striking = struckRef.current.seen !== null && sinceStrike < 1400 && !reduced;
      const strikeT = striking ? sinceStrike / 1400 : 1;
      const settle = striking
        ? Math.exp(-strikeT * 5.5) * Math.cos(strikeT * 16) * 0.055
        : 0;

      const lift = settle;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // ---- the bench ---------------------------------------------------
      drawBench(ctx, cam, palette);

      // ---- the hour ring -----------------------------------------------
      const slices = slicesFor(state.current.changes, now);
      const standings = standingsFor(slices, epoch);
      const rank = new Map(standings.map((s, i) => [s.holder, i]));
      drawRing(ctx, cam, palette, {
        progress,
        slices: slices.filter((s) => s.epoch === epoch),
        rank,
        start,
        live: state.current.live,
      });

      /* ---- the podium and everybody on it ------------------------------
       *
       * The crowd is the standings. Whoever holds the crown stands on top;
       * every other address that has banked time this hour is a figure at the
       * base, in rank order, so the picture and the table below it cannot
       * disagree about who is in this fight. The remaining places are drawn
       * as outlines — an empty spot is a spot nobody is standing in, which is
       * exactly what the game looks like before it starts.
       *
       * Far figures go down before the podium and near ones after it, so the
       * back of the crowd is properly hidden behind the hill. The king is
       * always last: nothing in this scene is in front of him, which is the
       * whole point of being up there.
       */
      const kingHolder =
        state.current.changes.length > 0
          ? state.current.changes[state.current.changes.length - 1].holder
          : null;
      const contenders = standings.filter((s) => s.holder !== kingHolder).length;
      const podiumDepth = project({ x: 0, y: 0, z: 0 }, cam).d;

      const crowd = CROWD.map((slot, i) => {
        const pos = onRing(slot.angle, slot.radius);
        const { base, px } = standing(pos.x, pos.z, 0, BYSTANDER_H, cam);
        return { base, px, solid: i < contenders, depth: project(pos, cam).d };
      });

      for (const f of crowd) {
        if (f.depth <= podiumDepth) continue;
        drawBystander(ctx, palette, f.base.x, f.base.y, f.px, f.solid);
      }

      drawTile(ctx, cam, palette, { light, lift });

      for (const f of crowd) {
        if (f.depth > podiumDepth) continue;
        drawBystander(ctx, palette, f.base.x, f.base.y, f.px, f.solid);
      }

      const worn = kingHolder !== null;
      const throne = standing(0, 0, TILE_H + lift, KING_H, cam);
      drawKing(ctx, palette, throne.base.x, throne.base.y, throne.px, worn);

      drawDial(ctx, cam, palette);

      // ---- the strike ripple ---------------------------------------------
      if (striking) drawRipple(ctx, cam, palette, strikeT);

      if (preview) drawPreviewMark(ctx, palette, width, height);

      ctx.restore();
    };

    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      wrap.removeEventListener("pointermove", onPointer);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [preview]);

  return (
    <div
      ref={wrapRef}
      className={className}
      role="img"
      aria-label={
        live
          ? "The hill: a block on a bench ringed by the current hour, the crown holder standing on top and the other contenders around the base."
          : "The hill: a block on a bench ringed by the current hour. Nobody is on it — the crown and the crowd are drawn as empty outlines."
      }
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

// ---- drawing ------------------------------------------------------------

/**
 * The bench: a hairline construction grid in perspective, fading out well
 * before the frame edge so the scene has no border to bump into.
 */
function drawBench(ctx: CanvasRenderingContext2D, cam: Camera, p: Palette) {
  const span = 3.6;
  const step = 0.6;
  ctx.lineWidth = 1;

  for (let i = -span; i <= span + 0.001; i += step) {
    for (const axis of [0, 1]) {
      ctx.beginPath();
      const steps = 26;
      for (let s = 0; s <= steps; s += 1) {
        const t = -span + (s / steps) * span * 2;
        const world = axis === 0 ? { x: i, y: 0, z: t } : { x: t, y: 0, z: i };
        const q = project(world, cam);
        if (s === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      }
      // Grid lines nearer the tile carry more weight, the way a drawing
      // sharpens toward its subject.
      const near = 1 - Math.min(1, Math.abs(i) / span);
      ctx.strokeStyle = css(p.ink, 0.03 + near * 0.09);
      ctx.stroke();
    }
  }

  // The pool of light the object sits in. Held well back from the centre —
  // at full strength it bleached the middle of the bench and took the grid
  // with it, and the object then had nothing to stand against.
  const centre = project({ x: 0, y: 0, z: 0 }, cam);
  const rim = project({ x: 3.4, y: 0, z: 0 }, cam);
  const radius = Math.max(40, Math.abs(rim.x - centre.x));
  const glow = ctx.createRadialGradient(centre.x, centre.y, 0, centre.x, centre.y, radius);
  glow.addColorStop(0, css(p.fieldLit, 0.5));
  glow.addColorStop(0.5, css(p.fieldLit, 0.2));
  glow.addColorStop(1, css(p.fieldLit, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(centre.x, centre.y, radius, radius * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
}

interface RingArgs {
  progress: number;
  slices: { holder: string; from: number; to: number }[];
  rank: Map<string, number>;
  start: number;
  live: boolean;
}

/**
 * Where a moment inside the hour sits on the bench.
 *
 * The top of the ring is :00 and it runs clockwise, which is the only reading
 * anyone will attempt. The top of the ring is the FAR side of the bench, so
 * the minute hand starts pointing away from the viewer — hence the sine on x
 * and the cosine on z rather than the other way round. Getting this backwards
 * puts :30 at the top and produces a clock that is silently upside down.
 */
function onRing(t: number, radius: number): Vec3 {
  const a = t * Math.PI * 2;
  return { x: Math.sin(a) * radius, y: 0, z: Math.cos(a) * radius };
}

function ringPoints(from: number, to: number, radius: number, cam: Camera, steps = 48): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = from + ((to - from) * i) / steps;
    out.push(project(onRing(t, radius), cam));
  }
  return out;
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  p: Palette,
  args: RingArgs,
) {
  const { progress, slices, rank, start } = args;

  // The empty band. Always drawn: the hour is real whether or not anyone is
  // playing it, and an hour with no reigns should look empty rather than absent.
  const outer = ringPoints(0, 1, RING_OUT, cam, 96);
  const inner = ringPoints(1, 0, RING_IN, cam, 96);
  ctx.beginPath();
  ctx.moveTo(outer[0].x, outer[0].y);
  for (const q of outer.slice(1)) ctx.lineTo(q.x, q.y);
  for (const q of inner) ctx.lineTo(q.x, q.y);
  ctx.closePath();
  ctx.fillStyle = css(p.fieldDeep, 0.9);
  ctx.fill();
  ctx.strokeStyle = css(p.ink, 0.18);
  ctx.lineWidth = 1;
  ctx.stroke();
  // The inner edge again on its own: it is the boundary between the dial and
  // the ground the tile stands on, and at one shared stroke it disappeared
  // under the tile's own occlusion.
  const innerEdge = ringPoints(0, 1, RING_IN, cam, 96);
  ctx.beginPath();
  ctx.moveTo(innerEdge[0].x, innerEdge[0].y);
  for (const q of innerEdge.slice(1)) ctx.lineTo(q.x, q.y);
  ctx.closePath();
  ctx.strokeStyle = css(p.ink, 0.16);
  ctx.stroke();

  // Each reign is an arc of the hour. Rank decides the tone, so the longest
  // arc is amber and reading the picture answers the only question there is.
  for (const slice of slices) {
    const from = (slice.from - start) / EPOCH_SECONDS;
    const to = (slice.to - start) / EPOCH_SECONDS;
    if (to - from < 0.0004) continue;

    const r = rank.get(slice.holder) ?? 99;
    const tone = r === 0 ? p.crownLit : r === 1 ? p.inkSoft : p.inkMute;
    const alpha = r === 0 ? 0.95 : r === 1 ? 0.42 : 0.24;

    const steps = Math.max(4, Math.round((to - from) * 120));
    const a = ringPoints(from, to, RING_OUT, cam, steps);
    const b = ringPoints(to, from, RING_IN, cam, steps);
    ctx.beginPath();
    ctx.moveTo(a[0].x, a[0].y);
    for (const q of a.slice(1)) ctx.lineTo(q.x, q.y);
    for (const q of b) ctx.lineTo(q.x, q.y);
    ctx.closePath();
    ctx.fillStyle = css(tone, alpha);
    ctx.fill();
  }

  // Five-minute ticks, with the quarters carrying more weight.
  for (let m = 0; m < 60; m += 5) {
    const t = m / 60;
    const quarter = m % 15 === 0;
    const from = project(onRing(t, RING_OUT), cam);
    const to = project(onRing(t, quarter ? TICK_OUT + 0.05 : TICK_OUT), cam);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = css(p.ink, quarter ? 0.34 : 0.16);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Now. A hairline from the tile out through the band, and a bead on it —
  // the only thing in the frame that moves every second.
  const hub = project(onRing(progress, 1.06), cam);
  const tip = project(onRing(progress, TICK_OUT + 0.14), cam);
  ctx.beginPath();
  ctx.moveTo(hub.x, hub.y);
  ctx.lineTo(tip.x, tip.y);
  ctx.strokeStyle = css(p.ink, 0.42);
  ctx.lineWidth = 1;
  ctx.stroke();

  const bead = project(onRing(progress, (RING_IN + RING_OUT) / 2), cam);
  ctx.beginPath();
  ctx.arc(bead.x, bead.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = css(p.ink, 0.82);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bead.x, bead.y, 6.5, 0, Math.PI * 2);
  ctx.strokeStyle = css(p.ink, 0.2);
  ctx.lineWidth = 1;
  ctx.stroke();
}

/**
 * The quarter marks.
 *
 * Drawn last, over everything, because they are annotations on a drawing and
 * not objects in the scene. Set on the bench in depth order they were the
 * only two that survived: :00 sits directly behind whoever is on the podium
 * and vanished behind the crown, and a dial missing its twelve is not a dial.
 */
function drawDial(ctx: CanvasRenderingContext2D, cam: Camera, p: Palette) {
  const labels: [number, string][] = [
    [0, ":00"],
    [0.25, ":15"],
    [0.5, ":30"],
    [0.75, ":45"],
  ];
  ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
  const spaced = "letterSpacing" in ctx;
  if (spaced) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.12em";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [t, text] of labels) {
    const q = project(onRing(t, TICK_OUT + 0.3), cam);
    // A disc of the page ground behind each mark, so a label that lands on
    // the ring band or on a figure is still readable without an outline.
    ctx.beginPath();
    ctx.ellipse(q.x, q.y, 17, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = css(p.field, 0.82);
    ctx.fill();
    ctx.fillStyle = css(p.inkMute, 1);
    ctx.fillText(text, q.x, q.y);
  }
  if (spaced) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  }
}

interface TileArgs {
  light: Vec3;
  lift: number;
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  p: Palette,
  { light, lift }: TileArgs,
) {
  const base = square(TILE_W, lift);
  const shoulder = square(TILE_W, TILE_H - CHAMFER + lift);
  const top = square(TILE_W - CHAMFER, TILE_H + lift);

  // ---- cast shadow ------------------------------------------------------
  // Project the silhouette down the light direction onto the bench and take
  // the hull. Blurred in one pass where the browser has a filter, and stacked
  // in three where it does not, so the object never sits on a hard black cut.
  const drop = (v: Vec3): Vec3 => ({
    x: v.x - (light.x / light.y) * v.y,
    y: 0,
    z: v.z - (light.z / light.y) * v.y,
  });
  const hull = hullXZ([...base.map((v) => ({ ...v, y: 0 })), ...top.map(drop)]);
  const hullPts = hull.map((v) => project(v, cam));

  ctx.save();
  const canFilter = typeof ctx.filter === "string";
  if (canFilter) {
    ctx.filter = "blur(14px)";
    pathOf(ctx, hullPts);
    ctx.fillStyle = css(p.ink, 0.2);
    ctx.fill();
    ctx.filter = "blur(4px)";
    pathOf(ctx, hullPts);
    ctx.fillStyle = css(p.ink, 0.14);
    ctx.fill();
    ctx.filter = "none";
  } else {
    pathOf(ctx, hullPts);
    ctx.fillStyle = css(p.ink, 0.2);
    ctx.fill();
  }
  ctx.restore();

  /*
   * Contact.
   *
   * The cast shadow alone left the tile hovering over a smudge — a soft blob
   * says where the light is, not where the object touches. Two more marks fix
   * it: a tight occlusion ring hugging the base on every side, which is the
   * light that cannot reach the crease, and a hard fill under the footprint
   * itself. Both are independent of the light direction, because occlusion is.
   */
  const centre = project({ x: 0, y: 0, z: 0 }, cam);
  const edge = project({ x: TILE_W * 2.05, y: 0, z: 0 }, cam);
  const ao = Math.max(20, Math.abs(edge.x - centre.x));
  const occl = ctx.createRadialGradient(centre.x, centre.y, ao * 0.28, centre.x, centre.y, ao);
  occl.addColorStop(0, css(p.ink, 0.17));
  occl.addColorStop(0.55, css(p.ink, 0.07));
  occl.addColorStop(1, css(p.ink, 0));
  ctx.save();
  ctx.fillStyle = occl;
  ctx.beginPath();
  ctx.ellipse(centre.x, centre.y, ao, ao * 0.44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const contact = base.map((v) => project(v, cam));
  pathOf(ctx, contact);
  ctx.fillStyle = css(p.ink, 0.13);
  ctx.fill();

  // ---- faces ------------------------------------------------------------
  interface Face {
    world: Vec3[];
    pts: Pt[];
    depth: number;
    kind: "side" | "bevel" | "top";
  }
  const faces: Face[] = [];

  for (let i = 0; i < 4; i += 1) {
    const j = (i + 1) % 4;
    faces.push({
      world: [base[i], base[j], shoulder[j], shoulder[i]],
      pts: [],
      depth: 0,
      kind: "side",
    });
    faces.push({
      world: [shoulder[i], shoulder[j], top[j], top[i]],
      pts: [],
      depth: 0,
      kind: "bevel",
    });
  }
  faces.push({ world: top, pts: [], depth: 0, kind: "top" });

  const visible: Face[] = [];
  for (const face of faces) {
    const pts = face.world.map((v) => project(v, cam));
    // Backface cull in screen space: a face wound clockwise here is turned
    // away from us. Cheaper and more reliable than comparing to a camera
    // vector, and it handles the pointer nudge for free.
    let area = 0;
    for (let i = 0; i < pts.length; i += 1) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      area += a.x * b.y - b.x * a.y;
    }
    if (area >= 0) continue;
    face.pts = pts;
    face.depth = face.world.reduce((sum, v) => sum + project(v, cam).d, 0) / face.world.length;
    visible.push(face);
  }
  visible.sort((a, b) => b.depth - a.depth);

  for (const face of visible) {
    const n = normalOf(face.world[0], face.world[1], face.world[2]);
    const lambert = Math.max(0, dot(n, light));

    if (face.kind === "top") {
      /*
       * The top is the face that has to sell the material, and a single
       * light-to-dark ramp on it read as painted plastic. Three things put
       * the metal back, in the order they mattered:
       *
       *   The ramp runs along the light's direction across the bench, not
       *   along an arbitrary screen axis, so the sheen turns as the hour does
       *   and reads as reflection rather than as shading.
       *
       *   Brushing. Sixty hairlines in one direction, which is what a ground
       *   plate looks like and, more to the point, what concentric tooling
       *   marks did NOT look like: circles on a square face came out as a
       *   bullseye, and the object briefly read as a target.
       *
       *   A hot spot, placed where the light actually is. Metal has one and
       *   matte paint does not; without it the top was the only part of this
       *   object that looked drawn. Kept weak — at full strength it bleached
       *   the face to paper and took the brushing with it.
       */
      const half = TILE_W - CHAMFER;
      const l2 = Math.hypot(light.x, light.z) || 1;
      const dx = light.x / l2;
      const dz = light.z / l2;
      const near = project({ x: dx * half, y: TILE_H + lift, z: dz * half }, cam);
      const far = project({ x: -dx * half, y: TILE_H + lift, z: -dz * half }, cam);
      const grad = ctx.createLinearGradient(near.x, near.y, far.x, far.y);
      grad.addColorStop(0, css(mix(p.top, p.topLit, 0.35 + lambert * 0.4)));
      grad.addColorStop(0.4, css(mix(p.top, p.topLit, 0.6)));
      grad.addColorStop(0.7, css(p.top));
      grad.addColorStop(1, css(mix(p.top, p.left, 0.7)));
      pathOf(ctx, face.pts);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.save();
      pathOf(ctx, face.pts);
      ctx.clip();

      for (let z = -half; z <= half + 0.001; z += half / 28) {
        const a = project(onTile(-half, z, TILE_H + lift), cam);
        const b = project(onTile(half, z, TILE_H + lift), cam);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = css(p.ink, 0.022);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const hot = project({ x: dx * half * 0.5, y: TILE_H + lift, z: dz * half * 0.5 }, cam);
      const reach = Math.max(24, Math.abs(near.x - far.x) * 0.55);
      const spec = ctx.createRadialGradient(hot.x, hot.y, 0, hot.x, hot.y, reach);
      spec.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      spec.addColorStop(0.45, "rgba(255, 255, 255, 0.09)");
      spec.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = spec;
      ctx.fillRect(hot.x - reach, hot.y - reach, reach * 2, reach * 2);
      ctx.restore();
      continue;
    }

    // Sides and bevels: brighter at the top edge where they catch the room,
    // darker at the bench. A flat fill on four faces of one object turns it
    // into a silhouette.
    const dark = mix(p.right, p.edge, 0.55);
    const lit = mix(p.left, p.topLit, 0.72);
    const bodyTop = mix(dark, lit, 0.1 + lambert * 0.9);
    const bodyBase = mix(dark, lit, Math.max(0, lambert * 0.3));

    const hi = project(face.world[2], cam);
    const lo = project(face.world[0], cam);
    const grad = ctx.createLinearGradient(hi.x, hi.y, lo.x, lo.y);

    if (face.kind === "bevel") {
      /*
       * The chamfer is the brightest thing on the object at almost any light
       * angle — it is the one surface tilted halfway between the top and the
       * room. Letting it merge with the side is what made the first pass look
       * like a rounded rectangle instead of a milled block.
       *
       * It is also where the crown lives. Stroked around the top face instead,
       * the crown read as a frame laid on the tile — a sticker, and it
       * flattened the object it was meant to mark. Run through the chamfer it
       * is the rim of the part itself catching light, which is the difference
       * between something decorated and something lit.
       */
      grad.addColorStop(0, css(mix(bodyTop, p.topLit, 0.55)));
      grad.addColorStop(1, css(mix(bodyTop, p.edge, 0.2)));
    } else {
      grad.addColorStop(0, css(bodyTop));
      grad.addColorStop(1, css(bodyBase));
    }

    pathOf(ctx, face.pts);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // The seam where the chamfer meets the top face. The podium carries no
  // colour of its own any more — the crown does, and it is now an object
  // somebody is holding rather than a band around a block.
  pathOf(ctx, top.map((v) => project(v, cam)));
  ctx.strokeStyle = css(p.ink, 0.1);
  ctx.lineWidth = 1;
  ctx.stroke();

  // The silhouette. One hairline around the whole object — the difference
  // between a solid that was milled and one that was airbrushed. Taken in
  // screen space so it follows the pointer nudge without any special case.
  const outline = hullScreen([...base, ...shoulder, ...top].map((v) => project(v, cam)));
  pathOf(ctx, outline);
  ctx.strokeStyle = css(p.edge, 0.5);
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Convex hull of projected points, for the object's silhouette. */
function hullScreen(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const q of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0)
      lower.pop();
    lower.push(q);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i -= 1) {
    const q = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0)
      upper.pop();
    upper.push(q);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/* ---- the people --------------------------------------------------------
 *
 * Figures are drawn as billboards: their standing point is projected in 3D so
 * they sit correctly on the bench and shrink with distance, but the body
 * itself is laid out in screen space. Nothing here is rotationally
 * asymmetric — a sphere head and round-capped tubes look the same from every
 * side — so there is no view for the trick to fail in, and it costs a fraction
 * of what a real mesh would.
 *
 * Two states, and they are the same two the rest of the page uses.
 *
 *   SOLID is a real contender. It has a gradient body and a contact shadow.
 *   Every solid figure on the bench corresponds to an address in the
 *   standings — the king on the podium is the one wearing the crown, and each
 *   figure below is somebody who has actually banked time this hour.
 *
 *   OUTLINE is a place nobody is standing. Before launch the whole scene is
 *   outlines, which is what an empty game looks like: a podium, a drawn crown
 *   above an empty throne, and a ring of people who have not turned up.
 */

/** Vertical of world length `h` standing at (x, z) on a surface at y0. */
function standing(
  x: number,
  z: number,
  y0: number,
  h: number,
  cam: Camera,
): { base: Pt; px: number } {
  const base = project({ x, y: y0, z }, cam);
  const top = project({ x, y: y0 + h, z }, cam);
  return { base, px: Math.max(6, base.y - top.y) };
}

/**
 * Where the crowd stands.
 *
 * Seven fixed places, jittered by hand rather than by a generator: an even
 * seven around a circle reads as a fence, and a random seven moves every
 * frame. The radii sit between the podium's corner reach (1.07) and the inner
 * edge of the hour ring (1.52), so the crowd never climbs the hill and never
 * stands on the clock.
 *
 * They are ordered by rank, and the order runs from the front of the ring
 * outward. The first version ordered them from :00, which is the FAR side —
 * the two real contenders in the worked hour were both filed behind the
 * block, where the podium hid the only two solid figures on the bench. Rank 0
 * now stands nearest the reader.
 */
const CROWD: { angle: number; radius: number }[] = [
  { angle: 0.5, radius: 1.3 },
  { angle: 0.38, radius: 1.37 },
  { angle: 0.62, radius: 1.34 },
  { angle: 0.27, radius: 1.42 },
  { angle: 0.73, radius: 1.39 },
  { angle: 0.12, radius: 1.33 },
  { angle: 0.88, radius: 1.36 },
];

/** A body gradient: lit from above, the way every other surface here is. */
function bodyPaint(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  x: number,
  footY: number,
  h: number,
): CanvasGradient {
  const g = ctx.createLinearGradient(x, footY - h * 1.05, x, footY);
  g.addColorStop(0, css(mix(p.topLit, WHITE, 0.55)));
  g.addColorStop(0.45, css(p.top));
  g.addColorStop(1, css(mix(p.left, p.right, 0.45)));
  return g;
}

/** The soft dark patch a body puts on whatever it is standing on. */
function contactPatch(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  x: number,
  y: number,
  w: number,
) {
  ctx.save();
  if (typeof ctx.filter === "string") ctx.filter = `blur(${Math.max(1, w * 0.22)}px)`;
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.62, w * 0.24, 0, 0, Math.PI * 2);
  ctx.fillStyle = css(p.ink, 0.22);
  ctx.fill();
  ctx.restore();
}

/** A round-capped tube, which is every limb and torso in this scene. */
function tube(
  ctx: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width: number,
  paint: string | CanvasGradient,
) {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineCap = "round";
  ctx.lineWidth = width;
  ctx.strokeStyle = paint;
  ctx.stroke();
}

/** One of the crowd: a dome body and a head, no limbs. */
function drawBystander(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  x: number,
  footY: number,
  h: number,
  solid: boolean,
) {
  const bodyW = h * 0.46;
  const bodyTop = footY - h * 0.6;
  const headR = h * 0.17;
  const headY = footY - h * 0.84;

  if (solid) contactPatch(ctx, p, x, footY, bodyW);

  const paint = bodyPaint(ctx, p, x, footY, h);

  // Body: a tube from the ground up, so the top is a dome and the base is
  // flat where it meets the bench.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - bodyW, footY - h * 1.4, bodyW * 2, h * 1.4);
  ctx.clip();
  if (solid) {
    tube(ctx, x, bodyTop + bodyW / 2, x, footY + bodyW / 2, bodyW, paint);
  } else {
    ctx.beginPath();
    ctx.moveTo(x - bodyW / 2, footY);
    ctx.lineTo(x - bodyW / 2, bodyTop + bodyW / 2);
    ctx.arc(x, bodyTop + bodyW / 2, bodyW / 2, Math.PI, 0);
    ctx.lineTo(x + bodyW / 2, footY);
    ctx.strokeStyle = css(p.ink, 0.34);
    ctx.lineWidth = 1;
    ctx.lineCap = "butt";
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  if (solid) {
    ctx.fillStyle = paint;
    ctx.fill();
  } else {
    ctx.strokeStyle = css(p.ink, 0.34);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** The crown, held up. Amber when it is actually worn, drawn when it is not. */
function drawCrownShape(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  cx: number,
  baseY: number,
  w: number,
  h: number,
  worn: boolean,
) {
  const left = cx - w / 2;
  const right = cx + w / 2;
  const notch = baseY - h * 0.42;
  const apex = baseY - h;

  const path = () => {
    ctx.beginPath();
    ctx.moveTo(left, baseY);
    ctx.lineTo(left, apex);
    ctx.lineTo(left + w * 0.26, notch);
    ctx.lineTo(cx, apex - h * 0.08);
    ctx.lineTo(right - w * 0.26, notch);
    ctx.lineTo(right, apex);
    ctx.lineTo(right, baseY);
    ctx.closePath();
  };

  if (worn) {
    // The only amber left on the object, and it is on the one thing the game
    // is played for. A soft throw first, so it reads as lit rather than
    // painted, then the body over it.
    ctx.save();
    if (typeof ctx.filter === "string") ctx.filter = `blur(${Math.max(3, w * 0.34)}px)`;
    path();
    ctx.fillStyle = css(p.crownLit, 0.32);
    ctx.fill();
    ctx.restore();

    const g = ctx.createLinearGradient(cx, apex, cx, baseY);
    g.addColorStop(0, css(mix(p.crownLit, WHITE, 0.5)));
    g.addColorStop(0.55, css(p.crownLit));
    g.addColorStop(1, css(p.crown));
    path();
    ctx.fillStyle = g;
    ctx.fill();
  } else {
    path();
    ctx.strokeStyle = css(p.ink, 0.34);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // The opening of the band, which is what stops it reading as a flat cutout.
  ctx.beginPath();
  ctx.ellipse(cx, baseY, w * 0.5, h * 0.11, 0, 0, Math.PI * 2);
  if (worn) {
    ctx.fillStyle = css(mix(p.crown, p.ink, 0.35));
    ctx.fill();
  } else {
    ctx.strokeStyle = css(p.ink, 0.22);
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** Whoever is on top: legs, torso, head, both arms up, crown above the hands. */
function drawKing(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  x: number,
  footY: number,
  h: number,
  solid: boolean,
) {
  const paint = solid ? bodyPaint(ctx, p, x, footY, h) : css(p.ink, 0.32);
  const line = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    w: number,
  ) => {
    if (solid) {
      tube(ctx, ax, ay, bx, by, w, paint);
      return;
    }
    // Outlined, a tube is its own silhouette: two parallel edges and two
    // round caps. Stroking the centre line instead would draw a stick figure,
    // which is a different drawing altogether.
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * (w / 2);
    const ny = (dx / len) * (w / 2);
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(ax + nx, ay + ny);
    ctx.lineTo(bx + nx, by + ny);
    ctx.arc(bx, by, w / 2, angle + Math.PI / 2, angle - Math.PI / 2, true);
    ctx.lineTo(ax - nx, ay - ny);
    ctx.arc(ax, ay, w / 2, angle - Math.PI / 2, angle + Math.PI / 2, true);
    ctx.closePath();
    ctx.strokeStyle = css(p.ink, 0.32);
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  if (solid) contactPatch(ctx, p, x, footY, h * 0.4);

  /*
   * Proportions, and the first set was wrong in a way that only shows once
   * it is drawn: a torso at 0.25h with arms at 0.1h leaving the shoulder,
   * all painted from one gradient, merged into a single white column. The
   * head disappeared into it and the figure lost both arms.
   *
   * What separates them is not more contrast, it is space. A narrower torso,
   * arms that leave at a wider angle, and a real gap under the head. The head
   * then gets its own radial gradient so it reads as a sphere in front of the
   * body rather than a bump on top of it — the one place a flat fill was
   * costing the whole figure.
   */
  const legW = h * 0.11;
  line(x - h * 0.085, footY - legW / 2, x - h * 0.085, footY - h * 0.32, legW);
  line(x + h * 0.085, footY - legW / 2, x + h * 0.085, footY - h * 0.32, legW);

  line(x, footY - h * 0.3, x, footY - h * 0.6, h * 0.19);

  // The arms open into a wide V and the hands land exactly on the crown's
  // lower corners. Held closer in they ran up either side of the head and the
  // three merged into one white mass again — the arms have to clear the head
  // by more than their own width for the gesture to read at all.
  const armW = h * 0.085;
  line(x - h * 0.09, footY - h * 0.55, x - h * 0.24, footY - h * 0.93, armW);
  line(x + h * 0.09, footY - h * 0.55, x + h * 0.24, footY - h * 0.93, armW);

  const headR = h * 0.125;
  const headY = footY - h * 0.745;
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  if (solid) {
    const g = ctx.createRadialGradient(
      x - headR * 0.4,
      headY - headR * 0.45,
      headR * 0.1,
      x,
      headY,
      headR * 1.35,
    );
    g.addColorStop(0, css(WHITE));
    g.addColorStop(0.5, css(p.top));
    g.addColorStop(1, css(mix(p.left, p.right, 0.5)));
    ctx.fillStyle = g;
    ctx.fill();
  } else {
    ctx.strokeStyle = css(p.ink, 0.32);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawCrownShape(ctx, p, x, footY - h * 0.99, h * 0.52, h * 0.24, solid);
}

function drawRipple(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  p: Palette,
  t: number,
) {
  const eased = 1 - Math.pow(1 - t, 2.2);
  const radius = 1.05 + eased * 1.9;
  const pts: Pt[] = [];
  for (let i = 0; i <= 72; i += 1) {
    const a = (i / 72) * Math.PI * 2;
    pts.push(project({ x: Math.cos(a) * radius, y: 0, z: Math.sin(a) * radius }, cam));
  }
  pathOf(ctx, pts);
  ctx.strokeStyle = css(p.crown, 0.5 * (1 - eased));
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawPreviewMark(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  width: number,
  height: number,
) {
  ctx.font = '500 10px "JetBrains Mono", ui-monospace, monospace';
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0.14em";
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const text = "PREVIEW — NOT REAL";
  const metrics = ctx.measureText(text);
  const x = 16;
  const y = height - 16;
  ctx.fillStyle = css(p.ink, 0.9);
  ctx.fillRect(x - 6, y - 13, metrics.width + 12, 20);
  ctx.fillStyle = css(p.fieldLit, 1);
  ctx.fillText(text, x, y);
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  }
  void width;
}
