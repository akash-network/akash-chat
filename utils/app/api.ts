
export const getEndpoint = (plugin: Plugin | null) => {
  if (!plugin) {
    return 'api/chat';
  }

  return 'api/chat';
};
