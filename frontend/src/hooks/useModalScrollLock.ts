import { useEffect } from "react";

/**
 * モーダルが開いているとき、bodyのスクロールをロックするカスタムフック。
 * スマホでキーボード表示時に背景がスクロールしてモーダルのタップ位置がズレる問題を防ぐ。
 *
 * @param open true: モーダルを開いている, false: モーダルを閉じている
 */
export function useModalScrollLock(open: boolean) {
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;

      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        const y = document.body.style.top;
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";

        window.scrollTo(0, parseInt(y || "0") * -1);
      };
    }
  }, [open]);
}
