// lib/api.ts

const API_BASE_URL = "/api"; // use the Next.js proxy

/**
 * The full set of fields returned in a case description.
 */
export interface Description {
  client_name: string;
  client_goal: string;
  client_description: string;
  situation_description: string;
  company_study: string;
  global_hints: string[];
  questions: { text: string }[];    // from the first snippet
}

/**
 * A case object.
 */
export interface Case {
  id: string;
  name: string;
  company: string;
  source: string;
  url: string;
  description: Description;
}

/**
 * The payload returned by /chat/initiate_chat.
 */
export interface AIResponseMessage {
  response_id?: string;   // optional per backend
  ai_message: string;
}

/**
 * If you ever need to send follow‑up over HTTP (though now WS is used),
 * here’s the payload shape.
 */
export interface FollowUpChatPayload {
  case_id: string;
  response_id: string;    // ID from the previous AI message
  user_message: string;
}

/**
 * Fetch the list of cases.
 */
export const getCases = async (): Promise<Case[]> => {
  const res = await fetch(`${API_BASE_URL}/cases`);
  if (!res.ok) {
    throw new Error("Failed to fetch cases");
  }
  return res.json();
};

/**
 * Fetch a single case by ID.
 */
export const getCase = async (caseId: string): Promise<Case> => {
  const res = await fetch(`${API_BASE_URL}/cases/${caseId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch case ${caseId}`);
  }
  return res.json();
};

/**
 * Kick off a new chat session for a given case.
 */
export const initiateChatSession = async (
  caseId: string
): Promise<AIResponseMessage> => {
  const res = await fetch(`${API_BASE_URL}/chat/initiate_chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ case_id: caseId }),
  });
  if (!res.ok) {
    throw new Error("Failed to initiate chat session");
  }
  return res.json();
};

// NOTE: follow‑up chat is now handled via WebSocket in the UI component.
// You can remove any old followUpChat(…) HTTP helper.
