import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token) {
  const response = await api({
    url: "auth/refresh-token",
    method: "GET",
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });

  if (response) {
    const refreshedToken = response.data;

    return {
      ...token,
      accessToken: refreshedToken.access_token,
      accessTokenExpires: Date.now() + refreshedToken.expires_in * 1000,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken,
    };
  }

  return {
    ...token,
    error: "RefreshAccessTokenError",
  };
}

const getOptions = (req) => {
  return {
    providers: [
      Providers.Credentials({
        id: "credentials",
        name: "Credentials",
        async authorize(credentials, req) {
          const { email, password } = credentials;
          const response = await api({
            url: "/auth/login",
            method: "POST",
            headers: { "X-Tenant": getTenant(req) },
            data: {
              email,
              password,
              remember: 1,
            },
          });

          if (response) {
            return response.data;
          }

          return null;
        },
      }),
    ],
    session: {
      /*
       * Use JSON Web Tokens for session instead of database sessions.
       * This option can be used with or without a database for users/accounts.
       * Note: `jwt` is automatically set to `true` if no database is specified.
       */
      jwt: true,
    },
    jwt: {
      /*
       * A secret to use for key generation - you should set this explicitly
       * Defaults to NextAuth.js secret if not explicitly specified.
       * This is used to generate the actual signingKey and produces a warning
       * message if not defined explicitly.
       */
      secret: process.env.JWT_SECRET,
    },
    callbacks: {
      async jwt(token, data, account) {
        /**
         * Initial signin.
         */
        if (account && data) {
          return {
            accessToken: data.access_token,
            accessTokenExpires: Date.now() + data.expires_in * 1000,
            user: data.user,
          };
        }

        /**
         * Return previous token if the access token has not expired yet.
         */
        if (Date.now() < token.accessTokenExpires) {
          return token;
        }

        return refreshAccessToken(token);
      },
      async session(session, token) {
        /**
         * Sets properly the session data from our custom login
         * pages and authorization.
         */
        session.accessToken = token.accessToken;
        session.user = token.user;
        return session;
      },
    },
    debug: true,
    pages: {
      signIn: "/login",
      error: "/login",
    },
  };
};

export default async (req, res) => {
  const host = req.headers["host"];
  const protocol = process.env.NEXTAUTH_URL.startsWith("https")
    ? "https"
    : "http";

  if (!host) {
    throw new Error(`The request has no host header.`);
  }

  process.env.NEXTAUTH_URL = `${protocol}://${host}`;
  return await NextAuth(req, res, getOptions(req));
};
