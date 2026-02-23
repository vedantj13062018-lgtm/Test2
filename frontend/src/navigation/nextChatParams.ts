/**
 * Synchronous store for chat params set right before navigating to Chat.
 * ChatScreen reads this first so it never shows "Invalid chat" due to Redux/route timing.
 */

export interface NextChatParams {
  chatId: string;
  chatName: string;
  isGroup?: boolean;
  receiverId?: string;
}

let nextParams: NextChatParams | null = null;

export function setNextChatParams(params: NextChatParams | null): void {
  nextParams = params;
}

export function getAndClearNextChatParams(): NextChatParams | null {
  const p = nextParams;
  nextParams = null;
  return p;
}
