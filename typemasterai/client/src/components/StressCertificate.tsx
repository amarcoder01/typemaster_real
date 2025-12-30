import { useRef, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Check, ChevronDown, FileImage, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getTypingPerformanceRating, triggerCelebration } from "@/lib/share-utils";
import { generateVerificationQRCode } from "@/lib/qr-code-utils";
import { jsPDF } from "jspdf";

interface StressCertificateProps {
  wpm: number;
  accuracy: number;
  consistency: number;
  difficulty: string;
  stressScore: number;
  maxCombo: number;
  completionRate: number;
  survivalTime: number;
  activeChallenges: number;
  duration: number;
  username?: string;
  date?: Date;
  verificationId?: string; // Server-generated verification ID
}

interface TierVisuals {
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  borderGradient: [string, string, string];
  sealColor: string;
}

const TIER_VISUALS: Record<string, TierVisuals> = {
  Diamond: {
    primaryColor: "#00d4ff",
    secondaryColor: "#9be7ff",
    glowColor: "rgba(0, 212, 255, 0.5)",
    borderGradient: ["#00d4ff", "#9be7ff", "#00d4ff"],
    sealColor: "#00d4ff",
  },
  Platinum: {
    primaryColor: "#c0c0c0",
    secondaryColor: "#e8e8e8",
    glowColor: "rgba(192, 192, 192, 0.5)",
    borderGradient: ["#a0a0a0", "#e8e8e8", "#a0a0a0"],
    sealColor: "#c0c0c0",
  },
  Gold: {
    primaryColor: "#ffd700",
    secondaryColor: "#ffed4a",
    glowColor: "rgba(255, 215, 0, 0.5)",
    borderGradient: ["#b8860b", "#ffd700", "#b8860b"],
    sealColor: "#ffd700",
  },
  Silver: {
    primaryColor: "#a8a8a8",
    secondaryColor: "#d4d4d4",
    glowColor: "rgba(168, 168, 168, 0.5)",
    borderGradient: ["#808080", "#d4d4d4", "#808080"],
    sealColor: "#a8a8a8",
  },
  Bronze: {
    primaryColor: "#cd7f32",
    secondaryColor: "#daa06d",
    glowColor: "rgba(205, 127, 50, 0.5)",
    borderGradient: ["#8b4513", "#cd7f32", "#8b4513"],
    sealColor: "#cd7f32",
  },
};

export function StressCertificate({
  wpm,
  accuracy,
  consistency,
  difficulty,
  stressScore,
  maxCombo,
  completionRate,
  survivalTime,
  activeChallenges,
  duration,
  username,
  date = new Date(),
  verificationId: serverVerificationId,
}: StressCertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<HTMLImageElement | null>(null);
  const { toast } = useToast();

  const rating = getTypingPerformanceRating(wpm, accuracy);
  const tierVisuals = TIER_VISUALS[rating.badge] || TIER_VISUALS.Bronze;

  // Generate certificate ID (server or fallback)
  const certificateId = useMemo(() => {
    if (serverVerificationId) return serverVerificationId;
    // Fallback: Generate client-side hash with proper 3-group format
    const data = `${wpm}-${accuracy}-${stressScore}-${difficulty}-${survivalTime}-${duration}`;
    let hash1 = 0;
    let hash2 = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash1 = hash1 & hash1;
      hash2 = ((hash2 << 3) + hash2) ^ char;
      hash2 = hash2 & hash2;
    }
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const absHash1 = Math.abs(hash1);
    const absHash2 = Math.abs(hash2);
    let id = "TM-";
    for (let i = 0; i < 4; i++) {
      id += chars[(absHash1 >> (i * 4)) % chars.length];
    }
    id += "-";
    for (let i = 0; i < 4; i++) {
      id += chars[(absHash1 >> ((i + 4) * 4)) % chars.length];
    }
    id += "-";
    for (let i = 0; i < 4; i++) {
      id += chars[(absHash2 >> (i * 4)) % chars.length];
    }
    return id;
  }, [serverVerificationId, wpm, accuracy, stressScore, difficulty, survivalTime, duration]);

  // Load QR code image for any verification ID
  useEffect(() => {
    if (certificateId) {
      generateVerificationQRCode(certificateId, 80)
        .then(dataUrl => {
          const img = new Image();
          img.onload = () => setQrCodeImage(img);
          img.onerror = () => console.error('Failed to load QR code image');
          img.src = dataUrl;
        })
        .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [certificateId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawCertificate = () => {
      const width = 1200;
      const height = 900;

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, tierVisuals.borderGradient[0]);
      gradient.addColorStop(0.5, tierVisuals.borderGradient[1]);
      gradient.addColorStop(1, tierVisuals.borderGradient[2]);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      ctx.strokeStyle = tierVisuals.primaryColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = tierVisuals.primaryColor;
      ctx.textAlign = "center";
      ctx.fillText("CERTIFICATE OF RESILIENCE", width / 2, 120);

      ctx.font = "italic 28px Georgia, serif";
      ctx.fillStyle = "#888";
      ctx.fillText("TypeMasterAI - Stress Test Mode", width / 2, 160);

      const iconSize = 80;
      const iconX = (width - iconSize) / 2;
      const iconY = 190;

      ctx.save();
      ctx.translate(iconX + iconSize / 2, iconY + iconSize / 2);
      ctx.strokeStyle = tierVisuals.primaryColor;
      ctx.fillStyle = tierVisuals.primaryColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-10, 20);
      ctx.lineTo(-10, -20);
      ctx.lineTo(10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-25, -15);
      ctx.lineTo(-25, 15);
      ctx.moveTo(15, -15);
      ctx.lineTo(15, 15);
      ctx.stroke();
      ctx.restore();

      ctx.font = "32px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#fff";
      ctx.fillText("This certifies that", width / 2, 320);

      ctx.font = "bold 52px Georgia, serif";
      ctx.fillStyle = tierVisuals.secondaryColor;
      ctx.fillText(username || "Typing Champion", width / 2, 390);

      ctx.font = "28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#ccc";
      ctx.fillText("has demonstrated exceptional composure under pressure", width / 2, 440);
      ctx.fillText(`conquering ${activeChallenges} simultaneous challenges`, width / 2, 475);

      const metrics = [
        { label: "Stress Score", value: `${stressScore}`, x: 200 },
        { label: "Max Combo", value: `${maxCombo}`, x: 450 },
        { label: "Completion", value: `${completionRate.toFixed(1)}%`, x: 700 },
        { label: "WPM", value: `${wpm}`, x: 950 },
      ];

      metrics.forEach(({ label, value, x }) => {
        ctx.font = "20px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#888";
        ctx.fillText(label, x, 560);

        ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = tierVisuals.primaryColor;
        ctx.fillText(value, x, 600);
      });

      ctx.font = "22px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#aaa";
      ctx.fillText(`${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Difficulty • Survived ${Math.floor(survivalTime / 60)}:${(survivalTime % 60).toString().padStart(2, '0')}`, width / 2, 670);

      ctx.beginPath();
      ctx.arc(width / 2, 760, 50, 0, Math.PI * 2);
      ctx.fillStyle = tierVisuals.sealColor + "40";
      ctx.fill();
      ctx.strokeStyle = tierVisuals.sealColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = tierVisuals.primaryColor;
      ctx.fillText(rating.badge.toUpperCase(), width / 2, 768);

      ctx.font = "16px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`Issued: ${date.toLocaleDateString()}`, 150, height - 50);
      ctx.textAlign = "right";
      ctx.fillText(`Certificate ID: ${certificateId}`, width - 150, height - 50);

      // Draw QR code in bottom-right corner
      if (qrCodeImage) {
        const qrSize = 80;
        const qrX = width - 100;
        const qrY = height - 120;
        
        // White background for QR code
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qrX - qrSize / 2 - 5, qrY - qrSize / 2 - 5, qrSize + 10, qrSize + 10);
        
        // Draw QR code
        ctx.drawImage(qrCodeImage, qrX - qrSize / 2, qrY - qrSize / 2, qrSize, qrSize);
        
        // Label under QR
        ctx.font = "10px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#64748b";
        ctx.textAlign = "center";
        ctx.fillText("Scan to verify", qrX, qrY + qrSize / 2 + 12);
      }
    };

    drawCertificate();
  }, [wpm, accuracy, difficulty, stressScore, maxCombo, completionRate, survivalTime, activeChallenges, duration, username, date, rating.badge, tierVisuals, certificateId, qrCodeImage]);

  const downloadCertificate = (format: "png" | "jpg" | "pdf") => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const filename = `typemaster-stress-certificate-${certificateId}`;

    if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename}.pdf`);
    } else {
      const link = document.createElement("a");
      link.download = `${filename}.${format}`;
      link.href = canvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png", 0.95);
      link.click();
    }

    toast({
      title: "Certificate Downloaded!",
      description: `Your stress test certificate has been saved as ${format.toUpperCase()}.`,
    });

    triggerCelebration();
  };

  const shareToSocial = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSharing(true);

    try {
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      if (navigator.share && navigator.canShare({ files: [new File([blob], "certificate.png", { type: "image/png" })] })) {
        await navigator.share({
          title: "TypeMasterAI Stress Test Certificate",
          text: `I achieved a Stress Score of ${stressScore} with ${wpm} WPM under extreme pressure! 💪⚡`,
          files: [new File([blob], "certificate.png", { type: "image/png" })],
        });
      } else {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 2000);
        toast({
          title: "Image Copied!",
          description: "Certificate image copied to clipboard. Paste it anywhere!",
        });
      }
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Share Failed",
        description: "Please try downloading instead.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef}
        width={1200}
        height={900}
        className="w-full border-2 border-border rounded-lg shadow-2xl"
        style={{ maxWidth: "100%" }}
        data-testid="stress-certificate-canvas"
      />

      <div className="flex gap-2 justify-center flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2" data-testid="button-download-certificate">
              <Download className="w-4 h-4" />
              Download Certificate
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem onClick={() => downloadCertificate("png")} className="cursor-pointer">
              <FileImage className="w-4 h-4 mr-2" />
              Download as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadCertificate("jpg")} className="cursor-pointer">
              <FileImage className="w-4 h-4 mr-2" />
              Download as JPG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => downloadCertificate("pdf")} className="cursor-pointer">
              <FileText className="w-4 h-4 mr-2" />
              Download as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={shareToSocial} variant="outline" className="gap-2" disabled={isSharing} data-testid="button-share-certificate">
          {imageCopied ? (
            <>
              <Check className="w-4 h-4" />
              Image Copied!
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              {isSharing ? "Sharing..." : "Share Certificate"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
