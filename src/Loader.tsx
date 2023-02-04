import { useEffect, useState } from "react";
import { cn } from "./util";

interface Props {
  working: boolean;
}

const Loader: React.FC<Props> = ({ working }) => {
  const [loaderPct, setLoaderPct] = useState<number>(0);

  useEffect(() => {
    if (working) {
      setLoaderPct(50);

      const timer = setInterval(() => {
        setLoaderPct((pct) => pct + (100 - pct) / 2);
      }, 2000);

      const cleanup = () => {
        clearInterval(timer);
      };

      return cleanup;
    } else if (loaderPct !== 0) {
      // working just switched off!
      setLoaderPct(100);
      setTimeout(() => {
        setLoaderPct(0);
      }, 500);
    }
  }, [working]);

  return working || loaderPct !== 0 ? (
    <div
      className={cn("App-loader", ["is-complete", loaderPct === 100])}
      style={{ width: `${loaderPct}%` }}
    />
  ) : null;
};

export default Loader;
