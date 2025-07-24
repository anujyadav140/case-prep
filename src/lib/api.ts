// lib/api.ts
const API_BASE_URL = "/api"; // Next.js proxy

export interface Description {
  client_name: string;
  client_goal: string;
  client_description: string;
  situation_description: string;
  company_study: string;
  global_hints: string[];      // <— match the backend field
}

export interface Case {
  id: string;
  name: string;
  company: string;
  source: string;
  url: string;
  description: Description;
}

export interface AIResponseMessage {
  response_id?: string;
  ai_message: string;
}

export const getCases = async (): Promise<Case[]> => {
  const res = await fetch(`${API_BASE_URL}/cases`);
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
};

export const getCase = async (caseId: string): Promise<Case> => {
  const res = await fetch(`${API_BASE_URL}/cases/${caseId}`);
  if (!res.ok) throw new Error(`Failed to fetch case ${caseId}`);
  return res.json();
};

export const initiateChatSession = async (
  caseId: string
): Promise<AIResponseMessage> => {
  const res = await fetch(`${API_BASE_URL}/chat/initiate_chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ case_id: caseId }),
  });
  if (!res.ok) throw new Error("Failed to initiate chat session");
  return res.json();
};
// Follow‑up happens over WebSocket in the component.
