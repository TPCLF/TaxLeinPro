import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AuthForm } from "@/components/auth/auth-form"
import { PortfolioDashboard } from "@/components/dashboard/portfolio-dashboard"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <AuthForm />
  }

  return <PortfolioDashboard />
}

