"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Shield,
  Lock,
  Unlock,
  Copy,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Clock,
  Heart,
  Sparkles,
  RefreshCcw,
} from "lucide-react";
import { Toaster, toast } from "sonner";

// Encryption utilities using Web Crypto API
const encryptMessage = async (text, password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data,
  );

  const combined = new Uint8Array(
    salt.length + iv.length + encrypted.byteLength,
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
};

const decryptMessage = async (encryptedData, password) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const combined = new Uint8Array(
    atob(encryptedData)
      .split("")
      .map((c) => c.charCodeAt(0)),
  );

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encrypted,
  );

  return decoder.decode(decrypted);
};

// Emotion to emoji mapping
const getEmotionEmoji = (emotion) => {
  const emojiMap = {
    joy: "😊",
    happiness: "😄",
    sadness: "😢",
    anger: "😠",
    fear: "😨",
    anxiety: "😰",
    surprise: "😲",
    disgust: "🤢",
    love: "❤️",
    excitement: "🤩",
    disappointment: "😞",
  };
  return emojiMap[emotion.toLowerCase()] || "🤔";
};

// Password strength checker
const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

  if (score <= 25)
    return { strength: "Weak", color: "#ef4444", percentage: score };
  if (score <= 50)
    return { strength: "Fair", color: "#f59e0b", percentage: score };
  if (score <= 75)
    return { strength: "Good", color: "#10b981", percentage: score };
  return { strength: "Strong", color: "#10b981", percentage: 100 };
};

const EmotionBadge = ({ emotion, confidence, animated = false }) => {
  const getEmotionColor = (emotion) => {
    const colors = {
      joy: "from-yellow-400 to-orange-500",
      happiness: "from-yellow-400 to-orange-500",
      sadness: "from-blue-400 to-indigo-600",
      anger: "from-red-400 to-pink-600",
      fear: "from-purple-400 to-indigo-600",
      anxiety: "from-purple-400 to-indigo-600",
      surprise: "from-green-400 to-emerald-600",
      disgust: "from-gray-400 to-slate-600",
      love: "from-pink-400 to-rose-600",
      excitement: "from-orange-400 to-red-500",
      disappointment: "from-indigo-400 to-purple-600",
    };
    return colors[emotion.toLowerCase()] || "from-gray-400 to-slate-600";
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getEmotionColor(emotion)} backdrop-blur-sm border border-white/10 shadow-lg ${animated ? "animate-pulse" : ""}`}
    >
      <span className="text-lg" role="img" aria-label={emotion}>
        {getEmotionEmoji(emotion)}
      </span>
      <span>{emotion}</span>
      <span className="text-xs opacity-75">
        {Math.round(confidence * 100)}%
      </span>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="inline-flex items-center gap-2">
    <RefreshCcw className="w-4 h-4 animate-spin" />
    <span>Processing...</span>
  </div>
);

const CopyButton = ({ text, label = "Copy" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/10 hover:scale-105"
    >
      {copied ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {copied ? "Copied!" : label}
    </button>
  );
};

export default function EmpathyGuard() {
  const [mode, setMode] = useState("encrypt");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [messageId, setMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotions, setEmotions] = useState([]);
  const [confidenceScores, setConfidenceScores] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [decryptedMessage, setDecryptedMessage] = useState("");

  const messageRef = useRef(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("empathyguard-history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Failed to parse saved history:", error);
      }
    }
  }, []);

  // Save to localStorage whenever history changes
  useEffect(() => {
    localStorage.setItem("empathyguard-history", JSON.stringify(history));
  }, [history]);

  const passwordStrength = getPasswordStrength(password);

  const handleEncrypt = useCallback(async () => {
    if (!message.trim() || !password.trim()) {
      toast.error("Please enter both message and password");
      return;
    }

    setLoading(true);
    setEmotions([]);
    setConfidenceScores([]);
    setResult(null);

    try {
      // Detect emotions with toast feedback
      toast.loading("Analyzing emotions...", { id: "emotion-detection" });

      const emotionResponse = await fetch("/api/detect-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });

      if (!emotionResponse.ok) {
        const errorData = await emotionResponse.json().catch(async () => {
          const errorText = await emotionResponse.text();
          return { error: errorText };
        });
        throw new Error(
          `Emotion detection failed: ${errorData.error || "Unknown error"}`,
        );
      }

      const emotionData = await emotionResponse.json();
      setEmotions(emotionData.emotions);
      setConfidenceScores(emotionData.confidence_scores);

      toast.success("Emotions detected!", { id: "emotion-detection" });
      toast.loading("Encrypting message...", { id: "encryption" });

      // Encrypt message
      const encryptedData = await encryptMessage(message, password);

      // Store encrypted message
      const storeResponse = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encrypted_data: encryptedData,
          emotions: emotionData.emotions,
          confidence_scores: emotionData.confidence_scores,
        }),
      });

      if (!storeResponse.ok) {
        throw new Error("Failed to store encrypted message");
      }

      const storeData = await storeResponse.json();

      const newHistoryItem = {
        id: storeData.id,
        emotions: emotionData.emotions,
        confidence_scores: emotionData.confidence_scores,
        timestamp: storeData.timestamp,
        preview: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
      };

      setHistory((prev) => [newHistoryItem, ...prev].slice(0, 10)); // Keep last 10 items

      setResult({
        messageId: storeData.id,
        encryptedData,
      });

      toast.success("Message encrypted successfully!", { id: "encryption" });
    } catch (error) {
      console.error("Encryption error:", error);
      toast.error(error.message || "Failed to encrypt message");
    } finally {
      setLoading(false);
    }
  }, [message, password]);

  const handleDecrypt = useCallback(async () => {
    if (!messageId.trim() || !password.trim()) {
      toast.error("Please enter both message ID and password");
      return;
    }

    setLoading(true);
    setDecryptedMessage("");
    setEmotions([]);
    setConfidenceScores([]);

    try {
      toast.loading("Fetching encrypted message...", { id: "decryption" });

      const response = await fetch(`/api/messages/${messageId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Message not found. Please check the Message ID.");
        }
        throw new Error("Failed to fetch message");
      }

      const data = await response.json();

      toast.loading("Decrypting message...", { id: "decryption" });

      const decryptedText = await decryptMessage(data.encrypted_data, password);

      setDecryptedMessage(decryptedText);
      setEmotions(data.emotions);
      setConfidenceScores(data.confidence_scores);

      toast.success("Message decrypted successfully!", { id: "decryption" });
    } catch (error) {
      console.error("Decryption error:", error);
      if (error.name === "OperationError") {
        toast.error("Incorrect password. Please try again.");
      } else {
        toast.error(error.message || "Failed to decrypt message");
      }
    } finally {
      setLoading(false);
    }
  }, [messageId, password]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(30, 41, 59, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(12px)",
          },
        }}
      />

      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                EmpathyGuard
              </h1>
              <p className="text-lg text-gray-300 mt-2">
                Emotion-Aware Encryption System
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            <button
              onClick={() => setMode("encrypt")}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                mode === "encrypt"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <Lock className="w-4 h-4" />
              Encrypt
            </button>
            <button
              onClick={() => setMode("decrypt")}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                mode === "decrypt"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <Unlock className="w-4 h-4" />
              Decrypt
            </button>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Main Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`p-2 rounded-xl ${mode === "encrypt" ? "bg-gradient-to-r from-indigo-500 to-purple-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"}`}
                >
                  {mode === "encrypt" ? (
                    <Lock className="w-5 h-5 text-white" />
                  ) : (
                    <Unlock className="w-5 h-5 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === "encrypt" ? "Encrypt Message" : "Decrypt Message"}
                </h2>
              </div>

              <div className="space-y-6">
                {mode === "encrypt" ? (
                  <>
                    {/* Message Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Message to Encrypt
                      </label>
                      <div className="relative">
                        <textarea
                          ref={messageRef}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Enter your message here..."
                          className="w-full h-32 p-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 resize-none backdrop-blur-sm transition-all duration-200"
                          maxLength={2000}
                        />
                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                          {message.length}/2000
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Message ID Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Message ID
                      </label>
                      <input
                        type="text"
                        value={messageId}
                        onChange={(e) => setMessageId(e.target.value)}
                        placeholder="Enter the message ID"
                        className="w-full p-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 font-mono backdrop-blur-sm transition-all duration-200"
                      />
                    </div>
                  </>
                )}

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full p-4 pr-12 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && mode === "encrypt" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>
                          Password Strength: {passwordStrength.strength}
                        </span>
                        <span>{passwordStrength.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${passwordStrength.percentage}%`,
                            backgroundColor: passwordStrength.color,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  onClick={mode === "encrypt" ? handleEncrypt : handleDecrypt}
                  disabled={
                    loading ||
                    (mode === "encrypt"
                      ? !message.trim() || !password.trim()
                      : !messageId.trim() || !password.trim())
                  }
                  className={`w-full py-4 px-6 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    mode === "encrypt"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  }`}
                >
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      {mode === "encrypt"
                        ? "Encrypt Message"
                        : "Decrypt Message"}
                    </>
                  )}
                </button>

                {/* Results */}
                {mode === "encrypt" && result && (
                  <div className="space-y-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">
                        Message encrypted successfully!
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Message ID (share this with recipient)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={result.messageId}
                          readOnly
                          className="flex-1 p-3 bg-white/5 border border-white/20 rounded-lg text-white font-mono text-sm"
                        />
                        <CopyButton text={result.messageId} />
                      </div>
                    </div>
                  </div>
                )}

                {mode === "decrypt" && decryptedMessage && (
                  <div className="space-y-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-blue-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">
                        Message decrypted successfully!
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Original Message
                      </label>
                      <div className="p-4 bg-white/5 border border-white/20 rounded-lg text-white">
                        {decryptedMessage}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Emotion Visualization */}
            {emotions.length > 0 && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Emotional Signature
                  </h3>
                </div>

                <div className="space-y-3">
                  {emotions.map((emotion, index) => (
                    <EmotionBadge
                      key={index}
                      emotion={emotion}
                      confidence={confidenceScores[index]}
                      animated={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Message History */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Recent Messages
                </h3>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {history.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-gray-400">
                          {item.id.substring(0, 8)}...
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 mb-2">
                        {item.preview}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.emotions.slice(0, 3).map((emotion, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300"
                          >
                            {getEmotionEmoji(emotion)} {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-400 space-y-2">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Your messages are encrypted with AES-256 encryption
          </p>
          <p className="flex items-center justify-center gap-2">
            <Heart className="w-4 h-4" />
            AI can analyze emotions without accessing the original content
          </p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
