import NextAuth from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import { User } from "@/models/User"
import { Database } from "@/lib/database"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Check database connection
          const isDbHealthy = await Database.healthCheck()
          if (!isDbHealthy) {
            console.error("❌ Database connection failed during authentication")
            return null
          }

          // Validate credentials
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Authenticate user
          const user = await User.validatePassword(
            credentials.email, 
            credentials.password
          )
          
          if (!user) {
            console.log(`❌ Authentication failed for: ${credentials.email} (invalid credentials)`)
            throw new Error('Invalid email or password');
          }

          // Check if email is verified
          if (!user.emailVerified) {
            console.log(`❌ Authentication failed for: ${credentials.email} (email not verified)`)
            throw new Error('Email not verified. Please check your inbox.');
          }
          
          console.log(`✅ User authenticated: ${user.email} (${user.role})`)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.avatar || null
          }
        } catch (error) {
          console.error('❌ Authentication error:', error.message);
          // Re-throw the error with a specific message for the client
          throw new Error(error.message || 'An unexpected authentication error occurred.');
        }
      }
    })
  ],
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60,
  },
  
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user.role = token.role
      session.user.id = token.id
      return session
    }
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },

  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development'
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
