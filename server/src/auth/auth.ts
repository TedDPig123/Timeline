import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../db";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? "https://timeline-production-600c.up.railway.app/api/auth/google/callback"
          : "http://localhost:3001/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // create user based on Google profile
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        //if user already exists, no need to make a new user
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // this is to reate new user
          user = await prisma.user.create({
            data: {
              email,
              username: profile.displayName || email.split("@")[0],
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    },
  ),
);

export default passport;
