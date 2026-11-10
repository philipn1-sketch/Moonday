// The web preview has no Face ID: the lock always opens.
export const canLock = async (): Promise<boolean> => true;
export const unlock = async (): Promise<boolean> => true;
