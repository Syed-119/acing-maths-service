import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Define auth pages (login, signup)
  const authPages = ['/login', '/signup']
  const isAuthPage = authPages.includes(request.nextUrl.pathname)

  // If user is logged in and trying to access login/signup, redirect to appropriate dashboard
  if (user && isAuthPage) {
    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    url.pathname = userData?.role === 'admin' ? '/dashboard' : '/student/dashboard'
    return NextResponse.redirect(url)
  }

  // If user is not logged in and trying to access protected pages
  if (!user && !isAuthPage && !request.nextUrl.pathname.startsWith('/email-verified') && !request.nextUrl.pathname.startsWith('/auth')) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in, check role-based access
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    const isStudentRoute = request.nextUrl.pathname.startsWith('/student') || 
                          request.nextUrl.pathname.startsWith('/bookings') ||
                          request.nextUrl.pathname.startsWith('/progress')
    
    // Block students from admin routes
    if (userData?.role === 'student' && isAdminRoute) {
      url.pathname = '/student/dashboard'
      return NextResponse.redirect(url)
    }

    // Block admins from student routes
    if (userData?.role === 'admin' && isStudentRoute) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Redirect /dashboard based on role
    if (request.nextUrl.pathname === '/dashboard' && userData?.role === 'student') {
      url.pathname = '/student/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
