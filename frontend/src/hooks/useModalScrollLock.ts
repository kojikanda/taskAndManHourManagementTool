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
    el.style.overflow = open ? "hidden" : "";
    return () => {
      el.style.overflow = "";
    };
  }, [open]);
}
