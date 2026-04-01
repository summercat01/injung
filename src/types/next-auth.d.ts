import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      nickname: string | null;
      avatarEmoji: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
