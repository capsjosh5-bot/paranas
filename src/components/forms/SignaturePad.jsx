import { Eraser, PenLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SignaturePad({
  value = "",
  onChange,
  required = false,
  label = "Draw electronic signature",
  helpText = "Use your mouse, touchscreen, stylus, or trackpad. Signing records your authenticated account and submission time.",
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const hasSignatureRef = useRef(false);
  const loadedValueRef = useRef("");
  const [hasSignature, setHasSignature] = useState(Boolean(value));

  function configureContext(ctx) {
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#17251d";
  }

  function drawDataUrl(dataUrl) {
    const canvas = canvasRef.current;
    if (!canvas || !dataUrl) return;

    const image = new Image();
    image.onload = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext("2d");

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);
      configureContext(ctx);
      ctx.drawImage(image, 0, 0, rect.width, rect.height);

      loadedValueRef.current = dataUrl;
      hasSignatureRef.current = true;
      setHasSignature(true);
    };
    image.src = dataUrl;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const previous =
        hasSignatureRef.current && canvas.width && canvas.height
          ? canvas.toDataURL("image/png")
          : null;

      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));

      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      configureContext(ctx);

      if (previous) {
        const image = new Image();
        image.onload = () => {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.drawImage(image, 0, 0, rect.width, rect.height);
        };
        image.src = previous;
      } else if (value) {
        drawDataUrl(value);
      }
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!value) {
      if (loadedValueRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect();
        const ctx = canvas?.getContext("2d");
        if (canvas && rect && ctx) {
          ctx.clearRect(0, 0, rect.width, rect.height);
          configureContext(ctx);
        }
        loadedValueRef.current = "";
        hasSignatureRef.current = false;
        setHasSignature(false);
      }
      return;
    }

    if (value === loadedValueRef.current) return;
    drawDataUrl(value);
  }, [value]);

  function getPosition(event) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPosition(event);

    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function handlePointerMove(event) {
    if (!drawingRef.current) return;

    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const point = getPosition(event);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function finishDrawing(event) {
    if (!drawingRef.current) return;

    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawingRef.current = false;
    ctx.closePath();

    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    const dataUrl = canvas.toDataURL("image/png", 0.9);
    loadedValueRef.current = dataUrl;
    hasSignatureRef.current = true;
    setHasSignature(true);
    onChange?.(dataUrl);
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, rect.width, rect.height);

    loadedValueRef.current = "";
    hasSignatureRef.current = false;
    drawingRef.current = false;
    setHasSignature(false);
    onChange?.("");
  }

  return (
    <div className="signature-field">
      <div className="signature-heading">
        <div className="signature-title">
          <PenLine size={19} />
          <span>
            {label}
            {required ? <span className="required-mark"> *</span> : null}
          </span>
        </div>

        <button
          type="button"
          className="signature-clear-button"
          onClick={clearSignature}
          disabled={!hasSignature}
        >
          <Eraser size={18} />
          Clear
        </button>
      </div>

      <div className="signature-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrawing}
          onPointerCancel={finishDrawing}
          onPointerLeave={(event) => {
            if (drawingRef.current && event.pointerType === "mouse") {
              finishDrawing(event);
            }
          }}
        />
      </div>

      <p className="signature-help">{helpText}</p>

      {required ? (
        <input
          type="hidden"
          required
          value={hasSignature ? "signed" : ""}
          readOnly
        />
      ) : null}
    </div>
  );
}
