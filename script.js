const section = document.querySelector(".cinema-scroll");
const stage = document.querySelector(".stage");
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const track = document.querySelector(".sights-track");
const sightsControls = document.querySelector(".sights-controls");
const sightPrev = document.querySelector(".sight-prev");
const sightNext = document.querySelector(".sight-next");
const originalSightCards = Array.from(track.querySelectorAll(".sight-card"));

let targetMouseX = 0;
let targetMouseY = 0;
let mouseX = 0;
let mouseY = 0;
let targetScroll = 0;
let smoothScroll = 0;
let initialized = false;
let rafPending = false;
let sightCards = [];
const originalSightCount = originalSightCards.length;
let activeSight = originalSightCount;
let lastFrameTime = 0;
const variableCache = new Map();

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smoothstep = (e0, e1, v) => {
  const x = clamp((v - e0) / (e1 - e0));
  return x * x * (3 - 2 * x);
};
const lerp = (a, b, t) => a + (b - a) * t;
const segmentInOut = (s, a, b, c, d) => {
  const enter = smoothstep(a, b, s);
  const exit = smoothstep(c, d, s);
  return { enter, exit, active: enter * (1 - exit) };
};
const getScrollDistance = () => clamp(-section.getBoundingClientRect().top, 0, section.offsetHeight - window.innerHeight);

function setVariable(name, value) {
  const next = String(value);
  if (variableCache.get(name) === next) return;
  variableCache.set(name, next);
  stage.style.setProperty(name, next);
}

function update(timestamp = performance.now()) {
  rafPending = false;
  const delta = lastFrameTime ? Math.min(50, timestamp - lastFrameTime) : 16.67;
  const scrollBlend = 1 - Math.exp(-delta / 72);
  const mouseBlend = 1 - Math.exp(-delta / 48);
  lastFrameTime = timestamp;
  targetScroll = getScrollDistance();

  if (!initialized || reduceMotion.matches) {
    smoothScroll = targetScroll;
    mouseX = 0;
    mouseY = 0;
    initialized = true;
  } else {
    smoothScroll = lerp(smoothScroll, targetScroll, scrollBlend);
    mouseX = lerp(mouseX, targetMouseX, mouseBlend);
    mouseY = lerp(mouseY, targetMouseY, mouseBlend);
  }

  if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;

  const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
  const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
  const progress = clamp(smoothScroll / 2700);
  const introExit = smoothstep(90, 650, smoothScroll);
  const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
  const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
  const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
  const blurActive = clamp(frame2.active + frame3.active);
  const frame2Opacity = frame2.active * (1 - frame3.enter);
  const splitDrift = Math.pow(frame2.enter, 1.5);
  const panel2Opacity = frame2.active * (1 - frame2.exit);
  const panel3Opacity = frame3.active * (1 - frame3.exit);
  const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
  const sharedHeroY = progress * -74;
  const sharedHeroScale = progress * 0.23;
  const sightsScreenTop = Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50;
  const sightsParentTop = window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale;

  setVariable("--mx", (reduceMotion.matches ? 0 : mouseX).toFixed(4));
  setVariable("--my", (reduceMotion.matches ? 0 : mouseY).toFixed(4));
  setVariable("--back-opacity", 1 - frame2.active * 0.06);
  setVariable("--back-x", `${mouseX * -12}px`);
  setVariable("--back-y", `${mouseY * -4}px`);
  setVariable("--back-scale", backScale);
  setVariable("--four-y", `${10 + progress * 10}vh`);
  setVariable("--four-scale", 0.78 + progress * 0.16);
  setVariable("--bazaar-y", `${20 - progress * 8}vh`);
  setVariable("--blur-px", `${blurActive * 14}px`);
  setVariable("--back-brightness", 1 - blurActive * 0.255);
  setVariable("--bazaar-blur-px", `${frame2.active * 14}px`);
  setVariable("--bazaar-brightness", 1 - frame2.active * 0.255 - frame3.active * 0.06);
  setVariable("--bazaar-saturation", 1 + frame3.active * 0.18);
  setVariable("--shade-opacity", "1");
  setVariable("--shade-z", frame2.active > 0.02 ? "2" : "0");
  setVariable("--shade-top-alpha", blurActive * 0.465);
  setVariable("--shade-mid-alpha", blurActive * 0.42);
  setVariable("--shade-bottom-alpha", blurActive * 0.51);
  setVariable("--title-y", `${introExit * -210}px`);
  setVariable("--title-scale", 1 - introExit * 0.08);
  setVariable("--title-opacity", 1 - introExit);
  setVariable("--bridge-x", `calc(-50% + ${mouseX * 18}px)`);
  setVariable("--bridge-y", `${mouseY * 8 + sharedHeroY - frame2.exit * 760}px`);
  setVariable("--bridge-bottom", `${5 - frame2.enter * 13}vh`);
  setVariable("--bridge-width", `${67.2 + frame2.enter * 37.8}vw`);
  setVariable("--bridge-scale", 1.02 + sharedHeroScale + frame2.exit * 0.46);
  setVariable("--split-left-x", `calc(-50% + ${-splitDrift * 46}vw + ${mouseX * 22}px)`);
  setVariable("--split-left-y", `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`);
  setVariable("--split-left-scale", 1 + sharedHeroScale + frame2.enter * 0.74);
  setVariable("--split-right-x", `calc(-50% + ${splitDrift * 46}vw + ${mouseX * 22}px)`);
  setVariable("--split-right-y", `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`);
  setVariable("--split-right-scale", 1 + sharedHeroScale + frame2.enter * 0.74);
  setVariable("--frame2-opacity", frame2Opacity);
  setVariable("--frame2-x", `calc(-50% + ${mouseX * 10}px)`);
  setVariable("--frame2-y", `calc(-50% + ${mouseY * 8 - frame2.exit * 150}px)`);
  setVariable("--frame2-scale", 1.06 + frame2.enter * 0.08 + frame2.exit * 0.08);
  setVariable("--intro-copy-y", `${introExit * 90}px`);
  setVariable("--intro-copy-opacity", 1 - introExit);
  setVariable("--panel2-opacity", panel2Opacity);
  setVariable("--panel2-y", `calc(-50% + ${-frame2.exit * 86 + (1 - frame2.enter) * 58}px)`);
  setVariable("--panel3-opacity", panel3Opacity);
  setVariable("--panel3-y", `calc(-50% + ${-frame3.exit * 86 + (1 - frame3.enter) * 58}px)`);
  setVariable("--sights-opacity", sightsEnter);
  setVariable("--sights-controls-opacity", sightsControlsEnter);
  sightsControls.classList.toggle("is-ready", sightsControlsEnter > 0.98);
  setVariable("--sights-visibility", sightsEnter > 0.01 ? "visible" : "hidden");
  setVariable("--sights-y", "0px");
  setVariable("--sights-enter-x", `${(1 - sightsEnter) * 420}vw`);
  setVariable("--sights-scale", 1 / backScale);
  setVariable("--sights-top", `${sightsParentTop}px`);
  setVariable("--sights-screen-top", `${sightsScreenTop}px`);

  if (Math.abs(smoothScroll - targetScroll) > 0.08 || Math.abs(mouseX - targetMouseX) > 0.001 || Math.abs(mouseY - targetMouseY) > 0.001) requestTick();
}

function requestTick() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(update);
}

function setupSightSlider() {
  track.replaceChildren();
  for (let setIndex = 0; setIndex < 3; setIndex += 1) {
    originalSightCards.forEach((card, cardIndex) => {
      const clone = card.cloneNode(true);
      clone.dataset.sightIndex = String(setIndex * originalSightCount + cardIndex);
      track.append(clone);
    });
  }
  sightCards = Array.from(track.querySelectorAll(".sight-card"));
  activeSight = originalSightCount;
  sightCards.forEach((card) => {
    card.addEventListener("click", () => selectSightCard(card));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSightCard(card);
      }
    });
  });
  track.addEventListener("transitionend", normalizeSightSlider);
  updateSightSlider();
}

function updateSightSlider() {
  if (!sightCards.length) return;
  const cardWidth = sightCards[0].offsetWidth;
  const gap = parseFloat(getComputedStyle(track).columnGap || "0");
  setVariable("--sights-shift", `${-(cardWidth + gap) * activeSight}px`);
  sightCards.forEach((card, index) => card.classList.toggle("is-active", index === activeSight));
}

function moveSightSlider(dir) {
  activeSight += dir;
  updateSightSlider();
}

function selectSightCard(card) {
  const index = Number(card.dataset.sightIndex);
  if (Number.isFinite(index)) activeSight = index;
  updateSightSlider();
}

function jumpSightSlider(index) {
  track.classList.add("is-jumping");
  activeSight = index;
  updateSightSlider();
  requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove("is-jumping")));
}

function normalizeSightSlider() {
  if (activeSight >= originalSightCount * 2) jumpSightSlider(activeSight - originalSightCount);
  else if (activeSight < originalSightCount) jumpSightSlider(activeSight + originalSightCount);
}

window.addEventListener("scroll", requestTick, { passive: true });
window.addEventListener("resize", () => {
  updateSightSlider();
  requestTick();
});
reduceMotion.addEventListener?.("change", requestTick);
window.addEventListener("pointermove", (event) => {
  targetMouseX = event.clientX / window.innerWidth - 0.5;
  targetMouseY = event.clientY / window.innerHeight - 0.5;
  requestTick();
}, { passive: true });
sightPrev.addEventListener("click", () => moveSightSlider(-1));
sightNext.addEventListener("click", () => moveSightSlider(1));

setupSightSlider();
requestTick();
