export type ToastTone = 'success' | 'error';

export interface ToastMessage {
  id: string;
  text: string;
  tone: ToastTone;
}
