import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      nickname: string | null;
      avatarEmoji: string;
      isAdmin: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
