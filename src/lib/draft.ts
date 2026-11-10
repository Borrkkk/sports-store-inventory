type Draft = {
  active: boolean;
  upc: string | null;
  tempImageUri: string | null;
};

let draft: Draft = {
  active: false,
  upc: null,
  tempImageUri: null,
};

export function beginDraft(upc: string | null): void {
  draft = { active: true, upc, tempImageUri: null };
}

export function setDraftPhoto(uri: string): void {
  draft = { ...draft, tempImageUri: uri };
}

export function getDraft(): Draft {
  return draft;
}

export function clearDraft(): void {
  draft = { active: false, upc: null, tempImageUri: null };
}
