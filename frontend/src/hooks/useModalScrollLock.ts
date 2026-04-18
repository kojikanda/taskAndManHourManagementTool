import { useEffect } from "react";

/**
 * モーダルが開いているとき、main-scroll-container のスクロールをロックするカスタムフック。
 * スマホでキーボード表示時に背景がスクロールしてモーダルのタップ位置がズレる問題を防ぐ。
 *
 * @param open true: モーダルを開いている, false: モーダルを閉じている
 */
export function useModalScrollLock(open: boolean) {
  useEffect(() => {
    const el = document.getElementById("main-scroll-container");
    if (!el) return;

    if (open) {
      el.style.overflow = "hidden";

      // iOS Safari, Chromeではoverflowだけではタッチスクロールを止められないため、
      // touchmoveイベントをキャンセルして強制的にスクロールを防止する
      const preventTouch = (e: TouchEvent) => e.preventDefault();
      el.addEventListener("touchmove", preventTouch, { passive: false });

      return () => {
        el.style.overflow = "";
        el.removeEventListener("touchmove", preventTouch);
      };
    }
  }, [open]);
}
