import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import { query } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      const provider = account.provider;
      const providerId = account.providerAccountId;

      // Upsert user in our own users table
      await query(
        `INSERT INTO users (provider, provider_id)
         VALUES ($1, $2)
         ON CONFLICT (provider, provider_id) DO NOTHING`,
        [provider, providerId]
      );

      return true;
    },

    async jwt({ token, account }) {
      if (account) {
        // First login: fetch our user record
        const provider = account.provider;
        const providerId = account.providerAccountId;

        const result = await query<{
          id: string;
          nickname: string | null;
          avatar_emoji: string;
        }>(
          'SELECT id, nickname, avatar_emoji FROM users WHERE provider = $1 AND provider_id = $2',
          [provider, providerId]
        );

        if (result.rows[0]) {
          token.userId = result.rows[0].id;
          token.nickname = result.rows[0].nickname;
          token.avatarEmoji = result.rows[0].avatar_emoji;
        }
      } else if (token.userId && !token.nickname) {
        // nickname이 없으면 DB에서 다시 읽기 (온보딩 완료 후 반영)
        const result = await query<{
          nickname: string | null;
          avatar_emoji: string;
        }>(
          'SELECT nickname, avatar_emoji FROM users WHERE id = $1',
          [token.userId]
        );

        if (result.rows[0]) {
          token.nickname = result.rows[0].nickname;
          token.avatarEmoji = result.rows[0].avatar_emoji;
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.nickname = token.nickname as string | null;
      session.user.avatarEmoji = token.avatarEmoji as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
