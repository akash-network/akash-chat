import { sendGTMEvent } from "@next/third-parties/google";

export const trackEvent = {
  // File uploads
  fileUpload: (fileType: string) => {
    sendGTMEvent({
      event: 'file_upload',
      type: fileType  // 'pdf', 'txt', etc.
    });
  },

  // Speech to text
  speechToText: (action: 'start' | 'complete') => {
    sendGTMEvent({
      event: 'speech_to_text',
      action: action
    });
  },

  // Model configuration
  configureModel: () => {
    sendGTMEvent({
      event: 'configure_model',
    });
  }
}; 