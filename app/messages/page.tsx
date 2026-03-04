"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/auth/session-provider";
import { fetchThreads, startThread, type ThreadPreview } from "@/lib/messages-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Send, User, MessageSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Contact {
  id: string;
  name: string;
  email: string;
}

export default function MessagesInboxPage() {
  const router = useRouter();
  const { user } = useSession();
  const [threads, setThreads] = useState<ThreadPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTarget, setComposeTarget] = useState<string>("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);

  const isPsychologist = user?.role === "PSYCHOLOGIST";

  useEffect(() => {
    loadThreads();
    loadContacts();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadThreads() {
    setLoading(true);
    const data = await fetchThreads();
    setThreads(data);
    setLoading(false);
  }

  async function loadContacts() {
    if (!user) return;
    if (isPsychologist) {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        const list = (data.caseload ?? []).map(
          (a: { athleteId: string; athlete: { name: string; email: string } }) => ({
            id: a.athleteId,
            name: a.athlete.name,
            email: a.athlete.email,
          })
        );
        setContacts(list);
      }
    } else {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        if (data.psychologist) {
          setContacts([
            {
              id: data.psychologist.id,
              name: data.psychologist.name,
              email: data.psychologist.email,
            },
          ]);
        }
      }
    }
  }

  async function handleCompose(e: React.FormEvent) {
    e.preventDefault();
    if (!composeTarget || !composeBody.trim()) return;
    setSending(true);

    // Check if thread already exists for this contact
    const existingThread = threads.find((t) => t.otherUser.id === composeTarget);
    if (existingThread) {
      router.push(`/messages/${existingThread.id}`);
      return;
    }

    const result = await startThread(composeTarget, composeBody.trim());
    if (result) {
      router.push(`/messages/${result.threadId}`);
    }
    setSending(false);
  }

  // Contacts without an existing thread
  const contactsWithoutThread = contacts.filter(
    (c) => !threads.some((t) => t.otherUser.id === c.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            {isPsychologist
              ? "Communicate with your athletes"
              : "Communicate with your psychologist"}
          </p>
        </div>
        {contactsWithoutThread.length > 0 && (
          <Button onClick={() => setShowCompose((p) => !p)} variant={showCompose ? "outline" : "default"}>
            <Send className="mr-2 h-4 w-4" />
            {showCompose ? "Cancel" : "New Message"}
          </Button>
        )}
      </div>

      {/* Compose new message */}
      {showCompose && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Conversation</CardTitle>
            <CardDescription>Start a conversation with a new contact</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCompose} className="space-y-3 sm:max-w-xl">
              <label className="space-y-1">
                <span className="text-sm font-medium">To</span>
                <select
                  value={composeTarget}
                  onChange={(e) => setComposeTarget(e.target.value)}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a contact...</option>
                  {contactsWithoutThread.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Message</span>
                <textarea
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Type your message..."
                  required
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
                />
              </label>
              <Button type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* AI Coach entry — athletes only, always pinned at top */}
      {!isPsychologist && (
        <button
          onClick={() => router.push("/practice-lab")}
          className="w-full rounded-lg border border-primary/20 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">AI Coach — Practice Lab</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                Ask questions, get reflections, upload plans & schedules
              </p>
            </div>
          </div>
        </button>
      )}

      {/* Thread list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading conversations...</p>
      ) : threads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Mail className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {contacts.length > 0
                ? "Start a conversation by clicking \"New Message\" above."
                : isPsychologist
                  ? "Add athletes in the Athletes tab to start messaging."
                  : "Your psychologist hasn't been assigned yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => router.push(`/messages/${thread.id}`)}
              className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">
                      {thread.otherUser.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground">
                          {thread.unreadCount}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {thread.lastMessage
                          ? timeAgo(thread.lastMessage.created_at)
                          : ""}
                      </span>
                    </div>
                  </div>
                  {thread.lastMessage ? (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {thread.lastMessage.sender_id === user?.id ? "You: " : ""}
                      {thread.lastMessage.body}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-sm text-muted-foreground italic">
                      No messages yet
                    </p>
                  )}
                </div>
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick access to contacts that already have threads */}
      {!loading && contacts.length > 0 && threads.length > 0 && contactsWithoutThread.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Other contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {contactsWithoutThread.map((c) => (
                <Button
                  key={c.id}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setComposeTarget(c.id);
                    setShowCompose(true);
                  }}
                >
                  <Send className="mr-1.5 h-3 w-3" />
                  {c.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
