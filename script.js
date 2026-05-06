const completeIntro = () => {
  document.body.classList.add("intro-complete");
};

const setStableHeroHeight = () => {
  document.documentElement.style.setProperty("--hero-vh", `${window.innerHeight}px`);
};

const unlockMainContent = () => {
  document.body.classList.remove("content-locked");
};

setStableHeroHeight();
let lastViewportWidth = window.innerWidth;

const introVideo = document.getElementById("introVideo");

if (introVideo) {
  let fallbackTimer;
  let introHasStarted = false;
  let autoplayRetryTimer;
  const autoplayRetrySchedule = [120, 320];

  const resetIntroState = () => {
    window.clearTimeout(fallbackTimer);
    window.clearTimeout(autoplayRetryTimer);
    introHasStarted = false;
    document.body.classList.remove("intro-complete");
    introVideo.pause();

    try {
      introVideo.currentTime = 0;
    } catch (_error) {
      // Ignore browsers that block currentTime before metadata is ready.
    }
  };

  const scheduleFallback = () => {
    window.clearTimeout(fallbackTimer);
    const durationMs = Number.isFinite(introVideo.duration)
      ? Math.max(2500, introVideo.duration * 1000 + 250)
      : 6500;

    fallbackTimer = window.setTimeout(completeIntro, durationMs);
  };

  const tryPlayIntro = () =>
    introVideo.play().then(() => {
      introHasStarted = true;
      scheduleFallback();
    });

  const startIntroAutoplay = () => {
    let attemptIndex = 0;

    const tryWithRetry = () => {
      if (introHasStarted || document.body.classList.contains("intro-complete")) {
        return;
      }

      tryPlayIntro().catch(() => {
        if (attemptIndex >= autoplayRetrySchedule.length) {
          completeIntro();
          return;
        }

        const delay = autoplayRetrySchedule[attemptIndex];
        attemptIndex += 1;
        autoplayRetryTimer = window.setTimeout(tryWithRetry, delay);
      });
    };

    tryWithRetry();
  };

  introVideo.addEventListener("loadedmetadata", scheduleFallback, { once: true });
  introVideo.addEventListener("playing", () => {
    introHasStarted = true;
    window.clearTimeout(autoplayRetryTimer);
  });
  introVideo.addEventListener("ended", () => {
    window.clearTimeout(fallbackTimer);
    window.clearTimeout(autoplayRetryTimer);
    completeIntro();
  });
  introVideo.addEventListener("error", completeIntro, { once: true });

  introVideo.muted = true;
  introVideo.defaultMuted = true;
  introVideo.playsInline = true;
  introVideo.autoplay = true;
  resetIntroState();
  introVideo.load();
  startIntroAutoplay();

  scheduleFallback();

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      resetIntroState();
      introVideo.load();
      startIntroAutoplay();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !introHasStarted && !document.body.classList.contains("intro-complete")) {
      startIntroAutoplay();
    }
  });
} else {
  completeIntro();
}

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.scrollTarget);

    if (target) {
      if (document.body.classList.contains("content-locked")) {
        unlockMainContent();
        window.requestAnimationFrame(() => {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const entryCardCloseButton = document.querySelector(".entry-card-close");
const entryCard = document.querySelector(".entry-card");
const topRegister = document.querySelector(".top-register");
const learnMoreButton = document.querySelector(".learn-more");
const heroShade = document.querySelector(".hero-shade");
const slotBg = document.querySelector(".slot-bg");
const spinButton = document.querySelector(".spin-button");
const demoOverlay = document.querySelector(".demo-overlay");
const demoPlayer = document.getElementById("demoPlayer");
const originalSlotBg = slotBg ? getComputedStyle(slotBg).backgroundImage : "url('assets/img/newslot.png')";
const demoSources = [
  "assets/demo/fisrt.webm",
  "assets/demo/twice.webm",
  "assets/demo/bigwin.webm",
];
let demoIndex = 0;
let spinCount = 0;

const preloadDemoVideos = () => {
  demoSources.forEach((src) => {
    const preloader = document.createElement("video");
    preloader.src = src;
    preloader.preload = "auto";
    preloader.muted = true;
    preloader.playsInline = true;
    preloader.setAttribute("aria-hidden", "true");
    preloader.style.position = "absolute";
    preloader.style.width = "1px";
    preloader.style.height = "1px";
    preloader.style.opacity = "0";
    preloader.style.pointerEvents = "none";
    preloader.style.visibility = "hidden";
    document.body.appendChild(preloader);
  });
};

const captureLastFrame = () => {
  if (!demoPlayer || !slotBg || !demoPlayer.videoWidth || !demoPlayer.videoHeight) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = demoPlayer.videoWidth;
  canvas.height = demoPlayer.videoHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.drawImage(demoPlayer, 0, 0, canvas.width, canvas.height);
  slotBg.style.backgroundImage = `url('${canvas.toDataURL("image/png")}')`;
  slotBg.style.backgroundSize = "cover";
};

let demoPending = false;

const showDemoOverlay = () => {
  demoOverlay.classList.add("visible");
  demoOverlay.classList.remove("playing");
};

const hideDemoOverlay = () => {
  demoOverlay.classList.remove("visible");
  demoOverlay.classList.remove("playing");
  demoOverlay.classList.add("hidden");
};

if (spinButton && demoPlayer && demoOverlay) {
  spinButton.addEventListener("click", () => {
    demoPlayer.src = demoSources[demoIndex];
    demoPlayer.preload = "auto";
    demoPlayer.load();
    demoPending = true;
    demoIndex = (demoIndex + 1) % demoSources.length;
    spinCount += 1;
  });
}

if (demoPlayer && demoOverlay) {
  const playDemoWhenReady = () => {
    if (!demoPending) {
      return;
    }

    demoPending = false;
    demoOverlay.classList.remove("hidden");
    showDemoOverlay();
    demoOverlay.classList.add("playing");
    demoPlayer.play().catch(() => {
      // ignore play failed due to autoplay restrictions
    });
  };

  demoPlayer.addEventListener("canplay", playDemoWhenReady);
  demoPlayer.addEventListener("loadeddata", playDemoWhenReady);

  demoPlayer.addEventListener("ended", () => {
    hideDemoOverlay();

    if (spinCount >= 3) {
      slotBg?.style.setProperty("background-image", originalSlotBg);
      window.requestAnimationFrame(() => {
        entryCard?.classList.remove("hidden");
        topRegister?.classList.remove("hidden");
        learnMoreButton?.classList.remove("hidden");
        spinButton?.classList.add("hidden");
      });
      spinCount = 0;
    } else {
      captureLastFrame();
    }
  });
}

window.addEventListener("load", preloadDemoVideos);

if (entryCardCloseButton && entryCard) {
  entryCardCloseButton.addEventListener("click", () => {
    entryCard.classList.add("hidden");
    topRegister?.classList.add("hidden");
    learnMoreButton?.classList.add("hidden");
    heroShade?.classList.add("hidden");
    spinButton?.classList.remove("hidden");
    unlockMainContent();
    document.body.classList.add("intro-complete");
    if (introVideo) {
      introVideo.pause();
    }
  });
}

if (window.location.hash) {
  unlockMainContent();
}

const toggleFloatingCta = () => {
  document.body.classList.toggle("has-scrolled", window.scrollY > window.innerHeight * 0.55);
};

window.addEventListener("scroll", toggleFloatingCta, { passive: true });
window.addEventListener("orientationchange", () => {
  window.setTimeout(() => {
    setStableHeroHeight();
    toggleFloatingCta();
  }, 200);
});
window.addEventListener("resize", () => {
  const currentWidth = window.innerWidth;

  if (Math.abs(currentWidth - lastViewportWidth) > 1) {
    lastViewportWidth = currentWidth;
    setStableHeroHeight();
  }

  toggleFloatingCta();
});
toggleFloatingCta();
