"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Copy,
  QrCode,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateShopQRCodeURL,
  downloadQRCode,
  copyShopURL,
  validateQRCodeGeneration,
} from "@/lib/utils/qrcode";

interface ShopQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopUsername: string;
  shopName: string;
}

export function ShopQRCodeModal({
  isOpen,
  onClose,
  shopUsername,
  shopName,
}: ShopQRCodeModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [shopUrl, setShopUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Generate QR code when modal opens or username changes
  useEffect(() => {
    if (isOpen && shopUsername) {
      generateQRCode();
      setShopUrl(`${window.location.origin}/salons/${shopUsername}`);
    }
  }, [isOpen, shopUsername]);

  const generateQRCode = async () => {
    try {
      setIsGenerating(true);
      setError("");

      if (!validateQRCodeGeneration(shopUsername)) {
        throw new Error("Invalid shop username");
      }      const url = generateShopQRCodeURL(shopUsername, {
        size: 250,
        errorCorrectionLevel: "M",
        margin: 1,
      });

      // Test if the QR code can be loaded
      const img = new Image();
      img.onload = () => {
        setQrCodeUrl(url);
        setIsGenerating(false);
      };
      img.onerror = () => {
        throw new Error("Failed to generate QR code");
      };
      img.src = url;
    } catch (error) {
      console.error("Error generating QR code:", error);
      setError(error instanceof Error ? error.message : "Failed to generate QR code");
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadQRCode(shopUsername, shopName, {
        size: 512, // Higher resolution for download
        errorCorrectionLevel: "H", // Higher error correction for print
      });
      toast.success("QR code downloaded successfully!");
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.error(error instanceof Error ? error.message : "Failed to download QR code");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await copyShopURL(shopUsername);
      setCopied(true);
      toast.success("Shop URL copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying URL:", error);
      toast.error("Failed to copy URL to clipboard");
    }
  };

  const handleOpenUrl = () => {
    window.open(shopUrl, "_blank", "noopener,noreferrer");
  };

  const handleRetry = () => {
    generateQRCode();
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5" />
            Shop QR Code
          </DialogTitle>
          <DialogDescription className="text-sm">
            Share your shop's QR code with customers for easy access to your booking page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pb-2">          {/* Shop Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-muted-foreground">Shop Details</h3>
              <Badge variant="secondary" className="text-xs">
                @{shopUsername}
              </Badge>
            </div>
            <p className="font-semibold text-base">{shopName}</p>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground flex-1 font-mono break-all">
                {shopUrl}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenUrl}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />          {/* QR Code Display */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col items-center space-y-3">
                {isGenerating ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-[250px] h-[250px] bg-muted rounded-lg flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">Generating QR code...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-[250px] h-[250px] bg-muted rounded-lg flex items-center justify-center">
                      <div className="flex flex-col items-center space-y-2">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        <p className="text-sm text-center text-muted-foreground max-w-[180px]">
                          {error}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                ) : qrCodeUrl ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-3 bg-white rounded-lg border-2 border-border">
                      <img
                        src={qrCodeUrl}
                        alt={`QR Code for ${shopName}`}
                        className="w-[250px] h-[250px] object-contain"
                        draggable={false}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground max-w-[240px]">
                      Customers can scan this code to access your shop's booking page directly
                    </p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>          {/* Action Buttons */}
          {qrCodeUrl && !error && (
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyUrl}
                className="gap-2"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy URL"}
              </Button>
            </div>
          )}

          {/* Tips */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">💡 Tips:</h4>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Print this QR code and display it in your shop</li>
              <li>• Share it on social media to promote online booking</li>
              <li>• The QR code automatically updates when you change your username</li>
              <li>• High-resolution version is downloaded for printing</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
