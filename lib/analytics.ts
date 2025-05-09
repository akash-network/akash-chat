import { sendGAEvent } from "@next/third-parties/google";

export const trackEvent = {
  // File uploads
  fileUpload: (fileType: string) => {
    sendGAEvent({
      event: 'file_upload',
      type: fileType  // 'pdf', 'txt', etc.
    });
  },

  // Speech to text
  speechToText: (action: 'start' | 'complete') => {
    sendGAEvent({
      event: 'speech_to_text',
      action: action
    });
  },

  // Model configuration
  configureModel: () => {
    sendGAEvent({
      event: 'configure_model',
    });
  }
}; 