import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) =>
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          ),
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (!user && (path.startsWith('/admin') || path.startsWith('/portal'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (role === 'lab_admin' && path.startsWith('/portal')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    if (role === 'client' && path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/portal/dashboard', request.url))
    }

    if (path === '/login' || path === '/') {
      const dest = role === 'lab_admin' ? '/admin/dashboard' : '/portal/dashboard'
      return NextResponse.redirect(new URL(dest, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
}
