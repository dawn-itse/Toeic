/**
 * Confetti celebration effect using canvas-confetti CDN
 * Tải confetti từ CDN và kích hoạt khi học viên trả lời đúng / nộp bài điểm cao.
 */

declare global {
  interface Window {
    confetti?: (options?: Record<string, unknown>) => void;
  }
}

let confettiLoaded = false;

function loadConfettiScript(): Promise<void> {
  return new Promise((resolve) => {
    if (confettiLoaded || window.confetti) {
      confettiLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
    script.onload = () => {
      confettiLoaded = true;
      resolve();
    };
    script.onerror = () => resolve(); // Graceful fallback - không crash app nếu CDN fail
    document.head.appendChild(script);
  });
}

/** Pháo hoa nhẹ nhàng khi trả lời đúng 1 từ */
export async function fireConfettiSmall() {
  await loadConfettiScript();
  if (!window.confetti) return;
  window.confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.7 },
    colors: ['#5A5A40', '#99B080', '#F5DEB3', '#C8C8A9', '#F27D7D'],
    ticks: 120,
    gravity: 0.9,
    scalar: 0.85,
  });
}

/** Pháo hoa lớn - ăn mừng khi hoàn thành bài thi / đạt điểm cao */
export async function fireConfettiBig() {
  await loadConfettiScript();
  if (!window.confetti) return;

  // Bắn từ 2 bên để tạo hiệu ứng đẹp hơn
  const count = 200;
  const defaults = { origin: { y: 0.7 }, colors: ['#5A5A40', '#99B080', '#F5DEB3', '#FFD700', '#F27D7D'] };

  function fire(particleRatio: number, opts: Record<string, unknown>) {
    window.confetti!({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}
