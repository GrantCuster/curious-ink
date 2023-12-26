import { useEffect, useRef, useState } from "react";
import { getStroke } from "perfect-freehand";
import { predictImage } from "./modelUtils";
import { useAtom } from "jotai";
import {
  expandedAtom,
  isGeneratingAtom,
  prefixAtom,
  promptAtom,
  responseAtom,
} from "./atoms";
import { extractTextBetweenBackticks } from "./utils";
import { MinusIcon, PlusIcon } from "lucide-react";

function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className="relative bg-neutral-200 antialiased">
      {loaded ? (
        <div className="max-w-[512px] flex flex-col gap-2 mx-auto">
          <div className="font-bold mt-4 text-xl">Curious Ink</div>
          <div className="-mt-1">
            Made with the{" "}
            <a
              target="_blank"
              className="underline"
              href="https://ai.google.dev/"
            >
              Gemini API
            </a>
          </div>
          <Drawing />
          <Results />
          <Debug />
        </div>
      ) : null}
    </div>
  );
}

export default App;

function Results() {
  const [response] = useAtom(responseAtom);
  const [prefix] = useAtom(prefixAtom);
  const [isGenerating] = useAtom(isGeneratingAtom);

  function attemptParse(s: string) {
    try {
      const parsed = JSON.parse(extractTextBetweenBackticks(s)[0]);
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        const k = Object.keys(parsed)[0];
        return parsed[k];
      }
    } catch (e) {
      return [];
    }
  }

  const parsed = response.includes("```json") ? attemptParse(response) : [];

  return (
    <div className="">
      {isGenerating ? (
        <div className="animate-pulse"></div>
      ) : (
        <div className="text-2xl font-bold text-neutral-400">
          {parsed.map((query: string) => {
            return (
              <div key={query}>
                <a
                  href={prefix + encodeURIComponent(query)}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  {query}
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Drawing() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const w = 512;
  const h = 512;
  const pointsRef = useRef<[number, number, number][]>([]);
  const timeoutRef = useRef(-1);
  const [isGenerating, setIsGenerating] = useAtom(isGeneratingAtom);
  const [response, setResponse] = useAtom(responseAtom);
  const [prompt] = useAtom(promptAtom);

  function drawPoints() {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "black";
      for (const line of pointsRef.current!) {
        const outlinePoints = getStroke(line, {
          size: 4,
          simulatePressure: false,
        });
        const pathData = getSvgPathFromStroke(outlinePoints);
        ctx!.fillStyle = "black";
        const path = new Path2D(pathData);
        ctx.fill(path);
      }
    }
  }

  useEffect(() => {
    function resetTimeout() {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        // console.log("send");
        localStorage.setItem("paths", JSON.stringify(pointsRef.current));
      }, 1000);
    }

    function handlePointerDown(e) {
      e.target.setPointerCapture(e.pointerId);
      const bounds = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      pointsRef.current.push([[x, y, 1]]);
      drawPoints();
      resetTimeout();
    }

    function handlePointerMove(e) {
      if (e.buttons !== 1) return;
      const bounds = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      const currentPoints = pointsRef.current[pointsRef.current.length - 1];
      currentPoints.push([x, y, 1]);
      drawPoints();
      resetTimeout();
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  useEffect(() => {
    const paths = localStorage.getItem("paths");
    if (paths) {
      pointsRef.current = JSON.parse(paths);
      drawPoints();
    }
  }, []);

  return (
    <div className="">
      <div className="">
        <canvas
          className="bg-white mt-1 block cursor-crosshair"
          ref={canvasRef}
          width={w}
          height={h}
        />
        <div className="flex justify-between rounded-bl-2xl rounded-br-2xl px-2 py-2 bg-neutral-300 w-[512px] gap-1 items-center">
          <button
            className="border rounded-full bg-black text-white py-1 px-3 hover:bg-neutral-700"
            onClick={() => {
              const c = canvasRef.current!;
              const ctx = c.getContext("2d")!;
              ctx.clearRect(0, 0, w, h);
              pointsRef.current = [];
              setResponse("");
            }}
          >
            clear
          </button>
          {isGenerating ? (
            <div className="animate-pulse">Generating...</div>
          ) : (
            <button
              className="border rounded-full bg-black text-white py-1 px-3 hover:bg-neutral-700"
              onClick={async () => {
                setIsGenerating(true);
                try {
                  const pngUrl = canvasRef
                    .current!.toDataURL()
                    .replace("data:image/png;base64,", "");
                  const res = await predictImage(pngUrl, prompt);
                  const val = res.text;
                  setResponse(val);
                } catch (e) {
                  setResponse("");
                  alert(e.error);
                }
                setIsGenerating(false);
              }}
            >
              send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Debug() {
  const [response] = useAtom(responseAtom);
  const [expanded, setExpanded] = useAtom(expandedAtom);
  return (
    <div className="mt-4">
      <div className="w-full flex items-center gap-2">
        <button
          className="px-2 py-1 bg-neutral-300 flex text-sm items-center gap-2 hover:bg-neutral-400 rounded-full"
          onClick={() => {
            setExpanded(!expanded);
          }}
        >
          {expanded ? <MinusIcon size={14} /> : <PlusIcon size={14} />} Debug
        </button>
      </div>
      {expanded ? (
        <>
          <div className="">Raw response</div>
          {response.length > 0 ? (
            <div className="text-xs font-mono mb-1">{response}</div>
          ) : null}
          <PromptEditor />
          <PrefixEditor />
        </>
      ) : null}
    </div>
  );
}

function PromptEditor() {
  const [prompt, setPrompt] = useAtom(promptAtom);

  return (
    <>
      <div className="text-sm mb-1">Prompt editor</div>
      <textarea
        className="w-full text-sm px-2 py-1"
        value={prompt}
        rows={4}
        onChange={(e) => {
          setPrompt(e.currentTarget.value);
        }}
      />
    </>
  );
}

function PrefixEditor() {
  const [prefix, setPrefix] = useAtom(prefixAtom);

  return (
    <>
      <div className="text-sm mb-1">URL prefix</div>
      <input
        className="w-full text-sm px-2 py-1"
        value={prefix}
        onChange={(e) => {
          setPrefix(e.currentTarget.value);
        }}
      />
    </>
  );
}

const average = (a, b) => (a + b) / 2;

function getSvgPathFromStroke(points, closed = true) {
  const len = points.length;

  if (len < 4) {
    return ``;
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
    2
  )},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
    b[1],
    c[1]
  ).toFixed(2)} T`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
      2
    )} `;
  }

  if (closed) {
    result += "Z";
  }

  return result;
}
