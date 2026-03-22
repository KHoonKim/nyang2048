export function attachSwipeListener(element, onSwipe) {
  let startX, startY, startTime;
  const MAX_TIME = 500;
  // MIN_DISTANCE is 8% of element size, clamped between 15px and 40px
  const getMinDistance = () => {
    const size = Math.min(element.offsetWidth, element.offsetHeight);
    return Math.max(15, Math.min(40, size * 0.08));
  };

  function onTouchStart(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  }

  function onTouchMove(e) {
    e.preventDefault(); // Prevent Toss webview scroll conflict
  }

  function onTouchEnd(e) {
    if (startX === undefined) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    const dt = Date.now() - startTime;
    if (dt > MAX_TIME) return;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < getMinDistance()) return;

    if (absDx > absDy) {
      onSwipe(dx > 0 ? 'right' : 'left');
    } else {
      onSwipe(dy > 0 ? 'down' : 'up');
    }
  }

  // Also support keyboard for desktop testing
  function onKeyDown(e) {
    const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
    if (map[e.key]) {
      e.preventDefault();
      onSwipe(map[e.key]);
    }
  }

  // Mouse drag support for desktop
  function onMouseDown(e) {
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
  }

  function onMouseUp(e) {
    if (startX === undefined) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dt = Date.now() - startTime;
    if (dt > MAX_TIME) return;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < getMinDistance()) return;

    if (absDx > absDy) {
      onSwipe(dx > 0 ? 'right' : 'left');
    } else {
      onSwipe(dy > 0 ? 'down' : 'up');
    }
    startX = undefined;
  }

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: false });
  element.addEventListener('touchend', onTouchEnd);
  element.addEventListener('mousedown', onMouseDown);
  element.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('mousedown', onMouseDown);
    element.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
  };
}
