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

    // Header - TypeMasterAI branding on left
    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 18px 'DM Sans', system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("TypeMasterAI", 40, 50);

    // Badge on right
    ctx.fillStyle = rating.color;
    ctx.font = "bold 14px 'DM Sans', system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${rating.emoji} ${rating.badge}`, canvas.width - 40, 50);

    // STRESS TEST label - centered below branding
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 12px 'DM Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "2px";
    ctx.fillText("STRESS TEST", canvas.width / 2, 50);

    // Main Score (Stress Score)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${stressScore}`, canvas.width / 2, 145);

    // Score label
    ctx.fillStyle = rating.color;
    ctx.font = "bold 18px 'DM Sans', system-ui, sans-serif";
    ctx.fillText("STRESS SCORE", canvas.width / 2, 175);

    // Title
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 16px 'DM Sans', system-ui, sans-serif";
    ctx.fillText(rating.title, canvas.width / 2, 200);

    // Difficulty Badge
    ctx.fillStyle = difficultyColor;
    ctx.font = "bold 15px 'DM Sans', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${difficultyIcon} ${difficultyName}`, canvas.width / 2, 230);

    // Stats Section - 2 rows of 3 stats
    const statsBoxY = 255;
    const statsBoxMargin = 40;
    const statsBoxWidth = canvas.width - (statsBoxMargin * 2);
    const statsBoxHeight = 130;

    // Stats Box Background
    ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
    const boxRadius = 12;
    ctx.beginPath();
    ctx.roundRect(statsBoxMargin, statsBoxY, statsBoxWidth, statsBoxHeight, boxRadius);
    ctx.fill();
    
    ctx.strokeStyle = rating.color + "60";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(statsBoxMargin, statsBoxY, statsBoxWidth, statsBoxHeight, boxRadius);
    ctx.stroke();

    // Calculate column positions (evenly distributed)
    const colWidth = statsBoxWidth / 3;
    const col1X = statsBoxMargin + colWidth / 2;
    const col2X = statsBoxMargin + colWidth + colWidth / 2;
    const col3X = statsBoxMargin + colWidth * 2 + colWidth / 2;

    // First row stats
    const row1Y = statsBoxY + 35;
    const stats1 = [
      { label: "WPM", value: `${Math.round(wpm)}`, color: "#3b82f6", x: col1X },
      { label: "Accuracy", value: `${accuracy.toFixed(1)}%`, color: accuracy >= 90 ? "#22c55e" : accuracy >= 70 ? "#eab308" : "#ef4444", x: col2X },
      { label: "Completed", value: `${completionRate.toFixed(1)}%`, color: completionRate >= 100 ? "#22c55e" : "#f59e0b", x: col3X },
    ];

    // Second row stats
    const row2Y = statsBoxY + 95;
    const stats2 = [
      { label: "Survival", value: `${Math.round(survivalTime)}s`, color: "#00d4ff", x: col1X },
      { label: "Max Combo", value: `${maxCombo}`, color: "#a855f7", x: col2X },
      { label: "Errors", value: `${errors}`, color: errors === 0 ? "#22c55e" : "#ef4444", x: col3X },
    ];

    // Draw first row
    stats1.forEach((stat) => {
      ctx.font = "bold 24px 'JetBrains Mono', monospace";
      ctx.fillStyle = stat.color;
      ctx.textAlign = "center";
      ctx.fillText(stat.value, stat.x, row1Y);

      ctx.font = "12px 'DM Sans', system-ui, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(stat.label, stat.x, row1Y + 18);
    });

    // Draw second row
    stats2.forEach((stat) => {
      ctx.font = "bold 24px 'JetBrains Mono', monospace";
      ctx.fillStyle = stat.color;
      ctx.textAlign = "center";
      ctx.fillText(stat.value, stat.x, row2Y);

      ctx.font = "12px 'DM Sans', system-ui, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(stat.label, stat.x, row2Y + 18);
    });

    // Footer area
    const footerStartY = statsBoxY + statsBoxHeight + 25;

    // User
    if (username) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 14px 'DM Sans', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`@${username}`, canvas.width / 2, footerStartY);
    }

    // Website footer
    const websiteY = username ? footerStartY + 25 : footerStartY;
    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 12px 'DM Sans', system-ui, sans-serif";
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
      <div className="flex justify-center p-2 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl border border-border/50">
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-2xl max-w-full h-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={downloadCard}
          variant="outline"
          className="gap-2 h-11"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
        <Button
          onClick={shareCard}
          disabled={isSharing}
          className="gap-2 h-11 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
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
          className="gap-2 h-10"
        >
          {imageCopied ? <Check className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
          {imageCopied ? "Copied!" : "Copy Image"}
        </Button>
        <Button
          onClick={copyText}
          variant="outline"
          size="sm"
          className="gap-2 h-10"
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
          className="gap-1 h-10 hover:bg-[#1DA1F2]/10 hover:border-[#1DA1F2]/50"
        >
          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
          <span className="hidden sm:inline text-xs">Twitter</span>
        </Button>
        <Button
          onClick={() => openSocialShare('linkedin')}
          variant="outline"
          size="sm"
          className="gap-1 h-10 hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/50"
        >
          <Linkedin className="w-4 h-4 text-[#0A66C2]" />
          <span className="hidden sm:inline text-xs">LinkedIn</span>
        </Button>
        <Button
          onClick={() => openSocialShare('whatsapp')}
          variant="outline"
          size="sm"
          className="gap-1 h-10 hover:bg-[#25D366]/10 hover:border-[#25D366]/50"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span className="hidden sm:inline text-xs">WhatsApp</span>
        </Button>
        <Button
          onClick={() => openSocialShare('telegram')}
          variant="outline"
          size="sm"
          className="gap-1 h-10 hover:bg-[#0088cc]/10 hover:border-[#0088cc]/50"
        >
          <Send className="w-4 h-4 text-[#0088cc]" />
          <span className="hidden sm:inline text-xs">Telegram</span>
        </Button>
      </div>

      {/* Sharing Tips */}
      <div className="space-y-2">
        <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <p className="text-xs text-center text-muted-foreground">
            📱 <span className="font-medium text-foreground">Mobile:</span> Use "Share" to attach the card directly to any app!
          </p>
        </div>
        <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
          <p className="text-xs text-center text-muted-foreground">
            💻 <span className="font-medium text-foreground">Desktop:</span> Use "Copy Image" then paste directly into Twitter, Discord, or any social media!
          </p>
        </div>
      </div>
    </div>
  );
}
