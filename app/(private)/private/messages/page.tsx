"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCheck,
  Clock,
  Filter,
  Inbox,
  Mail,
  MailOpen,
  MessageSquare,
  Reply,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import {
  getContactMessages,
  markMessageRead,
  deleteContactMessage,
  clearAllContactMessages,
} from "@/actions/contact";

interface MessageItem {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
}

export default function PrivateMessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "unread">("all");
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const data = await getContactMessages();
      if (Array.isArray(data)) {
        setMessages(data as MessageItem[]);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
      toast.error("Error loading contact messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleMarkRead = async (msg: MessageItem) => {
    try {
      const res = await markMessageRead(msg.id);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
        if (selectedMessage?.id === msg.id) {
          setSelectedMessage((prev) => (prev ? { ...prev, isRead: true } : null));
        }
        toast.success("Message marked as read.");
      }
    } catch (err) {
      toast.error("Failed to update message status.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteContactMessage(id);
      if (res.success) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
        }
        toast.success("Message deleted.");
      }
    } catch (err) {
      toast.error("Failed to delete message.");
    }
  };

  const handleClearAllMessages = async () => {
    if (confirm("Are you sure you want to delete ALL messages in your inbox? This action cannot be undone.")) {
      try {
        const res = await clearAllContactMessages();
        if (res.success) {
          setMessages([]);
          setSelectedMessage(null);
          toast.success("All inbox messages cleared!");
        }
      } catch (err) {
        toast.error("Failed to clear messages.");
      }
    }
  };

  const filteredMessages = messages.filter((msg) => {
    const matchesFilter = filterMode === "all" || !msg.isRead;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      msg.fullName.toLowerCase().includes(query) ||
      msg.email.toLowerCase().includes(query) ||
      msg.subject.toLowerCase().includes(query) ||
      msg.message.toLowerCase().includes(query);

    return matchesFilter && matchesQuery;
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <AdminLayout title="Messages & Inquiries">
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Mail className="h-6 w-6 text-indigo-500" /> Contact Form Messages
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Manage visitor inquiries, client proposals, and portfolio contact form submissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {unreadCount} Unread Message{unreadCount === 1 ? "" : "s"}
            </span>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllMessages}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all min-h-[38px]"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All Messages</span>
              </button>
            )}
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sender, email, subject..."
              className="w-full rounded-xl border border-border/80 bg-background pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterMode === "all"
                  ? "bg-foreground text-background shadow-xs"
                  : "border border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              All ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("unread")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterMode === "unread"
                  ? "bg-foreground text-background shadow-xs"
                  : "border border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* MAIN MESSAGES GRID & DETAIL VIEW */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">
              Loading inbox messages...
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card p-12 text-center text-muted-foreground space-y-3">
            <Inbox className="mx-auto h-12 w-12 text-indigo-500 opacity-60" />
            <h3 className="text-base font-bold text-foreground">No Messages Found</h3>
            <p className="text-xs max-w-sm mx-auto">
              {searchQuery
                ? "No inquiries match your search filter."
                : "You currently have no message submissions in your inbox."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* MESSAGES LIST COLUMN */}
            <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredMessages.map((msg) => {
                const dateStr = new Date(msg.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const isSelected = selectedMessage?.id === msg.id;

                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (!msg.isRead) handleMarkRead(msg);
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500/10 shadow-sm"
                        : msg.isRead
                        ? "border-border/80 bg-card text-card-foreground hover:border-border"
                        : "border-indigo-500/40 bg-indigo-500/10 font-semibold text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-foreground truncate">
                        {msg.fullName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!msg.isRead && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        )}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold text-foreground truncate">
                      {msg.subject}
                    </h4>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* MESSAGE DETAIL VIEW COLUMN */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <div className="rounded-3xl border border-border/80 bg-card text-card-foreground p-6 sm:p-8 shadow-xl space-y-6">
                  {/* DETAIL HEADER */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
                    <div>
                      <span className="text-[11px] font-mono text-indigo-500 uppercase tracking-wider font-bold">
                        Message Details
                      </span>
                      <h3 className="text-lg font-bold text-foreground">
                        {selectedMessage.subject}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                          `Re: ${selectedMessage.subject}`
                        )}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
                      >
                        <Reply className="h-3.5 w-3.5 text-indigo-500" />
                        Reply
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDelete(selectedMessage.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* SENDER INFO BOX */}
                  <div className="rounded-2xl border border-border/60 bg-background/80 p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-500" />
                        <span className="font-bold text-foreground">{selectedMessage.fullName}</span>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground font-mono">
                      <Mail className="h-3.5 w-3.5 text-indigo-500" />
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="hover:underline text-indigo-500"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>

                  {/* MESSAGE BODY */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Message Body
                    </label>
                    <div className="rounded-2xl border border-border/60 bg-background p-5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-border/60 bg-card p-12 text-center text-muted-foreground space-y-3">
                  <MailOpen className="mx-auto h-12 w-12 text-indigo-500 opacity-60" />
                  <h3 className="text-base font-bold text-foreground">Select a Message</h3>
                  <p className="text-xs max-w-sm mx-auto">
                    Click any message from the left inbox column to inspect full message content and reply options.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
