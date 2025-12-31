import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Trophy, Share2, Twitter, MessageCircle, Award, RefreshCw, Zap, Home, Check, Copy, Sparkles, Linkedin, Send, Download, X, Facebook, Mail, ChevronDown, FileImage, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StressShareCard } from '@/components/StressShareCard';
import { StressCertificate } from '@/components/StressCertificate';
import { getStressPerformanceRating, buildStressShareText } from '@/lib/share-utils';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

type Props = {
  username?: string | null;
  wpm: number;
  accuracy: number;
  completionRate: number;
  stressScore: number;
  survivalTime: number;
  duration: number;
  maxCombo: number;
  errors: number;
  consistency?: number;
  difficulty: string;
  difficultyName: string;
  difficultyIcon: string;
  difficultyColor: string;
  activeChallenges?: number;
  isOnline: boolean;
  pendingResultData?: any | null;
  saveResultMutation: { isError: boolean; isSuccess: boolean; isPending: boolean };
  onRetry: () => void;
  onChangeDifficulty: () => void;
  onCopyLink?: (link: string) => void;
  onRetrySave: () => void;
};

function getTier(score: number) {
  if (score >= 5000) return { name: 'Diamond', color: '#00d4ff', bg: 'bg-cyan-500/10', desc: 'Legendary performance! Top 1% of all players.' };
  if (score >= 3000) return { name: 'Platinum', color: '#c0c0c0', bg: 'bg-slate-500/10', desc: 'Elite typist! Outstanding chaos resistance.' };
  if (score >= 1500) return { name: 'Gold', color: '#ffd700', bg: 'bg-yellow-500/10', desc: 'Excellent focus under pressure!' };
  if (score >= 500) return { name: 'Silver', color: '#a8a8a8', bg: 'bg-zinc-500/10', desc: 'Good job! Keep practicing to reach Gold.' };
  return { name: 'Bronze', color: '#cd7f32', bg: 'bg-orange-500/10', desc: 'You survived! Try again to improve your score.' };
}

export default function StressResultsComplete(props: Props) {
  const {
    username,
    wpm,
    accuracy,
    completionRate,
    stressScore,
    survivalTime,
    duration,
    maxCombo,
    errors,
    consistency = 85,
    difficulty,
    difficultyName,
    difficultyIcon,
    difficultyColor,
    activeChallenges = 5,
    isOnline,
    pendingResultData,
    saveResultMutation,
    onRetry,
    onChangeDifficulty,
    onCopyLink,
    onRetrySave,
  } = props;

  const { toast } = useToast();
  const tier = getTier(stressScore);
  const [copied, setCopied] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificateImageCopied, setCertificateImageCopied] = useState(false);
  const [isSharingCertificate, setIsSharingCertificate] = useState(false);
  const [shareDialogTab, setShareDialogTab] = useState<'quick' | 'visual' | 'certificate' | 'challenge'>('quick');
  const shareLink = `${window.location.origin}/stress-test`;
  const challengeLink = `${window.location.origin}/stress-test?challenge=${stressScore}&difficulty=${difficulty}`;
  const rating = getStressPerformanceRating(stressScore);
  const shareText = buildStressShareText(stressScore, wpm, accuracy, completionRate, survivalTime, difficultyName, rating);

  // Build certificate data directly from props
  const certificateProps = useMemo(() => ({
    wpm: Math.round(wpm),
    accuracy,
    consistency,
    difficulty: difficultyName,
    stressScore,
    maxCombo,
    completionRate,
    survivalTime,
    activeChallenges,
    duration,
    username: username || 'Stress Survivor',
    date: new Date(),
  }), [wpm, accuracy, consistency, difficultyName, stressScore, maxCombo, completionRate, survivalTime, activeChallenges, duration, username]);

  const handleCopyImage = async () => {
    const certCanvas = document.querySelector('[data-testid="stress-certificate-canvas"]') as HTMLCanvasElement;
    if (!certCanvas) {
      toast({ title: "Certificate not ready", description: "Please try again.", variant: "destructive" });
      return;
    }
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        certCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Failed")), "image/png");
      });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCertificateImageCopied(true);
      setTimeout(() => setCertificateImageCopied(false), 2000);
      toast({ title: "Certificate Copied!", description: "Paste directly into Twitter, Discord, or LinkedIn!" });
    } catch {
      toast({ title: "Copy Failed", description: "Please download instead.", variant: "destructive" });
    }
  };

  const downloadCertificate = (format: "png" | "jpg" | "pdf") => {
    const certCanvas = document.querySelector('[data-testid="stress-certificate-canvas"]') as HTMLCanvasElement;
    if (!certCanvas) {
      toast({ title: "Certificate not ready", description: "Please try again.", variant: "destructive" });
      return;
    }

    const filename = `TypeMasterAI_StressTest_${stressScore}pts`;

    if (format === "pdf") {
      const imgData = certCanvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [certCanvas.width, certCanvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, certCanvas.width, certCanvas.height);
      pdf.save(`${filename}.pdf`);
    } else {
      const link = document.createElement('a');
      link.download = `${filename}.${format}`;
      link.href = certCanvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png", 0.95);
      link.click();
    }

    toast({ title: "Certificate Downloaded!", description: `Saved as ${format.toUpperCase()}` });
  };

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'discord' | 'email') => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareLink);
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent(`Stress Test: ${stressScore} pts`)}&summary=${text}`,
      whatsapp: `https://wa.me/?text=${text}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      discord: '',
      email: `mailto:?subject=${encodeURIComponent(`I scored ${stressScore} points on TypeMasterAI Stress Test!`)}&body=${text}`,
    };

    if (platform === 'discord') {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Copied for Discord!", description: "Paste in any Discord channel" });
      return;
    }

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `TypeMasterAI Stress Test - ${stressScore} pts`,
        text: shareText,
        url: shareLink,
      });
    } catch {}
  };

  const shareCertificateWithImage = async () => {
    const certCanvas = document.querySelector('[data-testid="stress-certificate-canvas"]') as HTMLCanvasElement;
    if (!certCanvas) {
      toast({ title: "Certificate not ready", description: "Please try again.", variant: "destructive" });
      return;
    }
    setIsSharingCertificate(true);
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        certCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Failed")), "image/png");
      });
      const file = new File([blob], `TypeMasterAI_StressTest_${stressScore}pts.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `TypeMasterAI Stress Test Certificate - ${stressScore} pts`,
          text: `⚡ I earned a ${tier.name} tier certificate on the Stress Test!\n\n🔥 ${stressScore} Stress Score | ${Math.round(wpm)} WPM | ${accuracy.toFixed(1)}% Accuracy\n💪 ${difficultyName} Difficulty\n\nCan you beat my score?\n\n🔗 typemasterai.com/stress-test`,
          files: [file],
        });
        toast({ title: "Certificate Shared!", description: "Your achievement is on its way!" });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({ title: "Share failed", description: "Please try Copy Image instead.", variant: "destructive" });
      }
    } finally {
      setIsSharingCertificate(false);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 cursor-help" style={{ backgroundColor: `${tier.color}20` }}>
                <Trophy className="w-10 h-10" style={{ color: tier.color }} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{tier.desc}</p>
            </TooltipContent>
          </Tooltip>
          <h1 className="text-3xl font-bold mb-2">Stress Test Complete!</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">{difficultyIcon}</span>
            <span className="text-xl font-medium" style={{ color: difficultyColor }}>
              {difficultyName}
            </span>
          </div>
          
          {/* Score Badge */}
          <div className={`inline-flex flex-col items-center px-8 py-4 rounded-2xl ${tier.bg}`}>
            <span className="text-sm text-muted-foreground uppercase tracking-wider">
              {tier.name} Tier
            </span>
            <span className="text-5xl font-bold" style={{ color: tier.color }}>
              {stressScore}
            </span>
            <span className="text-sm text-muted-foreground">Stress Score</span>
          </div>
        </div>

        {/* Stats Grid */}
        <Card className="mb-6 overflow-hidden">
          <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-border">
            {/* WPM */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 text-center bg-gradient-to-b from-blue-500/5 to-transparent cursor-help hover:bg-blue-500/10 transition-colors">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-400">{Math.round(wpm)}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-1">WPM</div>
              </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-semibold">Words Per Minute</p>
                <p className="text-xs text-muted-foreground">Net typing speed adjusted for errors. Industry standard: 5 characters = 1 word.</p>
              </TooltipContent>
            </Tooltip>
            {/* Accuracy */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 text-center bg-gradient-to-b from-green-500/5 to-transparent cursor-help hover:bg-green-500/10 transition-colors">
                  <div className={`text-2xl sm:text-3xl font-bold ${accuracy >= 90 ? 'text-green-400' : accuracy >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {accuracy.toFixed(1)}%
            </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-1">Accuracy</div>
            </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-semibold">Typing Accuracy</p>
                <p className="text-xs text-muted-foreground">Percentage of correct keystrokes. {accuracy >= 90 ? '🎯 Excellent!' : accuracy >= 70 ? '📊 Good, room to improve' : '⚠️ Focus on accuracy'}</p>
              </TooltipContent>
            </Tooltip>
            {/* Completion */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 text-center bg-gradient-to-b from-orange-500/5 to-transparent cursor-help hover:bg-orange-500/10 transition-colors">
                  <div className={`text-2xl sm:text-3xl font-bold ${completionRate >= 100 ? 'text-green-400' : 'text-orange-400'}`}>
                    {completionRate.toFixed(0)}%
              </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-1">Done</div>
            </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-semibold">Completion Rate</p>
                <p className="text-xs text-muted-foreground">How much of the text you completed. {completionRate >= 100 ? '✅ Full completion!' : `${(100 - completionRate).toFixed(0)}% remaining when time ran out.`}</p>
              </TooltipContent>
            </Tooltip>
            {/* Survival Time */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 text-center bg-gradient-to-b from-cyan-500/5 to-transparent cursor-help hover:bg-cyan-500/10 transition-colors">
                  <div className="text-2xl sm:text-3xl font-bold text-cyan-400">{Math.round(survivalTime)}s</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-1">Survival</div>
          </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-semibold">Survival Time</p>
                <p className="text-xs text-muted-foreground">Total time spent typing under stress. Test duration: {duration}s.</p>
              </TooltipContent>
            </Tooltip>
            {/* Max Combo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 text-center bg-gradient-to-b from-purple-500/5 to-transparent cursor-help hover:bg-purple-500/10 transition-colors">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-400">{maxCombo}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-1">Combo</div>
              </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-semibold">Max Combo</p>
                <p className="text-xs text-muted-foreground">Longest streak of correct keystrokes in a row. {maxCombo >= 50 ? '🔥 Incredible focus!' : maxCombo >= 20 ? '⚡ Nice streak!' : 'Keep building those combos!'}</p>
              </TooltipContent>
            </Tooltip>
            {/* Errors */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-4 text-center bg-gradient-to-b from-red-500/5 to-transparent cursor-help hover:bg-red-500/10 transition-colors">
                  <div className={`text-2xl sm:text-3xl font-bold ${errors === 0 ? 'text-green-400' : 'text-red-400'}`}>{errors}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-1">Errors</div>
            </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-semibold">Total Errors</p>
                <p className="text-xs text-muted-foreground">Incorrect keystrokes made. {errors === 0 ? '🎉 Perfect run!' : errors <= 5 ? '👍 Very few mistakes' : 'Each error resets your combo.'}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Login Prompt */}
        {!username && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <Zap className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-amber-600 dark:text-amber-400">Login to save your results</p>
                <p className="text-sm text-muted-foreground">Your score won't be saved without an account.</p>
              </div>
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-600">
                  Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Save Status */}
        {username && (
          <Card className={`mb-6 ${!isOnline || pendingResultData ? 'border-amber-500/50 bg-amber-500/5' : saveResultMutation.isError ? 'border-red-500/50 bg-red-500/5' : saveResultMutation.isSuccess ? 'border-green-500/50 bg-green-500/5' : ''}`}>
            <CardContent className="p-4 text-center">
              {!isOnline ? (
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm">Offline - Will save when reconnected</span>
                </div>
              ) : pendingResultData ? (
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <RefreshCw className={`w-4 h-4 ${saveResultMutation.isPending ? 'animate-spin' : ''}`} />
                  <span className="text-sm">
                    {saveResultMutation.isPending ? 'Saving...' : 'Pending - '}
                  </span>
                  {!saveResultMutation.isPending && (
                    <Button variant="ghost" size="sm" onClick={onRetrySave} className="h-6 px-2 text-amber-600">
                      Retry
                    </Button>
                  )}
                </div>
              ) : saveResultMutation.isError ? (
                <div className="flex items-center justify-center gap-2 text-red-500">
                  <span className="text-sm">Failed to save</span>
                  <Button variant="ghost" size="sm" onClick={onRetrySave} className="h-6 px-2 text-red-500">
                    Retry
                  </Button>
                </div>
              ) : saveResultMutation.isSuccess ? (
                <p className="text-sm text-green-600 dark:text-green-400">✓ Result saved!</p>
              ) : saveResultMutation.isPending ? (
                <p className="text-sm text-muted-foreground">Saving...</p>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* 4-Tab Share System */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Tabs value={shareDialogTab} onValueChange={(v) => setShareDialogTab(v as typeof shareDialogTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4 h-auto">
                <TabsTrigger value="quick" className="text-[10px] sm:text-sm py-1.5 sm:py-2 gap-1" data-testid="tab-quick-share">
                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Share</span>
                </TabsTrigger>
                <TabsTrigger value="visual" className="text-[10px] sm:text-sm py-1.5 sm:py-2 gap-1" data-testid="tab-visual-card">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Card</span>
                </TabsTrigger>
                <TabsTrigger value="certificate" className="text-[10px] sm:text-sm py-1.5 sm:py-2 gap-1" disabled={!username} data-testid="tab-certificate">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Certificate</span>
                </TabsTrigger>
                <TabsTrigger value="challenge" className="text-[10px] sm:text-sm py-1.5 sm:py-2 gap-1" data-testid="tab-challenge">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Challenge</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Quick Share */}
              <TabsContent value="quick" className="space-y-3 sm:space-y-4">
                {/* Pre-composed Share Message Preview */}
                <div className="relative">
                  <div className="absolute -top-2 left-3 px-2 bg-background text-[10px] sm:text-xs font-medium text-muted-foreground">
                    Your Share Message
                  </div>
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg sm:rounded-xl border border-red-500/20 text-xs sm:text-sm leading-relaxed">
                    <div className="space-y-2">
                      <p className="text-base font-medium">
                        {rating.emoji} Stress Test: <span className="text-red-400 font-bold">{stressScore} pts</span>!
                      </p>
                      <p className="text-muted-foreground">
                        🔥 Difficulty: <span className="text-foreground font-semibold">{difficultyName}</span>
                      </p>
                      <p className="text-muted-foreground">
                        ⚡ Speed: <span className="text-foreground font-semibold">{Math.round(wpm)} WPM</span>
                      </p>
                      <p className="text-muted-foreground">
                        ✨ Accuracy: <span className="text-foreground font-semibold">{accuracy.toFixed(1)}%</span>
                      </p>
                      <p className="text-muted-foreground">
                        🏆 Tier: <span style={{ color: tier.color }} className="font-semibold">{tier.name}</span>
                      </p>
                      <p className="text-muted-foreground">
                        ⏱️ Survived: <span className="text-foreground font-semibold">{Math.round(survivalTime)}s</span>
                      </p>
                      <p className="text-red-400/80 text-xs mt-3 font-medium">
                        Can you handle the chaos? 🚀
                      </p>
                      <p className="text-xs text-red-400 mt-2 font-medium">
                        👉 typemasterai.com/stress-test
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #StressTest #TypeMasterAI #TypingChallenge
                      </p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shareText);
                          toast({ title: "Message Copied!", description: "Share message copied to clipboard" });
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 hover:bg-background border border-border/50 transition-colors"
                        data-testid="button-copy-message"
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Copy Share Message</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Quick Share Buttons */}
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-[10px] sm:text-xs font-medium text-center text-muted-foreground uppercase tracking-wide">
                    Click to Share
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => shareToSocial('twitter')}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/25 border border-[#1DA1F2]/20 transition-all group"
                          data-testid="button-share-twitter"
                        >
                          <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                          <span className="text-xs font-medium">X (Twitter)</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Share on X</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => shareToSocial('facebook')}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/25 border border-[#1877F2]/20 transition-all group"
                          data-testid="button-share-facebook"
                        >
                          <Facebook className="w-4 h-4 text-[#1877F2]" />
                          <span className="text-xs font-medium">Facebook</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Share on Facebook</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => shareToSocial('linkedin')}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/20 transition-all group"
                          data-testid="button-share-linkedin"
                        >
                          <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                          <span className="text-xs font-medium">LinkedIn</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Share on LinkedIn</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => shareToSocial('whatsapp')}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/25 border border-[#25D366]/20 transition-all group"
                          data-testid="button-share-whatsapp"
                        >
                          <MessageCircle className="w-4 h-4 text-[#25D366]" />
                          <span className="text-xs font-medium">WhatsApp</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Share on WhatsApp</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => shareToSocial('discord')}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/25 border border-[#5865F2]/20 transition-all group"
                          data-testid="button-share-discord"
                        >
                          <svg className="w-4 h-4 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                          </svg>
                          <span className="text-xs font-medium">Discord</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Copy for Discord</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => shareToSocial('telegram')}
                          className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/25 border border-[#0088cc]/20 transition-all group"
                          data-testid="button-share-telegram"
                        >
                          <Send className="w-4 h-4 text-[#0088cc]" />
                          <span className="text-xs font-medium">Telegram</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Share on Telegram</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Native Share */}
                {'share' in navigator && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full py-3 bg-gradient-to-r from-red-500/10 to-orange-500/10 text-foreground font-medium rounded-xl hover:from-red-500/20 hover:to-orange-500/20 transition-all flex items-center justify-center gap-2 border border-red-500/20"
                    data-testid="button-native-share"
                  >
                    <Share2 className="w-4 h-4" />
                    More Sharing Options
                  </button>
                )}
              </TabsContent>

              {/* Tab 2: Visual Card */}
              <TabsContent value="visual" className="mt-4">
                <StressShareCard
                  wpm={wpm}
                  accuracy={accuracy}
                  stressScore={stressScore}
                  completionRate={completionRate}
                  survivalTime={survivalTime}
                  difficulty={difficulty}
                  difficultyName={difficultyName}
                  difficultyIcon={difficultyIcon}
                  difficultyColor={difficultyColor}
                  maxCombo={maxCombo}
                  errors={errors}
                  duration={duration}
                  username={username || undefined}
                />
              </TabsContent>

              {/* Tab 3: Certificate */}
              {username && (
              <TabsContent value="certificate" className="space-y-4">
                    <div className="text-center space-y-2 mb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/30 mb-2">
                        <Award className="w-8 h-8 text-red-400" />
                      </div>
                    <h3 className="text-lg font-bold">Share Your Certificate</h3>
                    <p className="text-sm text-muted-foreground">
                      Show off your official {difficultyName} Stress Test Certificate!
                    </p>
                    </div>

                  {/* Certificate Stats Preview */}
                  <div className="p-4 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-yellow-500/10 rounded-xl border border-red-500/20">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Stress Score</p>
                        <p className="text-2xl font-bold" style={{ color: tier.color }}>{stressScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">WPM</p>
                        <p className="text-2xl font-bold text-blue-400">{Math.round(wpm)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Performance</p>
                        <p className="text-sm font-bold" style={{ color: tier.color }}>{tier.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                        <p className="text-sm font-bold">{difficultyIcon} {difficultyName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hidden pre-rendered certificate for sharing */}
                  <div className="absolute -z-50 w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
                    <StressCertificate {...certificateProps} />
                  </div>

                  {/* View, Download & Share Certificate Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowCertificate(true)}
                      className="py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
                      data-testid="button-view-certificate-share"
                      >
                        <Award className="w-5 h-5" />
                        View Certificate
                    </button>
                    <button
                      onClick={handleCopyImage}
                      className="py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                      data-testid="button-copy-certificate-image"
                    >
                      {certificateImageCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      {certificateImageCopied ? "Copied!" : "Copy Image"}
                    </button>
                  </div>

                  {/* Download Certificate Button with Format Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="w-full gap-2 h-11 text-white font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90"
                        data-testid="button-download-certificate-format"
                      >
                        <Download className="w-5 h-5" />
                        Download Certificate
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
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

                  {/* Share Certificate with Image Button */}
                  {'share' in navigator && (
                    <button
                      onClick={shareCertificateWithImage}
                      disabled={isSharingCertificate}
                      className="w-full py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="button-share-certificate-with-image"
                    >
                      <Share2 className="w-5 h-5" />
                      {isSharingCertificate ? "Preparing..." : "Share Certificate with Image"}
                    </button>
                  )}

                  {/* Certificate Social Share Buttons */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-center text-muted-foreground uppercase tracking-wide">
                      Share Certificate On
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const text = encodeURIComponent(`⚡ Just earned my TypeMasterAI Stress Test Certificate! ${stressScore} pts on ${difficultyName} difficulty 🔥\n\n#TypeMasterAI #StressTest #Certified`);
                          window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareLink)}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/25 border border-[#1DA1F2]/20 transition-all"
                        data-testid="button-cert-share-twitter"
                      >
                        <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                        <span className="text-xs font-medium">X</span>
                      </button>
                      <button
                        onClick={() => {
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/25 border border-[#1877F2]/20 transition-all"
                        data-testid="button-cert-share-facebook"
                      >
                        <Facebook className="w-4 h-4 text-[#1877F2]" />
                        <span className="text-xs font-medium">Facebook</span>
                      </button>
                      <button
                        onClick={() => {
                          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/20 transition-all"
                        data-testid="button-cert-share-linkedin"
                      >
                        <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                        <span className="text-xs font-medium">LinkedIn</span>
                      </button>
                      <button
                        onClick={() => {
                          const waText = `*TypeMasterAI Stress Test Certificate*\n\nStress Score: *${stressScore}*\nWPM: *${Math.round(wpm)}*\nAccuracy: *${accuracy.toFixed(1)}%*\nDifficulty: ${difficultyName}\nTier: ${tier.name}\n\nGet yours: ${shareLink}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/25 border border-[#25D366]/20 transition-all"
                        data-testid="button-cert-share-whatsapp"
                      >
                        <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        <span className="text-xs font-medium">WhatsApp</span>
                      </button>
                      <button
                        onClick={() => {
                          const text = `⚡ CERTIFIED!\n\n🔥 ${stressScore} Stress Score | ${Math.round(wpm)} WPM\n✨ ${accuracy.toFixed(1)}% Accuracy | ${tier.name} Tier\n💪 ${difficultyName} Difficulty\n\nJust earned my official stress test certificate! Can you beat it? 😎`;
                          window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/25 border border-[#0088cc]/20 transition-all"
                        data-testid="button-cert-share-telegram"
                      >
                        <Send className="w-4 h-4 text-[#0088cc]" />
                        <span className="text-xs font-medium">Telegram</span>
                      </button>
                      <button
                        onClick={() => {
                          const subject = encodeURIComponent(`⚡ TypeMasterAI Stress Test Certificate | ${stressScore} pts`);
                          const body = encodeURIComponent(`Hello!\n\nI've earned an official TypeMasterAI Stress Test Certificate!\n\n📜 CERTIFICATE DETAILS:\n━━━━━━━━━━━━━━━━━━━━\n🔥 Stress Score: ${stressScore}\n⚡ WPM: ${Math.round(wpm)}\n✨ Accuracy: ${accuracy.toFixed(1)}%\n💪 Difficulty: ${difficultyName}\n🏆 Tier: ${tier.name}\n📅 Date: ${new Date().toLocaleDateString()}\n\n👉 Get certified: ${shareLink}\n\nBest regards!`);
                          window.open(`mailto:?subject=${subject}&body=${body}`);
                        }}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-500/10 hover:bg-gray-500/25 border border-gray-500/20 transition-all"
                        data-testid="button-cert-share-email"
                      >
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium">Email</span>
                        </button>
                    </div>
                  </div>

                  {/* Certificate Sharing Tips */}
                  <div className="space-y-2">
                    <div className="p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-xs text-center text-muted-foreground">
                        📱 <span className="font-medium text-foreground">Mobile:</span> Use "Share Certificate with Image" to attach the certificate directly!
                      </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                      <p className="text-xs text-center text-muted-foreground">
                        💻 <span className="font-medium text-foreground">Desktop:</span> Use "Copy Image" then paste directly into Twitter, LinkedIn, Discord, or any social media!
                      </p>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Tab 4: Challenge */}
              <TabsContent value="challenge" className="mt-4 space-y-4">
                {/* Challenge Header */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/30 mb-2">
                    <Zap className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold">Challenge Your Friends!</h3>
                  <p className="text-sm text-muted-foreground">
                    Think you're tough? Challenge your friends to beat your score!
                  </p>
                </div>

                {/* Your Score to Beat */}
                <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">Score to Beat</span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>
                      {tier.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-bold" style={{ color: tier.color }}>{stressScore}</div>
                      <div className="text-xs text-muted-foreground">Stress Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{Math.round(wpm)}</div>
                      <div className="text-xs text-muted-foreground">WPM</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{accuracy.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                </div>
                
                {/* Challenge Link */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
                    Share Challenge Link
                  </p>
                  <div className="flex items-center gap-2">
                    <Input 
                      value={challengeLink}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(challengeLink);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                            toast({ title: "Challenge Link Copied!", description: "Send it to your friends!" });
                          }}
                          variant="outline"
                          size="icon"
                          data-testid="button-copy-challenge-link"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{copied ? 'Copied!' : 'Copy Challenge Link'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Challenge Message */}
                <div className="relative">
                  <div className="absolute -top-2 left-3 px-2 bg-background text-xs font-medium text-muted-foreground">
                    Challenge Message
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20 text-sm">
                    <p className="font-medium mb-2">🔥 I challenge you to beat my Stress Test score!</p>
                    <p className="text-muted-foreground text-xs mb-2">
                      ⚡ {stressScore} Stress Score | {Math.round(wpm)} WPM | {accuracy.toFixed(1)}% Accuracy
                    </p>
                    <p className="text-muted-foreground text-xs mb-2">
                      💪 {difficultyName} Difficulty | {tier.name} Tier
                    </p>
                    <p className="text-orange-400 text-xs font-medium">
                      👉 {challengeLink}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const text = `🔥 I challenge you to beat my Stress Test score!\n\n⚡ ${stressScore} Stress Score | ${Math.round(wpm)} WPM | ${accuracy.toFixed(1)}% Accuracy\n💪 ${difficultyName} Difficulty | ${tier.name} Tier\n\n👉 ${challengeLink}`;
                      navigator.clipboard.writeText(text);
                      toast({ title: "Challenge Copied!", description: "Send it to your friends!" });
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 hover:bg-background border border-border/50 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Challenge Social Share */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      const text = encodeURIComponent(`🔥 I challenge you to beat my Stress Test score!\n\n⚡ ${stressScore} pts | ${difficultyName}\n\nCan you handle the chaos? 😈`);
                      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(challengeLink)}`, '_blank', 'width=600,height=400');
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/25 border border-[#1DA1F2]/20 transition-all"
                  >
                    <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                    <span className="text-xs font-medium">X</span>
                  </button>
                  <button
                    onClick={() => {
                      const waText = `🔥 I challenge you to beat my Stress Test score!\n\n⚡ *${stressScore}* Stress Score\n💪 *${difficultyName}* Difficulty\n🏆 *${tier.name}* Tier\n\nCan you handle the chaos? 😈\n\n👉 ${challengeLink}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank', 'width=600,height=400');
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/25 border border-[#25D366]/20 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span className="text-xs font-medium">WhatsApp</span>
                  </button>
                  <button
                    onClick={() => {
                      const text = `🔥 STRESS TEST CHALLENGE!\n\nI scored ${stressScore} pts on ${difficultyName} difficulty.\nCan you beat me? 😈\n\n👉 ${challengeLink}`;
                      window.open(`https://t.me/share/url?url=${encodeURIComponent(challengeLink)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/25 border border-[#0088cc]/20 transition-all"
                  >
                    <Send className="w-4 h-4 text-[#0088cc]" />
                    <span className="text-xs font-medium">Telegram</span>
                  </button>
                </div>

                {/* Challenge Tips */}
                <div className="p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-xs text-center text-muted-foreground">
                    💡 <span className="font-medium text-foreground">Pro Tip:</span> Share the challenge link to see who among your friends can survive the longest!
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* View Certificate Dialog */}
        <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-red-400" />
                Your Stress Test Certificate
              </DialogTitle>
            </DialogHeader>
            <StressCertificate {...certificateProps} />
          </DialogContent>
        </Dialog>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={onRetry} className="w-full gap-2" size="lg">
            <RefreshCw className="w-4 h-4" />
            Retry {difficultyName}
          </Button>
          <div className="grid grid-cols-3 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
            <Button onClick={onChangeDifficulty} variant="outline" className="gap-2">
              <Zap className="w-4 h-4" />
              Change
            </Button>
              </TooltipTrigger>
              <TooltipContent>Select different difficulty</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
            <Link href="/stress-leaderboard">
              <Button variant="outline" className="w-full gap-2">
                <Trophy className="w-4 h-4" />
                Ranks
              </Button>
            </Link>
              </TooltipTrigger>
              <TooltipContent>View leaderboard</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
            <Link href="/">
              <Button variant="outline" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
              </TooltipTrigger>
              <TooltipContent>Return home</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
