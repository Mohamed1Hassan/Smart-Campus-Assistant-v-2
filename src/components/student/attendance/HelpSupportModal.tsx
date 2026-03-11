"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectItem } from "@/components/ui/select";

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  Tags: string[];
  isExpanded: boolean;
}

interface TroubleshootingGuide {
  id: string;
  title: string;
  description: string;
  steps: string[];
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  estimatedTime: string;
}

export function HelpSupportModal({ isOpen, onClose }: HelpSupportModalProps) {
  const [activeTab, setActiveTab] = useState("faq");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const faqItems: FAQItem[] = [
    {
      id: "faq-1",
      question: "How do I scan a QR code for attendance?",
      answer:
        'To scan a QR code for attendance, follow these steps: 1. Open the attendance app, 2. Tap the "Start QR Scan" button, 3. Point your camera at the QR code, 4. Wait for the scan to complete, 5. Follow the verification steps.',
      category: "QR Code",
      Tags: ["qr", "scan", "attendance"],
      isExpanded: false,
    },
    {
      id: "faq-2",
      question: "Why is my location not being detected?",
      answer:
        "Location detection issues can be caused by: 1. GPS being disabled, 2. Location permissions not granted, 3. Poor GPS signal, 4. Device settings. Make sure to enable location services and grant the app permission to access your location.",
      category: "Location",
      Tags: ["location", "gps", "permissions"],
      isExpanded: false,
    },
    {
      id: "faq-3",
      question: "What is device fingerprinting?",
      answer:
        "Device fingerprinting is a security feature that identifies your device using unique characteristics like hardware specs, browser settings, and other device-specific information. This helps prevent fraud and ensures attendance is taken from the correct device.",
      category: "Security",
      Tags: ["device", "fingerprint", "security"],
      isExpanded: false,
    },
    {
      id: "faq-4",
      question: "How do I enable photo capture for attendance?",
      answer:
        'Photo capture can be enabled in the security settings. Go to Settings > Security > Photo Settings and toggle "Photo Capture" to ON. You may also need to grant camera permissions to the app.',
      category: "Photo",
      Tags: ["photo", "camera", "settings"],
      isExpanded: false,
    },
    {
      id: "faq-5",
      question: "What should I do if I get a fraud warning?",
      answer:
        "If you receive a fraud warning, it means the system detected suspicious activity. Contact your instructor or the IT support team immediately. Do not attempt to bypass security measures as this may result in disciplinary action.",
      category: "Security",
      Tags: ["fraud", "warning", "security"],
      isExpanded: false,
    },
  ];

  const troubleshootingGuides: TroubleshootingGuide[] = [
    {
      id: "guide-1",
      title: "QR Code Not Scanning",
      description: "Troubleshoot issues with QR code scanning",
      steps: [
        "Ensure your camera is working properly",
        "Check that the QR code is clearly visible",
        "Make sure you have good lighting",
        "Try moving closer or farther from the QR code",
        "Restart the app if the issue persists",
      ],
      category: "QR Code",
      difficulty: "EASY",
      estimatedTime: "5 minutes",
    },
    {
      id: "guide-2",
      title: "Location Permission Denied",
      description: "Fix location permission issues",
      steps: [
        "Go to your device settings",
        "Find the app in the list",
        "Enable location permissions",
        "Restart the app",
        "Test location detection",
      ],
      category: "Location",
      difficulty: "EASY",
      estimatedTime: "3 minutes",
    },
    {
      id: "guide-camera",
      title: "Camera Access Blocked",
      description: "Unblock camera access in browser",
      steps: [
        "Look for the lock icon 🔒 in the address bar",
        'Click it and find "Camera"',
        'Change the setting to "Allow"',
        "Refresh the page",
        "Try scanning again",
      ],
      category: "QR Code",
      difficulty: "EASY",
      estimatedTime: "2 minutes",
    },
    {
      id: "guide-3",
      title: "Device Verification Failed",
      description: "Resolve device verification issues",
      steps: [
        "Check your internet connection",
        "Clear app cache and data",
        "Restart your device",
        "Re-register your device",
        "Contact support if the issue persists",
      ],
      category: "Device",
      difficulty: "MEDIUM",
      estimatedTime: "10 minutes",
    },
  ];

  const filteredFAQ = faqItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredGuides = troubleshootingGuides.filter((guide) => {
    const matchesSearch =
      searchQuery === "" ||
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Helper for difficulty badge styling
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-white";
      case "HARD":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Help & Support</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-4 p-6 border-b">
          <Button
            variant={activeTab === "faq" ? "default" : "ghost"}
            onClick={() => setActiveTab("faq")}
          >
            FAQ
          </Button>
          <Button
            variant={activeTab === "troubleshooting" ? "default" : "ghost"}
            onClick={() => setActiveTab("troubleshooting")}
          >
            Troubleshooting
          </Button>
          <Button
            variant={activeTab === "contact" ? "default" : "ghost"}
            onClick={() => setActiveTab("contact")}
          >
            Contact Support
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search help articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-md w-full"
                />
              </div>
            </div>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="QR Code">QR Code</SelectItem>
              <SelectItem value="Location">Location</SelectItem>
              <SelectItem value="Device">Device</SelectItem>
              <SelectItem value="Photo">Photo</SelectItem>
              <SelectItem value="Security">Security</SelectItem>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "faq" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {filteredFAQ.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleExpanded(item.id)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{item.question}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.category}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{item.category}</Badge>
                          {expandedItems.has(item.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      {expandedItems.has(item.id) && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            {item.answer}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            {item.Tags.map((Tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {Tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "troubleshooting" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Troubleshooting Guides</h3>
              <div className="space-y-3">
                {filteredGuides.map((guide) => (
                  <Card key={guide.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="font-medium">{guide.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {guide.description}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={getDifficultyBadge(guide.difficulty)}
                          >
                            {guide.difficulty}
                          </Badge>
                          <Badge variant="outline">{guide.estimatedTime}</Badge>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Steps:</div>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          {guide.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Contact Support</h3>

              {/* Contact Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Phone className="h-5 w-5" />
                      <span>Phone Support</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Emergency Support
                      </div>
                      <div className="text-sm text-muted-foreground">
                        +1 (555) 123-4567
                      </div>
                      <div className="text-sm text-muted-foreground">
                        24/7 Available
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="h-5 w-5" />
                      <span>Email Support</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">General Support</div>
                      <div className="text-sm text-muted-foreground">
                        support@university.edu
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Response within 24 hours
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageCircle className="h-5 w-5" />
                      <span>Live Chat</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Online Chat</div>
                      <div className="text-sm text-muted-foreground">
                        Available 9 AM - 5 PM
                      </div>
                      <Button size="sm" className="w-full">
                        Start Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ExternalLink className="h-5 w-5" />
                      <span>IT Helpdesk</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">IT Support</div>
                      <div className="text-sm text-muted-foreground">
                        helpdesk@university.edu
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Technical issues only
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* FileText Issue Form */}
              <Card>
                <CardHeader>
                  <CardTitle>FileText an Issue</CardTitle>
                  <CardDescription>
                    Describe the issue you&apos;re experiencing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Issue Type</label>
                      <Select className="w-full">
                        <SelectItem value="" disabled>
                          Select issue type
                        </SelectItem>
                        <SelectItem value="qr">QR Code Issues</SelectItem>
                        <SelectItem value="location">
                          Location Issues
                        </SelectItem>
                        <SelectItem value="device">Device Issues</SelectItem>
                        <SelectItem value="photo">Photo Issues</SelectItem>
                        <SelectItem value="security">
                          Security Issues
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        className="w-full p-3 border rounded-md"
                        rows={4}
                        placeholder="Describe the issue in detail..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Select className="w-full">
                        <SelectItem value="" disabled>
                          Select priority
                        </SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </Select>
                    </div>
                    <Button className="w-full">Submit FileText</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="text-sm text-muted-foreground">
            Need more help? Contact our support team.
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
