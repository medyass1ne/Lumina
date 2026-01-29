import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
    ],
    session: {
        maxAge: 7 * 24 * 60 * 60,
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account.provider === 'google') {
                await dbConnect();
                try {
                    const updateData = {
                        name: user.name,
                        image: user.image,
                        email: user.email,
                    };

                    if (account.refresh_token) {
                        updateData.refreshToken = account.refresh_token;
                    }

                    const dbUser = await User.findOneAndUpdate(
                        { email: user.email },
                        updateData,
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );

                    user.dbId = dbUser._id.toString();
                    return true;
                } catch (e) {
                    console.error("Error saving user to DB:", e);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, account, user }) {
            if (account) {
                token.accessToken = account.access_token;
                token.accessTokenExpires = account.expires_at * 1000;

                if (account.refresh_token) {
                    token.refreshToken = account.refresh_token;
                }
            }

            if (user?.dbId) {
                token.userId = user.dbId;
            }

            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.userId = token.userId;
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
