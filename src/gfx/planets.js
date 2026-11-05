import { Mesh, MeshGeometry, Shader, Texture, Sprite, Container, Rectangle } from 'pixi.js';
import { rng, makeNoise, LRU, makeCanvas, glowSprite, TAU, hashStr, clamp, animated } from './util.js';

// ---------------------------------------------------------------- colour ramps
function ramp(stops) {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0], b = stops[stops.length - 1];
    for (let k = 0; k < stops.length - 1; k++) if (t >= stops[k][0] && t <= stops[k + 1][0]) { a = stops[k]; b = stops[k + 1]; break; }
    const u = b[0] === a[0] ? 0 : clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    const s = u * u * (3 - 2 * u);
    for (let c = 0; c < 3; c++) {
      const ca = (a[1] >> (16 - 8 * c)) & 255, cb = (b[1] >> (16 - 8 * c)) & 255;
      lut[i * 3 + c] = ca + (cb - ca) * s;
    }
  }
  return (t, out) => {
    const i = (clamp(t, 0, 1) * 255) | 0;
    out[0] = lut[i * 3]; out[1] = lut[i * 3 + 1]; out[2] = lut[i * 3 + 2];
  };
}
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mixc = (o, c, t) => { o[0] += (c[0] - o[0]) * t; o[1] += (c[1] - o[1]) * t; o[2] += (c[2] - o[2]) * t; };
const C = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];

export const ATMO = {
  terran: [0x7fc4ff, 0.9], ocean: [0x6fb8ff, 1.0], desert: [0xf0b58a, 0.7], ice: [0xcfe8ff, 0.8], lava: [0xff7a4a, 0.55],
  gas: [0xf0d8a8, 0.65], barren: [0x9aa3c7, 0.22], jungle: [0x8fe0a0, 0.9], crystal: [0xe0b0ff, 0.8], toxic: [0xd4e060, 0.85],
};
const CLOUD_TINT = { terran: 0xffffff, ocean: 0xffffff, desert: 0xf4dcc0, ice: 0xf4faff, jungle: 0xffffff, toxic: 0xe8f08a, lava: 0x6a4040 };

const GAS_PALETTES = [
  [[0, 0xf3e3c3], [0.25, 0xd9a86a], [0.45, 0xb5683e], [0.62, 0xe8cfa0], [0.8, 0x9a6a4a], [1, 0xf1dcb4]],           // jupiter
  [[0, 0xf4e6b4], [0.3, 0xe0c27a], [0.55, 0xc79b52], [0.8, 0xede0b0], [1, 0xd8b36a]],                               // saturn gold
  [[0, 0xbfe4f0], [0.3, 0x5aa6d6], [0.55, 0x2f6fb8], [0.8, 0x8fcbe4], [1, 0x3c85c8]],                               // ice giant
  [[0, 0xf3d0d4], [0.3, 0xd98a9a], [0.55, 0x9a5a86], [0.8, 0xe8b0b8], [1, 0xb06a8e]],                               // rose
  [[0, 0xdcf0d0], [0.3, 0x8fc9a6], [0.55, 0x3f9a8e], [0.8, 0xc4e4c0], [1, 0x5fb09a]],                               // mint
];

// ---------------------------------------------------------------- surface bakers
// each returns function(x,y,z,lat,lon,out) filling out = {rgb:[3], cloud, emis, spec}
function makeSurface(type, seed, life) {
  const R = rng(hashStr(type + '|' + seed));
  const N = makeNoise(R() * 1e9 | 0);
  const N2 = makeNoise(R() * 1e9 | 0);
  const off = [R() * 50, R() * 50, R() * 50];
  const civ = life === 'civilized';
  const cityLayer = (x, y, z, land, o) => {
    if (!civ || !land) return;
    const cl = N2.fbm(x * 2.5 + 9, y * 2.5, z * 2.5, 3);
    if (cl < 0.5) return;
    const d = N2.fbm(x * 22 + 3, y * 22, z * 22, 2);
    const v = sstep(0.58, 0.72, d) * sstep(0.5, 0.62, cl);
    o.emis = Math.max(o.emis, v);
  };
  const tmp = [0, 0, 0];
  switch (type) {
    case 'terran': case 'ocean': case 'jungle': {
      const sea = type === 'ocean' ? 0.64 : type === 'jungle' ? 0.38 : 0.5;
      const land = type === 'jungle'
        ? ramp([[0, 0xd9c98a], [0.06, 0x3f8f3a], [0.35, 0x1f6b34], [0.7, 0x2f8a4a], [1, 0x7f9a5a]])
        : type === 'ocean'
          ? ramp([[0, 0xf2e2b0], [0.08, 0x6fb06a], [0.5, 0x3e8a4a], [1, 0x8a8a6a]])
          : ramp([[0, 0xe6d6a0], [0.05, 0x6fae5a], [0.3, 0x3f8a46], [0.55, 0x8a8f52], [0.75, 0x8f7a5a], [0.92, 0xb4aaa0], [1, 0xffffff]]);
      const sh = ramp([[0, 0x5fd0c8], [0.2, 0x2f93b4], [0.6, 0x1f5a96], [1, 0x102a62]]);
      const cvar = type === 'jungle' ? 5 : 3;
      return (x, y, z, lat, lon, o) => {
        const h = N.fbm(x * 2 + off[0], y * 2 + off[1], z * 2 + off[2], 6) + (type === 'ocean' ? -0.0 : 0);
        o.cloud = 0; o.emis = 0; o.spec = 0;
        let isLand = h > sea;
        if (isLand) {
          const t = (h - sea) / (1 - sea);
          land(clamp(t * 1.5, 0, 1), o.rgb);
          const m = N2.fbm(x * 5, y * 5, z * 5, 4);
          if (type !== 'jungle') mixc(o.rgb, type === 'terran' ? C(0xb59a5a) : C(0x9aa85a), sstep(0.5, 0.75, m) * 0.5 * (1 - t));
          else { const f = N2.fbm(x * 18, y * 18, z * 18, 2); mixc(o.rgb, C(0x14502a), f * 0.4); }
          o.spec = 0.05;
          if (type === 'jungle') { const r = N.ridged(x * 4 + 3, y * 4, z * 4, 3); mixc(o.rgb, C(0x3fb5b0), sstep(0.9, 0.97, r) * 0.7); }
        } else {
          const d = (sea - h) / sea;
          sh(clamp(d * 1.9, 0, 1), o.rgb);
          o.spec = 1;
        }
        const ice = Math.abs(y) + (h - 0.5) * 0.35 + (N2.n3(x * 7, y * 7, z * 7) - 0.5) * 0.1;
        const capAt = type === 'jungle' ? 1.2 : type === 'ocean' ? 0.93 : 0.88;
        if (ice > capAt) { mixc(o.rgb, C(0xf4faff), sstep(capAt, capAt + 0.05, ice)); o.spec = 0.3; isLand = true; }
        const c = N2.fbm(x * cvar + off[2], y * cvar * 1.3 + off[0], z * cvar + off[1], 5);
        const cw = N2.fbm(x * 1.5, y * 1.5, z * 1.5, 3);
        o.cloud = sstep(type === 'jungle' ? 0.46 : 0.52, 0.75, c + (cw - 0.5) * 0.3) * (type === 'ocean' ? 0.85 : 0.95);
        cityLayer(x, y, z, isLand && Math.abs(y) < 0.8 && h > sea + 0.02, o);
      };
    }
    case 'desert': {
      const sand = ramp([[0, 0xf0c88a], [0.3, 0xd9964f], [0.6, 0xb8683a], [0.85, 0x8a4a34], [1, 0xe8c090]]);
      return (x, y, z, lat, lon, o) => {
        const w = N.fbm(x * 2.2 + off[0], y * 2.2, z * 2.2 + off[1], 4);
        const dune = Math.sin((y * 14 + w * 9 + N2.fbm(x * 6, y * 6, z * 6, 3) * 3) * Math.PI);
        const rock = N2.fbm(x * 3.5 + off[2], y * 3.5, z * 3.5, 5);
        sand(clamp(0.35 + w * 0.5 + dune * 0.12, 0, 1), o.rgb);
        const pit = sstep(0.62, 0.78, rock);
        mixc(o.rgb, C(0x7a3f33), pit * 0.7);
        const ridge = N.ridged(x * 6, y * 6, z * 6, 3);
        mixc(o.rgb, C(0xf6dba4), sstep(0.8, 0.95, ridge) * 0.35);
        const cap = sstep(0.9, 0.98, Math.abs(y));
        mixc(o.rgb, C(0xf6e8d0), cap * 0.6);
        o.spec = 0; o.emis = 0;
        o.cloud = sstep(0.62, 0.8, N2.fbm(x * 3 + off[1], y * 5, z * 3, 4)) * 0.45;
        cityLayer(x, y, z, pit < 0.3 && Math.abs(y) < 0.85, o);
      };
    }
    case 'ice': {
      const base = ramp([[0, 0xffffff], [0.4, 0xdcefff], [0.7, 0xb4d4ee], [1, 0x8fb4dc]]);
      return (x, y, z, lat, lon, o) => {
        const h = N.fbm(x * 3 + off[0], y * 3, z * 3 + off[1], 6);
        base(h, o.rgb);
        const dark = sstep(0.62, 0.8, N2.fbm(x * 2 + 4, y * 2, z * 2, 4));
        mixc(o.rgb, C(0x5f98c4), dark * 0.5);
        const r1 = N.ridged(x * 3.2 + 8, y * 3.2, z * 3.2 + off[2], 4);
        const crack = sstep(0.9, 0.975, r1);
        mixc(o.rgb, C(0x4a86b8), crack * 0.75);
        const r2 = N2.ridged(x * 7, y * 7, z * 7, 2);
        mixc(o.rgb, C(0x8fbce0), sstep(0.93, 0.99, r2) * 0.5);
        o.spec = 0.45; o.emis = 0;
        o.cloud = sstep(0.58, 0.8, N2.fbm(x * 3 + off[1], y * 3.4, z * 3, 5)) * 0.55;
        cityLayer(x, y, z, Math.abs(y) < 0.8, o);
      };
    }
    case 'lava': {
      const rock = ramp([[0, 0x1c1216], [0.5, 0x3a2227], [1, 0x6a4038]]);
      const mag = ramp([[0, 0xc0301a], [0.5, 0xff7a2a], [1, 0xffd870]]);
      return (x, y, z, lat, lon, o) => {
        const h = N.fbm(x * 3 + off[0], y * 3, z * 3, 6);
        rock(h, o.rgb);
        const wx = N2.fbm(x * 2 + 5, y * 2, z * 2, 3) * 0.6;
        const r = N.ridged(x * 2.6 + wx, y * 2.6 + wx, z * 2.6, 5);
        const vein = sstep(0.74, 0.93, r);
        const pool = sstep(0.34, 0.2, h);
        const e = clamp(vein + pool, 0, 1);
        mag(0.4 + 0.6 * N2.fbm(x * 8, y * 8, z * 8, 2), tmp);
        mixc(o.rgb, tmp, e * 0.9);
        o.emis = e; o.spec = 0;
        o.cloud = sstep(0.55, 0.85, N2.fbm(x * 2.4 + off[2], y * 4, z * 2.4, 4)) * 0.4;
        cityLayer(x, y, z, e < 0.1, o);
      };
    }
    case 'gas': {
      const pal = ramp(GAS_PALETTES[R.int(0, GAS_PALETTES.length - 1)]);
      const sLat = (R() - 0.5) * 0.8, sLon = R() * TAU, sCol = R() < 0.5 ? C(0xc8503a) : C(0xf4e8d0);
      const bf = R.range(5, 9);
      return (x, y, z, lat, lon, o) => {
        const turb = N.fbm(x * 1.6 + off[0], y * 7, z * 1.6, 5);
        const t2 = N2.fbm(x * 3 + 8, y * 18, z * 3, 3);
        let v = 0.5 + 0.5 * Math.sin(y * bf * Math.PI + turb * 3.2) * 0.6 + (t2 - 0.5) * 0.45 + (turb - 0.5) * 0.4;
        pal(v, o.rgb);
        // storm
        let dl = lon - sLon; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
        const d = (dl / 0.42) ** 2 + ((lat - sLat) / 0.17) ** 2;
        if (d < 1.7) {
          const sw = N.fbm(Math.cos(dl * 3 + d * 3) * 1.5 + 4, Math.sin(dl * 3 + d * 3) * 1.5, d * 2, 3);
          mixc(o.rgb, sCol, sstep(1.5, 0.5, d) * (0.55 + sw * 0.4));
          if (d < 0.45) mixc(o.rgb, C(0xfff0d0), 0.15);
        }
        o.cloud = 0; o.emis = 0; o.spec = 0.05;
      };
    }
    case 'barren': {
      const reg = ramp([[0, 0x4a4650], [0.4, 0x8a8478], [0.7, 0xa8a090], [1, 0x6a6460]]);
      const craters = [];
      for (let i = 0; i < 70; i++) {
        const th = R() * TAU, u = R() * 2 - 1, s = Math.sqrt(1 - u * u);
        craters.push([Math.cos(th) * s, u, Math.sin(th) * s, 0.04 + Math.pow(R(), 2.5) * 0.22]);
      }
      return (x, y, z, lat, lon, o) => {
        const h = N.fbm(x * 3 + off[0], y * 3, z * 3, 6);
        const mare = sstep(0.5, 0.62, N2.fbm(x * 1.5 + 3, y * 1.5, z * 1.5, 4));
        reg(h, o.rgb);
        mixc(o.rgb, C(0x47434a), mare * 0.55);
        for (let i = 0; i < craters.length; i++) {
          const c = craters[i];
          const dd = Math.acos(clamp(x * c[0] + y * c[1] + z * c[2], -1, 1)) / c[3];
          if (dd > 1.5) continue;
          if (dd < 1) { const f = 1 - dd * dd; mixc(o.rgb, C(0x3a363c), 0.35 * f + 0.1); }
          const rim = Math.exp(-((dd - 1.02) ** 2) * 40);
          mixc(o.rgb, C(0xd8d2c4), rim * 0.45);
        }
        const ray = N.ridged(x * 9, y * 9, z * 9, 2);
        mixc(o.rgb, C(0xc8c0b0), sstep(0.93, 1, ray) * 0.2);
        o.cloud = 0; o.emis = 0; o.spec = 0;
        cityLayer(x, y, z, mare < 0.5, o);
      };
    }
    case 'crystal': {
      const cols = [C(0x8f6ad6), C(0xd470b8), C(0x5fc6e0), C(0xb8a0f0), C(0xf0e4ff), C(0x6a7ae0)];
      const hs = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
      const SC = 4.2;
      return (x, y, z, lat, lon, o) => {
        const px = x * SC + off[0], py = y * SC + off[1], pz = z * SC + off[2];
        const ix = Math.floor(px), iy = Math.floor(py), iz = Math.floor(pz);
        let f1 = 9, f2 = 9, id = 0;
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
          const cx = ix + a, cy = iy + b, cz = iz + c;
          const fx = cx + hs(cx, cy, cz), fy = cy + hs(cx + 7, cy, cz), fz = cz + hs(cx, cy + 3, cz + 5);
          const d = (px - fx) ** 2 + (py - fy) ** 2 + (pz - fz) ** 2;
          if (d < f1) { f2 = f1; f1 = d; id = hs(cx + 11, cy + 13, cz + 17); } else if (d < f2) f2 = d;
        }
        const col = cols[(id * cols.length) | 0], br = 0.55 + 0.45 * hs(Math.floor(id * 977), 5, 9);
        const gx = N.fbm(x * 3, y * 3, z * 3, 3);
        o.rgb[0] = col[0] * br * (0.8 + gx * 0.4); o.rgb[1] = col[1] * br * (0.8 + gx * 0.4); o.rgb[2] = col[2] * br * (0.8 + gx * 0.4);
        const edge = sstep(0.16, 0.0, Math.sqrt(f2) - Math.sqrt(f1));
        mixc(o.rgb, C(0xfff0ff), edge * 0.75);
        o.emis = edge * 0.9; o.spec = 0.9; o.cloud = 0;
        cityLayer(x, y, z, edge < 0.2 && Math.abs(y) < 0.8, o);
      };
    }
    case 'toxic': {
      const pal = ramp([[0, 0x4a2f5e], [0.25, 0x5b7a2c], [0.5, 0xb7d94a], [0.75, 0xe6d24a], [1, 0xf4efa0]]);
      return (x, y, z, lat, lon, o) => {
        const qx = N.fbm(x * 1.8 + off[0], y * 1.8, z * 1.8, 4), qy = N.fbm(x * 1.8, y * 1.8 + 5, z * 1.8 + 2, 4);
        const r = N2.fbm(x * 2 + qx * 3, y * 2 + qy * 3, z * 2 + off[1], 5);
        pal(r * 1.25 - 0.1, o.rgb);
        const sw = N2.ridged(x * 3 + qx * 2, y * 3 + qy * 2, z * 3, 3);
        mixc(o.rgb, C(0x3c2a4a), sstep(0.82, 0.96, sw) * 0.5);
        o.cloud = sstep(0.5, 0.78, N.fbm(x * 2.6 + qx * 2.5, y * 3 + qy * 2.5, z * 2.6, 5)) * 0.8;
        o.emis = 0; o.spec = 0.1;
        cityLayer(x, y, z, r < 0.5, o);
      };
    }
    default: return makeSurface('barren', seed, life);
  }
}

// ---------------------------------------------------------------- baking + cache
const W = 512, H = 256;
const bakeCache = new LRU(40, (v) => { try { v.surf.destroy(true); v.data.destroy(true); } catch (e) { /* noop */ } });
export function bakePlanet(type, seed, life) {
  const key = `${type}|${seed}|${life === 'civilized' ? 1 : 0}`;
  return bakeCache.memo(key, () => {
    const fn = makeSurface(type, seed, life);
    const c1 = makeCanvas(W, H), c2 = makeCanvas(W, H);
    const g1 = c1.getContext('2d'), g2 = c2.getContext('2d');
    const i1 = g1.createImageData(W, H), i2 = g2.createImageData(W, H);
    const o = { rgb: [0, 0, 0], cloud: 0, emis: 0, spec: 0 };
    const jr = rng(77);
    for (let py = 0; py < H; py++) {
      const lat = (0.5 - (py + 0.5) / H) * Math.PI, cl = Math.cos(lat), y = Math.sin(lat);
      for (let px = 0; px < W; px++) {
        const lon = ((px + 0.5) / W - 0.5) * TAU;
        const x = cl * Math.sin(lon), z = cl * Math.cos(lon);
        o.cloud = 0; o.emis = 0; o.spec = 0;
        fn(x, y, z, lat, lon, o);
        const k = (py * W + px) * 4, grain = (jr() - 0.5) * 7;
        i1.data[k] = clamp(o.rgb[0] + grain, 0, 255); i1.data[k + 1] = clamp(o.rgb[1] + grain, 0, 255); i1.data[k + 2] = clamp(o.rgb[2] + grain, 0, 255); i1.data[k + 3] = 255;
        i2.data[k] = clamp(o.cloud * 255, 0, 255); i2.data[k + 1] = clamp(o.emis * 255, 0, 255); i2.data[k + 2] = clamp(o.spec * 255, 0, 255); i2.data[k + 3] = 255;
      }
    }
    g1.putImageData(i1, 0, 0); g2.putImageData(i2, 0, 0);
    const surf = Texture.from(c1), data = Texture.from(c2);
    for (const t of [surf, data]) { t.source.style.addressModeU = 'repeat'; t.source.style.addressModeV = 'clamp-to-edge'; t.source.style.scaleMode = 'linear'; }
    return { surf, data };
  });
}

// ---------------------------------------------------------------- planet shader
const VERT = `
in vec2 aPosition; in vec2 aUV; out vec2 vUV;
uniform mat3 uProjectionMatrix; uniform mat3 uWorldTransformMatrix; uniform mat3 uTransformMatrix;
void main(){ mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
 gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0); vUV = aUV; }`;
const FRAG = `
in vec2 vUV; out vec4 finalColor;
uniform sampler2D uSurf; uniform sampler2D uData;
uniform float uRot; uniform float uCloudRot; uniform float uTilt; uniform float uTime;
uniform vec3 uLight; uniform vec3 uAtmo; uniform float uAtmoK; uniform vec3 uCloudCol; uniform float uCloudK; uniform float uEmisPulse; uniform vec3 uEmisCol; uniform vec3 uMood;
const float PI = 3.14159265;
vec2 sph(vec3 n, float rot){ float lon = atan(n.x, n.z) + rot; float lat = asin(clamp(n.y, -1.0, 1.0)); return vec2(fract(lon/(2.0*PI) + 0.5), 0.5 - lat/PI); }
void main(){
  vec2 p = (vUV - 0.5) * 2.0; p.y = -p.y;
  float d = length(p);
  if (d >= 1.0) { finalColor = vec4(0.0); return; }
  float z = sqrt(1.0 - d*d);
  vec3 n = vec3(p.x, p.y, z);
  float ct = cos(uTilt), st = sin(uTilt);
  vec3 q = vec3(n.x*ct - n.y*st, n.x*st + n.y*ct, n.z);
  vec3 L = normalize(uLight);
  float diff = dot(n, L);
  vec4 data0 = texture(uData, sph(q, uRot));
  vec3 surf = texture(uSurf, sph(q, uRot)).rgb;
  // cloud layer
  float cl = texture(uData, sph(q * vec3(1.0,1.0,1.0), uCloudRot)).r * uCloudK;
  // cloud shadow
  float sh = texture(uData, sph(normalize(q + vec3(-0.02,0.03,0.0)), uCloudRot)).r * uCloudK;
  vec3 base = surf * (1.0 - sh * 0.25);
  base = mix(base, uCloudCol, cl);
  float day = smoothstep(-0.12, 0.38, diff);
  float lam = max(diff, 0.0);
  vec3 lit = base * (0.04 + 1.05 * pow(lam, 0.85)) * mix(vec3(0.75,0.85,1.0), vec3(1.0,0.96,0.88), day);
  // terminator warm glow
  float tw = exp(-pow((diff - 0.02) / 0.16, 2.0)) * 0.22;
  lit += base * vec3(1.0, 0.55, 0.3) * tw * (0.4 + uAtmoK * 0.4);
  // night ambient (blue tint) + emissive
  vec3 night = base * vec3(0.05, 0.07, 0.14) * (1.0 - day);
  lit += night;
  float em = data0.g * (1.0 - cl * 0.8);
  vec3 emc = uEmisCol * (0.75 + 0.25 * sin(uTime * 1.3 + q.x * 9.0 + q.z * 7.0) * uEmisPulse);
  lit += emc * em * (1.0 - day * 0.55) * 1.35;
  // specular
  vec3 R = reflect(-L, n); float sp = pow(max(R.z, 0.0), 36.0) * data0.b * (1.0 - cl) * smoothstep(0.0, 0.3, diff);
  lit += vec3(1.0, 0.96, 0.85) * sp * 0.9;
  // rim / atmosphere
  float fr = pow(1.0 - z, 2.6);
  float rimLit = smoothstep(-0.55, 0.45, diff);
  lit += uAtmo * fr * uAtmoK * (0.12 + 0.95 * rimLit) * 1.4;
  lit += uAtmo * pow(1.0 - z, 6.0) * uAtmoK * 0.5 * rimLit;
  lit *= uMood;
  float a = smoothstep(1.0, 0.975, d);
  finalColor = vec4(lit * a, a);
}`;

let QUAD = null;
function quad() {
  return QUAD || (QUAD = new MeshGeometry({
    positions: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  }));
}
const v3 = (h) => new Float32Array([((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]);

const EMIS_COL = { lava: 0xff8a3a, crystal: 0xfff0ff, default: 0xffd890 };

export function makeSphereMesh(opts) {
  const { type, seed, life = 'none', light = [-0.72, 0.42, 0.55], tilt = 0, cloudK, mood = [1, 1, 1] } = opts;
  const baked = bakePlanet(type, seed, life);
  const atmo = ATMO[type] || ATMO.barren;
  const shader = Shader.from({
    gl: { vertex: VERT, fragment: FRAG },
    resources: {
      uSurf: baked.surf.source, uData: baked.data.source,
      pu: {
        uRot: { value: 0, type: 'f32' }, uCloudRot: { value: 0, type: 'f32' }, uTilt: { value: tilt, type: 'f32' }, uTime: { value: 0, type: 'f32' },
        uLight: { value: new Float32Array(light), type: 'vec3<f32>' }, uAtmo: { value: v3(atmo[0]), type: 'vec3<f32>' }, uAtmoK: { value: atmo[1], type: 'f32' },
        uCloudCol: { value: v3(CLOUD_TINT[type] || 0xffffff), type: 'vec3<f32>' }, uCloudK: { value: cloudK ?? 1, type: 'f32' },
        uEmisPulse: { value: type === 'lava' ? 1 : 0.3, type: 'f32' }, uEmisCol: { value: v3(EMIS_COL[type] || EMIS_COL.default), type: 'vec3<f32>' },
        uMood: { value: new Float32Array(mood), type: 'vec3<f32>' },
      },
    },
  });
  const mesh = new Mesh({ geometry: quad(), shader });
  mesh._u = shader.resources.pu.uniforms;
  return mesh;
}

// ---------------------------------------------------------------- rings & moons
const ringCache = new LRU(20);
function ringTextures(seed, base) {
  return ringCache.memo(`${seed}|${base}`, () => {
    const R = rng(hashStr('ring' + seed));
    const S = 512, sq = 0.36; // texture width S, ellipse squash
    const c = makeCanvas(S, S * sq), g = c.getContext('2d');
    // paint concentric bands on a square canvas then squash
    const sc = makeCanvas(S, S), sg = sc.getContext('2d');
    const img = sg.createImageData(S, S);
    const rin = 0.6, rout = 1.0;
    const bands = [];
    let t = 0; while (t < 1) { const w = R.range(0.01, 0.07); bands.push([t, t + w, R() < 0.25 ? 0.1 : R.range(0.45, 1)]); t += w; }
    const tint = [[236, 214, 170], [220, 200, 190], [200, 214, 226], [230, 180, 150]][R.int(0, 3)];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = (x + 0.5 - S / 2) / (S / 2), dy = (y + 0.5 - S / 2) / (S / 2), r = Math.hypot(dx, dy), k = (y * S + x) * 4;
      if (r < rin || r > rout) continue;
      const u = (r - rin) / (rout - rin);
      let a = 0; for (const b of bands) if (u >= b[0] && u < b[1]) { a = b[2]; break; }
      a *= Math.min(1, u * 14) * Math.min(1, (1 - u) * 14);
      const fine = 0.9 + 0.1 * Math.sin(u * 70);
      img.data[k] = tint[0] * fine; img.data[k + 1] = tint[1] * fine; img.data[k + 2] = tint[2] * fine; img.data[k + 3] = a * 215;
    }
    sg.putImageData(img, 0, 0);
    g.drawImage(sc, 0, 0, S, S * sq);
    const tex = Texture.from(c);
    const hh = Math.floor(c.height / 2);
    return {
      back: new Texture({ source: tex.source, frame: new Rectangle(0, 0, c.width, hh) }),
      front: new Texture({ source: tex.source, frame: new Rectangle(0, hh, c.width, c.height - hh) }),
      sq,
    };
  });
}

const moonCache = new LRU(24);
function moonTexture(seed) {
  return moonCache.memo(seed, () => {
    const R = rng(hashStr('moon' + seed));
    const N = makeNoise(R() * 1e9 | 0);
    const S = 64, c = makeCanvas(S, S), g = c.getContext('2d'), img = g.createImageData(S, S);
    const base = R.pick([[170, 166, 160], [190, 170, 150], [150, 160, 175], [200, 190, 170]]);
    const cr = []; for (let i = 0; i < 9; i++) cr.push([R.range(-0.7, 0.7), R.range(-0.7, 0.7), R.range(0.08, 0.25)]);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const px = (x + 0.5) / S * 2 - 1, py = (y + 0.5) / S * 2 - 1, d = Math.hypot(px, py);
      if (d >= 1) continue;
      const z = Math.sqrt(1 - d * d);
      let v = 0.7 + N.fbm(px * 3, py * 3, z * 3, 4) * 0.5;
      for (const k of cr) { const dd = Math.hypot(px - k[0], py - k[1]) / k[2]; if (dd < 1) v -= 0.15 * (1 - dd * dd); else if (dd < 1.2) v += 0.08; }
      const lam = clamp(px * -0.72 + -py * 0.42 + z * 0.55, 0, 1);
      const sh = 0.07 + Math.pow(lam, 0.8) * 1.0;
      const k = (y * S + x) * 4;
      img.data[k] = base[0] * v * sh; img.data[k + 1] = base[1] * v * sh; img.data[k + 2] = base[2] * v * sh * 1.04;
      img.data[k + 3] = 255 * clamp((1 - d) * S * 0.5, 0, 1);
    }
    g.putImageData(img, 0, 0);
    return Texture.from(c);
  });
}

// ---------------------------------------------------------------- public factory
export function createPlanet({ type = 'terran', seed = 1, radius = 60, ringed = false, moons = 0, life = 'none' } = {}) {
  const root = animated();
  const R = rng(hashStr(type + seed + 'layout'));
  const atmo = ATMO[type] || ATMO.barren;
  const halo = glowSprite(atmo[0], radius * 1.5, 0.5 * atmo[1], 2.4, 0.64);
  root.addChild(halo);
  const back = new Container(), mid = new Container(), front = new Container();
  root.addChild(back, mid, front);
  const tilt = R.range(-0.25, 0.25);

  let ringTilt = 0;
  if (ringed) {
    const rt = ringTextures(seed, type);
    ringTilt = tilt * 0.6 - 0.3 + R.range(-0.1, 0.1);
    const rr = radius * 4.1; // outer diameter
    const holder = new Container(); holder.rotation = ringTilt;
    const b = new Sprite(rt.back), f = new Sprite(rt.front);
    for (const s of [b, f]) { s.width = rr; s.height = rr * rt.sq / 2; s.anchor.set(0.5, 0); }
    b.y = -rr * rt.sq / 2; f.y = 0;
    const hb = new Container(); hb.rotation = ringTilt; hb.addChild(b);
    holder.addChild(f);
    back.addChild(hb); front.addChild(holder);
  }

  const mesh = makeSphereMesh({ type, seed, life, tilt: tilt * 0.5 });
  mesh.scale.set(radius);
  mid.addChild(mesh);
  const spin = R.range(0.025, 0.06) * (R() < 0.15 ? -1 : 1);
  let t = R() * 10;

  const ms = [];
  const nm = Math.min(3, moons | 0);
  for (let i = 0; i < nm; i++) {
    const s = new Sprite(moonTexture(`${seed}${i}`)); s.anchor.set(0.5);
    s.width = s.height = radius * R.range(0.16, 0.3);
    ms.push({ s, a: R() * TAU, rx: radius * (1.55 + i * 0.5 + R() * 0.2), ry: radius * (0.25 + R() * 0.2), sp: R.range(0.15, 0.45) / (1 + i * 0.6), tilt: R.range(-0.4, 0.4) });
    front.addChild(s);
  }

  root.update = (dt) => {
    t += dt;
    const u = mesh._u;
    u.uRot = (u.uRot + dt * spin) % TAU; u.uCloudRot = (u.uCloudRot + dt * spin * 1.45) % TAU; u.uTime = t;
    halo.alpha = (0.5 + 0.04 * Math.sin(t * 0.7)) * atmo[1];
    for (const m of ms) {
      m.a = (m.a + dt * m.sp) % TAU;
      const x = Math.cos(m.a) * m.rx, y = Math.sin(m.a) * m.ry;
      m.s.x = x * Math.cos(m.tilt) - y * Math.sin(m.tilt); m.s.y = x * Math.sin(m.tilt) + y * Math.cos(m.tilt);
      const behind = Math.sin(m.a) < 0;
      const par = behind ? back : front;
      if (m.s.parent !== par) par.addChild(m.s);
    }
  };
  root.update(0);
  root.radius = radius;
  return root;
}
