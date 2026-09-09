'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
      <p>
        Opening Align… <Link href="/dashboard" className="text-indigo-600 underline">continue</Link>
      </p>
    </div>
  )
}
