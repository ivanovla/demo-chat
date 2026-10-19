const drafts = new Map<string, string>();

export const getDraft = (conversationId: string) => drafts.get(conversationId) ?? '';

export function setDraft(conversationId: string, text: string) {
  if (text) drafts.set(conversationId, text);
  else drafts.delete(conversationId);
}

export const clearDrafts = () => drafts.clear();
