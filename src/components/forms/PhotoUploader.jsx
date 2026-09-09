import { Camera, Trash2 } from "lucide-react";
import { useState } from "react";
import { compressImage } from "../../utils/image";

export default function PhotoUploader({ value, onChange, required = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setLoading(true);

    try {
      const dataUrl = await compressImage(file, {
        maxWidth: 420,
        maxHeight: 420,
        quality: 0.76,
      });

      if (dataUrl.length > 550000) {
        throw new Error(
          "The processed photo is still too large. Please choose a smaller image."
        );
      }

      onChange?.(dataUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="photo-upload-wrap scholarship-photo-upload">
      <div className="photo-preview">
        {value ? (
          <img src={value} alt="Applicant 2x2 preview" />
        ) : (
          <Camera size={34} />
        )}
      </div>

      <div className="photo-upload-copy">
        <div className="photo-upload-title">
          <strong>
            Applicant 2×2 Photo
            {required ? <span className="required-mark"> *</span> : null}
          </strong>
          <span>
            Upload a clear, recent ID-style photo with your face fully visible.
          </span>
        </div>

        <div className="photo-upload-actions">
          <label className="button button-secondary file-button">
            <Camera size={17} />
            {loading
              ? "Processing…"
              : value
                ? "Replace Photo"
                : "Upload Photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFile}
              disabled={loading}
            />
          </label>

          {value ? (
            <button
              type="button"
              className="text-button danger-text"
              onClick={() => onChange?.("")}
            >
              <Trash2 size={16} /> Remove
            </button>
          ) : null}
        </div>

        <p>Accepted formats: JPG, PNG, or WebP. The image is optimized automatically.</p>
        {error ? <span className="field-error">{error}</span> : null}
      </div>
    </div>
  );
}
