const listeners = new Set();

export const subscribeToNotificationChanges = listener => {
  if (typeof listener !== 'function') {
    return () => {};
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const emitNotificationChange = () => {
  listeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      // silent
    }
  });
};
