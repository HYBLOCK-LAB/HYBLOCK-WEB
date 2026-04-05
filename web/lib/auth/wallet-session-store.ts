'use client';

import { create } from 'zustand';

type WalletSessionState = {
  address: string | null;
  chainName: string | null;
  isConnected: boolean;
  setWalletSession: (payload: {
    address: string | null;
    chainName: string | null;
    isConnected: boolean;
  }) => void;
  resetWalletSession: () => void;
};

export const useWalletSessionStore = create<WalletSessionState>((set) => ({
  address: null,
  chainName: null,
  isConnected: false,
  setWalletSession: ({ address, chainName, isConnected }) =>
    set({
      address,
      chainName,
      isConnected,
    }),
  resetWalletSession: () =>
    set({
      address: null,
      chainName: null,
      isConnected: false,
    }),
}));
