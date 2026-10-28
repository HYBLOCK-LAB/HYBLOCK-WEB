'use client';

import { create } from 'zustand';

export type AuthSession = {
  address: string;
  memberId: number;
  expiresAt: number;
};

type WalletSessionState = {
  session: AuthSession | null;
  sessionChecked: boolean;
  setAuthSession: (session: AuthSession | null) => void;
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
  session: null,
  sessionChecked: false,
  setAuthSession: (session) => set({ session, sessionChecked: true }),
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
