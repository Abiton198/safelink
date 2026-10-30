/**
 * components/scan/ScanCamera.tsx
 * ---------------------------------------------------------------------------
 * Full-screen camera that reads a SafeLink QR code.
 *
 * How it works:
 *   1. Asks the browser for the back camera (the browser shows its own
 *      "Allow camera?" prompt).
 *   2. Every animation frame, copies the video picture onto a hidden canvas
 *      and asks the `jsqr` library to look for a QR code in it.
 *   3. When a code is found, we check that it is a SafeLink address
 *      (".../scan/<token>"). If yes, we go to /scan/<token>, where the only
 *      thing asked is the owner's date of birth.
 *
 * Safety: we only ever use the <token> part of the scanned address and move
 * around INSIDE this app. We never open whatever link a QR code contains.
 *
 * Notes:
 *   - Cameras only work on HTTPS (or http://localhost while developing).
 *   - The camera is always switched off when this component closes.
 *
 * Install the one dependency:  npm install jsqr
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";

type ScanCameraProps = {
    /** Called when the person presses "Close". */
    onClose: () => void;
};

/** Pulls the tag token out of "https://site/scan/<token>", or returns null. */
function extractToken(text: string): string | null {
    try {
        const url = new URL(text.trim());
        const match = url.pathname.match(/^\/scan\/([^/]+)\/?$/);
        return match ? decodeURIComponent(match[1]) : null;
    } catch {
        return null; // not a web address at all
    }
}

export function ScanCamera({ onClose }: ScanCameraProps) {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [status, setStatus] = useState("Starting camera…");
    const [problem, setProblem] = useState("");

    useEffect(() => {
        let stream: MediaStream | null = null;
        let frameId = 0;
        let stopped = false; // set when we leave, so the loop ends

        /** Looks at one video frame for a QR code. Repeats until stopped. */
        function scanFrame() {
            if (stopped) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(image.data, image.width, image.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code?.data) {
                        const token = extractToken(code.data);

                        if (token) {
                            stopped = true;
                            navigate(`/scan/${encodeURIComponent(token)}`);
                            return;
                        }

                        // A QR code, but not ours. Say so and keep looking.
                        setStatus("That is not a SafeLink tag. Try another code.");
                    }
                }
            }

            frameId = requestAnimationFrame(scanFrame);
        }

        async function start() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } }, // back camera
                    audio: false,
                });

                if (stopped) {
                    // Closed while the permission prompt was open.
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                const video = videoRef.current;
                if (!video) return;

                video.srcObject = stream;
                await video.play();

                setStatus("Point the camera at the QR code on the tag.");
                frameId = requestAnimationFrame(scanFrame);
            } catch (err) {
                const name = (err as { name?: string })?.name;
                setProblem(
                    name === "NotAllowedError"
                        ? "Camera access was blocked. Allow the camera in your browser settings and try again."
                        : "Could not open the camera on this device."
                );
            }
        }

        void start();

        // Cleanup: stop the loop and switch the camera OFF.
        return () => {
            stopped = true;
            cancelAnimationFrame(frameId);
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [navigate]);

    return (
        <div className="scan-camera" role="dialog" aria-label="Scan SafeLink tag">
            {/* playsInline + muted are required for video to play on iPhones */}
            <video ref={videoRef} className="scan-video" playsInline muted />
            {/* Hidden: only used to read pixels from the video */}
            <canvas ref={canvasRef} hidden />

            {/* Square guide drawn over the video */}
            <div className="scan-frame" aria-hidden="true" />

            <div className="scan-camera-bar">
                <p>{problem || status}</p>
                <button type="button" className="button secondary" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}