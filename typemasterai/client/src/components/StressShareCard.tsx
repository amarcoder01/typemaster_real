import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Check, Clipboard, Twitter, MessageCircle, Linkedin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getStressPerformanceRating,
  drawCardBackground,
  triggerCelebration,
  CARD_DIMENSIONS,
  buildStressShareText
} from "@/lib/share-utils";

interface StressShareCardProps {
  wpm: number;
  accuracy: number;
  stressScore: number;
  completionRate: number;
  survivalTime: number;
  difficulty: string;
  difficultyName: string;
  difficultyIcon: string;
  difficultyColor: string;
  maxCombo: number;
  errors: number;
  duration: number;
  username?: string;
  onShareTracked?: (platform: string) => void;
}

export function StressShareCard({
  wpm,
  accuracy,
  stressScore,
  completionRate,
  survivalTime,
  difficulty,
  difficultyName,
  difficultyIcon,
  difficultyColor,
  maxCombo,
  errors,
  duration,
  username,
  onShareTracked
}: StressShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);
  const { toast } = useToast();

  const rating = getStressPerformanceRating(stressScore);

  useEffect(() => {
    generateCard();
  }, [wpm, accuracy, stressScore, completionRate, survivalTime, difficulty, difficultyName, maxCombo, errors, duration, username]);

  const generateCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dims = CARD_DIMENSIONS.stress;
    canvas.width = dims.width;
    canvas.height = dims.height;

    drawCardBackground(ctx, canvas, rating);

    // Header
    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 16px 'DM Sans', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("TypeMasterAI", 40, 55);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 12px 'DM Sans', sans-serif";
    ctx.fillText("STRESS TEST", 140, 55);

    // Badge
    ctx.fillStyle = rating.color;
    ctx.font = "12px 'DM Sans', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${rating.emoji} ${rating.badge}`, canvas.width - 40, 55);

    // Main Score (Stress Score)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${stressScore}`, canvas.width / 2, 140);

    ctx.fillStyle = rating.color;
    ctx.font = "bold 20px 'DM Sans', sans-serif";
    ctx.fillText("STRESS SCORE", canvas.width / 2, 170);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 18px 'DM Sans', sans-serif";
    ctx.fillText(rating.title, canvas.width / 2, 200);

    // Difficulty Badge
    const diffY = 230;
    ctx.fillStyle = difficultyColor;
    ctx.font = "bold 16px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${difficultyIcon} ${difficultyName}`, canvas.width / 2, diffY);

    // Stats Section - 6 stats in 2 rows
    const statsY = 270;
    const statsBoxMargin = 40;
    const statsBoxWidth = canvas.width - (statsBoxMargin * 2);
    const statsBoxHeight = 110;

    // Stats Box Background
    ctx.fillStyle = "rgba(30, 41, 59, 0.8)";
    ctx.fillRect(statsBoxMargin, statsY - 15, statsBoxWidth, statsBoxHeight);
    ctx.strokeStyle = rating.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(statsBoxMargin, statsY - 15, statsBoxWidth, statsBoxHeight);

    // First row stats
    const row1Stats = [
      { label: "WPM", value: `${wpm}`, color: "#3b82f6", x: 130 },
      { label: "Accuracy", value: `${accuracy.toFixed(1)}%`, color: accuracy >= 90 ? "#22c55e" : accuracy >= 70 ? "#eab308" : "#ef4444", x: 300 },
      { label: "Completed", value: `${completionRate.toFixed(1)}%`, color: completionRate >= 100 ? "#22c55e" : "#f59e0b", x: 470 },
    ];

    // Second row stats
    const row2Stats = [
      { label: "Survival", value: `${Math.round(survivalTime)}s`, color: "#00d4ff", x: 130 },
      { label: "Max Combo", value: `${maxCombo}`, color: "#a855f7", x: 300 },
      { label: "Errors", value: `${errors}`, color: errors === 0 ? "#22c55e" : "#ef4444", x: 470 },
    ];

    // Draw first row
    row1Stats.forEach((stat) => {
      ctx.font = "bold 22px 'JetBrains Mono', monospace";
      ctx.fillStyle = stat.color;
      ctx.textAlign = "center";
      ctx.fillText(stat.value, stat.x, statsY + 20);

      ctx.font = "11px 'DM Sans', sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(stat.label, stat.x, statsY + 38);
    });

    // Draw second row
    row2Stats.forEach((stat) => {
      ctx.font = "bold 22px 'JetBrains Mono', monospace";
      ctx.fillStyle = stat.color;
      ctx.textAlign = "center";
      ctx.fillText(stat.value, stat.x, statsY + 70);

      ctx.font = "11px 'DM Sans', sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(stat.label, stat.x, statsY + 88);
    });

    // User Footer
    const footerY = statsY + statsBoxHeight + 25;
    if (username) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`@${username}`, canvas.width / 2, footerY);
    }

    // Website footer
    const websiteY = username ? footerY + 20 : footerY;
    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 11px 'DM Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("typemasterai.com/stress-test", canvas.width / 2, websiteY);
  };

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `TypeMasterAI_StressTest_${stressScore}pts.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();

    triggerCelebration('small');
    onShareTracked?.('stress_card_download');

    toast({
      title: "Card Downloaded!",
      description: "Share your stress test survival on social media!",
    });
  };

  const shareCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSharing(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });

      const file = new File([blob], `TypeMasterAI_StressTest_${stressScore}pts.png`, { type: "image/png" });

      if ('share' in navigator && navigator.canShare?.({ files: [file] })) {
        const shareText = buildStressShareText(
          stressScore, wpm, accuracy, completionRate, survivalTime, difficultyName, rating
        );
        await navigator.share({
          title: `TypeMasterAI Stress Test - ${stressScore} pts`,
          text: shareText,
          files: [file],
        });
        triggerCelebration('medium');
        onShareTracked?.('stress_card_native');
        toast({
          title: "Shared!",
          description: "Your stress test card has been shared!",
        });
      } else {
        downloadCard();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        downloadCard();
      }
    } finally {
      setIsSharing(false);
    }
  };

  const copyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);

      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2000);
      onShareTracked?.('stress_card_copy_image');

      toast({
        title: "Image Copied!",
        description: "Paste anywhere to share your result card",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Try downloading the image instead",
        variant: "destructive",
      });
    }
  };

  const copyText = async () => {
    const shareText = buildStressShareText(
      stressScore, wpm, accuracy, completionRate, survivalTime, difficultyName, rating
    );
    
    try {
      await navigator.clipboard.writeText(shareText);
      setTextCopied(true);
      setTimeout(() => setTextCopied(false), 2000);
      onShareTracked?.('stress_card_copy_text');

      toast({
        title: "Text Copied!",
        description: "Share text copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const openSocialShare = (platform: 'twitter' | 'linkedin' | 'whatsapp' | 'telegram') => {
    const shareText = buildStressShareText(
      stressScore, wpm, accuracy, completionRate, survivalTime, difficultyName, rating
    );
    const url = "https://typemasterai.com/stress-test";

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(`Stress Test: ${stressScore} pts`)}&summary=${encodeURIComponent(shareText)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
    onShareTracked?.(platform);
  };

  return (
    <div className="space-y-4">
      {/* Canvas Preview */}
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          className="rounded-xl shadow-2xl max-w-full h-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={downloadCard}
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
        <Button
          onClick={shareCard}
          disabled={isSharing}
          className="gap-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
        >
          <Share2 className="w-4 h-4" />
          {isSharing ? "Sharing..." : "Share"}
        </Button>
      </div>

      {/* Copy Options */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={copyImage}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {imageCopied ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
          {imageCopied ? "Copied!" : "Copy Image"}
        </Button>
        <Button
          onClick={copyText}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {textCopied ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
          {textCopied ? "Copied!" : "Copy Text"}
        </Button>
      </div>

      {/* Social Share Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          onClick={() => openSocialShare('twitter')}
          variant="outline"
          size="sm"
          className="gap-1 hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/50"
        >
          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
          <span className="hidden sm:inline text-xs">Twitter</span>
        </Button>
        <Button
          onClick={() => openSocialShare('linkedin')}
          variant="outline"
          size="sm"
          className="gap-1 hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/50"
        >
          <Linkedin className="w-4 h-4 text-[#0A66C2]" />
          <span className="hidden sm:inline text-xs">LinkedIn</span>
        </Button>
        <Button
          onClick={() => openSocialShare('whatsapp')}
          variant="outline"
          size="sm"
          className="gap-1 hover:bg-[#25D366]/10 hover:border-[#25D366]/50"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span className="hidden sm:inline text-xs">WhatsApp</span>
        </Button>
        <Button
          onClick={() => openSocialShare('telegram')}
          variant="outline"
          size="sm"
          className="gap-1 hover:bg-[#0088cc]/10 hover:border-[#0088cc]/50"
        >
          <Send className="w-4 h-4 text-[#0088cc]" />
          <span className="hidden sm:inline text-xs">Telegram</span>
        </Button>
      </div>
    </div>
  );
}

