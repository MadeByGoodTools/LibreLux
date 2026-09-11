"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function VideoLab({ open, onOpenChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [exposure, setExposure] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  const filter = `brightness(${Math.pow(2, exposure)}) contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100}) hue-rotate(${hue}deg)`;
  const chooseFile = (next?: File) => {
    if (!next) return;
    if (url) URL.revokeObjectURL(url);
    const nextUrl = URL.createObjectURL(next);
    setFile(next);
    setUrl(nextUrl);
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
  };
  const drawFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const rotated = Math.abs(rotation % 180) === 90;
    canvas.width = rotated ? video.videoHeight : video.videoWidth;
    canvas.height = rotated ? video.videoWidth : video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.filter = filter;
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(
      video,
      -video.videoWidth / 2,
      -video.videoHeight / 2,
      video.videoWidth,
      video.videoHeight,
    );
  };
  const captureStill = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    drawFrame(video, canvas);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const frameUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = frameUrl;
      anchor.download = `${file?.name.replace(/\.[^.]+$/, "") ?? "video"}-poster.png`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(frameUrl), 1000);
    }, "image/png");
  };
  const exportVideo = async () => {
    const video = videoRef.current;
    if (!video || !file || !window.MediaRecorder) return;
    setExporting(true);
    const canvas = document.createElement("canvas");
    drawFrame(video, canvas);
    const stream = canvas.captureStream(30);
    const candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    const mimeType =
      candidates.find((type) => MediaRecorder.isTypeSupported(type)) ??
      "video/webm";
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 12_000_000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) =>
      event.data.size && chunks.push(event.data);
    const finished = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    });
    video.currentTime = trimStart;
    await new Promise<void>((resolve) => {
      const ready = () => {
        video.removeEventListener("seeked", ready);
        resolve();
      };
      video.addEventListener("seeked", ready);
    });
    recorder.start(250);
    await video.play();
    await new Promise<void>((resolve) => {
      const render = () => {
        drawFrame(video, canvas);
        if (video.currentTime >= (trimEnd || duration) || video.ended)
          resolve();
        else requestAnimationFrame(render);
      };
      render();
    });
    video.pause();
    recorder.stop();
    const blob = await finished;
    const outputUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = outputUrl;
    anchor.download = `${file.name.replace(/\.[^.]+$/, "")}-LibreLux.webm`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(outputUrl), 1000);
    setExporting(false);
  };
  const applyPreset = (name: "clean" | "cinema" | "mono") => {
    if (name === "clean") {
      setExposure(0.15);
      setContrast(8);
      setSaturation(10);
      setHue(0);
    } else if (name === "cinema") {
      setExposure(-0.1);
      setContrast(18);
      setSaturation(-8);
      setHue(-4);
    } else {
      setExposure(0);
      setContrast(24);
      setSaturation(-100);
      setHue(0);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="video-lab-dialog">
        <DialogHeader>
          <DialogTitle>Video lab</DialogTitle>
          <DialogDescription>
            Trim and grade a clip locally, capture a poster frame, or export a
            browser-encoded WebM.
          </DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept="video/*"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        {url ? (
          <>
            <video
              ref={videoRef}
              src={url}
              controls
              style={{ filter, transform: `rotate(${rotation}deg)` }}
              onLoadedMetadata={(event) => {
                const value = event.currentTarget.duration || 0;
                setDuration(value);
                setTrimEnd(value);
              }}
            />
            <div className="video-presets">
              <button onClick={() => applyPreset("clean")}>Clean</button>
              <button onClick={() => applyPreset("cinema")}>Cinema</button>
              <button onClick={() => applyPreset("mono")}>Monochrome</button>
              <button
                onClick={() => setRotation((value) => (value + 90) % 360)}
              >
                Rotate 90°
              </button>
            </div>
            <div className="video-controls">
              <label>
                <span>Trim start</span>
                <input
                  type="number"
                  min="0"
                  max={trimEnd}
                  step="0.1"
                  value={trimStart}
                  onChange={(event) =>
                    setTrimStart(Math.min(trimEnd, Number(event.target.value)))
                  }
                />
              </label>
              <label>
                <span>Trim end</span>
                <input
                  type="number"
                  min={trimStart}
                  max={duration}
                  step="0.1"
                  value={trimEnd}
                  onChange={(event) =>
                    setTrimEnd(Math.max(trimStart, Number(event.target.value)))
                  }
                />
              </label>
              {[
                ["Exposure", exposure, -2, 2, setExposure],
                ["Contrast", contrast, -100, 100, setContrast],
                ["Saturation", saturation, -100, 100, setSaturation],
                ["Hue", hue, -180, 180, setHue],
              ].map(([label, value, min, max, setter]) => (
                <label key={String(label)}>
                  <span>{String(label)}</span>
                  <Slider
                    value={[Number(value)]}
                    min={Number(min)}
                    max={Number(max)}
                    step={label === "Exposure" ? 0.05 : 1}
                    onValueChange={(next) =>
                      (setter as (value: number) => void)(next[0])
                    }
                  />
                </label>
              ))}
            </div>
          </>
        ) : (
          <button
            className="video-drop"
            onClick={() => inputRef.current?.click()}
          >
            Choose a video
          </button>
        )}
        <DialogFooter>
          {file && (
            <button onClick={() => inputRef.current?.click()}>
              Replace clip
            </button>
          )}
          <button disabled={!file} onClick={captureStill}>
            Save poster frame
          </button>
          <button
            className="primary-button"
            disabled={!file || exporting}
            onClick={() => void exportVideo()}
          >
            {exporting ? "Exporting…" : "Export video"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
