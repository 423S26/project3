/**
 * Client-side API functions for the messaging system.
 */

export interface ThreadPreview {
  id: string;
  otherUser: { id: string; name: string; email: string };
  lastMessage: {
    id: string;
    body: string;
    sender_id: string;
    created_at: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ThreadDetail {
  thread: {
    id: string;
    psychologist_id: string;
    athlete_id: string;
  };
  otherUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  messages: Message[];
}

export async function fetchThreads(): Promise<ThreadPreview[]> {
  const res = await fetch("/api/messages");
  if (!res.ok) return [];
  return res.json();
}

export async function fetchThread(threadId: string): Promise<ThreadDetail | null> {
  const res = await fetch(`/api/messages/${threadId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function sendMessage(
  threadId: string,
  body: string
): Promise<Message | null> {
  const res = await fetch(`/api/messages/${threadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function startThread(
  otherUserId: string,
  body: string
): Promise<{ threadId: string; message: Message } | null> {
  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otherUserId, body }),
  });
  if (!res.ok) return null;
  return res.json();
}
